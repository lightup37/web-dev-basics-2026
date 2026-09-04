/* 第四关代码 */
/* 设计思路：敌方掷弹兵为核心抱团（cluster）。炮兵/散兵在外围点名，别扎进去被集火。 */
/* 用到的各常数见 constants.js */

var game4 = {
	n: 10,
	m: 10,
	turns_limit: 22,
	pieces: new Array()
} ;

game4.pieces.push({color:'blue', class:'掷', posx: 1.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color:'blue', class:'散', posx: 0.0, posy: 5.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game4.pieces.push({color:'blue', class:'散', posx: 0.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game4.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 2.0, posy: 4.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});

/* 红方第 0 个必须是"核心"（cluster 的 core:0 指向它）——这里给掷弹兵 */
game4.pieces.push({color: 'red', class: '掷', posx: 6.0, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 7.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 7.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 8.0, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.5, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

// game4 的所需元素

var CURRENT_LEVEL_ID = 4;
var CURRENT_GAME = game4;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 敌方 AI 配置取自 levels.js

var snapToResume = null;
if (wantResume() && typeof currentUser === 'function' && currentUser()) {
	var _s = autoSnapshot(currentUser());
	if (_s && Number(_s.level) === CURRENT_LEVEL_ID) snapToResume = _s;
}
if (snapToResume) {
	loadSnapshot(snapToResume);   // URL 带 resume=1 且 a.save 有本关快照 -> 继续
} else {
	loadGame(game4);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('Do not dive into the enemy square — let your guns and skirmishers soften it first.')
