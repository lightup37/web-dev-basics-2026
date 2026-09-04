function movePieceTo(id, row, col) {
	console.log(`move: ${id}, ${row}, ${col}`);
  const piece = document.getElementById(id);
  if (!piece) return;

  const x = Math.round(offset + distance * row);
  const y = Math.round(offset + distance * col);

  piece.style.left = x + 'px';
  piece.style.top = y + 'px';
	console.log(`move pieces x=${piece.style.left}, y=${piece.style.top}`)
}