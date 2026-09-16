/* 敌方（红方）移动 AI（to-do #9）。
 *
 * 关卡在各自 gameN.js 的 CURRENT_GAME 上通过 ai 字段声明策略，例如：
 *   ai: { strategy: 'breakthrough', threat: 'nearest' }       // 集中突破
 *   ai: { strategy: 'cluster', core: 0 }                       // 聚团取暖（core=红方列表内的索引）
 *   ai: { strategy: 'guarded_core', ringRadius: 1.65 }         // 核心存活时环阵，核心倒下后反扑
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

/* "交战状态"：射程内有活着的、可命中的蓝方（红方当前会优先开火） */
function aiIsEngaged(red) {
	const range = (typeof unitCombatRange === 'function') ? unitCombatRange(red) : red.atkrange;
	return armys.some(b => b.color === 'blue' && !b.disabled && aiDist(red, b) < range);
}

/* "威胁最大"的蓝方选择：nearest=距离最近 / strongest=攻击最高 / weakest=生命最低；并列时取更近者。
 * 特殊规则（to-do #14 后补充）：敌方骑兵优先把炮兵当目标——若场上还有存活炮兵，先在炮兵里选。 */
function pickThreatBlue(red, blues, metric, options) {
	if (!blues.length) return null;
	let pool = blues;
	if (red && red.cls === '骑' && (!options || options.cavalryPriority !== false)) {
		const guns = blues.filter(b => b.cls === '炮');
		if (guns.length) pool = guns;
	}
	let best = pool[0];
	pool.forEach(b => {
		let better = false;
		if (metric === 'strongest') better = b.atk > best.atk || (b.atk === best.atk && aiDist(red, b) < aiDist(red, best));
		else if (metric === 'weakest') better = b.lp < best.lp || (b.lp === best.lp && aiDist(red, b) < aiDist(red, best));
		else better = aiDist(red, b) < aiDist(red, best);   // 默认 nearest
		if (better) best = b;
	});
	return best;
}

/* 圆圈防守：把 k 个存活红方等分放到一个圆环上；每回合按存活顺序重新"填空"。
 * ⚠️ B03：center 是 {x,y} 契约，而 armys 里的军队对象字段是 posx/posy。
 * 以前这里直接传 core 军队对象，center.x/center.y 都是 undefined，
 * 算出的目标点是 NaN，护卫不会补位（Math.min/max 也修不好 NaN）。 */
function ringSlot(index, count, center, radius, baseAngle) {
	const cx = Number(center && center.x);
	const cy = Number(center && center.y);
	if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
	const safeCount = Math.max(1, Number(count) || 1);
	const safeRadius = Number.isFinite(Number(radius)) ? Number(radius) : 0;
	const a = (baseAngle || 0) + (index / safeCount) * Math.PI * 2;
	return { x: cx + safeRadius * Math.cos(a), y: cy + safeRadius * Math.sin(a) };
}

/* 每回合开始：按当前关卡策略给每个存活红方设一次 target。
 * ⚠️ B03 兜底：任何策略算完都要过一遍有限值检查。
 * 坐标契约写错（如把 {posx,posy} 当 {x,y}）时，NaN 会一路带进移动逻辑且不会报错，
 * 表现为"红方站着不动"，非常难查。这里统一把非法目标退回"原地守位"。 */
function applyEnemyAI() {
	applyEnemyAICore();
	if (typeof armys === 'undefined') return;
	armys.forEach(function (r) {
		if (r.color !== 'red' || r.disabled) return;
		if (!Number.isFinite(Number(r.targetx)) || !Number.isFinite(Number(r.targety))) {
			r.targetx = r.posx;
			r.targety = r.posy;
		}
	});
}

function applyEnemyAICore() {
	if (typeof CURRENT_GAME === 'undefined' || !CURRENT_GAME || !CURRENT_GAME.ai) return;   // 未配置 => 站桩（1/2 关）
	const ai = CURRENT_GAME.ai;
	const strategy = ai.strategy || 'stationary';
	if (strategy === 'stationary') return;

	let reds = aiAliveReds();
	if (!reds.length) return;

	/* 可选的开场整队窗口：用已消耗回合数判断，读档后也能自然续上。
	 * 第三关用 2 步缓冲，把“站桩教学 → 主动 AI”的难度台阶变平滑。 */
	const elapsedTurns = Math.max(0, (Number(CURRENT_GAME.turns_limit) || 0) - (Number(remain_turns) || 0));
	if (Number(ai.openingDelay) > elapsedTurns) {
		reds.forEach(r => { r.targetx = r.posx; r.targety = r.posy; });
		return;
	}

	/* 隐藏第七关的双阶段近卫阵：
	 * ① 核心存活：核心与炮位守住原地，未接战护卫补到环形空位；
	 * ② 核心倒下：阵型失去锚点，所有未接战残军改为追击生命最低的蓝方。
	 * formationRole 会随存档保存，旧存档则回退到红方初始索引，确保重读后逻辑一致。 */
	if (strategy === 'guarded_core') {
		const allReds = armys.filter(r => r.color === 'red');
		const taggedCore = allReds.find(r => r.formationRole === 'core');
		const fallbackIndex = (ai.core !== undefined) ? Number(ai.core) : 0;
		const core = taggedCore || allReds[fallbackIndex] || allReds[0];
		if (core && !core.disabled) {
			core.targetx = core.posx;
			core.targety = core.posy;
			const guards = reds.filter(r => r !== core && r.formationRole !== 'battery');
			const radius = Number(ai.ringRadius) || 1.65;
			guards.forEach((r, index) => {
				if (aiIsEngaged(r)) {
					r.targetx = r.posx;
					r.targety = r.posy;
					return;
				}
				const slot = ringSlot(index, Math.max(guards.length, 1), { x: core.posx, y: core.posy }, radius, -Math.PI / 2);
				if (!slot) { r.targetx = r.posx; r.targety = r.posy; return; }
				r.targetx = Math.max(0.35, Math.min(n - 0.35, slot.x));
				r.targety = Math.max(0.35, Math.min(m - 0.35, slot.y));
			});
			reds.filter(r => r.formationRole === 'battery').forEach(r => {
				r.targetx = r.posx;
				r.targety = r.posy;
			});
			return;
		}

		const blues = aiAliveBlues();
		if (!blues.length) return;
		reds.forEach(r => {
			if (aiIsEngaged(r)) {
				r.targetx = r.posx;
				r.targety = r.posy;
				return;
			}
			const target = pickThreatBlue(r, blues, ai.collapseThreat || 'weakest', ai);
			if (target) { r.targetx = target.posx; r.targety = target.posy; }
		});
		return;
	}

	// 已交战（射程内有蓝方）的红方：原地固守不移动；其余红方照常执行策略
	const engagedReds = reds.filter(r => aiIsEngaged(r));
	engagedReds.forEach(r => {
		r.targetx = r.posx;
		r.targety = r.posy;
	});
	reds = reds.filter(r => !aiIsEngaged(r));
	if (!reds.length) return;

	if (strategy === 'flee') {
		// 撤退型（第 4 关追逐战）：全体朝 fleeTo（通常设为右上角顶点）直线撤离，
		// 到达顶点后由 main.js 的逐帧逃脱检测当场判定撤退，不会越出棋盘
		if (!ai.fleeTo) return;
		reds.forEach(r => {
			r.targetx = ai.fleeTo.x;
			r.targety = ai.fleeTo.y;
		});
		return;
	}

	if (strategy === 'circle') {
		const center = ai.center || { x: (n - 1) / 2, y: (m - 1) / 2 };
		const radius = (ai.radius !== undefined) ? ai.radius : Math.min(n, m) / 2 - 1;
		reds.forEach((r, j) => {
			const slot = ringSlot(j, reds.length, { x: Number(center.x), y: Number(center.y) }, radius, ai.baseAngle);
			if (!slot) { r.targetx = r.posx; r.targety = r.posy; return; }
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
		const t = pickThreatBlue(r, blues, metric, ai);
		if (t) { r.targetx = t.posx; r.targety = t.posy; }
	});
}
