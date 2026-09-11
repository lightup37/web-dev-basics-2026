/* 棋子移动方式 */

function movePieceTo(id, row, col) {
	// 将 id 号棋子移动到 (row, col) 格
  const piece = document.getElementById(id);
  if (!piece) return;

  const x = Math.round(offset + distance * row);
  const y = Math.round(offset + distance * col);

  piece.style.left = x + 'px';
  piece.style.top = y + 'px';
}