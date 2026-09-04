let isArrowVisible = false;

function updateArrow(fromX, fromY, toX, toY) {
  arrowLine.setAttribute('x1', fromX);
  arrowLine.setAttribute('y1', fromY);
  arrowLine.setAttribute('x2', toX);
  arrowLine.setAttribute('y2', toY);
  arrowLine.style.display = 'block';
  isArrowVisible = true;
}

function hideArrow() {
  arrowLine.style.display = 'none';
  isArrowVisible = false;
}