/* 第二关代码 */
/* 设计思路：先使用炮兵攻击敌方步兵，然后在步兵掩护下攻击敌方炮兵 */
/* 用到的各常数见 constants.js */

var game2 = {
	n: 10,
	m: 10,
	turns_limit: 25,
	pieces: new Array()
} ;

game2.pieces.push({color: "blue", class: "步", img: IMG_BLUE_infantry, posx: 0.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game2.pieces.push({color: "blue", class: "炮", img:IMG_BLUE_artillery, posx: 1.0, posy: 1.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});

game2.pieces.push({color:  "red", class: "步", img:  IMG_RED_infantry, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game2.pieces.push({color:  "red", class: "步", img:  IMG_RED_infantry, posx: 6.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game2.pieces.push({color:  "red", class: "步", img:  IMG_RED_infantry, posx: 9.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game2.pieces.push({color:  "red", class: "炮", img: IMG_RED_artillery, posx: 9.0, posy: 9.0, speed: MOVING_SPEED_slow, atkrange: ATK_RANGE_far, atk: ATK_medium_high, lp: LP_standard});

// game2 的所需元素

loadGame(game2);
// 加载 game2

document.getElementById('button-next-game').addEventListener('click', () => {
	window.location = './end-game.html'
})
// 加载下一关按钮

loseTips.push('Use artillery and infantry together properly is the key to win.')
// 加载死亡提示