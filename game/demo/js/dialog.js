/* 剧情对话引擎（to-do #13）。
 * playDialogue(lines, onDone)：按序弹出对话气泡（lines: [{who, text}, ...]），
 * 点"继续"翻页，播完调 onDone。任何页面都能用（全局函数，无依赖）。
 */
function playDialogue(lines, onDone) {
	if (!lines || !lines.length) { if (onDone) onDone(); return; }

	const overlay = document.createElement('div');
	overlay.className = 'dialog-overlay';
	const box = document.createElement('div');
	box.className = 'dialog-box';

	const who = document.createElement('div');
	who.className = 'dialog-who';
	const text = document.createElement('div');
	text.className = 'dialog-text';
	const next = document.createElement('button');
	next.className = 'game-btn dialog-next';
	next.textContent = '继续';

	box.appendChild(who);
	box.appendChild(text);
	box.appendChild(next);
	overlay.appendChild(box);

	let i = 0;
	function show(j) {
		who.textContent = lines[j].who || '';
		text.textContent = lines[j].text || '';
		next.textContent = (j === lines.length - 1) ? '完' : '继续';
	}
	function advance() {
		i += 1;
		if (i < lines.length) { show(i); return; }
		overlay.remove();
		if (onDone) onDone();
	}
	next.addEventListener('click', function (e) {
		e.stopPropagation();
		advance();
	});

	document.body.appendChild(overlay);
	show(0);
}
