/* 背景音乐统一入口（2026-09）
 *
 * 全站规则一致：**先尝试播放**；如果被浏览器的自动播放策略拦下，
 * 再退回该页原本的"点击播放"设置 ——
 *   · 首页 / 主界面 / 成就页 / 四个结局页：挂在 document 上（等页面首次点击）；
 *   · 游戏页（game1~game7）：挂在剧情弹窗的"继续"按钮上（原本就是这个触发点）。
 *
 * 用法：
 *   initBgm('menu-music');              // 失败时等 document 首次点击
 *   initBgm('game-music', nextButton);  // 失败时等这个按钮被点击
 *
 * 注意：元素不存在时静默返回 null（game8 没有背景音乐，也不引用本文件）。
 */
var BGM_MUTED_KEY = 'napoleon-sound-muted';
var bgmMuted = (function () {
	try { return localStorage.getItem(BGM_MUTED_KEY) === '1'; }
	catch (e) { return false; }
})();

function isBgmMuted() { return bgmMuted; }

function setBgmMuted(muted) {
	bgmMuted = !!muted;
	try { localStorage.setItem(BGM_MUTED_KEY, bgmMuted ? '1' : '0'); }
	catch (e) { /* 隐私模式下只保留本页状态。 */ }
	document.querySelectorAll('audio').forEach(function (audio) {
		audio.muted = bgmMuted;
		if (bgmMuted) audio.pause();
		else {
			try {
				var attempt = audio.play();
				if (attempt && typeof attempt.catch === 'function') attempt.catch(function () { /* 等下一次用户点击 */ });
			} catch (e) { /* 浏览器禁止时保持未静音，下一次 initBgm 会继续尝试。 */ }
		}
	});
	window.dispatchEvent(new CustomEvent('bgm:statechange', { detail: { muted: bgmMuted } }));
	return bgmMuted;
}

function toggleBgmMuted() { return setBgmMuted(!bgmMuted); }

function initBgm(id, fallbackEl) {
	var el = document.getElementById(id);
	if (!el) return null;
	el.volume = 0.5;
	el.muted = bgmMuted;
	if (bgmMuted) { el.pause(); return el; }

	var armed = false;

	function armClickFallback() {
		if (armed) return;
		armed = true;
		var target =
			fallbackEl && typeof fallbackEl.addEventListener === 'function'
				? fallbackEl
				: document;
		target.addEventListener(
			'click',
			function () {
				armed = false;   // 这一下再被拦，就重新挂回来
				tryPlay();
			},
			{ once: true }
		);
	}

	function tryPlay() {
		var p;
		try {
			p = el.play();
		} catch (e) {
			armClickFallback();
			return;
		}
		if (p && typeof p.catch === 'function') p.catch(armClickFallback);
	}

	tryPlay();
	return el;
}

window.isBgmMuted = isBgmMuted;
window.setBgmMuted = setBgmMuted;
window.toggleBgmMuted = toggleBgmMuted;
