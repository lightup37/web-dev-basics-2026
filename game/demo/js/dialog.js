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

/* 同一人物的静止帧与动作帧分开保存。
 * 动作帧真正改变了手臂、腿部和表情；CSS 只负责在两帧之间完成一次过渡，
 * 不再用整张立绘反复平移、旋转来冒充人物动作。 */
const DIALOGUE_ACTION_PORTRAITS = {
	napoleon: {
		command: 'img/portraits/napoleon-command.webp',
		resolve: 'img/portraits/napoleon-plan.webp'
	},
	adjutant: {
		report: 'img/portraits/adjutant-report.webp'
	},
	courier: {
		report: 'img/portraits/courier-report.webp'
	},
	'coalition-commander': {
		challenge: 'img/portraits/coalition-challenge.webp'
	}
};

function dialoguePortraitKey(source) {
	const match = String(source || '').match(/([^/]+)\.(?:png|webp|jpe?g)$/i);
	return match ? match[1].toLowerCase() : '';
}

function dialogueActionPortraitSource(source, action) {
	const variants = DIALOGUE_ACTION_PORTRAITS[dialoguePortraitKey(source)];
	if (!variants) return '';
	if (variants[action]) return variants[action];
	return variants.report || variants.challenge || variants.command || variants.resolve || '';
}

/* main.js 用它把本关会用到的动作帧与原立绘一起预热，避免第一句动作闪现。 */
function dialogueActionPortraitSources(source) {
	const variants = DIALOGUE_ACTION_PORTRAITS[dialoguePortraitKey(source)];
	return variants ? Array.from(new Set(Object.values(variants))) : [];
}

function playDialogue(lines, onDone) {
	if (!lines || !lines.length) { if (onDone) onDone(); return; }
	const localize = function (value) {
		return (typeof uiLocalize === 'function') ? uiLocalize(value) : (value || '');
	};
	const translate = function (key, fallback) {
		return (typeof uiT === 'function') ? uiT(key) : fallback;
	};

	const overlay = document.createElement('div');
	overlay.className = 'dialog-overlay';
	overlay.setAttribute('role', 'dialog');
	overlay.setAttribute('aria-modal', 'true');
	overlay.setAttribute('aria-label', translate('dialogue.label', '战前剧情'));

	const chapter = document.createElement('div');
	chapter.className = 'dialog-chapter';
	const chapterName = document.createElement('strong');
	const chapterLocation = document.createElement('span');
	chapter.appendChild(chapterName);
	chapter.appendChild(chapterLocation);

	function makePortrait(side) {
		const holder = document.createElement('div');
		holder.className = 'dialog-portrait dialog-portrait--' + side + ' is-empty';
		const actor = document.createElement('div');
		actor.className = 'dialog-portrait__actor';
		const img = document.createElement('img');
		img.className = 'dialog-portrait__neutral';
		img.alt = '';
		img.draggable = false;
		const actionImg = document.createElement('img');
		actionImg.className = 'dialog-portrait__action';
		actionImg.alt = '';
		actionImg.draggable = false;
		actionImg.setAttribute('aria-hidden', 'true');
		actor.appendChild(img);
		actor.appendChild(actionImg);
		holder.appendChild(actor);
		overlay.appendChild(holder);
		return { holder: holder, actor: actor, img: img, actionImg: actionImg, source: '', actionSource: '' };
	}

	const portraits = {
		left: makePortrait('left'),
		right: makePortrait('right')
	};

	const box = document.createElement('div');
	box.className = 'dialog-box';
	const crest = document.createElement('div');
	crest.className = 'dialog-crest';
	crest.setAttribute('aria-hidden', 'true');
	const crestMonogram = document.createElement('strong');
	crestMonogram.className = 'dialog-crest__monogram';
	crestMonogram.textContent = 'N';
	const crestLabel = document.createElement('span');
	crestLabel.className = 'dialog-crest__label';
	crestLabel.textContent = 'GRANDE ARMÉE';
	crest.appendChild(crestMonogram);
	crest.appendChild(crestLabel);

	const paper = document.createElement('div');
	paper.className = 'dialog-paper';

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
	const skip = document.createElement('button');
	skip.type = 'button';
	skip.className = 'dialog-skip';
	skip.textContent = translate('dialogue.skip', '跳过剧情');

	paper.appendChild(heading);
	paper.appendChild(text);
	box.appendChild(crest);
	box.appendChild(paper);
	box.appendChild(next);
	overlay.appendChild(chapter);
	overlay.appendChild(box);
	overlay.appendChild(skip);

	/* 预先找到左右两侧第一次出现的立绘，让开场第一帧就能两侧站人。 */
	const actionPreloads = [];
	lines.forEach(function (line, index) {
		const side = line.side === 'right' ? 'right' : 'left';
		if (line.portrait && !portraits[side].source) {
			portraits[side].source = line.portrait;
			portraits[side].img.src = line.portrait;
			portraits[side].img.alt = localize(line.who) || translate('dialogue.character', '剧情人物');
			portraits[side].holder.classList.remove('is-empty');
		}
		const actionSource = dialogueActionPortraitSource(line.portrait, inferPortraitAction(line, index));
		if (actionSource && !actionPreloads.some(function (image) { return image.src.indexOf(actionSource) !== -1; })) {
			const image = new Image();
			image.decoding = 'async';
			image.src = actionSource;
			actionPreloads.push(image);
			if (typeof image.decode === 'function') image.decode().catch(function () { /* load 事件仍可继续 */ });
		}
	});

	let i = 0;
	let motionTick = 0;
	let finished = false;
	const duckedAudio = [];
	document.querySelectorAll('audio').forEach(function (audio) {
		const previous = Number.isFinite(Number(audio.volume)) ? Number(audio.volume) : 0.5;
		duckedAudio.push({ audio: audio, volume: previous });
		audio.volume = Math.min(previous, 0.16);
	});
	function inferPortraitAction(line, index) {
		if (line.action) return line.action;
		const identity = String(line.who || '') + ' ' + String(line.role || '');
		if (/传令|副官|通讯|上士|report|courier|aide/i.test(identity)) return 'report';
		if (/联军|coalition|防线/i.test(identity)) return 'challenge';
		return index % 2 === 0 ? 'command' : 'resolve';
	}

	function refreshPortraitIdentity(position) {
		const portrait = portraits[position];
		const source = String(portrait.source || '');
		portrait.holder.classList.toggle('is-napoleon', /napoleon/i.test(source));
	}

	function show(j) {
		const line = lines[j] || {};
		const side = line.side === 'right' ? 'right' : 'left';
		const isBriefing = line.kind === 'briefing';
		const pendingMotions = [];
		const action = inferPortraitAction(line, j);

		if (line.portrait) {
			portraits[side].source = line.portrait;
			portraits[side].img.src = line.portrait;
			portraits[side].img.alt = localize(line.who) || translate('dialogue.character', '剧情人物');
			portraits[side].holder.classList.remove('is-empty');
		}
		refreshPortraitIdentity('left');
		refreshPortraitIdentity('right');

		['left', 'right'].forEach(function (position) {
			const portrait = portraits[position];
			const holder = portrait.holder;
			const speaking = !isBriefing && position === side;
			holder.classList.toggle('is-speaking', speaking);
			holder.classList.toggle('is-listening', isBriefing || position !== side);
			holder.classList.remove('is-gesturing', 'is-reacting', 'is-performing', 'is-action-command', 'is-action-report', 'is-action-challenge', 'is-action-resolve');
			if (speaking) {
				portrait.actionSource = dialogueActionPortraitSource(portrait.source, action);
				if (portrait.actionSource) {
					if (portrait.actionImg.getAttribute('src') !== portrait.actionSource) {
						portrait.actionImg.src = portrait.actionSource;
					}
					holder.dataset.actionFrame = portrait.actionSource;
					pendingMotions.push({
						holder: holder,
						actor: portrait.actor,
						actionImg: portrait.actionImg,
						classes: ['is-gesturing', 'is-performing', 'is-action-' + action]
					});
				} else {
					delete holder.dataset.actionFrame;
				}
			}
		});

		const tick = ++motionTick;
		/* 动作图片解码完成后才开始换帧，静止帧会一直保留到那一刻。
		 * 每句都先移除 is-performing，再强制布局并挂回，保证连续发言也会
		 * 从静止姿态做一次完整动作；动作结束后停在新姿态，不循环摇摆。 */
		pendingMotions.forEach(function (motion) {
			const begin = function () {
				if (tick !== motionTick || !document.body.contains(overlay)) return;
				void motion.actor.offsetWidth;
				motion.holder.classList.add.apply(motion.holder.classList, motion.classes);
			};
			if (motion.actionImg.complete && motion.actionImg.naturalWidth > 0) {
				begin();
			} else if (typeof motion.actionImg.decode === 'function') {
				motion.actionImg.decode().then(begin).catch(function () {
					motion.actionImg.addEventListener('load', begin, { once: true });
				});
			} else {
				motion.actionImg.addEventListener('load', begin, { once: true });
			}
		});
		overlay.dataset.motionTick = String(tick);
		overlay.dataset.speaker = localize(line.who);
		overlay.dataset.speakerAction = action;
		overlay.dataset.motionMode = pendingMotions.length ? 'pose-frame' : 'still';

		overlay.dataset.scene = line.scene || 'campaign';
		box.classList.toggle('dialog-box--briefing', isBriefing);
		crest.classList.toggle('dialog-crest--briefing', isBriefing);
		crestMonogram.textContent = isBriefing ? '✦' : 'N';
		chapterName.textContent = localize(line.chapter) || translate('dialogue.campaign', '帝国战记');
		chapterLocation.textContent = localize(line.location);
		who.textContent = localize(line.who);
		role.textContent = localize(line.role);
		text.textContent = localize(line.text);
		progress.textContent = String(j + 1).padStart(2, '0') + ' / ' + String(lines.length).padStart(2, '0');
		next.textContent = localize(line.actionLabel) || translate(j === lines.length - 1 ? 'dialogue.finish' : 'dialogue.continue', j === lines.length - 1 ? '完成' : '继续');
		skip.textContent = translate('dialogue.skip', '跳过剧情');
		overlay.setAttribute('aria-label', translate('dialogue.label', '剧情对话'));

		/* 姓名和正文逐句淡入，切换语言时也会立即刷新。 */
		box.classList.remove('is-line-entering');
		void box.offsetWidth;
		box.classList.add('is-line-entering');
	}

	function finish() {
		if (finished) return;
		finished = true;
		motionTick += 1;
		window.removeEventListener('ui:languagechange', refreshLanguage);
		document.removeEventListener('keydown', onDialogueKey);
		duckedAudio.forEach(function (item) {
			if (item.audio && item.audio.isConnected) item.audio.volume = item.volume;
		});
		document.body.classList.remove('dialogue-active');
		overlay.classList.add('is-leaving');
		window.setTimeout(function () {
			overlay.remove();
			if (onDone) onDone();
		}, 260);
	}

	function advance() {
		i += 1;
		if (i < lines.length) { show(i); return; }
		finish();
	}

	/* 背景音乐：进对话就先尝试播放；被浏览器拦下才退回"点这个按钮才播"
	   —— 游戏页原本的触发点就是这个"继续"按钮（js/bgm.js）。 */
	if (typeof initBgm === 'function') initBgm('game-music', next);

	next.addEventListener('click', function (e) {
		e.stopPropagation();
		advance();
	});
	skip.addEventListener('click', function (e) {
		e.stopPropagation();
		finish();
	});
	/* ⚠️ 对话必须支持键盘推进（Enter / Space）。
	 * 2026-09-16：有玩家反馈"一直卡在加载" —— 排查发现某些渲染环境下底部对话框
	 * 那一层不参与绘制，玩家只看到背后地图和一枚 N 徽记，也就找不到"继续"按钮在哪。
	 * 只靠鼠标点按钮的话，这种情况下玩家就真的出不去了（虽然 index.html 侧
	 * 还有 30s 兜底会把人送到主界面，但体验很差）。
	 * 加上键盘推进后，哪怕看不见按钮，按一下回车/空格也能继续读剧情。 */
	function onDialogueKey(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			finish();
			return;
		}
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
			/* 焦点在按钮上时交给按钮自己的 click，避免一按推进两句。 */
			const ae = document.activeElement;
			if (ae && (ae === next || ae === skip)) return;
			e.preventDefault();
			advance();
		}
	}
	document.addEventListener('keydown', onDialogueKey);

	function refreshLanguage() { show(i); }
	window.addEventListener('ui:languagechange', refreshLanguage);

	document.body.classList.add('dialogue-active');
	document.body.appendChild(overlay);
	show(0);
	next.focus();
}
