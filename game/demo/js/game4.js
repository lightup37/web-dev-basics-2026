/* 第四关代码：追逐战（Retreat Hunt）。
 * 玩法：红方 5 个步兵从中央出发，向棋盘右上角撤退，到达右上角区域才判定"成功撤退"。
 * 星级：全歼=3星；逃脱1支=2星；逃脱2支=1星；逃脱3支及以上=失败。
 * 我方分据左上与右下两翼，抢先包抄。
 * objective 让 main.js 走"逐猎"结算；红方 AI(flee) 与情报由 levels.js 提供。
 */

var game4 = {
	n: 10,
	m: 10,
	turns_limit: 20,
	objective: { type: 'retreat', loseEscape: 3, exitX: 9.5, exitY: -0.5 },
	pieces: new Array()
} ;

/* —— 我方：左上队 + 右下队 —— */
game4.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 1.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 3.0, posy: 1.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game4.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 9.0, posy: 9.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game4.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 8.0, posy: 7.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 6.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

/* —— 红方：中央起步，5 个步兵全普通速度向右上角撤退 —— */
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 4.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 5.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 4.5, posy: 6.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.5, posy: 4.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

// game4 的所需元素

var CURRENT_LEVEL_ID = 4;
var CURRENT_GAME = game4;   // 本关配置：读档恢复时用它校正每名棋子的满血上限（LP max）
if (typeof attachLevelAI === 'function') attachLevelAI(CURRENT_LEVEL_ID);   // 敌方 AI(flee) 取自 levels.js

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

loseTips.push('They reached the border — seal the top-right corner before the last of them slips away.')
