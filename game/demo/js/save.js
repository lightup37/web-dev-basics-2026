/* 存档层（to-do #2/#3）。依赖 account.js 的 currentUser()。
 *
 * 模型：每个用户只有一份"活动存档" = 自动存档 a.save（key: a.save:<用户>），
 * menu 只展示它；它同时保存两类信息：
 *   { unlocked, stars }   主界面(memu.html)的进度信息：解锁关卡 + 各关最高星级
 *   { snapshot }          当前进行中那一关(gameN.html)的中途状态快照，可为 null
 * 手动备份 = 存档 1/2/3（key: save1:<用户> / save2:<用户> / save3:<用户>），
 * 结构与 a.save 相同，存的是"备份那一刻的活动存档"。
 *
 * 操作语义：
 *   - 通关：自动写入 a.save（记星级、解锁下一关、清掉本关快照）。
 *   - 关卡内 Save：可把本关快照写入 a.save，或把当前 a.save 备份到某手动档。
 *   - Load：读取 存档X 就是用 X 覆盖 a.save（再按其快照继续），即"载入"。
 * snapshot = { level, n, m, remain_turns, units:[...] }，与 main.js 的
 * captureSnapshot() / loadSnapshot() 一一对应。
 */

var AUTO_ID = 'a';
var MANUAL_IDS = ['1', '2', '3'];

function fileName(id) { return String(id) === AUTO_ID ? '自动存档 (a.save)' : '存档 ' + id; }
function isFileId(id) { return String(id) === AUTO_ID || MANUAL_IDS.indexOf(String(id)) !== -1; }

/* URL 带 resume=1 表示：从 a.save 的快照继续当前关 */
function wantResume() {
	return /[?&]resume=1/.test(window.location.search);
}

/* ---------- 底层 ---------- */
function readKey(key) {
	try { return JSON.parse(localStorage.getItem(key) || 'null'); }
	catch (e) { return null; }
}
function writeKey(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

function autoKey(user) { return 'a.save:' + user; }
function manualKey(user, id) { return 'save' + id + ':' + user; }

/* 旧格式/脏数据归一成统一存档文件 */
function normalizeToFile(raw) {
	if (!raw) return null;
	if (raw.unlocked !== undefined || raw.stars !== undefined || raw.snapshot !== undefined) {
		return {
			unlocked: Number(raw.unlocked) || 1,
			stars: raw.stars || {},
			snapshot: raw.snapshot || null,
			hiddenUnlocked: !!raw.hiddenUnlocked
		};
	}
	// 早期版本：直接存快照 -> 包装成文件
	return { unlocked: Math.max(Number(raw.level) || 1, 1), stars: {}, snapshot: raw, hiddenUnlocked: false };
}

function getAuto(user) {
	if (!user) return null;
	return normalizeToFile(readKey(autoKey(user)));
}
function putAuto(user, file) {
	if (user && file) writeKey(autoKey(user), file);
}
function ensureAuto(user) {
	var f = getAuto(user);
	if (!f) { f = { unlocked: 1, stars: {}, snapshot: null, hiddenUnlocked: false }; putAuto(user, f); }
	return f;
}

function getManual(user, id) {
	if (!user || String(id) === AUTO_ID || !isFileId(id)) return null;
	return normalizeToFile(readKey(manualKey(user, id)));
}
function putManual(user, id, file) {
	if (!user || String(id) === AUTO_ID || !file) return false;
	writeKey(manualKey(user, id), file);
	return true;
}
function clearManual(user, id) {
	if (!user || String(id) === AUTO_ID) return false;
	localStorage.removeItem(manualKey(user, id));
	return true;
}

/* ---------- 业务操作 ---------- */

/* 通关自动存档：写入活动存档 a.save。未登录忽略。
 * quickL1：第 1 关是否在 12 回合内通关（开启隐藏路线，to-do #14） */
function autosaveOnWin(levelId, star, quickL1) {
	if (typeof currentUser !== 'function') return false;
	var user = currentUser();
	if (!user) return false;
	var f = ensureAuto(user);
	var key = String(levelId);
	f.stars[key] = Math.max(f.stars[key] || 0, star);
	f.unlocked = Math.max(f.unlocked || 1, Number(levelId) + 1);
	f.snapshot = null;
	var openedHidden = false;
	if (Number(levelId) === 1 && quickL1 && !f.hiddenUnlocked) {
		f.hiddenUnlocked = true;
		openedHidden = true;
	}
	putAuto(user, f);
	if (openedHidden) {
		alert('历史似乎发生了一点变化——秘密路线已开启，第 6 关之后将出现隐藏的第 7 关。已自动存档（a.save）');
	} else {
		alert('第 ' + levelId + ' 关通关！已自动存档（a.save）');
	}
	return true;
}

/* 关卡内 Save -> a.save：把本关快照写进活动存档（menu 将显示该关"继续"） */
function saveSnapshotToAuto(user, snap) {
	if (!user || !snap) return false;
	var f = ensureAuto(user);
	f.unlocked = Math.max(f.unlocked || 1, Number(snap.level) || 1);
	f.snapshot = snap;
	putAuto(user, f);
	return true;
}

/* 关卡内 Save -> 手动档：把当前 a.save 的进度 + 本关快照一起备份到 存档X */
function saveToManual(user, id, snap) {
	if (!user || String(id) === AUTO_ID || !isFileId(id) || !snap) return false;
	var f = getAuto(user) || { unlocked: 1, stars: {}, snapshot: null };
	f.unlocked = Math.max(f.unlocked || 1, Number(snap.level) || 1);
	f.snapshot = snap;
	return putManual(user, id, { unlocked: f.unlocked, stars: f.stars, snapshot: f.snapshot, hiddenUnlocked: !!f.hiddenUnlocked });
}

/* Load 语义：用 存档X 覆盖 a.save；返回覆盖后的文件（没有该档返回 null）。
 * 覆盖时合并 hiddenUnlocked，避免读旧备份把已开的隐藏路线弄丢。 */
function loadManualToAuto(user, id) {
	if (!user || String(id) === AUTO_ID) return null;
	var f = getManual(user, id);
	if (!f) return null;
	var cur = getAuto(user);
	f.hiddenUnlocked = !!f.hiddenUnlocked || !!(cur && cur.hiddenUnlocked);
	putAuto(user, f);
	return f;
}

/* a.save 当前进行中的快照（无则 null） */
function autoSnapshot(user) {
	var f = getAuto(user);
	return f ? f.snapshot : null;
}

/* ---------- menu 用 ---------- */
function autoProgress(user) {
	return getAuto(user) || { unlocked: 1, stars: {}, snapshot: null };
}
function manualSummaries(user) {
	return MANUAL_IDS.map(function (id) { return { id: id, file: user ? getManual(user, id) : null }; });
}

/* 重新开始游戏：清空活动存档 a.save（进度/星级/进行中快照）。手动备份档保留，可由玩家另行删除。 */
function resetAutoSave(user) {
	if (!user) return false;
	localStorage.removeItem('a.save:' + user);
	return true;
}

/* 隐藏路线是否已开启（game1 ≤12 回合通关后写入 a.save 的 hiddenUnlocked，to-do #14） */
function hiddenRouteOpen() {
	if (typeof currentUser !== 'function') return false;
	var user = currentUser();
	if (!user) return false;
	var f = getAuto(user);
	return !!(f && f.hiddenUnlocked);
}

/* 该用户是否已通关某关（有星级记录） */
function hasBeatenLevel(user, levelId) {
	if (!user) return false;
	var f = getAuto(user);
	return !!(f && f.stars && f.stars[String(levelId)]);
}

/* ========== to-do #15：成就（按用户隔离，key: achv:<用户名>） ========== */
var ACHIEVEMENTS = [
	{ code: 'victory_end', name: '胜利', desc: '进入正常结局（end-game.html）' },
	{ code: 'tragic_fail', name: '惨痛失败', desc: '进入失败结局（fail.html）' },
	{ code: 'empire', name: '法兰西帝国', desc: '进入隐藏结局（hidden-end.html）' },
	{ code: 'rise_again', name: '失败乃成功之母', desc: '同一关连续失败 4 次后，以 3 星通关' }
];

function achKey(user) { return 'achv:' + user; }
function readAch(user) {
	if (!user) return {};
	try { return JSON.parse(localStorage.getItem(achKey(user)) || '{}'); }
	catch (e) { return {}; }
}
function writeAch(user, st) { if (user) localStorage.setItem(achKey(user), JSON.stringify(st)); }

function achievementMeta(code) {
	return ACHIEVEMENTS.find(a => a.code === code) || null;
}

/* 成就总表（含是否已解锁），给 menu 展示 */
function achievementState(user) {
	var st = user ? readAch(user) : {};
	return ACHIEVEMENTS.map(a => ({ code: a.code, name: a.name, desc: a.desc, unlocked: !!st[a.code] }));
}

/* 解锁一个成就：首次解锁才弹窗提示；未登录忽略 */
function unlockAchievement(code) {
	if (typeof currentUser !== 'function') return false;
	var user = currentUser();
	if (!user) return false;
	var st = readAch(user);
	if (st[code]) return false;
	st[code] = true;
	writeAch(user, st);
	var a = achievementMeta(code);
	if (a) alert('成就解锁：' + a.name + ' —— ' + a.desc);
	return true;
}

/* "失败乃成功之母"：同一关连续失败计数（key: achv-fail:<用户名>） */
function streakKey(user) { return 'achv-fail:' + user; }
function readStreak(user) {
	if (!user) return { level: 0, count: 0 };
	try { return JSON.parse(localStorage.getItem(streakKey(user)) || 'null') || { level: 0, count: 0 }; }
	catch (e) { return { level: 0, count: 0 }; }
}
function writeStreak(user, s) { if (user) localStorage.setItem(streakKey(user), JSON.stringify(s)); }

/* 失败时调用：同关连败 +1，换关则重计 */
function recordLevelFail(levelId) {
	if (typeof currentUser !== 'function') return 0;
	var user = currentUser();
	if (!user) return 0;
	var s = readStreak(user);
	if (Number(s.level) === Number(levelId)) s.count = (s.count || 0) + 1;
	else { s.level = Number(levelId); s.count = 1; }
	writeStreak(user, s);
	return s.count;
}

/* 胜利时调用：若此前同关连败 ≥4 且本次 3 星通关 -> 解锁；随后清零该关连败计数 */
function tryThreeStarAchievement(levelId, star) {
	if (typeof currentUser !== 'function') return;
	var user = currentUser();
	if (!user) return;
	var s = readStreak(user);
	var hadFour = Number(s.level) === Number(levelId) && s.count >= 4;
	if (Number(star) === 3 && hadFour) unlockAchievement('rise_again');
	s.level = Number(levelId);
	s.count = 0;
	writeStreak(user, s);
}
