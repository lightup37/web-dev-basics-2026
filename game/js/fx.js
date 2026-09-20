/* ============================================================
 * fx.js — 战场表现层特效（2026-09 新增）
 *
 * 设计原则（与 main.js 的约定）：
 *   1. 不干扰游戏逻辑：本文件只读取棋子状态、创建 DOM，绝不修改 posx/lp/target；
 *   2. 不逐帧创建 DOM：main.js 在每个"帧"只做两件极轻量的事——
 *        fxMarkMoving(unit, x0, y0)  记录移动起点（每回合每单位只记一次）
 *        fxMarkFired(unit, target)   记录一次开火（每回合每对单位只聚合一次）
 *      注意：两个参数都是 armys 里的军队数据对象（含 id/posx/posy/disabled），
 *      DOM 元素由本文件按 unit.id = 'piece-N' 自行解析；
 *      24 帧全部跑完后由 fxFlush() 统一生成特效；
 *   3. 特效坐标一律锚定"事件发生瞬间"的棋盘坐标：
 *      单位可能在本回合开火后又移动（击杀目标后继续推进），绝不能用单位的
 *      最终坐标画火光/曳光，否则正在滑动的棋子身上会冒出战斗特效；
 *   4. 尊重系统设置：prefers-reduced-motion 或页面不可见时不生成特效；
 *   5. 所有特效节点自动过期清理，调试期可用 fxDebug.liveCount() 巡检。
 * ============================================================ */

(function () {
	'use strict';

	/* ---------- 可调参数（集中在这里，方便美术/策划微调） ---------- */
	const PUFFS_PER_SHOT = 6;        // 每次开火喷出的烟雾团数量
	const PUFF_MS = 1500;            // 烟雾寿命
	const FLASH_MS = 240;            // 枪口火光寿命
	const TRACER_MS = 320;           // 弹道曳光寿命
	const IMPACT_MS = 760;           // 命中冲击环寿命
	const TRAIL_MAX = 10;            // 单次移动尾迹最多尘团数
	const TRAIL_MS = 1400;           // 尾迹尘团寿命
	const TRAIL_MIN_CELLS = 0.3;     // 位移小于该格数不画尾迹
	const TRAIL_SPACING_CELLS = 0.35;// 尾迹尘团间距（格）
	const SPAWN_DELAY_MS = 40;       // 特效错峰生成的间隔
	const MAX_NODES = 200;           // 单层节点软上限，超了直接丢弃新特效
	const FIRE_STAY_EPS = 0.05;      // 开火点与最终位置差 ≤ 该格数视为"原地开火"

	let distance = 0;
	let offset = 0;
	let boardLayer = null;   // #fx-layer：烟雾 / 火光 / 弹道 / 命中（盖在棋子上）
	let trailLayer = null;   // #fx-trail-layer：行军扬尘（压在棋子下，像留在地上的土）
	let moveMap = new Map(); // key(unit.id) -> { unit, x0, y0 }
	let fireMap = new Map(); // key(shooter.id->target.id) -> { unit, target, fx, fy, tx, ty }

	const prefersReduced = typeof window.matchMedia === 'function'
		&& window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function ensureGeometry() {
		const board = document.getElementById('board');
		if (!board) return false;
		const a = board.querySelector('.cell[data-row="0"][data-col="0"]');
		const b = board.querySelector('.cell[data-row="1"][data-col="1"]');
		if (!a || !b) return false;
		const ra = a.getBoundingClientRect();
		const rb = b.getBoundingClientRect();
		distance = rb.left - ra.left;
		offset = ra.width / 2;
		return distance > 0;
	}

	/* 特效层 #fx-layer 与棋子都是 #board 的绝对定位子元素（containing block
	 * 为 padding box），因此坐标必须与 pieces.js 的 movePieceTo 完全一致：
	 * 相对棋盘内容区的 left/top = offset + distance * 逻辑坐标，
	 * 不能加 getBoundingClientRect 的屏幕偏移（否则整体错位一个棋盘位置）。 */
	function getBoardPointXY(posx, posy) {
		return {
			x: offset + posx * distance,
			y: offset + posy * distance
		};
	}

	/* 军队数据对象 -> 棋盘 DOM 元素（可能已被移除/重绘，拿不到就返回 null）。 */
	function getUnitElement(unit) {
		if (!unit || !unit.id) return null;
		return document.getElementById(unit.id);
	}

	/* ⚠️ B06：必须检查特效层是否还"活着"。
	 * loadSnapshot()/loadGame() 会重建 #board 的 innerHTML，旧的特效层节点随之被移除，
	 * 但 boardLayer / trailLayer 这两个缓存引用仍然指着那些已经脱离文档的节点——
	 * 于是读档之后 smoke/trail 全部挂到了看不见的旧节点上，画面里没有任何特效。
	 * 判据：节点存在、仍连接在文档里、且父节点就是当前 board。 */
	function layerUsable(node, board) {
		return !!node && node.isConnected === true && node.parentNode === board;
	}

	function ensureLayers() {
		const board = document.getElementById('board');
		if (!board) return null;
		if (!layerUsable(boardLayer, board)) {
			if (boardLayer && boardLayer.parentNode) boardLayer.parentNode.removeChild(boardLayer);
			boardLayer = document.createElement('div');
			boardLayer.id = 'fx-layer';
			boardLayer.setAttribute('aria-hidden', 'true');
			boardLayer.style.cssText =
				'position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:120;';
			board.appendChild(boardLayer);
		}
		if (!layerUsable(trailLayer, board)) {
			if (trailLayer && trailLayer.parentNode) trailLayer.parentNode.removeChild(trailLayer);
			trailLayer = document.createElement('div');
			trailLayer.id = 'fx-trail-layer';
			trailLayer.setAttribute('aria-hidden', 'true');
			trailLayer.style.cssText =
				'position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:8;';
			board.appendChild(trailLayer);
		}
		return board;
	}

	function pageVisible() {
		return typeof document.hidden === 'boolean' ? !document.hidden : true;
	}

	function scheduleSpawn(layer, maker, delay) {
		if (!layer) return;
		if (layer.childElementCount >= MAX_NODES) return;
		window.setTimeout(function () {
			if (window.fxEnabled === false) return;
			if (layer.childElementCount < MAX_NODES) maker();
		}, delay);
	}

	function expire(node, ms) {
		window.setTimeout(function () {
			if (node && node.parentNode) node.parentNode.removeChild(node);
		}, ms + 120);
	}

	function rand(min, max) { return min + Math.random() * (max - min); }

	/* ---------------- 行军：扬尘尾迹 + 颠簸 ---------------- */

	function spawnDust(layer, point) {
		const d = document.createElement('span');
		d.className = 'fx-dust';
		const size = rand(10, 18);
		d.style.left = (point.x - size / 2) + 'px';
		d.style.top = (point.y - size / 2) + 'px';
		d.style.width = size + 'px';
		d.style.height = size + 'px';
		layer.appendChild(d);
		expire(d, TRAIL_MS);
	}

	/* unit = armys 中的军队数据对象；x0/y0 = 本回合移动前的逻辑坐标。 */
	function fxMarkMoving(unit, x0, y0) {
		if (prefersReduced || !pageVisible()) return;
		if (window.fxEnabled === false) return;
		if (!unit || unit.disabled) return;
		const key = unit.id;
		if (moveMap.has(key)) return;              // 每回合每单位只记一次起点
		moveMap.set(key, { unit: unit, x0: x0, y0: y0 });
		const el = getUnitElement(unit);
		if (el) {
			el.classList.add('is-marching');
			window.setTimeout(function () {
				el.classList.remove('is-marching');
			}, 680);
		}
	}

	/* 只有骑兵在行军时扬起尘烟尾迹。
	 * 步兵 / 炮兵 / 散兵 / 掷弹兵是步行或缓行推进，扬尘既不符合直觉，
	 * 也会让整张棋盘到处都是尘团、盖住棋子与射程圈。
	 * 注意：行军颠簸（.is-marching，见 fxMarkMoving）仍然给所有兵种保留 ——
	 * 那是"这一步动了"的即时反馈，与地面尾迹是两件事。 */
	function unitLeavesDustTrail(unit) {
		return !!unit && unit.cls === '骑';
	}

	function flushMovement(rec) {
		const unit = rec.unit;
		if (!unit || unit.disabled) return;
		if (!unitLeavesDustTrail(unit)) return;
		const x1 = unit.posx;
		const y1 = unit.posy;
		const dx = x1 - rec.x0;
		const dy = y1 - rec.y0;
		const distCells = Math.hypot(dx, dy);
		if (distCells < TRAIL_MIN_CELLS) return;
		const steps = Math.min(TRAIL_MAX, Math.max(2, Math.floor(distCells / TRAIL_SPACING_CELLS)));
		for (let i = 1; i <= steps; i++) {
			const t = i / (steps + 1);
			const px = rec.x0 + dx * t;
			const py = rec.y0 + dy * t;
			const point = getBoardPointXY(px, py);
			/* 越靠后的尘团越早出现，整体看起来像一路被甩在身后；
			 * 尘团画在地面层（旧坐标），单位滑走后尾迹留在原地。 */
			const delay = (steps - i) * 14;
			scheduleSpawn(trailLayer, function () { spawnDust(trailLayer, point); }, delay);
		}
	}

	/* ---------------- 开火：烟雾 + 火光 + 曳光 + 命中 ---------------- */

	function spawnBurst(layer, point) {
		for (let i = 0; i < PUFFS_PER_SHOT; i++) {
			const p = document.createElement('span');
			p.className = 'fx-smoke';
			const size = rand(9, 20);
			const angle = rand(0, Math.PI * 2);
			const radius = rand(2, 13);
			p.style.left = (point.x + Math.cos(angle) * radius - size / 2) + 'px';
			p.style.top = (point.y + Math.sin(angle) * radius * 0.55 - size / 2) + 'px';
			p.style.width = size + 'px';
			p.style.height = size + 'px';
			scheduleSpawn(layer, function () { layer.appendChild(p); expire(p, PUFF_MS); }, i * 18);
		}
		const flash = document.createElement('span');
		flash.className = 'fx-muzzle';
		flash.style.left = (point.x - 13) + 'px';
		flash.style.top = (point.y - 13) + 'px';
		layer.appendChild(flash);
		expire(flash, FLASH_MS);
	}

	function spawnTracer(layer, start, finish) {
		const dx = finish.x - start.x;
		const dy = finish.y - start.y;
		const len = Math.hypot(dx, dy);
		if (len < 4) return;
		const angle = Math.atan2(dy, dx) * 180 / Math.PI;
		const tracer = document.createElement('span');
		tracer.className = 'fx-tracer';
		tracer.style.left = start.x + 'px';
		tracer.style.top = (start.y - 1) + 'px';
		tracer.style.width = len + 'px';
		tracer.style.transform = 'rotate(' + angle + 'deg)';
		tracer.style.transformOrigin = '0 50%';
		layer.appendChild(tracer);
		expire(tracer, TRACER_MS);
	}

	function spawnImpact(layer, point) {
		const ring = document.createElement('span');
		ring.className = 'fx-impact';
		ring.style.left = (point.x - 12) + 'px';
		ring.style.top = (point.y - 12) + 'px';
		layer.appendChild(ring);
		expire(ring, IMPACT_MS);
		for (let i = 0; i < 3; i++) {
			const spark = document.createElement('span');
			spark.className = 'fx-spark';
			const angle = rand(0, Math.PI * 2);
			const radius = rand(4, 12);
			spark.style.left = (point.x + Math.cos(angle) * radius - 2) + 'px';
			spark.style.top = (point.y + Math.sin(angle) * radius - 2) + 'px';
			layer.appendChild(spark);
			expire(spark, 360);
		}
	}

	/* unit / target 均为军队数据对象。 */
	function fxMarkFired(unit, target) {
		if (prefersReduced || !pageVisible()) return;
		if (window.fxEnabled === false) return;
		if (!unit || !target) return;
		if (unit.disabled || target.disabled) return;
		const key = unit.id + '->' + target.id;
		if (fireMap.has(key)) return;             // 同一回合同一对单位只聚合一次
		/* 关键：记录"开火瞬间"双方的棋盘坐标。单位击杀目标后可能继续滑动，
		 * flush 时绝不能改用它们的最终坐标。 */
		fireMap.set(key, {
			unit: unit,
			target: target,
			fx: unit.posx,
			fy: unit.posy,
			tx: target.posx,
			ty: target.posy
		});
	}

	function flushFire(rec) {
		const unit = rec.unit;
		if (!unit || unit.disabled) return;
		const el = getUnitElement(unit);

		/* 单位开火后又离开了开火点（典型：击杀当前目标后继续推进）：
		 * 枪口火光的后坐 class 不再挂到正在滑动的棋子身上，烟雾/曳光按
		 * 开火瞬间的旧坐标画在地面上，避免"移动中的棋子冒战斗特效"。 */
		const stayed = Math.hypot(unit.posx - rec.fx, unit.posy - rec.fy) <= FIRE_STAY_EPS;
		if (stayed && el) {
			el.classList.add('is-firing');
			window.setTimeout(function () {
				el.classList.remove('is-firing');
			}, 320);
		}

		const muzzle = getBoardPointXY(rec.fx, rec.fy);
		const impact = getBoardPointXY(rec.tx, rec.ty);
		spawnBurst(boardLayer, muzzle);
		spawnTracer(boardLayer, muzzle, impact);
		scheduleSpawn(boardLayer, function () {
			spawnImpact(boardLayer, impact);
		}, 150);
	}

	/* ---------------- 回合末统一结算 ---------------- */

	function fxFlush() {
		if (!ensureGeometry()) return;
		const board = ensureLayers();
		if (!board) return;
		if (prefersReduced || !pageVisible() || window.fxEnabled === false) {
			moveMap.clear();
			fireMap.clear();
			return;
		}
		moveMap.forEach(flushMovement);
		fireMap.forEach(flushFire);
		moveMap.clear();
		fireMap.clear();
	}

	function fxReset() {
		moveMap.clear();
		fireMap.clear();
		if (boardLayer) boardLayer.innerHTML = '';
		if (trailLayer) trailLayer.innerHTML = '';
	}

	window.fxEnabled = true;
	window.fxMarkMoving = fxMarkMoving;
	window.fxMarkFired = fxMarkFired;
	window.fxFlush = fxFlush;
	window.fxReset = fxReset;
	window.fxDebug = {
		liveCount: function () {
			return {
				smoke: boardLayer ? boardLayer.querySelectorAll('.fx-smoke').length : 0,
				trails: trailLayer ? trailLayer.childElementCount : 0,
				pendingMoves: moveMap.size,
				pendingFires: fireMap.size
			};
		},
		clearAll: function () {
			if (boardLayer) boardLayer.innerHTML = '';
			if (trailLayer) trailLayer.innerHTML = '';
			moveMap.clear();
			fireMap.clear();
		}
	};
})();
