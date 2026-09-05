/* 加载一些常量 */

/* 用于棋子数据设定的常量 */
const ATK_RANGE_far = 4.0, ATK_RANGE_medium_far = 1.0, ATK_RANGE_standard = 0.5, ATK_RANGE_close = 0.1;
const MOVING_SPEED_fast = 0.2, MOVING_SPEED_standard = 0.1, MOVING_SPEED_slow = 0.05;
const LP_high = 120, LP_standard = 60, LP_low = 42;
const ATK_high = 1.0, ATK_medium_high = 0.7, ATK_standard = 0.5, ATK_low = 0.3;
const IMG_BLUE_infantry = 'blue_infantry', // 蓝色步兵
	IMG_BLUE_artillery = 'blue_artillery',  // 蓝色炮兵
	IMG_RED_infantry = 'red_infantry', // 红色步兵
	IMG_RED_artillery = 'red_artillery', // 红色炮兵
	IMG_BLUE_cavalry = 'blue_cavalry', // 蓝色骑兵
	IMG_RED_cavalry = 'red_cavalry', // 红色骑兵
	IMG_BLUE_skirmisher = 'blue_skirmisher', // 蓝色散兵
	IMG_BLUE_grenadier = 'blue_grenadier', // 蓝色掷弹兵
	IMG_RED_grenadier = 'red_grenadier'; // 红色掷弹兵

/* 兵种原型（to-do #8）：class 用于棋盘文字占位（无图时），img 置空即可走文字兜底 */
const UNIT_CAVALRY    = { class: '骑', speed: MOVING_SPEED_fast,      atkrange: ATK_RANGE_standard,    atk: ATK_high,        lp: LP_standard };
const UNIT_SKIRMISHER = { class: '散', speed: MOVING_SPEED_standard,  atkrange: ATK_RANGE_medium_far,  atk: ATK_medium_high, lp: LP_low };
const UNIT_GRENADIER  = { class: '掷', speed: MOVING_SPEED_slow,      atkrange: ATK_RANGE_standard,    atk: ATK_medium_high, lp: LP_high };

/* 用于失败后提示 */

let loseTips = [ 'Some battles you win, some you lose.' ] ;