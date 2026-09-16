/* 主要代码，负责加载页面，保持游戏运行，判断通关 */

let armys = new Array(0);
let n = 0, m = 0, piece_cnt = 0, remain_turns = 0;
let eps = 0.000001;
let footerMode = 'goal';
let resumedLevel = null;
const UNIT_MIN_SEPARATION = 0.56;

/* ⚠️ B04：棋盘的合法逻辑坐标范围。
 * 第 i 格中心 = 逻辑 i，格子覆盖 ±0.5 格，所以 10×10 棋盘的合法中心范围是 [-0.5, 9.5]。
 * 单位中心可以贴到边缘格外沿（鼠标点最外圈就是落在这个范围），但不得再往外——
 * 以前 collisionSafeMove() 的 55°/90° 绕行候选点只查"是否与别人重叠"、不查边界，
 * 在角落挤兵时会把普通单位推到棋盘外。
 * 注意：第 4 关的撤退出口 (9.5,-0.5) 恰好就在这个矩形角上，属于合法范围之内；
 * 若某个关卡的出口在范围之外，isRetreatMove() 会放行（见那里）。 */
const BOARD_EDGE_MIN = -0.5;
function boardEdgeMax(size) { return Math.max(0, (Number(size) || 1) - 0.5); }
function clampToBoardBounds(x, y) {
	const maxX = boardEdgeMax(typeof n !== 'undefined' ? n : 10);
	const maxY = boardEdgeMax(typeof m !== 'undefined' ? m : 10);
	return {
		x: Math.min(Math.max(x, BOARD_EDGE_MIN), maxX),
		y: Math.min(Math.max(y, BOARD_EDGE_MIN), maxY)
	};
}

/* 追猎关的"撤退出口"允许越出棋盘边界；普通部队一律夹取。
 * 以前对所有单位一律不夹取，导致普通蓝军也能被避让推到盘外。 */
function isRetreatMove(unit, tx, ty) {
	if (!unit || unit.color !== 'red') return false;
	const obj = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.objective) || null;
	if (!obj || obj.type !== 'retreat') return false;
	const ex = (obj.exitX !== undefined) ? Number(obj.exitX) : 9.5;
	const ey = (obj.exitY !== undefined) ? Number(obj.exitY) : -0.5;
	/* 目标点本身就在出口附近 => 这是朝出口撤离，放行（出口可落在棋盘外）。 */
	return Math.hypot(Number(tx) - ex, Number(ty) - ey) <= 1.2;
}

const MAX_UNDO_USES = 3;
const MAX_BATTLE_MOMENTUM = 3;
let undoStack = [];
let undoUses = 0;
let battleMomentum = 0;

let boardContainer = document.getElementById('board'); // 维护 board 的容器, 以备后续使用
let buttonContainer = document.getElementById('button'); // 维护 button 的容器, 以备后续使用

/* 2026-09-16："下一步"在布局上排到六个辅助按钮之后（宽屏右坞置底、窄屏流式置底）。
 * game8 没有 #game-actions，保持原顺序。 */
(function reorderTurnButton () {
	const actionsEl = document.getElementById('game-actions');
	const turnBtn = document.getElementById('button');
	if (actionsEl && turnBtn && (turnBtn.compareDocumentPosition(actionsEl) & Node.DOCUMENT_POSITION_FOLLOWING)) {
		actionsEl.parentNode.insertBefore(turnBtn, actionsEl.nextSibling);
	}
})();

function gameText(key, vars, fallback) {
	return (typeof uiT === 'function') ? uiT(key, vars, fallback) : (fallback || key);
}

function gameContent(value) {
	return (typeof uiLocalize === 'function') ? uiLocalize(value) : (value || '');
}

/* 同一关连续失败五次后，把普通败因升级为可持续查看的参谋部提示卡。 */
let lastFailurePresentation = null;

function renderFailureAdvice() {
	const tip = document.getElementById('loseTips');
	if (!tip || !lastFailurePresentation) return;
	const state = lastFailurePresentation;
	const meta = (typeof getLevelById === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined')
		? getLevelById(CURRENT_LEVEL_ID)
		: null;
	const hints = meta && Array.isArray(meta.retryHints) ? meta.retryHints : [];
	delete tip.dataset.sourceText;
	if (state.count >= 5 && hints.length) {
		const heading = gameText('game.strategyUnlocked', { count: state.count }, '参谋部复盘 · 连续失败 ' + state.count + ' 次');
		const lead = gameText('game.strategyLead', null, '建议下一次按这个顺序调整：');
		tip.textContent = heading + '\n' + lead + '\n' + hints.map(function (hint, index) {
			return (index + 1) + '. ' + gameContent(hint);
		}).join('\n');
		tip.classList.add('is-strategy-advice');
		tip.dataset.failureCount = String(state.count);
		return;
	}
	tip.textContent = gameContent(state.fallback);
	tip.classList.remove('is-strategy-advice');
	delete tip.dataset.failureCount;
}

function registerLevelDefeat(fallback) {
	let count = 0;
	if (typeof recordLevelFail === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
		count = Number(recordLevelFail(CURRENT_LEVEL_ID)) || 0;
	}
	lastFailurePresentation = { count: count, fallback: fallback || '' };
	renderFailureAdvice();
	return count;
}

/* 连续歼敌会累积“战意”：每级令蓝方下一步攻击提高 8%，最高 3 级。
 * 它让集中火力真正有奖励，但上限只有 24%，不会把后期关卡滚成无脑碾压。 */
function battleAttackPower(unit) {
	const base = Math.max(0, Number(unit && unit.atk) || 0);
	return unit && unit.color === 'blue' ? base * (1 + battleMomentum * 0.08) : base;
}

function aliveUnitCount(color) {
	return armys.filter(function (unit) { return unit.color === color && !unit.disabled; }).length;
}

function renderBattleStatus() {
	let strip = document.getElementById('battle-status');
	const heading = document.querySelector('.game-heading');
	const meta = (typeof getLevelById === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined')
		? getLevelById(CURRENT_LEVEL_ID)
		: null;
	if (!heading || !meta) {
		if (strip) strip.style.display = 'none';
		return;
	}
	if (!strip) {
		strip = document.createElement('div');
		strip.id = 'battle-status';
		strip.className = 'battle-status';
		strip.setAttribute('aria-live', 'polite');
		heading.appendChild(strip);
	}
	/* 关卡标题以 levels.js 注册表为准（静态 HTML 里的 h2 只是占位，顺手写浏览器标签页标题）。 */
	const headingTitle = heading.querySelector('h2');
	if (headingTitle) headingTitle.textContent = gameContent(meta.name);
	if (meta.name) document.title = gameContent(meta.name);
	/* 结局延迟/结算后不再重画战况 pill（hideMidGameControls 已藏，刷新面板会重建它）。 */
	if ((typeof outcomePending !== 'undefined' && outcomePending) ||
		(boardContainer && boardContainer.style.display === 'none')) {
		strip.style.display = 'none';
		return;
	}
	strip.style.removeProperty('display');
	strip.innerHTML = '';
	const turnsLabel = remain_turns > 0
		? gameText('game.turnsLeft', { turns: remain_turns }, '剩余 ' + remain_turns + ' 回合')
		: '';
	/* 2026-09-16（本地）：战况条只保留剩余回合，并移到标题下方居中；
	 * 威胁 / 敌军 / 战意不再显示（其 CSS 与 i18n 词条仍保留，改回三项只需还原这段）。
	 * 远端同一位置的"释义 i 按钮 + 气泡"方案随之停用，但整框原生 title 仍然去掉，
	 * 避免原生标题与说明气泡重叠（这是远端 2026-09-16 的修复，保留）。 */
	if (!turnsLabel) {
		strip.style.display = 'none';
		return;
	}
	const item = document.createElement('span');
	item.className = 'battle-status__item battle-status__turns' + (remain_turns <= 5 ? ' is-urgent' : '');
	item.textContent = turnsLabel;
	strip.appendChild(item);
	strip.removeAttribute('title');
}

function updateBattleMomentum(defeatedThisTurn) {
	const before = battleMomentum;
	if (defeatedThisTurn > 0) battleMomentum = Math.min(MAX_BATTLE_MOMENTUM, battleMomentum + defeatedThisTurn);
	else battleMomentum = Math.max(0, battleMomentum - 1);
	if (defeatedThisTurn > 0 && typeof toast === 'function') {
		toast(gameText('game.momentumGain', {
			kills: defeatedThisTurn,
			level: battleMomentum,
			bonus: battleMomentum * 8
		}, '歼敌 ' + defeatedThisTurn + ' 支，战意升至 ' + battleMomentum + '/3：下步攻击 +' + (battleMomentum * 8) + '%。'));
	}
	if (before !== battleMomentum || defeatedThisTurn > 0) renderBattleStatus();
}

/* 统一重画回合提示，语言切换时不刷新战局。 */
function renderFooterStatus() {
	const bar = document.getElementById('footer-bar');
	if (!bar) return;
	bar.innerHTML = '';
	if (footerMode === 'goal') {
		/* 2026-09-16：目标行已删除——胜负条件在战前简报里讲，剩余回合由
		   左上 .battle-status 的“剩余 N 回合”pill 常驻显示，footer 留空不占位。 */
		return;
	}
	if (footerMode === 'resume') {
		bar.textContent = gameText('game.resumed', { level: resumedLevel, turns: remain_turns }, '已读取第 ' + resumedLevel + ' 关存档，还剩 ' + remain_turns + ' 回合。');
		return;
	}
	if (footerMode === 'turn') {
		/* 2026-09-16 玩家要求：标题下面那行"剩余 N 回合 · 已用 M 回合"不要出现。
		 * 剩余回合已经由左上战况条的「剩余 N 回合」pill 常驻显示，页脚是重复信息，
		 * 而且它多占一整行、把棋盘往下挤。分支保留（语言切换时仍会走到这里把 bar 清空），
		 * 只是不再写文案 —— `#footer-bar` 留空后高度是 0，不占位。 */
		return;
	}
	/* 剩余回合统一由左上战况 pill 显示，footer 不再重复。 */
}

// 初始化棋盘，添加箭头
function getblock() {
	let html = '';
	for(let i = 0; i < n; ++ i) for(let j = 0; j < m; ++ j) html += `<div class="cell" data-row="${i}" data-col="${j}"></div>`;
	return html + `<svg id="arrowSvg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5;">
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <polygon points="0 0, 6 2, 0 4" fill="#ff4444" />
    </marker>
  </defs>
  <line id="arrowLine"
        x1="0" y1="0" x2="0" y2="0"
        stroke="#ff4444"
        stroke-width="2"
        stroke-dasharray="6, 4"
        marker-end="url(#arrowhead)"
        style="display:none;" />
</svg>`;
}

// 对于每一类棋子生成对应的 html
function getHtmlForPiece(element) {
	if(element.img) return `<img src='./img/${element.img}.webp' style='width: 120%; height: 120%;' alt='${element.class}' draggable='false' decoding='async'></img>`;
	else return `<p>${gameContent(element.class)}</p>` ;
}

/* 棋盘顶端实时血条：数据仍只存于 armys，DOM 只负责显示。 */
function updateUnitHealth(unit) {
	if (!unit || !unit.id) return;
	const piece = document.getElementById(unit.id);
	if (!piece) return;
	let bar = piece.querySelector('.unit-health');
	if (!bar) {
		bar = document.createElement('span');
		bar.className = 'unit-health';
		bar.setAttribute('aria-hidden', 'true');
		bar.innerHTML = '<span class="unit-health__fill"></span>';
		piece.appendChild(bar);
	}
	const max = Math.max(Number(unit.lpMax) || Number(unit.lp) || 1, 1);
	const ratio = Math.max(0, Math.min(1, Number(unit.lp) / max));
	bar.style.setProperty('--unit-health', (ratio * 100).toFixed(1) + '%');
	bar.classList.toggle('is-wounded', ratio <= 0.55);
	bar.classList.toggle('is-critical', ratio <= 0.25);
}

function updateAllUnitHealth() {
	armys.forEach(updateUnitHealth);
}

// 以备后续计算棋子位置使用
/* distance/offset = 横向格宽与半格偏移；boardStepY/boardOffsetY = 纵向。
 * 全部由 measureBoardGeometry() 统一计算（B02）。 */
let distance, offset, boardStepY, boardOffsetY, arrowLine;

// 将由 html 表示的位置坐标转换为用cell数表示
function getPosByCell(pos) {
	return (pos - offset) / distance ;
}
/* 鼠标坐标 → 棋盘图层坐标所用的原点。
 * 棋子 / 常驻箭头 / 范围圈 / 框选矩形都是 #board 的绝对定位子元素，
 * 它们的坐标原点 = #board 的 padding box（边框以内）；而 getBoundingClientRect()
 * 返回的是 border box（含边框）。B 的美化给 #board 加了 9px 边框（窄屏 6px），
 * 不扣掉就会让「鼠标跟随的预览箭头」和「点地下令的目标点」整体偏移一个边框宽度。
 * clientLeft / clientTop 正好等于左/上边框宽度，且随断点自动变化，故用它修正。 */
function boardContentRect() {
	const r = boardContainer.getBoundingClientRect();
	const cl = boardContainer.clientLeft, ct = boardContainer.clientTop;
	return {
		left: r.left + cl,
		top: r.top + ct,
		/* 右/下同样扣除对称边框；框选夹取 clampPointToBoard 依赖 right/height。 */
		right: r.right - cl,
		bottom: r.bottom - ct,
		width: r.width - cl * 2,
		height: r.height - ct * 2
	};
}

/* ========== 棋盘几何：唯一的距离/偏移来源（B02） ==========
 * distance = 一格多少像素，offset = 格子中心相对棋盘内容区左/上沿的偏移。
 * ⚠️ 以前用 getBoundingClientRect() 相减测量：那时棋盘还带 .level-opening 的
 *    scale(0.97)，量出来的 distance 比真实格宽小约 3%；而且只在开局测一次，
 *    改窗口大小后从不重算 —— 于是棋子按旧 distance 摆位，缩到手机尺寸时跑出棋盘。
 * clientWidth/clientHeight 是布局尺寸，**不受 transform 影响**，再除以格数即得真实格宽。
 * #board 无 padding / gap（只有 border），所以 clientWidth 正好是全部格子的总宽。 */
function measureBoardGeometry() {
	const cols = Math.max(1, Number(m) || 10);
	const rows = Math.max(1, Number(n) || 10);
	distance = boardContainer.clientWidth / cols;
	offset = distance / 2;
	/* 纵向格宽单独存一份：棋盘是正方形，但极窄屏下两者可能差 1px 以内。 */
	boardStepY = boardContainer.clientHeight / rows;
	boardOffsetY = boardStepY / 2;
	syncDockGeometry();
	return { distance: distance, offset: offset };
}

/* 把棋盘的**真实**几何写成 CSS 变量，供右侧指挥停靠坞定位（2026-09-16）。
 *
 * 为什么非要走 JS：棋盘宽度在三个断点里是三套公式
 *   ≥1181px  `min(78dvh, calc(100vw - 700px))`
 *   901~1180 `min(71dvh, calc(100vw - 530px))`
 *   其余      `min(78dvh, calc(100vw - 440px))`
 * 而停靠坞是 `position:fixed`，CSS 里没有任何办法"引用另一个盒子的实际宽度"，
 * 原来的写法把所有断点都当成 `min(78dvh, 100vw - 440px)`，
 * 于是实测缝隙在 43~102px 之间乱跳、垂直方向最多偏 83px。
 *
 * ⚠️ 刻意用 offsetWidth / offsetHeight + body 的 rect 来算，**不用 #board 自己的 rect**：
 *    开场 `.level-opening` 会给棋盘挂 `transform: scale(.97) translateY(12px)`，
 *    而 getBoundingClientRect() 是含 transform 的，直接用会把变量写偏。
 *    offset* 是布局值，不受 transform 影响；body 的 rect 与棋盘的 transform 无关。
 * 棋盘在 body 的左右对称内边距里居中，所以右缘 = (视口宽 + 棋盘宽) / 2。 */
function syncDockGeometry() {
	if (!boardContainer) return;
	const w = boardContainer.offsetWidth;
	const h = boardContainer.offsetHeight;
	if (!w || !h) return;
	const viewportW = document.documentElement.clientWidth || window.innerWidth;
	const boardTop = document.body.getBoundingClientRect().top + boardContainer.offsetTop;
	const root = document.documentElement;
	root.style.setProperty('--board-right', ((viewportW + w) / 2) + 'px');
	root.style.setProperty('--board-center-y', (boardTop + h / 2) + 'px');
	/* 右侧操作坞的**最右允许位置**：不能让 188px 宽的坞压到常驻的「敌方序列」编制栏上。
	 * 这件事原来一直存在（实测 1180×800 压 42px、1102×800 压 81px），
	 * 只是 2026-09-16 把棋盘放大后 1440×900 也开始压（15px），所以补上硬约束。
	 * 编制栏不可见时（还没渲染）退化成"离右边 178px"，与 CSS 里的 `right:12px; width:154px` 一致。 */
	const roster = document.getElementById('enemy-roster');
	let rosterLeft = viewportW - 166;
	if (roster) {
		const rr = roster.getBoundingClientRect();
		if (rr.width > 0) rosterLeft = rr.left;
	}
	root.style.setProperty('--dock-max-left', (rosterLeft - 200) + 'px');
}

/* 重排所有棋子到当前几何（只改 left/top，不动 posx/posy 等战局数据）。
 * resize 时用：既不重开战局，也不改 HP / 回合 / 命令。 */
function relayoutBoardUnits() {
	if (!boardContainer) return;
	measureBoardGeometry();
	armys.forEach(function (unit) {
		if (unit.disabled) return;
		movePieceTo(unit.id, unit.posx, unit.posy);
	});
	if (typeof renderOrderArrows === 'function') renderOrderArrows();
	if (typeof renderRangeOverlays === 'function') renderRangeOverlays();
}

/* 视口尺寸变化：重算几何并重绘，绝不重开战局。 */
let boardResizeTimer = null;
function onBoardViewportResize() {
	if (boardResizeTimer) window.clearTimeout(boardResizeTimer);
	/* 拖拽改变窗口时会连续触发；防抖到停下来再重排，避免每帧重排。 */
	boardResizeTimer = window.setTimeout(function () {
		boardResizeTimer = null;
		if (document.body.classList.contains('level-opening')) return;
		relayoutBoardUnits();
	}, 120);
}
window.addEventListener('resize', onBoardViewportResize);
window.addEventListener('orientationchange', onBoardViewportResize);

// 加载游戏
function loadGame(game) {
	resetUndoHistory();
	battleMomentum = 0;
	document.body.classList.add('level-opening');   // 从 demo-美化好 移植：开场隐藏战场，等 revealBattlefield() 淡入
	n = game.n; m = game.m; remain_turns = game.turns_limit;
	boardContainer.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
	boardContainer.innerHTML = getblock(n, m);
	arrowLine = document.getElementById('arrowLine');
	/* B02：几何统一从布局尺寸算（clientWidth/clientHeight 不受 transform 影响）。 */
	measureBoardGeometry();
	/* ⚠️ B06：刚重建了 #board 的内容，旧特效层节点已脱离文档。
	 * 清掉引用与排队中的特效任务，避免它们继续挂在已经看不见的旧节点上。 */
	if (typeof fxReset === 'function') fxReset();
	/* 加载初始棋盘，计算棋子移动所需常量 */
	/* 棋盘是一个长和宽都是 80dvh 的的窗口，分成 n x m 个 cell，主要是方便布置棋子 */
	/* 在现有的代码中，n 和 m 都保持为 10 */

	footerMode = 'goal';
	resumedLevel = null;
	renderFooterStatus();
	/* 加载胜利条件与回合限制 */

	game.pieces.forEach(element => {
		piece = document.createElement('div');
  	piece.className = `chess chess--${element.color}`;
		piece.id = `piece-${piece_cnt}`;
		piece.innerHTML = getHtmlForPiece(element)
  	boardContainer.appendChild(piece);
		armys.push({
			id: piece.id,
			color: element.color,
			posx: element.posx,
			posy: element.posy,
			speed: element.speed,
			targetx: element.posx,
			targety: element.posy,
			followTargetId: '',
			atkrange: element.atkrange,
			atk: element.atk,
			lp: element.lp,
			/* 2026-09-16：允许关卡把单位配成"残血开局" ——
			   配置里写 `lp: 30, lpMax: 60` 就表示 30/60，血条按 50% 画。
			   不写 `lpMax` 时仍等同原来的"满血开局"（上限=初始 lp），其它关卡行为不变。 */
			lpMax: Number(element.lpMax) || element.lp,
			disabled: false,
			cls: element.class,
			img: element.img || '',
			formationRole: element.formationRole || ''
		}) ;
		updateUnitHealth(armys[armys.length - 1]);
		movePieceTo(piece.id, -1.0, -1.0);
		movePieceTo(piece.id, armys[piece_cnt].posx, armys[piece_cnt].posy);
		piece_cnt ++ ;
	}) ;
	/* 加载棋子 */
	renderOrderArrows();
	renderBattleStatus();
	renderArmyRosters();
	showLevelIntro();
}

/* 从存档快照恢复一局（to-do #2/#3）：重建棋盘与棋子，字段与 captureSnapshot() 一一对应。
 * opts.skipIntro：恢复后直接进战场，不重播剧情 / 简报 / 教程图。
 *   关卡内"读取"与主界面"继续存档"都传 true；只有全新开局才走完整开场。 */
function loadSnapshot(snap, opts) {
	opts = opts || {};
	resetUndoHistory();
	battleMomentum = Math.max(0, Math.min(MAX_BATTLE_MOMENTUM, Number(snap.momentum) || 0));
	n = snap.n; m = snap.m; remain_turns = snap.remain_turns; piece_cnt = 0; armys = new Array(0);
	selectedPieces = [];
	selectedEnemies = [];
	boardContainer.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
	boardContainer.innerHTML = getblock(n, m);
	arrowLine = document.getElementById('arrowLine');
	/* B02：几何统一从布局尺寸算（clientWidth/clientHeight 不受 transform 影响）。 */
	measureBoardGeometry();
	/* ⚠️ B06：刚重建了 #board 的内容，旧特效层节点已脱离文档。
	 * 清掉引用与排队中的特效任务，避免它们继续挂在已经看不见的旧节点上。 */
	if (typeof fxReset === 'function') fxReset();
	footerMode = 'resume';
	resumedLevel = snap.level;
	renderFooterStatus();
	if (typeof toast === 'function') toast(gameText('game.resumed', { level: snap.level, turns: remain_turns }, '已从存档继续：第 ' + snap.level + ' 关，剩余 ' + remain_turns + ' 回合。'));
	snap.units.forEach((u, idx) => {
		const piece = document.createElement('div');
		piece.className = `chess chess--${u.color}`;
		piece.id = `piece-${piece_cnt}`;
		piece.innerHTML = (u.img
			? `<img src='./img/${u.img}.webp' style='width: 120%; height: 120%;' alt='' draggable='false' decoding='async'></img>`
			: `<p>${gameContent(u.cls)}</p>`);
		boardContainer.appendChild(piece);
		// 满血上限优先取本关配置的初始 LP（修复旧档缺 lpMax 时"上限=存档时当前血量"的老问题）
		// 2026-09-16：配置里给了独立的 `lpMax`（残血开局）时以它为准，否则才回落到 `lp`。
		const cfgLp = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.pieces && CURRENT_GAME.pieces[idx])
			? (Number(CURRENT_GAME.pieces[idx].lpMax) || CURRENT_GAME.pieces[idx].lp)
			: null;
		const restoredMax = (cfgLp !== null) ? cfgLp : (u.lpMax || u.lp);
		const cfgRole = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.pieces && CURRENT_GAME.pieces[idx])
			? CURRENT_GAME.pieces[idx].formationRole
			: '';
		const restoredLp = Math.min(u.lp, restoredMax);
		armys.push({
			id: piece.id,
			color: u.color,
			posx: u.posx, posy: u.posy,
			speed: u.speed,
			targetx: u.targetx, targety: u.targety,
			followTargetId: u.followTargetId || '',
			atkrange: u.atkrange, atk: u.atk, lp: restoredLp,
			lpMax: restoredMax,
			disabled: !!u.disabled,
			escaped: !!u.escaped,
			cls: u.cls, img: u.img || '',
			formationRole: u.formationRole || cfgRole || ''
		});
		updateUnitHealth(armys[armys.length - 1]);
		movePieceTo(piece.id, u.posx, u.posy);
		if (u.disabled) { piece.classList.add('disabled'); piece.style.display = 'none'; }
		piece_cnt ++;
	});
	refreshSelectedUI();
	refreshEnemySelectionUI();
	renderOrderArrows();
	renderBattleStatus();
	renderArmyRosters();
	/* 读档恢复：跳过剧情 / 简报 / 教程图，直接回到战场（见 showLevelIntro 注释）。 */
	showLevelIntro({ skipIntro: opts.skipIntro !== false });
}

/* 抓取当前这一局的中途状态（手动存档 / 自动存档都用它） */
function captureSnapshot() {
	if (typeof CURRENT_LEVEL_ID === 'undefined') return null;
	return {
		level: CURRENT_LEVEL_ID,
		n: n, m: m,
		remain_turns: remain_turns,
		momentum: battleMomentum,
		units: armys.map(u => ({
			color: u.color, cls: u.cls, img: u.img || '',
			posx: u.posx, posy: u.posy,
			targetx: u.targetx, targety: u.targety,
			followTargetId: u.followTargetId || '',
			speed: u.speed, atkrange: u.atkrange, atk: u.atk, lp: u.lp,
			lpMax: u.lpMax,   // 开局/读档时一定已按初始 LP 校准，无需兜底
			formationRole: u.formationRole || '',
			disabled: u.disabled,
			escaped: !!u.escaped
		}))
	};
}

/* 本关回退：只保存在内存中，最多使用 3 次，刷新或读档后重新计数。 */
function captureTurnState() {
	return {
		remainTurns: remain_turns,
		footerMode: footerMode,
		resumedLevel: resumedLevel,
		momentum: battleMomentum,
		units: armys.map(function (unit) { return Object.assign({}, unit); }),
		selectedIds: selectedPieces.map(function (unit) { return unit.id; }),
		selectedEnemyIds: selectedEnemies.map(function (unit) { return unit.id; }),
		game8: (typeof game8Started !== 'undefined') ? {
			started: game8Started,
			finished: game8Finished,
			breakthroughCount: game8BreakthroughCount
		} : null
	};
}

function undoText(key, vars, fallback) {
	return gameText(key, vars, fallback);
}

function renderUndoButton() {
	const button = document.getElementById('button-undo');
	if (!button) return;
	const left = Math.max(0, MAX_UNDO_USES - undoUses);
	button.textContent = undoText('game.undo', { left: left }, '回退 ' + left + '/3');
	button.title = undoText('game.undoTitle', null, '回退到上一步（本关最多使用 3 次）');
	button.disabled = left <= 0 || undoStack.length === 0;
}

function resetUndoHistory() {
	undoStack = [];
	undoUses = 0;
	renderUndoButton();
}

function rememberTurnForUndo() {
	if (undoUses >= MAX_UNDO_USES) return;
	undoStack.push(captureTurnState());
	if (undoStack.length > MAX_UNDO_USES) undoStack.shift();
	renderUndoButton();
}

function restoreBattleControlsAfterUndo() {
	document.body.classList.remove('result-active');
	outcomePending = false;
	boardContainer.style.removeProperty('display');
	boardContainer.style.removeProperty('pointer-events');
	buttonContainer.style.removeProperty('display');
	const footer = document.getElementById('footer-bar');
	if (footer) footer.style.removeProperty('display');
	const actions = document.getElementById('game-actions');
	if (actions) actions.style.removeProperty('display');
	const saveButtons = document.getElementById('save-load-btns');
	if (saveButtons) saveButtons.style.removeProperty('display');
	const undoBtn = document.getElementById('button-undo');
	if (undoBtn) undoBtn.style.removeProperty('display');
	const battleStatus = document.getElementById('battle-status');
	if (battleStatus) battleStatus.style.removeProperty('display');
	const exitButton = document.getElementById('button-exit');
	if (actions && exitButton && exitButton.parentNode !== actions) actions.appendChild(exitButton);
	['win', 'lose', '1star', '2star', '3star', 'button-next-game', 'button-replay', 'button-fail'].forEach(function (id) {
		const element = document.getElementById(id);
		if (element) element.style.display = 'none';
	});
	['deployment-panel', 'defense-line', 'defense-hud'].forEach(function (id) {
		const element = document.getElementById(id);
		if (element) element.style.removeProperty('display');
	});
}

function performUndo() {
	if (!undoStack.length || undoUses >= MAX_UNDO_USES) {
		if (typeof modalNotice === 'function') modalNotice(undoText('game.undoEmpty', null, '当前没有可以回退的步骤。'));
		return;
	}
	const state = undoStack.pop();
	remain_turns = state.remainTurns;
	footerMode = state.footerMode;
	resumedLevel = state.resumedLevel;
	battleMomentum = Math.max(0, Math.min(MAX_BATTLE_MOMENTUM, Number(state.momentum) || 0));
	state.units.forEach(function (saved, index) {
		const unit = armys[index];
		if (!unit) return;
		const id = unit.id;
		Object.assign(unit, saved);
		unit.id = id;
		const piece = document.getElementById(id);
		if (piece) {
			piece.style.removeProperty('display');
			piece.classList.toggle('disabled', !!unit.disabled);
			if (unit.disabled) piece.style.display = 'none';
		}
		movePieceTo(id, unit.posx, unit.posy);
		updateUnitHealth(unit);
	});
	selectedPieces = state.selectedIds.map(function (id) { return armys.find(function (unit) { return unit.id === id && !unit.disabled; }); }).filter(Boolean);
	selectedEnemies = state.selectedEnemyIds.map(function (id) { return armys.find(function (unit) { return unit.id === id && !unit.disabled; }); }).filter(Boolean);
	if (state.game8 && typeof game8Started !== 'undefined') {
		game8Started = state.game8.started;
		game8Finished = state.game8.finished;
		game8BreakthroughCount = state.game8.breakthroughCount;
		if (typeof game8UpdateBreakthroughTip === 'function') game8UpdateBreakthroughTip();
		if (typeof game8UpdateHUD === 'function') game8UpdateHUD();
	}
	undoUses += 1;
	restoreBattleControlsAfterUndo();
	if (typeof fxDebug !== 'undefined' && fxDebug && typeof fxDebug.clearAll === 'function') fxDebug.clearAll();
	renderFooterStatus();
	refreshSelectedUI();
	refreshEnemySelectionUI();
	renderInfoPanel();
	renderEnemyPanel();
	updateRangePositions();
	renderOrderArrows();
	renderUndoButton();
	renderBattleStatus();
	renderArmyRosters();
	const left = Math.max(0, MAX_UNDO_USES - undoUses);
	if (typeof toast === 'function') toast(undoText('game.undoDone', { left: left }, '已回退一步，本关还可回退 ' + left + ' 次。'));
}

function ensureUndoButton() {
	if (document.getElementById('button-undo')) return;
	const actions = document.getElementById('game-actions');
	const exitButton = document.getElementById('button-exit');
	if (!actions || !exitButton) return;
	const button = document.createElement('button');
	button.id = 'button-undo';
	button.className = 'game-btn game-btn--undo';
	button.type = 'button';
	button.addEventListener('click', performUndo);
	actions.insertBefore(button, exitButton);
	renderUndoButton();
}

/* 当前登录用户（未登录返回 ''），依赖 account.js */
function currentUserSafe() {
	return (typeof currentUser === 'function') ? currentUser() : '';
}

/* 刷新关卡内"存档目标"下拉：a.save + 存档1/2/3，标注内容；跨关快照标注"非本关，不可读" */
function refreshSlotSelect() {
	const sel = document.getElementById('slot-select');
	if (!sel) return;
	/* ⚠️ B10：重建选项列表后必须保留玩家当前选中的档位。
	 * 以前无条件 sel.value = AUTO_ID，导致"选了存档 1 → 保存成功 → 档位悄悄跳回活动档"，
	 * 之后直接点保存/读取操作的就是玩家没选的档。只有首次初始化才默认活动档。 */
	const previous = sel.value;
	sel.innerHTML = '';
	const user = currentUserSafe();
	const auto = user ? getAuto(user) : null;
	const lvl = (typeof CURRENT_LEVEL_ID === 'undefined') ? null : CURRENT_LEVEL_ID;
	function snapLabel(snap) {
		if (!snap) return null;
		if (snap.level === lvl) return gameText('save.sameLevel', { level: snap.level, turns: snap.remain_turns }, '（第 ' + snap.level + ' 关，剩 ' + snap.remain_turns + ' 回合）');
		return gameText('save.otherLevel', { level: snap.level, turns: snap.remain_turns }, '（第 ' + snap.level + ' 关 · 非本关，不可读）');
	}
	[AUTO_ID].concat(MANUAL_IDS).forEach(function (id) {
		const o = document.createElement('option');
		o.value = id;
		let extra = gameText('save.empty', null, '（空）');
		if (id === AUTO_ID) {
			if (auto && auto.snapshot) extra = snapLabel(auto.snapshot);
			else if (auto && (auto.unlocked > 1 || Object.keys(auto.stars).length)) extra = '';
		} else {
			const f = user ? getManual(user, id) : null;
			if (f && f.snapshot) extra = snapLabel(f.snapshot);
			else if (f && (f.unlocked > 1 || Object.keys(f.stars).length)) extra = '';
		}
		o.textContent = fileName(id) + extra;
		sel.appendChild(o);
	});
	/* 合法档位就恢复原选择；档位集合是固定的 a/1/2/3，越界值一律回落活动档。 */
	const valid = [AUTO_ID].concat(MANUAL_IDS);
	sel.value = valid.indexOf(previous) >= 0 ? previous : AUTO_ID;
}
refreshSlotSelect();
ensureUndoButton();

/* 验收/调试用：控制台向某目标存中途快照（默认 a.save），或清空当前用户全部存档 */
window.__saveMidLevel = function (id) {
	if (typeof CURRENT_LEVEL_ID === 'undefined') { console.log('[__saveMidLevel] 不在关卡内'); return; }
	const user = currentUserSafe();
	if (!user) { console.log('[__saveMidLevel] 未登录'); return; }
	id = isFileId(id) ? String(id) : AUTO_ID;
	const snap = captureSnapshot();
	if (!snap) return;
	const ok = (id === AUTO_ID) ? saveSnapshotToAuto(user, snap) : saveToManual(user, id, snap);
	if (ok) { console.log('[__saveMidLevel] 已保存到 ' + fileName(id)); refreshSlotSelect(); }
};

window.__clearSave = function () {
	const user = currentUserSafe();
	if (user) {
		localStorage.removeItem('a.save:' + user);
		MANUAL_IDS.forEach(function (id) { localStorage.removeItem('save' + id + ':' + user); });
	}
	console.log('[__clearSave] 当前用户的自动存档与手动存档已清空');
};

/* 胜负结算后隐藏"存/读档"、回退按钮、战况条、左右显示条与整个右坞
   （Menu 按钮会被 moveMenuIntoResultArea 挪进结算区，不受影响）。 */
function hideMidGameControls() {
	const el = document.getElementById('save-load-btns');
	if (el) el.style.display = 'none';
	const undoBtn = document.getElementById('button-undo');
	if (undoBtn) undoBtn.style.display = 'none';
	const battleStatus = document.getElementById('battle-status');
	if (battleStatus) battleStatus.style.display = 'none';
	const gameActions = document.getElementById('game-actions');
	if (gameActions) gameActions.style.display = 'none';
	const bar = document.getElementById('info-bar');
	if (bar) bar.style.display = 'none';
	const ebar = document.getElementById('enemy-info');
	if (ebar) ebar.style.display = 'none';
	document.querySelectorAll('.army-roster').forEach(function (roster) { roster.style.display = 'none'; });
	const rl = document.getElementById('range-layer');
	if (rl) rl.remove();
	rangeCircles = [];
}

/* 结算页（2026-09）：把 Menu 按钮也并进 #result-area，跟胜负面板一起居中。
   判胜时整条 #game-actions 本来就是隐藏的，所以只在判负分支里调动。 */
function moveMenuIntoResultArea() {
	const area = document.getElementById('result-area');
	const btn = document.getElementById('button-exit');
	if (area && btn && btn.parentNode !== area) area.appendChild(btn);
}

/* 通关结算页的"下一步去哪"（写在 #button-next-game 的 data-target 上）：
   · 下一关是结局页 → 直接进结局（第 7 关单独判：隐藏关通关去隐藏结局）；
   · 否则回主界面，**只有这一关通关真的解锁了新关卡**时才带 ?unlock=N
     —— 主界面靠它播"路线加载"动画并弹出新标记（见 js/menu-saves.js 的 revealId）。
     重打已经通过的老关卡时战线没有前移，就不该再播一次动画。
   注意：必须在 autosaveOnWin() 之前调用，否则读到的 unlocked 已经是推进后的值。 */
function winTargetFor(levelId) {
	if (Number(levelId) === 7) return 'hidden-end.html';   // 隐藏关通关 → 隐藏结局
	if (typeof nextLevelFile === 'function') {
		const nf = nextLevelFile(levelId);
		if (/end-game\.html|hidden-end\.html/.test(nf)) return nf;
	}
	let prevUnlocked = 1;
	try {
		if (typeof currentUser === 'function' && currentUser() && typeof autoProgress === 'function') {
			prevUnlocked = Number(autoProgress(currentUser()).unlocked) || 1;
		}
	} catch (e) { /* 读不到就当作"推进了"，宁可多播一次动画 */ }
	const advanced = Number(levelId) >= prevUnlocked;   // 打的是战线最前沿那一关
	return 'menu.html' + (advanced ? ('?unlock=' + levelId) : '');
}

/* 通关结算页统一收尾：只留 Next —— 隐藏 Replay / 结局按钮与整条操作区（含 Menu） */
function hideResultAlternatives() {
	const replay = document.getElementById('button-replay');
	if (replay) replay.style.display = 'none';
	const fail = document.getElementById('button-fail');
	if (fail) fail.style.display = 'none';
	const actions = document.getElementById('game-actions');
	if (actions) actions.style.display = 'none';
}

/* 失败结算统一收尾（B11b）：藏棋盘与回合按钮、显示 #lose、给出"查看结局"出口。
 * 以前这段在"通用失败分支 + 第 5 关自己的两条失败分支"里各抄了一份，
 * 第 5 关那两份漏了 button-fail 的显示与 data-target ——
 * 于是第 5 关打输了只有"重玩 / 主界面 / 回退"，没有别的关都有的"查看结局：提早失利"。
 * 现在所有失败分支共用这一个函数。 */
function finishDefeat() {
	if (boardContainer) boardContainer.style.display = 'none';
	buttonContainer.style.display = 'none';
	const footer = document.getElementById('footer-bar');
	if (footer) footer.style.display = 'none';
	const lose = document.getElementById('lose');
	if (lose) lose.style = 'display: flex; flex-direction: column; align-items: center;';
	const replay = document.getElementById('button-replay');
	if (replay) replay.style = 'width: 100px; height: 50px;';
	moveMenuIntoResultArea();
	const failBtn = document.getElementById('button-fail');
	if (failBtn) {
		failBtn.style.cssText = 'width:auto; margin-top:8px;';
		if (CURRENT_LEVEL_ID === 7) {
			// 隐藏第 7 关的失败有专属结局：命运无法改变
			failBtn.dataset.target = 'destiny-fail.html';
			failBtn.dataset.i18n = 'game.endingDestiny';
			failBtn.textContent = gameText('game.endingDestiny', null, '查看结局：命运无法改变');
		} else {
			failBtn.dataset.target = 'fail.html';
			failBtn.dataset.i18n = 'game.endingEarly';
			failBtn.textContent = gameText('game.endingEarly', null, '查看结局：提早失利');
		}
	}
	hideMidGameControls();
}

/* 向量归一化，方便计算棋子移动到的位置 */
function normalize(vec) {
	const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
	if(length <= eps) { return {x: 0.0, y: 0.0}; }
	return {
		x: vec.x / length,
		y: vec.y / length
	} ;
}

/* 将棋子的状态设为不能使用的状态的方法 */
function setToDisable(element) {
	element.disabled = true;
	element.lp = Math.max(0, Number(element.lp) || 0);
	const piece = document.getElementById(element.id);
	if (piece) {
		piece.classList.add('disabled');
		/* 阵亡即刻从画面移除，不再保留一轮发黑的棋子轮廓。 */
		piece.style.display = 'none';
	}
	if (typeof removeOrderArrow === 'function') removeOrderArrow(element.id);
	updateUnitHealth(element);
}

/* 计算棋子间距离的方法 */
function calcdis(element1, element2) {
	let disx = element1.posx - element2.posx, disy = element1.posy - element2.posy;
	return Math.sqrt(disx * disx + disy * disy) ;
}

/* 近战单位的接战距离略大于棋子直径，避免为了开火而彼此叠在一起。 */
function unitCombatRange(unit) {
	return Math.max(Number(unit && unit.atkrange) || 0, UNIT_MIN_SEPARATION + 0.02);
}

function isUnitPositionClear(unit, x, y) {
	return armys.every(function (other) {
		if (other === unit || other.disabled) return true;
		const dx = x - other.posx;
		const dy = y - other.posy;
		return Math.sqrt(dx * dx + dy * dy) >= UNIT_MIN_SEPARATION - eps;
	});
}

/* 目标点被占用时依次尝试左右绕行；全部受阻就停在原位，绝不穿过或堆叠。
 * ⚠️ B04：期望点与每个绕行候选点都要过边界检查（撤退出口除外），
 * 否则角落集结时绕行会把普通单位推出棋盘。 */
function collisionSafeMove(unit, startx, starty, desiredx, desiredy) {
	const canLeave = isRetreatMove(unit, unit.targetx, unit.targety);
	const fit = function (x, y) {
		if (canLeave) return { x: x, y: y };
		return clampToBoardBounds(x, y);
	};
	const desired = fit(desiredx, desiredy);
	if (isUnitPositionClear(unit, desired.x, desired.y)) return desired;
	const dx = desired.x - startx;
	const dy = desired.y - starty;
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length <= eps) return { x: startx, y: starty };
	const ux = dx / length;
	const uy = dy / length;
	const angles = [55, -55, 90, -90];
	for (let i = 0; i < angles.length; i++) {
		const rad = angles[i] * Math.PI / 180;
		const vx = ux * Math.cos(rad) - uy * Math.sin(rad);
		const vy = ux * Math.sin(rad) + uy * Math.cos(rad);
		/* 绕行候选点同样先夹进棋盘，再判断是否与其它单位重叠。 */
		const candidate = fit(startx + vx * length, starty + vy * length);
		if (isUnitPositionClear(unit, candidate.x, candidate.y)) return candidate;
	}
	return { x: startx, y: starty };
}

/* 从 armys 中选出距离 element 最近的异色棋子的方法，用于确认棋子攻击目标 */
function selectMinimalDistance(element, armys) {
	let minDisItem = null, minDis = 200.0;
	for(let i = 0; i < armys.length; ++ i) {
		if(armys[i].disabled) continue ;
		if(armys[i].color == element.color) continue ;
		let dis = calcdis(element, armys[i]);
		if(dis < minDis) {
			minDisItem = armys[i]; minDis = dis;
		}
	}
	return minDisItem;
}

/* 将一个回合分成若干'帧'，每一'帧'分别处理 */
/* 若当前回合棋子攻击范围内有敌人，则攻击最近的敌人 */
/* 否则随机攻击 */
// =====================================================
// 找出“这一小段移动路径”第一次进入哪个敌人的攻击范围
//
// 返回：
// {
//     enemy: 敌人,
//     t: 0~1，表示沿着本次移动路径走了多少
// }
// 如果没有进入任何新的攻击范围，则返回 null
// =====================================================
function findFirstEnterAttackRange(element, startx, starty, endx, endy) {

    let first = null;

    const dx = endx - startx;
    const dy = endy - starty;
    const a = dx * dx + dy * dy;

    if (a <= eps) return null;

    for (let i = 0; i < armys.length; ++i) {

        let enemy = armys[i];

        // 死亡单位跳过
        if (enemy.disabled) continue;

        // 自己和同阵营跳过
        if (enemy.color === element.color) continue;

        // -----------------------------------------
        // 如果移动开始时已经在这个敌人的攻击范围内
        // 那么这次不把“离开它”当作进入
        // -----------------------------------------
        const sx = startx - enemy.posx;
        const sy = starty - enemy.posy;

        const startDis2 = sx * sx + sy * sy;
        const range = unitCombatRange(element);

        if (startDis2 <= range * range + eps) {
            continue;
        }

        // -----------------------------------------
        // 求线段与攻击范围圆的第一次交点
        // 圆心 = enemy
        // 半径 = element.atkrange
        // -----------------------------------------
        const fx = startx - enemy.posx;
        const fy = starty - enemy.posy;

        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - range * range;

        const discriminant = b * b - 4 * a * c;

        // 没有交点
        if (discriminant < 0) continue;

        const sqrtD = Math.sqrt(discriminant);

        const t1 = (-b - sqrtD) / (2 * a);
        const t2 = (-b + sqrtD) / (2 * a);

        // 我们从圆外往圆内走，
        // 所以第一次进入圆的是较小的有效 t
        let t = null;

        if (t1 >= -eps && t1 <= 1 + eps) {
            t = t1;
        } else if (t2 >= -eps && t2 <= 1 + eps) {
            t = t2;
        }

        if (t === null) continue;

        t = Math.max(0, Math.min(1, t));

        if (first === null || t < first.t) {
            first = {
                enemy: enemy,
                t: t
            };
        }
    }

    return first;
}

function nextStep() {
	let disabledList = new Array();

	armys.forEach(element => {
		if(element.disabled == true) return;

		/* 追踪军令保存的是目标棋子 id。目标移动后，每个内部帧都重新取它的
		 * 实时坐标，因此移动路线和常驻箭头会一起跟随；目标阵亡后停在最后坐标。 */
		if (element.followTargetId) {
			const followed = armys.find(function (unit) { return unit.id === element.followTargetId; });
			if (followed && !followed.disabled) {
				element.targetx = followed.posx;
				element.targety = followed.posy;
			} else {
				element.followTargetId = '';
			}
		}

		let atktar = selectMinimalDistance(element, armys);

		// ============================================
		// 先判断当前位置是否在最近敌人的攻击范围内
		// ============================================

		let inAttackRange = false;

		if(atktar != null) {
			inAttackRange = calcdis(element, atktar) < unitCombatRange(element);
		}

		// ============================================
		// 计算当前目标方向
		// ============================================

		let targetvector = normalize({
			x: element.targetx - element.posx,
			y: element.targety - element.posy
		});

		// ============================================
		// 判断是否已经到达目标
		// ============================================

		if(
			Math.abs(element.targetx - element.posx) <= eps &&
			Math.abs(element.targety - element.posy) <= eps
		) {
			// 已经到达目标，如果在攻击范围内，就攻击
			if(inAttackRange) {
				atktar.lp -= battleAttackPower(element);
				updateUnitHealth(atktar);
				if (typeof fxMarkFired === 'function') fxMarkFired(element, atktar);

				if(atktar.lp <= 0)
					disabledList.push(atktar);
			}

			return;
		}

		// ============================================
		// 目标点已被【友军】占住、且自己已贴近到“再走一步就会撞上”的距离：
		// 视为到达（在射程内照常开火），不再左右绕行，
		// 避免聚团 AI 围着中间棋子公转。
		// 注意：被敌方占住目标时仍允许绕行包抄（breakthrough 的接敌机动）。
		// ============================================

		const targetBlockedByAlly = armys.some(function (other) {
			if (other === element || other.disabled) return false;
			if (other.color !== element.color) return false;
			return Math.hypot(element.targetx - other.posx, element.targety - other.posy)
				< UNIT_MIN_SEPARATION - eps;
		});
		const settleRadius = UNIT_MIN_SEPARATION
			+ Math.min(Math.max(Number(element.speed) || 0, 0), 1) + eps;
		if(
			targetBlockedByAlly &&
			Math.hypot(element.targetx - element.posx, element.targety - element.posy) <= settleRadius
		) {
			if(inAttackRange) {
				atktar.lp -= battleAttackPower(element);
				updateUnitHealth(atktar);
				if (typeof fxMarkFired === 'function') fxMarkFired(element, atktar);

				if(atktar.lp <= 0)
					disabledList.push(atktar);
			}
			return;
		}

		// ============================================
		// 如果目前在攻击范围内
		// 判断移动方向是不是在“离开敌人”
		// ============================================

		if(inAttackRange) {

			// 从当前点指向目标点
			let moveX = element.targetx - element.posx;
			let moveY = element.targety - element.posy;

			// 当前棋子指向敌人的向量
			let enemyX = atktar.posx - element.posx;
			let enemyY = atktar.posy - element.posy;

			// 点积
			let dot = moveX * enemyX + moveY * enemyY;

			// dot < 0：
			// 移动方向与“指向敌人”的方向相反
			// 也就是正在远离敌人
			if(dot >= 0) {
				// 正在靠近敌人/没有离开
				// 保持原来的攻击逻辑
				atktar.lp -= battleAttackPower(element);
				updateUnitHealth(atktar);
				if (typeof fxMarkFired === 'function') fxMarkFired(element, atktar);

				if(atktar.lp <= 0)
					disabledList.push(atktar);

				return;
			}

			// dot < 0
			// 正在离开敌人
			// 不攻击，继续往外走
		}

		// ============================================
		// 按照原来的逻辑移动一步
		// ============================================

		const startx = element.posx;
		const starty = element.posy;
		const remainingX = element.targetx - startx;
		const remainingY = element.targety - starty;
		const remaining = Math.sqrt(remainingX * remainingX + remainingY * remainingY);
		const travel = Math.min(Math.max(Number(element.speed) || 0, 0), remaining);
		const desiredx = startx + targetvector.x * travel;
		const desiredy = starty + targetvector.y * travel;
		const safe = collisionSafeMove(element, startx, starty, desiredx, desiredy);
		element.posx = safe.x;
		element.posy = safe.y;

		if (Math.abs(element.posx - startx) > eps || Math.abs(element.posy - starty) > eps) {
			movePieceTo(element.id, element.posx, element.posy);
			if (typeof fxMarkMoving === 'function') fxMarkMoving(element, startx, starty);
		}
	});

	// ============================================
	// 统一处理死亡单位
	// ============================================

	disabledList.forEach(element => {
		setToDisable(element);
	});
}


/* 将灰色的濒死棋子移除 */
function clearDisable() {
	armys.forEach(element => {
		if(element.disabled == true) {
			const piece = document.getElementById(element.id);
			piece.style.display = 'none' ;
			return ;
		}
	});
}

/* 检查胜负状态 */
/* to-do 收尾：追猎战（第 4 关）——红方"到达右上角"才算成功撤退（右边界与上边界同时满足，标记 escaped 并移出棋盘） */
function processTurnEscapes() {
	const obj = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.objective &&
		CURRENT_GAME.objective.type === 'retreat') ? CURRENT_GAME.objective : null;
	if (!obj) return;
	const exitX = (obj.exitX !== undefined) ? obj.exitX : 9.5;
	const exitY = (obj.exitY !== undefined) ? obj.exitY : -0.5;
	armys.forEach(u => {
		if (u.color !== 'red' || u.disabled || u.escaped) return;
		if (u.posx >= exitX && u.posy <= exitY) {
			console.log(`${u.id} is escaped!`);
			u.escaped = true;
			u.disabled = true;
			const el = document.getElementById(u.id);
			if (el) el.style.display = 'none';
		}
	});
}


/* 结算页上的通关提示文字（2026-09：替代通关 alert；由 save.js 的 autosaveOnWin 调用） */
function showWinNote(text) {
	var win = document.getElementById('win');
	if (!win) return;
	var note = document.getElementById('win-note');
	if (!note) {
		note = document.createElement('p');
		note.id = 'win-note';
		note.className = 'win-note';
		win.appendChild(note);
	}
	note.textContent = text;
}

function showWinResult() {
	const win = document.getElementById('win');
	const next = document.getElementById('button-next-game');
	if (!win || !next) return;
	document.body.classList.add('result-active');
	win.style.cssText = 'display:flex; flex-direction:column; align-items:center;';
	next.style.cssText = 'display:inline-flex;';
	/* 让按钮成为战果卡片的一部分，与卡片一起在页面中央显示。 */
	if (next.parentNode !== win) win.appendChild(next);
	if (typeof applyUiTranslations === 'function') applyUiTranslations(win);
	animateVictoryStars(pendingVictoryStars);
	next.focus();
}

let pendingVictoryStars = 0;

function animateVictoryStars(count) {
	count = Math.max(1, Math.min(3, Number(count) || 1));
	['1star', '2star', '3star'].forEach(function (id) {
		const node = document.getElementById(id);
		if (node) node.style.display = 'none';
	});
	const holder = document.getElementById(String(count) + 'star');
	if (!holder) return;
	holder.innerHTML = '';
	holder.className = 'victory-stars';
	holder.style.display = 'flex';
	holder.setAttribute('aria-label', count + ' stars');
	for (let i = 0; i < count; i++) {
		const star = document.createElement('span');
		star.className = 'victory-star';
		star.textContent = '★';
		star.style.setProperty('--star-delay', (i * 430) + 'ms');
		star.setAttribute('aria-hidden', 'true');
		const dust = document.createElement('i');
		dust.className = 'victory-star__dust';
		dust.setAttribute('aria-hidden', 'true');
		star.appendChild(dust);
		holder.appendChild(star);
	}
}

function victoryReportText(star, saveResult) {
	const result = saveResult || { saved: false, openedHidden: false };
	let saveMessage = result.saved
		? gameText('victory.saved', null, '战果已自动保存到 a.save。')
		: gameText('victory.notSaved', null, '当前未登录，本次战果没有写入存档。');
	if (result.openedHidden) saveMessage += ' ' + gameText('victory.hidden', null, '历史出现了新的岔路：秘密路线已经开启。');
	return gameText('victory.summary', {
		level: (typeof CURRENT_LEVEL_ID === 'undefined' ? '?' : CURRENT_LEVEL_ID),
		stars: star,
		save: saveMessage
	}, '本关战斗结束：本次获得 ' + star + ' 星。' + saveMessage);
}

/* 通关使用与开场相同的对话引擎，避免浏览器顶部 alert。 */
function showVictoryDialogue(star, saveResult) {
	const meta = (typeof getLevelById === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined')
		? getLevelById(CURRENT_LEVEL_ID)
		: null;
	const defaults = {
		chapter: meta ? meta.chapter : '帝国战记',
		location: meta ? meta.location : '',
		scene: meta ? meta.scene : 'campaign'
	};
	let lines = (meta && Array.isArray(meta.victoryStory) ? meta.victoryStory : []).map(function (line) {
		return Object.assign({}, defaults, line);
	});
	if (!lines.length) {
		lines.push(Object.assign({}, defaults, {
			who: '拿破仑', role: '法兰西皇帝', side: 'left',
			portrait: 'img/portraits/napoleon.webp',
			text: function () { return gameText('victory.napoleon', null, '敌军已经退出战场。收拢队伍，把鹰旗带到下一条战线。'); }
		}));
	}
	lines.push(Object.assign({}, defaults, {
			who: function () { return gameText('victory.reporter', null, '战报'); },
			role: function () { return gameText('victory.role', null, '帝国统帅部'); },
			kind: 'briefing',
			text: function () { return victoryReportText(star, saveResult); },
			actionLabel: function () { return gameText('victory.viewResult', null, '查看战果'); }
		}));
	if (typeof playDialogue === 'function') playDialogue(lines, showWinResult);
	else showWinResult();
}

/* 三类关卡的胜利分支共用一个收尾，防止存档、成就和提示重复执行。 */
function completeVictory(star, quickL1) {
	const win = document.getElementById('win');
	const next = document.getElementById('button-next-game');
	if (win) win.style.display = 'none';
	if (next) {
		next.style.display = 'none';
		if (typeof CURRENT_LEVEL_ID !== 'undefined') next.dataset.target = winTargetFor(CURRENT_LEVEL_ID);
	}
	document.body.classList.remove('result-active');
	pendingVictoryStars = Math.max(1, Math.min(3, Number(star) || 1));
	hideResultAlternatives();
	let saveResult = { saved: false, openedHidden: false };
	if (typeof autosaveOnWin === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
		saveResult = autosaveOnWin(CURRENT_LEVEL_ID, star, !!quickL1) || saveResult;
	}
	if (typeof tryThreeStarAchievement === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
		tryThreeStarAchievement(CURRENT_LEVEL_ID, star);
	}
	hideMidGameControls();
	showVictoryDialogue(star, saveResult);
}
/* 终局延迟：胜负在最后一回合的 24 帧跑完时其实已经瞬间结算，
   玩家看不清"最后一击"。终局判定后先锁定操作、把棋盘留显约 1 秒，
   再执行原有的藏棋盘 + 对白/结算面板流程。 */
let outcomePending = false;
function countAliveUnits(color) {
	let n = 0;
	for (let i = 0; i < armys.length; ++i) {
		if (!armys[i].disabled && armys[i].color === color) ++n;
	}
	return n;
}
function isOutcomeTerminal(redc, bluec) {
	const obj = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.objective) || null;
	/* Game8 防线：必须守满回合；全歼敌军不提前结束（原 resolve 逻辑此时只更新提示并继续）。 */
	if (obj && obj.type === 'line_defense') {
		if (bluec === 0) return true;
		if (Number(remain_turns) <= 1) return true;
		const broke = armys.filter(function (u) { return u.color === 'red' && !!u.escaped; }).length;
		const cap = obj.loseEscape !== undefined ? obj.loseEscape : 5;
		if (broke >= cap) return true;
		return false;
	}
	if (bluec === 0) return true;
	if (Number(remain_turns) <= 1) return true;   // 本回合结算后回合耗尽
	if (redc === 0) return true;
	if (obj && obj.type === 'retreat') {
		const gotOut = armys.filter(function (u) { return u.color === 'red' && !!u.escaped; }).length;
		const cap = obj.loseEscape || 3;
		if (gotOut >= cap) return true;
	}
	return false;
}
function checkWinState() {
	const redcNow = countAliveUnits('red');
	const bluecNow = countAliveUnits('blue');
	if (isOutcomeTerminal(redcNow, bluecNow)) {
		if (outcomePending) return;
		outcomePending = true;
		// 延迟期间立即锁操作：藏下一步按钮与右坞，棋盘保留、禁止再下令
		buttonContainer.style.display = 'none';
		if (boardContainer) boardContainer.style.pointerEvents = 'none';
		hideMidGameControls();
		setTimeout(function () {
			outcomePending = false;
			if (boardContainer) {
				boardContainer.style.display = 'none';
				boardContainer.style.removeProperty('pointer-events');
			}
			resolveWinState();
		}, 1000);
		return;
	}
	resolveWinState();
}

function resolveWinState() {
	-- remain_turns;
	let redc = 0, bluec = 0;

	armys.forEach(element => {
		if(element.disabled == false) {
			if(element.color == 'red') ++ redc;
			if(element.color == 'blue') ++ bluec;
		}
	});

	/* =========================================================
	 * Game5：斯摩棱斯克·限时攻坚
	 *
	 * 按通关所用步数评星：
	 * ≤13 步：3 星
	 * 14~15 步：2 星
	 * 16~18 步：1 星
	 *
	 * 回合超过 18 步仍未消灭全部红军：失败
	 * ========================================================= */

	if(typeof CURRENT_LEVEL_ID !== 'undefined' && CURRENT_LEVEL_ID === 5) {

		const usedTurns = CURRENT_GAME.turns_limit - remain_turns;

		/* =========================
		 * 情况1：红军全部被消灭
		 * ========================= */
		if(redc === 0) {

			boardContainer.style.display = 'none';
			buttonContainer.style = 'display: none;';
			document.getElementById('footer-bar').style = 'display: none';

			/* 根据通关步数计算星级 */
			let star;

			if(usedTurns <= 13) {
				star = 3;
			}
			else if(usedTurns <= 15) {
				star = 2;
			}
			else {
				star = 1;
			}

			/* 显示星星 */
			if(star === 1) {
				const winState = document.getElementById('1star');
				if(winState) winState.style.display = '';
			}
			else if(star === 2) {
				const winState = document.getElementById('2star');
				if(winState) winState.style.display = '';
			}
			else {
				const winState = document.getElementById('3star');
				if(winState) winState.style.display = '';
			}

			completeVictory(star, false);

			return;
		}

		/* =========================
		 * 情况2：我军全部阵亡
		 * ========================= */
		if(bluec === 0) {

			finishDefeat();

			const tip = document.getElementById('loseTips');

			if(tip) {
				tip.style = '';
				registerLevelDefeat(localizedText(
					'我军全部阵亡，斯摩棱斯克攻坚失败。',
					'Our army has been destroyed; the assault on Smolensk has failed.'
				));
			}

			return;
		}

		/* =========================
		 * 情况3：18步结束仍未消灭红军
		 * ========================= */
		if(remain_turns <= 0) {

			finishDefeat();

			const tip = document.getElementById('loseTips');

			if(tip) {
				tip.style = '';
				registerLevelDefeat(localizedText(
					'18回合已经结束，仍有 ' + redc + ' 支敌军存活，攻坚失败。',
					'Eighteen turns have ended with ' + redc + ' enemy units still alive; the assault has failed.'
				));
			}

			hideMidGameControls();

			return;
		}

		/* =========================
		 * Game5 尚未结束：只更新"剩余 / 已用回合"文案，不重开战局。
		 * ⚠️ B11a：这里以前把一句硬编码英文写进 innerHTML，
		 * 中文模式下第 5 关页脚会突然冒出 "You have 17 turns left. Used: 1 turns."。
		 * 现在走公共的 gameText()，中 / 繁 / 英三语各自渲染，语言切换也会重画。
		 * ⚠️ 同时把 footerMode 置为 'turn'：语言切换时 renderFooterStatus() 要按同一模式重画，
		 * 否则切一次语言这句就被覆盖成空。 */
		footerMode = 'turn';
		renderFooterStatus();

		return;
	}

	// 计算红蓝色棋子数量


	/* ============================================================
	 * Game8 新增：红线拦截战
	 *
	 * 这里只新增，不删除也不修改原来的 defense 逻辑。
	 *
	 * 规则：
	 *   0 个敌军突破红线 -> 3 星
	 *   1~2 个敌军突破   -> 2 星
	 *   3~4 个敌军突破   -> 1 星
	 *   5 个及以上突破   -> 失败
	 *
	 * 突破的敌军使用 escaped 标记统计。
	 * ============================================================ */

	const lineDefenseObj =
		(typeof CURRENT_GAME !== 'undefined' &&
		 CURRENT_GAME &&
		 CURRENT_GAME.objective &&
		 CURRENT_GAME.objective.type === 'line_defense')
			? CURRENT_GAME.objective
			: null;

	if(lineDefenseObj) {

		/*
		 * 当前已经突破红线的敌军数量
		 *
		 * 注意：
		 * 突破的敌军已经 disabled，
		 * 因此不能通过 redc 统计，
		 * 必须通过 escaped 统计。
		 */
		const breakthroughCount =
			armys.filter(function(u) {
				return u.color === 'red' && !!u.escaped;
			}).length;


		const loseEscape =
			lineDefenseObj.loseEscape !== undefined
				? lineDefenseObj.loseEscape
				: 5;


		/* ========================================
		 * 情况1：
		 * 敌军突破人数达到失败阈值
		 * ======================================== */

		if(breakthroughCount >= loseEscape) {

			boardContainer.style.display = 'none';

			buttonContainer.style = 'display: none;';

			document.getElementById('footer-bar').style =
				'display: none';

			document.getElementById('lose').style =
				'display: flex; flex-direction: column; align-items: center;';

			document.getElementById('button-replay').style =
				'width: 100px; height: 50px;';

			moveMenuIntoResultArea();


			const failBtn =
				document.getElementById('button-fail');

			if(failBtn) {

				failBtn.style.cssText =
					'width:auto; margin-top:8px;';

				if(CURRENT_LEVEL_ID === 7) {

					failBtn.dataset.target =
						'destiny-fail.html';

					failBtn.textContent =
						'View Ending: Destined to fail';

				} else {

					failBtn.dataset.target =
						'fail.html';

					failBtn.textContent =
						'View Ending: Early Defeat';
				}
			}


			const tip =
				document.getElementById('loseTips');

			if(tip) {

				tip.style = '';

				registerLevelDefeat(localizedText(
					'防线已经失守！共有 ' + breakthroughCount + ' 支敌军突破红线。',
					'The line has fallen: ' + breakthroughCount + ' enemy units broke through.'
				));
			}


			hideMidGameControls();

			return;
		}


		/* ========================================
		 * 情况2：
		 * 我军全部阵亡
		 * ======================================== */

		if(bluec === 0) {

			boardContainer.style.display = 'none';

			buttonContainer.style = 'display: none;';

			document.getElementById('footer-bar').style =
				'display: none';

			document.getElementById('lose').style =
				'display: flex; flex-direction: column; align-items: center;';


			const tip =
				document.getElementById('loseTips');

			if(tip) {

				tip.style = '';
				registerLevelDefeat(localizedText(
					'最后防线已经失守，我军全部阵亡。',
					'The final line has fallen and all of our units have been destroyed.'
				));
			}


			hideMidGameControls();

			return;
		}


		/* ========================================
		 * 情况3：
		 * 12 回合结束
		 *
		 * 注意：
		 * checkWinState() 开头已经执行：
		 *
		 *     --remain_turns;
		 *
		 * 所以这里使用 <= 0。
		 * ======================================== */

		if(remain_turns <= 0) {

			boardContainer.style.display = 'none';

			buttonContainer.style = 'display: none;';

			document.getElementById('footer-bar').style =
				'display: none';

			/* 根据突破人数计算星级 */

			let star;

			if(breakthroughCount === 0) {

				star = 3;

			} else if(breakthroughCount <= 2) {

				star = 2;

			} else {

				star = 1;
			}


			/* 显示星星 */

			if(star === 1) {

				const winState =
					document.getElementById('1star');

				if(winState) {
					winState.style.display = '';
				}

			} else if(star === 2) {

				const winState =
					document.getElementById('2star');

				if(winState) {
					winState.style.display = '';
				}

			} else {

				const winState =
					document.getElementById('3star');

				if(winState) {
					winState.style.display = '';
				}
			}


			/* Game8 如果存在专用结算文字 */

			const defenseStars =
				document.getElementById('defense-stars');

			if(defenseStars) {

				if(star === 3) {

					defenseStars.innerText =
						'★★★';

				} else if(star === 2) {

					defenseStars.innerText =
						'★★☆';

				} else {

					defenseStars.innerText =
						'★☆☆';
				}
			}


			const winDetail =
				document.getElementById('win-detail');

			if(winDetail) {

				winDetail.innerText =
					'防守成功！共有 ' +
					breakthroughCount +
					' 支敌军突破红线。';
			}


			/* 保持原有存档逻辑 */

			const usedTurns =
				(typeof CURRENT_GAME !== 'undefined' &&
				 CURRENT_GAME &&
				 CURRENT_GAME.turns_limit)
					? CURRENT_GAME.turns_limit - remain_turns
					: 99;

			const quickL1 =
				usedTurns <= 12;


			completeVictory(star, quickL1);

			return;
		}


		/* ========================================
		 * Game8 尚未结束
		 * ======================================== */

		const footer =
			document.getElementById('footer-bar');

		if(footer) {

			footer.innerHTML =
				'守住最后防线！剩余 ' +
				remain_turns +
				' 回合 · 已突破 ' +
				breakthroughCount +
				' 人。';
		}


		/*
		 * 非常重要：
		 * Game8 到这里直接 return。
		 *
		 * 这样下面原本属于其他关卡的
		 * redc / retreat / remain_turns
		 * 判断不会干扰 Game8。
		 */

		return;
	}


	/* =========================================================
	 * 以下全部保持原来的 Game1~Game7 代码
	 * ========================================================= */

	// 追逐战（第 4 关）特殊结算：按"逃脱数"给星；逃脱≥loseEscape 判负
	const retreatObj = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.objective &&
		CURRENT_GAME.objective.type === 'retreat') ? CURRENT_GAME.objective : null;
	const retreat = !!retreatObj;
	const retreatLose = retreatObj ? (retreatObj.loseEscape || 3) : 99;
	const escaped = armys.filter(u => u.color === 'red' && !!u.escaped).length;

	if(redc == 0 && !(retreat && escaped >= retreatLose)) {
		// 没有红棋则获胜，根据剩余蓝棋数量给出星级（追逐战按逃脱数）
		boardContainer.style.display = 'none';
		buttonContainer.style = 'display: none;';
		document.getElementById('footer-bar').style = 'display: none';
		// 加载胜利界面
		const star = retreat ? [3, 2, 1][Math.min(escaped, 2)] : ((bluec == 0) ? 1 : (bluec == 1) ? 2 : 3);
		if(star == 1) {
			const winState = document.getElementById('1star');
			winState.style.display = '' ;
		} else if(star == 2) {
			const winState = document.getElementById('2star');
			winState.style.display = '' ;
		} else {
			const winState = document.getElementById('3star');
			winState.style.display = '' ;
		}
		// 通关自动存档（to-do #2/#3/#14）：记星级、解锁下一关、清掉快照；第 1 关 ≤12 回合通关开隐藏路线
		const usedTurns = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.turns_limit)
			? CURRENT_GAME.turns_limit - remain_turns
			: 99;
		const quickL1 = usedTurns <= 12;
		completeVictory(star, quickL1);
		return ;
	}

	if((retreat && escaped >= retreatLose) || bluec == 0 || remain_turns == 0) {
		// 追逐战逃脱数超限 / 蓝方全灭 / 回合耗尽：判负（收尾统一走 finishDefeat）
		finishDefeat();
		let tip = loseTips[Math.floor(Math.random() * loseTips.length)]
		if (CURRENT_LEVEL_ID === 7) tip = '……帝国第二次折戟于此，命运没有给历史第二次机会。';
		document.getElementById('loseTips').style = '';
		registerLevelDefeat(tip);
		return ;
	}

	footerMode = 'turn';
	renderFooterStatus();
	/* 加载剩余回合数 */
}

/* 判断"这一步按下去等于空转"：没有任何单位还要走、也没有任何单位在敌方射程内。
 * 用于在消耗回合【之前】提醒玩家，避免新手没选兵就点下一步、白白丢一回合
 * （审查报告"体验建议 3"：提示应发生在消耗回合之前）。
 * 判定故意保守：只要有一个单位还有未走完的目标，或已有任何单位处在交火中，就返回 false。 */
function wouldTurnBeIdle() {
	if (typeof armys === 'undefined' || !armys.length) return false;
	const alive = armys.filter(function (u) { return !u.disabled; });
	if (!alive.length) return false;

	const stillMoving = alive.some(function (u) {
		return Math.hypot((Number(u.targetx) || 0) - u.posx, (Number(u.targety) || 0) - u.posy) > eps;
	});
	if (stillMoving) return false;

	const engaged = alive.some(function (u) {
		return alive.some(function (other) {
			if (other.color === u.color) return false;
			return calcdis(u, other) < unitCombatRange(u);
		});
	});
	return !engaged;
}

/* 会话内只提醒一次：玩家明确选择"静观其变"之后，本关内不再反复打扰。
 * 诱敌、防守、第三关开场整队等场景都需要合理地"等一回合"。 */
let idleTurnWarned = false;

buttonContainer.addEventListener('click', function() {
	/* ⚠️ B08：真模态期间禁止推进回合。Enter 的全局守卫只拦键盘，
	 * 挡不住"焦点留在背景按钮上被空格/回车原生激活"等其它触发路径。 */
	if (document.querySelector('.ui-modal-mask, .dialog-overlay, .level-intro-image-overlay')) return;
	/* 体验建议 3：空转的回合在执行前先提醒一次（不禁止等待，只提醒）。 */
	if (!idleTurnWarned && typeof modalConfirm === 'function' && wouldTurnBeIdle()) {
		const warn = gameText('game.idleTurnWarn',
			null,
			'本回合我方没有任何待执行的命令，双方也尚未交火 —— 直接推进会白白消耗一回合。要静观其变吗？');
		idleTurnWarned = true;   // 先置位，避免玩家连点造成弹窗叠加
		modalConfirm(warn, function () { runOneTurn(); }, {
			okText: gameText('game.idleTurnWait', null, '静观其变'),
			cancelText: gameText('common.cancel', null, '取消')
		});
		return;
	}
	runOneTurn();
});

/* ⚠️ E1：连点保护必须是**同步重入锁**。
 * 以前只在回合末尾写 `this.disabled = true; setTimeout(..., 300)` ——
 * 而 disabled 只拦得住"浏览器原生触发的点击"，拦不住程序化 click()，
 * 而且 300ms 窗口之后的点击照样生效，终局后的 1 秒延迟期也没有守卫。
 * 实测：同一个 JS tick 里连点 8 次会一次性消耗 7 个回合。
 * 现在用一个同步标志位：一回合的 24 帧是同步跑完的，锁在整个执行期间有效，
 * 因此任何重入（连点 / 回车连按 / 触控板双击）都会在入口被挡掉。 */
let turnRunning = false;

/* 真正执行一个回合（24 帧）。从按钮点击里抽出来，供"静观其变"确认后复用。 */
function runOneTurn() {
	/* 守卫一：真模态 / 剧情遮罩期间不推进。 */
	if (document.querySelector('.ui-modal-mask, .dialog-overlay, .level-intro-image-overlay')) return;
	/* 守卫二：终局已判定、正在播结算延迟时不推进。 */
	if (typeof outcomePending !== 'undefined' && outcomePending) return;
	/* 守卫三：已经开始结算（棋盘已藏）时不推进。 */
	if (boardContainer && boardContainer.style.display === 'none') return;
	/* 守卫四：同步重入锁（连点保护）。 */
	if (turnRunning) return;
	turnRunning = true;
	const turnBtn = buttonContainer;
	try {
	rememberTurnForUndo();
	const redCountBefore = aliveUnitCount('red');
	const escapedBefore = armys.filter(function (u) { return u.color === 'red' && u.escaped; }).length;
	const unitStatesBefore = armys.map(function (unit) {
		return { id: unit.id, x: unit.posx, y: unit.posy, lp: Number(unit.lp) || 0 };
	});
	// 点击按钮时推进 24 '帧'
	clearDisable();

	// to-do #9：回合开始前按关卡策略给红方重设一次方向（一回合内不再变）
	if (typeof applyEnemyAI === 'function') {
		applyEnemyAI();
	}

	const movingCounts = 24;

	for(let i = 0; i < movingCounts; ++ i) {

		nextStep();

		processTurnEscapes();

		/*
		 * ====================================================
		 * Game8 新增：
		 * 每一帧检查红军是否已经越过红线
		 *
		 * Game8 中由 game8.js 提供
		 * processLineBreakthroughs()
		 * ====================================================
		 */
		if(typeof processLineBreakthroughs === 'function') {
			processLineBreakthroughs();
		}
	}
	// 开火特效（2026-09）：24 帧结算完后，给本回合开过火的单位统一生成烟雾 / 枪口火光
	if (typeof fxFlush === 'function') fxFlush();
	const anyUnitMoved = unitStatesBefore.some(function (before) {
		const unit = armys.find(function (item) { return item.id === before.id; });
		return unit && (Math.abs(unit.posx - before.x) > eps || Math.abs(unit.posy - before.y) > eps);
	});
	const anyUnitDamaged = unitStatesBefore.some(function (before) {
		const unit = armys.find(function (item) { return item.id === before.id; });
		return unit && (Number(unit.lp) || 0) < before.lp - eps;
	});
	/* ⚠️ B07：战意只统计【真正被击杀】的红军。
	 * 以前用"存活红军数之差"当歼敌数，而撤退/突破的单位同样被置 disabled 并移出棋盘，
	 * 于是第 4 关红方撤走也会弹出"歼敌 N 支"、白送战意攻击加成。
	 * 现在把"击杀""撤离/突破"分开统计：撤离只计入失败条件，不给任何奖励。 */
	const escapedNow = armys.filter(function (u) { return u.color === 'red' && u.escaped; }).length;
	const redEscapedThisTurn = Math.max(0, escapedNow - escapedBefore);
	const redDefeatedThisTurn = Math.max(0, redCountBefore - aliveUnitCount('red') - redEscapedThisTurn);
	updateBattleMomentum(redDefeatedThisTurn);

	// 防止误触造成多次触发：按钮短暂禁用只作视觉反馈，
	// 真正的连点保护是上面的 turnRunning 同步锁。
	buttonContainer.disabled = true;
	const reEnableTurnButton = function () { buttonContainer.disabled = false; };
	setTimeout(reEnableTurnButton, 300);

	checkWinState();

	renderInfoPanel();
	renderEnemyPanel();
	renderArmyRosters();
	updateRangePositions();
	renderOrderArrows();
	renderUndoButton();
	renderBattleStatus();
	if (!anyUnitMoved && !anyUnitDamaged && boardContainer.style.display !== 'none') {
		const message = gameText('game.noMovement', null, '本回合没有任何部队机动。请先下达移动命令，或确认双方已经进入交火。');
		if (typeof modalNotice === 'function') modalNotice(message);
		else if (typeof toast === 'function') toast(message);
	}
	} finally {
		/* 无论中途因什么返回，锁都必须释放，否则玩家会彻底无法推进回合。 */
		turnRunning = false;
		/* 若这一回合被终局流程隐藏了战场，就别再把按钮点亮。 */
		if (boardContainer && boardContainer.style.display !== 'none') {
			buttonContainer.disabled = false;
		}
	}
}

/* ========== to-do #4：选中集合 + 画框多选 ========== */
let selectedPieces = new Array();        // 当前选中的（蓝方）军队，元素为 armys 里的对象
const selectionListeners = new Array();  // #5 左侧显示条等可挂监听，选中变化时收到通知

function getSelection() { return selectedPieces; }

function addSelectionListener(fn) {
	selectionListeners.push(fn);
}

function fireSelectionChanged() {
	selectionListeners.forEach(fn => {
		try {
			fn();
		} catch (e) {
			/* 忽略单个监听器的错误 */
		}
	});
}

// 按当前选中集合刷新所有棋子的高亮
function refreshSelectedUI() {
	clearHoverMatches();
	document.querySelectorAll('.chess.selected').forEach(el => el.classList.remove('selected'));
	selectedPieces.forEach(p => {
		const el = document.getElementById(p.id);
		if (el) el.classList.add('selected');
	});
	/* 选中集合改变时终止上一条鼠标预览；下一次移动鼠标会从新选中的部队
	 * 展开一条完整军令箭头，避免旧箭头残留在棋盘上。 */
	if (typeof clearOrderPreview === 'function') clearOrderPreview();
	if (boardContainer) boardContainer.classList.toggle('is-order-aiming', selectedPieces.length > 0);
	fireSelectionChanged();
}

function clearSelection() {
	selectedPieces = [];
	refreshSelectedUI();
}

function selectOnly(pieceData) {
	selectedPieces = [pieceData];
	refreshSelectedUI();
}

function toggleSelect(pieceData) {
	const i = selectedPieces.indexOf(pieceData);
	if (i >= 0) selectedPieces.splice(i, 1);
	else selectedPieces.push(pieceData);
	refreshSelectedUI();
}

function selectMany(list) {
	selectedPieces = list.slice();
	refreshSelectedUI();
}

function removeFromSelection(pieceData) {
	const i = selectedPieces.indexOf(pieceData);
	if (i >= 0) selectedPieces.splice(i, 1);
	refreshSelectedUI();
}

function isAliveBlue(pieceData) {
	return !!pieceData && pieceData.color === 'blue' && !pieceData.disabled;
}

// 给当前所有选中军队下令移动到 (targetX, targetY)（格坐标）。
// 下令后清空选中：避免残留选中导致再次渲染预览箭头（常驻蓝色箭头仍保留，它与选中无关）
function issueMoveTo(targetX, targetY, followTarget) {
	/* ⚠️ B04：下令入口统一夹进棋盘合法范围。
	 * 鼠标点最外圈会算出贴近 ±0.5 的坐标（本来就是合法范围），
	 * 但"跟随友军"那条路径传的是另一名棋子的实际坐标，单位在盘外时也要收住。 */
	selectedPieces.forEach(p => {
		const bounded = clampToBoardBounds(Number(targetX), Number(targetY));
		p.targetx = bounded.x;
		p.targety = bounded.y;
		p.followTargetId = followTarget && !followTarget.disabled ? followTarget.id : '';
	});

	hideArrow();
	clearOrderPreview();
	clearSelection();
	renderOrderArrows();   // to-do #11：常驻指示箭头随之更新
}

/* ---------- 鼠标交互：单击选棋 / 点空地移动 / 拖拽画框多选 ---------- */
let dragBoxState = null;   // { x0, y0, pieceEl, moved }

function getBoxEl() {
	let el = document.getElementById('boxSel');
	if (!el) {
		el = document.createElement('div');
		el.id = 'boxSel';
		boardContainer.appendChild(el);
	}
	return el;
}

function hideBox() {
	const el = document.getElementById('boxSel');
	if (el) el.style.display = 'none';
}

function updateBox(x1, y1) {
	const rect = boardContentRect();
	const el = getBoxEl();
	const left = Math.min(dragBoxState.x0, x1) - rect.left;
	const top = Math.min(dragBoxState.y0, y1) - rect.top;
	const right = Math.max(dragBoxState.x0, x1) - rect.left;
	const bottom = Math.max(dragBoxState.y0, y1) - rect.top;
	el.style.left = left + 'px';
	el.style.top = top + 'px';
	el.style.width = (right - left) + 'px';
	el.style.height = (bottom - top) + 'px';
	el.style.display = 'block';
}

/* 棋盘上右键用于拖拽框选，屏蔽原生右键菜单（棋盘外不受影响）。 */
boardContainer.addEventListener('contextmenu', function (e) { e.preventDefault(); });

boardContainer.addEventListener('mousedown', function (e) {
	/* 左键 / 右键都可以起框；右键框选不影响左键的单击下令语义。 */
	if ((e.button !== 0 && e.button !== 2) || dragBoxState) return;
	e.preventDefault();   // 阻止拖拽时选中文本
	window.addEventListener('mousemove', onWindowDragMove);
	window.addEventListener('mouseup', onWindowDragUp);
	dragBoxState = {
		x0: e.clientX,
		y0: e.clientY,
		pieceEl: e.target.closest('.chess') || null,
		moved: false,
		button: e.button
	};
	hideArrow();
});

/* 把客户端坐标夹到棋盘内容矩形内：鼠标拖出棋盘后框选不失效。 */
function clampPointToBoard(clientX, clientY) {
	const rect = boardContentRect();
	return {
		x: Math.min(Math.max(clientX, rect.left), rect.right),
		y: Math.min(Math.max(clientY, rect.top), rect.top + rect.height)
	};
}

/* 拖拽期间 move/up 挂在 window 上：移出棋盘甚至移出窗口边缘，框选都能继续并正常收尾。 */
function onWindowDragMove(e) {
	if (!dragBoxState) return;
	if (dragBoxState.button === 2) e.preventDefault();
	const p = clampPointToBoard(e.clientX, e.clientY);
	const dx = p.x - dragBoxState.x0, dy = p.y - dragBoxState.y0;
	if (!dragBoxState.moved && dx * dx + dy * dy > 25) {
		dragBoxState.moved = true;
		document.body.classList.add('is-box-dragging');
	}
	if (dragBoxState.moved) updateBox(p.x, p.y);
}

function onWindowDragUp(e) {
	/* 先无条件摘监听 / 清光标态：棋盘内松手时 board 的 mouseup 先冒泡并已把 dragBoxState 置空，
	   若先判空 return，window 上的两个监听会随每次点击泄漏。 */
	window.removeEventListener('mousemove', onWindowDragMove);
	window.removeEventListener('mouseup', onWindowDragUp);
	document.body.classList.remove('is-box-dragging');
	if (!dragBoxState) return;
	const rect = boardContentRect();
	const inside = e.clientX >= rect.left && e.clientX <= rect.right
		&& e.clientY >= rect.top && e.clientY <= rect.top + rect.height;

	if (dragBoxState.moved && !inside) {
		/* 在棋盘外松手：board 自己的 mouseup 不会触发，由这里完成框选（坐标已夹取）。 */
		const st = dragBoxState;
		dragBoxState = null;
		hideBox();
		clearOrderPreview();
		const p = clampPointToBoard(e.clientX, e.clientY);
		const left = Math.min(st.x0, p.x), right = Math.max(st.x0, p.x);
		const top = Math.min(st.y0, p.y), bottom = Math.max(st.y0, p.y);
		const inBox = armys.filter(function (pp) {
			if (viewMode === 'enemy' ? !isAliveRed(pp) : !isAliveBlue(pp)) return false;
			const el = document.getElementById(pp.id);
			if (!el) return false;
			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
			return cx >= left && cx <= right && cy >= top && cy <= bottom;
		});
		if (viewMode === 'enemy') selectEnemyMany(inBox);
		else selectMany(inBox);
		return;
	}

	if (!dragBoxState.moved && !inside) {
		/* 棋盘外松手且没有形成拖拽：取消本次按下，避免状态悬挂。 */
		dragBoxState = null;
		hideBox();
		clearOrderPreview();
	}
	/* 棋盘内松手时，board 的 mouseup（冒泡先于 window）已经处理完单击/框选。 */
}

/* Esc / 异常中断时统一摘掉 window 监听与拖拽态。 */
function cancelBoxDrag() {
	window.removeEventListener('mousemove', onWindowDragMove);
	window.removeEventListener('mouseup', onWindowDragUp);
	document.body.classList.remove('is-box-dragging');
	dragBoxState = null;
	hideBox();
}

/* 右键拖拽期间阻止浏览器右键菜单（普通右键单击不受影响——没有起框时不拦截）。 */
window.addEventListener('contextmenu', function (e) {
	if (dragBoxState && dragBoxState.button === 2) e.preventDefault();
});

boardContainer.addEventListener('mousemove', function (e) {
	if (dragBoxState) {
		const dx = e.clientX - dragBoxState.x0, dy = e.clientY - dragBoxState.y0;
		if (!dragBoxState.moved && dx * dx + dy * dy > 25) {
			dragBoxState.moved = true;
		}

		if (dragBoxState.moved) {
			updateBox(e.clientX, e.clientY);
		}

		return;
	}

	// 非拖拽：给"当前所有已选蓝方"画预览箭头（敌人查看模式不预览）
	if (viewMode === 'enemy') {
		clearOrderPreview();
		return;
	}

	renderOrderPreview(e);
});

boardContainer.addEventListener('mouseup', function (e) {
	if (!dragBoxState) return;

	const st = dragBoxState;
	dragBoxState = null;

	if (e.button === 2 && !st.moved) { hideBox(); clearOrderPreview(); return; }
	clearOrderPreview();   // 一旦点击/松手，预览箭头消失

	if (st.moved) {
		// 画框多选：指挥模式=存活蓝方；查看敌人模式=存活红方
		hideBox();

		const left = Math.min(st.x0, e.clientX), right = Math.max(st.x0, e.clientX);
		const top = Math.min(st.y0, e.clientY), bottom = Math.max(st.y0, e.clientY);

		const inBox = armys.filter(p => {
			if (viewMode === 'enemy' ? !isAliveRed(p) : !isAliveBlue(p)) return false;

			const el = document.getElementById(p.id);
			if (!el) return false;

			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2, cy = r.top + r.height / 2;

			return cx >= left && cx <= right && cy >= top && cy <= bottom;
		});

		if (viewMode === 'enemy') {
			selectEnemyMany(inBox);
		} else {
			selectMany(inBox);
		}

		return;
	}

	// 单击语义
	if (st.pieceEl) {

		const pieceData =
			armys.find(p => p.id === st.pieceEl.id);

		if (viewMode === 'enemy') {

			// 查看敌人模式：单击/加减选红方；点蓝方或空地 = 清空敌方选中
			if (isAliveRed(pieceData)) {

				if (e.ctrlKey || e.shiftKey) {
					toggleEnemy(pieceData);
				}
				else {
					selectEnemyOnly(pieceData);
				}

			} else {

				clearEnemies();
			}

			return;
		}

		if (isAliveBlue(pieceData)) {

			if (e.ctrlKey || e.shiftKey) {

				toggleSelect(pieceData);          // Ctrl/Shift + 单击：加减选中
				return;

			}

			if (selectedPieces.length === 0) {

				selectOnly(pieceData);            // 没有任何选中时，单击=选中它
				return;

			}

			if (selectedPieces.length === 1) {

				// 已有单个选中：点自己=原地待命；点其它单位=让它移动到该单位的位置（原逻辑）
				issueMoveTo(pieceData.posx, pieceData.posy, pieceData);
				return;

			}

			selectOnly(pieceData);                // 多选状态下点某蓝兵：切换为只选它
			return;
		}

		// 点到红方/死亡单位：指挥模式下当作在该格下令
	}

	// 点空白处或敌军：给当前所有选中军队下令移动（仅指挥模式）。
	if (viewMode === 'enemy' || selectedPieces.length === 0) return;
	const clickedTarget = st.pieceEl
		? armys.find(function (unit) { return unit.id === st.pieceEl.id && !unit.disabled; })
		: null;
	if (clickedTarget && clickedTarget.color === 'red') {
		issueMoveTo(clickedTarget.posx, clickedTarget.posy, clickedTarget);
		return;
	}

	const rect = boardContentRect();

	const targetX =
		Math.max(
			0,
			Math.min(
				e.clientX - rect.left,
				boardContainer.clientWidth
			)
		);

	const targetY =
		Math.max(
			0,
			Math.min(
				e.clientY - rect.top,
				boardContainer.clientHeight
			)
		);

	issueMoveTo(
		getPosByCell(targetX),
		getPosByCell(targetY),
		null
	);
});

boardContainer.addEventListener('mouseleave', function () {
	/* 拖拽框选中离开棋盘：不取消，交给 window 上的监听继续跟踪与收尾。 */
	if (dragBoxState) return;
	if (dragBoxState) {
		dragBoxState = null;
		hideBox();
	}

	if (isArrowVisible) hideArrow();

	clearOrderPreview();
});

document.getElementById('button-replay').addEventListener('click', () => {
	/* 重玩是“立即重开战斗”，不再重复剧情、简报和第一关教程图。
	 * replay 参数只使用一次；新页面消费后会立刻从地址栏清掉。 */
	const replayUrl = new URL(window.location.href);
	replayUrl.searchParams.delete('resume');
	replayUrl.searchParams.set('replay', '1');
	window.location.href = replayUrl.toString();
})

/* to-do #13/#14：失败后跳转对应结局页（game7 失败 -> destiny-fail.html，其余 -> fail.html） */
const _failGo = document.getElementById('button-fail');

if (_failGo) {
	_failGo.addEventListener('click', function () {
		window.location.href =
			_failGo.dataset.target || 'fail.html';
	});
}

/* to-do #3：关卡内 Save/Load（目标可选 a.save 或 存档1/2/3）+ 返回主界面 */
function selectedTarget() {
	const sel = document.getElementById('slot-select');
	if (sel && isFileId(sel.value)) return String(sel.value);
	return AUTO_ID;
}

document.getElementById('button-save').addEventListener('click', function () {
	const user = currentUserSafe();
	if (!user) {
		if (typeof toast === 'function') toast(gameText('save.needLogin', null, '未登录：请先回主界面登录，再来保存'));
		return;
	}
	if (typeof CURRENT_LEVEL_ID === 'undefined') return;
	const id = selectedTarget();
	const snap = captureSnapshot();
	if (!snap) return;
	const cur = (id === AUTO_ID) ? getAuto(user) : getManual(user, id);

	function doSave() {
		const ok = (id === AUTO_ID) ? saveSnapshotToAuto(user, snap) : saveToManual(user, id, snap);
		if (ok) {
			if (typeof toast === 'function') toast(gameText('save.savedTo', { name: fileName(id) }, '已保存到 ' + fileName(id)));
			refreshSlotSelect();
		}
	}

	if (cur && cur.snapshot) {
		const ask = '覆盖 ' + fileName(id) + ' 里的中途存档（第 ' + cur.snapshot.level + ' 关）？';
		if (typeof modalConfirm === 'function') { modalConfirm(ask, doSave); return; }
		if (!confirm(ask)) return;
	}
	doSave();
});

document.getElementById('button-load').addEventListener('click', function () {
	const user = currentUserSafe();
	if (!user) {
		if (typeof toast === 'function') toast(gameText('load.needLogin', null, '未登录'));
		return;
	}
	const id = selectedTarget();
	let snap;

	if (id === AUTO_ID) {
		snap = autoSnapshot(user);
		if (!snap) {
			if (typeof toast === 'function') toast(gameText('load.noSnapshot', { name: fileName(id) }, fileName(id) + ' 里没有中途存档'));
			return;
		}
	} else {
		const f = getManual(user, id);
		if (!f || !f.snapshot) {
			if (typeof toast === 'function') toast(gameText('load.noSnapshot', { name: fileName(id) }, fileName(id) + ' 里没有中途存档'));
			return;
		}
		snap = f.snapshot;
	}

	if (Number(snap.level) !== CURRENT_LEVEL_ID) {
		const msg = gameText('load.wrongLevel', { from: snap.level, to: CURRENT_LEVEL_ID }, '该存档属于第 ' + snap.level + ' 关，当前在第 ' + CURRENT_LEVEL_ID + ' 关，不能在这里读取（请回主界面“载入”后，再进入对应关继续）');
		if (typeof modalNotice === 'function') modalNotice(msg); else alert(msg);
		return;
	}

	/* ⚠️ B01：手动档覆盖活动档必须与"恢复棋盘"一起放进确认成功的 doLoad()。
	 * 以前这里在弹确认框【之前】就调 loadManualToAuto()，而 save.js 内部直接 putAuto，
	 * 于是"取消""Esc""点遮罩"都已经把较新的活动档换成旧档了。 */
	const ask = gameText('load.confirm', { name: fileName(id), level: snap.level, turns: snap.remain_turns }, '读取 ' + fileName(id) + '（第 ' + snap.level + ' 关，剩 ' + snap.remain_turns + ' 回合）会覆盖当前未保存进度，继续？');
	function doLoad() {
		if (id !== AUTO_ID) { loadManualToAuto(user, id); }
		loadSnapshot(snap);
	}
	if (typeof modalConfirm === 'function') { modalConfirm(ask, doLoad); return; }
	if (!confirm(ask)) return;
	doLoad();
});

document.getElementById('button-exit').addEventListener('click', function () {
	window.location.href = 'menu.html';
});

/* 结算页的 Next 跳转
 *   · 目标在进入结算页时由 checkWinState() 算好并写在 #button-next-game 的 data-target 上：
 *       第 7 关通关 → hidden-end.html；下一关是结局页（第 6 关 → end-game.html）→ 直接进结局；
 *       下一关是关卡（第 1~5 关）→ menu.html?unlock=<刚通关的关号>，主界面地图会播"路线解锁"动画，
 *       再由玩家点地图上的下一个标记进入（不再直接跳进下一关）。
 *   · "下一关是不是结局"仍以 levels.js 的 nextLevelFile() 为准，不在这里写死。 */
document.getElementById('button-next-game').addEventListener('click', function () {
	window.location.href = this.dataset.target || 'menu.html';
});

async function showRedEffect(){

	armys.forEach(element => {

		if(element.color == 'red') {

			document.getElementById(element.id)
				.classList.add('highlighted');
		}
	});

	setTimeout(() => {

		armys.forEach(element => {

			if(element.color == 'red') {

				document.getElementById(element.id)
					.classList.remove('highlighted');
			}
		});

		setTimeout(() => {

			armys.forEach(element => {

				if(element.color == 'red') {

					document.getElementById(element.id)
						.classList.add('highlighted');
				}
			});

			setTimeout(() => {

				armys.forEach(element => {

					if(element.color == 'red') {

						document.getElementById(element.id)
							.classList.remove('highlighted');
					}
				});

			}, 1000);

		}, 1000);

	}, 1000);
}

window.addEventListener('load', showRedEffect);

/* ========== to-do #5：左侧显示条 ========== */

const UNIT_NAME_MAP = {
	'步': '步兵',
	'炮': '炮兵',
	'骑': '骑兵',
	'散': '散兵',
	'掷': '掷弹兵'
};
const UNIT_NAME_KEYS = {
	'步': 'unit.infantry', '炮': 'unit.artillery', '骑': 'unit.cavalry',
	'散': 'unit.skirmisher', '掷': 'unit.grenadier'
};

function unitDisplayName(p) {
	const fallback = UNIT_NAME_MAP[p.cls] || p.cls || p.img || '?';
	const key = UNIT_NAME_KEYS[p.cls];
	return key ? gameText(key, null, fallback) : gameContent(fallback);
}

/* 两侧常驻战斗序列：始终展示双方存活棋子的名称与简要血量。
 * 原 #info-bar / #enemy-info 继续承担选中后的详细属性，因此不会牺牲原有查看功能。 */
function ensureArmyRoster(side) {
	const id = side === 'blue' ? 'ally-roster' : 'enemy-roster';
	let roster = document.getElementById(id);
	if (roster) return roster;
	roster = document.createElement('aside');
	roster.id = id;
	roster.className = 'army-roster army-roster--' + side;
	roster.setAttribute('aria-live', 'polite');
	document.body.appendChild(roster);
	return roster;
}

function renderArmyRosters() {
	if (!boardContainer || !Array.isArray(armys)) return;
	['blue', 'red'].forEach(function (side) {
		const roster = ensureArmyRoster(side);
		roster.style.removeProperty('display');
		roster.innerHTML = '';
		const list = armys.filter(function (unit) { return unit.color === side && !unit.disabled; });
		const heading = document.createElement('div');
		heading.className = 'army-roster__heading';
		heading.textContent = gameText(side === 'blue' ? 'game.allyRoster' : 'game.enemyRoster', null, side === 'blue' ? '我方序列' : '敌方序列') + ' · ' + list.length;
		roster.appendChild(heading);
		list.forEach(function (unit) {
			const sequence = armys.filter(function (candidate) {
				return candidate.color === unit.color && candidate.cls === unit.cls && armys.indexOf(candidate) <= armys.indexOf(unit);
			}).length;
			const row = document.createElement('button');
			row.type = 'button';
			const rosterSelected = side === 'blue'
				? selectedPieces.indexOf(unit) >= 0
				: selectedEnemies.indexOf(unit) >= 0;
			row.className = 'army-roster__row' + (rosterSelected ? ' is-selected' : '');
			row.dataset.pieceId = unit.id;
			row.setAttribute('aria-label', unitDisplayName(unit) + ' ' + sequence + ' LP ' + Math.max(0, Math.ceil(unit.lp)) + '/' + (unit.lpMax || unit.lp));
			const name = document.createElement('span');
			name.className = 'army-roster__name';
			name.textContent = unitDisplayName(unit) + ' ' + sequence;
			const hp = document.createElement('small');
			hp.textContent = Math.max(0, Math.ceil(unit.lp)) + '/' + (unit.lpMax || unit.lp);
			const meter = document.createElement('i');
			meter.style.setProperty('--roster-health', (lpRatioOf(unit) * 100).toFixed(1) + '%');
			row.appendChild(name);
			row.appendChild(hp);
			row.appendChild(meter);
			row.addEventListener('click', function () {
				if (side === 'blue') {
					if (viewMode !== 'ally') setViewMode('ally');
					selectOnly(unit);
				} else {
					if (viewMode !== 'enemy') setViewMode('enemy');
					selectEnemyOnly(unit);
				}
			});
			row.addEventListener('mouseenter', function () {
				const piece = document.getElementById(unit.id);
				if (piece) piece.classList.add('hover-match', side === 'blue' ? 'hover-blue' : 'hover-red');
			});
			row.addEventListener('mouseleave', clearHoverMatches);
			roster.appendChild(row);
		});
	});
}

function lpRatioOf(p) {

	const max = p.lpMax || p.lp || 1;

	return Math.max(
		0,
		Math.min(
			1,
			(p.lp || 0) / max
		)
	);
}

// 渲染左侧显示条：当前选中的（存活）蓝方军队及其属性 + LP 进度条
function renderInfoPanel() {

	const bar = document.getElementById('info-bar');

	if (!bar) return;

	const list =
		selectedPieces.filter(isAliveBlue);

	bar.innerHTML = '';

	if (list.length === 0) {
		bar.style.display = 'none';
		return;
	}

	bar.style.display = 'block';

	const head = document.createElement('div');
	head.className = 'info-head';
	head.textContent = gameText('game.selected', { count: list.length }, '选中部队（' + list.length + '）');

	bar.appendChild(head);

	list.forEach(p => {

		const row = document.createElement('div');
		row.className = 'info-row';

		const name = unitDisplayName(p);

		const ratio = lpRatioOf(p);

		const color =
			ratio > 0.5
				? '#4a7c34'
				: ratio > 0.25
					? '#c99b2e'
					: '#c0392b';

		const titleLine =
			document.createElement('div');

		titleLine.className =
			'info-titleline';

		const nameSpan =
			document.createElement('span');

		nameSpan.className =
			'info-title';

		nameSpan.textContent =
			name;

		const rm =
			document.createElement('button');

		rm.className =
			'info-remove';

		rm.textContent = '✕';

		rm.title = gameText('game.removeAlly', null, '取消选中（移出显示条）');

		rm.addEventListener(
			'click',
			function () {
				removeFromSelection(p);
			}
		);

		row.dataset.pieceId = p.id;

		titleLine.appendChild(nameSpan);
		titleLine.appendChild(rm);
		row.appendChild(titleLine);

		const stats =
			document.createElement('div');

		stats.className =
			'info-stats';

		/* B09：面板射程显示"有效射程"，与范围圈、战斗判定三者一致。
		 * （近战单位原始 atkrange 0.5，实际接战距离 0.58，以前面板会少报。） */
		const showRange = Math.round(unitCombatRange(p) * 100) / 100;
		stats.textContent = gameText('game.stats', { range: showRange, attack: p.atk, speed: p.speed }, '射程 ' + showRange + ' · 攻击 ' + p.atk + ' · 速度 ' + p.speed);

		row.appendChild(stats);

		const lpbar =
			document.createElement('div');

		lpbar.className =
			'info-lpbar';

		const fill =
			document.createElement('div');

		fill.className =
			'info-lpfill';

		fill.style.width =
			(ratio * 100).toFixed(1) +
			'%';

		fill.style.background =
			color;

		lpbar.appendChild(fill);
		row.appendChild(lpbar);

		const lptext =
			document.createElement('div');

		lptext.className =
			'info-lptext';

		lptext.textContent =
			'LP ' +
			Math.max(0, Math.round(p.lp)) +
			' / ' +
			(p.lpMax || p.lp);

		row.appendChild(lptext);

		bar.appendChild(row);
	});
}

addSelectionListener(renderInfoPanel);
addSelectionListener(renderArmyRosters);
renderInfoPanel();

/* ========== 查看敌人模式（to-do #4/#5 扩展） ========== */

let viewMode = 'ally';
let selectedEnemies = new Array();
const enemySelectionListeners = new Array();

function isAliveRed(p) {
	return !!p &&
		p.color === 'red' &&
		!p.disabled;
}

function getEnemySelection() {
	return selectedEnemies;
}

function addEnemySelectionListener(fn) {
	enemySelectionListeners.push(fn);
}

function fireEnemySelectionChanged() {

	enemySelectionListeners.forEach(fn => {

		try {
			fn();
		} catch (e) {
			/* 忽略单个监听器的错误 */
		}

	});
}

function refreshEnemySelectionUI() {

	clearHoverMatches();

	document
		.querySelectorAll('.chess.sel-enemy')
		.forEach(el =>
			el.classList.remove('sel-enemy')
		);

	selectedEnemies.forEach(p => {

		const el =
			document.getElementById(p.id);

		if (el) {
			el.classList.add('sel-enemy');
		}
	});

	fireEnemySelectionChanged();
}

function clearEnemies() {
	selectedEnemies = [];
	refreshEnemySelectionUI();
}

function selectEnemyOnly(p) {
	selectedEnemies = [p];
	refreshEnemySelectionUI();
}

function toggleEnemy(p) {

	const i =
		selectedEnemies.indexOf(p);

	if (i >= 0) {
		selectedEnemies.splice(i, 1);
	} else {
		selectedEnemies.push(p);
	}

	refreshEnemySelectionUI();
}

function selectEnemyMany(list) {
	selectedEnemies = list.slice();
	refreshEnemySelectionUI();
}

function removeFromEnemies(pieceData) {

	const i =
		selectedEnemies.indexOf(pieceData);

	if (i >= 0) {
		selectedEnemies.splice(i, 1);
		refreshEnemySelectionUI();
	}
}

// 右侧面板：被选中红方单位的剩余血量（LP 进度条）
function renderEnemyPanel() {

	const bar =
		document.getElementById('enemy-info');

	if (!bar) return;

	const list =
		selectedEnemies.filter(isAliveRed);

	bar.innerHTML = '';

	if (list.length === 0) {
		bar.style.display = 'none';
		return;
	}

	bar.style.display = 'block';

	const head =
		document.createElement('div');

	head.className =
		'info-head';

	head.textContent = gameText('game.enemies', { count: list.length }, '敌方部队（' + list.length + '）');

	bar.appendChild(head);

	list.forEach(p => {

		const row =
			document.createElement('div');

		row.className =
			'info-row';

		const name = unitDisplayName(p);

		const ratio =
			lpRatioOf(p);

		const color =
			ratio > 0.5
				? '#4a7c34'
				: ratio > 0.25
					? '#c99b2e'
					: '#c0392b';

		const titleLine =
			document.createElement('div');

		titleLine.className =
			'info-titleline';

		const nameSpan =
			document.createElement('span');

		nameSpan.className =
			'info-title';

		nameSpan.textContent =
			name;

		const rm =
			document.createElement('button');

		rm.className =
			'info-remove';

		rm.textContent = '✕';

		rm.title = gameText('game.removeEnemy', null, '移出敌方查看');

		rm.addEventListener(
			'click',
			function () {
				removeFromEnemies(p);
			}
		);

		row.dataset.pieceId =
			p.id;

		titleLine.appendChild(nameSpan);
		titleLine.appendChild(rm);
		row.appendChild(titleLine);

		const lpbar =
			document.createElement('div');

		lpbar.className =
			'info-lpbar';

		const fill =
			document.createElement('div');

		fill.className =
			'info-lpfill';

		fill.style.width =
			(ratio * 100).toFixed(1) +
			'%';

		fill.style.background =
			color;

		lpbar.appendChild(fill);
		row.appendChild(lpbar);

		const lptext =
			document.createElement('div');

		lptext.className =
			'info-lptext';

		lptext.textContent =
			'LP ' +
			Math.max(0, Math.round(p.lp)) +
			' / ' +
			(p.lpMax || p.lp);

		row.appendChild(lptext);

		bar.appendChild(row);
	});
}

addEnemySelectionListener(renderEnemyPanel);
addEnemySelectionListener(renderArmyRosters);

// 切换"指挥 / 查看敌人"模式
function setViewMode(m) {

	viewMode =
		(m === 'enemy')
			? 'enemy'
			: 'ally';

	/* 右侧指挥停靠坞与敌方面板的避让：敌方查看模式下把敌方信息面板挪到左侧。 */
	document.body.classList.toggle('view-enemy', viewMode === 'enemy');

	const btn =
		document.getElementById('button-mode');

	if (btn) {
		btn.textContent = (viewMode === 'enemy')
			? gameText('game.backCommand', null, '返回指挥')
			: gameText('game.viewEnemy', null, '查看敌人');
	}

	if (viewMode === 'enemy') {
		clearSelection();
	} else {
		clearEnemies();
	}

	hideArrow();
}

document
	.getElementById('button-mode')
	.addEventListener('click', function () {
		setViewMode(
			viewMode === 'enemy'
				? 'ally'
				: 'enemy'
		);
	});

renderEnemyPanel();

/* 回车 = 触发"下一步"：弹窗/剧情/教学图打开时不抢键；焦点在表单控件或其它
 * 按钮上时交给浏览器原生行为（如下拉框展开、当前按钮点击）；结算/部署禁用态不响应。 */
document.addEventListener('keydown', function (e) {
	if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return;
	if (document.querySelector('.ui-modal-mask, .dialog-overlay, .level-intro-image-overlay')) return;
	const ae = document.activeElement;
	if (ae && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(ae.tagName)) return;
	const btn = document.getElementById('button');
	if (!btn || btn.disabled) return;
	const cs = getComputedStyle(btn);
	if (cs.display === 'none' || cs.visibility === 'hidden') return;
	const board = document.getElementById('board');
	if (board && getComputedStyle(board).display === 'none') return;
	e.preventDefault();
	btn.click();
});

/* Esc 是战场级“取消当前操作”：蓝方选中、敌方查看选中、框选和临时箭头
 * 必须一起清理。弹窗/剧情打开时让它们自己的 Esc 逻辑优先处理。 */
document.addEventListener('keydown', function (e) {
	if (e.key !== 'Escape' || e.defaultPrevented) return;
	if (document.querySelector('.ui-modal-mask, .dialog-overlay, .level-intro-image-overlay')) return;

	const hadSelection = selectedPieces.length > 0 || selectedEnemies.length > 0;
	if (!hadSelection && !dragBoxState) return;

	e.preventDefault();
	cancelBoxDrag();

	e.preventDefault();
	dragBoxState = null;
	hideBox();
	clearOrderPreview();
	if (isArrowVisible) hideArrow();
	clearSelection();
	clearEnemies();
	clearHoverMatches();
});

/* ---------- 显示条悬停联动 ---------- */

function clearHoverMatches() {
	document
		.querySelectorAll('.chess.hover-match')
		.forEach(el =>
			el.classList.remove(
				'hover-match',
				'hover-blue',
				'hover-red'
			)
		);
}

function rowPiece(row) {

	if (
		!row ||
		!row.dataset ||
		!row.dataset.pieceId
	) {
		return null;
	}

	return armys.find(
		x => x.id === row.dataset.pieceId
	) || null;
}

function syncRowHover(barEl) {

	if (!barEl) return;

	function markHover(piece) {

		const el =
			piece
				? document.getElementById(piece.id)
				: null;

		if (el) {

			el.classList.add(
				'hover-match'
			);

			el.classList.add(
				piece.color === 'red'
					? 'hover-red'
					: 'hover-blue'
			);

		}
	}

	function unmarkHover(piece) {

		const el =
			piece
				? document.getElementById(piece.id)
				: null;

		if (el) {
			el.classList.remove(
				'hover-match',
				'hover-blue',
				'hover-red'
			);
		}
	}

	barEl.addEventListener('mouseover', function (e) {

		const row =
			e.target.closest('.info-row');

		if (!row) return;

		markHover(
			rowPiece(row)
		);
	});

	barEl.addEventListener('mouseout', function (e) {

		const row =
			e.target.closest('.info-row');

		if (!row) return;

		if (row.contains(e.relatedTarget)) {
			return;
		}

		unmarkHover(
			rowPiece(row)
		);
	});
}

syncRowHover(
	document.getElementById('info-bar')
);

syncRowHover(
	document.getElementById('enemy-info')
);

/* ========== to-do #7：攻击范围显示 ========== */

let rangeCircles = [];

function renderRangeOverlays() {

	const old =
		document.getElementById('range-layer');

	if (old) old.remove();

	rangeCircles = [];

	const list =
		(viewMode === 'enemy')
			? selectedEnemies.filter(isAliveRed)
			: selectedPieces.filter(isAliveBlue);

	if (
		list.length === 0 ||
		!boardContainer
	) {
		return;
	}

	const layer =
		document.createElement('div');

	layer.id =
		'range-layer';

	layer.className =
		'range-layer';

	list.forEach(p => {

		/* ⚠️ B09：范围圈必须和实际判定用同一个"有效射程"。
		 * 引擎为避免近战挤在一起，把有效射程下限抬到 UNIT_MIN_SEPARATION+0.02=0.58，
		 * 而这里以前画的是原始 atkrange（步兵 0.5）——圈里打不到的敌人其实已经在开火。 */
		const r =
			unitCombatRange(p) *
			distance;

		if (!r || r <= 0) return;

		const c =
			document.createElement('div');

		c.className =
			'range-circle ' +
			(
				p.color === 'red'
					? 'range-circle--enemy'
					: 'range-circle--ally'
			);

		const cx =
			offset +
			distance *
			p.posx;

		const cy =
			offset +
			distance *
			p.posy;

		c.style.left =
			(cx - r) + 'px';

		c.style.top =
			(cy - r) + 'px';

		c.style.width =
			(2 * r) + 'px';

		c.style.height =
			(2 * r) + 'px';

		layer.appendChild(c);

		rangeCircles.push({
			piece: p,
			el: c
		});
	});

	boardContainer.appendChild(layer);
}

function updateRangePositions() {

	const keep = [];

	rangeCircles.forEach(item => {

		const p = item.piece;
		const el = item.el;

		if (p.disabled) {

			el.remove();
			return;
		}

		const r =
			Number(p.atkrange) *
			distance;

		const cx =
			offset +
			distance *
			p.posx;

		const cy =
			offset +
			distance *
			p.posy;

		el.style.left =
			(cx - r) + 'px';

		el.style.top =
			(cy - r) + 'px';

		keep.push(item);
	});

	rangeCircles = keep;
}

addSelectionListener(
	renderRangeOverlays
);

addEnemySelectionListener(
	renderRangeOverlays
);

/* ========== to-do #8：新兵种试玩 ========== */

window.__spawnUnit =
	function (color, unitKey, posx, posy) {

		const defs = {
			'骑': UNIT_CAVALRY,
			'散': UNIT_SKIRMISHER,
			'掷': UNIT_GRENADIER
		};

		const def = defs[unitKey];

		if (!def) {
			console.log('[__spawnUnit] 未知兵种：骑 / 散 / 掷');
			return;
		}

		if (
			typeof boardContainer === 'undefined' ||
			!boardContainer ||
			!armys
		) {
			return;
		}

		const piece =
			document.createElement('div');

		piece.className =
			'chess chess--' +
			color;

		piece.id =
			'piece-' +
			piece_cnt;

		piece.innerHTML =
			'<p>' +
			def.cls +
			'</p>';

		boardContainer.appendChild(piece);

		armys.push({
			id: piece.id,
			color: color,
			posx: posx,
			posy: posy,
			speed: def.speed,
			targetx: posx,
			targety: posy,
			atkrange: def.atkrange,
			atk: def.atk,
			lp: def.lp,
			lpMax: def.lp,
			disabled: false,
			cls: def.cls,
			img: ''
		});

		movePieceTo(
			piece.id,
			posx,
			posy
		);

		piece_cnt ++;

		console.log('[__spawnUnit] 已生成 ' + (color === 'red' ? '敌方' : '我方') + def.cls + ' 于 (' + posx + ',' + posy + ')');
	};

/* ========== to-do #11：常驻行动指示箭头 ========== */

let orderLayer = null;
let orderEls = {};

function orderArrowMarkup() {
	return '<span class="oa-origin"></span>' +
		'<span class="oa-line"></span>' +
		'<span class="oa-head"></span>';
}

function positionOrderArrow(el, x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < 2) return false;

	const deg = Math.atan2(dy, dx) * 180 / Math.PI;
	el.style.left = x1 + 'px';
	el.style.top = (y1 - 9) + 'px';
	el.style.width = dist + 'px';
	el.style.transform = 'rotate(' + deg + 'deg)';
	return true;
}

function ensureOrderLayer() {

	if (
		orderLayer &&
		document.body.contains(orderLayer)
	) {
		return orderLayer;
	}

	orderLayer =
		document.createElement('div');

	orderLayer.id =
		'order-layer';

	orderLayer.className =
		'order-layer';

	boardContainer.appendChild(
		orderLayer
	);

	orderEls = {};

	return orderLayer;
}

function removeOrderArrow(id) {

	const item =
		orderEls[id];

	if (item) {

		if (item.el.parentNode) {
			item.el.parentNode.removeChild(
				item.el
			);
		}

		delete orderEls[id];
	}
}

function upsertOrderArrow(
	id,
	x1,
	y1,
	x2,
	y2,
	isRed,
	commandSignature
) {

	let item =
		orderEls[id];

	if (!item) {

		const el =
			document.createElement('div');

		el.className =
			'order-arrow' +
			(
				isRed
					? ' order-arrow--red'
					: ''
			);

		el.innerHTML = orderArrowMarkup();

		orderLayer.appendChild(el);

		item = { el: el };

		orderEls[id] =
			item;
	}

	const isNewCommand = item.commandSignature !== commandSignature;

	if (!positionOrderArrow(item.el, x1, y1, x2, y2)) {

		removeOrderArrow(id);

		return;
	}

	/* 先写入起点、终点和长度，再启动由士兵端向目标端的铺展。
	 * 旧版在几何尺寸写入前就启动动画，首帧可能按 0 宽计算，视觉上像整根闪现。 */
	if (isNewCommand) {
		item.commandSignature = commandSignature;
		item.el.classList.remove('order-arrow--deploying');
		void item.el.offsetWidth;
		item.el.classList.add('order-arrow--deploying');
	}
}

/* 每回合/每次下令后刷新 */

function renderOrderArrows() {

	if (
		typeof boardContainer === 'undefined' ||
		!boardContainer
	) {
		return;
	}

	const layer =
		ensureOrderLayer();

	const w =
		boardContainer.clientWidth;

	const h =
		boardContainer.clientHeight;

	const seen = {};

	armys.forEach(u => {

		if (u.disabled) return;
		const followed = u.followTargetId
			? armys.find(function (unit) { return unit.id === u.followTargetId && !unit.disabled; })
			: null;
		const targetx = followed ? followed.posx : u.targetx;
		const targety = followed ? followed.posy : u.targety;

		const dx =
			targetx -
			u.posx;

		const dy =
			targety -
			u.posy;

		if (
			dx * dx +
			dy * dy <
			1e-4
		) {
			return;
		}

		const x1 =
			offset +
			distance *
			u.posx;

		const y1 =
			offset +
			distance *
			u.posy;

		const x2 =
			Math.max(
				0,
				Math.min(
					offset +
					distance *
					targetx,
					w
				)
			);

		const y2 =
			Math.max(
				0,
				Math.min(
					offset +
					distance *
					targety,
					h
				)
			);

		upsertOrderArrow(
			u.id,
			x1,
			y1,
			x2,
			y2,
			u.color === 'red',
			u.followTargetId ? ('follow:' + u.followTargetId) : (String(u.targetx) + ':' + String(u.targety))
		);

		seen[u.id] =
			true;
	});

	Object.keys(orderEls).forEach(
		id => {
			if (!seen[id]) {
				removeOrderArrow(id);
			}
		}
	);
}

/* ---- 预览箭头 ---- */

let previewLayer = null;
let previewEls = {};

function ensurePreviewLayer() {

	if (
		previewLayer &&
		document.body.contains(previewLayer)
	) {
		return previewLayer;
	}

	previewLayer =
		document.createElement('div');

	previewLayer.id =
		'preview-layer';

	previewLayer.className =
		'order-layer';

	previewLayer.style.zIndex =
		'5';

	boardContainer.appendChild(
		previewLayer
	);
	previewEls = {};

	return previewLayer;
}

function clearOrderPreview() {

	if (
		previewLayer &&
		previewLayer.parentNode
	) {
		previewLayer.innerHTML = '';
	}
	previewEls = {};
}

function previewArrow(
	id,
	x1,
	y1,
	x2,
	y2
) {
	let el = previewEls[id];
	if (!el) {
		el = document.createElement('div');
		el.className = 'order-arrow order-arrow--preview';
		el.innerHTML = orderArrowMarkup();
		ensurePreviewLayer().appendChild(el);
		previewEls[id] = el;
	}

	if (!positionOrderArrow(el, x1, y1, x2, y2)) {
		el.remove();
		delete previewEls[id];
	}
}

function renderOrderPreview(e) {

	if (viewMode === 'enemy') {
		clearOrderPreview();
		return;
	}

	const list =
		selectedPieces.filter(
			isAliveBlue
		);

	if (!list.length) {
		clearOrderPreview();
		return;
	}

	const rect = boardContentRect();

	const tx =
		Math.max(
			0,
			Math.min(
				e.clientX -
				rect.left,
				boardContainer.clientWidth
			)
		);

	const ty =
		Math.max(
			0,
			Math.min(
				e.clientY -
				rect.top,
				boardContainer.clientHeight
			)
		);

	const seen = {};
	list.forEach(p => {

		previewArrow(
			p.id,
			offset +
			distance *
			p.posx,

			offset +
			distance *
			p.posy,

			tx,
			ty
		);
		seen[p.id] = true;
	});

	Object.keys(previewEls).forEach(function (id) {
		if (!seen[id]) {
			previewEls[id].remove();
			delete previewEls[id];
		}
	});
}

/* ========== to-do #12/#13：战前情报 + 剧情对话 ========== */

/* ========== 从 demo-美化好 移植：棋盘揭示动画 ==========
 * 开场时 <body> 带 .level-opening（见各 gameN.html），CSS 借此隐藏战场；
 * 剧情/简报播完后由本函数摘掉该类并加 .level-revealing，战场淡入。
 * ====================================================== */
function revealBattlefield() {
	const page = document.body;
	page.classList.add('level-revealing');
	page.classList.remove('level-opening');
	window.setTimeout(function () { page.classList.remove('level-revealing'); }, 1000);
	/* B02：脱掉开场变换后再量一次并按正式几何重排，消除约 3% 的累积位置偏差。 */
	relayoutBoardUnits();
	window.dispatchEvent(new CustomEvent('battlefield:revealed'));
}

/* 剧情开始时就在后台请求并解码立绘、教程图，让后续翻页不再临时等待。 */
const introAssetWarmers = [];
function warmIntroImage(src) {
	if (!src || introAssetWarmers.some(function (image) { return image.src.indexOf(src.replace(/^\.\//, '')) !== -1; })) return;
	const image = new Image();
	image.decoding = 'async';
	image.src = src;
	introAssetWarmers.push(image);
	if (typeof image.decode === 'function') image.decode().catch(function () { /* load 事件仍可继续 */ });
}

function warmLevelIntroAssets(meta) {
	(meta.story || []).concat(meta.victoryStory || []).forEach(function (line) {
		if (!line.portrait) return;
		warmIntroImage(line.portrait);
		if (typeof dialogueActionPortraitSources === 'function') {
			dialogueActionPortraitSources(line.portrait).forEach(warmIntroImage);
		}
	});
	if (Number(CURRENT_LEVEL_ID) === 1) {
		warmIntroImage('./img/level1-intro-1.webp?v=20260916-img1');
		warmIntroImage('./img/level1-intro-2.webp?v=20260916-img1');
	}
}

/* ========== 进关流程（B 的立绘对话/简报页 → A 的第一关教程图） ==========
 * 第一关：立绘剧情 → 战前简报（开 战）→ 教程图1 → 教程图2 → 淡入战场
 * 其余关：立绘剧情 → 战前简报（开 战）→ 淡入战场
 *
 * 注：教程图刻意排在剧情与简报【之后】——先交代剧情、再给指令，
 *     最后用两张图把「选中/下令/攻击」和兵种定位讲清楚，然后进场。
 * ==================================================================== */
/* 进关流程。
 * opts.skipIntro = true 时跳过整套开场（剧情 / 战前简报 / 第一关教程图）直接进战场。
 *   适用场景：
 *     · URL 带 ?replay=1（重玩按钮，原本就有）；
 *     · 中途读档 —— 玩家已经在打这一关了，再走一遍剧情和两张教学图纯属打断，
 *       而且第一关读档会连看两次操作图（审查报告"体验建议 5"）。
 *   首次从主界面正常进关时不传 opts，完整开场照旧。 */
function showLevelIntro(opts) {
	opts = opts || {};
	if (typeof CURRENT_LEVEL_ID === 'undefined' || typeof getLevelById !== 'function') { revealBattlefield(); return; }

	const meta = getLevelById(CURRENT_LEVEL_ID);
	if (!meta) { revealBattlefield(); return; }

	/* Replay 入口 / 读档恢复：跳过整套开场，恢复音乐并直接进棋盘。
	 * replay 用 replaceState 清掉一次性参数，玩家随后普通刷新时仍会看到正常剧情。 */
	const entryUrl = new URL(window.location.href);
	const isReplay = entryUrl.searchParams.get('replay') === '1';
	if (isReplay || opts.skipIntro) {
		if (isReplay) {
			entryUrl.searchParams.delete('replay');
			window.history.replaceState(null, '', entryUrl.pathname + entryUrl.search + entryUrl.hash);
		}
		if (typeof initBgm === 'function') initBgm('game-music');
		revealBattlefield();
		return;
	}
	warmLevelIntroAssets(meta);

	/* 兜底包装：任何一步抛异常都必须 revealBattlefield()，
	 * 否则页面会永久停在 .level-opening（战场全黑、按钮全部不可点）。 */
	const safe = function (fn) {
		return function () {
			try {
				fn();
			} catch (err) {
				console.error('showLevelIntro step failed, revealing battlefield:', err);
				revealBattlefield();
			}
		};
	};

	/* ---- B 移植：把章节资料补到每句对白上，关卡作者只需维护 levels.js ---- */
	const story = (meta.story || []).map(function (line) {
		return Object.assign({
			chapter: meta.chapter || meta.name,
			location: meta.location || '',
			scene: meta.scene || 'campaign'
		}, line);
	});

	/* ---- B 移植：把 A 原来的 hint 弹窗升级成一段"战役简报"页 ---- */
	story.push({
		who: function () { return gameText('dialogue.briefing', null, '战役简报'); },
		role: meta.name,
		text: function () {
			const hint = meta.hint ? gameContent(meta.hint) : gameText('dialogue.defeatAll', null, '击败所有红方单位即可获胜。');
			return gameText('game.briefingDifficulty', {
				level: Math.max(1, Math.min(7, Number(meta.difficulty) || 1)),
				mechanic: gameContent(meta.mechanic || ''),
				hint: hint
			}, hint);
		},
		kind: 'briefing',
		chapter: meta.chapter || meta.name,
		location: meta.location || '',
		scene: meta.scene || 'campaign',
		actionLabel: function () { return gameText('dialogue.startBattle', null, '开 战'); }
	});

	/* ---- A 保留：第一关的两张教程图（① 操作四步教学 ② 步兵兵种介绍） ----
	 * 位置：剧情对话与战前简报之后、淡入战场之前（见文件末尾的总流程）。 */
	const showIntroImages = function (next) {
		if (CURRENT_LEVEL_ID !== 1) {
			next();
			return;
		}

		const images = [
			'./img/level1-intro-1.webp?v=20260916-img1',
			'./img/level1-intro-2.webp?v=20260916-img1'
		];

		let index = 0;

		const showNextImage = function () {
			/* 两张图都看完了 */
			if (index >= images.length) {
				next();
				return;
			}

			const overlay = document.createElement('div');
			overlay.className = 'level-intro-image-overlay';

			/* 图片容器 */
			const imageBox = document.createElement('div');
			imageBox.className = 'level-intro-image-box';

			const image = document.createElement('img');
			image.className = 'level-intro-image';
			image.decoding = 'async';
			image.fetchPriority = 'high';
			image.src = images[index];
			image.alt = '第一关教程图 ' + (index + 1);
			image.draggable = false;
			imageBox.classList.add('is-loading');
			image.addEventListener('load', function () { imageBox.classList.remove('is-loading'); }, { once: true });
			image.addEventListener('error', function () { imageBox.classList.remove('is-loading'); }, { once: true });

			/* 图片右上角关闭按钮 */
			const closeBtn = document.createElement('button');
			closeBtn.className = 'level-intro-close';
			closeBtn.innerHTML = '&times;';
			closeBtn.setAttribute('aria-label', '关闭教程图');

			closeBtn.addEventListener('click', function () {
				overlay.remove();
				index++;
				showNextImage();
			});

			imageBox.appendChild(image);
			imageBox.appendChild(closeBtn);
			if (image.complete) imageBox.classList.remove('is-loading');

			overlay.appendChild(imageBox);
			document.body.appendChild(overlay);
		};

		showNextImage();
	};

	/* ---- 开战：第一关先过两张教程图，其余关卡直接淡入战场 ---- */
	const startBattle = safe(function () {
		showIntroImages(revealBattlefield);
	});

	/* ---- A 保留：dialog.js 不可用时的兜底简报 ---- */
	const runHint = function () {
		const overlay = document.createElement('div');
		overlay.className = 'intro-overlay';

		const box = document.createElement('div');
		box.className = 'intro-box';

		const title = document.createElement('h2');
			title.textContent = gameContent(meta.name);

		const body = document.createElement('p');
		body.className = 'intro-text';
			body.textContent = meta.hint ? gameContent(meta.hint) : gameText('dialogue.defeatAll', null, '击败所有红方单位即可获胜。');

		const act = document.createElement('div');
		act.className = 'intro-actions';

		const go = document.createElement('button');
		go.className = 'game-btn intro-go';
			go.textContent = gameText('dialogue.startBattle', null, '开 战');

		go.addEventListener('click', function () {
			overlay.remove();
			startBattle();
		});

		act.appendChild(go);
		box.appendChild(title);
		box.appendChild(body);
		box.appendChild(act);
		overlay.appendChild(box);
		document.body.appendChild(overlay);
	};

	/* ---- 总流程 ----
	 * 第一关：立绘剧情 → 战前简报（开 战）→ 教程图1 → 教程图2 → 淡入战场
	 * 其余关：立绘剧情 → 战前简报（开 战）→ 淡入战场
	 */
	if (typeof playDialogue === 'function') {
		playDialogue(story, startBattle);
		return;
	}
	runHint();
}

/* 只更新文字，不重载页面，也不改动回合、选中或存档状态。 */
window.addEventListener('ui:languagechange', function () {
	renderFooterStatus();
	refreshSlotSelect();
	renderUndoButton();
	renderInfoPanel();
	renderEnemyPanel();
	renderBattleStatus();
	renderArmyRosters();
	const modeButton = document.getElementById('button-mode');
	if (modeButton) {
		modeButton.textContent = viewMode === 'enemy'
			? gameText('game.backCommand', null, '返回指挥')
			: gameText('game.viewEnemy', null, '查看敌人');
	}
	const tip = document.getElementById('loseTips');
	if (lastFailurePresentation) renderFailureAdvice();
	else if (tip && tip.dataset.sourceText) tip.textContent = gameContent(tip.dataset.sourceText);
});
