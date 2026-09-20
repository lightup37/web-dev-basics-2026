/* 负责箭头 */

let isArrowVisible = false;
// 维护箭头显示状态，避免错误显示

function updateArrow(fromX, fromY, toX, toY) {
	// 创造从起点指向终点的箭头
  arrowLine.setAttribute('x1', fromX);
  arrowLine.setAttribute('y1', fromY);
  arrowLine.setAttribute('x2', toX);
  arrowLine.setAttribute('y2', toY);
  arrowLine.style.display = 'block';
  isArrowVisible = true;
}

function hideArrow() {
	// 隐藏箭头
  arrowLine.style.display = 'none';
  isArrowVisible = false;
}