/* 棋子移动方式 */

function movePieceTo(id, row, col) {
	// 将 id 号棋子移动到 (row, col) 格
  const piece = document.getElementById(id);
  if (!piece) return;

  /* 横向用 distance/offset，纵向优先用 boardStepY/boardOffsetY（B02 起由
   * measureBoardGeometry() 统一给出）。棋盘是正方形时两者一致，
   * 这里保留分开的写法是为了极窄屏下纵横格宽出现亚像素差时仍然对得上。 */
  const stepY = (typeof boardStepY === 'number' && boardStepY > 0) ? boardStepY : distance;
  const offY = (typeof boardOffsetY === 'number' && boardOffsetY > 0) ? boardOffsetY : offset;
  const x = Math.round(offset + distance * row);
  const y = Math.round(offY + stepY * col);

  piece.style.left = x + 'px';
  piece.style.top = y + 'px';
}