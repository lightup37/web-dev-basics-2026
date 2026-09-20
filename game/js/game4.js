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

/* —— 我方：左上队 + 右下队 ——
 * ⚠️ 2026-09-16 平衡修正：红方由 5 支改 6 支之后，**3 星（全歼 0 逃脱）打不出来了**
 *    （用真实引擎跑 9 种蓝方策略，最好的只有 2 星）。原因是红方 2.4 格/回合直奔
 *    (9.5,-0.5)，而蓝方唯一来得及封口的就是骑兵与散兵；多一支红方之后封口晚了一步。
 *    实测把这两支各往右上角挪一格就能恢复 3 星，所以：
 *      散兵 (3,1) → (4,0)   —— 斜向上一格
 *      骑兵 (9,9) → (9,8)   —— 已经在最右列，只能沿右边界往上一格
 *    两支到位时间由 2.78 / 1.98 回合提前到 2.30 / 1.77 回合，正好抢在红方第一支（2.15 回合）之前。
 *    ⚠️ 挪完要重跑推演确认 3 星仍然可达，别只改不算（推算脚本见 AGENTS.md 第六/八轮记录）。 */
game4.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 1.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 0.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game4.pieces.push({color:'blue', class:'散', img:IMG_BLUE_skirmisher, posx: 4.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_medium_far, atk: ATK_medium_high, lp: LP_low});
game4.pieces.push({color:'blue', class:'骑', img:IMG_BLUE_cavalry, posx: 9.0, posy: 8.0, speed: MOVING_SPEED_fast, atkrange: ATK_RANGE_standard, atk: ATK_high, lp: LP_standard});
game4.pieces.push({color:'blue', class:'掷', img:IMG_BLUE_grenadier, posx: 8.0, posy: 7.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_standard, atk: ATK_medium_high, lp: LP_high});
game4.pieces.push({color:'blue', class:'步', img:IMG_BLUE_infantry, posx: 6.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

/* —— 红方：中央起步，6 个步兵全普通速度向右上角撤退 ——
 * ⚠️ 本关红方是**残血开局**（设定为战前已被消耗过）：
 *    满血上限仍然是 LP_standard(60)，但当前 `lp` 各不相同。
 *    配置里同时写 `lp` 与 `lpMax`，`loadGame()` / `loadSnapshot()` 会取 `lpMax` 当上限，
 *    于是血条按真实比例画（≤55% 还会自动转黄），一眼就能看出"这支是残的"。
 *    血量：40 / 35 / 45 / 50 / 50 / 30（最后一支是 (7,4) 新增的）。
 * ⚠️ 顺序有讲究：残血值与单位一一对应，而 `loadSnapshot()` 是按**下标**回读本表取上限的，
 *    所以调整顺序时记得让血量跟着走。 */
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 4.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 40, lpMax: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 35, lpMax: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 5.0, posy: 5.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 45, lpMax: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 4.5, posy: 6.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 50, lpMax: LP_standard});
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.5, posy: 4.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 50, lpMax: LP_standard});
/* (7,4) 新增一支残血步兵：30/60。离最近的友军 (6.5,4.5) 距离 0.707 格，大于 0.56 格防重叠下限。 */
game4.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 7.0, posy: 4.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: 30, lpMax: LP_standard});

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
	/* 继续存档：直接回到战场，不重播剧情 / 简报 / 教程图（与关卡内读档一致）。 */
	loadSnapshot(snapToResume, { skipIntro: true });
} else {
	loadGame(game4);              // 否则按关卡配置全新开局
}
refreshSlotSelect();   // 初始化关卡内 Save/Load 下拉

loseTips.push('They reached the border — seal the top-right corner before the last of them slips away.')
