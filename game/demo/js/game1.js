/* 第一关代码 */
/* 设计思路：先集中优势兵力，再各个击破 */
/* 用到的各常数见 constants.js */

var game1 = {
	n: 10,
	m: 10,
	turns_limit: 20,
	pieces: new Array()
} ;

game1.pieces.push({color:'blue', class: '步', img:IMG_BLUE_infantry, posx: 0.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:'blue', class: '步', img:IMG_BLUE_infantry, posx: 0.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:'blue', class: '步', img:IMG_BLUE_infantry, posx: 9.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:'blue', class: '步', img:IMG_BLUE_infantry, posx: 9.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

game1.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 3.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 3.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 4.5, posy: 4.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 3.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: 'red', class: '步', img: IMG_RED_infantry, posx: 6.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

// game1 的所需元素

loadGame(game1);
// 加载 game1

document.getElementById('button-next-game').addEventListener('click', () => {
	window.location = './end-game.html'
})
// 加载下一关按钮

loseTips.push('Concentrate a superior force to destroy the enemy forces one by one.')
// 加载死亡提示