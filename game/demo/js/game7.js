/* 第七关（隐藏关，to-do #14）代码：帝国黄昏。
 * 高难度：敌方以掷弹兵为核心的方阵（cluster）+ 重炮与骑兵；必须拆掉核心才能瓦解它。 */

var game7 = {
	n: 10,
	m: 10,
	turns_limit: 26,
	pieces: new Array()
} ;

game7.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game7.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 1.0, posy: 0.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game7.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 0.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game7.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 2.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});

/* 红方第 0 个是 cluster 核心（掷弹兵） */
game7.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 6.5, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game7.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 8.0, posy: 8.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game7.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 6.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game7.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});

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
		loadSnapshot(snapToResume);   // URL 带 resume=1 且 a.save 有本关快照 -> 继续
	} else {
		loadGame(game7);              // 否则按关卡配置全新开局
	}
	refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉
	loseTips.push('Break the heart of the square, and the rest will crumble.');
}

/* 第 7 关解锁条件：
 * 第 1～6 关必须全部达到 3 星
 */
var lockOk = false;

if (typeof currentUser === 'function' && currentUser()) {
	const user = currentUser();

	lockOk = true;

	for (let level = 1; level <= 6; level++) {
		if (
			typeof getLevelStars !== 'function' ||
			Number(getLevelStars(user, level)) < 3
		) {
			lockOk = false;
			break;
		}
	}
}

if (lockOk) {
	bootGame7();
} else {
	alert('需要第 1～6 关全部获得 3 星，才能解锁第 7 关。');
	window.location.replace('menu.html');
}
