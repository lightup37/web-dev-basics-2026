/* UI 提示组件（2026-09）
 *
 * 目的：把玩家流程里的原生 alert() / confirm() 换成项目内、可样式化的提示，
 *       原生弹窗会阻塞页面 JS 且样式不可控。
 *
 * 提供四个全局函数：
 *   toast(msg)                     底部轻提示（保存成功、已载入、读档继续…）
 *   achievementToast(title, desc)   右上角浮动提示（成就解锁 / 隐藏路线开启），可堆叠、点击可关
 *   modalConfirm(msg, onOk)        卡片式确认弹窗（取消 / 确定），只有点"确定"才执行 onOk
 *   modalNotice(msg, onClose)      卡片式通知弹窗（仅"确定"）
 *
 * 依赖：css/style.css 末尾的 .ui-* 样式。DOM 不可用时自动退回原生弹窗，不会静默失败。
 */
(function () {
	'use strict';

	function makeEl(tag, cls) {
		var el = document.createElement(tag);
		if (cls) el.className = cls;
		return el;
	}

	function stack(id, cls) {
		var box = document.getElementById(id);
		if (!box) {
			box = makeEl('div', cls);
			box.id = id;
			document.body.appendChild(box);
		}
		return box;
	}

	function enter(node) {
		window.requestAnimationFrame(function () { node.classList.add('is-in'); });
	}

	function leave(node, ms) {
		node.classList.remove('is-in');
		window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, ms || 240);
	}

	/* 底部轻提示 */
	function toast(msg, ms) {
		if (typeof document === 'undefined' || !document.body) { try { alert(msg); } catch (e) { } return null; }
		var box = stack('ui-toast-stack', 'ui-toast-stack');
		var node = makeEl('div', 'ui-toast');
		node.textContent = msg;
		box.appendChild(node);
		enter(node);
		window.setTimeout(function () { leave(node); }, ms || 2600);
		return node;
	}

	/* 右上角浮动提示（成就 / 解锁） */
	function achievementToast(title, desc, ms) {
		if (typeof document === 'undefined' || !document.body) {
			try { alert(title + (desc ? '\n' + desc : '')); } catch (e) { }
			return null;
		}
		var box = stack('ui-achv-stack', 'ui-achv-stack');
		var node = makeEl('div', 'ui-achv');
		var head = makeEl('div', 'ui-achv-title');
		head.textContent = '★ ' + title;
		node.appendChild(head);
		if (desc) {
			var body = makeEl('div', 'ui-achv-desc');
			body.textContent = desc;
			node.appendChild(body);
		}
		node.title = '点击关闭';
		node.addEventListener('click', function () { leave(node); });
		box.appendChild(node);
		enter(node);
		window.setTimeout(function () { leave(node); }, ms || 4500);
		return node;
	}

	/* 卡片式弹窗：buttons = [{ text, kind, onPick }] */
	function buildModal(msg, buttons) {
		if (typeof document === 'undefined' || !document.body) return null;
		var mask = makeEl('div', 'ui-modal-mask');
		var box = makeEl('div', 'ui-modal');
		var text = makeEl('p', 'ui-modal-text');
		text.textContent = msg;
		var actions = makeEl('div', 'ui-modal-actions');

		function close() {
			document.removeEventListener('keydown', onKey);
			if (mask.parentNode) mask.parentNode.removeChild(mask);
		}
		function onKey(e) { if (e.key === 'Escape') { close(); } }

		buttons.forEach(function (b) {
			var btn = makeEl('button', 'ui-btn' + (b.kind === 'primary' ? ' ui-btn--primary' : ''));
			btn.type = 'button';
			btn.textContent = b.text;
			btn.addEventListener('click', function () {
				close();
				if (typeof b.onPick === 'function') b.onPick();
			});
			actions.appendChild(btn);
		});

		/* 点遮罩 = 取消（等同按 ESC） */
		mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
		document.addEventListener('keydown', onKey);

		box.appendChild(text);
		box.appendChild(actions);
		mask.appendChild(box);
		document.body.appendChild(mask);
		var first = actions.querySelector('.ui-btn--primary') || actions.firstChild;
		if (first && first.focus) first.focus();
		return { mask: mask, close: close };
	}

	/* 确认弹窗：仅"确定"时执行 onOk */
	function modalConfirm(msg, onOk, opt) {
		opt = opt || {};
		if (typeof document === 'undefined' || !document.body) {
			var yes = true;
			try { yes = confirm(msg); } catch (e) { }
			if (yes && typeof onOk === 'function') onOk();
			return null;
		}
		return buildModal(msg, [
			{ text: opt.cancelText || '取消' },
			{ text: opt.okText || '确定', kind: 'primary', onPick: onOk }
		]);
	}

	/* 通知弹窗：只有"确定" */
	function modalNotice(msg, onClose, opt) {
		opt = opt || {};
		if (typeof document === 'undefined' || !document.body) {
			try { alert(msg); } catch (e) { }
			if (typeof onClose === 'function') onClose();
			return null;
		}
		return buildModal(msg, [
			{ text: opt.okText || '知道了', kind: 'primary', onPick: onClose }
		]);
	}

	window.toast = toast;
	window.achievementToast = achievementToast;
	window.modalConfirm = modalConfirm;
	window.modalNotice = modalNotice;
})();
