(function () {
  'use strict';

  const Core = window.TetrisCore;
  const Store = window.TetrisStore;
  const Sound = window.TetrisAudio;

  const P1_KEYS = {
    KeyA: 'left', KeyD: 'right', KeyW: 'rotate',
    KeyS: 'softDrop', Space: 'hardDrop', KeyC: 'hold'
  };
  const P2_KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate',
    ArrowDown: 'softDrop', Enter: 'hardDrop', ShiftRight: 'hold'
  };
  const REPEATABLE = new Set(['left', 'right', 'softDrop']);
  const KEY_REPEAT_DELAY = 170;
  const KEY_REPEAT_INTERVAL = 46;

  let session = null;
  let frameId = 0;
  let countdownTimer = 0;
  let selectedP2Id = '';
  let lastFrameTime = 0;
  const toastTimers = new Map();
  const heldInputs = [{}, {}];

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = String(value);
  }
  function setMessage(id, message, success) {
    const element = byId(id);
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('success', Boolean(success));
  }
  function formatNumber(value) {
    return Math.max(0, Math.round(Number(value) || 0)).toLocaleString('zh-CN');
  }
  function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function initials(name) {
    return Array.from(String(name || 'P')).slice(0, 2).join('').toUpperCase();
  }
  function colorWithAlpha(hex, alpha) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;
    const number = Number.parseInt(value, 16);
    return 'rgba(' + ((number >> 16) & 255) + ', ' + ((number >> 8) & 255) + ', ' + (number & 255) + ', ' + alpha + ')';
  }
  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function drawBlock(ctx, x, y, size, type, ghost) {
    const color = Core.COLORS[type] || Core.COLORS.G;
    const inset = Math.max(1, size * 0.055);
    const drawSize = size - inset * 2;
    if (ghost) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, size * 0.07);
      roundedRectPath(ctx, x + inset + 1, y + inset + 1, drawSize - 2, drawSize - 2, size * 0.13);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save();
    roundedRectPath(ctx, x + inset, y + inset, drawSize, drawSize, size * 0.13);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 0.34;
    roundedRectPath(ctx, x + inset + 2, y + inset + 2, drawSize - 4, drawSize * 0.34, size * 0.1);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
    roundedRectPath(ctx, x + inset, y + inset, drawSize, drawSize, size * 0.13);
    ctx.strokeStyle = colorWithAlpha('#ffffff', 0.21);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  function drawCenteredPiece(canvas, type, centerY, cellSize) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const matrix = Core.SHAPES[type];
    let minCol = 4, maxCol = -1, minRow = 4, maxRow = -1;
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (!matrix[row][col]) continue;
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    }
    const startX = (canvas.width - (maxCol - minCol + 1) * cellSize) / 2;
    const startY = centerY - ((maxRow - minRow + 1) * cellSize) / 2;
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (!matrix[row][col]) continue;
        drawBlock(ctx, startX + (col - minCol) * cellSize, startY + (row - minRow) * cellSize, cellSize, type, false);
      }
    }
  }

  class PlayerRenderer {
    constructor(playerNumber) {
      this.board = byId('p' + playerNumber + '-board');
      this.hold = byId('p' + playerNumber + '-hold');
      this.next = byId('p' + playerNumber + '-next');
      this.boardContext = this.board.getContext('2d');
    }
    render(game) {
      const snapshot = game.getSnapshot();
      this.drawBoard(snapshot);
      drawCenteredPiece(this.hold, snapshot.hold, this.hold.height / 2, 14);
      const context = this.next.getContext('2d');
      context.clearRect(0, 0, this.next.width, this.next.height);
      snapshot.next.slice(0, 3).forEach((type, index) => {
        drawCenteredPiece(this.next, type, 37 + index * 73, 13);
      });
    }
    drawBoard(snapshot) {
      const ctx = this.boardContext;
      const cell = this.board.width / Core.COLS;
      ctx.clearRect(0, 0, this.board.width, this.board.height);
      ctx.fillStyle = '#050a12';
      ctx.fillRect(0, 0, this.board.width, this.board.height);
      ctx.strokeStyle = 'rgba(132, 173, 220, 0.075)';
      ctx.lineWidth = 1;
      for (let col = 1; col < Core.COLS; col += 1) {
        ctx.beginPath(); ctx.moveTo(col * cell + 0.5, 0); ctx.lineTo(col * cell + 0.5, this.board.height); ctx.stroke();
      }
      for (let row = 1; row < Core.ROWS; row += 1) {
        ctx.beginPath(); ctx.moveTo(0, row * cell + 0.5); ctx.lineTo(this.board.width, row * cell + 0.5); ctx.stroke();
      }
      for (let row = 0; row < Core.ROWS; row += 1) {
        for (let col = 0; col < Core.COLS; col += 1) {
          const type = snapshot.board[row][col];
          if (type) drawBlock(ctx, col * cell, row * cell, cell, type, false);
        }
      }
      if (snapshot.active) {
        for (const part of Core.cellList(snapshot.active.matrix, snapshot.active.x, snapshot.ghostY)) {
          if (part.y >= 0) drawBlock(ctx, part.x * cell, part.y * cell, cell, snapshot.active.type, true);
        }
        for (const part of Core.cellList(snapshot.active.matrix, snapshot.active.x, snapshot.active.y)) {
          if (part.y >= 0) drawBlock(ctx, part.x * cell, part.y * cell, cell, snapshot.active.type, false);
        }
      }
    }
  }

  function showScreen(name) {
    byId('auth-screen').hidden = name !== 'auth';
    byId('lobby-screen').hidden = name !== 'lobby';
    byId('game-screen').hidden = name !== 'game';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function setAuthMode(mode) {
    const login = mode === 'login';
    byId('login-tab').classList.toggle('active', login);
    byId('register-tab').classList.toggle('active', !login);
    byId('login-tab').setAttribute('aria-selected', String(login));
    byId('register-tab').setAttribute('aria-selected', String(!login));
    byId('login-form').hidden = !login;
    byId('register-form').hidden = login;
    setMessage('login-message', '');
    setMessage('register-message', '');
    if (login) byId('login-username').focus();
    else byId('register-username').focus();
  }
  function setFormBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText || '请稍候…';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }
  function showAuth() {
    showScreen('auth');
    setAuthMode('login');
  }
  function showLobby() {
    if (session) cleanupSession(true);
    const user = Store.getCurrentUser();
    if (!user) { showAuth(); return; }
    showScreen('lobby');
    renderLobby();
  }
  function renderLobby() {
    const user = Store.getCurrentUser();
    if (!user) { showAuth(); return; }
    const stats = user.stats;
    const tier = Store.getTier(stats.ladderRating);
    setText('header-username', user.username);
    setText('header-avatar', initials(user.username));
    setText('header-tier', tier + ' · 对战分 ' + stats.battleRating);
    setText('lobby-ladder-rating', formatNumber(stats.ladderRating));
    setText('lobby-best-score', formatNumber(stats.bestScore));
    setText('lobby-total-lines', formatNumber(stats.totalLines));
    setText('lobby-battle-wins', formatNumber(stats.battleWins));
    setText('single-tier-badge', tier);
    setText('single-current-rating', formatNumber(stats.ladderRating));
    setText('single-games', stats.ladderGames + ' 局');
    setText('battle-p1-name', user.username);
    setText('battle-p1-rating', '对战分 ' + formatNumber(stats.battleRating));
    renderBattleAccounts(user);
    renderLeaderboard(user);
  }
  function renderBattleAccounts(currentUser) {
    const container = byId('battle-p2-accounts');
    const candidates = Store.getPublicUsers().filter((user) => user.id !== currentUser.id);
    if (!candidates.some((user) => user.id === selectedP2Id)) selectedP2Id = candidates[0] ? candidates[0].id : '';
    container.replaceChildren();
    candidates.forEach((user) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'account-option' + (user.id === selectedP2Id ? ' selected' : '');
      button.textContent = user.username;
      button.setAttribute('aria-pressed', String(user.id === selectedP2Id));
      button.addEventListener('click', () => {
        selectedP2Id = user.id;
        renderBattleAccounts(Store.getCurrentUser());
        updateBattleButton();
        byId('battle-p2-password').focus();
      });
      container.appendChild(button);
    });
    byId('battle-p2-empty').hidden = candidates.length > 0;
    updateBattleButton();
  }
  function updateBattleButton() {
    const password = byId('battle-p2-password').value;
    const button = byId('start-battle-button');
    button.disabled = !selectedP2Id || !password || button.dataset.busy === 'true';
  }
  function renderLeaderboard(currentUser) {
    const body = byId('leaderboard-body');
    const leaderboard = Store.getLeaderboard(20);
    body.replaceChildren();
    if (!leaderboard.length) {
      const empty = document.createElement('p');
      empty.className = 'leaderboard-empty';
      empty.textContent = '还没有可显示的天梯记录。';
      body.appendChild(empty);
      return;
    }
    leaderboard.forEach((player, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row' + (player.id === currentUser.id ? ' current' : '');
      row.setAttribute('role', 'row');
      const rank = document.createElement('span');
      rank.className = 'rank-number';
      rank.textContent = index < 3 ? ['01', '02', '03'][index] : String(index + 1).padStart(2, '0');
      const name = document.createElement('span');
      name.className = 'leaderboard-player';
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.textContent = initials(player.username);
      const nameText = document.createElement('span');
      nameText.textContent = player.username + (player.id === currentUser.id ? '（你）' : '');
      name.append(avatar, nameText);
      const tier = document.createElement('span');
      tier.textContent = Store.getTier(player.stats.ladderRating);
      const rating = document.createElement('strong');
      rating.textContent = formatNumber(player.stats.ladderRating);
      const score = document.createElement('span');
      score.textContent = formatNumber(player.stats.bestScore);
      const games = document.createElement('span');
      games.textContent = player.stats.ladderGames + ' 局';
      row.append(rank, name, tier, rating, score, games);
      body.appendChild(row);
    });
  }
  async function handleLogin(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setMessage('login-message', '');
    setFormBusy(button, true, '验证中…');
    try {
      await Store.login(byId('login-username').value, byId('login-password').value);
      byId('login-password').value = '';
      showLobby();
    } catch (error) {
      setMessage('login-message', error.message || '登录失败，请稍后重试。');
    } finally {
      setFormBusy(button, false);
    }
  }
  async function handleRegister(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const password = byId('register-password').value;
    setMessage('register-message', '');
    setFormBusy(button, true, '创建中…');
    try {
      await Store.register(byId('register-username').value, password);
      byId('register-password').value = '';

      showLobby();
    } catch (error) {
      setMessage('register-message', error.message || '注册失败，请稍后重试。');
    } finally {
      setFormBusy(button, false);
    }
  }
  async function handleCreateP2(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const password = byId('p2-new-password').value;
    setMessage('create-p2-message', '');
    setFormBusy(button, true, '创建中…');
    try {
      const user = await Store.register(byId('p2-new-username').value, password, { persistSession: false });
      selectedP2Id = user.id;
      byId('p2-new-username').value = '';
      byId('p2-new-password').value = '';

      renderLobby();
      setMessage('create-p2-message', '玩家二账号已创建，请输入密码后开赛。', true);
      byId('battle-p2-password').focus();
    } catch (error) {
      setMessage('create-p2-message', error.message || '创建账号失败。');
    } finally {
      setFormBusy(button, false);
    }
  }
  async function handleStartBattle() {
    const p1 = Store.getCurrentUser();
    if (!p1) { showAuth(); return; }
    const p2 = Store.getUserById(selectedP2Id);
    if (!p2) { setMessage('battle-message', '请选择玩家二账号。'); return; }
    const password = byId('battle-p2-password').value;
    if (!password) { setMessage('battle-message', '请输入玩家二密码。'); return; }
    const button = byId('start-battle-button');
    const originalText = button.textContent;
    button.dataset.busy = 'true';
    button.textContent = '身份验证中…';
    setMessage('battle-message', '');
    updateBattleButton();
    try {
      const verified = await Store.verifyCredentials(p2.username, password);
      if (!verified || verified.id !== p2.id) {
        setMessage('battle-message', '玩家二密码不正确。');
        return;
      }
      byId('battle-p2-password').value = '';
      startBattleSession(Store.getCurrentUser(), verified);
    } catch (error) {
      setMessage('battle-message', error.message || '无法验证玩家二身份。');
    } finally {
      button.dataset.busy = 'false';
      button.textContent = originalText;
      updateBattleButton();
    }
  }

  function configurePlayerPanel(index, player) {
    const prefix = 'p' + (index + 1);
    setText(prefix + '-name', player.username);
    setText(prefix + '-tier', Store.getTier(player.stats.battleRating) + ' · ' + (index === 0 ? 'P1' : 'P2'));
    setText(prefix + '-score', '0');
    setText(prefix + '-lines', '0');
    setText(prefix + '-level', '1');
    setText(prefix + '-combo', '0');
  }
  function buildGame(index) {
    return new Core.TetrisGame({
      id: 'p' + (index + 1),
      onEvent: (event) => handleGameEvent(index, event)
    });
  }
  function handleGameEvent(playerIndex, event) {
    if (!session || session.ended) return;
    if (event.type === 'lock' && event.cleared > 0) {
      Sound.playLineClear(event.cleared);
      const labels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
      showToast(playerIndex, labels[Math.min(4, event.cleared)] || 'TETRIS');
    }
    if (event.type === 'levelUp') showToast(playerIndex, 'LEVEL ' + event.level);
    if (event.type === 'attack' && session.mode === 'battle') {
      const opponentIndex = playerIndex === 0 ? 1 : 0;
      session.games[opponentIndex].receiveGarbage(event.amount);
      showToast(playerIndex, '攻击 +' + event.amount);
    }
    if (event.type === 'garbageIncoming' && session.mode === 'battle') {
      showToast(playerIndex, '待处理 ' + event.pending + ' 行');
    }
    if (event.type === 'topOut') window.setTimeout(checkSessionEnd, 0);
  }
  function showToast(playerIndex, message) {
    const element = byId('p' + (playerIndex + 1) + '-toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    window.clearTimeout(toastTimers.get(playerIndex));
    toastTimers.set(playerIndex, window.setTimeout(() => element.classList.remove('show'), 700));
  }
  function setSessionUi(mode) {
    const battle = mode === 'battle';
    byId('p2-panel').hidden = !battle;
    byId('game-stage').classList.toggle('solo', !battle);
    byId('game-stage').classList.toggle('battle', battle);
    setText('game-mode-label', battle ? 'LOCAL SPLIT-SCREEN' : 'SOLO RANKED');
    setText('game-title', battle ? '同机分屏对战' : '单人天梯');
    byId('pause-game-button').textContent = '暂停';
    byId('pause-overlay').hidden = true;
  }
  function startSingleSession() {
    const user = Store.getCurrentUser();
    if (!user) { showAuth(); return; }
    beginSession({ mode: 'single', players: [user], games: [buildGame(0)] });
  }
  function startBattleSession(playerOne, playerTwo) {
    if (!playerOne || !playerTwo) { showLobby(); return; }
    beginSession({
      mode: 'battle',
      players: [playerOne, playerTwo],
      games: [buildGame(0), buildGame(1)]
    });
  }
  function beginSession(config) {
    cleanupSession(true);
    setSessionUi(config.mode);
    configurePlayerPanel(0, config.players[0]);
    if (config.mode === 'battle') configurePlayerPanel(1, config.players[1]);
    session = {
      mode: config.mode,
      players: config.players,
      games: config.games,
      renderers: [new PlayerRenderer(1)],
      paused: false,
      ended: false,
      phase: 'countdown',
      startedAt: 0,
      elapsedBeforePause: 0,
      pauseStartedAt: 0,
      lastHudUpdate: 0,
      replay: null
    };
    if (config.mode === 'battle') session.renderers.push(new PlayerRenderer(2));
    showScreen('game');
    byId('result-modal').hidden = true;
    lastFrameTime = performance.now();
    frameId = requestAnimationFrame(gameLoop);
    startCountdown();
  }
  function startCountdown() {
    window.clearInterval(countdownTimer);
    const overlay = byId('countdown-overlay');
    const value = byId('countdown-value');
    overlay.hidden = false;
    let count = 3;
    value.textContent = String(count);
    countdownTimer = window.setInterval(() => {
      if (!session || session.phase !== 'countdown') {
        window.clearInterval(countdownTimer);
        return;
      }
      count -= 1;
      if (count > 0) {
        value.textContent = String(count);
        value.style.animation = 'none';
        void value.offsetWidth;
        value.style.animation = '';
        return;
      }
      window.clearInterval(countdownTimer);
      value.textContent = '开始';
      session.games.forEach((game) => game.start());
      session.phase = 'playing';
      session.startedAt = performance.now();
      window.setTimeout(() => {
        if (session && session.phase === 'playing') overlay.hidden = true;
      }, 430);
    }, 850);
  }
  function pauseGame(startPaused) {
    if (!session || session.phase !== 'playing' || session.ended) return;
    const nextPaused = typeof startPaused === 'boolean' ? startPaused : !session.paused;
    session.paused = nextPaused;
    session.games.forEach((game) => game.setPaused(nextPaused));
    byId('pause-overlay').hidden = !nextPaused;
    byId('pause-game-button').textContent = nextPaused ? '继续' : '暂停';
    if (nextPaused) session.pauseStartedAt = performance.now();
    else if (session.pauseStartedAt) {
      session.elapsedBeforePause += performance.now() - session.pauseStartedAt;
      session.pauseStartedAt = 0;
    }
  }
  function gameElapsed() {
    if (!session || !session.startedAt) return 0;
    const now = session.pauseStartedAt || performance.now();
    return Math.max(0, now - session.startedAt - session.elapsedBeforePause);
  }
  function gameLoop(timestamp) {
    if (!session) return;
    const delta = Math.min(50, Math.max(0, timestamp - lastFrameTime));
    lastFrameTime = timestamp;
    if (session.phase === 'playing' && !session.paused && !session.ended) {
      updateHeldInputs(timestamp);
      session.games.forEach((game) => game.update(delta));
      checkSessionEnd();
      if (session && (timestamp - session.lastHudUpdate > 80 || delta > 30)) {
        updateAllHud();
        session.lastHudUpdate = timestamp;
      }
    }
    if (session) {
      session.games.forEach((game, index) => session.renderers[index].render(game));
      setText('game-timer', formatDuration(gameElapsed()));
    }
    frameId = requestAnimationFrame(gameLoop);
  }
  function updateAllHud() {
    if (!session) return;
    session.games.forEach((game, index) => {
      const prefix = 'p' + (index + 1);
      setText(prefix + '-score', formatNumber(game.score));
      setText(prefix + '-lines', formatNumber(game.lines));
      setText(prefix + '-level', formatNumber(game.level));
      const valueElement = byId(prefix + '-combo');
      const labelElement = valueElement ? valueElement.previousElementSibling : null;
      if (session.mode === 'battle' && game.pendingGarbage > 0) {
        if (labelElement) labelElement.textContent = '待处理';
        setText(prefix + '-combo', 'G' + game.pendingGarbage);
      } else {
        if (labelElement) labelElement.textContent = '连击';
        setText(prefix + '-combo', game.combo >= 0 ? String(game.combo) : '0');
      }
    });
  }
  function checkSessionEnd() {
    if (!session || session.ended || session.phase !== 'playing') return;
    const over = session.games.map((game) => game.state === 'over');
    if (!over.some(Boolean)) return;
    session.ended = true;
    session.phase = 'ended';
    if (session.mode === 'single') finishSingle();
    else finishBattle(over);
  }
  function finishSingle() {
    const game = session.games[0];
    const player = session.players[0];
    const result = Store.recordSingleGame(player.id, {
      score: game.score, lines: game.lines, level: game.level
    });
    const className = result.delta >= 0 ? 'rating-up' : 'rating-down';
    const sign = result.delta >= 0 ? '+' : '';
    showResult({
      eyebrow: 'SOLO RUN COMPLETE',
      title: '本局结束',
      subtitle: '方块触顶。完成 ' + game.lines + ' 次消行，坚持了 ' + formatDuration(gameElapsed()) + '。',
      stats: [['得分', formatNumber(game.score)], ['消行', game.lines], ['等级', game.level]],
      ratingHtml: '天梯分 ' + result.beforeRating + ' → ' + Math.round(result.afterRating) +
        '（' + sign + result.delta + '） · 当前段位 ' + Store.getTier(result.afterRating),
      ratingClass: className,
      replay: () => startSingleSession()
    });
  }
  function finishBattle(over) {
    const bothOut = over[0] && over[1];
    const winnerIndex = bothOut ? -1 : over[0] ? 1 : 0;
    const p1 = session.players[0];
    const p2 = session.players[1];
    const p1Outcome = winnerIndex === -1 ? 'draw' : winnerIndex === 0 ? 'win' : 'loss';
    const p2Outcome = winnerIndex === -1 ? 'draw' : winnerIndex === 1 ? 'win' : 'loss';
    const p1OldBattle = p1.stats.battleRating;
    const p2OldBattle = p2.stats.battleRating;
    const p1Result = Store.recordBattle(p1.id, {
      outcome: p1Outcome, opponentRating: p2OldBattle,
      score: session.games[0].score, lines: session.games[0].lines, level: session.games[0].level
    });
    const p2Result = Store.recordBattle(p2.id, {
      outcome: p2Outcome, opponentRating: p1OldBattle,
      score: session.games[1].score, lines: session.games[1].lines, level: session.games[1].level
    });
    const title = bothOut ? '平局' : (winnerIndex === 0 ? p1.username : p2.username) + ' 获胜';
    const subtitle = bothOut
      ? '双方同时触顶，本场判定为平局。'
      : '对手方块触顶。本场用时 ' + formatDuration(gameElapsed()) + '。';
    const p1Sign = p1Result.delta >= 0 ? '+' : '';
    const p2Sign = p2Result.delta >= 0 ? '+' : '';
    showResult({
      eyebrow: 'LOCAL BATTLE COMPLETE',
      title,
      subtitle,
      stats: [
        [p1.username, formatNumber(session.games[0].score)],
        [p2.username, formatNumber(session.games[1].score)],
        ['用时', formatDuration(gameElapsed())]
      ],
      ratingHtml: p1.username + ' 对战分 ' + p1Sign + p1Result.delta +
        ' · ' + p2.username + ' 对战分 ' + p2Sign + p2Result.delta,
      ratingClass: p1Result.delta > 0 ? 'rating-up' : p1Result.delta < 0 ? 'rating-down' : '',
      replay: () => {
        const freshP1 = Store.getUserById(p1.id);
        const freshP2 = Store.getUserById(p2.id);
        startBattleSession(freshP1, freshP2);
      }
    });
  }
  function showResult(options) {
    setText('result-eyebrow', options.eyebrow);
    setText('result-title', options.title);
    setText('result-subtitle', options.subtitle);
    const stats = byId('result-stats');
    stats.replaceChildren();
    options.stats.forEach(([label, value]) => {
      const item = document.createElement('div');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = String(value);
      item.append(labelElement, valueElement);
      stats.appendChild(item);
    });
    const rating = byId('result-rating');
    rating.textContent = options.ratingHtml;
    rating.className = 'result-rating ' + (options.ratingClass || '');
    byId('result-modal').hidden = false;
    session.replay = options.replay;
    updateAllHud();
    const user = Store.getCurrentUser();
    if (user) setText('header-tier', Store.getTier(user.stats.ladderRating) + ' · 对战分 ' + user.stats.battleRating);
  }
  function closeResult() { byId('result-modal').hidden = true; }
  function cleanupSession(stopAnimation = true) {
    window.clearInterval(countdownTimer);
    countdownTimer = 0;
    if (stopAnimation && frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    if (session) session.games.forEach((game) => game.setPaused(true));
    session = null;
    clearHeldInputs();
    byId('countdown-overlay').hidden = true;
    byId('pause-overlay').hidden = true;
    byId('result-modal').hidden = true;
  }
  function leaveGame() {
    if (session && !session.ended && session.phase !== 'ended') {
      if (!window.confirm('比赛尚未结束，确定返回大厅吗？本局不会记录战绩。')) return;
    }
    cleanupSession(true);
    showLobby();
  }
  function clearHeldInputs() {
    heldInputs[0] = {};
    heldInputs[1] = {};
  }
  function handleKeyDown(event) {
    if (!session || session.phase !== 'playing') return;
    if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) pauseGame();
      return;
    }
    const playerIndex = P1_KEYS[event.code] ? 0 : P2_KEYS[event.code] ? 1 : -1;
    if (playerIndex < 0 || !session.games[playerIndex]) return;
    const action = playerIndex === 0 ? P1_KEYS[event.code] : P2_KEYS[event.code];
    event.preventDefault();
    if (event.repeat) return;
    processAction(playerIndex, action);
    if (REPEATABLE.has(action)) heldInputs[playerIndex][action] = performance.now() + KEY_REPEAT_DELAY;
  }
  function handleKeyUp(event) {
    if (!session) return;
    const playerIndex = P1_KEYS[event.code] ? 0 : P2_KEYS[event.code] ? 1 : -1;
    if (playerIndex < 0) return;
    const action = playerIndex === 0 ? P1_KEYS[event.code] : P2_KEYS[event.code];
    delete heldInputs[playerIndex][action];
  }
  function updateHeldInputs(timestamp) {
    if (!session || session.paused || session.ended) return;
    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      if (!session.games[playerIndex]) continue;
      Object.keys(heldInputs[playerIndex]).forEach((action) => {
        if (timestamp >= heldInputs[playerIndex][action]) {
          processAction(playerIndex, action);
          heldInputs[playerIndex][action] = timestamp + KEY_REPEAT_INTERVAL;
        }
      });
    }
  }
  function processAction(playerIndex, action) {
    if (!session || session.paused || session.ended || session.phase !== 'playing') return;
    const game = session.games[playerIndex];
    if (!game) return;
    if (action === 'left') game.moveLeft();
    else if (action === 'right') game.moveRight();
    else if (action === 'rotate') game.rotate(1);
    else if (action === 'softDrop') game.softDrop();
    else if (action === 'hardDrop') game.hardDrop();
    else if (action === 'hold') game.hold();
    checkSessionEnd();
    updateAllHud();
  }
  function handlePlayAgain() {
    if (!session || !session.replay) return;
    closeResult();
    const replay = session.replay;
    session.replay = null;
    replay();
  }
  function bindPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const input = byId(button.dataset.target);
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? '显示' : '隐藏';
      });
    });
  }
  function syncSoundButtons() {
    const muted = Sound.isMuted();
    document.querySelectorAll('[data-sound-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(!muted));
      button.setAttribute('aria-label', muted ? '开启音效' : '关闭音效');
      const state = button.querySelector('.sound-state');
      if (state) state.textContent = muted ? '关' : '开';
    });
  }
  function toggleSound() {
    Sound.toggleMuted();
    syncSoundButtons();
  }
  function init() {
    bindPasswordToggles();
    syncSoundButtons();
    document.querySelectorAll('[data-sound-toggle]').forEach((button) => {
      button.addEventListener('click', toggleSound);
    });
    document.addEventListener('pointerdown', () => Sound.unlock(), { once: true, capture: true, passive: true });
    document.addEventListener('keydown', () => Sound.unlock(), { once: true, capture: true });
    byId('login-tab').addEventListener('click', () => setAuthMode('login'));
    byId('register-tab').addEventListener('click', () => setAuthMode('register'));
    byId('login-form').addEventListener('submit', handleLogin);
    byId('register-form').addEventListener('submit', handleRegister);
    byId('logout-button').addEventListener('click', () => {
      cleanupSession(true);
      Store.logout();
      showAuth();
    });
    byId('lobby-home-link').addEventListener('click', (event) => {
      event.preventDefault();
      showLobby();
    });
    byId('start-single-button').addEventListener('click', startSingleSession);
    byId('battle-p2-password').addEventListener('input', updateBattleButton);
    byId('start-battle-button').addEventListener('click', handleStartBattle);
    byId('create-p2-form').addEventListener('submit', handleCreateP2);
    byId('leave-game-button').addEventListener('click', leaveGame);
    byId('pause-game-button').addEventListener('click', () => pauseGame());
    byId('resume-game-button').addEventListener('click', () => pauseGame(false));
    byId('result-lobby-button').addEventListener('click', () => {
      cleanupSession(true);
      showLobby();
    });
    byId('play-again-button').addEventListener('click', handlePlayAgain);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', () => {
      clearHeldInputs();
      if (session && session.phase === 'playing' && !session.paused && !session.ended) pauseGame(true);
    });
    window.addEventListener('beforeunload', (event) => {
      if (session && !session.ended) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
    if (Store.getCurrentUser()) showLobby();
    else showAuth();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();






