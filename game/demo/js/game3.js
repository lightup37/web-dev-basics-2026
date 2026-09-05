/* 第三关代码 */
/* 设计思路：敌方会主动扑向最近的蓝方（breakthrough）。用骑兵高速侧翼穿插、散兵拉扯，
   别让红方骑兵与主力贴脸。 */
/* 用到的各常数见 constants.js */

var game3 = {
	n: 10,
	m: 10,
	turns_limit: 18,
	pieces: new Array()
} ;

game3.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 1.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game3.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 0.0, posy: 7.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});

game3.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 7.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 4.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 7.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});

// game3 的所需元素

var CURRENT_LEVEL_ID = 3;
var CURRENT_GAME = game3;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 敌方 AI 配置取自 levels.js

var snapToResume = null;
if (wantResume() && typeof currentUser === 'function' && currentUser()) {
	var _s = autoSnapshot(currentUser());
	if (_s && Number(_s.level) === CURRENT_LEVEL_ID) snapToResume = _s;
}
if (snapToResume) {
	loadSnapshot(snapToResume);   // URL 带 resume=1 且 a.save 有本关快照 -> 继续
} else {
	loadGame(game3);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('The enemy is coming to you — pick your ground and hit them where they are spread out.')
