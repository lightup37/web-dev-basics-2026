/* 主要代码，负责加载页面，保持游戏运行，判断通关 */

/*
to-do list
- 加入可选 tag，例如 [雷达干扰]<难度 5>: 每个单位只能在第一回合接收移动指令
- 加入棋子攻击范围显示，点击棋子后可以显示其攻击范围
- 画框选中框内所有军队
- 左侧显示条显示当前选中军队的属性和 LP
*/


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
	if(element.img) return `<img src='./img/${element.img}.png' style='width: 120%; height: 120%;' alt=${element.class}></img>`;
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
	console.log(`distance = ${distance}, offset = ${offset}`)
	/* 加载初始棋盘，计算棋子移动所需常量 */

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
			disabled: false
		}) ;
		movePieceTo(piece.id, -1.0, -1.0);
		movePieceTo(piece.id, armys[piece_cnt].posx, armys[piece_cnt].posy);
		piece_cnt ++ ;
	}) ;
	/* 加载棋子 */
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
				if(atktar.lp < 0) disabledList.push(atktar);
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
		if(bluec == 0) {
			const winState = document.getElementById('1star');
			winState.style.display = '' ;
		} else if(bluec == 1) {
			const winState = document.getElementById('2star');
			winState.style.display = '' ;
		} else {
			const winState = document.getElementById('3star');
			winState.style.display = '' ;
		}
		return ;
	}
	if(bluec == 0 || remain_turns == 0) {
		// 如果没有蓝棋时还有红棋，或者剩余回合数为 0，则本关失败
		boardContainer.style.display = 'none';
		buttonContainer.style = 'display: none;';
		document.getElementById('lose').style = 'display: flex; flex-direction: column; align-items: center;' ;
		document.getElementById('footer-bar').style = 'display: none';
		document.getElementById('button-replay').style = 'width: 100px; height: 50px;';
		let tip = loseTips[Math.floor(Math.random() * loseTips.length)]
		document.getElementById('loseTips').style = '';
		document.getElementById('loseTips').innerHTML = tip;
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
	const movingCounts = 24;
	for(let i = 0; i < movingCounts; ++ i) {
		nextStep();
	}
	
	// 防止误触造成多次触发
	// 测试时会注释，发布时记得删去
	this.disabled = true;
	setTimeout(() => {this.disabled = false;}, 300);
	checkWinState();
});

let selectedPiece;

boardContainer.addEventListener('click', function(e) {
  const pieceEl = e.target.closest('.chess');
  if (!pieceEl) {
		handleBoardClick(e);
		return ;
	}

  // 阻止事件冒泡，避免同时触发棋盘点击
  
  // 根据 DOM 元素的 id 找到对应数据
  const pieceId = pieceEl.id;
  const pieceData = armys.find(p => p.id === pieceId);
	if (!pieceData) return;
	if (pieceData.color == 'red') {
		handleBoardClick(e);
		return ;
	}
  
  // 选中该棋子
	if(selectedPiece == null) {
		selectedPiece = pieceData;
	} else if(selectedPiece == pieceData) {
		// 选中一枚棋子后又点击自己
		// 解释为让棋子原地待命
		setTarget(selectedPiece.posx, selectedPiece.posy);
		return ;
	} else {
		// 选中棋子后又点击非自身棋子
		// 解释为给棋子设置移动目标
		handleBoardClick(e);
		return ;
	}
  
  // 添加高亮
  document.querySelectorAll('.chess').forEach(el => el.classList.remove('selected'));
  pieceEl.classList.add('selected');
});

function setTarget(targetX, targetY) {
	// 设置目标坐标
  selectedPiece.targetx = targetX;
  selectedPiece.targety = targetY;
  
  // 清除选中状态
  selectedPiece = null;
  document.querySelectorAll('.chess').forEach(el => el.classList.remove('selected'));
	hideArrow();
}

function handleBoardClick(e) {
	if (!selectedPiece) return;

  // 计算点击位置相对于棋盘左上角的坐标
  const rect = boardContainer.getBoundingClientRect();
  let targetX = e.clientX - rect.left;
  let targetY = e.clientY - rect.top;  

	// 边界限制（确保在棋盘内）
  const boardWidth = boardContainer.clientWidth;
  const boardHeight = boardContainer.clientHeight;
  targetX = Math.max(0, Math.min(targetX, boardWidth));
  targetY = Math.max(0, Math.min(targetY, boardHeight));
  setTarget(getPosByCell(targetX), getPosByCell(targetY))
}

boardContainer.addEventListener('mousemove', function(e) {
  if (!selectedPiece) {
    if (isArrowVisible) hideArrow();
    return;
  }

  // 获取选中棋子当前位置
  const pieceEl = document.getElementById(selectedPiece.id);
  if (!pieceEl) return;

  const boardRect = boardContainer.getBoundingClientRect();
	const chessRect = pieceEl.getBoundingClientRect();
  // 棋子中心点
  const fromX = chessRect.left + chessRect.width / 2 - boardRect.left;
  const fromY = chessRect.top + chessRect.width / 2 - boardRect.top;

  // 鼠标位置
  const toX = e.clientX - boardRect.left;
  const toY = e.clientY - boardRect.top;

  // 边界裁剪
  const maxX = boardContainer.clientWidth;
  const maxY = boardContainer.clientHeight;
  const clampedX = Math.max(0, Math.min(toX, maxX));
  const clampedY = Math.max(0, Math.min(toY, maxY));

  updateArrow(fromX, fromY, clampedX, clampedY);
});

boardContainer.addEventListener('mouseleave', function() {
  // 如果鼠标离开棋盘，隐藏箭头
  if (isArrowVisible) hideArrow();
});

document.getElementById('button-replay').addEventListener('click', () => {
	// 加载 Replay 按钮
	window.location.reload();
})

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