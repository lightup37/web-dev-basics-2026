/* 红蓝会战使用浏览器原生 WebRTC DataChannel，iceServers 为空，不加载外部联机库、
 * 信令服务、STUN 或 TURN。双方手动交换一次邀请 / 应答凭证即可在可直连的局域网中通信。
 * 蓝方是权威端：红方发送军令，蓝方执行同一套 24 帧结算后广播战局。 */
(function () {
	'use strict';

	if (typeof currentUser !== 'function' || !currentUser()) {
		window.location.replace('index.html');
		return;
	}

	var playerName = currentUser();
	var TEXT = {
		kicker: { 'zh-CN': 'P2P FIELD COMMAND · 联机军帐', en: 'P2P FIELD COMMAND' },
		title: { 'zh-CN': '红蓝会战', en: 'Red–Blue Engagement' },
		back: { 'zh-CN': '返回模式选择', en: 'Back to Mode Select' },
		rulesKicker: { 'zh-CN': 'RULES OF ENGAGEMENT · 交战条例', en: 'RULES OF ENGAGEMENT' },
		rulesTitle: { 'zh-CN': '交战规则', en: 'Rules of Engagement' },
		rule1: { 'zh-CN': '蓝方为房主、红方为加入者；开局掷骰，点数高者先行动。', en: 'The host commands Blue and the joining player commands Red; the higher opening die acts first.' },
		rule2: { 'zh-CN': '双方轮流行动；一轮内可给任意数量己方棋子下令，再统一结束行动。', en: 'Players alternate. During your turn, issue orders to any number of your units, then end the action.' },
		rule3: { 'zh-CN': '不限制回合。先歼灭对方全军者获胜；计时结束时存活棋子更多者获胜。', en: 'There is no turn limit. Eliminate the enemy first, or have more surviving units when time expires.' },
		rule4: { 'zh-CN': '双方使用同一份公平编制；同数存活时，以剩余生命比例裁决，再相同则平局。', en: 'Both sides use one fair force template. Equal survivors are settled by remaining health ratio, then a draw.' },
		networkNote: { 'zh-CN': '零外链模式：不连接第三方联机服务。双方需处于可直连的同一局域网，并保持页面打开；两台完全无网络通路的设备无法互传数据。', en: 'Zero-external-link mode: no third-party multiplayer service is contacted. Both devices need a directly reachable LAN path and must keep this page open.' },
		offlinePreparing: { 'zh-CN': '正在准备离线资源；首次在线缓存完成后，断开互联网仍可重新进入联机会战。', en: 'Preparing offline resources. Once the first online cache completes, you can reopen multiplayer without internet.' },
		offlineReady: { 'zh-CN': '离线资源已就绪：断开互联网后仍可重新进入；双方仍须保持同一局域网通路。', en: 'Offline resources are ready. You can reopen without internet; both devices still need a shared LAN path.' },
		offlineUnavailable: { 'zh-CN': '当前浏览器未完成离线缓存；本次对局仍不使用外链，离线前请保持页面打开。', en: 'This browser could not finish offline caching. This match still uses no external links; keep the page open before going offline.' },
		hostTitle: { 'zh-CN': '创建房间 · 蓝方', en: 'Create Room · Blue' },
		hostCopy: { 'zh-CN': '生成蓝方邀请凭证发给对手；收到红方应答后粘贴确认。凭证只包含本次浏览器直连信息。', en: 'Generate a Blue invitation for your opponent, then paste their Red response to connect. Credentials contain only this direct browser session.' },
		create: { 'zh-CN': '生成蓝方邀请', en: 'Generate Blue Invitation' },
		joinTitle: { 'zh-CN': '加入房间 · 红方', en: 'Join Room · Red' },
		joinCopy: { 'zh-CN': '粘贴蓝方邀请并生成红方应答，再把应答凭证发回蓝方。整个过程无需联机服务器。', en: 'Paste Blue\'s invitation, generate a Red response, and return it to Blue. No multiplayer server is used.' },
		join: { 'zh-CN': '生成红方应答', en: 'Generate Red Response' },
		roomCode: { 'zh-CN': '会战编号', en: 'Engagement ID' },
		offerLabel: { 'zh-CN': '① 把蓝方邀请凭证发给红方', en: '1. Send the Blue invitation to Red' },
		copyOffer: { 'zh-CN': '复制蓝方邀请', en: 'Copy Blue Invitation' },
		answerInputLabel: { 'zh-CN': '② 粘贴红方返回的应答凭证', en: '2. Paste the response returned by Red' },
		acceptAnswer: { 'zh-CN': '确认应答并连接', en: 'Accept Response and Connect' },
		guestOfferLabel: { 'zh-CN': '① 粘贴蓝方邀请凭证', en: '1. Paste the Blue invitation' },
		answerLabel: { 'zh-CN': '② 把红方应答凭证发回蓝方', en: '2. Return the Red response to Blue' },
		copyAnswer: { 'zh-CN': '复制红方应答', en: 'Copy Red Response' },
		armyKicker: { 'zh-CN': 'FAIR FORCE TEMPLATE · 公平编制', en: 'FAIR FORCE TEMPLATE' },
		armyTitle: { 'zh-CN': '双方共同编制', en: 'Shared Force' },
		strength: { 'zh-CN': '军力', en: 'Power' },
		units: { 'zh-CN': '棋子', en: 'Units' },
		infantry: { 'zh-CN': '步兵', en: 'Infantry' },
		cavalry: { 'zh-CN': '骑兵', en: 'Cavalry' },
		skirmisher: { 'zh-CN': '散兵', en: 'Skirmisher' },
		artillery: { 'zh-CN': '炮兵', en: 'Artillery' },
		grenadier: { 'zh-CN': '掷弹兵', en: 'Grenadier' },
		duration: { 'zh-CN': '对局时间', en: 'Match Time' },
		ready: { 'zh-CN': '确认编制并就绪', en: 'Confirm and Ready' },
		cancelReady: { 'zh-CN': '取消就绪', en: 'Cancel Ready' },
		idle: { 'zh-CN': '无需外部服务器：请生成或粘贴本次会战的配对凭证。', en: 'No external server is required. Generate or paste this engagement\'s pairing credential.' },
		initiative: { 'zh-CN': 'INITIATIVE · 先攻判定', en: 'INITIATIVE' },
		diceTitle: { 'zh-CN': '命运正在掷骰', en: 'The Dice Decide' },
		blue: { 'zh-CN': '蓝方', en: 'Blue' },
		red: { 'zh-CN': '红方', en: 'Red' },
		timeRemain: { 'zh-CN': '剩余时间', en: 'Time Remaining' },
		commandHint: { 'zh-CN': '选择己方棋子，再点击空地或敌军下令；可反复选择不同部队。', en: 'Select your units, then click ground or an enemy to order them. Repeat for as many groups as needed.' },
		endTurn: { 'zh-CN': '结束本方行动', en: 'End Action' },
		battleReport: { 'zh-CN': 'BATTLE REPORT · 战果', en: 'BATTLE REPORT' },
		playAgain: { 'zh-CN': '再开一局', en: 'Play Again' },
		preparingOffer: { 'zh-CN': '正在由本机生成蓝方直连邀请……', en: 'Generating a direct Blue invitation on this device…' },
		waitingAnswer: { 'zh-CN': '会战 {code} 的邀请已生成。请发给红方，再粘贴其应答。', en: 'Invitation for engagement {code} is ready. Send it to Red, then paste their response.' },
		preparingAnswer: { 'zh-CN': '正在由本机验证邀请并生成红方应答……', en: 'Validating the invitation and generating Red\'s response on this device…' },
		answerReady: { 'zh-CN': '红方应答已生成。请发回蓝方，并等待蓝方确认。', en: 'Red\'s response is ready. Return it to Blue and wait for confirmation.' },
		connecting: { 'zh-CN': '应答已接受，正在建立浏览器点对点数据通道……', en: 'Response accepted. Establishing the browser peer-to-peer data channel…' },
		connected: { 'zh-CN': '连接成功：{blue}（蓝）对 {red}（红）。双方就绪后掷骰。', en: 'Connected: {blue} (Blue) vs {red} (Red). Ready both sides to roll.' },
		unsupportedWebRTC: { 'zh-CN': '当前浏览器不支持原生 WebRTC 数据通道，请更新 Chrome、Edge、Firefox 或 Safari。', en: 'This browser does not support native WebRTC data channels. Update Chrome, Edge, Firefox, or Safari.' },
		invalidHandshake: { 'zh-CN': '配对凭证无效或粘贴不完整，请重新复制全部内容。', en: 'The pairing credential is invalid or incomplete. Copy and paste the entire value again.' },
		wrongAnswer: { 'zh-CN': '这份应答不属于当前会战，请让红方使用最新邀请重新生成。', en: 'This response belongs to another engagement. Ask Red to regenerate it from the latest invitation.' },
		connectionFail: { 'zh-CN': '连接未建立：{reason}', en: 'Connection failed: {reason}' },
		disconnected: { 'zh-CN': '与对手的连接已断开，本局已暂停。可返回军帐重新建房。', en: 'The opponent disconnected and the match is paused. Return to the war room to create another room.' },
		validForce: { 'zh-CN': '编制有效：双方各 {units} 支，军力 {points}/35。', en: 'Valid force: {units} units per side, power {points}/35.' },
		invalidForce: { 'zh-CN': '双方需各带 4—18 支棋子，且军力不得超过 35。', en: 'Each side needs 4–18 units and no more than 35 power.' },
		hostControls: { 'zh-CN': '房主可调整；修改编制会取消双方就绪。', en: 'The host may edit this force; changes cancel both ready states.' },
		guestPreview: { 'zh-CN': '房主正在设置双方共同编制；你可查看并确认。', en: 'The host controls this shared force. Review it and confirm.' },
		readyState: { 'zh-CN': '蓝方 {blue} · 红方 {red}', en: 'Blue {blue} · Red {red}' },
		readyYes: { 'zh-CN': '已就绪', en: 'ready' },
		readyNo: { 'zh-CN': '未就绪', en: 'not ready' },
		copiedCredential: { 'zh-CN': '配对凭证已复制。', en: 'Pairing credential copied.' },
		copyFail: { 'zh-CN': '无法自动复制，请长按文本框后手动复制全部凭证。', en: 'Automatic copy failed. Select and copy the entire credential manually.' },
		blueFirst: { 'zh-CN': '蓝方以 {blue}:{red} 取得先手。', en: 'Blue wins initiative {blue}:{red}.' },
		redFirst: { 'zh-CN': '红方以 {red}:{blue} 取得先手。', en: 'Red wins initiative {red}:{blue}.' },
		myTurn: { 'zh-CN': '第 {turn} 轮 · 轮到你（{side}）下令', en: 'Round {turn} · Your action ({side})' },
		theirTurn: { 'zh-CN': '第 {turn} 轮 · 等待对手（{side}）下令', en: 'Round {turn} · Waiting for {side}' },
		resolving: { 'zh-CN': '军令已送出，等待房主结算……', en: 'Orders sent. Waiting for the host to resolve them…' },
		orderGround: { 'zh-CN': '已向 {count} 支部队下达机动命令。', en: 'Movement ordered for {count} unit(s).' },
		orderFollow: { 'zh-CN': '已命令 {count} 支部队追踪 {target}；目标移动时箭头会随行。', en: '{count} unit(s) ordered to track {target}; arrows will follow a moving target.' },
		selectedDetail: { 'zh-CN': '{name} {index} · 生命 {hp}/{max} · 射程 {range} · 攻击 {atk} · 速度 {speed}', en: '{name} {index} · HP {hp}/{max} · Range {range} · Attack {atk} · Speed {speed}' },
		timeoutWait: { 'zh-CN': '时间已到，等待房主裁决战果……', en: 'Time is up. Waiting for the host\'s ruling…' },
		blueWin: { 'zh-CN': '蓝方胜利', en: 'Blue Victory' },
		redWin: { 'zh-CN': '红方胜利', en: 'Red Victory' },
		draw: { 'zh-CN': '双方战平', en: 'Draw' },
		resultElimination: { 'zh-CN': '{winner}先行歼灭了对方全部棋子。蓝方存活 {blue}，红方存活 {red}。', en: '{winner} eliminated the opposing force. Blue survivors: {blue}; Red survivors: {red}.' },
		resultTime: { 'zh-CN': '计时结束。蓝方存活 {blue}，红方存活 {red}；同数时按剩余生命比例裁决。', en: 'Time expired. Blue survivors: {blue}; Red survivors: {red}. Equal counts use remaining health ratio.' },
		resultDraw: { 'zh-CN': '计时结束，双方存活数与剩余生命比例完全相同。', en: 'Time expired with equal survivors and equal remaining health.' }
	};

	function text(key, vars) {
		var value = TEXT[key] || { 'zh-CN': key, en: key };
		var output = typeof uiLocalize === 'function' ? uiLocalize(value) : value['zh-CN'];
		return String(output).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, name) {
			return vars && vars[name] !== undefined ? String(vars[name]) : '';
		});
	}

	function renderLanguage() {
		document.querySelectorAll('[data-mp-i18n]').forEach(function (node) {
			node.textContent = text(node.dataset.mpI18n);
		});
		document.title = text('title') + ' - ' + (typeof uiT === 'function' ? uiT('site.title') : '拿破仑战争');
		renderForceValidation();
		renderLobbyState();
		renderBattleHud();
		if (battleState) renderBattle();
	}

	var UNIT_DEFS = {
		infantry: { cls: '步', cost: 2, speed: 0.1, range: 0.5, atk: 0.5, lp: 60 },
		cavalry: { cls: '骑', cost: 3, speed: 0.2, range: 0.5, atk: 1.0, lp: 60 },
		skirmisher: { cls: '散', cost: 2, speed: 0.1, range: 1.0, atk: 0.7, lp: 42 },
		artillery: { cls: '炮', cost: 4, speed: 0.05, range: 4.0, atk: 0.7, lp: 60 },
		grenadier: { cls: '掷', cost: 4, speed: 0.05, range: 0.5, atk: 0.7, lp: 120 }
	};
	var UNIT_ORDER = ['infantry', 'cavalry', 'skirmisher', 'artillery', 'grenadier'];
	var DEFAULT_FORCE = { infantry: 6, cavalry: 3, skirmisher: 3, artillery: 2, grenadier: 0 };
	var config = Object.assign({}, DEFAULT_FORCE);
	var durationSeconds = 900;
	var role = '';
	var mySide = '';
	var roomCode = '';
	var rtcPeer = null;
	var connection = null;
	var connected = false;
	var ready = { blue: false, red: false };
	var players = { blue: playerName, red: '' };
	var phase = 'lobby';
	var battleState = null;
	var selectedIds = [];
	var matchEndAt = 0;
	var timerId = null;
	var waitingForHost = false;
	var finished = false;

	var lobby = document.getElementById('mp-lobby');
	var diceStage = document.getElementById('mp-dice');
	var battle = document.getElementById('mp-battle');
	var board = document.getElementById('mp-board');
	var statusNode = document.getElementById('mp-status');
	var createButton = document.getElementById('mp-create');
	var joinButton = document.getElementById('mp-join');
	var roomShare = document.getElementById('mp-room-share');
	var roomCodeNode = document.getElementById('mp-room-code');
	var hostHandshake = document.getElementById('mp-host-handshake');
	var hostOffer = document.getElementById('mp-host-offer');
	var hostAnswer = document.getElementById('mp-host-answer');
	var guestOffer = document.getElementById('mp-guest-offer');
	var guestHandshake = document.getElementById('mp-guest-handshake');
	var guestAnswer = document.getElementById('mp-guest-answer');
	var builder = document.getElementById('mp-army-builder');
	var readyButton = document.getElementById('mp-ready');
	var durationSelect = document.getElementById('mp-duration');
	var endTurnButton = document.getElementById('mp-end-turn');

	function setStatus(message, kind) {
		statusNode.textContent = message;
		statusNode.dataset.kind = kind || 'info';
	}

	function randomCode() {
		var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		var values = new Uint32Array(6);
		if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(values);
		else for (var i = 0; i < values.length; i++) values[i] = Math.floor(Math.random() * 0xffffffff);
		return Array.from(values).map(function (value) { return alphabet[value % alphabet.length]; }).join('');
	}

	function forceStats(value) {
		var units = 0;
		var points = 0;
		UNIT_ORDER.forEach(function (type) {
			var count = Math.max(0, Math.floor(Number(value[type]) || 0));
			units += count;
			points += count * UNIT_DEFS[type].cost;
		});
		return { units: units, points: points, valid: units >= 4 && units <= 18 && points <= 35 };
	}

	function readForceInputs() {
		var next = {};
		document.querySelectorAll('[data-unit]').forEach(function (input) {
			var max = Number(input.max) || 12;
			var value = Math.max(0, Math.min(max, Math.floor(Number(input.value) || 0)));
			input.value = String(value);
			next[input.dataset.unit] = value;
		});
		return next;
	}

	function writeForceInputs() {
		document.querySelectorAll('[data-unit]').forEach(function (input) {
			input.value = String(config[input.dataset.unit] || 0);
			input.disabled = role !== 'host';
		});
		durationSelect.value = String(durationSeconds);
		durationSelect.disabled = role !== 'host';
	}

	function renderForceValidation() {
		var stats = forceStats(config);
		document.getElementById('mp-points').textContent = String(stats.points);
		document.getElementById('mp-units').textContent = String(stats.units);
		var validation = document.getElementById('mp-validation');
		validation.textContent = stats.valid
			? text('validForce', stats) + ' ' + (role === 'guest' ? text('guestPreview') : text('hostControls'))
			: text('invalidForce');
		validation.dataset.valid = stats.valid ? 'true' : 'false';
		readyButton.disabled = !connected || !stats.valid;
		return stats.valid;
	}

	function send(payload) {
		if (!connection || !connection.open) return false;
		try { connection.send(payload); return true; }
		catch (error) { setStatus(text('connectionFail', { reason: error.message || String(error) }), 'error'); return false; }
	}

	function lobbyPayload() {
		return {
			type: 'lobby-state',
			config: Object.assign({}, config),
			duration: durationSeconds,
			ready: Object.assign({}, ready),
			players: Object.assign({}, players)
		};
	}

	function renderLobbyState() {
		if (phase !== 'lobby') return;
		writeForceInputs();
		renderForceValidation();
		readyButton.textContent = ready[mySide] ? text('cancelReady') : text('ready');
		if (connected) {
			setStatus(text('connected', players) + ' ' + text('readyState', {
				blue: text(ready.blue ? 'readyYes' : 'readyNo'),
				red: text(ready.red ? 'readyYes' : 'readyNo')
			}), 'connected');
		}
	}

	function resetReadyAfterHostEdit() {
		if (role !== 'host') return;
		ready.blue = false;
		ready.red = false;
		config = readForceInputs();
		durationSeconds = Number(durationSelect.value) || 900;
		renderLobbyState();
		send(lobbyPayload());
	}

	document.querySelectorAll('[data-unit]').forEach(function (input) {
		input.addEventListener('input', resetReadyAfterHostEdit);
	});
	durationSelect.addEventListener('change', resetReadyAfterHostEdit);

	function disableConnectionChoices() {
		createButton.disabled = true;
		joinButton.disabled = true;
		guestOffer.disabled = true;
	}

	function enableBuilder() {
		builder.setAttribute('aria-disabled', 'false');
		builder.classList.add('is-enabled');
		writeForceInputs();
		renderForceValidation();
	}

	function bindConnection(conn) {
		if (connection && connection.open) { try { conn.close(); } catch (e) { } return; }
		connection = conn;
		connection.on('open', function () {
			connected = true;
			enableBuilder();
			if (role === 'guest') {
				send({ type: 'hello', name: playerName });
			} else {
				players.red = players.red || text('red');
				send(lobbyPayload());
			}
			renderLobbyState();
		});
		connection.on('data', handleMessage);
		connection.on('close', handleDisconnect);
		connection.on('error', function (error) {
			setStatus(text('connectionFail', { reason: error.message || error.type || String(error) }), 'error');
		});
	}

	function connectionSetupError(error) {
		var reason = error && (error.message || error.type) ? (error.message || error.type) : String(error || 'unknown');
		setStatus(text('connectionFail', { reason: reason }), 'error');
		createButton.disabled = false;
		joinButton.disabled = false;
		guestOffer.disabled = false;
	}

	function bytesToBase64Url(bytes) {
		var binary = '';
		for (var offset = 0; offset < bytes.length; offset += 0x8000) {
			binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 0x8000));
		}
		return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}

	function base64UrlToBytes(value) {
		var base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
		while (base64.length % 4) base64 += '=';
		var binary = window.atob(base64);
		var bytes = new Uint8Array(binary.length);
		for (var index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
		return bytes;
	}

	function encodeCredential(kind, code, description) {
		var payload = JSON.stringify({
			version: 1,
			kind: kind,
			room: code,
			description: { type: description.type, sdp: description.sdp }
		});
		return 'NWP1.' + bytesToBase64Url(new TextEncoder().encode(payload));
	}

	function decodeCredential(value) {
		try {
			var compact = String(value || '').replace(/\s/g, '');
			if (compact.slice(0, 5) !== 'NWP1.') throw new Error('prefix');
			var payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(compact.slice(5))));
			var description = payload && payload.description;
			if (payload.version !== 1 || !/^[A-Z2-9]{6}$/.test(payload.room || '') ||
				(payload.kind !== 'offer' && payload.kind !== 'answer') || !description ||
				description.type !== payload.kind || typeof description.sdp !== 'string' || !description.sdp) {
				throw new Error('shape');
			}
			return payload;
		} catch (error) {
			throw new Error(text('invalidHandshake'));
		}
	}

	function waitForIceGathering(pc) {
		if (pc.iceGatheringState === 'complete') return Promise.resolve();
		return new Promise(function (resolve) {
			var timer = window.setTimeout(done, 8000);
			function done() {
				window.clearTimeout(timer);
				pc.removeEventListener('icegatheringstatechange', check);
				resolve();
			}
			function check() { if (pc.iceGatheringState === 'complete') done(); }
			pc.addEventListener('icegatheringstatechange', check);
		});
	}

	function createNativePeer() {
		if (typeof window.RTCPeerConnection !== 'function') throw new Error(text('unsupportedWebRTC'));
		var pc = new window.RTCPeerConnection({ iceServers: [] });
		pc.addEventListener('connectionstatechange', function () {
			if (pc.connectionState === 'failed') {
				if (connected) handleDisconnect();
				else connectionSetupError(new Error('WebRTC ' + pc.connectionState));
			}
		});
		return pc;
	}

	function adaptDataChannel(channel) {
		var handlers = { open: [], data: [], close: [], error: [] };
		function emit(name, value) { handlers[name].slice().forEach(function (handler) { handler(value); }); }
		channel.addEventListener('open', function () { emit('open'); });
		channel.addEventListener('message', function (event) {
			try { emit('data', JSON.parse(event.data)); }
			catch (error) { /* 丢弃非本游戏协议数据。 */ }
		});
		channel.addEventListener('close', function () { emit('close'); });
		channel.addEventListener('error', function (event) { emit('error', event.error || event); });
		var adapter = {
			send: function (payload) { channel.send(JSON.stringify(payload)); },
			close: function () { channel.close(); },
			on: function (name, handler) { if (handlers[name]) handlers[name].push(handler); }
		};
		Object.defineProperty(adapter, 'open', { get: function () { return channel.readyState === 'open'; } });
		return adapter;
	}

	function bindDataChannel(channel) {
		channel.binaryType = 'arraybuffer';
		bindConnection(adaptDataChannel(channel));
	}

	function closeRtcPeer() {
		try { if (connection) connection.close(); } catch (error) { }
		try { if (rtcPeer) rtcPeer.close(); } catch (error) { }
		connection = null;
		rtcPeer = null;
		connected = false;
	}

	function copyCredential(field) {
		var value = field.value;
		var copied = false;
		var task;
		if (navigator.clipboard && navigator.clipboard.writeText) {
			task = navigator.clipboard.writeText(value).then(function () { copied = true; });
		} else task = Promise.resolve();
		return task.catch(function () { }).then(function () {
			if (!copied && field.select) {
				field.select();
				try { copied = !!document.execCommand && document.execCommand('copy'); } catch (error) { copied = false; }
			}
			if (typeof toast === 'function') toast(text(copied ? 'copiedCredential' : 'copyFail'));
		});
	}

	createButton.addEventListener('click', async function () {
		role = 'host';
		mySide = 'blue';
		roomCode = randomCode();
		players = { blue: playerName, red: '' };
		disableConnectionChoices();
		setStatus(text('preparingOffer'), 'waiting');
		try {
			closeRtcPeer();
			rtcPeer = createNativePeer();
			bindDataChannel(rtcPeer.createDataChannel('napoleon-field', { ordered: true }));
			await rtcPeer.setLocalDescription(await rtcPeer.createOffer());
			await waitForIceGathering(rtcPeer);
			hostOffer.value = encodeCredential('offer', roomCode, rtcPeer.localDescription);
			hostAnswer.value = '';
			roomCodeNode.textContent = roomCode;
			roomShare.hidden = false;
			hostHandshake.hidden = false;
			enableBuilder();
			setStatus(text('waitingAnswer', { code: roomCode }), 'waiting');
		} catch (error) { closeRtcPeer(); connectionSetupError(error); }
	});

	joinButton.addEventListener('click', async function () {
		var invitation;
		try { invitation = decodeCredential(guestOffer.value); }
		catch (error) { setStatus(error.message, 'error'); guestOffer.focus(); return; }
		if (invitation.kind !== 'offer') { setStatus(text('invalidHandshake'), 'error'); return; }
		role = 'guest';
		mySide = 'red';
		roomCode = invitation.room;
		players = { blue: text('blue'), red: playerName };
		disableConnectionChoices();
		setStatus(text('preparingAnswer'), 'waiting');
		try {
			closeRtcPeer();
			rtcPeer = createNativePeer();
			rtcPeer.addEventListener('datachannel', function (event) { bindDataChannel(event.channel); });
			await rtcPeer.setRemoteDescription(invitation.description);
			await rtcPeer.setLocalDescription(await rtcPeer.createAnswer());
			await waitForIceGathering(rtcPeer);
			guestAnswer.value = encodeCredential('answer', roomCode, rtcPeer.localDescription);
			guestHandshake.hidden = false;
			setStatus(text('answerReady'), 'waiting');
		} catch (error) { closeRtcPeer(); connectionSetupError(error); }
	});

	document.getElementById('mp-accept-answer').addEventListener('click', async function () {
		var response;
		try { response = decodeCredential(hostAnswer.value); }
		catch (error) { setStatus(error.message, 'error'); hostAnswer.focus(); return; }
		if (role !== 'host' || !rtcPeer || response.kind !== 'answer') {
			setStatus(text('invalidHandshake'), 'error'); return;
		}
		if (response.room !== roomCode) { setStatus(text('wrongAnswer'), 'error'); return; }
		this.disabled = true;
		setStatus(text('connecting'), 'waiting');
		try { await rtcPeer.setRemoteDescription(response.description); }
		catch (error) { this.disabled = false; connectionSetupError(error); }
	});

	document.getElementById('mp-copy-offer').addEventListener('click', function () { copyCredential(hostOffer); });
	document.getElementById('mp-copy-answer').addEventListener('click', function () { copyCredential(guestAnswer); });

	readyButton.addEventListener('click', function () {
		if (!connected || !renderForceValidation()) return;
		ready[mySide] = !ready[mySide];
		if (role === 'host') {
			send(lobbyPayload());
			renderLobbyState();
			maybeStartMatch();
		} else {
			send({ type: 'ready', value: ready.red });
			renderLobbyState();
		}
	});

	function handleMessage(message) {
		if (!message || typeof message !== 'object' || !message.type) return;
		if (message.type === 'hello' && role === 'host') {
			players.red = String(message.name || text('red')).slice(0, 40);
			send(lobbyPayload());
			renderLobbyState();
			return;
		}
		if (message.type === 'lobby-state' && role === 'guest' && phase === 'lobby') {
			config = Object.assign({}, DEFAULT_FORCE, message.config || {});
			durationSeconds = Number(message.duration) || 900;
			ready = Object.assign({ blue: false, red: false }, message.ready || {});
			players = Object.assign({ blue: text('blue'), red: playerName }, message.players || {});
			players.red = playerName;
			enableBuilder();
			renderLobbyState();
			return;
		}
		if (message.type === 'ready' && role === 'host' && phase === 'lobby') {
			ready.red = !!message.value;
			send(lobbyPayload());
			renderLobbyState();
			maybeStartMatch();
			return;
		}
		if (message.type === 'start' && role === 'guest') {
			beginMatch(message);
			return;
		}
		if (message.type === 'orders' && role === 'host' && phase === 'battle') {
			handleGuestOrders(message);
			return;
		}
		if (message.type === 'turn' && role === 'guest' && phase === 'battle') {
			applyAuthoritativeTurn(message);
			return;
		}
		if (message.type === 'timeout-request' && role === 'host' && phase === 'battle') {
			if (Date.now() >= matchEndAt - 1000) finishMatch('time');
			return;
		}
		if (message.type === 'finish') showResult(message.result);
	}

	function handleDisconnect() {
		connected = false;
		if (phase === 'battle' && !finished) {
			endTurnButton.disabled = true;
			var hint = document.getElementById('mp-command-hint');
			if (hint) hint.textContent = text('disconnected');
			if (typeof modalNotice === 'function') modalNotice(text('disconnected'));
		} else if (phase === 'lobby') {
			setStatus(text('disconnected'), 'error');
		}
	}

	function rollDie() {
		var value = new Uint32Array(1);
		if (window.crypto && window.crypto.getRandomValues) { window.crypto.getRandomValues(value); return (value[0] % 6) + 1; }
		return Math.floor(Math.random() * 6) + 1;
	}

	function maybeStartMatch() {
		if (role !== 'host' || !connected || !ready.blue || !ready.red || !forceStats(config).valid) return;
		var blueDie = rollDie();
		var redDie = rollDie();
		while (blueDie === redDie) { blueDie = rollDie(); redDie = rollDie(); }
		var first = blueDie > redDie ? 'blue' : 'red';
		var startAt = Date.now() + 2400;
		var payload = {
			type: 'start',
			config: Object.assign({}, config),
			players: Object.assign({}, players),
			blueDie: blueDie,
			redDie: redDie,
			state: makeInitialState(first),
			startAt: startAt,
			endAt: startAt + durationSeconds * 1000
		};
		send(payload);
		beginMatch(payload);
	}

	function formationPositions(count, side) {
		var result = [];
		for (var i = 0; i < count; i++) {
			var column = Math.floor(i / 6);
			var slot = i % 6;
			var inColumn = Math.min(6, count - column * 6);
			var y = (slot + 1) * 9 / (inColumn + 1);
			var x = side === 'blue' ? (0.55 + column * 0.78) : (8.45 - column * 0.78);
			result.push({ x: x, y: y });
		}
		return result;
	}

	function makeUnitsForSide(side) {
		var types = [];
		UNIT_ORDER.forEach(function (type) {
			for (var i = 0; i < (Number(config[type]) || 0); i++) types.push(type);
		});
		var positions = formationPositions(types.length, side);
		var typeCounts = {};
		return types.map(function (type, index) {
			var def = UNIT_DEFS[type];
			typeCounts[type] = (typeCounts[type] || 0) + 1;
			var pos = positions[index];
			return {
				id: side + '-' + index,
				color: side,
				type: type,
				cls: def.cls,
				index: typeCounts[type],
				posx: pos.x,
				posy: pos.y,
				targetx: pos.x,
				targety: pos.y,
				followTargetId: '',
				speed: def.speed,
				atkrange: def.range,
				atk: def.atk,
				lp: def.lp,
				lpMax: def.lp,
				disabled: false
			};
		});
	}

	function makeInitialState(first) {
		return { units: makeUnitsForSide('blue').concat(makeUnitsForSide('red')), activeSide: first, turn: 1 };
	}

	function beginMatch(payload) {
		phase = 'dice';
		config = Object.assign({}, DEFAULT_FORCE, payload.config || {});
		players = Object.assign({}, players, payload.players || {});
		battleState = payload.state;
		matchEndAt = Number(payload.endAt) || (Date.now() + durationSeconds * 1000);
		lobby.hidden = true;
		diceStage.hidden = false;
		diceStage.classList.remove('is-settled');
		document.getElementById('mp-blue-die').textContent = '?';
		document.getElementById('mp-red-die').textContent = '?';
		document.getElementById('mp-dice-result').textContent = '';
		window.setTimeout(function () {
			document.getElementById('mp-blue-die').textContent = String(payload.blueDie);
			document.getElementById('mp-red-die').textContent = String(payload.redDie);
			document.getElementById('mp-dice-result').textContent = text(payload.blueDie > payload.redDie ? 'blueFirst' : 'redFirst', {
				blue: payload.blueDie, red: payload.redDie
			});
			diceStage.classList.add('is-settled');
		}, 820);
		var wait = Math.max(1900, (Number(payload.startAt) || Date.now() + 2200) - Date.now());
		window.setTimeout(showBattle, wait);
	}

	function initBoard() {
		if (board.dataset.ready === 'true') return;
		board.dataset.ready = 'true';
		for (var row = 0; row < 10; row++) {
			for (var col = 0; col < 10; col++) {
				var cell = document.createElement('span');
				cell.className = 'mp-cell';
				cell.setAttribute('aria-hidden', 'true');
				board.appendChild(cell);
			}
		}
		board.addEventListener('click', onBoardClick);
	}

	function showBattle() {
		phase = 'battle';
		diceStage.hidden = true;
		battle.hidden = false;
		initBoard();
		renderBattle();
		if (timerId) window.clearInterval(timerId);
		timerId = window.setInterval(updateClock, 250);
		updateClock();
	}

	function unitName(unit) { return text(unit.type || 'infantry'); }
	function aliveUnits(side) {
		return battleState ? battleState.units.filter(function (unit) { return unit.color === side && !unit.disabled; }) : [];
	}
	function findUnit(id) {
		return battleState ? battleState.units.find(function (unit) { return unit.id === id; }) : null;
	}
	function ownTurn() {
		return phase === 'battle' && !waitingForHost && battleState && battleState.activeSide === mySide && connected && !finished;
	}

	function pieceImage(unit) {
		if (unit.color === 'red' && unit.type === 'skirmisher') return 'img/blue_skirmisher.webp';
		return 'img/' + unit.color + '_' + unit.type + '.webp';
	}

	function renderBattle() {
		if (!battleState || phase !== 'battle') return;
		selectedIds = selectedIds.filter(function (id) { var unit = findUnit(id); return unit && !unit.disabled && unit.color === mySide; });
		board.querySelectorAll('.mp-piece, .mp-order-layer').forEach(function (node) { node.remove(); });
		battleState.units.forEach(function (unit) {
			if (unit.disabled) return;
			var piece = document.createElement('button');
			piece.type = 'button';
			piece.className = 'mp-piece mp-piece--' + unit.color + ' mp-piece--' + unit.type + (selectedIds.indexOf(unit.id) >= 0 ? ' is-selected' : '');
			piece.dataset.unitId = unit.id;
			piece.style.left = (unit.posx / 9 * 100) + '%';
			piece.style.top = (unit.posy / 9 * 100) + '%';
			piece.title = unitName(unit) + ' ' + unit.index;
			var image = document.createElement('img');
			image.src = pieceImage(unit);
			image.alt = piece.title;
			image.draggable = false;
			var badge = document.createElement('span');
			badge.className = 'mp-piece__badge';
			badge.textContent = unit.cls;
			var health = document.createElement('span');
			health.className = 'mp-piece__health';
			health.style.setProperty('--health', Math.max(0, Math.min(100, unit.lp / unit.lpMax * 100)) + '%');
			piece.appendChild(image);
			piece.appendChild(badge);
			piece.appendChild(health);
			board.appendChild(piece);
		});
		renderOrderArrows();
		renderRosters();
		renderSelectedDetail();
		renderBattleHud();
	}

	function renderOrderArrows() {
		var layer = document.createElement('div');
		layer.className = 'mp-order-layer';
		var width = board.clientWidth || 600;
		var height = board.clientHeight || 600;
		battleState.units.forEach(function (unit) {
			if (unit.disabled) return;
			var target = unit.followTargetId ? findUnit(unit.followTargetId) : null;
			var tx = target && !target.disabled ? target.posx : unit.targetx;
			var ty = target && !target.disabled ? target.posy : unit.targety;
			var x1 = unit.posx / 9 * width;
			var y1 = unit.posy / 9 * height;
			var x2 = tx / 9 * width;
			var y2 = ty / 9 * height;
			var dx = x2 - x1;
			var dy = y2 - y1;
			var length = Math.sqrt(dx * dx + dy * dy);
			if (length < 5) return;
			var arrow = document.createElement('span');
			arrow.className = 'mp-order-arrow mp-order-arrow--' + unit.color;
			arrow.style.left = x1 + 'px';
			arrow.style.top = y1 + 'px';
			arrow.style.width = length + 'px';
			arrow.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)';
			layer.appendChild(arrow);
		});
		board.appendChild(layer);
	}

	function renderRosters() {
		['blue', 'red'].forEach(function (side) {
			var roster = document.getElementById('mp-' + side + '-roster');
			roster.innerHTML = '';
			var heading = document.createElement('h3');
			heading.textContent = text(side) + ' · ' + aliveUnits(side).length;
			roster.appendChild(heading);
			aliveUnits(side).forEach(function (unit) {
				var row = document.createElement('button');
				row.type = 'button';
				row.className = 'mp-roster-row' + (selectedIds.indexOf(unit.id) >= 0 ? ' is-selected' : '');
				row.dataset.unitId = unit.id;
				row.disabled = side !== mySide || !ownTurn();
				var name = document.createElement('span');
				name.textContent = unitName(unit) + ' ' + unit.index;
				var hp = document.createElement('small');
				hp.textContent = Math.max(0, Math.ceil(unit.lp)) + '/' + unit.lpMax;
				var bar = document.createElement('i');
				bar.style.setProperty('--health', Math.max(0, Math.min(100, unit.lp / unit.lpMax * 100)) + '%');
				row.appendChild(name);
				row.appendChild(hp);
				row.appendChild(bar);
				row.addEventListener('click', function (event) { selectUnit(unit, event.ctrlKey || event.shiftKey); });
				roster.appendChild(row);
			});
		});
	}

	function renderSelectedDetail() {
		var detail = document.getElementById('mp-selected-detail');
		var unit = selectedIds.length ? findUnit(selectedIds[0]) : null;
		if (!unit || unit.disabled) { detail.hidden = true; detail.textContent = ''; return; }
		detail.hidden = false;
		detail.textContent = text('selectedDetail', {
			name: unitName(unit), index: unit.index, hp: Math.ceil(unit.lp), max: unit.lpMax,
			range: unit.atkrange, atk: unit.atk, speed: unit.speed
		});
	}

	function renderBattleHud() {
		if (!battleState || phase !== 'battle') return;
		document.getElementById('mp-blue-player').textContent = players.blue || text('blue');
		document.getElementById('mp-red-player').textContent = players.red || text('red');
		document.getElementById('mp-blue-count').textContent = String(aliveUnits('blue').length);
		document.getElementById('mp-red-count').textContent = String(aliveUnits('red').length);
		var sideLabel = text(battleState.activeSide);
		document.getElementById('mp-turn-label').textContent = text(ownTurn() ? 'myTurn' : 'theirTurn', { turn: battleState.turn, side: sideLabel });
		endTurnButton.disabled = !ownTurn();
		endTurnButton.textContent = text('endTurn');
	}

	function selectUnit(unit, additive) {
		if (!ownTurn() || unit.color !== mySide || unit.disabled) return;
		var at = selectedIds.indexOf(unit.id);
		if (additive) {
			if (at >= 0) selectedIds.splice(at, 1); else selectedIds.push(unit.id);
		} else selectedIds = [unit.id];
		renderBattle();
	}

	function onBoardClick(event) {
		if (!ownTurn()) return;
		var pieceNode = event.target.closest('.mp-piece');
		if (pieceNode) {
			var unit = findUnit(pieceNode.dataset.unitId);
			if (!unit || unit.disabled) return;
			if (unit.color === mySide) { selectUnit(unit, event.ctrlKey || event.shiftKey); return; }
			if (selectedIds.length) issueOrder(unit.posx, unit.posy, unit);
			return;
		}
		if (!selectedIds.length) return;
		var rect = board.getBoundingClientRect();
		var x = Math.max(0, Math.min(9, (event.clientX - rect.left) / rect.width * 9));
		var y = Math.max(0, Math.min(9, (event.clientY - rect.top) / rect.height * 9));
		issueOrder(x, y, null);
	}

	function issueOrder(x, y, follow) {
		var count = selectedIds.length;
		selectedIds.forEach(function (id) {
			var unit = findUnit(id);
			if (!unit || unit.disabled || unit.color !== mySide) return;
			unit.targetx = x;
			unit.targety = y;
			unit.followTargetId = follow ? follow.id : '';
		});
		var hint = document.getElementById('mp-command-hint');
		hint.textContent = follow
			? text('orderFollow', { count: count, target: unitName(follow) + ' ' + follow.index })
			: text('orderGround', { count: count });
		selectedIds = [];
		renderBattle();
	}

	function distance(a, b) {
		var dx = a.posx - b.posx;
		var dy = a.posy - b.posy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function nearestEnemy(unit) {
		var enemies = battleState.units.filter(function (other) { return other.color !== unit.color && !other.disabled; });
		var nearest = null;
		var nearestDistance = Infinity;
		enemies.forEach(function (enemy) {
			var d = distance(unit, enemy);
			if (d < nearestDistance) { nearest = enemy; nearestDistance = d; }
		});
		return nearest;
	}

	function clearPosition(unit, x, y) {
		return battleState.units.every(function (other) {
			if (other === unit || other.disabled) return true;
			var dx = x - other.posx;
			var dy = y - other.posy;
			return Math.sqrt(dx * dx + dy * dy) >= 0.54;
		});
	}

	function safeMove(unit, startX, startY, desiredX, desiredY) {
		desiredX = Math.max(0, Math.min(9, desiredX));
		desiredY = Math.max(0, Math.min(9, desiredY));
		if (clearPosition(unit, desiredX, desiredY)) return { x: desiredX, y: desiredY };
		var dx = desiredX - startX;
		var dy = desiredY - startY;
		var len = Math.sqrt(dx * dx + dy * dy) || 1;
		var angles = [55, -55, 90, -90];
		for (var i = 0; i < angles.length; i++) {
			var rad = angles[i] * Math.PI / 180;
			var vx = (dx / len) * Math.cos(rad) - (dy / len) * Math.sin(rad);
			var vy = (dx / len) * Math.sin(rad) + (dy / len) * Math.cos(rad);
			var candidate = { x: Math.max(0, Math.min(9, startX + vx * len)), y: Math.max(0, Math.min(9, startY + vy * len)) };
			if (clearPosition(unit, candidate.x, candidate.y)) return candidate;
		}
		return { x: startX, y: startY };
	}

	function simulateSide(side) {
		for (var frame = 0; frame < 24; frame++) {
			battleState.units.filter(function (unit) { return unit.color === side && !unit.disabled; }).forEach(function (unit) {
				var tracked = unit.followTargetId ? findUnit(unit.followTargetId) : null;
				if (tracked && !tracked.disabled) { unit.targetx = tracked.posx; unit.targety = tracked.posy; }
				else if (unit.followTargetId) unit.followTargetId = '';
				var enemy = nearestEnemy(unit);
				if (!enemy) return;
				var combatRange = Math.max(Number(unit.atkrange) || 0, 0.58);
				var inRange = distance(unit, enemy) < combatRange;
				var moveX = unit.targetx - unit.posx;
				var moveY = unit.targety - unit.posy;
				var enemyX = enemy.posx - unit.posx;
				var enemyY = enemy.posy - unit.posy;
				var atTarget = Math.abs(moveX) < 0.000001 && Math.abs(moveY) < 0.000001;
				if (inRange && (atTarget || moveX * enemyX + moveY * enemyY >= 0)) {
					enemy.lp = Math.max(0, enemy.lp - unit.atk);
					if (enemy.lp <= 0) enemy.disabled = true;
					return;
				}
				var remaining = Math.sqrt(moveX * moveX + moveY * moveY);
				if (remaining < 0.000001) return;
				var travel = Math.min(unit.speed, remaining);
				var desiredX = unit.posx + moveX / remaining * travel;
				var desiredY = unit.posy + moveY / remaining * travel;
				var safe = safeMove(unit, unit.posx, unit.posy, desiredX, desiredY);
				unit.posx = safe.x;
				unit.posy = safe.y;
			});
		}
	}

	function sanitizedOrders(message) {
		return Array.isArray(message.orders) ? message.orders.slice(0, 18) : [];
	}

	function applyOrders(side, orders) {
		orders.forEach(function (order) {
			var unit = findUnit(String(order.id || ''));
			if (!unit || unit.color !== side || unit.disabled) return;
			unit.targetx = Math.max(0, Math.min(9, Number(order.targetx) || 0));
			unit.targety = Math.max(0, Math.min(9, Number(order.targety) || 0));
			var target = order.followTargetId ? findUnit(String(order.followTargetId)) : null;
			unit.followTargetId = target && target.color !== side && !target.disabled ? target.id : '';
		});
	}

	function exportOrders(side) {
		return battleState.units.filter(function (unit) { return unit.color === side && !unit.disabled; }).map(function (unit) {
			return { id: unit.id, targetx: unit.targetx, targety: unit.targety, followTargetId: unit.followTargetId || '' };
		});
	}

	function handleGuestOrders(message) {
		if (!battleState || battleState.activeSide !== 'red' || message.side !== 'red') return;
		applyOrders('red', sanitizedOrders(message));
		authoritativeTurn('red');
	}

	function authoritativeTurn(side) {
		if (role !== 'host' || !battleState || battleState.activeSide !== side || finished) return;
		simulateSide(side);
		battleState.activeSide = side === 'blue' ? 'red' : 'blue';
		battleState.turn += 1;
		waitingForHost = false;
		selectedIds = [];
		var message = {
			type: 'turn',
			state: JSON.parse(JSON.stringify(battleState)),
			remainingMs: Math.max(0, matchEndAt - Date.now())
		};
		send(message);
		renderBattle();
		adjudicateElimination();
	}

	function applyAuthoritativeTurn(message) {
		if (!message.state || !Array.isArray(message.state.units)) return;
		battleState = message.state;
		matchEndAt = Date.now() + Math.max(0, Number(message.remainingMs) || 0);
		waitingForHost = false;
		selectedIds = [];
		renderBattle();
		adjudicateElimination();
	}

	endTurnButton.addEventListener('click', function () {
		if (!ownTurn()) return;
		endTurnButton.disabled = true;
		selectedIds = [];
		if (role === 'host') {
			authoritativeTurn('blue');
		} else {
			waitingForHost = true;
			send({ type: 'orders', side: 'red', orders: exportOrders('red') });
			document.getElementById('mp-command-hint').textContent = text('resolving');
			renderBattleHud();
		}
	});

	function adjudicateElimination() {
		if (!battleState || finished) return;
		var blue = aliveUnits('blue').length;
		var red = aliveUnits('red').length;
		if (blue > 0 && red > 0) return;
		if (role === 'host') finishMatch('elimination');
	}

	function healthRatio(side) {
		var all = battleState.units.filter(function (unit) { return unit.color === side; });
		var max = all.reduce(function (sum, unit) { return sum + unit.lpMax; }, 0) || 1;
		var current = all.reduce(function (sum, unit) { return sum + Math.max(0, unit.lp); }, 0);
		return current / max;
	}

	function buildResult(reason) {
		var blue = aliveUnits('blue').length;
		var red = aliveUnits('red').length;
		var winner = '';
		if (blue !== red) winner = blue > red ? 'blue' : 'red';
		else {
			var blueHealth = healthRatio('blue');
			var redHealth = healthRatio('red');
			if (Math.abs(blueHealth - redHealth) > 0.0001) winner = blueHealth > redHealth ? 'blue' : 'red';
		}
		return { winner: winner, reason: reason, blue: blue, red: red };
	}

	function finishMatch(reason) {
		if (role !== 'host' || finished) return;
		var result = buildResult(reason);
		send({ type: 'finish', result: result });
		showResult(result);
	}

	function showResult(result) {
		if (finished) return;
		finished = true;
		phase = 'finished';
		if (timerId) window.clearInterval(timerId);
		endTurnButton.disabled = true;
		var panel = document.getElementById('mp-result');
		var title = document.getElementById('mp-result-title');
		var copy = document.getElementById('mp-result-copy');
		panel.dataset.winner = result.winner || 'draw';
		title.textContent = text(result.winner ? (result.winner + 'Win') : 'draw');
		if (!result.winner) copy.textContent = text('resultDraw');
		else if (result.reason === 'elimination') copy.textContent = text('resultElimination', {
			winner: text(result.winner), blue: result.blue, red: result.red
		});
		else copy.textContent = text('resultTime', { blue: result.blue, red: result.red });
		panel.hidden = false;
	}

	function updateClock() {
		if (!battleState || phase !== 'battle' || finished) return;
		var remaining = Math.max(0, matchEndAt - Date.now());
		var totalSeconds = Math.ceil(remaining / 1000);
		var minutes = Math.floor(totalSeconds / 60);
		var seconds = totalSeconds % 60;
		document.getElementById('mp-clock').textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
		if (remaining > 0) return;
		endTurnButton.disabled = true;
		if (role === 'host') finishMatch('time');
		else {
			document.getElementById('mp-command-hint').textContent = text('timeoutWait');
			send({ type: 'timeout-request' });
		}
	}

	window.addEventListener('resize', function () { if (phase === 'battle') renderBattle(); });
	window.addEventListener('ui:languagechange', renderLanguage);
	window.addEventListener('beforeunload', function () {
		try { if (connection) connection.close(); } catch (e) { }
		try { if (rtcPeer) rtcPeer.close(); } catch (e) { }
	});

	if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
		window.addEventListener('load', function () {
			var offlineState = document.getElementById('mp-offline-state');
			navigator.serviceWorker.register('offline-sw.js', { scope: './' }).then(function () {
				return navigator.serviceWorker.ready;
			}).then(function () {
				offlineState.dataset.mpI18n = 'offlineReady';
				offlineState.textContent = text('offlineReady');
				offlineState.dataset.ready = 'true';
			}).catch(function () {
				offlineState.dataset.mpI18n = 'offlineUnavailable';
				offlineState.textContent = text('offlineUnavailable');
				offlineState.dataset.ready = 'false';
			});
		});
	} else {
		var offlineState = document.getElementById('mp-offline-state');
		offlineState.dataset.mpI18n = 'offlineUnavailable';
		offlineState.textContent = text('offlineUnavailable');
		offlineState.dataset.ready = 'false';
	}

	config = readForceInputs();
	renderLanguage();
	if (typeof initBgm === 'function') initBgm('multiplayer-music');
})();
