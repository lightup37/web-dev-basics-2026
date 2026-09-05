/* 关卡注册表（to-do #10）。
 * 只放"跨关卡"的设计信息：顺序、页面文件、标题、敌方 AI 策略等。
 * 每关的棋盘/回合/棋子配置仍保留在各自 gameN.js（方便不同人分别维护自己的关）。
 * ai 为 null / 缺省 => 站桩（第 1、2 关设计如此）。
 */

var LEVELS_ORDER = [
	{
		id: 1, file: 'game1.html', name: '第 1 关 · Break through the defense', ai: null,
		hint: '指令：选中你的步兵，点一处空地即下达移动目标，命令会一直执行到抵达为止。情报：中路守军据说从不后撤——有人嘲笑说，防御？那不过是站在原地永不挪窝罢了！',
		story: [
			{ who: '拿破仑', text: '先生们，这就是我们的第一仗。敌军盘踞在棋盘中央，据说只会原地固守。' },
			{ who: '副官', text: '他们号称"绝不后退"，陛下。' },
			{ who: '拿破仑', text: '哈——那就让他们站在原地，等着被我们一个一个敲掉。' }
		]
	},
	{
		id: 2, file: 'game2.html', name: '第 2 关 · Protect the artillery', ai: null,
		hint: '指令：炮兵射程远、伤害高但走得慢——保住它，它就是破局点。情报：敌军右翼有一门不会移动的远程炮，别让步兵冲进它四格的射程白挨打。'
	},
	{
		id: 3, file: 'game3.html', name: '第 3 关 · Cavalry Raid（骑兵突袭）', ai: { strategy: 'breakthrough' },
		hint: '指令：骑兵（骑）速度飞快、攻击最高，但别让它正面陷入包围。情报：敌军每回合都会扑向离自己最近的蓝方单位——落单的部队会被围殴，保持阵型逐个击破。'
	},
	{
		id: 4, file: 'game4.html', name: '第 4 关 · Iron Square（血肉方阵）', ai: { strategy: 'cluster', core: 0 },
		hint: '指令：掷弹兵（掷）血厚适合当前排，散兵（散）射程 1 格能放风筝。情报：敌军总挤在中央那名掷弹兵身边抱团取暖——趁他们堆成一团，用远程单位在外围点名。'
	},
	{
		id: 5, file: 'game5.html', name: '第 5 关 · Onslaught（铁血强攻）', ai: { strategy: 'breakthrough', threat: 'strongest' },
		hint: '指令：本关兵种齐全，注意保护高攻单位。情报：敌军会优先集火攻击力最高的蓝方——你的炮兵和骑兵是头号目标，用掷弹兵和步兵给它们当盾。'
	},
	{
		id: 6, file: 'game6.html', name: '第 6 关 · Eve of Waterloo（决战前夜）', ai: { strategy: 'breakthrough', threat: 'weakest' },
		hint: '指令：最后一战，把每一步都算好。情报：敌军专挑最虚弱的蓝方单位下口——残血的部队别硬撑，撤到阵型后面让满血的顶上去。',
		story: [
			{ who: '拿破仑', text: '决战前夜，先生们。对面的指挥官似乎偏爱猎杀伤员。' },
			{ who: '副官', text: '那我们就让伤兵撤到后排，用最硬的胸膛迎上去。' },
			{ who: '拿破仑', text: '说得对。天亮之前，把每一个命令都算清楚。' }
		]
	}
];

function getLevelList() { return LEVELS_ORDER; }

/* 隐藏关卡（to-do #14）：不进主菜单的常规列表；game1 在 12 回合内通关后开启，
 * game6 通关后 Next Game 进入它，game7 通关后进入隐藏结局页。 */
var HIDDEN_LEVEL = {
	id: 7,
	file: 'game7.html',
	name: '第 7 关 · 帝国黄昏（隐藏）',
	ai: { strategy: 'cluster', core: 0 },
	hint: '你踏进了被历史抹去的一页……情报：帝国的旧卫队仍然抱成一团，只有撕开他们的核心，才能改写终局。',
	story: [
		{ who: '传令兵', text: '陛下！我们绕过了史书的页码，来到另一条时间线的滑铁卢。' },
		{ who: '拿破仑', text: '……很好。那就让帝国，再赢一次。' }
	]
};
function getHiddenLevel() { return HIDDEN_LEVEL; }

function getLevelById(id) {
	const all = LEVELS_ORDER.concat([HIDDEN_LEVEL]);
	return all.find(l => Number(l.id) === Number(id)) || null;
}

function getLevelIndex(id) {
	return LEVELS_ORDER.findIndex(l => Number(l.id) === Number(id));
}

/* Next Game 的目标：注册表里下一关；已到最后一关则进 end-game.html */
function nextLevelFile(id) {
	const i = getLevelIndex(id);
	if (i < 0) return './end-game.html';
	const nxt = LEVELS_ORDER[i + 1];
	return nxt ? nxt.file : './end-game.html';
}

/* 把某关在注册表里的 AI 策略挂到 CURRENT_GAME.ai（无则置 null = 站桩） */
function attachLevelAI(id) {
	if (typeof CURRENT_GAME === 'undefined' || !CURRENT_GAME) return;
	const meta = getLevelById(id);
	CURRENT_GAME.ai = (meta && meta.ai) ? meta.ai : null;
}
