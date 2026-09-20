/* 第三关代码 */
/* 设计思路：第三关首次引入主动突击 AI，但不再从前两关的站桩战突然跳成高压围攻。
   敌方前 2 步整队，第 3 步才开始推进；红方骑兵是轻骑，不会强制锁定我方炮兵。
   玩家可利用这个窗口把步兵前推、炮兵留后、散兵与骑兵布到两翼。 */
/* 用到的各常数见 constants.js */

var game3 = {
	n: 10,
	m: 10,
	turns_limit: 21,
	pieces: new Array()
} ;

game3.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 4.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game3.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 1.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game3.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 0.0, posy: 7.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});

game3.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 7.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game3.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 4.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
/* 本关只出现轻骑：速度仍快，但火力与生命低于后续关卡的重骑兵。 */
game3.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 7.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_low});

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
	/* 继续存档：直接回到战场，不重播剧情 / 简报 / 教程图（与关卡内读档一致）。 */
	loadSnapshot(snapToResume, { skipIntro: true });
} else {
	loadGame(game3);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('Use the first two turns to form a line: infantry in front, artillery behind, cavalry on the flank.')
