/* 敌方（红方）移动 AI（to-do #9）。
 *
 * 关卡在各自 gameN.js 的 CURRENT_GAME 上通过 ai 字段声明策略，例如：
 *   ai: { strategy: 'breakthrough', threat: 'nearest' }       // 集中突破
 *   ai: { strategy: 'cluster', core: 0 }                       // 聚团取暖（core=红方列表内的索引）
 *   ai: { strategy: 'circle', center: {x,y}, radius: R }       // 圆圈防守（center/radius 可省）
 *   （不配置 ai，或 strategy 为 'stationary'，就是红方站桩——第 1、2 关设计如此）
 *
 * 设计约束（与 AGENTS"敌方 AI 设计"一致）：
 *   - 每关 AI 固定、可复现，直接写策略，不用 ML/DL；
 *   - 策略表现为"每回合每个棋子的移动方向"：applyEnemyAI() 只在每次点 Next Turn、
 *     本回合 24 帧开始前调用一次，给每个存活红方重设 target，一回合内不再变；
 *   - 红方攻击仍走原有逻辑（进射程自动开火优先于移动），这里只管"往哪走"。
 *
 * 蓝方单位不会移动自己的 target（由玩家指挥），本文件只改 color=='red' 的单位。
 */

function aiDist(a, b) {
	const dx = a.posx - b.posx, dy = a.posy - b.posy;
	return Math.sqrt(dx * dx + dy * dy);
}

function aiAliveReds() { return armys.filter(u => u.color === 'red' && !u.disabled); }
function aiAliveBlues() { return armys.filter(u => u.color === 'blue' && !u.disabled); }

/* "威胁最大"的蓝方选择：nearest=距离最近 / strongest=攻击最高 / weakest=生命最低；并列时取更近者 */
function pickThreatBlue(red, blues, metric) {
	if (!blues.length) return null;
	let best = blues[0];
	blues.forEach(b => {
		let better = false;
		if (metric === 'strongest') better = b.atk > best.atk || (b.atk === best.atk && aiDist(red, b) < aiDist(red, best));
		else if (metric === 'weakest') better = b.lp < best.lp || (b.lp === best.lp && aiDist(red, b) < aiDist(red, best));
		else better = aiDist(red, b) < aiDist(red, best);   // 默认 nearest
		if (better) best = b;
	});
	return best;
}

/* 圆圈防守：把 k 个存活红方等分放到一个圆环上；每回合按存活顺序重新"填空" */
function ringSlot(index, count, center, radius, baseAngle) {
	const a = (baseAngle || 0) + (index / count) * Math.PI * 2;
	return { x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) };
}

/* 每回合开始：按当前关卡策略给每个存活红方设一次 target */
function applyEnemyAI() {
	if (typeof CURRENT_GAME === 'undefined' || !CURRENT_GAME || !CURRENT_GAME.ai) return;   // 未配置 => 站桩（1/2 关）
	const ai = CURRENT_GAME.ai;
	const strategy = ai.strategy || 'stationary';
	if (strategy === 'stationary') return;

	const reds = aiAliveReds();
	if (!reds.length) return;

	if (strategy === 'circle') {
		const center = ai.center || { x: (n - 1) / 2, y: (m - 1) / 2 };
		const radius = (ai.radius !== undefined) ? ai.radius : Math.min(n, m) / 2 - 1;
		reds.forEach((r, j) => {
			const slot = ringSlot(j, reds.length, center, radius, ai.baseAngle);
			r.targetx = slot.x;
			r.targety = slot.y;
		});
		return;
	}

	if (strategy === 'cluster') {
		const coreIdx = (ai.core !== undefined) ? Number(ai.core) : 0;
		const core = reds[coreIdx] || reds[0];
		reds.forEach(r => {
			if (r === core) {
				r.targetx = r.posx;   // 核心守位（进射程自动开火），其余向核心靠拢
				r.targety = r.posy;
			} else {
				r.targetx = core.posx;
				r.targety = core.posy;
			}
		});
		return;
	}

	// breakthrough（默认也按此处理）
	const blues = aiAliveBlues();
	if (!blues.length) return;
	const metric = ai.threat || 'nearest';
	reds.forEach(r => {
		const t = pickThreatBlue(r, blues, metric);
		if (t) { r.targetx = t.posx; r.targety = t.posy; }
	});
}
