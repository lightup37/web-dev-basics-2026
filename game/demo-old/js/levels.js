/* 关卡注册表（to-do #10）。
 * 只放"跨关卡"的设计信息：顺序、页面文件、标题、敌方 AI 策略等。
 * 每关的棋盘/回合/棋子配置仍保留在各自 gameN.js（方便不同人分别维护自己的关）。
 * ai 为 null / 缺省 => 站桩（第 1、2 关设计如此）。
 *
 * ── 合并说明（demo-游戏内容多 A ⊗ demo-美化好 B）──────────────────────────
 *  · ai / hint / name（第 4、6 关）：以 A 为准，保证提示与玩法一致。
 *  · chapter / location / scene / story（role/side/portrait）：取自 B 的美化层。
 *  · story：B 的立绘版；但第 6 关用 A 的剧情（B 的剧情描述的是 B 的另一套
 *    第 6 关设计），第 4 关 A 原本没有剧情、B 的剧情对应的是"血肉方阵"，
 *    与 A 的"逐猎"不符，故按 A 的玩法重写。
 *  · scene 可选值（有专属主题的）：snow / battery / embers / river / storm /
 *    twilight；其余值（如 dawn）走通用外观。
 */

var LEVELS_ORDER = [
	{
		id: 1, file: 'game1.html', name: '第 1 关 · 破晓防线', ai: null,
		chapter: '第一幕 · 鹰旗初升', location: '乌尔姆近郊 · 1805', scene: 'dawn',
		hint: '指令：选中你的步兵，点一处空地即下达移动目标，命令会一直执行到抵达为止。情报：中路守军据说从不后撤——有人嘲笑说，防御？那不过是站在原地永不挪窝罢了！',
		story: [
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '看见山脊上的火光了吗？敌军以为守住中央，就能拦住整支大军。' },
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '他们已经下令死守，陛下。一步也不准备后退。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '不肯移动的防线，只是一扇等着被推开的门。让步兵从两翼靠近，今天由我们写下第一行战报。' }
		]
	},
	{
		id: 2, file: 'game2.html', name: '第 2 关 · 炮火走廊', ai: null,
		chapter: '第二幕 · 雷霆之声', location: '耶拿前线 · 1806', scene: 'battery',
		hint: '指令：炮兵射程远、伤害高但走得慢——保住它，它就是破局点。情报：敌军右翼有一门不会移动的远程炮，别让步兵冲进它四格的射程白挨打。',
		story: [
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '陛下，雨后的道路陷住了弹药车。我们的炮兵还没来得及展开，敌军已经逼近。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '一门摆正位置的火炮，胜过一整排仓促冲锋的步兵。' },
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '那么步兵的任务，是替炮兵争取时间？' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '正是。守住雷霆，雷霆自然会替我们打开道路。' }
		]
	},
	{
		id: 3, file: 'game3.html', name: '第 3 关 · 雪原突骑', ai: { strategy: 'breakthrough' },
		chapter: '第三幕 · 风雪疾驰', location: '东普鲁士 · 1807', scene: 'snow',
		hint: '指令：骑兵（骑）速度飞快、攻击最高，但别让它正面陷入包围。情报：敌军每回合都会扑向离自己最近的蓝方单位——落单的部队会被围殴，保持阵型逐个击破。另有线报：敌军的骑兵似乎对炮兵格外眼红——别让你的大炮落单。',
		story: [
			{ who: '传令兵', role: '近卫骑兵通讯队', side: 'right', portrait: 'img/portraits/courier.png', text: '陛下！风雪遮住了敌军的旗号，但他们的右翼正在重新集结。缺口只会维持片刻。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '片刻已经足够。骑兵需要的从来不是一条大道，只是一道缝隙。' },
			{ who: '传令兵', role: '近卫骑兵通讯队', side: 'right', portrait: 'img/portraits/courier.png', text: '我这就把命令送到前线。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '告诉他们：冲进去，但不要停在那里。速度既是长矛，也是盾牌。' }
		]
	},
	{
		/* 玩法取自 A：红方 flee 撤往右上角，到达边界即"成功撤退"（game4.js 的
		 * objective.type='retreat'）；逃脱 ≥3 判负。B 的剧情描述的是抱团方阵，
		 * 与这套玩法不符，故按 A 的设计重写。 */
		id: 4, file: 'game4.html', name: '第 4 关 · 逐猎（Retreat Hunt）', ai: { strategy: 'flee', fleeTo: { x: 9.5, y: -0.5 } },
		chapter: '第四幕 · 穷途逐北', location: '多瑙河畔 · 1809', scene: 'river',
		hint: '目标：敌军要逃往右上角——只有到达右上角才算出界撤退。全歼=3星；放走1支=2星；放走2支=1星；放走3支以上则失败。我方分据左上、右下两翼——骑兵抢先绕前堵截，别让任何一支摸到那个角落。',
		story: [
			{ who: '联军司令', role: '联军战地指挥部', side: 'right', portrait: 'img/portraits/coalition-commander.png', text: '不必恋战。全军向东北方撤退——只要越过那道边界，法国人就再也追不上我们。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '他们想跑。逃跑的军队不会再回头，但也正因如此，他们会跑得比谁都快。' },
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '敌军正朝右上角收缩。若让他们越过边界，这一仗就等于没打。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '那就抢在他们前面。骑兵绕前堵住那个角落，其余逐个截住——放走三支，我们就输了。' }
		]
	},
	{
		id: 5, file: 'game5.html', name: '第 5 关 · 铁血强攻', ai: { strategy: 'breakthrough', threat: 'strongest' },
		chapter: '第五幕 · 漫长东征', location: '斯摩棱斯克以西 · 1812', scene: 'embers',
		hint: '指令：本关兵种齐全，注意保护高攻单位。情报：敌军会优先集火攻击力最高的蓝方——你的炮兵和骑兵是头号目标，用掷弹兵和步兵给它们当盾。',
		story: [
			{ who: '传令兵', role: '近卫骑兵通讯队', side: 'right', portrait: 'img/portraits/courier.png', text: '陛下，敌军没有扑向中央。他们在追逐我们的骑兵和炮兵，像是早已看穿了火力部署。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '他们看见了最锋利的剑，却忘了剑也有护手。' },
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '我会命令步兵收拢，在高攻部队前建立屏障。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '很好。让他们为每一步接近付出代价，然后用我们保存下来的火力结束战斗。' }
		]
	},
	{
		/* 玩法取自 A：红方 8 人站桩固守右侧高地（ai:null），时限 18 回合。
		 * 星级由 main.js 的 checkWinState() 里 CURRENT_LEVEL_ID === 6 分支计算：
		 * 按通关所用步数 ≤13=3星 / ≤15=2星 / ≤18=1星。 */
		id: 6, file: 'game6.html', name: '第 6 关 · The Last Assault（滑铁卢·限时攻坚）', ai: null,
		chapter: '第六幕 · 雨云之下', location: '滑铁卢南方 · 1815', scene: 'storm',
		hint: '指令：这是最后一场攻坚战——敌守军 8 人占据右侧高地、原地固守不追不逃。时限 18 回合：回合耗尽即判负。情报：要按时全歼守军，就必须顶着火力压上去集火——但冲得越猛、伤亡越大。星级按通关所用步数算（≤13 回合=3星；≤15 回合=2星；≤18 回合=1星）；想满星就先把殿后的大炮拔掉，别让高伤单位白白送命。',
		story: [
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '天亮之前，必须拿下那座高地。对面的守军一步也不会退。' },
			{ who: '副官', role: '帝国参谋部', side: 'right', portrait: 'img/portraits/adjutant.png', text: '陛下，十八个回合——够我们把大炮推上前线吗？' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '够不够，天亮前自有分晓。传令：全线压上，先敲掉他们殿后的炮，再收拾残兵。' }
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
	chapter: '终幕 · 未写之史', location: '另一条时间线 · 1815', scene: 'twilight',
	hint: '你踏进了被历史抹去的一页……情报：帝国的旧卫队仍然抱成一团，只有撕开他们的核心，才能改写终局。',
	story: [
		{ who: '传令兵', role: '近卫骑兵通讯队', side: 'right', portrait: 'img/portraits/courier.png', text: '陛下……地图上的道路变了。我们越过了史书最后标出的界线，却又看见了滑铁卢。' },
		{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '历史只是胜利者装订成册的战报。既然来到空白的一页，我们就亲自落笔。' },
		{ who: '联军司令', role: '最后的联军防线', side: 'right', portrait: 'img/portraits/coalition-commander.png', text: '旧卫队会守住核心。无论你从哪一页归来，这里都将是帝国的终点。' },
		{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '终点？不。今天，我们只把它称作黄昏——因为黄昏之后，仍可能有新的黎明。' }
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
