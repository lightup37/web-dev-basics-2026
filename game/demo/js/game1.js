var game1 = {
	n: 10,
	m: 10,
	pieces: new Array()
} ;

const ATK_RANGE_standard = 0.5;
const MOVING_SPEED_standard = 0.5;
const LP_standard = 10;
const ATK_standard = 0.5;

game1.pieces.push({color: "blue", class: "步", posx: 0.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: "blue", class: "步", posx: 0.0, posy: 1.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: "blue", class: "步", posx: 1.0, posy: 0.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color: "blue", class: "步", posx: 1.0, posy: 1.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

game1.pieces.push({color:  "red", class: "步", posx: 6.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:  "red", class: "步", posx: 6.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:  "red", class: "步", posx: 7.5, posy: 7.5, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:  "red", class: "步", posx: 9.0, posy: 6.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});
game1.pieces.push({color:  "red", class: "步", posx: 9.0, posy: 9.0, speed: MOVING_SPEED_standard, atkrange: ATK_RANGE_standard, atk: ATK_standard, lp: LP_standard});

loadGame(game1);