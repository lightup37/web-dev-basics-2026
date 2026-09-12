/* 主界面 · 存档与进度系统（2026-09 从 menu.html 的内联脚本独立出来）
 *
 * 负责：
 *   页面上  —— 战役地图 #campaign-map：底图 img/europe-map.svg 上按 levels.js 的 map{lon,lat}
 *                摆旗标（关号 + 下方星级 / 进行中 / 隐藏关；完整关名在 title 里），
 *                **只画到"已解锁到的关卡"**（后面的不出现，打到哪长到哪）；
 *                已通关的段 = 红色流动虚线，还没打通的下一段 = 浅灰静止虚线；
 *                刚通关回来（?unlock=N）时下一段先"延伸"到终点，跑完才放出下一关的标记。
 *                旗标就是关卡入口（隐藏关只在 hiddenRouteOpen() 为真时出现）。
 *              （2026-09 第 4 版起页面上的 #save-note"已通关 N 关"摘要与地图下方的小字已删除）
 *   弹窗里  —— 点 #btn-saves 打开的卡片（复用 css 的 .ui-modal-mask / .ui-modal）：
 *              手动备份 存档1~3 的「载入 / 删除」（每行都写明该档的进度与星级；
 *              **空档位也有「载入」，点了用 toast 提示"是空的"**）+ "重新开始游戏"。
 *
 * 依赖：
 *   save.js   —— autoProgress / manualSummaries / loadManualToAuto / clearManual /
 *                resetAutoSave / hiddenRouteOpen / hasBeatenLevel / fileName
 *   levels.js —— getLevelList / getHiddenLevel
 *   ui.js     —— toast / modalConfirm（未加载时自动退回原生 confirm / alert）
 *
 * 对外接口：renderMenuSaves()、bindMenuSaves()、bindMenuRestart()
 * 注：成就是账号级数据，已独立到 achievements.html（js/menu-achv.js）展示；
 *     "重新开始"仍会清空成就，该页每次打开都重新渲染，因此这里无需跨模块刷新。
 */
(function () {
	'use strict';

	var MODAL_ID = 'save-modal';

	function currentU() {
		return (typeof currentUser === 'function') ? currentUser() : null;
	}

	function starsText(s) {
		return s > 0 ? '★'.repeat(s) + '☆'.repeat(3 - s) : '未通关';
	}

	/* ============ 页面部分：摘要 + 战役地图（旗标 + 红色推进路线） ============ */

	/* 经纬度 -> 地图百分比。参数必须与 img/europe-map.svg 的生成参数一致：
	   横轴等经度、纵轴墨卡托，范围 lon −10..40 / lat 34..60，视口 1000x785。
	   改地图范围时这两处要一起改。 */
	var MAP = { lonMin: -10, lonMax: 40, latMin: 34, latMax: 60, w: 1000, h: 785 };
	function mercY(lat) { return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)); }
	function mapPos(m) {
		var top = mercY(MAP.latMax), bottom = mercY(MAP.latMin);
		return {
			x: ((m.lon - MAP.lonMin) / (MAP.lonMax - MAP.lonMin)) * 100,
			y: ((top - mercY(m.lat)) / (top - bottom)) * 100
		};
	}
	/* 同一个点在路线 SVG 里的坐标（viewBox 单位）。SVG 的 viewBox 与底图等比（1000x785），
	   所以虚线的疏密、线宽在横竖方向上都是均匀的，不会看着歪。 */
	function mapUnits(m) {
		var p = mapPos(m);
		return { x: (p.x / 100) * MAP.w, y: (p.y / 100) * MAP.h };
	}

	/* 地图上的星级：没通关显示三颗空心星，避免出现"未通关"这种字 */
	function mapStars(s) {
		return s > 0 ? '★'.repeat(s) + '☆'.repeat(3 - s) : '☆☆☆';
	}

	/* 带 ?unlock=<刚通关的关号> 进来 = 刚从结算页回来，播一次"路线解锁"动画 */
	function unlockParam() {
		var m = /[?&]unlock=(\d+)/.exec(window.location.search);
		return m ? Number(m[1]) : null;
	}

	/* 关卡之间的连线：已通关 → 红色虚线（静止，无动画）；还没打通的下一段 → 浅灰静止虚线。
	   刚从结算页回来时，新解锁那段先用遮罩让虚线"一段一段加载出来"（慢，3s），
	   跑完再放出下一关的标记。 */
	var DRAW_MS = 3000;   /* 必须与 css 的 map-route-draw 时长一致 */

	/* 把一个条目画成地图标记：
	   锚点是一个 0 尺寸的点（left/top 正好落在投影坐标上），圆点与下方星级都相对它居中，
	   这样连线连到锚点时正好落在圆点中心，不会看着歪。 */
	function buildPin(entry) {
		var pos = mapPos(entry.map);
		var el = document.createElement(entry.href ? 'a' : 'span');
		el.className = 'map-pin map-pin--' + entry.state +
			(entry.hidden ? ' map-pin--hidden' : '') +
			(entry.fresh ? ' map-pin--wait' : '');
		el.style.left = pos.x + '%';
		el.style.top = pos.y + '%';
		el.title = entry.title;
		if (entry.href) {
			el.href = entry.href;
		}
		var dot = document.createElement('span');
		dot.className = 'map-pin__dot';
		dot.textContent = entry.no;
		var stars = document.createElement('span');
		stars.className = 'map-pin__stars';
		stars.textContent = entry.starsText;
		el.appendChild(dot);
		el.appendChild(stars);
		el.dataset.level = entry.no;
		el.dataset.state = entry.state;
		return el;
	}

	/* 延伸动画结束：撤掉遮罩与那层"加载中"的线，放出下面那根红色虚线，并让新标记弹出来 */
	function finishReveal(map, svg) {
		var draw = svg.querySelector('.map-route__line--draw');
		if (draw) draw.remove();
		var defs = svg.querySelector('#route-reveal-defs');
		if (defs) defs.remove();
		Array.prototype.forEach.call(svg.querySelectorAll('.map-route__line--pending'), function (l) {
			l.classList.remove('map-route__line--pending');
		});
		Array.prototype.forEach.call(map.querySelectorAll('.map-pin--wait'), function (p) {
			p.classList.remove('map-pin--wait');
			p.classList.add('map-pin--fresh');
		});
	}

	/* 关卡之间的连线：已通关 → 红色静止虚线；还没打通的下一段 → 浅灰静止虚线。
	   新解锁那段（isNew）额外叠一层遮罩，让虚线慢慢"加载"出来。 */
	function renderRoute(svg, entries, unlockId) {
		if (!svg) return;
		svg.innerHTML = '';
		var NS = 'http://www.w3.org/2000/svg';
		for (var i = 0; i < entries.length - 1; i++) {
			var a = mapUnits(entries[i].map), b = mapUnits(entries[i + 1].map);
			var pts = a.x + ',' + a.y + ' ' + b.x + ',' + b.y;
			var done = entries[i].stars > 0;
			var isNew = done && unlockId !== null && Number(entries[i].no) === Number(unlockId);

			var line = document.createElementNS(NS, 'polyline');
			line.setAttribute('points', pts);
			line.setAttribute('class', 'map-route__line ' +
				(done ? 'map-route__line--done' : 'map-route__line--next') +
				(isNew ? ' map-route__line--pending' : ''));
			line.dataset.from = entries[i].no;
			line.dataset.to = entries[i + 1].no;
			line.dataset.kind = 'link';
			svg.appendChild(line);

			if (isNew) {
				// 新解锁那一段要"虚线一段一段加载出来"：给虚线盖一层遮罩，
				// 遮罩里一根白色粗线用 map-route-draw 慢慢从起点擦到终点 —— 被擦到的虚线才露出来。
				// 遮罩用 userSpaceOnUse 并把范围写成整个 viewBox：水平/垂直线的 bbox 有一边是 0，
				// 默认的 objectBoundingBox 区域会被算成 0 宽度，线就整根看不见了。
				var defs = document.createElementNS(NS, 'defs');
				defs.setAttribute('id', 'route-reveal-defs');
				var mask = document.createElementNS(NS, 'mask');
				mask.setAttribute('id', 'route-reveal');
				mask.setAttribute('maskUnits', 'userSpaceOnUse');
				mask.setAttribute('x', '0');
				mask.setAttribute('y', '0');
				mask.setAttribute('width', '1000');
				mask.setAttribute('height', '785');
				var wipe = document.createElementNS(NS, 'polyline');
				wipe.setAttribute('points', pts);
				wipe.setAttribute('class', 'map-route__mask-line');
				wipe.setAttribute('pathLength', '100');
				mask.appendChild(wipe);
				defs.appendChild(mask);
				svg.appendChild(defs);

				var draw = document.createElementNS(NS, 'polyline');
				draw.setAttribute('points', pts);
				draw.setAttribute('class', 'map-route__line map-route__line--draw');
				draw.setAttribute('mask', 'url(#route-reveal)');
				draw.dataset.from = entries[i].no;
				draw.dataset.to = entries[i + 1].no;
				draw.dataset.kind = 'draw';
				svg.appendChild(draw);
			}
		}
	}

	function renderProgress() {
		var user = currentU();
		var map = document.getElementById('campaign-map');
		if (!user || !map) return;

		var LEVELS = (typeof getLevelList === 'function') ? getLevelList() : [];
		var auto = autoProgress(user);
		var unlockId = unlockParam();
		var frontier = Number(auto.unlocked) || 1;   // 已解锁到第几关

		// —— 只显示"已解锁到的关卡"（随进度一关一关长出来；后面的关卡先不出现）——
		var entries = [];
		LEVELS.forEach(function (lv) {
			if (!lv.map) return;
			var cont = !!(auto.snapshot && Number(auto.snapshot.level) === lv.id);
			if (Number(lv.id) > frontier && !cont) return;   // 还没解锁：不显示
			var s = Number(auto.stars['' + lv.id]) || 0;
			var state = cont ? 'cont' : (s > 0 ? 'done' : 'open');
			entries.push({
				no: lv.id, map: lv.map, stars: s, cont: cont, state: state,
				starsText: mapStars(s),
				title: lv.name + ' —— ' + (cont ? '进行中，点标记继续'
					: (s > 0 ? mapStars(s) + '，可重玩' : '未通关，点标记开始')),
				href: cont ? (lv.file + '?resume=1') : (s > 0 || Number(lv.id) <= frontier ? lv.file : ''),
				fresh: unlockId !== null && Number(lv.id) === unlockId + 1   // 刚解锁的这一关：弹出动画
			});
		});

		// —— 隐藏关：第 1~6 关全 3 星开启路线后才出现标记；没通关第 6 关时是"？？？"（沿用原规则）——
		if (typeof hiddenRouteOpen === 'function' && hiddenRouteOpen()) {
			var hm = (typeof getHiddenLevel === 'function') ? getHiddenLevel() : null;
			if (hm && hm.map) {
				var lv6ok = (typeof hasBeatenLevel === 'function') ? hasBeatenLevel(user, 6) : false;
				var hs7 = Number(auto.stars['7']) || 0;
				var hcont = !!(auto.snapshot && Number(auto.snapshot.level) === 7);
				entries.push({
					no: 7, map: hm.map, stars: hs7, cont: hcont, hidden: true,
					state: hcont ? 'cont' : (hs7 > 0 ? 'done' : 'open'),
					starsText: lv6ok ? mapStars(hs7) : '？？？',
					title: lv6ok ? (hm.name + '（隐藏关）') : '隐藏关 —— 需第 1~6 关全部 3 星且通关第 6 关',
					href: lv6ok ? (hm.file + (hcont ? '?resume=1' : '')) : '',
					fresh: false
				});
			}
		}

		// —— 重绘：先连线（在底图之上、标记之下），再标记 ——
		Array.prototype.forEach.call(map.querySelectorAll('.map-pin'), function (n) { n.remove(); });
		var svg = map.querySelector('.campaign-map__route');
		renderRoute(svg, entries, unlockId);
		entries.forEach(function (e) { map.appendChild(buildPin(e)); });

		// 刚通关（带了 ?unlock=）：先让新解锁那段"延伸"到终点，跑完再放出下一关的标记。
		// 开了"减少动态效果"就直接全部显示，不做延迟。
		var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
		if (unlockId !== null && !reduced) {
			window.setTimeout(function () { finishReveal(map, svg); }, DRAW_MS);
		} else {
			finishReveal(map, svg);
		}

		// 动画只播一次：把 ?unlock= 从地址栏抹掉（刷新不再重播）
		if (unlockId !== null && window.history && window.history.replaceState) {
			try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { }
		}
	}

	/* ============ 弹窗部分：手动备份 1/2/3 + 重新开始 ============ */

	/* 单个手动档的进度描述：通关了几关 / 各关星级 / 是否有进行中的关 */
	function slotDetail(f) {
		if (!f) return '（空）';
		var LEVELS = (typeof getLevelList === 'function') ? getLevelList() : [];
		var stars = f.stars || {};
		var beaten = [];
		var starSum = 0;
		LEVELS.forEach(function (lv) {
			var s = Number(stars['' + lv.id]) || 0;
			if (s > 0) {
				beaten.push('第' + lv.id + '关 ' + starsText(s));
				starSum += s;
			}
		});

		var parts = [];
		parts.push(beaten.length
			? '已通关 ' + beaten.length + ' 关 · 星级 ' + starSum + '/' + (LEVELS.length * 3)
			: '尚无通关记录');
		if (beaten.length) parts.push(beaten.join(' · '));
		parts.push(f.snapshot
			? '第 ' + f.snapshot.level + ' 关进行中（剩余 ' + f.snapshot.remain_turns + ' 回合）'
			: '无进行中的关');
		return parts.join(' ｜ ');
	}

	function renderManualList() {
		var list = document.getElementById('manual-list');
		if (!list) return;
		var user = currentU();
		list.innerHTML = '';

		manualSummaries(user).forEach(function (m) {
			var f = m.file;
			var li = document.createElement('li');
			li.className = 'level-row';
			var info = document.createElement('span');
			info.className = 'level-info';
			info.innerHTML = '<span class="level-name">' + fileName(m.id) + '</span>' +
				'<span class="level-stars">' + slotDetail(f) + '</span>';
			li.appendChild(info);

			if (f) {
				var load = document.createElement('button');
				load.className = 'game-btn';
				load.textContent = '载入';
				load.onclick = (function (id) {
					return function () {
						var ask = '载入 ' + fileName(id) + ' 会用它的内容覆盖当前自动存档 a.save，继续？';
						var doLoad = function () {
							if (loadManualToAuto(user, id)) {
								if (typeof toast === 'function') toast('已载入 ' + fileName(id) + ' 到 a.save');
								renderMenuSaves();
							}
						};
						if (typeof modalConfirm === 'function') { modalConfirm(ask, doLoad); return; }
						if (!confirm(ask)) return;
						doLoad();
					};
				})(m.id);
				li.appendChild(load);

				var del = document.createElement('button');
				del.className = 'game-btn';
				del.textContent = '删除';
				del.onclick = (function (id) {
					return function () {
						var ask = '删除 ' + fileName(id) + '？';
						var doDel = function () { clearManual(user, id); renderMenuSaves(); };
						if (typeof modalConfirm === 'function') { modalConfirm(ask, doDel); return; }
						if (confirm(ask)) doDel();
					};
				})(m.id);
				li.appendChild(del);
			} else {
				// 空档位也给"载入"按钮：第一次点只提示，**再点一次才真的用空档覆盖 a.save**
				// （覆盖 = 把进度清空，成就与手动备份保留；对应 save.js 的 clearAuto()）。
				var emptyLoad = document.createElement('button');
				emptyLoad.className = 'game-btn';
				emptyLoad.textContent = '载入';
				emptyLoad.onclick = (function (id, btn) {
					return function () {
						if (btn.dataset.armed !== '1') {
							btn.dataset.armed = '1';
							btn.textContent = '仍要载入';
							var hint = fileName(id) + ' 是空的。再点一次将用它覆盖 a.save（清空进度，成就与手动备份保留）。';
							if (typeof toast === 'function') toast(hint); else alert(hint);
							return;
						}
						if (typeof clearAuto === 'function') clearAuto(user);
						if (typeof toast === 'function') toast('已用空白存档覆盖 a.save：通关进度已清空');
						renderMenuSaves();
					};
				})(m.id, emptyLoad);
				li.appendChild(emptyLoad);
			}
			list.appendChild(li);
		});
	}

	/* 构建"存档 / 读档"卡片（懒加载：第一次点按钮时才建） */
	function buildSaveModal() {
		var mask = document.createElement('div');
		mask.className = 'ui-modal-mask';
		mask.id = MODAL_ID;

		var card = document.createElement('div');
		card.className = 'ui-modal ui-modal--wide';
		card.setAttribute('role', 'dialog');
		card.setAttribute('aria-label', '存档 / 读档');

		var title = document.createElement('h3');
		title.className = 'save-modal-title';
		title.textContent = '存档 / 读档';
		card.appendChild(title);

		var list = document.createElement('ul');
		list.id = 'manual-list';
		list.className = 'level-list';
		card.appendChild(list);

		var restart = document.createElement('button');
		restart.id = 'btn-restart';
		restart.className = 'game-btn danger-btn';
		restart.title = '清空活动存档 a.save，从头开始';
		restart.textContent = '重新开始游戏';
		card.appendChild(restart);

		var actions = document.createElement('div');
		actions.className = 'ui-modal-actions';
		var close = document.createElement('button');
		close.type = 'button';
		close.className = 'ui-btn';
		close.textContent = '关闭';
		close.addEventListener('click', closeSaveModal);
		actions.appendChild(close);
		card.appendChild(actions);

		// 点遮罩 = 关闭
		mask.addEventListener('click', function (e) { if (e.target === mask) closeSaveModal(); });

		mask.appendChild(card);
		document.body.appendChild(mask);
		bindMenuRestart();
		return mask;
	}

	function onModalKey(e) { if (e.key === 'Escape') closeSaveModal(); }

	function openSaveModal() {
		var mask = document.getElementById(MODAL_ID) || buildSaveModal();
		renderManualList();
		document.addEventListener('keydown', onModalKey);
		var first = mask.querySelector('.ui-btn');
		if (first && first.focus) first.focus();
	}

	function closeSaveModal() {
		var mask = document.getElementById(MODAL_ID);
		if (mask && mask.parentNode) mask.parentNode.removeChild(mask);
		document.removeEventListener('keydown', onModalKey);
	}

	/* ============ "重新开始游戏" 按钮（在弹窗里） ============ */
	function bindMenuRestart() {
		var btn = document.getElementById('btn-restart');
		if (!btn || btn.dataset.bound === '1') return;
		btn.dataset.bound = '1';
		btn.addEventListener('click', function () {
			var user = currentU();
			if (!user) return;
			var ask = '重新开始将清空活动存档 a.save（通关进度 / 星级 / 进行中快照）与全部成就、连败记录，且不可恢复；手动备份 存档1~3 会保留。确定继续？';
			var doReset = function () {
				resetAutoSave(user);
				if (typeof toast === 'function') toast('已重新开始：a.save、成就与连败记录已清空');
				renderMenuSaves();
				// 成就入口的计数标签由页面外壳的 refreshAchvLink() 负责（成就墙在 achievements.html）
				if (typeof refreshAchvLink === 'function') refreshAchvLink();
			};
			if (typeof modalConfirm === 'function') { modalConfirm(ask, doReset); return; }
			if (!confirm(ask)) return;
			doReset();
		});
	}

	/* ============ 对外接口 ============ */
	/* 页面进度始终刷新；弹窗开着时连带刷新里面的手动档列表 */
	function renderMenuSaves() {
		renderProgress();
		if (document.getElementById(MODAL_ID)) renderManualList();
	}

	function bindMenuSaves() {
		var btn = document.getElementById('btn-saves');
		if (btn) btn.addEventListener('click', openSaveModal);
	}

	window.renderMenuSaves = renderMenuSaves;
	window.bindMenuSaves = bindMenuSaves;
	window.bindMenuRestart = bindMenuRestart;
	window.openSaveModal = openSaveModal;
	window.closeSaveModal = closeSaveModal;
})();
