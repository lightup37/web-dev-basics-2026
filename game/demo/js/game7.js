/* 第七关（隐藏关）：滑铁卢改写。
 * 高难度双阶段：核心存活时护卫补成环阵、双炮位固守；核心倒下后残军追击伤兵。 */

var game7 = {
	n: 10,
	m: 10,
	turns_limit: 18,
	pieces: new Array()
} ;

game7.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game7.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 1.0, posy: 0.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game7.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 0.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game7.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 2.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});

/* 强化近卫核心：比普通掷弹兵多 30 生命；formationRole 供双阶段 AI 与存档识别。 */
game7.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 6.5, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high + 30, formationRole: 'core'});
game7.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 8.0, posy: 8.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 6.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game7.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far + 0.5, atk: ATK_medium_high + 0.1, lp: LP_standard, formationRole: 'battery'});
game7.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 7.5, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far + 0.5, atk: ATK_medium_high + 0.1, lp: LP_standard, formationRole: 'battery'});

// game7 的所需元素

var CURRENT_LEVEL_ID = 7;
var CURRENT_GAME = game7;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 隐藏关 AI 也由 levels.js 提供

/* 隐藏关入口锁：需已开启隐藏路线（hiddenUnlocked）且已通关第 6 关 */
function bootGame7() {
	var snapToResume = null;
	if (wantResume() && typeof currentUser === 'function' && currentUser()) {
		var _s = autoSnapshot(currentUser());
		if (_s && Number(_s.level) === CURRENT_LEVEL_ID) snapToResume = _s;
	}
	if (snapToResume) {
		/* 继续存档：直接回到战场，不重播剧情 / 简报 / 教程图（与关卡内读档一致）。 */
	loadSnapshot(snapToResume, { skipIntro: true });
	} else {
		loadGame(game7);              // 否则按关卡配置全新开局
	}
	refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉
	loseTips.push('Break the Guard core before the twin batteries and the second-phase counterattack exhaust your 18 turns.');
}

/* 第 7 关解锁条件：第 1～6 关必须全部达到 3 星。
 * 判据统一走 save.js 的 hiddenRouteOpen()（内部用 getLevelStars()），
 * 与 menu.html 的第 7 关入口、main.js 第 6 关后的 Next Game 同源，不再各写一套。 */
var lockOk = false;

if (typeof hiddenRouteOpen === 'function') {
	lockOk = hiddenRouteOpen();
}

if (lockOk) {
	bootGame7();
} else {
	/* 2026-09：改用卡片式弹窗提示，确认后再回主界面；无 UI 组件时退回原生 alert */
	var lockMsg = (typeof uiT === 'function')
		? uiT('game.level7Locked')
		: '需要第 1～6 关全部获得 3 星，才能解锁第 7 关。';
	var toMenu = function () { window.location.replace('menu.html'); };
	if (typeof modalNotice === 'function') {
		modalNotice(lockMsg, toMenu);
	} else {
		alert(lockMsg);
		toMenu();
	}
}
