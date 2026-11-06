(function (global) {
  'use strict';

  const USERS_KEY = 'tetrisArena.users.v1';
  const SESSION_KEY = 'tetrisArena.session.v1';
  const PBKDF2_ITERATIONS = 120000;

  const DEFAULT_STATS = Object.freeze({
    gamesPlayed: 0,
    totalLines: 0,
    bestScore: 0,
    bestLevel: 1,
    ladderRating: 1000,
    ladderGames: 0,
    battleRating: 1000,
    battleGames: 0,
    battleWins: 0,
    battleLosses: 0,
    battleDraws: 0
  });

  function createDefaultStats() {
    return { ...DEFAULT_STATS };
  }

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn('本地数据解析失败，已使用空数据。', error);
      return fallback;
    }
  }

  function normalizeStats(stats) {
    return { ...createDefaultStats(), ...(stats || {}) };
  }

  function normalizeUser(user) {
    if (!user || typeof user !== 'object') return null;
    return {
      ...user,
      stats: normalizeStats(user.stats)
    };
  }

  function getUsers() {
    const stored = safeParse(global.localStorage.getItem(USERS_KEY), []);
    if (!Array.isArray(stored)) return [];
    return stored.map(normalizeUser).filter(Boolean);
  }

  function saveUsers(users) {
    global.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSessionId() {
    try {
      return global.sessionStorage.getItem(SESSION_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function setSessionId(userId) {
    try {
      if (userId) global.sessionStorage.setItem(SESSION_KEY, userId);
      else global.sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('当前浏览器不允许写入会话存储。', error);
    }
  }

  function toPublicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: normalizeStats(user.stats)
    };
  }

  function getCurrentUser() {
    const id = getSessionId();
    if (!id) return null;
    return toPublicUser(getUsers().find((user) => user.id === id) || null);
  }

  function normalizeUsername(username) {
    return String(username || '').trim().normalize('NFKC');
  }

  function usernameKey(username) {
    return normalizeUsername(username).toLocaleLowerCase('zh-CN');
  }

  function validateUsername(username) {
    const value = normalizeUsername(username);
    if (!value) return '请输入用户名。';
    const length = Array.from(value).length;
    if (length < 1 || length > 16) return '用户名需为 1–16 个字符。';
    if (!/^[\p{L}\p{N}_-]+$/u.test(value)) return '用户名只能包含中文、字母、数字、下划线或短横线。';
    return '';
  }

  function validatePassword(password) {
    const value = String(password || '');
    if (value.length < 1) return '请输入密码。';
    if (value.length > 64) return '密码不能超过 64 位。';
    return '';
  }

  function getCrypto() {
    if (!global.crypto || !global.crypto.subtle) {
      throw new Error('当前环境不支持 Web Crypto。请通过 http://localhost 启动项目后重试。');
    }
    return global.crypto;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return global.btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = global.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function derivePasswordHash(password, saltBase64) {
    const cryptoApi = getCrypto();
    const encoder = new TextEncoder();
    const keyMaterial = await cryptoApi.subtle.importKey(
      'raw',
      encoder.encode(String(password)),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await cryptoApi.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: base64ToBytes(saltBase64),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function equalStrings(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return mismatch === 0;
  }

  function makeId() {
    const cryptoApi = getCrypto();
    if (typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function makeSalt() {
    const cryptoApi = getCrypto();
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  async function register(username, password, options = {}) {
    const { persistSession = true } = options;
    const nameError = validateUsername(username);
    if (nameError) throw new Error(nameError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);

    const name = normalizeUsername(username);
    const key = usernameKey(name);
    const users = getUsers();
    if (users.some((user) => usernameKey(user.username) === key)) {
      throw new Error('该用户名已被本地账号占用。');
    }

    const salt = makeSalt();
    const passwordHash = await derivePasswordHash(password, salt);
    const now = new Date().toISOString();
    const user = {
      id: makeId(),
      username: name,
      usernameKey: key,
      salt,
      passwordHash,
      passwordIterations: PBKDF2_ITERATIONS,
      createdAt: now,
      lastLoginAt: now,
      stats: createDefaultStats()
    };

    users.push(user);
    saveUsers(users);
    if (persistSession) setSessionId(user.id);
    return toPublicUser(user);
  }

  async function verifyCredentials(username, password) {
    const key = usernameKey(username);
    const user = getUsers().find((candidate) => candidate.usernameKey === key || usernameKey(candidate.username) === key);
    if (!user) return null;

    const iterations = Number(user.passwordIterations) || PBKDF2_ITERATIONS;
    const cryptoApi = getCrypto();
    const encoder = new TextEncoder();
    const keyMaterial = await cryptoApi.subtle.importKey(
      'raw',
      encoder.encode(String(password || '')),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await cryptoApi.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: base64ToBytes(user.salt),
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const candidateHash = bytesToBase64(new Uint8Array(bits));
    if (!equalStrings(candidateHash, user.passwordHash)) return null;
    return toPublicUser(user);
  }

  async function login(username, password) {
    const user = await verifyCredentials(username, password);
    if (!user) throw new Error('用户名或密码不正确。');
    const users = getUsers();
    const stored = users.find((candidate) => candidate.id === user.id);
    stored.lastLoginAt = new Date().toISOString();
    saveUsers(users);
    setSessionId(user.id);
    return toPublicUser(stored);
  }

  function logout() {
    setSessionId('');
  }

  function getUserById(userId) {
    return toPublicUser(getUsers().find((user) => user.id === userId) || null);
  }

  function getPublicUsers() {
    return getUsers()
      .map(toPublicUser)
      .sort((a, b) => a.username.localeCompare(b.username, 'zh-CN'));
  }

  function getLeaderboard(limit = 20) {
    return getPublicUsers()
      .sort((a, b) => {
        const ratingDiff = b.stats.ladderRating - a.stats.ladderRating;
        if (ratingDiff !== 0) return ratingDiff;
        const scoreDiff = b.stats.bestScore - a.stats.bestScore;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, limit);
  }

  function updateUserStats(userId, updater) {
    const users = getUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error('找不到对应账号。');
    user.stats = normalizeStats(user.stats);
    updater(user.stats, user);
    saveUsers(users);
    return toPublicUser(user);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function recordSingleGame(userId, result) {
    let beforeRating = 1000;
    let afterRating = 1000;
    const user = updateUserStats(userId, (stats) => {
      const score = Math.max(0, Math.round(Number(result.score) || 0));
      const lines = Math.max(0, Math.round(Number(result.lines) || 0));
      const level = Math.max(1, Math.round(Number(result.level) || 1));
      beforeRating = stats.ladderRating;
      const performance = 760 + lines * 38 + level * 100 + (score / 2200) * 80;
      const delta = clamp(Math.round((performance - stats.ladderRating) * 0.22), -35, 50);
      afterRating = Math.max(0, stats.ladderRating + delta);
      stats.ladderRating = afterRating;
      stats.ladderGames += 1;
      stats.gamesPlayed += 1;
      stats.totalLines += lines;
      stats.bestScore = Math.max(stats.bestScore, score);
      stats.bestLevel = Math.max(stats.bestLevel, level);
    });
    return { user, beforeRating, afterRating, delta: afterRating - beforeRating };
  }

  function recordBattle(userId, result) {
    let beforeRating = 1000;
    let afterRating = 1000;
    const user = updateUserStats(userId, (stats) => {
      const opponentRating = Math.max(0, Number(result.opponentRating) || 1000);
      const actual = result.outcome === 'win' ? 1 : result.outcome === 'loss' ? 0 : 0.5;
      const expected = 1 / (1 + Math.pow(10, (opponentRating - stats.battleRating) / 400));
      beforeRating = stats.battleRating;
      afterRating = Math.max(0, stats.battleRating + Math.round(36 * (actual - expected)));
      stats.battleRating = afterRating;
      stats.battleGames += 1;
      stats.gamesPlayed += 1;
      stats.totalLines += Math.max(0, Math.round(Number(result.lines) || 0));
      stats.bestScore = Math.max(stats.bestScore, Math.max(0, Math.round(Number(result.score) || 0)));
      stats.bestLevel = Math.max(stats.bestLevel, Math.max(1, Math.round(Number(result.level) || 1)));
      if (result.outcome === 'win') stats.battleWins += 1;
      else if (result.outcome === 'loss') stats.battleLosses += 1;
      else stats.battleDraws += 1;
    });
    return { user, beforeRating, afterRating, delta: afterRating - beforeRating };
  }

  function getTier(rating) {
    const value = Number(rating) || 0;
    if (value < 900) return '青铜';
    if (value < 1100) return '白银';
    if (value < 1300) return '黄金';
    if (value < 1500) return '铂金';
    if (value < 1700) return '钻石';
    return '大师';
  }

  global.TetrisStore = {
    register,
    login,
    logout,
    verifyCredentials,
    getCurrentUser,
    getPublicUsers,
    getUserById,
    getLeaderboard,
    recordSingleGame,
    recordBattle,
    getTier,
    validateUsername,
    validatePassword,
    constants: { USERS_KEY, SESSION_KEY, PBKDF2_ITERATIONS }
  };
})(window);

