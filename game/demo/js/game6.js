/* 第六关代码 */
/* 设计思路：铁血强攻。敌方专挑"攻击力最高"的蓝方集火（breakthrough + threat:strongest）。
   —— 2026-09：本关战斗与叙事整体取自原第 5 关，与第 5 关对调（D-1：叙事随战斗走）。
   你的炮兵/骑兵火力高、会成为首要目标——用掷弹兵/步兵挡在前面掩护它们输出。 */
/* 用到的各常数见 constants.js */

var game6 = {
	n: 10,
	m: 10,
	turns_limit: 25,
	pieces: new Array()
} ;

game6.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 5.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game6.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 1.0, posy: 0.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game6.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 0.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game6.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 2.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});

game6.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 7.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game6.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 5.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

// game6 的所需元素

var CURRENT_LEVEL_ID = 6;
var CURRENT_GAME = game6;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 敌方 AI 配置取自 levels.js

var snapToResume = null;
if (wantResume() && typeof currentUser === 'function' && currentUser()) {
	var _s = autoSnapshot(currentUser());
	if (_s && Number(_s.level) === CURRENT_LEVEL_ID) snapToResume = _s;
}
if (snapToResume) {
	loadSnapshot(snapToResume);   // URL 带 resume=1 且 a.save 有本关快照 -> 继续
} else {
	loadGame(game6);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('Your cannons and cavalry draw the enemy fire — screen them with infantry and grenadiers.')
