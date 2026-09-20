/* 全站界面层：三语切换、夜览模式、密码可见按钮与轻量提示。
 *
 * 页面中的固定文字使用 data-i18n="键名"；JS 动态文字使用 uiT('键名')。
* 剧情等内容可使用 uiLocalize(value)，value 既可以是普通中文字符串，也可以是
* { 'zh-CN': '...', 'zh-TW': '...', en: '...' } 这样的三语对象。
 */
/* UI 提示组件（2026-09）
 *
 * 目的：把玩家流程里的原生 alert() / confirm() 换成项目内、可样式化的提示，
 *       原生弹窗会阻塞页面 JS 且样式不可控。
 *
 * 提供四个全局函数：
 *   toast(msg)                     底部轻提示（保存成功、已载入、读档继续…）
 *   achievementToast(title, desc)   右上角浮动提示（成就解锁 / 隐藏路线开启），可堆叠、点击可关
 *   modalConfirm(msg, onOk)        卡片式确认弹窗（取消 / 确定），只有点"确定"才执行 onOk
 *   modalNotice(msg, onClose)      卡片式通知弹窗（仅"确定"）
 *
 * 依赖：css/style.css 末尾的 .ui-* 样式。DOM 不可用时自动退回原生弹窗，不会静默失败。
 */
(function () {
	'use strict';

	var LANGUAGE_KEY = 'napoleon-language';
	var THEME_KEY = 'napoleon-theme';
	var SUPPORTED_LANGUAGES = ['zh-CN', 'zh-TW', 'en'];
	var currentLanguage = readSetting(LANGUAGE_KEY, 'zh-CN');
	var currentTheme = readSetting(THEME_KEY, 'light');
	if (SUPPORTED_LANGUAGES.indexOf(currentLanguage) === -1) currentLanguage = 'zh-CN';
	if (currentTheme !== 'dark') currentTheme = 'light';

	var MESSAGES = {
		'zh-CN': {
			'ui.language': '语言',
			'ui.darkMode': '开启夜览模式',
			'ui.lightMode': '关闭夜览模式',
			'ui.soundOff': '关闭声音',
			'ui.soundOn': '开启声音',
			'ui.showPassword': '显示密码',
			'ui.hidePassword': '隐藏密码',
			'ui.close': '关闭',
			'site.title': '拿破仑战争',
			'site.subtitle': '回合制策略小游戏 · 消灭红方军队，改写历史',
			'auth.loginTitle': '登录',
			'auth.loginButton': '登 录',
			'auth.registerTitle': '注册新账号',
			'auth.registerButton': '注 册',
			'auth.username': '用户名',
			'auth.password': '密码',
			'auth.confirmPassword': '确认密码',
			'auth.usernamePlaceholder': '请输入用户名',
			'auth.passwordPlaceholder': '请输入密码',
			'auth.confirmPlaceholder': '再输一遍密码',
			'auth.noAccount': '还没有账号？',
			'auth.toRegister': '去注册',
			'auth.hasAccount': '已有账号？',
			'auth.backLogin': '返回登录',
			'auth.group': '查看小组介绍',
			'auth.localWarning': '账号只保存在本地浏览器（localStorage），换浏览器或清除缓存会丢失',
			'auth.empty': '用户名和密码都不能为空',
			'auth.mismatch': '两次输入的密码不一致',
			'auth.exists': '该用户名已被注册，请换一个',
			'auth.notFound': '用户不存在，请先注册',
			'auth.wrongPassword': '密码错误',
			'kicker.register': 'ENLISTMENT RECORD · 帝国征募处',
			'kicker.menu': 'IMPERIAL HEADQUARTERS · 帝国统帅部',
			'kicker.group': 'THE DEVELOPMENT STAFF · 项目参谋部',
			'kicker.standardEnding': 'CAMPAIGN CONCLUDED · 战役终章',
			'kicker.failEnding': 'A HISTORY UNMADE · 未竟之史',
			'kicker.destinyEnding': 'FATE REASSERTED · 命运归位',
				'kicker.empireEnding': 'THE UNWRITTEN EMPIRE · 未写帝国',
				'mode.pageTitle': '选择作战模式 - 拿破仑战争',
				'mode.kicker': 'THEATER OF WAR · 作战方式',
				'mode.title': '选择作战模式',
				'mode.welcome': '指挥官 ',
				'mode.choose': '，请选择今日的战场。',
				'mode.campaignEyebrow': '1793—1815 · 历史战役',
				'mode.campaignTitle': '通关模式',
				'mode.campaignCopy': '沿拿破仑的战役年表推进，观看电影式剧情、积累星级并挑战隐藏的滑铁卢终幕。',
				'mode.campaignCta': '展开帝国战图 →',
				'mode.onlineEyebrow': 'RED VS BLUE · 实时对抗',
				'mode.onlineTitle': '联机模式',
				'mode.onlineCopy': '创建或加入房间，自定义公平编制，以掷骰决定先手，在限时内轮流下达整军命令。',
				'mode.onlineCta': '进入联机军帐 →',
				'menu.title': '游戏主界面',
			'menu.welcome': '欢迎回来，',
			'menu.welcomeEnd': '！',
			'menu.mapTheater': 'EUROPEAN THEATER · 欧洲战区',
			'menu.mapSignal': '战役网络在线',
			'menu.mapHint': '选择战役节点 · 推进帝国战线',
			'transition.kicker': '序章 · 风暴将至',
			'transition.handoff': 'IMPERIAL STAFF MAP · 帝国参谋地图',
			'transition.line1': '1805年，旧秩序的王冠仍压在欧洲大陆之上。',
			'transition.line2': '联盟在边境集结，而法兰西的鹰旗已经越过莱茵河。',
			'transition.line3': '从这一刻起，你的每一道命令，都可能改写历史。',
			'transition.enter': '正在展开欧洲战役地图……',
			'transition.skip': '立即进入地图',
			'menu.autoHeading': '活动存档 · 自动存档 a.save（进度与进行中的关卡）',
			'menu.manualHeading': '手动备份（存档 1/2/3）——“载入”会用该档覆盖 a.save',
				'menu.mode': '模式选择',
				'menu.group': '小组介绍',
			'menu.logout': '退出登录',
			'menu.restart': '重新开始游戏',
			'menu.restartTitle': '清空活动存档 a.save，从头开始',
			'menu.note': '通关自动存入 a.save；关卡内“保存”可写入 a.save 或备份到存档 1～3；“读取”会把所选存档覆盖回 a.save。',
			'menu.cleared': '未通关',
			'menu.progress': '已通关 {count} 关',
			'menu.current': '，当前进行到第 {level} 关',
			'menu.playing': '进行中 · 剩余 {turns} 回合',
			'menu.continue': '继续',
			'menu.start': '开始',
			'menu.locked': '未解锁',
			'menu.revealAfter6': '通关第 6 关后揭晓',
			'menu.needLevel6': '🔒 需先通关第 6 关',
			'menu.levelProgress': '第 {level} 关进行中 · 剩余 {turns} 回合',
			'menu.empty': '（空）',
			'save.auto': '自动存档 (a.save)',
			'save.slot': '存档 {id}',
			'save.empty': '（空）',
			'save.sameLevel': '（第 {level} 关，剩 {turns} 回合）',
			'save.otherLevel': '（第 {level} 关 · 非本关，不可读）',
			'menu.load': '载入',
			'menu.delete': '删除',
			'menu.achievements': '成就（{done}/{total}）',
			'menu.achieved': '✓ 已达成',
			'menu.notAchieved': '🔒 未解锁',
			'menu.loadConfirm': '载入 {file} 会用它的内容覆盖当前自动存档 a.save，继续？',
			'menu.loaded': '已载入 {file} 到 a.save',
			'menu.deleteConfirm': '删除 {file}？',
			'menu.restartConfirm': '重新开始将清空活动存档 a.save（通关进度、星级和进行中快照），且不可恢复；手动备份存档 1～3 会保留。确定继续？',
			'menu.restarted': '已重新开始：a.save 已清空',
			'game.nextTurn': '下一步',
			'game.undo': '回退 {left}/3',
			'game.undoTitle': '回退到上一步（本关最多使用 3 次）',
			'game.undoEmpty': '当前没有可以回退的步骤。',
			'game.undoDone': '已回退一步，本关还可回退 {left} 次。',
			'game.noMovement': '本回合没有任何部队机动。请先下达移动命令，或确认双方已经进入交火。',
			'game.difficulty': '威胁 {level}/7',
			'game.enemyRemain': '敌军 {count}',
				'game.momentum': '战意 {level}/3 · +{bonus}%',
				'game.threatHelp': '威胁表示本关敌军强度与机制复杂度，数值越高，敌军编制、主动策略或时间压力越强。',
				'game.momentumHelp': '战意来自连续歼敌。每级让蓝方下一步攻击提高 8%，最高 3 级；一轮未歼敌会下降 1 级。',
				'game.allyRoster': '我方序列',
				'game.enemyRoster': '敌方序列',
			'game.momentumGain': '歼敌 {kills} 支，战意升至 {level}/3：下一步我军攻击 +{bonus}%。',
			'game.briefingDifficulty': '威胁等级 {level}/7 · {mechanic}\n{hint}',
			'game.strategyUnlocked': '参谋部复盘 · 连续失败 {count} 次',
			'game.strategyLead': '建议下一次按这个顺序调整：',
			'game.nextGame': '下一关',
			'game.replay': '重玩本关',
			'game.save': '保存',
			'game.load': '读取',
			'game.menu': '主界面',
			'game.viewEnemy': '查看敌人',
			'game.backCommand': '返回指挥',
			'game.win': '胜利',
			'game.lose': '战败',
			'game.endingEarly': '查看结局：提早失利',
			'game.endingDestiny': '查看结局：命运无法改变',
			'game.saveTitle': '把当前关卡的中途状态存进所选存档',
			'game.loadTitle': '读取所选存档的中途状态（覆盖当前进度）',
			'game.modeTitle': '切换为查看敌方剩余生命；再按一次返回指挥',
			'game.menuTitle': '返回游戏主界面',
			'game.loginToSave': '尚未登录：请先回主界面登录，再保存游戏',
			'game.notLoggedIn': '尚未登录',
			'game.savedTo': '已保存到 {file}',
			'game.overwriteConfirm': '覆盖 {file} 里的中途存档（第 {level} 关）？',
			'game.noSnapshot': '{file} 里没有中途存档',
			'game.otherLevelSave': '该存档属于第 {saved} 关，当前是第 {current} 关，不能在这里读取。请回主界面载入后，再进入对应关卡继续。',
			'game.readConfirm': '读取 {file}（第 {level} 关，剩 {turns} 回合）会覆盖当前未保存的进度，继续？',
			'game.savesCleared': '当前用户的自动存档与手动存档已清空',
			'game.notInLevel': '当前不在关卡内',
			'game.level7Locked': '需要第 1～6 关全部获得 3 星，才能解锁第 7 关。',
			'menu.level7Progress': '{current}/18 星',
			'menu.level7LockedTitle': '第 7 关尚未解锁：当前 {current}/18 星；第 1～6 关全部获得 3 星后开启。',
			'game.goal': '消灭全部红方部队即可获胜！——你有 {turns} 回合。',
			'game.goalStart': '消灭全部',
			'game.goalRed': '红方',
			'game.goalEnd': '部队即可获胜！——你有 {turns} 回合。',
			'game.resumed': '已读取第 {level} 关存档，还剩 {turns} 回合。',
			'game.turnsUrgent': '只剩 {turns} 回合！',
			'game.turnsFew': '还剩 {turns} 回合。',
			'game.turns': '剩余 {turns} 回合。',
			'game.selected': '选中部队（{count}）',
			'game.enemies': '敌方部队（{count}）',
			'game.stats': '射程 {range} · 攻击 {attack} · 速度 {speed}',
			'game.removeAlly': '取消选中（移出显示条）',
			'game.removeEnemy': '移出敌方查看',
			/* 2026-09-16 修复包：剩余回合 pill、主界面读档入口、存档弹窗、Game8、通用按钮 */
			'game.turnsLeft': '剩余 {turns} 回合',
			'game.turnsLeftUsed': '剩余 {turns} 回合 · 已用 {used} 回合',
			'game.idleTurnWarn': '本回合我方没有任何待执行的命令，双方也尚未交火 —— 直接推进会白白消耗一回合。要静观其变吗？',
			'game.idleTurnWait': '静观其变',
			'menu.loadSaves': '读取存档',
			'menu.loadSavesTitle': '读取手动备份（存档 1～3）：载入 / 删除 / 重新开始',
			'menu.pinContinue': '进行中，点标记继续',
			'menu.pinReplay': '，可重玩',
			'menu.pinStart': '未通关，点标记开始',
			'menu.hiddenSuffix': '（隐藏关）',
			'menu.levelStarsRow': '第 {level} 关 {stars}',
			'menu.slotCleared': '已通关 {count} 关 · 星级 {stars}/{total}',
			'menu.slotNoBeat': '尚无通关记录',
			'menu.slotPlaying': '第 {level} 关进行中（剩余 {turns} 回合）',
			'menu.slotNoProgress': '无进行中的关',
			'menu.loadStill': '仍要载入',
			'menu.emptySlotWarn': '{file} 是空的。再点一次将用它覆盖 a.save（清空进度，成就与手动备份保留）。',
			'menu.emptyOverwrote': '已用空白存档覆盖 a.save：通关进度已清空',
			'menu.restartConfirmFull': '重新开始将清空活动存档 a.save（通关进度 / 星级 / 进行中快照）与全部成就、连败记录，且不可恢复；手动备份 存档1~3 会保留。确定继续？',
			'menu.restartedFull': '已重新开始：a.save、成就与连败记录已清空',
			'save.modalTitle': '存档 / 读档',
			'common.close': '关闭',
			'common.ok': '确定',
			'common.cancel': '取消',
			'common.gotIt': '知道了',
			'game8.title': 'Game8：最后防线',
			'game8.deployTitle': '战前部署',
			'game8.deployTip1': '5 门炮兵可以部署在棋盘任意位置。',
			'game8.deployTip2': '但炮兵必须位于红线左侧。',
			'game8.deployedCount': '已部署炮兵：{count} / {total}',
			'game8.hudDeploy': '部署阶段 · 炮兵：{count} / {total}',
			'game8.startDefense': '开始防守',
			'game8.readyTip1': '5 门炮兵部署完毕。',
			'game8.readyTip2': '敌军重炮已经进入阵地。',
			'game8.deployAll': '请部署全部炮兵（{count}/{total}）',
			'game8.hudSafe': '最后防线 · 尚无敌军到达红线 · 剩余回合：{turns}',
			'game8.hudBreach': '⚠ 已有 <b>{count}</b> 支敌军到达红线！<br>剩余回合：{turns}',
			'game8.winDetail': '防线守住了！敌军共有 {count} 支到达红线。',
			'game8.loseDetail': '敌军突破最后防线，阵地失守。共有 {count} 支敌军到达红线。',
			'game8.loseDetailNoCount': '敌军突破最后防线，阵地失守。',
			'game8.started1': '战斗开始！',
			'game8.started2': '5 门炮兵已经固定。',
			'game8.started3': '阻止敌军突破最后防线。',
			'unit.infantry': '步兵',
			'unit.artillery': '炮兵',
			'unit.cavalry': '骑兵',
			'unit.skirmisher': '散兵',
			'unit.grenadier': '掷弹兵',
			'dialogue.label': '剧情对话',
			'dialogue.character': '剧情人物',
			'dialogue.briefing': '战役简报',
			'dialogue.defeatAll': '击败所有红方单位即可获胜。',
			'dialogue.startBattle': '开 战',
			'dialogue.campaign': '帝国战记',
				'dialogue.continue': '继续',
				'dialogue.finish': '完成',
				'dialogue.skip': '跳过剧情',
			'victory.reporter': '战报',
			'victory.role': '帝国统帅部',
			'victory.napoleon': '敌军已经退出战场。收拢队伍，把鹰旗带到下一条战线。',
			'victory.summary': '第 {level} 关战斗结束：本次获得 {stars} 星。{save}',
			'victory.saved': '战果已自动保存到 a.save。',
			'victory.notSaved': '当前未登录，本次战果没有写入存档。',
			'victory.hidden': '历史出现了新的岔路：秘密路线已经开启。',
			'victory.viewResult': '查看战果',
			'achievement.unlocked': '成就解锁：{name} —— {desc}',
			'achievement.victory.name': '胜利',
			'achievement.victory.desc': '进入正常结局',
			'achievement.fail.name': '惨痛失败',
			'achievement.fail.desc': '进入失败结局',
			'achievement.empire.name': '法兰西帝国',
			'achievement.empire.desc': '进入隐藏结局',
			'achievement.rise.name': '失败乃成功之母',
			'achievement.rise.desc': '同一关连续失败 4 次后，以 3 星通关',
			'group.title': '小组介绍',
			'group.subtitle': '六位成员的简介与个人页面入口（角色分配见 group.md）',
			'group.more': '查看个人页 →',
			'group.back': '← 返回主页',
			'group.role1': '项目经理 · 程序员 · CIO',
			'group.role2': '程序员 · UI · 文档编辑',
			'group.role3': '程序员 · 摄影 · 剪辑',
			'group.role4': '程序员 · 剪辑 · 美工',
			'group.role5': 'UI · 美工 · 文档编辑',
			'group.role6': '剪辑 · 美工',
			'ending.standardTitle': '结局 · 通往滑铁卢',
			'ending.standardSub': '利尼获胜，却未能摧毁普军',
			'ending.standard1': '古尔戈：内伊没能夺下四臂村；威灵顿得知普军在利尼失利后，向蒙圣让高地撤退。',
			'ending.standard2': '拿破仑：命格鲁希紧追普军。只要他们不能与威灵顿会合，我们仍能各个击破。',
			'ending.standard3': '传令兵：普军没有向东溃散，而是保持建制向北退往瓦夫尔。',
			'ending.standard4': '拿破仑：那就让全军休整。明早必须在两支联军重新握手之前，击穿蒙圣让。',
			'ending.standard5': '战地旁白：1815年6月18日，湿地拖慢法军进攻，普军赶到滑铁卢，近卫军最终被击退。拿破仑四天后再度退位。',
			'ending.standardNote': '（正常结局：故事回到正史。另一种可能仍藏在战役地图的秘密路线中……）',
			'ending.failTitle': '结局 · 拿破仑提早失利',
			'ending.failSub': '历史在这里拐了一个弯……',
			'ending.fail1': '拿破仑：不……不可能，我们只是输了一场小仗！',
			'ending.fail2': '副官：陛下，联军正在集结，巴黎已经传来不稳的消息。',
			'ending.fail3': '拿破仑：再给我一次机会，我会让那些人记住法兰西的名字。',
			'ending.failNote': '败局已定，拿破仑提早失利的结局就此写就——但历史可以重来。',
			'ending.failBack': '返回游戏主界面，重新指挥',
			'ending.destinyTitle': '隐藏失败 · 命运无法改变',
			'ending.destinySub': '你绕过了史书，却没有绕开命运……',
			'ending.destiny1': '拿破仑：又是滑铁卢……我明明已经绕开了那一天的雨。',
			'ending.destiny2': '副官：陛下，我们确实走到了另一条路上——可守在那条路尽头的，依旧是命运本人。',
			'ending.destiny3': '拿破仑：……原来有些结局，连第二次机会也无法改写。',
			'ending.destinyNote': '（即便踏上隐藏之路，第七关的失利也让历史回到了它本来的轨道。）',
			'ending.destinyRetry': '再战第七关，向命运讨回一次机会',
			'ending.empireTitle': '隐藏结局 · 拿破仑统治欧洲',
			'ending.empireSub': '你撕开了史书的另一页……',
			'ending.empire1': '拿破仑：联军崩溃了。威灵顿的望远镜落在泥里，再没有人能把它捡起来。',
			'ending.empire2': '副官：陛下，伦敦、柏林、维也纳的电报都在往同一个方向发——向您称臣。',
			'ending.empire3': '拿破仑：欧洲？不，从现在起，欧洲就是法兰西，而法兰西就是我。',
			'ending.empire4': '传令兵（远处）：为皇帝陛下欢呼——帝国万岁！',
			'ending.empireNote': '（隐藏结局：拿破仑统治欧洲——这段历史从未被写下。）',
			'ending.empireRestart': '从第一场战役再次出发',
			'ending.backMenu': '返回游戏主界面',
			'ending.logout': '退出登录',
			'ending.restart': '从头再战'
		},
		'zh-TW': {
			'ui.language': '語言', 'ui.darkMode': '開啟夜覽模式', 'ui.lightMode': '關閉夜覽模式',
			'ui.soundOff': '關閉聲音', 'ui.soundOn': '開啟聲音',
			'ui.showPassword': '顯示密碼', 'ui.hidePassword': '隱藏密碼', 'ui.close': '關閉',
			'site.title': '拿破崙戰爭', 'site.subtitle': '回合制策略小遊戲 · 消滅紅方軍隊，改寫歷史',
			'auth.loginTitle': '登入', 'auth.loginButton': '登 入', 'auth.registerTitle': '註冊新帳號', 'auth.registerButton': '註 冊',
			'auth.username': '使用者名稱', 'auth.password': '密碼', 'auth.confirmPassword': '確認密碼',
			'auth.usernamePlaceholder': '請輸入使用者名稱', 'auth.passwordPlaceholder': '請輸入密碼', 'auth.confirmPlaceholder': '再輸入一次密碼',
			'auth.noAccount': '還沒有帳號？', 'auth.toRegister': '去註冊', 'auth.hasAccount': '已有帳號？', 'auth.backLogin': '返回登入',
			'auth.group': '查看小組介紹', 'auth.localWarning': '帳號只保存在本機瀏覽器（localStorage），更換瀏覽器或清除快取會遺失',
			'auth.empty': '使用者名稱和密碼都不能為空', 'auth.mismatch': '兩次輸入的密碼不一致',
			'auth.exists': '該使用者名稱已被註冊，請換一個', 'auth.notFound': '使用者不存在，請先註冊', 'auth.wrongPassword': '密碼錯誤',
			'kicker.register': 'ENLISTMENT RECORD · 帝國徵募處', 'kicker.menu': 'IMPERIAL HEADQUARTERS · 帝國統帥部',
			'kicker.group': 'THE DEVELOPMENT STAFF · 專案參謀部', 'kicker.standardEnding': 'CAMPAIGN CONCLUDED · 戰役終章',
			'kicker.failEnding': 'A HISTORY UNMADE · 未竟之史', 'kicker.destinyEnding': 'FATE REASSERTED · 命運歸位',
				'kicker.empireEnding': 'THE UNWRITTEN EMPIRE · 未寫帝國',
				'mode.pageTitle': '選擇作戰模式 - 拿破崙戰爭', 'mode.kicker': 'THEATER OF WAR · 作戰方式',
				'mode.title': '選擇作戰模式', 'mode.welcome': '指揮官 ', 'mode.choose': '，請選擇今日的戰場。',
				'mode.campaignEyebrow': '1793—1815 · 歷史戰役', 'mode.campaignTitle': '通關模式',
				'mode.campaignCopy': '沿拿破崙的戰役年表推進，觀看電影式劇情、累積星級並挑戰隱藏的滑鐵盧終幕。',
				'mode.campaignCta': '展開帝國戰圖 →', 'mode.onlineEyebrow': 'RED VS BLUE · 即時對抗',
				'mode.onlineTitle': '連線模式', 'mode.onlineCopy': '建立或加入房間，自訂公平編制，以擲骰決定先手，在限時內輪流下達整軍命令。',
				'mode.onlineCta': '進入連線軍帳 →',
				'menu.title': '遊戲主畫面', 'menu.welcome': '歡迎回來，', 'menu.welcomeEnd': '！',
			'menu.mapTheater': 'EUROPEAN THEATER · 歐洲戰區', 'menu.mapSignal': '戰役網路在線', 'menu.mapHint': '選擇戰役節點 · 推進帝國戰線',
			'transition.kicker': '序章 · 風暴將至', 'transition.handoff': 'IMPERIAL STAFF MAP · 帝國參謀地圖', 'transition.line1': '1805年，舊秩序的王冠仍壓在歐洲大陸之上。',
			'transition.line2': '聯盟在邊境集結，而法蘭西的鷹旗已經越過萊茵河。', 'transition.line3': '從這一刻起，你的每一道命令，都可能改寫歷史。',
			'transition.enter': '正在展開歐洲戰役地圖……', 'transition.skip': '立即進入地圖',
			'menu.autoHeading': '活動存檔 · 自動存檔 a.save（進度與進行中的關卡）',
			'menu.manualHeading': '手動備份（存檔 1/2/3）——「載入」會用該檔覆蓋 a.save',
				'menu.mode': '模式選擇', 'menu.group': '小組介紹', 'menu.logout': '登出', 'menu.restart': '重新開始遊戲', 'menu.restartTitle': '清空活動存檔 a.save，從頭開始',
			'menu.note': '通關後自動存入 a.save；關卡內「儲存」可寫入 a.save 或備份至存檔 1～3；「讀取」會把所選存檔覆蓋回 a.save。',
			'menu.cleared': '尚未通關', 'menu.progress': '已通關 {count} 關', 'menu.current': '，目前進行到第 {level} 關',
			'menu.playing': '進行中 · 剩餘 {turns} 回合', 'menu.continue': '繼續', 'menu.start': '開始', 'menu.locked': '未解鎖',
			'menu.revealAfter6': '通關第 6 關後揭曉', 'menu.needLevel6': '🔒 需先通關第 6 關',
			'menu.levelProgress': '第 {level} 關進行中 · 剩餘 {turns} 回合', 'menu.empty': '（空）',
			'save.auto': '自動存檔 (a.save)', 'save.slot': '存檔 {id}', 'save.empty': '（空）',
			'save.sameLevel': '（第 {level} 關，剩 {turns} 回合）', 'save.otherLevel': '（第 {level} 關 · 非本關，不可讀）',
			'menu.load': '載入', 'menu.delete': '刪除', 'menu.achievements': '成就（{done}/{total}）',
			'menu.achieved': '✓ 已達成', 'menu.notAchieved': '🔒 未解鎖',
			'menu.loadConfirm': '載入 {file} 會用它的內容覆蓋目前自動存檔 a.save，繼續？',
			'menu.loaded': '已載入 {file} 至 a.save', 'menu.deleteConfirm': '刪除 {file}？',
			'menu.restartConfirm': '重新開始將清空活動存檔 a.save（通關進度、星級和進行中快照），且無法復原；手動備份存檔 1～3 會保留。確定繼續？',
			'menu.restarted': '已重新開始：a.save 已清空',
			'game.nextTurn': '下一步', 'game.nextGame': '下一關', 'game.replay': '重玩本關', 'game.save': '儲存', 'game.load': '讀取',
			'game.undo': '回退 {left}/3', 'game.undoTitle': '回退到上一步（本關最多使用 3 次）',
			'game.undoEmpty': '目前沒有可以回退的步驟。', 'game.undoDone': '已回退一步，本關還可回退 {left} 次。',
			'game.noMovement': '本回合沒有任何部隊機動。請先下達移動命令，或確認雙方已經進入交火。',
			'game.difficulty': '威脅 {level}/7', 'game.enemyRemain': '敵軍 {count}',
				'game.momentum': '戰意 {level}/3 · +{bonus}%',
				'game.threatHelp': '威脅表示本關敵軍強度與機制複雜度；數值越高，敵軍編制、主動策略或時間壓力越強。',
				'game.momentumHelp': '戰意來自連續殲敵。每級讓藍方下一步攻擊提高 8%，最高 3 級；一輪未殲敵會下降 1 級。',
				'game.allyRoster': '我方序列', 'game.enemyRoster': '敵方序列',
			'game.momentumGain': '殲敵 {kills} 支，戰意升至 {level}/3：下一步我軍攻擊 +{bonus}%。',
			'game.briefingDifficulty': '威脅等級 {level}/7 · {mechanic}\n{hint}',
			'game.strategyUnlocked': '參謀部復盤 · 連續失敗 {count} 次', 'game.strategyLead': '建議下一次按這個順序調整：',
			'game.menu': '主畫面', 'game.viewEnemy': '查看敵軍', 'game.backCommand': '返回指揮', 'game.win': '勝利', 'game.lose': '戰敗',
			'game.endingEarly': '查看結局：提早失利', 'game.endingDestiny': '查看結局：命運無法改變',
			'game.saveTitle': '把目前關卡的中途狀態存進所選存檔', 'game.loadTitle': '讀取所選存檔的中途狀態（覆蓋目前進度）',
			'game.modeTitle': '切換為查看敵方剩餘生命；再按一次返回指揮', 'game.menuTitle': '返回遊戲主畫面',
			'game.loginToSave': '尚未登入：請先回主畫面登入，再儲存遊戲', 'game.notLoggedIn': '尚未登入',
			'game.savedTo': '已儲存至 {file}', 'game.overwriteConfirm': '覆蓋 {file} 裡的中途存檔（第 {level} 關）？',
			'game.noSnapshot': '{file} 裡沒有中途存檔',
			'game.otherLevelSave': '該存檔屬於第 {saved} 關，目前是第 {current} 關，不能在這裡讀取。請回主畫面載入後，再進入對應關卡繼續。',
			'game.readConfirm': '讀取 {file}（第 {level} 關，剩 {turns} 回合）會覆蓋目前未儲存的進度，繼續？',
			'game.savesCleared': '目前使用者的自動存檔與手動存檔已清空', 'game.notInLevel': '目前不在關卡內',
			'game.level7Locked': '需要第 1～6 關全部獲得 3 星，才能解鎖第 7 關。',
			'menu.level7Progress': '{current}/18 星',
			'menu.level7LockedTitle': '第 7 關尚未解鎖：目前 {current}/18 星；第 1～6 關全部獲得 3 星後開啟。',
			'game.goal': '消滅全部紅方部隊即可獲勝！——你有 {turns} 回合。',
			'game.goalStart': '消滅全部', 'game.goalRed': '紅方', 'game.goalEnd': '部隊即可獲勝！——你有 {turns} 回合。',
			'game.resumed': '已讀取第 {level} 關存檔，還剩 {turns} 回合。',
			'game.turnsUrgent': '只剩 {turns} 回合！', 'game.turnsFew': '還剩 {turns} 回合。', 'game.turns': '剩餘 {turns} 回合。',
			'game.selected': '選中部隊（{count}）', 'game.enemies': '敵方部隊（{count}）',
			'game.stats': '射程 {range} · 攻擊 {attack} · 速度 {speed}', 'game.removeAlly': '取消選中（移出顯示列）', 'game.removeEnemy': '移出敵方查看',
			'unit.infantry': '步兵', 'unit.artillery': '砲兵', 'unit.cavalry': '騎兵', 'unit.skirmisher': '散兵', 'unit.grenadier': '擲彈兵',
			'dialogue.label': '劇情對話', 'dialogue.character': '劇情人物', 'dialogue.briefing': '戰役簡報',
			'dialogue.defeatAll': '擊敗所有紅方單位即可獲勝。', 'dialogue.startBattle': '開 戰',
				'dialogue.campaign': '帝國戰記', 'dialogue.continue': '繼續', 'dialogue.finish': '完成', 'dialogue.skip': '跳過劇情',
			'victory.reporter': '戰報', 'victory.role': '帝國統帥部', 'victory.napoleon': '敵軍已經退出戰場。收攏隊伍，把鷹旗帶到下一條戰線。',
			'victory.summary': '第 {level} 關戰鬥結束：本次獲得 {stars} 星。{save}', 'victory.saved': '戰果已自動儲存至 a.save。',
			'victory.notSaved': '目前未登入，本次戰果沒有寫入存檔。', 'victory.hidden': '歷史出現了新的岔路：秘密路線已經開啟。',
			'victory.viewResult': '查看戰果', 'achievement.unlocked': '成就解鎖：{name} —— {desc}',
			'achievement.victory.name': '勝利', 'achievement.victory.desc': '進入正常結局',
			'achievement.fail.name': '慘痛失敗', 'achievement.fail.desc': '進入失敗結局',
			'achievement.empire.name': '法蘭西帝國', 'achievement.empire.desc': '進入隱藏結局',
			'achievement.rise.name': '失敗乃成功之母', 'achievement.rise.desc': '同一關連續失敗 4 次後，以 3 星通關',
			'group.title': '小組介紹', 'group.subtitle': '六位成員的簡介與個人頁面入口（角色分配見 group.md）',
			'group.more': '查看個人頁 →', 'group.back': '← 返回首頁',
			'group.role1': '專案經理 · 程式設計師 · CIO', 'group.role2': '程式設計師 · UI · 文件編輯',
			'group.role3': '程式設計師 · 攝影 · 剪輯', 'group.role4': '程式設計師 · 剪輯 · 美術',
			'group.role5': 'UI · 美術 · 文件編輯', 'group.role6': '剪輯 · 美術',
			'ending.standardTitle': '結局 · 通往滑鐵盧', 'ending.standardSub': '利尼獲勝，卻未能摧毀普軍',
			'ending.standard1': '古爾戈：內伊沒能奪下四臂村；威靈頓得知普軍在利尼失利後，向蒙聖讓高地撤退。',
			'ending.standard2': '拿破崙：命格魯希緊追普軍。只要他們不能與威靈頓會合，我們仍能各個擊破。',
			'ending.standard3': '傳令兵：普軍沒有向東潰散，而是保持建制向北退往瓦夫爾。',
			'ending.standard4': '拿破崙：那就讓全軍休整。明早必須在兩支聯軍重新握手之前，擊穿蒙聖讓。',
			'ending.standard5': '戰地旁白：1815年6月18日，濕地拖慢法軍進攻，普軍趕到滑鐵盧，近衛軍最終被擊退。拿破崙四天後再度退位。',
			'ending.standardNote': '（正常結局：故事回到正史。另一種可能仍藏在戰役地圖的秘密路線中……）',
			'ending.failTitle': '結局 · 拿破崙提早失利', 'ending.failSub': '歷史在這裡拐了一個彎……',
			'ending.fail1': '拿破崙：不……不可能，我們只是輸了一場小仗！',
			'ending.fail2': '副官：陛下，聯軍正在集結，巴黎已經傳來不穩的消息。',
			'ending.fail3': '拿破崙：再給我一次機會，我會讓那些人記住法蘭西的名字。',
			'ending.failNote': '敗局已定，拿破崙提早失利的結局就此寫就——但歷史可以重來。',
			'ending.failBack': '返回遊戲主畫面，重新指揮',
			'ending.destinyTitle': '隱藏失敗 · 命運無法改變', 'ending.destinySub': '你繞過了史書，卻沒有繞開命運……',
			'ending.destiny1': '拿破崙：又是滑鐵盧……我明明已經繞開了那一天的雨。',
			'ending.destiny2': '副官：陛下，我們確實走到了另一條路上——可守在那條路盡頭的，依舊是命運本人。',
			'ending.destiny3': '拿破崙：……原來有些結局，連第二次機會也無法改寫。',
			'ending.destinyNote': '（即使踏上隱藏之路，第七關的失利也讓歷史回到了它原本的軌道。）',
			'ending.destinyRetry': '再戰第七關，向命運討回一次機會',
			'ending.empireTitle': '隱藏結局 · 拿破崙統治歐洲', 'ending.empireSub': '你撕開了史書的另一頁……',
			'ending.empire1': '拿破崙：聯軍崩潰了。威靈頓的望遠鏡落在泥裡，再沒有人能把它撿起來。',
			'ending.empire2': '副官：陛下，倫敦、柏林、維也納的電報都在往同一個方向發——向您稱臣。',
			'ending.empire3': '拿破崙：歐洲？不，從現在起，歐洲就是法蘭西，而法蘭西就是我。',
			'ending.empire4': '傳令兵（遠處）：為皇帝陛下歡呼——帝國萬歲！',
			'ending.empireNote': '（隱藏結局：拿破崙統治歐洲——這段歷史從未被寫下。）',
			'ending.empireRestart': '從第一場戰役再次出發',
			'ending.backMenu': '返回遊戲主畫面', 'ending.logout': '登出', 'ending.restart': '從頭再戰'
		},
		en: {
			'ui.language': 'Language', 'ui.darkMode': 'Turn on night mode', 'ui.lightMode': 'Turn off night mode',
			'ui.soundOff': 'Mute sound', 'ui.soundOn': 'Turn sound on',
			'ui.showPassword': 'Show password', 'ui.hidePassword': 'Hide password', 'ui.close': 'Close',
			'site.title': 'Napoleonic Wars', 'site.subtitle': 'Turn-based strategy · Defeat the red army and rewrite history',
			'auth.loginTitle': 'Log In', 'auth.loginButton': 'Log In', 'auth.registerTitle': 'Create an Account', 'auth.registerButton': 'Register',
			'auth.username': 'Username', 'auth.password': 'Password', 'auth.confirmPassword': 'Confirm password',
			'auth.usernamePlaceholder': 'Enter your username', 'auth.passwordPlaceholder': 'Enter your password', 'auth.confirmPlaceholder': 'Enter your password again',
			'auth.noAccount': 'No account yet?', 'auth.toRegister': 'Register', 'auth.hasAccount': 'Already have an account?', 'auth.backLogin': 'Back to login',
			'auth.group': 'Meet the team', 'auth.localWarning': 'Accounts are stored only in this browser. Switching browsers or clearing site data will remove them.',
			'auth.empty': 'Username and password are required', 'auth.mismatch': 'The two passwords do not match',
			'auth.exists': 'That username is already registered', 'auth.notFound': 'User not found. Please register first', 'auth.wrongPassword': 'Incorrect password',
			'kicker.register': 'ENLISTMENT RECORD · IMPERIAL RECRUITING OFFICE', 'kicker.menu': 'IMPERIAL HEADQUARTERS',
			'kicker.group': 'THE DEVELOPMENT STAFF', 'kicker.standardEnding': 'CAMPAIGN CONCLUDED',
			'kicker.failEnding': 'A HISTORY UNMADE', 'kicker.destinyEnding': 'FATE REASSERTED',
				'kicker.empireEnding': 'THE UNWRITTEN EMPIRE',
				'mode.pageTitle': 'Choose Battle Mode - Napoleonic Wars', 'mode.kicker': 'THEATER OF WAR',
				'mode.title': 'Choose Battle Mode', 'mode.welcome': 'Commander ', 'mode.choose': ', choose today\'s theater.',
				'mode.campaignEyebrow': '1793–1815 · HISTORICAL CAMPAIGN', 'mode.campaignTitle': 'Campaign',
				'mode.campaignCopy': 'Follow Napoleon\'s campaigns through cinematic scenes, earn stars, and unlock the hidden Waterloo finale.',
				'mode.campaignCta': 'Open the campaign map →', 'mode.onlineEyebrow': 'RED VS BLUE · LIVE DUEL',
				'mode.onlineTitle': 'Online Battle', 'mode.onlineCopy': 'Create or join a room, set a fair army, roll for first move, and alternate full-army commands against the clock.',
				'mode.onlineCta': 'Enter the online war room →',
				'menu.title': 'Campaign Command', 'menu.welcome': 'Welcome back, ', 'menu.welcomeEnd': '!',
			'menu.mapTheater': 'EUROPEAN THEATER · OPERATIONS', 'menu.mapSignal': 'Campaign network online', 'menu.mapHint': 'Select a battle node · Advance the imperial front',
			'transition.kicker': 'PROLOGUE · THE STORM GATHERS', 'transition.handoff': 'IMPERIAL STAFF MAP', 'transition.line1': 'In 1805, the crowns of the old order still weighed upon Europe.',
			'transition.line2': 'Coalitions massed at the frontier as the French Eagle crossed the Rhine.', 'transition.line3': 'From this moment, every order you give may rewrite history.',
			'transition.enter': 'Deploying the European campaign map…', 'transition.skip': 'Enter Map Now',
			'menu.autoHeading': 'Active campaign · Autosave a.save (progress and current battle)',
			'menu.manualHeading': 'Manual backups (Slots 1/2/3) — loading replaces a.save',
				'menu.mode': 'Choose Mode', 'menu.group': 'Meet the team', 'menu.logout': 'Log out', 'menu.restart': 'Restart campaign', 'menu.restartTitle': 'Erase a.save and restart the campaign',
			'menu.note': 'Victories are saved to a.save automatically. During battle, Save writes to a.save or Slots 1–3; Load restores the selected save to a.save.',
			'menu.cleared': 'Not cleared', 'menu.progress': '{count} level(s) cleared', 'menu.current': ', currently at Level {level}',
			'menu.playing': 'In progress · {turns} turns left', 'menu.continue': 'Continue', 'menu.start': 'Start', 'menu.locked': 'Locked',
			'menu.revealAfter6': 'Revealed after clearing Level 6', 'menu.needLevel6': '🔒 Clear Level 6 first',
			'menu.levelProgress': 'Level {level} in progress · {turns} turns left', 'menu.empty': '(Empty)',
			'save.auto': 'Autosave (a.save)', 'save.slot': 'Save Slot {id}', 'save.empty': '(Empty)',
			'save.sameLevel': '(Level {level}, {turns} turns left)', 'save.otherLevel': '(Level {level} · different level, unavailable here)',
			'menu.load': 'Load', 'menu.delete': 'Delete', 'menu.achievements': 'Achievements ({done}/{total})',
			'menu.achieved': '✓ Unlocked', 'menu.notAchieved': '🔒 Locked',
			'menu.loadConfirm': 'Loading {file} will replace the current a.save. Continue?',
			'menu.loaded': '{file} loaded into a.save', 'menu.deleteConfirm': 'Delete {file}?',
			'menu.restartConfirm': 'Restarting erases campaign progress, stars, and the current battle in a.save. This cannot be undone; manual Slots 1–3 will remain. Continue?',
			'menu.restarted': 'Campaign restarted; a.save was cleared',
			'game.nextTurn': 'Next Step', 'game.nextGame': 'Next Battle', 'game.replay': 'Replay', 'game.save': 'Save', 'game.load': 'Load',
			'game.undo': 'Undo {left}/3', 'game.undoTitle': 'Return to the previous step (up to 3 uses per battle)',
			'game.undoEmpty': 'There is no previous step to restore.', 'game.undoDone': 'Step restored. {left} undo uses remain.',
			'game.noMovement': 'No unit moved this turn. Issue a movement order, or confirm that both sides are already engaged.',
			'game.difficulty': 'Threat {level}/7', 'game.enemyRemain': 'Enemy {count}',
				'game.momentum': 'Morale {level}/3 · +{bonus}%',
				'game.threatHelp': 'Threat summarizes enemy strength and mechanic complexity. Higher values mean tougher forces, more active tactics, or tighter time pressure.',
				'game.momentumHelp': 'Morale rises with consecutive eliminations. Each level adds 8% French attack next step, up to level 3; a turn without a kill lowers it by one.',
				'game.allyRoster': 'Friendly Order', 'game.enemyRoster': 'Enemy Order',
			'game.momentumGain': '{kills} enemy unit(s) defeated. Morale is now {level}/3: French attack +{bonus}% next step.',
			'game.briefingDifficulty': 'THREAT {level}/7 · {mechanic}\n{hint}',
			'game.strategyUnlocked': 'STAFF REVIEW · {count} CONSECUTIVE DEFEATS', 'game.strategyLead': 'Adjust the next attempt in this order:',
			'game.menu': 'Menu', 'game.viewEnemy': 'Inspect Enemy', 'game.backCommand': 'Back to Command', 'game.win': 'You Win', 'game.lose': 'Defeat',
			'game.endingEarly': 'View Ending: Early Defeat', 'game.endingDestiny': 'View Ending: Fate Prevails',
			'game.saveTitle': 'Save this battle to the selected slot', 'game.loadTitle': 'Load the selected mid-battle save and replace current progress',
			'game.modeTitle': 'Inspect enemy health; press again to return to command', 'game.menuTitle': 'Return to campaign command',
			'game.loginToSave': 'You are not logged in. Return to the main screen, log in, and then save.', 'game.notLoggedIn': 'You are not logged in',
			'game.savedTo': 'Saved to {file}', 'game.overwriteConfirm': 'Overwrite the Level {level} snapshot in {file}?',
			'game.noSnapshot': '{file} has no mid-battle save',
			'game.otherLevelSave': 'This save belongs to Level {saved}, but you are in Level {current}. Load it from Campaign Command, then enter the matching level.',
			'game.readConfirm': 'Loading {file} (Level {level}, {turns} turns left) will replace unsaved progress. Continue?',
			'game.savesCleared': 'All autosaves and manual saves for the current user were cleared', 'game.notInLevel': 'You are not currently in a battle',
			'game.level7Locked': 'Earn 3 stars in Levels 1–6 to unlock Level 7.',
			'menu.level7Progress': '{current}/18 stars',
			'menu.level7LockedTitle': 'Level 7 locked: {current}/18 stars. Earn 3 stars in Levels 1–6 to unlock it.',
			'game.goal': 'Destroy every red unit to win! — You have {turns} turns.',
			'game.goalStart': 'Destroy all ', 'game.goalRed': 'red ', 'game.goalEnd': 'units to win! — You have {turns} turns.',
			'game.resumed': 'Level {level} resumed with {turns} turns left.',
			'game.turnsUrgent': 'ONLY {turns} turns left!', 'game.turnsFew': '{turns} turns remaining.', 'game.turns': '{turns} turns remaining.',
			'game.selected': 'Selected Units ({count})', 'game.enemies': 'Enemy Units ({count})',
			'game.stats': 'Range {range} · Attack {attack} · Speed {speed}', 'game.removeAlly': 'Remove from selection', 'game.removeEnemy': 'Remove from enemy inspection',
			'game.turnsLeft': '{turns} turns left',
			'game.turnsLeftUsed': '{turns} turns left · {used} used',
			'game.idleTurnWarn': 'No orders are pending and no units are engaged — advancing now would spend a turn for nothing. Wait and see?',
			'game.idleTurnWait': 'Wait and see',
			'menu.loadSaves': 'Load Saves',
			'menu.loadSavesTitle': 'Manual backups (Slots 1-3): load / delete / restart',
			'menu.pinContinue': 'In progress — click to continue',
			'menu.pinReplay': ', replay available',
			'menu.pinStart': 'Not cleared — click to begin',
			'menu.hiddenSuffix': ' (Hidden)',
			'menu.levelStarsRow': 'L{level} {stars}',
			'menu.slotCleared': '{count} level(s) cleared · Stars {stars}/{total}',
			'menu.slotNoBeat': 'No cleared levels yet',
			'menu.slotPlaying': 'Level {level} in progress ({turns} turns left)',
			'menu.slotNoProgress': 'No battle in progress',
			'menu.loadStill': 'Load anyway',
			'menu.emptySlotWarn': '{file} is empty. Click again to overwrite a.save with it (progress erased; achievements and manual backups kept).',
			'menu.emptyOverwrote': 'a.save overwritten with an empty slot: campaign progress cleared',
			'menu.restartConfirmFull': 'Restarting erases a.save (progress, stars, current battle), all achievements and loss streaks; this cannot be undone. Manual Slots 1-3 remain. Continue?',
			'menu.restartedFull': 'Restarted: a.save, achievements and loss streaks cleared',
			'save.modalTitle': 'Save / Load',
			'common.close': 'Close',
			'common.ok': 'OK',
			'common.cancel': 'Cancel',
			'common.gotIt': 'Got it',
			'game8.title': 'Game 8: The Last Defensive Line',
			'game8.deployTitle': 'Pre-Battle Deployment',
			'game8.deployTip1': 'Deploy 5 artillery units anywhere on the board.',
			'game8.deployTip2': 'All artillery must stay to the left of the red line.',
			'game8.deployedCount': 'Artillery deployed: {count} / {total}',
			'game8.hudDeploy': 'Deployment · Artillery: {count} / {total}',
			'game8.startDefense': 'Start Defense',
			'game8.readyTip1': 'All 5 artillery units deployed.',
			'game8.readyTip2': 'Enemy heavy guns are in position.',
			'game8.deployAll': 'Deploy all artillery ({count}/{total})',
			'game8.hudSafe': 'The last line · no enemy has reached the red line · Turns left: {turns}',
			'game8.hudBreach': '⚠ <b>{count}</b> enemy unit(s) have reached the red line!<br>Turns left: {turns}',
			'game8.winDetail': 'The line held! {count} enemy unit(s) reached the red line.',
			'game8.loseDetail': 'The enemy broke through the last line. {count} enemy unit(s) reached the red line.',
			'game8.loseDetailNoCount': 'The enemy broke through the last line.',
			'game8.started1': 'The battle has begun!',
			'game8.started2': 'All 5 guns are now fixed in place.',
			'game8.started3': 'Stop the enemy from breaking the last defensive line.',
			'unit.infantry': 'Infantry', 'unit.artillery': 'Artillery', 'unit.cavalry': 'Cavalry', 'unit.skirmisher': 'Skirmisher', 'unit.grenadier': 'Grenadier',
			'dialogue.label': 'Story dialogue', 'dialogue.character': 'Story character', 'dialogue.briefing': 'Battle Briefing',
			'dialogue.defeatAll': 'Defeat every red unit to win.', 'dialogue.startBattle': 'Begin Battle',
				'dialogue.campaign': 'The Imperial Chronicle', 'dialogue.continue': 'Continue', 'dialogue.finish': 'Finish', 'dialogue.skip': 'Skip Story',
			'victory.reporter': 'Battle Report', 'victory.role': 'Imperial Headquarters',
			'victory.napoleon': 'The enemy has left the field. Reform the ranks and carry the Eagle to the next front.',
			'victory.summary': 'Level {level} complete: {stars} star(s) earned. {save}', 'victory.saved': 'The result was saved automatically to a.save.',
			'victory.notSaved': 'You are not logged in, so this result was not saved.', 'victory.hidden': 'History has opened a new branch: the secret route is now available.',
			'victory.viewResult': 'View Result', 'achievement.unlocked': 'Achievement unlocked: {name} — {desc}',
			'achievement.victory.name': 'Victory', 'achievement.victory.desc': 'Reach the standard ending',
			'achievement.fail.name': 'Bitter Defeat', 'achievement.fail.desc': 'Reach the defeat ending',
			'achievement.empire.name': 'French Empire', 'achievement.empire.desc': 'Reach the secret ending',
			'achievement.rise.name': 'Failure Teaches Success', 'achievement.rise.desc': 'After four consecutive defeats on one level, clear it with three stars',
			'group.title': 'The Team', 'group.subtitle': 'Meet the six contributors and visit their profile pages (roles are listed in group.md)',
			'group.more': 'View profile →', 'group.back': '← Back to home',
			'group.role1': 'Project Manager · Programmer · CIO', 'group.role2': 'Programmer · UI · Documentation',
			'group.role3': 'Programmer · Photography · Video Editing', 'group.role4': 'Programmer · Video Editing · Art',
			'group.role5': 'UI · Art · Documentation', 'group.role6': 'Video Editing · Art',
			'ending.standardTitle': 'Ending · The Road to Waterloo', 'ending.standardSub': 'Victory at Ligny failed to destroy the Prussian army',
			'ending.standard1': 'Gourgaud: Ney failed to take Quatre Bras. After learning of the Prussian defeat at Ligny, Wellington withdrew to the Mont-Saint-Jean ridge.',
			'ending.standard2': 'Napoleon: Order Grouchy to pursue. If the Prussians cannot unite with Wellington, we can still defeat them separately.',
			'ending.standard3': 'Courier: The Prussians did not flee east. They kept their formations and withdrew north toward Wavre.',
			'ending.standard4': 'Napoleon: Then let the army rest. Tomorrow we must break Mont-Saint-Jean before the allied armies can join hands again.',
			'ending.standard5': 'Battlefield Chronicle: On 18 June 1815, wet ground delayed the French attack, the Prussians reached Waterloo, and the Imperial Guard was repulsed. Napoleon abdicated four days later.',
			'ending.standardNote': '(Standard ending: the story returns to recorded history. Another possibility remains hidden on the campaign map.)',
			'ending.failTitle': 'Ending · Napoleon Falls Early', 'ending.failSub': 'History takes an unexpected turn…',
			'ending.fail1': 'Napoleon: No… impossible. We have lost only one small battle!',
			'ending.fail2': 'Aide-de-camp: Sire, the Coalition is gathering, and troubling news has reached us from Paris.',
			'ending.fail3': 'Napoleon: Give me one more chance, and I will make them remember the name of France.',
			'ending.failNote': 'The defeat is final, and Napoleon’s early fall enters the record—but history can be attempted again.',
			'ending.failBack': 'Return to Campaign Command',
			'ending.destinyTitle': 'Secret Defeat · Fate Cannot Be Changed', 'ending.destinySub': 'You escaped the history books, but not fate…',
			'ending.destiny1': 'Napoleon: Waterloo again… I was certain I had avoided the rain of that day.',
			'ending.destiny2': 'Aide-de-camp: Sire, we did take another road—but fate itself still waited at its end.',
			'ending.destiny3': 'Napoleon: …So some endings cannot be rewritten, even with a second chance.',
			'ending.destinyNote': '(Even on the secret route, defeat in Level 7 returns history to its original course.)',
			'ending.destinyRetry': 'Fight Level 7 Again',
			'ending.empireTitle': 'Secret Ending · Napoleon Rules Europe', 'ending.empireSub': 'You have torn open another page of history…',
			'ending.empire1': 'Napoleon: The Coalition has collapsed. Wellington’s telescope lies in the mud, and no one will raise it again.',
			'ending.empire2': 'Aide-de-camp: Sire, messages from London, Berlin, and Vienna all travel in one direction—to submit to you.',
			'ending.empire3': 'Napoleon: Europe? No. From this moment, Europe is France—and France is me.',
			'ending.empire4': 'Courier (in the distance): Hail the Emperor—long live the Empire!',
			'ending.empireNote': '(Secret ending: Napoleon rules Europe—a history that was never written.)',
			'ending.empireRestart': 'Begin Again from the First Campaign',
			'ending.backMenu': 'Back to Campaign Command', 'ending.logout': 'Log Out', 'ending.restart': 'Restart from the Beginning'
		}
	};

	/* 剧情及关卡文字的英语译文。原中文仍保存在 levels.js，避免战斗配置和文本耦合。 */
	var CONTENT_EN = {
		'第 1 关 · 破晓防线': 'Level 1 · The Dawn Line',
		'第一关 · 破晓防线': 'Level 1 · The Dawn Line',
		'第一幕 · 鹰旗初升': 'Act I · The Eagle Rises',
		'乌尔姆近郊 · 1805': 'Near Ulm · 1805',
		'第 2 关 · 炮火走廊': 'Level 2 · Corridor of Fire',
		'第二关 · 炮火走廊': 'Level 2 · Corridor of Fire',
		'第二幕 · 雷霆之声': 'Act II · Voice of Thunder',
		'耶拿前线 · 1806': 'Jena Front · 1806',
		'第 3 关 · 雪原突骑': 'Level 3 · Charge Across the Snow',
		'第 3 关 · 晨雾突骑': 'Level 3 · Charge Through the Morning Fog',
		'第三关 · 雪原突骑': 'Level 3 · Charge Across the Snow',
		'第三幕 · 风雪疾驰': 'Act III · Riding Through the Storm',
		'东普鲁士 · 1807': 'East Prussia · 1807',
		'第 4 关 · 血肉方阵': 'Level 4 · The Living Square',
		'第 4 关 · 双胜逐猎': 'Level 4 · Pursuit After the Double Victory',
		'第四关 · 血肉方阵': 'Level 4 · The Living Square',
		'第四幕 · 方阵如墙': 'Act IV · A Wall of Men',
		'多瑙河畔 · 1809': 'The Danube · 1809',
		'第 5 关 · 铁血强攻': 'Level 5 · Iron Assault',
		'第 5 关 · 烈焰攻坚': 'Level 5 · Assault Through the Flames',
		'第五关 · 铁血强攻': 'Level 5 · Iron Assault',
		'第五幕 · 漫长东征': 'Act V · The Long Eastern March',
		'斯摩棱斯克以西 · 1812': 'West of Smolensk · 1812',
		'第 6 关 · 决战前夜': 'Level 6 · Eve of Decision',
		'第 6 关 · 利尼决战': 'Level 6 · Battle of Ligny',
		'第六关 · 决战前夜': 'Level 6 · Eve of Decision',
		'第六幕 · 雨云之下': 'Act VI · Beneath the Storm Clouds',
		'滑铁卢南方 · 1815': 'South of Waterloo · 1815',
		'第 7 关 · 帝国黄昏（隐藏）': 'Level 7 · Twilight of the Empire (Secret)',
		'第 7 关 · 滑铁卢改写（隐藏）': 'Level 7 · Waterloo Rewritten (Secret)',
		'第七关 · 帝国黄昏（隐藏）': 'Level 7 · Twilight of the Empire (Secret)',
		'终幕 · 未写之史': 'Finale · The Unwritten History',
		'另一条时间线 · 1815': 'Another Timeline · 1815',
		'拿破仑': 'Napoleon', '萨瓦里': 'Savary', '副官': 'Aide-de-camp', '传令兵': 'Courier', '联军司令': 'Coalition Commander',
		'法兰西皇帝': 'Emperor of the French', '帝国参谋部': 'Imperial General Staff',
		'近卫骑兵通讯队': 'Guard Cavalry Dispatch Corps', '联军战地指挥部': 'Coalition Field Command',
		'最后的联军防线': 'Last Coalition Line',
		'选中己方步兵，再点击空地即可下达持续移动命令。中路守军不会主动移动；先分散接近，再逐个突破。': 'Select your infantry, then click open ground to issue a continuing move order. The center defenders will hold position; approach from several directions and defeat them one by one.',
		'炮兵射程远、伤害高，但移动缓慢。用步兵掩护己方火炮，同时避开敌方右翼火炮四格以内的射界。': 'Artillery has long range and heavy damage, but moves slowly. Screen your guns with infantry and stay outside the four-tile reach of the enemy battery on the right.',
		'骑兵速度快、攻击高，却不适合被围攻。敌军会追击最近的目标；保持部队相互策应，用骑兵撕开缺口后及时脱离。': 'Cavalry is fast and powerful, but vulnerable when surrounded. The enemy pursues the nearest target; keep your units supporting one another and pull the cavalry out after opening a gap.',
		'掷弹兵生命高，适合承担前排压力；散兵可在外围射击。敌军会围绕中央核心抱团，不要正面挤入，用远程单位从外圈消耗。': 'Grenadiers can absorb pressure at the front while skirmishers fire from the perimeter. The enemy clusters around its center; wear it down from outside instead of forcing your way into the mass.',
		'本关兵种齐全。敌军会优先集火攻击力最高的单位；炮兵和骑兵尤其危险，应让步兵、掷弹兵挡住接近路线。': 'Every unit type is available. The enemy focuses on your strongest attackers, making artillery and cavalry prime targets; use infantry and grenadiers to block the approaches.',
		'敌军会优先攻击生命最低的单位。让残血部队撤到阵型后方，由状态完整的部队接替前线；保留每一支可战力量。': 'The enemy targets the unit with the lowest health. Pull wounded troops behind the formation and rotate fresh units into the line; preserve every force still able to fight.',
		'敌军旧卫队会围绕核心结成紧密阵线。不要平均消耗兵力；集中撕开核心，才能让整支部队失去依托并改写终局。': 'The enemy Old Guard forms a tight line around its core. Do not spread your damage evenly—break the center so the whole formation loses its anchor and history can be rewritten.',
		'看见山脊上的火光了吗？敌军以为守住中央，就能拦住整支大军。': 'Do you see the fires on the ridge? The enemy believes that holding the center will stop an entire army.',
		'他们已经下令死守，陛下。一步也不准备后退。': 'They have orders to hold at all costs, Sire. They do not intend to yield a single step.',
		'不肯移动的防线，只是一扇等着被推开的门。让步兵从两翼靠近，今天由我们写下第一行战报。': 'A line that refuses to move is merely a door waiting to be pushed open. Send the infantry around both flanks; today we write the first line of the dispatch.',
		'陛下，雨后的道路陷住了弹药车。我们的炮兵还没来得及展开，敌军已经逼近。': 'Sire, the rain-soaked road has trapped the ammunition wagons. The enemy is closing before our guns can deploy.',
		'一门摆正位置的火炮，胜过一整排仓促冲锋的步兵。': 'One gun properly placed is worth an entire rank of infantry charging in haste.',
		'那么步兵的任务，是替炮兵争取时间？': 'Then the infantry must buy time for the guns?',
		'正是。守住雷霆，雷霆自然会替我们打开道路。': 'Precisely. Protect the thunder, and the thunder will open the road for us.',
		'陛下！风雪遮住了敌军的旗号，但他们的右翼正在重新集结。缺口只会维持片刻。': 'Sire! The snow hides their colors, but the enemy right is reforming. The gap will last only moments.',
		'片刻已经足够。骑兵需要的从来不是一条大道，只是一道缝隙。': 'Moments are enough. Cavalry has never needed a broad road—only a narrow opening.',
		'我这就把命令送到前线。': 'I will carry the order to the front at once.',
		'告诉他们：冲进去，但不要停在那里。速度既是长矛，也是盾牌。': 'Tell them: charge through, but do not remain there. Speed is both lance and shield.',
		'以中央掷弹兵为轴，收紧队列。法国人若想靠近，就必须撞上整座方阵。': 'Close ranks around the grenadiers at the center. If the French approach, they must collide with the whole square.',
		'他把士兵叠成了一堵墙，也把他们困进了同一个口袋。': 'He has stacked his soldiers into a wall—and trapped them all in the same pocket.',
		'散兵已经绕到外圈，掷弹兵等候您的命令。': 'The skirmishers are moving around the perimeter, and the grenadiers await your order.',
		'用最坚固的人钉住它，再让子弹一层层剥开它。墙不必推倒，也可以被拆掉。': 'Pin it with our strongest men, then let bullets strip it layer by layer. A wall need not be toppled when it can be dismantled.',
		'陛下，敌军没有扑向中央。他们在追逐我们的骑兵和炮兵，像是早已看穿了火力部署。': 'Sire, the enemy is not striking the center. They are hunting our cavalry and guns as though they already understand our fire plan.',
		'他们看见了最锋利的剑，却忘了剑也有护手。': 'They see the sharpest blade and forget that every sword has a guard.',
		'我会命令步兵收拢，在高攻部队前建立屏障。': 'I will close the infantry ranks and build a screen before our strongest units.',
		'很好。让他们为每一步接近付出代价，然后用我们保存下来的火力结束战斗。': 'Good. Make them pay for every step, then end the battle with the firepower we preserve.',
		'雨会拖慢所有人。找到法国阵线中最虚弱的一点，持续施压，直到它断裂。': 'The rain will slow everyone. Find the weakest point in the French line and press it until it breaks.',
		'陛下，斥候判断敌军在搜寻我们的伤兵。他们会追着最弱的部队不放。': 'Sire, our scouts believe the enemy is hunting our wounded. They will pursue the weakest unit without pause.',
		'那就别给他一个固定的伤口。伤兵后撤，预备队补位，让整条阵线像活的一样呼吸。': 'Then give him no fixed wound. Withdraw the injured, rotate in the reserve, and let the whole line breathe like a living thing.',
		'天亮后，一切都会在这里决定。': 'At dawn, everything will be decided here.',
		'不，是从现在的每一道命令开始决定。': 'No. It is being decided by every order we give now.',
		'陛下……地图上的道路变了。我们越过了史书最后标出的界线，却又看见了滑铁卢。': 'Sire… the roads on the map have changed. We crossed the last line marked by history, yet Waterloo lies before us again.',
		'历史只是胜利者装订成册的战报。既然来到空白的一页，我们就亲自落笔。': 'History is only the victor’s dispatch bound into a book. We have reached a blank page; now we write it ourselves.',
		'旧卫队会守住核心。无论你从哪一页归来，这里都将是帝国的终点。': 'The Old Guard will hold the center. Whatever page you returned from, this will be the end of your empire.',
		'终点？不。今天，我们只把它称作黄昏——因为黄昏之后，仍可能有新的黎明。': 'The end? No. Today we call it only twilight—for beyond twilight, another dawn may still rise.',
		'……帝国第二次折戟于此，命运没有给历史第二次机会。': '…The Empire has broken here a second time. Fate has denied history another chance.'
	};

	var CONTENT_ZH = {
		'Some battles you win, some you lose.': '胜败乃兵家常事。',
		'Concentrate a superior force to destroy the enemy forces one by one.': '集中优势兵力，逐个击破敌军。',
		'Use artillery and infantry together properly is the key to win.': '让炮兵与步兵相互配合，是取胜的关键。',
		'The enemy is coming to you — pick your ground and hit them where they are spread out.': '敌军正在逼近——选好战场，在其阵线分散处发动攻击。',
		'Do not dive into the enemy square — let your guns and skirmishers soften it first.': '不要贸然闯入敌方方阵——先让炮兵和散兵削弱它。',
		'Your cannons and cavalry draw the enemy fire — screen them with infantry and grenadiers.': '炮兵和骑兵会吸引敌军火力——用步兵与掷弹兵掩护他们。',
		'The enemy hunts the wounded — keep your damaged units behind your line.': '敌军会追击伤兵——把受损部队撤到阵线后方。',
		'Break the heart of the square, and the rest will crumble.': '击破方阵核心，其余防线便会随之崩溃。'
	};

	/* 只转换本项目会出现的常用字；有歧义的“里/干”等字不做全局替换。 */
	var TRADITIONAL_CHARS = {
		'仑':'崙','战':'戰','争':'爭','关':'關','线':'線','鹰':'鷹','乌':'烏','尔':'爾','郊':'郊','选':'選','军':'軍','击':'擊',
		'动':'動','开':'開','门':'門','让':'讓','个':'個','写':'寫','炮':'砲','伤':'傷','缓':'緩','护':'護','敌':'敵','边':'邊','骑':'騎',
		'围':'圍','会':'會','进':'進','时':'時','阵':'陣','墙':'牆','掷':'擲','弹':'彈','从':'從','层':'層','强':'強','齐':'齊','优':'優',
		'单':'單','应':'應','东':'東','棱':'稜','长':'長','决':'決','云':'雲','陆':'陸','残':'殘','血':'血','队':'隊','线':'線','旧':'舊',
		'紧':'緊','损':'損','历':'歷','史':'史','书':'書','页':'頁','见':'見','吗':'嗎','为':'為','挡':'擋','备':'備','报':'報','经':'經',
		'过':'過','准':'準','退':'退','两':'兩','来':'來','车':'車','还':'還','没':'沒','摆':'擺','胜':'勝','么':'麼','间':'間','够':'夠',
		'缝':'縫','隙':'隙','这':'這','将':'將','发':'發','现':'現','与':'與','压':'壓','阶':'階','围':'圍','绕':'繞','坚':'堅','弹':'彈',
		'们':'們','忘':'忘','护':'護','会':'會','显':'顯','减':'減','择':'擇','错':'錯','码':'碼','号':'號','录':'錄','册':'冊','换':'換',
		'览':'覽','输':'輸','认':'認','账':'帳','浏':'瀏','丢':'丟','复':'復','档':'檔','载':'載','盖':'蓋','删':'刪','锁':'鎖','继':'繼',
		'续':'續','读':'讀','储':'儲','灭':'滅','获':'獲','剩':'剩','统':'統','帅':'帥','线':'線','达':'達','败':'敗','势':'勢','该':'該',
		'兰':'蘭','济':'濟','罗':'羅','伦':'倫','压':'壓','麦':'麥','达':'達','隐':'隱','势':'勢','归':'歸','欢':'歡','称':'稱','电':'電',
		'统':'統','从':'從','头':'頭','团':'團','员':'員','简':'簡','介':'介','项':'項','绍':'紹','编':'編','辑':'輯','摄':'攝','术':'術',
		'晓':'曉','点':'點','拦':'攔','后':'後','着':'著','声':'聲','远':'遠','内':'內','药':'藥','仓':'倉','冲':'衝','锋':'鋒',
		'务':'務','风':'風','驰':'馳','鲁':'魯','却':'卻','适':'適','标':'標','脱':'脫','离':'離','传':'傳','结':'結','维':'維',
		'条':'條','诉':'訴','担':'擔','挤':'擠','联':'聯','轴':'軸','国':'國','须':'須','叠':'疊','钉':'釘','剥':'剝',
		'铁':'鐵','种':'種','险':'險','扑':'撲','剑':'劍','拢':'攏','价':'價','束':'束','斗':'鬥','卢':'盧','状':'狀','态':'態',
		'虚':'虛','断':'斷','寻':'尋','别':'別','给':'給','预':'預','补':'補','样':'樣','黄':'黃','终':'終','卫':'衛','并':'並',
		'图':'圖','变':'變','装':'裝','订':'訂','亲':'親','笔':'筆','无':'無','论':'論','参':'參','谋':'謀','挥':'揮','讯':'訊',
		'处':'處','征':'徵','顾':'顧','计':'計','资':'資',
		/* 2026-09-16：按全站文本（levels 剧情/dialog/game8/结局页/小组页等）补齐缺字。
		   有歧义的字走上面的词组表（里/台/几/尽/获/卷/冲/游/只 等），这里只放全局安全的单字。 */
		'当':'當','里':'裡','戏':'戲','请':'請','红':'紅','余':'餘','户':'戶',
		'欧':'歐','运':'運','确':'確','场':'場','记':'記','机':'機','于':'於',
		'顿':'頓','灵':'靈','双':'雙','溃':'潰','实':'實','组':'組','连':'連',
		'莱':'萊','圣':'聖','对':'對','启':'啟','节':'節','雾':'霧','萨':'薩',
		'盘':'盤','闭':'閉','剧':'劇','毁':'毀','诺':'諾','奥':'奧','赶':'趕',
		'猎':'獵','舰':'艦','夺':'奪','歼':'殲','数':'數','轮':'輪','转':'轉',
		'胁':'脅','岁':'歲','络':'絡','侧':'側','级':'級','帧':'幀','垒':'壘',
		'湾':'灣','顶':'頂','牵':'牽','总':'總','稳':'穩','纳':'納','网':'網',
		'随':'隨','吕':'呂','议':'議','误':'誤','话':'話','愿':'願','锚':'錨',
		'赢':'贏','库':'庫','领':'領','抢':'搶','几':'幾','马':'馬','顺':'順',
		'调':'調','宽':'寬','骤':'驟','带':'帶','属':'屬','惨':'慘','键':'鍵',
		'区':'區','湿':'濕','弯':'彎','尽':'盡','轨':'軌','镜':'鏡','捡':'撿',
		'钮':'鈕','毕':'畢','钥':'鑰','临':'臨','浓':'濃','占':'佔','张':'張',
		'纵':'縱','烧':'燒','聂':'聶','桥':'橋','杀':'殺','环':'環','负':'負',
		'体':'體','语':'語','讨':'討','设':'設','径':'徑','题':'題','专':'專',
		'党':'黨','乱':'亂','听':'聽','础':'礎','积':'積','缘':'緣','沟':'溝',
		'满':'滿','侦':'偵','块':'塊','庆':'慶','协':'協','刚':'剛','脚':'腳',
		'赛':'賽','观':'觀','瞩':'矚','夹':'夾','独':'獨','气':'氣','热':'熱',
		'苏':'蘇','玛':'瑪','链':'鏈','义':'義','虏':'虜','则':'則','试':'試',
		'粮':'糧','烬':'燼','肃':'肅','万':'萬','横':'橫','弃':'棄','坠':'墜',
		'扩':'擴','规':'規','划':'劃','浆':'漿','庄':'莊','园':'園','摇':'搖',
		'触':'觸','帜':'幟','坟':'墳','阳':'陽','圆':'圓','类':'類','据':'據',
		'责':'責','驻':'駐','范':'範','绝':'絕','蓝':'藍','贸':'貿','闯':'闖',
		'软':'軟','荣':'榮','誉':'譽','谭':'譚','吴':'吳','陈':'陳','台':'臺',
		'杂':'雜','词':'詞','柜':'櫃','缴':'繳'
	};

	function readSetting(key, fallback) {
		try { return localStorage.getItem(key) || fallback; }
		catch (e) { return fallback; }
	}

	function writeSetting(key, value) {
		try { localStorage.setItem(key, value); }
		catch (e) { /* 隐私模式禁止存储时，本次会话仍可使用。 */ }
	}

	function fillTemplate(value, vars) {
		return String(value).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, name) {
			return vars && vars[name] !== undefined ? String(vars[name]) : '';
		});
	}

	function toTraditional(value) {
		var phrases = {
			'拿破仑':'拿破崙', '这里':'這裡', '那里':'那裡', '公里':'公里', '皇后':'皇后',
			'用户名':'使用者名稱', '登录':'登入', '注册':'註冊', '账号':'帳號', '软件':'軟體',
			'信息':'資訊', '里面':'裡面', '本地':'本機', '缓存':'快取', '保存':'儲存',
			'游戏':'遊戲', '复杂':'複雜', '占领':'佔領', '占据':'佔據', '抢占':'搶佔',
			'哪里':'哪裡', '这里':'這裡', '那里':'那裡', '夜里':'夜裡', '泥里':'泥裡',
			'公里':'公里', '里程':'里程', '其余':'其餘', '残余':'殘餘', '余波':'餘波',
			'炮台':'砲臺', '台词':'臺詞', '柜台':'櫃檯', '台湾':'臺灣',
			'一只':'一隻', '船只':'船隻', '几乎':'幾乎', '几时':'幾時',
			'尽管':'儘管', '尽快':'儘快', '尽量':'儘量',
			'收获':'收穫', '缴获':'繳獲', '收复':'收復', '回复':'回覆',
			'老板':'老闆', '面板':'面板', '注意':'注意', '注册':'註冊',
			'卷入':'捲入', '卷土':'捲土', '试卷':'試卷',
			'冲锋':'衝鋒', '冲刺':'衝刺', '游击':'游擊', '游泳':'游泳'
		};
		var result = String(value);
		Object.keys(phrases).forEach(function (key) { result = result.split(key).join(phrases[key]); });
		return Array.from(result).map(function (ch) { return TRADITIONAL_CHARS[ch] || ch; }).join('');
	}

	function uiLanguage() { return currentLanguage; }

	function uiT(key, vars, fallback) {
		var table = MESSAGES[currentLanguage] || MESSAGES['zh-CN'];
		var value = table[key];
		var needTrad = false;
		if (value === undefined) { value = MESSAGES['zh-CN'][key]; needTrad = (currentLanguage === 'zh-TW'); }
		if (value === undefined) { value = fallback !== undefined ? fallback : key; needTrad = (currentLanguage === 'zh-TW'); }
		if (needTrad && typeof value === 'string') value = toTraditional(value);
		return fillTemplate(value, vars || {});
	}

	function uiLocalize(value) {
		if (typeof value === 'function') return uiLocalize(value());
		if (value === null || value === undefined) return '';
		if (typeof value === 'object') {
			var selected = value[currentLanguage];
			if (selected === undefined && currentLanguage === 'zh-TW') selected = value['zh-CN'];
			if (selected === undefined) selected = value['zh-CN'];
			if (selected === undefined) selected = value.en;
			return currentLanguage === 'zh-TW' ? toTraditional(selected || '') : String(selected || '');
		}
		var text = String(value);
		if (currentLanguage === 'en') return CONTENT_EN[text] || text;
		if (currentLanguage === 'zh-TW') return toTraditional(CONTENT_ZH[text] || text);
		return CONTENT_ZH[text] || text;
	}

	function applyUiTranslations(root) {
		root = root || document;
		root.querySelectorAll('[data-i18n]').forEach(function (el) {
			el.textContent = uiT(el.dataset.i18n);
		});
		root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
			el.placeholder = uiT(el.dataset.i18nPlaceholder);
		});
		root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
			el.title = uiT(el.dataset.i18nTitle);
		});
		root.querySelectorAll('[data-localize]').forEach(function (el) {
			if (!el.dataset.localizeSource) el.dataset.localizeSource = el.textContent.trim();
			el.textContent = uiLocalize(el.dataset.localizeSource);
		});
		if (document.body && document.body.dataset.titleI18n) document.title = uiT(document.body.dataset.titleI18n);
		updateToolbar();
		updatePasswordLabels();
	}

	function setLanguage(language) {
		if (SUPPORTED_LANGUAGES.indexOf(language) === -1) return;
		currentLanguage = language;
		writeSetting(LANGUAGE_KEY, language);
		document.documentElement.lang = language;
		applyUiTranslations(document);
		window.dispatchEvent(new CustomEvent('ui:languagechange', { detail: { language: language } }));
	}

	function applyTheme() {
		document.documentElement.dataset.theme = currentTheme;
		document.documentElement.style.colorScheme = currentTheme === 'dark' ? 'dark' : 'light';
		updateToolbar();
	}

	function toggleTheme() {
		currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
		writeSetting(THEME_KEY, currentTheme);
		document.documentElement.classList.remove('theme-switching');
		void document.documentElement.offsetWidth;
		document.documentElement.classList.add('theme-switching');
		applyTheme();
		window.setTimeout(function () { document.documentElement.classList.remove('theme-switching'); }, 620);
	}

	function updateToolbar() {
		var select = document.getElementById('ui-language');
		if (select) { select.value = currentLanguage; select.setAttribute('aria-label', uiT('ui.language')); }
		var button = document.getElementById('ui-theme');
		if (button) {
			var isDark = currentTheme === 'dark';
			button.textContent = isDark ? '☀' : '☾';
			button.title = uiT(isDark ? 'ui.lightMode' : 'ui.darkMode');
			button.setAttribute('aria-label', button.title);
			button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
		}
		var sound = document.getElementById('ui-sound');
		if (sound) {
			var muted = typeof window.isBgmMuted === 'function' ? window.isBgmMuted() : false;
			sound.innerHTML = muted
				? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path class="sound-slash" d="M17 9l5 6M22 9l-5 6"></path></svg>'
				: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path class="sound-wave" d="M16 8.2a5 5 0 010 7.6M18.7 5.5a8.8 8.8 0 010 13"></path></svg>';
			sound.title = uiT(muted ? 'ui.soundOn' : 'ui.soundOff');
			sound.setAttribute('aria-label', sound.title);
			sound.setAttribute('aria-pressed', muted ? 'true' : 'false');
		}
	}

	function createToolbar() {
		if (document.getElementById('ui-toolbar')) return;
		var bar = document.createElement('div');
		bar.id = 'ui-toolbar';
		bar.className = 'ui-toolbar';

		var select = document.createElement('select');
		select.id = 'ui-language';
		select.className = 'ui-language';
		[
			{ value: 'zh-CN', label: '简体中文' },
			{ value: 'zh-TW', label: '繁體中文' },
			{ value: 'en', label: 'English' }
		].forEach(function (item) {
			var option = document.createElement('option');
			option.value = item.value;
			option.textContent = item.label;
			select.appendChild(option);
		});
		select.addEventListener('change', function () { setLanguage(select.value); });

		var theme = document.createElement('button');
		theme.id = 'ui-theme';
		theme.className = 'ui-theme';
		theme.type = 'button';
		theme.addEventListener('click', toggleTheme);

		bar.appendChild(select);
		if (document.querySelector('audio')) {
			var sound = document.createElement('button');
			sound.id = 'ui-sound';
			sound.className = 'ui-sound';
			sound.type = 'button';
			sound.addEventListener('click', function () {
				if (typeof window.toggleBgmMuted === 'function') window.toggleBgmMuted();
				updateToolbar();
			});
			bar.appendChild(sound);
		}
		bar.appendChild(theme);
		document.body.appendChild(bar);
		updateToolbar();
	}

	function eyeSvg() {
		return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
			'<path d="M2.2 12s3.5-6 9.8-6 9.8 6 9.8 6-3.5 6-9.8 6-9.8-6-9.8-6Z"></path>' +
			'<circle cx="12" cy="12" r="2.7"></circle>' +
			'<path class="eye-slash" d="M4 4l16 16"></path></svg>';
	}

	function addPasswordToggle(input) {
		if (!input || input.dataset.eyeReady === 'true') return;
		input.dataset.eyeReady = 'true';
		var wrapper = document.createElement('span');
		wrapper.className = 'password-field';
		input.parentNode.insertBefore(wrapper, input);
		wrapper.appendChild(input);
		var button = document.createElement('button');
		button.type = 'button';
		button.className = 'password-toggle';
		button.innerHTML = eyeSvg();
		button.setAttribute('aria-pressed', 'false');
		button.addEventListener('click', function () {
			var visible = input.type === 'text';
			input.type = visible ? 'password' : 'text';
			button.classList.toggle('is-visible', !visible);
			button.setAttribute('aria-pressed', visible ? 'false' : 'true');
			updatePasswordLabels();
			input.focus();
		});
		wrapper.appendChild(button);
	}

	function updatePasswordLabels() {
		document.querySelectorAll('.password-toggle').forEach(function (button) {
			var input = button.parentNode.querySelector('input');
			var visible = input && input.type === 'text';
			button.title = uiT(visible ? 'ui.hidePassword' : 'ui.showPassword');
			button.setAttribute('aria-label', button.title);
		});
	}

	function showUiNotice(value, kind) {
		var region = document.getElementById('ui-notices');
		if (!region) {
			region = document.createElement('div');
			region.id = 'ui-notices';
			region.className = 'ui-notices';
			region.setAttribute('aria-live', 'polite');
			document.body.appendChild(region);
		}
		var item = document.createElement('div');
		item.className = 'ui-notice' + (kind ? ' ui-notice--' + kind : '');
		var text = document.createElement('span');
		text.textContent = uiLocalize(value);
		var close = document.createElement('button');
		close.type = 'button';
		close.textContent = '×';
		close.title = uiT('ui.close');
		close.setAttribute('aria-label', close.title);
		close.addEventListener('click', function () { item.remove(); });
		item.appendChild(text);
		item.appendChild(close);
		region.appendChild(item);
		setTimeout(function () { if (item.isConnected) item.remove(); }, 5200);
		return item;
	}

	function bindButtonFeedback() {
		document.addEventListener('click', function (event) {
			var control = event.target.closest('button, .game-btn, .level-btn, .menu-link, .turn-button, .result-button, .ui-btn');
			if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
			control.classList.remove('ui-clicked');
			void control.offsetWidth;
			control.classList.add('ui-clicked');
			window.setTimeout(function () { control.classList.remove('ui-clicked'); }, 420);
		});
	}

	function initUi() {
		document.documentElement.lang = currentLanguage;
		applyTheme();
		createToolbar();
		document.querySelectorAll('input[type="password"]').forEach(addPasswordToggle);
		applyUiTranslations(document);
		bindButtonFeedback();
	}

	document.documentElement.dataset.theme = currentTheme;
	document.documentElement.lang = currentLanguage;
	window.uiLanguage = uiLanguage;
	window.uiT = uiT;
	window.uiLocalize = uiLocalize;
	window.applyUiTranslations = applyUiTranslations;
	window.setUiLanguage = setLanguage;
	window.showUiNotice = showUiNotice;
	window.addEventListener('bgm:statechange', updateToolbar);

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi);
	else initUi();
	function makeEl(tag, cls) {
		var el = document.createElement(tag);
		if (cls) el.className = cls;
		return el;
	}

	function stack(id, cls) {
		var box = document.getElementById(id);
		if (!box) {
			box = makeEl('div', cls);
			box.id = id;
			document.body.appendChild(box);
		}
		return box;
	}

	function enter(node) {
		window.requestAnimationFrame(function () { node.classList.add('is-in'); });
	}

	function leave(node, ms) {
		node.classList.remove('is-in');
		window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, ms || 240);
	}

	/* 底部轻提示 */
	function toast(msg, ms) {
		if (typeof document === 'undefined' || !document.body) { try { alert(msg); } catch (e) { } return null; }
		var box = stack('ui-toast-stack', 'ui-toast-stack');
		var node = makeEl('div', 'ui-toast');
		node.textContent = msg;
		box.appendChild(node);
		enter(node);
		window.setTimeout(function () { leave(node); }, ms || 2600);
		return node;
	}

	/* 右上角浮动提示（成就 / 解锁） */
	function achievementToast(title, desc, ms) {
		if (typeof document === 'undefined' || !document.body) {
			try { alert(title + (desc ? '\n' + desc : '')); } catch (e) { }
			return null;
		}
		var box = stack('ui-achv-stack', 'ui-achv-stack');
		var node = makeEl('div', 'ui-achv');
		var head = makeEl('div', 'ui-achv-title');
		head.textContent = '★ ' + title;
		node.appendChild(head);
		if (desc) {
			var body = makeEl('div', 'ui-achv-desc');
			body.textContent = desc;
			node.appendChild(body);
		}
		node.title = '点击关闭';
		node.addEventListener('click', function () { leave(node); });
		box.appendChild(node);
		enter(node);
		window.setTimeout(function () { leave(node); }, ms || 4500);
		return node;
	}

	/* 卡片式弹窗：buttons = [{ text, kind, onPick }]
	 *
	 * 这是一个"真模态"：
	 *   · 打开时给 body 加 .ui-modal-open（见 style.css：背景不可交互 / 不可滚动）；
	 *   · Tab / Shift+Tab 的焦点被锁在弹窗内（B08：以前 Tab 能跑到背景的"下一步"上）；
	 *   · 关闭时把焦点还给打开前的元素；
	 *   · 所有关闭途径（按钮 / Esc / 点遮罩）都走同一个 close()，
	 *     并执行 onDismiss 收尾回调 —— B12：通知框的 onClose 以前只有点按钮才跑，
	 *     Esc 关掉锁定提示后会停在空白战场页。
	 *   ⚠️ onDismiss 只在"没有点任何按钮"的关闭途径（Esc / 点遮罩）执行；
	 *     按钮自己的 onPick 负责它那条路径的收尾，两者不重复执行。 */
	function buildModal(msg, buttons, onDismiss) {
		if (typeof document === 'undefined' || !document.body) return null;
		var mask = makeEl('div', 'ui-modal-mask');
		var box = makeEl('div', 'ui-modal');
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		var text = makeEl('p', 'ui-modal-text');
		text.textContent = msg;
		var actions = makeEl('div', 'ui-modal-actions');
		var previousFocus = document.activeElement;
		var dismissed = false;

		function focusables() {
			return Array.prototype.filter.call(
				box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
				function (n) { return !n.disabled && n.offsetParent !== null; }
			);
		}

		function close(byUser) {
			document.removeEventListener('keydown', onKey, true);
			document.body.classList.remove('ui-modal-open');
			if (mask.parentNode) mask.parentNode.removeChild(mask);
			if (previousFocus && previousFocus.focus) {
				try { previousFocus.focus(); } catch (e) { }
			}
			if (byUser && !dismissed) {
				dismissed = true;
				if (typeof onDismiss === 'function') onDismiss();
			}
		}

		function onKey(e) {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				close(true);
				return;
			}
			if (e.key !== 'Tab') return;
			/* 焦点陷阱：把 Tab 循环限制在弹窗按钮之间。 */
			var list = focusables();
			if (!list.length) { e.preventDefault(); return; }
			var first = list[0], last = list[list.length - 1];
			var active = document.activeElement;
			if (!box.contains(active)) { e.preventDefault(); first.focus(); return; }
			if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
		}

		buttons.forEach(function (b) {
			var btn = makeEl('button', 'ui-btn' + (b.kind === 'primary' ? ' ui-btn--primary' : ''));
			btn.type = 'button';
			btn.textContent = b.text;
			btn.addEventListener('click', function () {
				dismissed = true;          /* 按钮路径自己收尾，别再跑 onDismiss */
				close(false);
				if (typeof b.onPick === 'function') b.onPick();
			});
			actions.appendChild(btn);
		});

		/* 点遮罩 = 取消（等同按 ESC） */
		mask.addEventListener('click', function (e) { if (e.target === mask) close(true); });
		/* 捕获阶段拦截：抢在页面级键盘监听（如回车=下一步）之前处理。 */
		document.addEventListener('keydown', onKey, true);

		box.appendChild(text);
		box.appendChild(actions);
		mask.appendChild(box);
		document.body.appendChild(mask);
		document.body.classList.add('ui-modal-open');
		var first = actions.querySelector('.ui-btn--primary') || actions.firstChild;
		if (first && first.focus) first.focus();
		return { mask: mask, close: function () { close(false); } };
	}

	/* 确认弹窗：仅"确定"时执行 onOk；取消 / Esc / 点遮罩都不执行 onOk。
	 * ⚠️ 不要把 onOk 复用成 onDismiss —— 取消绝不能执行破坏性操作。 */
	function modalConfirm(msg, onOk, opt) {
		opt = opt || {};
		if (typeof document === 'undefined' || !document.body) {
			var yes = true;
			try { yes = confirm(msg); } catch (e) { }
			if (yes && typeof onOk === 'function') onOk();
			return null;
		}
		return buildModal(msg, [
			{ text: opt.cancelText || uiT('common.cancel', null, '取消') },
			{ text: opt.okText || uiT('common.ok', null, '确定'), kind: 'primary', onPick: onOk }
		], opt.onDismiss);
	}

	/* 通知弹窗：只有"确定"。
	 * onClose 是"这个通知处理完了"的收尾，因此按钮、Esc、点遮罩三条路径都要执行
	 * （B12：未解锁的第 7 关按 Esc 关掉提示后，以前不会回主界面，页面停在空白战场）。 */
	function modalNotice(msg, onClose, opt) {
		opt = opt || {};
		if (typeof document === 'undefined' || !document.body) {
			try { alert(msg); } catch (e) { }
			if (typeof onClose === 'function') onClose();
			return null;
		}
		return buildModal(msg, [
			{ text: opt.okText || uiT('common.gotIt', null, '知道了'), kind: 'primary', onPick: onClose }
		], onClose);
	}

	window.toast = toast;
	window.achievementToast = achievementToast;
	window.modalConfirm = modalConfirm;
	window.modalNotice = modalNotice;
})();
