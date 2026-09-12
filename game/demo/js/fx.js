/* 开火特效 + 移动尾迹（2026-09）
 *
 * 表现层，不改动 nextStep() 的移动 / 攻击逻辑。main.js 里只有 4 行钩子：
 *   fxMarkFired(unit, target)   开火结算处标记（每个单位每回合只记一次）→ 烟雾 + 枪口火光
 *   fxMarkMoving(unit)          移动落点处标记（每个单位每回合只记一次）→ 沿路径铺尾迹
 *   fxFlush()                   24 帧跑完后调用一次，统一生成上述特效
 *
 * 设计要点：
 *   - 一回合内部同步跑 24 帧，逐帧生成会瞬间造出 24×N 个节点，因此按"单位/回合"聚合：
 *     开火 1 撮烟（6 烟团 + 1 火光）、移动 1 条尾迹（≤6 个尘团，沿路径等距分布）；
 *   - 生成延迟 400ms，与棋子 CSS 滑行（transition 0.4s）对齐；尾迹按"尾→头"错开出现，
 *     看起来是被落在身后；
 *   - 两层：烟雾/火光在 #fx-layer（z 120，盖住棋子），尾迹在 #fx-trail-layer（z 8，压在棋子下）；
 *   - 坐标用棋盘几何换算：left = offset + distance*pos（与 pieces.js 的 movePieceTo 一致），
 *     distance/offset 由 .cell 的实测矩形推出（它们不是全局变量），不依赖 DOM 过渡时机；
 *   - 节点总量上限 MAX_NODES，超出丢最旧；动画结束即移除；
 *   - window.fxEnabled = false 可即时关闭；系统 prefers-reduced-motion / 页面不可见时自动不生成。
 */
(function () {
	'use strict';

	/* ---- 可调参数 ---- */
	var PUFFS = 6;             // 每撮烟团数（加浓后）
	var PUFF_MS = 1500;        // 烟团寿命（与 CSS 动画一致）
	var FLASH_MS = 240;        // 枪口火光寿命
	var TRAIL_MAX = 10;        // 单条尾迹最多尘团数
	var TRAIL_MS = 1400;       // 尘团寿命
	var TRAIL_MIN_CELL = 0.3;  // 位移小于该值（格）不画尾迹
	var TRAIL_SPACING = 0.35;  // 尾迹尘团的目标间距（格）
	var SPAWN_DELAY = 400;     // 与棋子滑行对齐
	var MAX_NODES = 200;       // 同屏节点上限

	/* ---- 状态 ---- */
	var fired = [];            // { unit, target }
	var moved = [];            // { unit, x0, y0 }
	var live = [];             // 存活节点（用于上限回收）

	window.fxEnabled = true;

	function fxOn() {
		if (window.fxEnabled === false) return false;
		if (typeof document === 'undefined' || document.hidden) return false;
		try {
			if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
		} catch (e) { /* 老浏览器忽略 */ }
		return true;
	}

	function layer(id, cls, z) {
		var board = document.getElementById('board');
		if (!board) return null;
		var el = document.getElementById(id);
		if (!el) {
			el = document.createElement('div');
			el.id = id;
			el.className = cls;
			board.appendChild(el);   // 动态创建，页面 DOM 不用改
		}
		return el;
	}
	function fxLayer() { return layer('fx-layer', 'fx-above', 120); }
	function trailLayer() { return layer('fx-trail-layer', 'fx-below', 8); }

	/* 棋盘几何：distance = 相邻格心间距(px)，offset = 格宽/2（与 pieces.js 的换算一致） */
	function geom() {
		var d = document;
		var c00 = d.querySelector('#board .cell[data-row="0"][data-col="0"]');
		var c11 = d.querySelector('#board .cell[data-row="1"][data-col="1"]');
		if (!c00 || !c11) return null;
		var r0 = c00.getBoundingClientRect();
		var r1 = c11.getBoundingClientRect();
		var dist = r1.left - r0.left;
		if (!(dist > 0)) dist = r1.top - r0.top;
		if (!(dist > 0)) return null;
		return { dist: dist, off: r0.width / 2 };
	}

	/* 单位尺寸（棋子直径 px），用于烟雾/尾迹的大小与偏移 */
	function unitSize(unit) {
		var piece = (unit && unit.id) ? document.getElementById(unit.id) : null;
		if (!piece) return 0;
		return piece.getBoundingClientRect().width;
	}

	/* 登记并按时回收节点 */
	function track(node, ms) {
		live.push(node);
		while (live.length > MAX_NODES) {
			var old = live.shift();
			if (old && old.parentNode) old.parentNode.removeChild(old);
		}
		window.setTimeout(function () {
			if (node.parentNode) node.parentNode.removeChild(node);
			var i = live.indexOf(node);
			if (i >= 0) live.splice(i, 1);
		}, ms);
	}

	/* ---- 开火：一撮烟（绕棋子外圈）+ 枪口火光 ---- */
	function burst(unit, size) {
		var box = fxLayer();
		var g = geom();
		if (!box || !g) return;
		var cx = g.off + g.dist * unit.posx;
		var cy = g.off + g.dist * unit.posy;
		var unitPx = size || unitSize(unit) || (g.dist / 2);

		for (var i = 0; i < PUFFS; i++) {
			var puff = document.createElement('div');
			puff.className = 'fx-puff';
			var ang = Math.random() * Math.PI * 2;
			var rad = unitPx * (0.45 + Math.random() * 0.5);
			puff.style.left = (cx + Math.cos(ang) * rad).toFixed(1) + 'px';
			puff.style.top = (cy + Math.sin(ang) * rad).toFixed(1) + 'px';
			puff.style.setProperty('--fx-scale', (1.1 + Math.random() * 0.9).toFixed(2));
			puff.style.animationDelay = Math.round(Math.random() * 160) + 'ms';
			box.appendChild(puff);
			track(puff, PUFF_MS + 350);
		}
	}

	function flash(unit, target) {
		var box = fxLayer();
		var g = geom();
		if (!box || !g || !target) return;
		var dx = target.posx - unit.posx;
		var dy = target.posy - unit.posy;
		var len = Math.sqrt(dx * dx + dy * dy);
		if (!len) return;
		var size = unitSize(unit) || (g.dist / 2);
		var cx = g.off + g.dist * unit.posx;
		var cy = g.off + g.dist * unit.posy;
		var off = size * 0.5;
		var el = document.createElement('div');
		el.className = 'fx-flash';
		el.style.left = (cx + dx / len * off).toFixed(1) + 'px';
		el.style.top = (cy + dy / len * off).toFixed(1) + 'px';
		el.style.transform = 'translate(-50%, -50%) rotate(' + Math.round(Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)';
		box.appendChild(el);
		track(el, FLASH_MS + 220);
	}

	/* ---- 移动：沿路径铺一条尘迹（尾→头错开出现） ---- */
	function trail(unit, rec) {
		var box = trailLayer();
		var g = geom();
		if (!box || !g) return;
		var dcx = unit.posx - rec.x0;
		var dcy = unit.posy - rec.y0;
		var cells = Math.sqrt(dcx * dcx + dcy * dcy);
		if (cells < TRAIL_MIN_CELL) return;

		var total = Math.min(TRAIL_MAX, Math.max(1, Math.round(cells / TRAIL_SPACING)));
		var x0 = g.off + g.dist * rec.x0;
		var y0 = g.off + g.dist * rec.y0;
		var x1 = g.off + g.dist * unit.posx;
		var y1 = g.off + g.dist * unit.posy;
		var unitPx = unitSize(unit) || (g.dist / 2);

		for (var i = 0; i < total; i++) {
			var t = total === 1 ? 0.35 : (i / (total - 1));   // 0 = 起点（尾），1 = 终点（头）
			var dust = document.createElement('div');
			dust.className = 'fx-trail';
			// 垂直于路径的随机抖动，让尘迹有宽度
			var nx = -dcy, ny = dcx;
			var nl = cells || 1;
			var jitter = (Math.random() - 0.5) * unitPx * 0.55;
			dust.style.left = (x0 + (x1 - x0) * t + (nx / nl) * jitter).toFixed(1) + 'px';
			dust.style.top = (y0 + (y1 - y0) * t + (ny / nl) * jitter).toFixed(1) + 'px';
			dust.style.setProperty('--fx-trail-scale', (0.8 + Math.random() * 0.6).toFixed(2));
			dust.style.animationDelay = Math.round(t * (SPAWN_DELAY - 40)) + 'ms';   // 尾先、头后
			box.appendChild(dust);
			track(dust, TRAIL_MS + SPAWN_DELAY + 250);
		}
	}

	/* ---- 对外：标记 ---- */
	function markFired(unit, target) {
		if (!unit) return;
		for (var i = 0; i < fired.length; i++) {
			if (fired[i].unit === unit) return;
		}
		fired.push({ unit: unit, target: target || null });
	}

	function markMoving(unit) {
		if (!unit) return;
		for (var i = 0; i < moved.length; i++) {
			if (moved[i].unit === unit) return;   // 只记本回合第一次出现的位置作为路径起点
		}
		moved.push({ unit: unit, x0: unit.posx, y0: unit.posy });
	}

	/* ---- 对外：回合结束统一生成 ---- */
	function flush() {
		var fireList = fired.slice();
		var moveList = moved.slice();
		fired.length = 0;
		moved.length = 0;
		if (!fireList.length && !moveList.length) return;
		window.setTimeout(function () {
			if (!fxOn()) return;
			moveList.forEach(function (rec) {
				if (!rec.unit || rec.unit.disabled) return;   // 本回合已阵亡的不画
				trail(rec.unit, rec);
			});
			fireList.forEach(function (rec) {
				if (!rec.unit || rec.unit.disabled) return;
				flash(rec.unit, rec.target);
				burst(rec.unit);
			});
		}, SPAWN_DELAY);
	}

	/* ---- 供控制台调试 / 验收 ---- */
	window.fxMarkFired = markFired;
	window.fxMarkMoving = markMoving;
	window.fxFlush = flush;
	window.fxDebug = {
		liveCount: function () { return live.length; },
		clearAll: function () {
			live.slice().forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
			live.length = 0;
			fired.length = 0;
			moved.length = 0;
		}
	};
})();
