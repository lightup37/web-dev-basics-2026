(function (global, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  global.TetrisCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;
  const QUEUE_SIZE = 5;
  const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const COLORS = Object.freeze({
    I: '#49e7ff',
    J: '#4f7cff',
    L: '#ff9d4d',
    O: '#ffd34e',
    S: '#63f2a2',
    T: '#a78bfa',
    Z: '#ff5f66',
    G: '#5f7088'
  });

  const SHAPES = Object.freeze({
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    J: [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    L: [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    O: [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    S: [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    T: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    Z: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  });

  const KICKS = Object.freeze([
    [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0],
    [0, -1], [0, -2], [-1, -1], [1, -1]
  ]);

  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function rotateMatrix(matrix) {
    const size = matrix.length;
    const rotated = Array.from({ length: size }, () => Array(size).fill(0));
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        rotated[col][size - 1 - row] = matrix[row][col];
      }
    }
    return rotated;
  }

  function shuffle(values, random = Math.random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function getFullRows(board) {
    const rows = [];
    for (let row = 0; row < board.length; row += 1) {
      if (board[row].every(Boolean)) rows.push(row);
    }
    return rows;
  }

  function clearRows(board, rows) {
    if (!rows.length) return board.map((row) => row.slice());
    const rowSet = new Set(rows);
    const remaining = board.filter((_, index) => !rowSet.has(index)).map((row) => row.slice());
    const emptyRows = Array.from({ length: rows.length }, () => Array(COLS).fill(null));
    return emptyRows.concat(remaining);
  }

  function cellList(matrix, x, y) {
    const cells = [];
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (matrix[row][col]) cells.push({ x: x + col, y: y + row, type: matrix[row][col] });
      }
    }
    return cells;
  }

  class TetrisGame {
    constructor(options = {}) {
      this.id = options.id || 'game';
      this.random = typeof options.random === 'function' ? options.random : Math.random;
      this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : function () {};
      this.paused = false;
      this.reset();
    }

    reset() {
      this.board = createEmptyBoard();
      this.queue = [];
      this.bag = [];
      this.active = null;
      this.holdType = null;
      this.canHold = true;
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.combo = -1;
      this.pendingGarbage = 0;
      this.dropCounter = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.state = 'ready';
      this.paused = false;
      this.lastClear = 0;
      this.fillQueue();
    }

    emit(type, detail = {}) {
      this.onEvent({ type, game: this, ...detail });
    }

    fillQueue() {
      while (this.queue.length < QUEUE_SIZE) {
        if (!this.bag.length) this.bag = shuffle(TYPES, this.random);
        this.queue.push(this.bag.pop());
      }
    }

    start() {
      if (this.state === 'playing') return;
      if (this.state === 'over') this.reset();
      this.state = 'playing';
      this.paused = false;
      this.spawnNext();
      this.emit('start');
    }

    spawnNext(forcedType) {
      const type = forcedType || this.queue.shift();
      this.fillQueue();
      this.active = {
        type,
        matrix: cloneMatrix(SHAPES[type]),
        x: 3,
        y: -1
      };
      this.dropCounter = 0;
      this.lockTimer = 0;
      this.lockResets = 0;

      if (this.collides(this.active.matrix, this.active.x, this.active.y)) {
        this.triggerTopOut();
        return;
      }
      this.emit('spawn', { pieceType: type });
    }

    collides(matrix, x, y) {
      for (let row = 0; row < matrix.length; row += 1) {
        for (let col = 0; col < matrix[row].length; col += 1) {
          if (!matrix[row][col]) continue;
          const boardX = x + col;
          const boardY = y + row;
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
          if (boardY >= 0 && this.board[boardY][boardX]) return true;
        }
      }
      return false;
    }

    isGrounded() {
      return Boolean(this.active) && this.collides(this.active.matrix, this.active.x, this.active.y + 1);
    }

    noteSuccessfulTransform() {
      if (!this.active) return;
      if (this.isGrounded()) {
        if (this.lockTimer > 0 && this.lockResets < MAX_LOCK_RESETS) {
          this.lockTimer = 0;
          this.lockResets += 1;
        }
      } else {
        this.lockTimer = 0;
        this.lockResets = 0;
      }
    }

    move(dx, dy) {
      if (this.state !== 'playing' || !this.active || this.paused) return false;
      const nextX = this.active.x + dx;
      const nextY = this.active.y + dy;
      if (this.collides(this.active.matrix, nextX, nextY)) return false;
      this.active.x = nextX;
      this.active.y = nextY;
      if (dx !== 0) this.noteSuccessfulTransform();
      return true;
    }

    moveLeft() {
      return this.move(-1, 0);
    }

    moveRight() {
      return this.move(1, 0);
    }

    rotate(direction = 1) {
      if (this.state !== 'playing' || !this.active || this.paused) return false;
      if (this.active.type === 'O') return true;
      let matrix = this.active.matrix;
      const turns = direction < 0 ? 3 : 1;
      for (let i = 0; i < turns; i += 1) matrix = rotateMatrix(matrix);

      for (const [offsetX, offsetY] of KICKS) {
        const nextX = this.active.x + offsetX;
        const nextY = this.active.y + offsetY;
        if (!this.collides(matrix, nextX, nextY)) {
          this.active.matrix = matrix;
          this.active.x = nextX;
          this.active.y = nextY;
          this.noteSuccessfulTransform();
          this.emit('rotate');
          return true;
        }
      }
      return false;
    }

    softDrop() {
      if (this.state !== 'playing' || this.paused) return false;
      if (!this.move(0, 1)) return false;
      this.score += 1;
      this.dropCounter = 0;
      return true;
    }

    hardDrop() {
      if (this.state !== 'playing' || !this.active || this.paused) return false;
      let distance = 0;
      while (!this.collides(this.active.matrix, this.active.x, this.active.y + 1)) {
        this.active.y += 1;
        distance += 1;
      }
      this.score += distance * 2;
      this.dropCounter = 0;
      this.emit('hardDrop', { distance });
      this.lockPiece();
      return true;
    }

    hold() {
      if (this.state !== 'playing' || !this.active || !this.canHold || this.paused) return false;
      const previousHold = this.holdType;
      this.holdType = this.active.type;
      this.canHold = false;
      this.emit('hold', { pieceType: this.holdType });
      if (previousHold) this.spawnNext(previousHold);
      else this.spawnNext();
      return true;
    }

    getDropInterval() {
      return Math.max(70, 900 * Math.pow(0.82, this.level - 1));
    }

    update(deltaMs) {
      if (this.state !== 'playing' || !this.active || this.paused) return;
      const delta = Math.min(Math.max(0, deltaMs), 100);
      this.dropCounter += delta;

      if (this.dropCounter >= this.getDropInterval()) {
        this.dropCounter = 0;
        if (!this.isGrounded()) {
          this.active.y += 1;
        }
      }

      if (this.isGrounded()) {
        this.lockTimer += delta;
        if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
      } else {
        this.lockTimer = 0;
      }
    }

    lockPiece() {
      if (!this.active || this.state !== 'playing') return;
      const landingCells = cellList(this.active.matrix, this.active.x, this.active.y);
      let lockedAboveTop = false;

      for (const cell of landingCells) {
        if (cell.y < 0) {
          lockedAboveTop = true;
          continue;
        }
        if (cell.y < ROWS) this.board[cell.y][cell.x] = this.active.type;
      }

      const fullRows = getFullRows(this.board);
      const cleared = fullRows.length;
      let attack = 0;

      if (cleared > 0) {
        this.board = clearRows(this.board, fullRows);
        this.lastClear = cleared;
        this.combo += 1;
        const base = [0, 100, 300, 500, 800][cleared] || 800;
        this.score += base * this.level;
        this.lines += cleared;
        attack = cleared === 2 ? 1 : cleared === 3 ? 2 : cleared >= 4 ? 4 : 0;
        if (this.combo > 0) attack += Math.floor(this.combo / 2);
      } else {
        this.combo = -1;
        this.lastClear = 0;
      }

      const nextLevel = Math.floor(this.lines / 10) + 1;
      if (nextLevel !== this.level) {
        this.level = nextLevel;
        this.emit('levelUp', { level: this.level });
      }

      this.emit('lock', { cleared, attack, combo: this.combo });

      let outgoingAttack = 0;
      if (attack > 0) {
        const cancelled = Math.min(this.pendingGarbage, attack);
        this.pendingGarbage -= cancelled;
        outgoingAttack = attack - cancelled;
        if (outgoingAttack > 0) {
          this.emit('attack', {
            amount: outgoingAttack,
            cleared,
            combo: this.combo
          });
        }
      }

      this.canHold = true;
      this.active = null;

      if (lockedAboveTop) {
        this.triggerTopOut();
        return;
      }

      if (this.pendingGarbage > 0) {
        const incoming = this.pendingGarbage;
        this.pendingGarbage = 0;
        this.emit('garbageApplied', { amount: incoming });
        this.applyGarbage(incoming);
        if (this.state === 'over') return;
      }

      this.spawnNext();
    }

    receiveGarbage(amount) {
      const count = Math.max(1, Math.min(8, Math.round(Number(amount) || 0)));
      if (this.state !== 'playing' || this.paused) return;
      this.pendingGarbage += count;
      this.emit('garbageIncoming', { amount: count, pending: this.pendingGarbage });
    }

    makeGarbageRow() {
      const holes = this.random() < 0.4 ? 2 : 1;
      const row = Array(COLS).fill('G');
      for (let i = 0; i < holes; i += 1) {
        const index = Math.floor(this.random() * COLS);
        row[index] = null;
      }
      return row;
    }

    applyGarbage(amount) {
      const count = Math.max(1, Math.min(8, Math.round(Number(amount) || 0)));
      const overflow = this.board.slice(0, count).some((row) => row.some(Boolean));
      if (overflow) {
        this.triggerTopOut();
        return;
      }

      this.board.splice(0, count);
      for (let i = 0; i < count; i += 1) this.board.push(this.makeGarbageRow());

      if (this.active) {
        while (this.collides(this.active.matrix, this.active.x, this.active.y) && this.active.y > -5) {
          this.active.y -= 1;
        }
        if (this.collides(this.active.matrix, this.active.x, this.active.y)) {
          this.triggerTopOut();
        }
      }
    }

    triggerTopOut() {
      if (this.state === 'over') return;
      this.state = 'over';
      this.paused = false;
      this.active = null;
      this.emit('topOut');
    }

    setPaused(paused) {
      if (this.state !== 'playing') return;
      this.paused = Boolean(paused);
    }

    getGhostY() {
      if (!this.active) return 0;
      let ghostY = this.active.y;
      while (!this.collides(this.active.matrix, this.active.x, ghostY + 1)) ghostY += 1;
      return ghostY;
    }

    getActiveCells() {
      if (!this.active) return [];
      return cellList(this.active.matrix, this.active.x, this.active.y);
    }

    getNextTypes(count = 3) {
      return this.queue.slice(0, count);
    }

    getSnapshot() {
      return {
        id: this.id,
        board: this.board,
        active: this.active,
        ghostY: this.getGhostY(),
        next: this.getNextTypes(),
        hold: this.holdType,
        score: this.score,
        lines: this.lines,
        level: this.level,
        combo: this.combo,
        pendingGarbage: this.pendingGarbage,
        state: this.state,
        paused: this.paused
      };
    }
  }

  return {
    TetrisGame,
    COLS,
    ROWS,
    TYPES,
    COLORS,
    SHAPES,
    LOCK_DELAY,
    createEmptyBoard,
    rotateMatrix,
    shuffle,
    getFullRows,
    clearRows,
    cellList
  };
});

