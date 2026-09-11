/* 剧情对话引擎（UI 扩展版）。
 * playDialogue(lines, onDone)：按序播放对白，结束后调用 onDone。
 *
 * 每句对白至少需要 { who, text }，还可以按需添加：
 * side: 'left' | 'right'     说话人所在一侧
 * portrait: '图片路径'       人物立绘（不填时沿用该侧上一张）
 * role: '人物身份'           显示在姓名旁的小字
 * chapter: '章节标题'        画面上方的章节名
 * location: '地点 · 年份'    章节名下方的小字
 * kind: 'briefing'           将该页显示为战役简报
 * actionLabel: '按钮文字'    自定义该页的按钮文字
 */
function playDialogue(lines, onDone) {
	if (!lines || !lines.length) { if (onDone) onDone(); return; }

	const overlay = document.createElement('div');
	overlay.className = 'dialog-overlay';
	overlay.setAttribute('role', 'dialog');
	overlay.setAttribute('aria-modal', 'true');
	overlay.setAttribute('aria-label', '战前剧情');

	const chapter = document.createElement('div');
	chapter.className = 'dialog-chapter';
	const chapterName = document.createElement('strong');
	const chapterLocation = document.createElement('span');
	chapter.appendChild(chapterName);
	chapter.appendChild(chapterLocation);

	function makePortrait(side) {
		const holder = document.createElement('div');
		holder.className = 'dialog-portrait dialog-portrait--' + side + ' is-empty';
		const img = document.createElement('img');
		img.alt = '';
		img.draggable = false;
		holder.appendChild(img);
		overlay.appendChild(holder);
		return { holder: holder, img: img, source: '' };
	}

	const portraits = {
		left: makePortrait('left'),
		right: makePortrait('right')
	};

	const box = document.createElement('div');
	box.className = 'dialog-box';

	const heading = document.createElement('div');
	heading.className = 'dialog-heading';
	const identity = document.createElement('div');
	identity.className = 'dialog-identity';
	const who = document.createElement('div');
	who.className = 'dialog-who';
	const role = document.createElement('div');
	role.className = 'dialog-role';
	const progress = document.createElement('div');
	progress.className = 'dialog-progress';
	identity.appendChild(who);
	identity.appendChild(role);
	heading.appendChild(identity);
	heading.appendChild(progress);

	const text = document.createElement('div');
	text.className = 'dialog-text';
	text.setAttribute('aria-live', 'polite');
	const next = document.createElement('button');
	next.type = 'button';
	next.className = 'game-btn dialog-next';
	next.textContent = '继续';

	box.appendChild(heading);
	box.appendChild(text);
	box.appendChild(next);
	overlay.appendChild(chapter);
	overlay.appendChild(box);

	/* 预先找到左右两侧第一次出现的立绘，让开场第一帧就能两侧站人。 */
	lines.forEach(function (line) {
		const side = line.side === 'right' ? 'right' : 'left';
		if (line.portrait && !portraits[side].source) {
			portraits[side].source = line.portrait;
			portraits[side].img.src = line.portrait;
			portraits[side].img.alt = line.who || '剧情人物';
			portraits[side].holder.classList.remove('is-empty');
		}
	});

	let i = 0;
	function show(j) {
		const line = lines[j] || {};
		const side = line.side === 'right' ? 'right' : 'left';
		const isBriefing = line.kind === 'briefing';

		if (line.portrait) {
			portraits[side].source = line.portrait;
			portraits[side].img.src = line.portrait;
			portraits[side].img.alt = line.who || '剧情人物';
			portraits[side].holder.classList.remove('is-empty');
		}

		['left', 'right'].forEach(function (position) {
			const holder = portraits[position].holder;
			holder.classList.toggle('is-speaking', !isBriefing && position === side);
			holder.classList.toggle('is-listening', isBriefing || position !== side);
		});

		overlay.dataset.scene = line.scene || 'campaign';
		box.classList.toggle('dialog-box--briefing', isBriefing);
		chapterName.textContent = line.chapter || '帝国战记';
		chapterLocation.textContent = line.location || '';
		who.textContent = line.who || '';
		role.textContent = line.role || '';
		text.textContent = line.text || '';
		progress.textContent = String(j + 1).padStart(2, '0') + ' / ' + String(lines.length).padStart(2, '0');
		next.textContent = line.actionLabel || (j === lines.length - 1 ? '完成' : '继续');
	}

	function finish() {
		document.body.classList.remove('dialogue-active');
		overlay.remove();
		if (onDone) onDone();
	}

	function advance() {
		i += 1;
		if (i < lines.length) { show(i); return; }
		finish();
	}

	next.addEventListener('click', function (e) {
		e.stopPropagation();
		advance();
	});

	document.body.classList.add('dialogue-active');
	document.body.appendChild(overlay);
	show(0);
	next.focus();
}
