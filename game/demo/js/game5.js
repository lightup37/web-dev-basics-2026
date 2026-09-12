/* 第五关代码 */
/* 设计思路：攻坚战（滑铁卢·限时攻垒）。
   —— 2026-09：本关战斗与叙事整体取自原第 6 关，与第 6 关对调（D-1：叙事随战斗走）。
   红方 8 人占据右侧高地、原地固守。
   回合上限 18：
   要在时限内全歼守军，就必须顶着守军火力压上去集火；
   但冲得越凶、高伤单位暴露越久，己方伤亡越大——
   星级按通关所用步数计算（由 main.js 的 checkWinState() 中
   CURRENT_LEVEL_ID === 5 分支实现；usedTurns = turns_limit - remain_turns）：
   ≤13 步 = 3星
   ≤15 步 = 2星
   ≤18 步 = 1星
   超过 18 步仍未全歼 = 失败。
*/

var game5 = {
	n: 10,
	m: 10,
	turns_limit: 18,
	pieces: new Array()
} ;

game5.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game5.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 1.0, posy: 0.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game5.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 0.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game5.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher,posx: 2.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});

game5.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game5.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game5.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 6.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game5.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
/* 第 8 个守军：中墙步兵，加厚正面防线（加强守垒） */
game5.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 5.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

// game5 的所需元素

var CURRENT_LEVEL_ID = 5;
var CURRENT_GAME = game5;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 敌方 AI 配置取自 levels.js

var snapToResume = null;
if (wantResume() && typeof currentUser === 'function' && currentUser()) {
	var _s = autoSnapshot(currentUser());
	if (_s && Number(_s.level) === CURRENT_LEVEL_ID) snapToResume = _s;
}
if (snapToResume) {
	loadSnapshot(snapToResume);   // URL 带 resume=1 且 a.save 有本关快照 -> 继续
} else {
	loadGame(game5);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('18 turns against a fortress — push hard, but do not trade your whole army for a breach.')
