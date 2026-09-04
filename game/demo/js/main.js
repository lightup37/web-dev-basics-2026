/* 主要代码，负责加载页面，保持游戏运行，判断通关 */

let armys = new Array(0);
let n = 0, m = 0, piece_cnt = 0, remain_turns = 0;
let eps = 0.000001;

let boardContainer = document.getElementById('board'); // 维护 board 的容器, 以备后续使用
let buttonContainer = document.getElementById('button'); // 维护 button 的容器, 以备后续使用

// 初始化棋盘，添加箭头
function getblock() {
	let html = '';
	for(let i = 0; i < n; ++ i) for(let j = 0; j < m; ++ j) html += `<div class="cell" data-row="${i}" data-col="${j}"></div>`;
	return html + `<svg id="arrowSvg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5;">
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <polygon points="0 0, 6 2, 0 4" fill="#ff4444" />
    </marker>
  </defs>
  <line id="arrowLine" 
        x1="0" y1="0" x2="0" y2="0" 
        stroke="#ff4444" 
        stroke-width="2" 
        stroke-dasharray="6, 4" 
        marker-end="url(#arrowhead)" 
        style="display:none;" />
</svg>`;
}

// 对于每一类棋子生成对应的 html
function getHtmlForPiece(element) {
	if(element.img) return `<img src='./img/${element.img}.png' style='width: 120%; height: 120%;' alt='${element.class}' draggable='false'></img>`;
	else return `<p>${element.class}</p>` ;
}

// 以备后续计算棋子位置使用
let distance, offset, arrowLine;

// 将由 html 表示的位置坐标转换为用cell数表示
function getPosByCell(pos) {
	return (pos - offset) / distance ;
}

// 加载游戏
function loadGame(game) {
	n = game.n; m = game.m; remain_turns = game.turns_limit;
	boardContainer.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
	boardContainer.innerHTML = getblock(n, m);
	arrowLine = document.getElementById('arrowLine');
	let POS_00 = document.querySelector(`#board .cell[data-row="${0}"][data-col="${0}"]`).getBoundingClientRect();
	let POS_11 = document.querySelector(`#board .cell[data-row="${1}"][data-col="${1}"]`).getBoundingClientRect();
	distance = POS_11.left - POS_00.left;
	offset = POS_00.width / 2.0;
	/* 加载初始棋盘，计算棋子移动所需常量 */
	/* 棋盘是一个长和宽都是 80dvh 的的窗口，分成 n x m 个 cell，主要是方便布置棋子 */
	/* 在现有的代码中，n 和 m 都保持为 10 */

	document.getElementById('footer-bar').innerHTML = `Win by DESTROYING every <span id="red-hinter" style="font-style: italic; text-decoration: underline;">red</span> army! —— You have ${remain_turns} turns.`;
	document.getElementById('red-hinter').addEventListener('click', showRedEffect) ;
	/* 加载胜利条件与回合限制 */
	
	game.pieces.forEach(element => {
		piece = document.createElement('div');
  	piece.className = `chess chess--${element.color}`;
		piece.id = `piece-${piece_cnt}`;
		piece.innerHTML = getHtmlForPiece(element)
  	boardContainer.appendChild(piece);
		armys.push({
			id: piece.id,
			color: element.color,
			posx: element.posx,
			posy: element.posy,
			speed: element.speed,
			targetx: element.posx,
			targety: element.posy,
			atkrange: element.atkrange,
			atk: element.atk,
			lp: element.lp,
			lpMax: element.lp,
			disabled: false,
			cls: element.class,
			img: element.img || ''
		}) ;
		movePieceTo(piece.id, -1.0, -1.0);
		movePieceTo(piece.id, armys[piece_cnt].posx, armys[piece_cnt].posy);
		piece_cnt ++ ;
	}) ;
	/* 加载棋子 */
	renderOrderArrows();
	showLevelIntro();
}

/* 从存档快照恢复一局（to-do #2/#3）：重建棋盘与棋子，字段与 captureSnapshot() 一一对应 */
function loadSnapshot(snap) {
	n = snap.n; m = snap.m; remain_turns = snap.remain_turns; piece_cnt = 0; armys = new Array(0);
	selectedPieces = [];
	selectedEnemies = [];
	boardContainer.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
	boardContainer.innerHTML = getblock(n, m);
	arrowLine = document.getElementById('arrowLine');
	let POS_00 = document.querySelector(`#board .cell[data-row="${0}"][data-col="${0}"]`).getBoundingClientRect();
	let POS_11 = document.querySelector(`#board .cell[data-row="${1}"][data-col="${1}"]`).getBoundingClientRect();
	distance = POS_11.left - POS_00.left;
	offset = POS_00.width / 2.0;
	document.getElementById('footer-bar').innerHTML = `Resumed from save: Level ${snap.level}, ${remain_turns} turns left.`;
	alert(`已从存档继续：第 ${snap.level} 关，剩余 ${remain_turns} 回合。`);
	snap.units.forEach((u, idx) => {
		const piece = document.createElement('div');
		piece.className = `chess chess--${u.color}`;
		piece.id = `piece-${piece_cnt}`;
		piece.innerHTML = (u.img
			? `<img src='./img/${u.img}.png' style='width: 120%; height: 120%;' alt='' draggable='false'></img>`
			: `<p>${u.cls}</p>`);
		boardContainer.appendChild(piece);
		// 满血上限优先取本关配置的初始 LP（修复旧档缺 lpMax 时"上限=存档时当前血量"的老问题）
		const cfgLp = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.pieces && CURRENT_GAME.pieces[idx])
			? CURRENT_GAME.pieces[idx].lp
			: null;
		const restoredMax = (cfgLp !== null) ? cfgLp : (u.lpMax || u.lp);
		const restoredLp = Math.min(u.lp, restoredMax);
		armys.push({
			id: piece.id,
			color: u.color,
			posx: u.posx, posy: u.posy,
			speed: u.speed,
			targetx: u.targetx, targety: u.targety,
			atkrange: u.atkrange, atk: u.atk, lp: restoredLp,
			lpMax: restoredMax,
			disabled: !!u.disabled,
			cls: u.cls, img: u.img || ''
		});
		movePieceTo(piece.id, u.posx, u.posy);
		if (u.disabled) { piece.classList.add('disabled'); piece.style.display = 'none'; }
		piece_cnt ++;
	});
	refreshSelectedUI();
	refreshEnemySelectionUI();
	renderOrderArrows();
	showLevelIntro();
}

/* 抓取当前这一局的中途状态（手动存档 / 自动存档都用它） */
function captureSnapshot() {
	if (typeof CURRENT_LEVEL_ID === 'undefined') return null;
	return {
		level: CURRENT_LEVEL_ID,
		n: n, m: m,
		remain_turns: remain_turns,
		units: armys.map(u => ({
			color: u.color, cls: u.cls, img: u.img || '',
			posx: u.posx, posy: u.posy,
			targetx: u.targetx, targety: u.targety,
			speed: u.speed, atkrange: u.atkrange, atk: u.atk, lp: u.lp,
			lpMax: u.lpMax,   // 开局/读档时一定已按初始 LP 校准，无需兜底
			disabled: u.disabled
		}))
	};
}

/* 当前登录用户（未登录返回 ''），依赖 account.js */
function currentUserSafe() {
	return (typeof currentUser === 'function') ? currentUser() : '';
}

/* 刷新关卡内"存档目标"下拉：a.save + 存档1/2/3，标注内容；跨关快照标注"非本关，不可读" */
function refreshSlotSelect() {
	const sel = document.getElementById('slot-select');
	if (!sel) return;
	sel.innerHTML = '';
	const user = currentUserSafe();
	const auto = user ? getAuto(user) : null;
	const lvl = (typeof CURRENT_LEVEL_ID === 'undefined') ? null : CURRENT_LEVEL_ID;
	function snapLabel(snap) {
		if (!snap) return null;
		if (snap.level === lvl) return '（第 ' + snap.level + ' 关，剩 ' + snap.remain_turns + ' 回合）';
		return '（第 ' + snap.level + ' 关 · 非本关，不可读）';
	}
	[AUTO_ID].concat(MANUAL_IDS).forEach(function (id) {
		const o = document.createElement('option');
		o.value = id;
		let extra = '（空）';
		if (id === AUTO_ID) {
			if (auto && auto.snapshot) extra = snapLabel(auto.snapshot);
			else if (auto && (auto.unlocked > 1 || Object.keys(auto.stars).length)) extra = '';
		} else {
			const f = user ? getManual(user, id) : null;
			if (f && f.snapshot) extra = snapLabel(f.snapshot);
			else if (f && (f.unlocked > 1 || Object.keys(f.stars).length)) extra = '';
		}
		o.textContent = fileName(id) + extra;
		sel.appendChild(o);
	});
	sel.value = AUTO_ID;
}
refreshSlotSelect();

/* 验收/调试用：控制台向某目标存中途快照（默认 a.save），或清空当前用户全部存档 */
window.__saveMidLevel = function (id) {
	if (typeof CURRENT_LEVEL_ID === 'undefined') { alert('不在关卡内'); return; }
	const user = currentUserSafe();
	if (!user) { alert('未登录'); return; }
	id = isFileId(id) ? String(id) : AUTO_ID;
	const snap = captureSnapshot();
	if (!snap) return;
	const ok = (id === AUTO_ID) ? saveSnapshotToAuto(user, snap) : saveToManual(user, id, snap);
	if (ok) { alert('已保存到 ' + fileName(id)); refreshSlotSelect(); }
};
window.__clearSave = function () {
	const user = currentUserSafe();
	if (user) {
		localStorage.removeItem('a.save:' + user);
		MANUAL_IDS.forEach(function (id) { localStorage.removeItem('save' + id + ':' + user); });
	}
	alert('当前用户的自动存档与手动存档已清空');
};

/* 胜负结算后隐藏"存/读档"与左右显示条（Menu 按钮保留，方便直接退出） */
function hideMidGameControls() {
	const el = document.getElementById('save-load-btns');
	if (el) el.style.display = 'none';
	const bar = document.getElementById('info-bar');
	if (bar) bar.style.display = 'none';
	const ebar = document.getElementById('enemy-info');
	if (ebar) ebar.style.display = 'none';
	const rl = document.getElementById('range-layer');
	if (rl) rl.remove();
	rangeCircles = [];
}

/* 向量归一化，方便计算棋子移动到的位置 */
function normalize(vec) {
	const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
	if(length <= eps) { return {x: 0.0, y: 0.0}; }
	return {
		x: vec.x / length,
		y: vec.y / length
	} ;
}

/* 将棋子的状态设为不能使用的状态的方法 */
function setToDisable(element) {
	element.disabled = true;
	const piece = document.getElementById(element.id);
	piece.classList.add('disabled');
}

/* 计算棋子间距离的方法 */
function calcdis(element1, element2) {
	let disx = element1.posx - element2.posx, disy = element1.posy - element2.posy;
	return Math.sqrt(disx * disx + disy * disy) ;
}

/* 从 armys 中选出距离 element 最近的异色棋子的方法，用于确认棋子攻击目标 */
function selectMinimalDistance(element, armys) {
	let minDisItem = null, minDis = 200.0;
	for(let i = 0; i < armys.length; ++ i) {
		if(armys[i].disabled) continue ;
		if(armys[i].color == element.color) continue ;
		let dis = calcdis(element, armys[i]);
		if(dis < minDis) {
			minDisItem = armys[i]; minDis = dis;
		}
	}
	return minDisItem;
}

/* 将一个回合分成若干'帧'，每一'帧'分别处理 */
/* 若当前回合棋子攻击范围内有敌人，则攻击最近的敌人 */
/* 否则随机攻击 */
function nextStep() {
	let disabledList = new Array();
	armys.forEach(element => {
		if(element.disabled == true) return ;
		let atktar = selectMinimalDistance(element, armys) ;
		// 选出可能的攻击目标
		if(atktar != null) {
			// 判断攻击能否成立
			if(calcdis(element, atktar) < element.atkrange) {
				// 进行攻击，结算伤害
				atktar.lp -= element.atk;
				if(atktar.lp <= 0) disabledList.push(atktar);
				// console.log(`atk between ${element.id} with ${atktar.id}, the latter's LP become ${atktar.lp}`);
				return ;
			}
		}
		// 按照向量指示的方位移动棋子
		let targetvector = normalize({x: element.targetx - element.posx, y: element.targety - element.posy});
		let beforeMove = (element.targetx - element.posx > eps)
		// console.log(`for piece${element.id}, move from (${element.posx}, ${element.posy}) to (${element.posx + targetvector.x * element.speed}, ${element.posy + targetvector.y * element.speed})`);
		element.posx = element.posx + targetvector.x * element.speed ;
		element.posy = element.posy + targetvector.y * element.speed ;
		// 检查是否移过头了，如果移过头了就改为移动到目标位置
		let afterMove = (element.targetx - element.posx > eps);
		if(beforeMove != afterMove) element.posx = element.targetx, element.posy = element.targety;
		movePieceTo(element.id, element.posx, element.posy);
	});
	disabledList.forEach(element => {
		setToDisable(element) ;
	}) ;
}

/* 将灰色的濒死棋子移除 */
function clearDisable() {
	armys.forEach(element => {
		if(element.disabled == true) { 
			const piece = document.getElementById(element.id);
			piece.style.display = 'none' ;
			return ;
		}
	});
}

/* 检查胜负状态 */
function checkWinState() {
	-- remain_turns;
	let redc = 0, bluec = 0;
	armys.forEach(element => {
		if(element.disabled == false) {
			if(element.color == 'red') ++ redc;
			if(element.color == 'blue') ++ bluec;
		}
	}) ;
	// 计算红蓝色棋子数量

	if(redc == 0) {
		// 没有红棋则获胜，根据剩余蓝棋数量给出星级
		boardContainer.style.display = 'none';
		buttonContainer.style = 'display: none;';
		document.getElementById('footer-bar').style = 'display: none';
		document.getElementById('win').style = 'display: flex; flex-direction: column; align-items: center;' ;
		document.getElementById('button-next-game').style = 'width: 100px; height: 50px;';
		// 加载胜利界面
		const star = (bluec == 0) ? 1 : (bluec == 1) ? 2 : 3;
		if(star == 1) {
			const winState = document.getElementById('1star');
			winState.style.display = '' ;
		} else if(star == 2) {
			const winState = document.getElementById('2star');
			winState.style.display = '' ;
		} else {
			const winState = document.getElementById('3star');
			winState.style.display = '' ;
		}
		// 通关自动存档（to-do #2/#3/#14）：记星级、解锁下一关、清掉快照；第 1 关 ≤12 回合通关开隐藏路线
		const usedTurns = (typeof CURRENT_GAME !== 'undefined' && CURRENT_GAME && CURRENT_GAME.turns_limit)
			? CURRENT_GAME.turns_limit - remain_turns
			: 99;
		const quickL1 = usedTurns <= 12;
		if(typeof autosaveOnWin === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
			autosaveOnWin(CURRENT_LEVEL_ID, star, quickL1);
		}
		// to-do #15：连败≥4 后 3 星通关 -> "失败乃成功之母"
		if (typeof tryThreeStarAchievement === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
			tryThreeStarAchievement(CURRENT_LEVEL_ID, star);
		}
		hideMidGameControls();
		return ;
	}
	if(bluec == 0 || remain_turns == 0) {
		// 如果没有蓝棋时还有红棋，或者剩余回合数为 0，则本关失败
		boardContainer.style.display = 'none';
		buttonContainer.style = 'display: none;';
		document.getElementById('lose').style = 'display: flex; flex-direction: column; align-items: center;' ;
		document.getElementById('footer-bar').style = 'display: none';
		document.getElementById('button-replay').style = 'width: 100px; height: 50px;';
		const failBtn = document.getElementById('button-fail');
		if (failBtn) {
			failBtn.style.cssText = 'width:auto; margin-top:8px;';
			if (CURRENT_LEVEL_ID === 7) {
				// 隐藏第 7 关的失败有专属结局：命运无法改变
				failBtn.dataset.target = 'destiny-fail.html';
				failBtn.textContent = '看结局：命运无法改变';
			} else {
				failBtn.dataset.target = 'fail.html';
				failBtn.textContent = 'View Ending: Early Defeat';
			}
		}
		// to-do #15：记录同关连续失败次数
		if (typeof recordLevelFail === 'function' && typeof CURRENT_LEVEL_ID !== 'undefined') {
			recordLevelFail(CURRENT_LEVEL_ID);
		}
		let tip = loseTips[Math.floor(Math.random() * loseTips.length)]
		if (CURRENT_LEVEL_ID === 7) tip = '……帝国第二次折戟于此，命运没有给历史第二次机会。';
		document.getElementById('loseTips').style = '';
		document.getElementById('loseTips').innerHTML = tip;
		hideMidGameControls();
		return ;
	}

	if(remain_turns <= 5) {
		document.getElementById('footer-bar').innerHTML = `You ONLY have ${remain_turns} turns.`;
	} else if(remain_turns <= 10) {
		document.getElementById('footer-bar').innerHTML = `You still have ${remain_turns} turns.`;
	} else {
		document.getElementById('footer-bar').innerHTML = `You have ${remain_turns} turns.`;
	}
	/* 加载剩余回合数 */
}

buttonContainer.addEventListener('click', function() {
	// 点击按钮时推进 24 '帧'
	clearDisable();
	// to-do #9：回合开始前按关卡策略给红方重设一次方向（一回合内不再变）
	if (typeof applyEnemyAI === 'function') applyEnemyAI();
	const movingCounts = 24;
	for(let i = 0; i < movingCounts; ++ i) {
		nextStep();
	}
	
	// 防止误触造成多次触发
	// 测试时会注释，发布时记得删去
	this.disabled = true;
	setTimeout(() => {this.disabled = false;}, 300);
	checkWinState();
	renderInfoPanel();
	renderEnemyPanel();
	updateRangePositions();
	renderOrderArrows();
});

/* ========== to-do #4：选中集合 + 画框多选 ========== */
let selectedPieces = new Array();        // 当前选中的（蓝方）军队，元素为 armys 里的对象
const selectionListeners = new Array();  // #5 左侧显示条等可挂监听，选中变化时收到通知

function getSelection() { return selectedPieces; }
function addSelectionListener(fn) { selectionListeners.push(fn); }
function fireSelectionChanged() {
	selectionListeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略单个监听器的错误 */ } });
}

// 按当前选中集合刷新所有棋子的高亮
function refreshSelectedUI() {
	clearHoverMatches();
	document.querySelectorAll('.chess.selected').forEach(el => el.classList.remove('selected'));
	selectedPieces.forEach(p => {
		const el = document.getElementById(p.id);
		if (el) el.classList.add('selected');
	});
	fireSelectionChanged();
}

function clearSelection() { selectedPieces = []; refreshSelectedUI(); }
function selectOnly(pieceData) { selectedPieces = [pieceData]; refreshSelectedUI(); }
function toggleSelect(pieceData) {
	const i = selectedPieces.indexOf(pieceData);
	if (i >= 0) selectedPieces.splice(i, 1); else selectedPieces.push(pieceData);
	refreshSelectedUI();
}
function selectMany(list) { selectedPieces = list.slice(); refreshSelectedUI(); }
function removeFromSelection(pieceData) {
	const i = selectedPieces.indexOf(pieceData);
	if (i >= 0) { selectedPieces.splice(i, 1); refreshSelectedUI(); }
}

function isAliveBlue(pieceData) { return !!pieceData && pieceData.color === 'blue' && !pieceData.disabled; }

// 给当前所有选中军队下令移动到 (targetX, targetY)（格坐标）。
// 下令后清空选中：避免残留选中导致再次渲染预览箭头（常驻蓝色箭头仍保留，它与选中无关）
function issueMoveTo(targetX, targetY) {
	selectedPieces.forEach(p => { p.targetx = targetX; p.targety = targetY; });
	hideArrow();
	clearOrderPreview();
	clearSelection();
	renderOrderArrows();   // to-do #11：常驻指示箭头随之更新
}

/* ---------- 鼠标交互：单击选棋 / 点空地移动 / 拖拽画框多选 ---------- */
let dragBoxState = null;   // { x0, y0, pieceEl, moved }

function getBoxEl() {
	let el = document.getElementById('boxSel');
	if (!el) { el = document.createElement('div'); el.id = 'boxSel'; boardContainer.appendChild(el); }
	return el;
}
function hideBox() {
	const el = document.getElementById('boxSel');
	if (el) el.style.display = 'none';
}
function updateBox(x1, y1) {
	const rect = boardContainer.getBoundingClientRect();
	const el = getBoxEl();
	const left = Math.min(dragBoxState.x0, x1) - rect.left;
	const top = Math.min(dragBoxState.y0, y1) - rect.top;
	const right = Math.max(dragBoxState.x0, x1) - rect.left;
	const bottom = Math.max(dragBoxState.y0, y1) - rect.top;
	el.style.left = left + 'px';
	el.style.top = top + 'px';
	el.style.width = (right - left) + 'px';
	el.style.height = (bottom - top) + 'px';
	el.style.display = 'block';
}

boardContainer.addEventListener('mousedown', function (e) {
	if (e.button !== 0 || dragBoxState) return;
	dragBoxState = { x0: e.clientX, y0: e.clientY, pieceEl: e.target.closest('.chess') || null, moved: false };
	hideArrow();
});

boardContainer.addEventListener('mousemove', function (e) {
	if (dragBoxState) {
		const dx = e.clientX - dragBoxState.x0, dy = e.clientY - dragBoxState.y0;
		if (!dragBoxState.moved && dx * dx + dy * dy > 25) dragBoxState.moved = true;   // 拖过约 5px 视为画框
		if (dragBoxState.moved) updateBox(e.clientX, e.clientY);
		return;
	}
	// 非拖拽：给"当前所有已选蓝方"画预览箭头（敌人查看模式不预览）
	if (viewMode === 'enemy') {
		clearOrderPreview();
		return;
	}
	renderOrderPreview(e);
});

boardContainer.addEventListener('mouseup', function (e) {
	if (!dragBoxState) return;
	const st = dragBoxState;
	dragBoxState = null;
	clearOrderPreview();   // 一旦点击/松手，预览箭头消失

	if (st.moved) {
		// 画框多选：指挥模式=存活蓝方；查看敌人模式=存活红方
		hideBox();
		const left = Math.min(st.x0, e.clientX), right = Math.max(st.x0, e.clientX);
		const top = Math.min(st.y0, e.clientY), bottom = Math.max(st.y0, e.clientY);
		const inBox = armys.filter(p => {
			if (viewMode === 'enemy' ? !isAliveRed(p) : !isAliveBlue(p)) return false;
			const el = document.getElementById(p.id);
			if (!el) return false;
			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
			return cx >= left && cx <= right && cy >= top && cy <= bottom;
		});
		if (viewMode === 'enemy') selectEnemyMany(inBox); else selectMany(inBox);
		return;
	}

	// 单击语义
	if (st.pieceEl) {
		const pieceData = armys.find(p => p.id === st.pieceEl.id);
		if (viewMode === 'enemy') {
			// 查看敌人模式：单击/加减选红方；点蓝方或空地 = 清空敌方选中
			if (isAliveRed(pieceData)) {
				if (e.ctrlKey || e.shiftKey) toggleEnemy(pieceData);
				else selectEnemyOnly(pieceData);
			} else {
				clearEnemies();
			}
			return;
		}
		if (isAliveBlue(pieceData)) {
			if (e.ctrlKey || e.shiftKey) {
				toggleSelect(pieceData);          // Ctrl/Shift + 单击：加减选中
				return;
			}
			if (selectedPieces.length === 0) {
				selectOnly(pieceData);            // 没有任何选中时，单击=选中它
				return;
			}
			if (selectedPieces.length === 1) {
				// 已有单个选中：点自己=原地待命；点其它单位=让它移动到该单位的位置（原逻辑）
				issueMoveTo(pieceData.posx, pieceData.posy);
				return;
			}
			selectOnly(pieceData);                // 多选状态下点某蓝兵：切换为只选它
			return;
		}
		// 点到红方/死亡单位：指挥模式下当作在该格下令
	}
	// 点空白处：给当前所有选中军队下令移动（仅指挥模式）
	if (viewMode === 'enemy' || selectedPieces.length === 0) return;
	const rect = boardContainer.getBoundingClientRect();
	const targetX = Math.max(0, Math.min(e.clientX - rect.left, boardContainer.clientWidth));
	const targetY = Math.max(0, Math.min(e.clientY - rect.top, boardContainer.clientHeight));
	issueMoveTo(getPosByCell(targetX), getPosByCell(targetY));
});

boardContainer.addEventListener('mouseleave', function () {
	if (dragBoxState) { dragBoxState = null; hideBox(); }
	if (isArrowVisible) hideArrow();
	clearOrderPreview();
});

document.getElementById('button-replay').addEventListener('click', () => {
	// 加载 Replay 按钮
	window.location.reload();
})

/* to-do #13/#14：失败后跳转对应结局页（game7 失败 -> destiny-fail.html，其余 -> fail.html） */
const _failGo = document.getElementById('button-fail');
if (_failGo) _failGo.addEventListener('click', function () {
	window.location.href = _failGo.dataset.target || 'fail.html';
});

/* to-do #3：关卡内 Save/Load（目标可选 a.save 或 存档1/2/3）+ 返回主界面 */
function selectedTarget() {
	const sel = document.getElementById('slot-select');
	if (sel && isFileId(sel.value)) return String(sel.value);
	return AUTO_ID;
}

document.getElementById('button-save').addEventListener('click', function () {
	const user = currentUserSafe();
	if (!user) { alert('未登录：请先回主界面登录，再来保存'); return; }
	if (typeof CURRENT_LEVEL_ID === 'undefined') return;
	const id = selectedTarget();
	const snap = captureSnapshot();
	if (!snap) return;
	const cur = (id === AUTO_ID) ? getAuto(user) : getManual(user, id);
	if (cur && cur.snapshot && !confirm('覆盖 ' + fileName(id) + ' 里的中途存档（第 ' + cur.snapshot.level + ' 关）？')) return;
	const ok = (id === AUTO_ID) ? saveSnapshotToAuto(user, snap) : saveToManual(user, id, snap);
	if (ok) { alert('已保存到 ' + fileName(id)); refreshSlotSelect(); }
});

document.getElementById('button-load').addEventListener('click', function () {
	const user = currentUserSafe();
	if (!user) { alert('未登录'); return; }
	const id = selectedTarget();
	let snap;
	if (id === AUTO_ID) {
		snap = autoSnapshot(user);
		if (!snap) { alert(fileName(id) + ' 里没有中途存档'); return; }
	} else {
		const f = getManual(user, id);
		if (!f || !f.snapshot) { alert(fileName(id) + ' 里没有中途存档'); return; }
		snap = f.snapshot;
	}
	// 关卡匹配校验：本关只能读"属于本关"的存档，避免把别的关读进本关
	if (Number(snap.level) !== CURRENT_LEVEL_ID) {
		alert('该存档属于第 ' + snap.level + ' 关，当前在第 ' + CURRENT_LEVEL_ID + ' 关，不能在这里读取（请回主界面"载入"后，再进入对应关继续）');
		return;
	}
	// Load 语义：手动档先覆盖 a.save，再按它的快照继续
	if (id !== AUTO_ID) loadManualToAuto(user, id);
	if (!confirm('读取 ' + fileName(id) + '（第 ' + snap.level + ' 关，剩 ' + snap.remain_turns + ' 回合）会覆盖当前未保存进度，继续？')) return;
	loadSnapshot(snap);
});

document.getElementById('button-exit').addEventListener('click', function () {
	window.location.href = 'menu.html';
});

/* to-do #10/#14：Next Game 跳转——
 *   常规：levels.js 注册表下一关；已到 game6（未开隐藏）→ end-game；
 *   已开隐藏路线：game6 → game7；game7 通关 → hidden-end.html */
document.getElementById('button-next-game').addEventListener('click', function () {
	let go = './end-game.html';
	if (typeof CURRENT_LEVEL_ID !== 'undefined') {
		if (CURRENT_LEVEL_ID === 7) {
			go = 'hidden-end.html';
		} else if (CURRENT_LEVEL_ID === 6 && typeof hiddenRouteOpen === 'function' && hiddenRouteOpen()) {
			go = 'game7.html';
		} else if (typeof nextLevelFile === 'function') {
			go = nextLevelFile(CURRENT_LEVEL_ID);
		}
	}
	window.location.href = go;
});

async function showRedEffect(){
	armys.forEach(element => {
		if(element.color == 'red') {
			document.getElementById(element.id).classList.add('highlighted');
		}
	}) ;
	setTimeout(() => {
		armys.forEach(element => {
			if(element.color == 'red') {
				document.getElementById(element.id).classList.remove('highlighted');
			}
		}) ;
		setTimeout(() => {
			armys.forEach(element => {
				if(element.color == 'red') {
					document.getElementById(element.id).classList.add('highlighted');
				}
			}) ;
			setTimeout(() => {
				armys.forEach(element => {
					if(element.color == 'red') {
						document.getElementById(element.id).classList.remove('highlighted');
					}
				}) ;
			}, 1000) ;
		}, 1000) ;
	}, 1000) ;
}

window.addEventListener('load', showRedEffect) ;

/* ========== to-do #5：左侧显示条 ========== */
const UNIT_NAME_MAP = { '步': '步兵', '炮': '炮兵', '骑': '骑兵', '散': '散兵', '掷': '掷弹兵' };   // 出现新兵种时在这里补显示名

function lpRatioOf(p) {
	const max = p.lpMax || p.lp || 1;
	return Math.max(0, Math.min(1, (p.lp || 0) / max));
}

// 渲染左侧显示条：当前选中的（存活）蓝方军队及其属性 + LP 进度条
function renderInfoPanel() {
	const bar = document.getElementById('info-bar');
	if (!bar) return;
	const list = selectedPieces.filter(isAliveBlue);
	bar.innerHTML = '';
	if (list.length === 0) { bar.style.display = 'none'; return; }
	bar.style.display = 'block';
	const head = document.createElement('div');
	head.className = 'info-head';
	head.textContent = '选中部队（' + list.length + '）';
	bar.appendChild(head);
	list.forEach(p => {
		const row = document.createElement('div');
		row.className = 'info-row';
		const name = UNIT_NAME_MAP[p.cls] || p.cls || p.img || '?';
		const ratio = lpRatioOf(p);
		const color = ratio > 0.5 ? '#4a7c34' : ratio > 0.25 ? '#c99b2e' : '#c0392b';

		const titleLine = document.createElement('div');
		titleLine.className = 'info-titleline';
		const nameSpan = document.createElement('span');
		nameSpan.className = 'info-title';
		nameSpan.textContent = name;
		const rm = document.createElement('button');
		rm.className = 'info-remove';
		rm.textContent = '✕';
		rm.title = '取消选中（移出显示条）';
		rm.addEventListener('click', function () { removeFromSelection(p); });
		row.dataset.pieceId = p.id;
		titleLine.appendChild(nameSpan);
		titleLine.appendChild(rm);
		row.appendChild(titleLine);

		const stats = document.createElement('div');
		stats.className = 'info-stats';
		stats.textContent = '射程 ' + p.atkrange + ' · 攻击 ' + p.atk + ' · 速度 ' + p.speed;
		row.appendChild(stats);

		const lpbar = document.createElement('div');
		lpbar.className = 'info-lpbar';
		const fill = document.createElement('div');
		fill.className = 'info-lpfill';
		fill.style.width = (ratio * 100).toFixed(1) + '%';
		fill.style.background = color;
		lpbar.appendChild(fill);
		row.appendChild(lpbar);

		const lptext = document.createElement('div');
		lptext.className = 'info-lptext';
		lptext.textContent = 'LP ' + Math.max(0, Math.round(p.lp)) + ' / ' + (p.lpMax || p.lp);
		row.appendChild(lptext);

		bar.appendChild(row);
	});
}
addSelectionListener(renderInfoPanel);
renderInfoPanel();

/* ========== 查看敌人模式（to-do #4/#5 扩展） ========== */
let viewMode = 'ally';                       // 'ally' = 指挥己方；'enemy' = 查看敌人
let selectedEnemies = new Array();           // 敌方模式下选中的红方单位
const enemySelectionListeners = new Array();

function isAliveRed(p) { return !!p && p.color === 'red' && !p.disabled; }
function getEnemySelection() { return selectedEnemies; }
function addEnemySelectionListener(fn) { enemySelectionListeners.push(fn); }
function fireEnemySelectionChanged() {
	enemySelectionListeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略单个监听器错误 */ } });
}
function refreshEnemySelectionUI() {
	clearHoverMatches();
	document.querySelectorAll('.chess.sel-enemy').forEach(el => el.classList.remove('sel-enemy'));
	selectedEnemies.forEach(p => {
		const el = document.getElementById(p.id);
		if (el) el.classList.add('sel-enemy');
	});
	fireEnemySelectionChanged();
}
function clearEnemies() { selectedEnemies = []; refreshEnemySelectionUI(); }
function selectEnemyOnly(p) { selectedEnemies = [p]; refreshEnemySelectionUI(); }
function toggleEnemy(p) {
	const i = selectedEnemies.indexOf(p);
	if (i >= 0) selectedEnemies.splice(i, 1); else selectedEnemies.push(p);
	refreshEnemySelectionUI();
}
function selectEnemyMany(list) { selectedEnemies = list.slice(); refreshEnemySelectionUI(); }
function removeFromEnemies(pieceData) {
	const i = selectedEnemies.indexOf(pieceData);
	if (i >= 0) { selectedEnemies.splice(i, 1); refreshEnemySelectionUI(); }
}

// 右侧面板：被选中红方单位的剩余血量（LP 进度条）
function renderEnemyPanel() {
	const bar = document.getElementById('enemy-info');
	if (!bar) return;
	const list = selectedEnemies.filter(isAliveRed);
	bar.innerHTML = '';
	if (list.length === 0) { bar.style.display = 'none'; return; }
	bar.style.display = 'block';
	const head = document.createElement('div');
	head.className = 'info-head';
	head.textContent = '敌方部队（' + list.length + '）';
	bar.appendChild(head);
	list.forEach(p => {
		const row = document.createElement('div');
		row.className = 'info-row';
		const name = UNIT_NAME_MAP[p.cls] || p.cls || p.img || '?';
		const ratio = lpRatioOf(p);
		const color = ratio > 0.5 ? '#4a7c34' : ratio > 0.25 ? '#c99b2e' : '#c0392b';

		const titleLine = document.createElement('div');
		titleLine.className = 'info-titleline';
		const nameSpan = document.createElement('span');
		nameSpan.className = 'info-title';
		nameSpan.textContent = name;
		const rm = document.createElement('button');
		rm.className = 'info-remove';
		rm.textContent = '✕';
		rm.title = '移出敌方查看';
		rm.addEventListener('click', function () { removeFromEnemies(p); });
		row.dataset.pieceId = p.id;
		titleLine.appendChild(nameSpan);
		titleLine.appendChild(rm);
		row.appendChild(titleLine);

		const lpbar = document.createElement('div');
		lpbar.className = 'info-lpbar';
		const fill = document.createElement('div');
		fill.className = 'info-lpfill';
		fill.style.width = (ratio * 100).toFixed(1) + '%';
		fill.style.background = color;
		lpbar.appendChild(fill);
		row.appendChild(lpbar);

		const lptext = document.createElement('div');
		lptext.className = 'info-lptext';
		lptext.textContent = 'LP ' + Math.max(0, Math.round(p.lp)) + ' / ' + (p.lpMax || p.lp);
		row.appendChild(lptext);

		bar.appendChild(row);
	});
}
addEnemySelectionListener(renderEnemyPanel);

// 切换"指挥 / 查看敌人"模式
function setViewMode(m) {
	viewMode = (m === 'enemy') ? 'enemy' : 'ally';
	const btn = document.getElementById('button-mode');
	if (btn) btn.textContent = (viewMode === 'enemy') ? '返回指挥' : '查看敌人';
	if (viewMode === 'enemy') clearSelection(); else clearEnemies();
	hideArrow();
}
document.getElementById('button-mode').addEventListener('click', function () {
	setViewMode(viewMode === 'enemy' ? 'ally' : 'enemy');
});
renderEnemyPanel();

/* ---------- 显示条悬停联动：鼠标移到卡片行时，对应棋子"呼吸"发光 ---------- */
function clearHoverMatches() {
	document.querySelectorAll('.chess.hover-match').forEach(el => el.classList.remove('hover-match', 'hover-blue', 'hover-red'));
}

function rowPiece(row) {
	if (!row || !row.dataset || !row.dataset.pieceId) return null;
	return armys.find(x => x.id === row.dataset.pieceId) || null;
}

function syncRowHover(barEl) {
	if (!barEl) return;
	function markHover(piece) {
		const el = piece ? document.getElementById(piece.id) : null;
		if (el) {
			el.classList.add('hover-match');
			el.classList.add(piece.color === 'red' ? 'hover-red' : 'hover-blue');   // 我方=蓝 / 敌方=红
		}
	}
	function unmarkHover(piece) {
		const el = piece ? document.getElementById(piece.id) : null;
		if (el) el.classList.remove('hover-match', 'hover-blue', 'hover-red');
	}
	barEl.addEventListener('mouseover', function (e) {
		const row = e.target.closest('.info-row');
		if (!row) return;
		markHover(rowPiece(row));
	});
	barEl.addEventListener('mouseout', function (e) {
		const row = e.target.closest('.info-row');
		if (!row) return;
		// 只要鼠标还在同一行内部（如移到 ✕ 上），就不取消呼吸
		if (row.contains(e.relatedTarget)) return;
		unmarkHover(rowPiece(row));
	});
}
syncRowHover(document.getElementById('info-bar'));
syncRowHover(document.getElementById('enemy-info'));

/* ========== to-do #7：攻击范围显示 ========== */
let rangeCircles = [];   // { piece, el }，供每回合平滑更新位置（与棋子 CSS 滑行同步）

// 为当前选中单位重建攻击范围圈（指挥模式=己方蓝圈；查看敌人模式=红圈）
function renderRangeOverlays() {
	const old = document.getElementById('range-layer');
	if (old) old.remove();
	rangeCircles = [];
	const list = (viewMode === 'enemy')
		? selectedEnemies.filter(isAliveRed)
		: selectedPieces.filter(isAliveBlue);
	if (list.length === 0 || !boardContainer) return;

	const layer = document.createElement('div');
	layer.id = 'range-layer';
	layer.className = 'range-layer';
	list.forEach(p => {
		const r = Number(p.atkrange) * distance;   // 攻击范围(格) -> 像素
		if (!r || r <= 0) return;
		const c = document.createElement('div');
		c.className = 'range-circle ' + (p.color === 'red' ? 'range-circle--enemy' : 'range-circle--ally');
		const cx = offset + distance * p.posx;     // 与 movePieceTo 同一套坐标
		const cy = offset + distance * p.posy;
		c.style.left = (cx - r) + 'px';
		c.style.top = (cy - r) + 'px';
		c.style.width = (2 * r) + 'px';
		c.style.height = (2 * r) + 'px';
		layer.appendChild(c);
		rangeCircles.push({ piece: p, el: c });
	});
	boardContainer.appendChild(layer);
}

// 每回合结束后只改已有圆圈的位置，让 CSS transition 与棋子同速滑动（不再跳变）
function updateRangePositions() {
	const keep = [];
	rangeCircles.forEach(item => {
		const p = item.piece;
		const el = item.el;
		if (p.disabled) { el.remove(); return; }   // 死亡单位的圈直接移除
		const r = Number(p.atkrange) * distance;
		const cx = offset + distance * p.posx;
		const cy = offset + distance * p.posy;
		el.style.left = (cx - r) + 'px';
		el.style.top = (cy - r) + 'px';
		keep.push(item);
	});
	rangeCircles = keep;
}
addSelectionListener(renderRangeOverlays);
addEnemySelectionListener(renderRangeOverlays);

/* ========== to-do #8：新兵种试玩（验收/调试用） ========== */
/* 控制台调用：__spawnUnit('blue'|'red', '骑'|'散'|'掷', x, y) 在当前关生成单位 */
window.__spawnUnit = function (color, unitKey, posx, posy) {
	const defs = { '骑': UNIT_CAVALRY, '散': UNIT_SKIRMISHER, '掷': UNIT_GRENADIER };
	const def = defs[unitKey];
	if (!def) { alert('未知兵种：骑 / 散 / 掷'); return; }
	if (typeof boardContainer === 'undefined' || !boardContainer || !armys) return;
	const piece = document.createElement('div');
	piece.className = 'chess chess--' + color;
	piece.id = 'piece-' + piece_cnt;
	piece.innerHTML = '<p>' + def.cls + '</p>';   // 无图：文字占位
	boardContainer.appendChild(piece);
	armys.push({
		id: piece.id,
		color: color,
		posx: posx, posy: posy,
		speed: def.speed, targetx: posx, targety: posy,
		atkrange: def.atkrange, atk: def.atk, lp: def.lp, lpMax: def.lp,
		disabled: false, cls: def.cls, img: ''
	});
	movePieceTo(piece.id, posx, posy);
	piece_cnt ++;
	alert('已生成 ' + (color === 'red' ? '敌方' : '我方') + def.cls + ' 于 (' + posx + ',' + posy + ')，选中它查看属性/射程圈');
};

/* ========== to-do #11：常驻行动指示箭头（蓝/红，CSS transition 平滑跟随） ========== */
let orderLayer = null;
let orderEls = {};   // 单位 id -> { el }，跨回合复用同一元素，靠 CSS transition 滑行

function ensureOrderLayer() {
	if (orderLayer && document.body.contains(orderLayer)) return orderLayer;
	orderLayer = document.createElement('div');
	orderLayer.id = 'order-layer';
	orderLayer.className = 'order-layer';
	boardContainer.appendChild(orderLayer);
	orderEls = {};   // 棋盘重建后旧元素失效，清掉映射
	return orderLayer;
}

function removeOrderArrow(id) {
	const item = orderEls[id];
	if (item) { if (item.el.parentNode) item.el.parentNode.removeChild(item.el); delete orderEls[id]; }
}

/* 更新/创建一条箭头：从 (x1,y1) 指向 (x2,y2) 的旋转条（复用已有元素以触发平滑过渡） */
function upsertOrderArrow(id, x1, y1, x2, y2, isRed) {
	let item = orderEls[id];
	if (!item) {
		const el = document.createElement('div');
		el.className = 'order-arrow' + (isRed ? ' order-arrow--red' : '');
		el.innerHTML = '<div class="oa-line"></div><div class="oa-head"></div>';
		orderLayer.appendChild(el);
		item = { el: el };
		orderEls[id] = item;
	}
	const dx = x2 - x1, dy = y2 - y1;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < 2) { removeOrderArrow(id); return; }
	const deg = Math.atan2(dy, dx) * 180 / Math.PI;
	const el = item.el;
	el.style.left = x1 + 'px';
	el.style.top = (y1 - 2) + 'px';       // 旋转中心在 (x1, y1)
	el.style.width = dist + 'px';
	el.style.transform = 'rotate(' + deg + 'deg)';
}

/* 每回合/每次下令后刷新：存活且有未完成任务（蓝：玩家命令；红：AI 目标）的单位都画箭头 */
function renderOrderArrows() {
	if (typeof boardContainer === 'undefined' || !boardContainer) return;
	const layer = ensureOrderLayer();
	const w = boardContainer.clientWidth;
	const h = boardContainer.clientHeight;
	const seen = {};
	armys.forEach(u => {
		if (u.disabled) return;
		const dx = u.targetx - u.posx, dy = u.targety - u.posy;
		if (dx * dx + dy * dy < 1e-4) return;   // 已到达 / 站桩：不画
		const x1 = offset + distance * u.posx;
		const y1 = offset + distance * u.posy;
		const x2 = Math.max(0, Math.min(offset + distance * u.targetx, w));
		const y2 = Math.max(0, Math.min(offset + distance * u.targety, h));
		upsertOrderArrow(u.id, x1, y1, x2, y2, u.color === 'red');
		seen[u.id] = true;
	});
	Object.keys(orderEls).forEach(id => { if (!seen[id]) removeOrderArrow(id); });
}

/* ---- 预览箭头（临时的鼠标跟随指示，蓝方多选时每个选中单位都画） ---- */
let previewLayer = null;

function ensurePreviewLayer() {
	if (previewLayer && document.body.contains(previewLayer)) return previewLayer;
	previewLayer = document.createElement('div');
	previewLayer.id = 'preview-layer';
	previewLayer.className = 'order-layer';
	previewLayer.style.zIndex = '5';
	boardContainer.appendChild(previewLayer);
	return previewLayer;
}

function clearOrderPreview() {
	if (previewLayer && previewLayer.parentNode) previewLayer.innerHTML = '';
}

function previewArrow(x1, y1, x2, y2) {
	const dx = x2 - x1, dy = y2 - y1;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < 2) return;
	const el = document.createElement('div');
	el.className = 'order-arrow order-arrow--preview';
	el.innerHTML = '<div class="oa-line"></div><div class="oa-head"></div>';
	const deg = Math.atan2(dy, dx) * 180 / Math.PI;
	el.style.left = x1 + 'px';
	el.style.top = (y1 - 2) + 'px';
	el.style.width = dist + 'px';
	el.style.transform = 'rotate(' + deg + 'deg)';
	ensurePreviewLayer().appendChild(el);
}

function renderOrderPreview(e) {
	clearOrderPreview();
	if (viewMode === 'enemy') return;
	const list = selectedPieces.filter(isAliveBlue);
	if (!list.length) return;
	const rect = boardContainer.getBoundingClientRect();
	const tx = Math.max(0, Math.min(e.clientX - rect.left, boardContainer.clientWidth));
	const ty = Math.max(0, Math.min(e.clientY - rect.top, boardContainer.clientHeight));
	list.forEach(p => {
		previewArrow(offset + distance * p.posx, offset + distance * p.posy, tx, ty);
	});
}

/* ========== to-do #12/#13：战前情报 + 剧情对话 ========== */
function showLevelIntro() {
	if (typeof CURRENT_LEVEL_ID === 'undefined' || typeof getLevelById !== 'function') return;
	const meta = getLevelById(CURRENT_LEVEL_ID);
	if (!meta) return;
	const runHint = function () {
		const overlay = document.createElement('div');
		overlay.className = 'intro-overlay';
		const box = document.createElement('div');
		box.className = 'intro-box';
		const title = document.createElement('h2');
		title.textContent = meta.name;
		const body = document.createElement('p');
		body.className = 'intro-text';
		body.textContent = meta.hint || '击败所有红方单位即可获胜。';
		const act = document.createElement('div');
		act.className = 'intro-actions';
		const go = document.createElement('button');
		go.className = 'game-btn intro-go';
		go.textContent = '开 战';
		go.addEventListener('click', function () { overlay.remove(); });
		act.appendChild(go);
		box.appendChild(title);
		box.appendChild(body);
		box.appendChild(act);
		overlay.appendChild(box);
		document.body.appendChild(overlay);
	};
	// 该关有剧情（to-do #13）先演一段对话，再给战前情报
	const story = meta.story || [];
	if (typeof playDialogue === 'function' && story.length) playDialogue(story, runHint);
	else runHint();
}