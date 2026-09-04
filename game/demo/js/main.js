/* this is how the game plays */

let armys = new Array(0);
let n = 0, m = 0, piece_cnt = 0;
let eps = 0.000001

let boardContainer = document.getElementById('board');
let buttonContainer = document.getElementById('button');

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

function getHtmlForPiece(className) {
	return `<p>${className}</p>` ;
}

function getPieceId(id) {
	return `piece-${id}`;
}

let POS_00, POS_11, distance, offset, arrowLine;

function getPosByCell(pos) {
	return (pos - offset) / distance ;
}

function loadGame(game) {
	n = game.n; m = game.m;
	boardContainer.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
	boardContainer.innerHTML = getblock(n, m);
	boardItems = []
	for(let i = 0; i < n; ++ i) {
		board[i] = [];
		for(let j = 0; j < m; ++ j) {
			board[i][j] = [];
		}
	}
	arrowLine = document.getElementById('arrowLine');
	POS_00 = document.querySelector(`#board .cell[data-row="${0}"][data-col="${0}"]`).getBoundingClientRect();
	POS_11 = document.querySelector(`#board .cell[data-row="${1}"][data-col="${1}"]`).getBoundingClientRect();
	distance = POS_11.left - POS_00.left;
	offset = POS_00.width / 2.0;
	console.log(`distance = ${distance}, offset = ${offset}`)
	/* Init board, calculate paraments for moving pieces */
	
	game.pieces.forEach(element => {
		piece = document.createElement('div');
  	piece.className = `chess chess--${element.color}`;
		piece.id = `piece-${piece_cnt}`;
		piece.innerHTML = getHtmlForPiece(element.class)
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
		movePieceTo(getPieceId(piece_cnt), -1.0, -1.0);
		movePieceTo(getPieceId(piece_cnt), armys[piece_cnt].posx, armys[piece_cnt].posy);
		piece_cnt ++ ;
	}) ;
}

function normalize(vec) {
	const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
	if(length <= eps) { return {x: 0.0, y: 0.0}; }
	return {
		x: vec.x / length,
		y: vec.y / length
	} ;
}

function setToDisable(element) {
	element.disabled = true;
	const piece = document.getElementById(element.id);
	piece.classList.add('disabled');
}

function calcdis(element1, element2) {
	let disx = element1.posx - element2.posx, disy = element1.posy - element2.posy;
	return Math.sqrt(disx * disx + disy * disy) ;
}

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

function nextStep() {
	let disabledList = new Array();
	armys.forEach(element => {
		if(element.disabled == true) return ;
		let atktar = selectMinimalDistance(element, armys) ;
		if(atktar != null) {
			if(calcdis(element, atktar) < element.atkrange) {
				atktar.lp -= element.atk;
				if(atktar.lp < 0) disabledList.push(atktar);
				console.log(`atk between ${element.id} with ${atktar.id}, the latter's LP become ${atktar.lp}`);
				return ;
			}
		}
		let targetvector = normalize({x: element.targetx - element.posx, y: element.targety - element.posy});
		let beforeMove = (element.targetx - element.posx > eps)
		// console.log(`for piece${element.id}, move from (${element.posx}, ${element.posy}) to (${element.posx + targetvector.x * element.speed}, ${element.posy + targetvector.y * element.speed})`);
		element.posx = element.posx + targetvector.x * element.speed ;
		element.posy = element.posy + targetvector.y * element.speed ;
		// check if move over
		let afterMove = (element.targetx - element.posx > eps);
		if(beforeMove != afterMove) element.posx = element.targetx, element.posy = element.targety;
		movePieceTo(element.id, element.posx, element.posy);
	});
	disabledList.forEach(element => {
		setToDisable(element) ;
	}) ;
}

function clearDisable() {
	armys.forEach(element => {
		if(element.disabled == true) { 
			const piece = document.getElementById(element.id);
			piece.style.display = 'none' ;
			return ;
		}
	});
}

let isMoving = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkWinState() {
	let redc = 0, bluec = 0;
	armys.forEach(element => {
		if(element.disabled == false) {
			if(element.color == 'red') ++ redc;
			if(element.color == 'blue') ++ bluec;
		}
	}) ;

	if(redc == 0) {
		boardContainer.style.display = 'none';
		const winState = document.getElementById('win');
		winState.style = 'display: flex; flex-direction: column; align-items: center;' ;
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
	}
}

buttonContainer.addEventListener('click', function() {
	clearDisable();
	const movingCounts = 4;
	for(let i = 0; i < movingCounts; ++ i) {
		nextStep();
	}
  
	this.disabled = true;
	setTimeout(() => {this.disabled = false;}, 500);
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
  
  // 选中该棋子（切换选中/取消？这里直接选中）
	if(selectedPiece == null) {
		selectedPiece = pieceData;
	} else if(selectedPiece == pieceData) {
		// 取消选中
		selectedPiece = null ;
	} else {
		// 选中棋子后又点击棋子
		// 解释为给棋子设置移动目标
		handleBoardClick(e);
		return ;
	}
  
  // 添加高亮
  document.querySelectorAll('.chess').forEach(el => el.classList.remove('selected'));
  pieceEl.classList.add('selected');
});

function handleBoardClick(e) {
	if (!selectedPiece) return;
  
  // 计算点击位置相对于棋盘左上角的坐标
  const rect = boardContainer.getBoundingClientRect();
  let targetX = e.clientX - rect.left;
  let targetY = e.clientY - rect.top;  
  // 边界限制（确保在棋盘内）
  const boardWidth = board.clientWidth;
  const boardHeight = board.clientHeight;
  targetX = Math.max(0, Math.min(targetX, boardWidth));
  targetY = Math.max(0, Math.min(targetY, boardHeight));
  
  // 如果你希望目标对齐到网格（例如每格40px），可以取整
  // const cellSize = 40;
  // targetX = Math.round(targetX / cellSize) * cellSize;
  // targetY = Math.round(targetY / cellSize) * cellSize;
  
  // 设置目标坐标
  selectedPiece.targetx = getPosByCell(targetX);
  selectedPiece.targety = getPosByCell(targetY);
  
  // 清除选中状态
  selectedPiece = null;
  document.querySelectorAll('.chess').forEach(el => el.classList.remove('selected'));
	hideArrow();
}

boardContainer.addEventListener('mousemove', function(e) {
  if (!selectedPiece) {
    if (isArrowVisible) hideArrow();
    return;
  }

  // 获取棋子当前位置（像素坐标）
  const pieceEl = document.getElementById(selectedPiece.id);
  if (!pieceEl) return;

  const boardRect = boardContainer.getBoundingClientRect();
	const chessRect = pieceEl.getBoundingClientRect();
  // 棋子中心点（相对于 board）
  const fromX = chessRect.left + chessRect.width / 2 - boardRect.left;
  const fromY = chessRect.top + chessRect.width / 2 - boardRect.top;

  // 鼠标位置（相对于 board）
  const toX = e.clientX - boardRect.left;
  const toY = e.clientY - boardRect.top;

  // 边界裁剪（可选）
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