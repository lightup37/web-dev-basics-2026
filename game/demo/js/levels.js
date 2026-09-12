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
 *  · map {lon,lat}：主界面「战役地图」上这一关旗标的位置（真实经纬度）。2026-09 新增，
 *    由 js/menu-saves.js 按同一投影换算成百分比；第 1/2、3/4 关因原地点几乎重合而做了
 *    地图上的手动偏移（D-2，见各自注释），第 7 关无真实地点、象征性落在巴黎。
 */

var LEVELS_ORDER = [
	{
		id: 1, file: 'game1.html', name: '第 1 关 · 破晓防线', ai: null,
		chapter: '第一幕 · 鹰旗初升', location: '土伦港 · 1793', scene: 'dawn',
		map: { lon: 5.93, lat: 43.12 },   /* 地图旗标：土伦港（经纬度；投影见 img/europe-map.svg 与 menu-saves.js 的 MAP） */
		hint: '失去指挥的敌军不会进行机动与增援，形成局部优势逐一歼灭。消灭所有敌军，取得战役胜利！',
		story: [
			{ who: '拿破仑', role: '炮兵少校', side: 'left', portrait: 'img/portraits/napoleon.png', text: '穆尔格雷夫堡已经出现在望远镜里了，控制穆尔格雷夫堡可以让我们的炮兵进入攻击阵地，从而绕过土伦北方的众多堡垒封锁土伦港。' },
			{ who: '让・安多歇・朱诺', role: '掷弹兵上士', side: 'right', portrait: 'img/portraits/courier.png', text: '情报显示，穆尔格雷夫堡只有一些步兵驻守，他们失去了指挥，只能死守。' },
			{ who: '拿破仑', role: '炮兵少校', side: 'left', portrait: 'img/portraits/napoleon.png', text: '很好，让我们的步兵从两翼靠近将他们包围，逐步歼灭。' }
		]
	},
	{
		id: 2, file: 'game2.html', name: '第 2 关 · 炮火走廊', ai: null,
		chapter: '第二幕 · 雷霆之声', location: '土伦港 · 1793', scene: 'battery',
		map: { lon: 1.44, lat: 43.60 },   /* 剧情同为土伦，但地图上手动西移约 4.5°（D-2：否则与第 1 关旗标重叠） */
		hint: '敌军有固定火炮，注意谨慎进入其射程。',
		story: [
			{ who: '拿破仑', role: '炮兵少校', side: 'left', portrait: 'img/portraits/napoleon.png', text: '穆尔格雷夫堡已经被我们拿下，炮兵已经进入战场，继续攻击，占领埃吉莱特堡，我们就能完成对港口的封锁。' },
			{ who: '让・安多歇・朱诺', role: '掷弹兵上士', side: 'right', portrait: 'img/portraits/courier.png', text: '我们的观察员报告，要塞内有一门固定火炮，和一些死守的步兵。' },
			{ who: '拿破仑', role: '炮兵少校', side: 'left', portrait: 'img/portraits/napoleon.png', text: '尽管我们的军队还未来得及完全靠近，但兵贵神速，即便是只有现在的小股部队，利用炮兵的火力支援仍然可以快速占领要塞。' }
		]
	},
	{
		id: 3, file: 'game3.html', name: '第 3 关 · 雪原突骑', ai: { strategy: 'breakthrough' },
		chapter: '第三幕 · 风雪疾驰', location: '耶拿 · 1806', scene: 'snow',
		map: { lon: 11.59, lat: 50.93 },   /* 地图旗标：耶拿 */
		hint: '敌军每回合都会扑向离自己最近的单位，注意保持阵型。',
		story: [
			{ who: '萨瓦里', role: '副官', side: 'right', portrait: 'img/portraits/adjutant.png', text: '普鲁士人已经按耐不住向我们发动冲击了，他们的攻击目标应该是威胁最大的骑兵和炮兵。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '内伊的部队冲的太快，和主力的线列步兵脱节，他怎么没向我提前请示！？' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '应该还来得及，传令让周围的部队快速汇合集结！' }
		]
	},
	{
		/* 玩法取自 A：红方 flee 撤往右上角，到达边界即"成功撤退"（game4.js 的
		 * objective.type='retreat'）；逃脱 ≥3 判负。B 的剧情描述的是抱团方阵，
		 * 与这套玩法不符，故按 A 的设计重写。 */
		id: 4, file: 'game4.html', name: '第 4 关 · 耶拿逐猎', ai: { strategy: 'flee', fleeTo: { x: 9.5, y: -0.5 } },
		chapter: '第四幕 · 穷途逐北', location: '奥尔施塔特 · 1806', scene: 'river',
		map: { lon: 13.40, lat: 52.52 },   /* 奥尔施塔特离耶拿仅 20km，地图上手动东北移向柏林（D-2：否则与第 3 关重叠） */
		hint: '敌军要逃往右上角——只有到达右上角才算出界撤退。利用骑兵抢先绕前堵截，别让敌人得逞。',
		story: [
			{ who: '联军司令', role: '联军战地指挥部', side: 'right', portrait: 'img/portraits/coalition-commander.png', text: '不必恋战。全军向东北方撤退——只要越过那道边界，法国人就再也追不上我们。' },
			{ who: '萨瓦里', role: '副官', side: 'right', portrait: 'img/portraits/adjutant.png', text: '我们所对的普鲁士人正在撤退，达武元帅送来了报告，他的第三军已经击溃了普鲁士人的主力。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '这不可能，这个近视眼怕不是把战报写错了。' },
			{ who: '萨瓦里', role: '副官', side: 'right', portrait: 'img/portraits/adjutant.png', text: '我们的侦察兵报告，普鲁士的主力确实已经被击溃了，两股溃兵汇合，他们现在已经毫无斗志，只想着快速逃命。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '不能让他们逃走，大好机会，准备追击！' }
		]
	},
	{
		/* 2026-09：本关"战斗 + 叙事"整体取自原第 6 关，与第 6 关对调（D-1：叙事随战斗走）。
		 * 红方 8 人站桩固守右侧高地（ai:null），时限 18 回合。
		 * 星级由 main.js 的 checkWinState() 里 CURRENT_LEVEL_ID === 5 分支计算：
		 * 按通关所用步数 ≤13=3星 / ≤15=2星 / ≤18=1星。 */
		id: 5, file: 'game5.html', name: '第 5 关 · 艰难攻坚', ai: null,
		chapter: '第五幕 · 漫长东征', location: '斯摩棱斯克以西 · 1812', scene: 'embers',
		map: { lon: 31.00, lat: 54.60 },   /* 地图旗标：斯摩棱斯克以西（全图最东） */
		hint: '这是一场攻坚战——敌守军占据城市、原地固守。同时对城市进行破坏，力求速战速决。要快速全歼守军，就必须顶着火力压上去集火。',
		story: [
			{ who: '加斯帕尔・古尔戈', role: '副官', side: 'left', portrait: 'img/portraits/adjutant.png', text: '巴克莱的军队似乎不打算和我们就斯摩棱斯克进行决战，他让一部分部队死守在城市之中，有固定炮兵提供火力支援。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '既然决定放弃城市，为什么还要留下部队？一定有些蹊跷。' },
			{ who: '传令兵', role: '近卫骑兵通讯队', side: 'right', portrait: 'img/portraits/courier.png', text: '殿下！俄国人在城市内执行焦土策略！他们打算摧毁这座城市！' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '不好，斯摩棱斯克本应作为向莫斯科前进的补给中心，传令！在俄国人毁灭这座城市前拿下它！' }
		]
	},
	{
		/* 2026-09：本关"战斗 + 叙事"整体取自原第 5 关，与第 5 关对调（D-1：叙事随战斗走）。
		 * 敌方专挑攻击力最高的蓝方集火（breakthrough + threat:strongest）。 */
		id: 6, file: 'game6.html', name: '第 6 关 · 铁血强攻', ai: { strategy: 'breakthrough', threat: 'strongest' },
		chapter: '第六幕 · 雨云之下', location: '滑铁卢附近 · 1816', scene: 'storm',
		map: { lon: 4.40, lat: 50.72 },   /* 地图旗标：滑铁卢 */
		hint: '敌军会优先集火攻击你的炮兵和骑兵，用掷弹兵和步兵掩护他们。',
		story: [
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '我们需要在普鲁士人和英国人汇合之前击败布吕歇尔率领的普鲁士部队。如果他们双方汇合，我们的兵力会极为劣势。' },
			{ who: '加斯帕尔・古尔戈', role: '副官', side: 'right', portrait: 'img/portraits/adjutant.png', text: '敌人也急于进攻打击我方力量，应该会尝试主动出击攻击我们的炮兵与骑兵。' },
			{ who: '拿破仑', role: '法兰西皇帝', side: 'left', portrait: 'img/portraits/napoleon.png', text: '这不成问题，我们的掷弹兵和线列步兵会掩护他们的。内伊此刻正在四臂村与威灵顿战斗，我希望他能取胜。当务之急还是先摧毁眼前的普鲁士人。' }
		]
	}
];

function getLevelList() { return LEVELS_ORDER; }

/* 隐藏关卡（to-do #14/#19）：不进主菜单的常规列表。是否开启只看 save.js 的
 * hiddenRouteOpen()（第 1~6 关全部 3 星）——为真时主界面战役地图上才长出它的标记，
 * 点那个标记进入本关；game7 通关后进入隐藏结局页（hidden-end.html）。 */
var HIDDEN_LEVEL = {
	id: 7,
	file: 'game7.html',
	name: '第 7 关 · 帝国黄昏（隐藏）',
	ai: { strategy: 'cluster', core: 0 },
	chapter: '终幕 · 未写之史', location: '另一条时间线 · 1815', scene: 'twilight',
	map: { lon: 2.35, lat: 48.85 },   /* 隐藏关无真实地点，象征性落在巴黎（帝国的中心） */
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
