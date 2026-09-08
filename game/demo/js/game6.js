/* 第六关代码 */
/* 设计思路：攻坚战（滑铁卢·限时攻垒）。红方 8 人占据右侧高地、原地固守
   （levels.js 第 6 关 ai 置 null => 站桩，不追不逃）。回合上限 13：
   要在时限内全歼守军，就必须顶着守军火力压上去集火；
   但冲得越凶、高伤单位暴露越久，己方伤亡越大——
   星级按过关时存活蓝方数给（≥2=3星 / 1=2星 / 0=1星），即"出伤速度 vs 子力损失"的取舍。 */
/* 用到的各常数见 constants.js */

var game6 = {
	n: 10,
	m: 10,
	turns_limit: 13,
	pieces: new Array()
} ;

game6.pieces.push({color:'blue', class:'炮', img:IMG_BLUE_artillery, posx: 0.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
game6.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 1.0, posy: 0.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game6.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 0.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game6.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 1.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher,posx: 2.0, posy: 2.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});

game6.pieces.push({color: 'red', class: '掷', img: IMG_RED_grenadier, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 7.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 8.0, posy: 8.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game6.pieces.push({color: 'red', class: '骑', img: IMG_RED_cavalry, posx: 7.0, posy: 6.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game6.pieces.push({color: 'red', class: '炮', img: IMG_RED_artillery, posx: 9.0, posy: 2.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});
/* 第 8 个守军：新增中墙步兵，加厚正面防线（加强守垒） */
game6.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 5.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

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

loseTips.push('13 turns against a fortress — push hard, but do not trade your whole army for a breach.')
