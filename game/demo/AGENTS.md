# 项目概况

这是一个简单的 web 小游戏项目。基于 html + css + js 打造的静态页面，无需构建工具。

玩法：棋盘上若干友方（`color: 'blue'`）与敌方（`color: 'red'`）棋子，每回合给蓝方设定移动目标点，点一次 Next Turn 内部同步跑 24 帧结算，方向在一回合内固定。**在给定回合内消灭所有红方即通关**；蓝方全灭 / 回合耗尽 / 第 4 关逃脱超限判负。

- 棋盘尺寸：各关 `gameN.js` 里的 `n × m`，目前都是 **10 × 10**。
- **5 个兵种**：步兵 / 炮兵 / 骑兵 / 散兵 / 掷弹兵，数值见「兵种设计」。
- 引擎逻辑看 `js/main.js`；跨关卡信息看 `js/levels.js`；各关棋子配置在各自的 `js/gameN.js`。

**规模（按当前仓库实际文件）**：根目录 HTML **17** 个 + `members/` **6** 个 = 23 个页面；JS **22** 个、**7798** 行；CSS 1 个、**2462** 行；图片 **23** 个（含 `img/europe-map.svg`）；音频 **5** 首。

## 工作方式（必须遵守）

- 这是一个小学期项目，游戏**非常简单**：做尽可能少的修改，**动手之前先汇报**；可以小幅重构，但要采用破坏最小的方式。
- **一次只做一项**，做完自测、把结论同步进本文件，再交给成员验收；每次验收都要给出**可核对的关键指标**（尺寸 / 计算样式 / 计数 / 断点）。
- 只访问本项目目录内的文件。棋子缺图时用文字占位（只给 `class`，`main.js` 会自动兜底）。
- 临时验证脚本 / 页面**用完即删**，不留进仓库（`img/europe-map.svg` 的生成脚本就是这样处理的）。

这是一款策略游戏，鼓励玩家摸清红方策略后针对性解题通关，并获取正反馈。

## 项目背景

以拿破仑战争作为背景。

- 失败结局：拿破仑提早失利
- 正常结局：同正史走向
- 隐藏结局：拿破仑统治欧洲

## 范围约定：忽略项目计划与所有有关文件

> **忽略项目计划与所有有关文件。** 具体指 `项目计划.md`、`项目计划.docx`、`项目计划.pdf`，以及 `docs/` 下与项目计划归档、设计文档配图、截图脚本相关的全部文件（`docs/项目计划_v1_上一版.*`、`docs/figs/*`、`docs/make_*.py`、`docs/shots/*` 等）。
>
> 1. 这些文件**不属于本项目的开发范围**，不作为工程依据；**本文件（`AGENTS.md`）是项目现状与工程约定的唯一来源**；
> 2. **不要为了这些文件去修改游戏代码**（页面 / JS / CSS / 素材都算），也不要因为它们的描述与代码不一致就去"对齐"代码；
> 3. 补全或维护本文件时，一律以仓库中**实际运行的代码与素材**为准，不引用上述文件的内容；
> 4. 上面这些文件如需调整，属于文档事务，与开发任务分开处理。

## 项目结构

> 下表中**不含**"范围约定"里要忽略的项目计划类文件。

```bash
.
├── index.html                # 主页：内嵌登录 + 注册/小组介绍入口（背景音乐 #index-music）
├── register.html             # 注册页（另开页面）
├── menu.html                 # 游戏主界面（70 余行）：页头 +「战役地图」#campaign-map +「读取存档」+ 导航
├── achievements.html         # 成就页（2026-09 独立成页，成就墙 #achv-area 在 .panel-card 里；页面只有「返回主界面」一个出口）
├── group.html                # 小组介绍页：6 个成员卡片 + 个人页链接
├── game1.html                # 第 1 关 破晓防线（20 回合）
├── game2.html                # 第 2 关 炮火走廊（25 回合）
├── game3.html                # 第 3 关 雪原突骑（18 回合，breakthrough）
├── game4.html                # 第 4 关 耶拿逐猎（20 回合，红方 flee 撤退结算）
├── game5.html                # 第 5 关 艰难攻坚（18 回合，红方站桩，按步数给星）
├── game6.html                # 第 6 关 铁血强攻（25 回合，集火最强蓝方）
├── game7.html                # 第 7 关 帝国黄昏（隐藏关，26 回合，cluster 抱团；入口带校验）
├── game8.html                # 测试关"最后防线 / 红线拦截战"（自带布阵与拖拽；未接入 levels.js/menu）
├── end-game.html             # 正常结局页（第 6 关通关后进）
├── fail.html                 # 失败结局页（任意关判负）
├── destiny-fail.html         # 第 7 关失败专属结局页
├── hidden-end.html           # 隐藏结局页（第 7 关通关后进）
├── mus/                      # 背景音乐 5 首，逐页分配（见「背景音乐」一节）
├── group.md                  # 角色分配
├── members/                  # 成员个人页（已完成）：6 个 HTML + 每人同名资源子目录
│   ├── TanYiqing.html  Lipengzhen.html  WuChenan.html
│   ├── ChenSixing.html ZhouYunhao.html  LiXinyu.html
│   └── tanyiqinq/ lipengzhen/ wuchenan/ chensixing/ zhouyunhao/ lixinyu/
├── css/
│   └── style.css             # 全局样式（2462 行）：基础 UI → 各 to-do 段 →「2026 UI 重制」→ 每关桌面再声明 → 2026-09 新增段
├── js/                       # 22 个文件、7798 行
│   ├── constants.js          # 兵种数值原型 + 图片常量 + loseTips 初值
│   ├── pieces.js             # 棋子 DOM 创建 / 移动落点（movePieceTo）
│   ├── arrow.js              # 常驻方向箭头
│   ├── dialog.js             # 立绘式剧情对话引擎 playDialogue()；顺带用 initBgm 起关卡背景音乐
│   ├── account.js            # 注册/登录/登出（localStorage 账号层）
│   ├── ui.js                 # UI 提示组件：toast / achievementToast / modalConfirm / modalNotice
│   ├── bgm.js                # 背景音乐统一入口 initBgm()：先尝试播放，被拦才退回"点击播放"
│   ├── save.js               # 存档层：a.save + save1~3；成就；隐藏路线判据；clearAuto / resetAutoSave
│   ├── main.js               # 引擎主体（约 3000 行）：回合、移动、攻击、选择、面板、范围圈、结算、进关流程
│   ├── fx.js                 # 表现层特效：开火烟雾 + 枪口火光 + 移动尾迹
│   ├── ai.js                 # 红方 AI：stationary / breakthrough / cluster / circle / flee
│   ├── levels.js             # 关卡注册表：顺序、标题、AI、hint、章节/立绘剧情、map{lon,lat}
│   ├── menu-saves.js         # 主界面：战役地图渲染 + 「读取存档」弹卡（含重新开始）
│   ├── menu-achv.js          # 成就墙渲染（供 achievements.html）
│   ├── game1.js … game7.js   # 各关棋子配置（一律用 constants.js 的常量）+ 末尾 loadGame / loadSnapshot
│   └── game8.js              # 测试关资源（约 2800 行；自带部署期、拖拽、红线结算，未接线）
├── img/                      # 23 个文件
│   ├── blue_infantry / blue_artillery / blue_cavalry / blue_skirmisher / blue_grenadier .png
│   ├── red_infantry / red_artillery / red_cavalry / red_grenadier .png  # 红方无散兵图（走文字占位）
│   ├── background1.png、backgrass1/2、backdis1/2、backice1/2 .png        # 每关棋盘桌面（style.css 末尾接管）
│   ├── europe-map.svg        # 主界面战役地图底图（37.9KB，viewBox 0 0 1000 785）
│   ├── level1-intro-1.png    # 第 1 关教程图①：选中/下令/攻击 四步操作
│   ├── level1-intro-2.png    # 第 1 关教程图②：步兵兵种介绍
│   └── portraits/            # 立绘 4 张：napoleon / adjutant / courier / coalition-commander
├── favicon.svg               # 网站图标
├── README.md                 # 项目文档（按"文档要求"7 问组织）
└── AGENTS.md                 # 本文件：项目现状 + 工程约定 + 验收清单
```

## 关卡配置一览

| 关 | 标题（`levels.js` 的 `name`） | 页面 | 回合 | 我方 | 敌方 | AI | 特殊结算 | 星级规则 |
|--|--|--|--|--|--|--|--|--|
| 1 | 第 1 关 · 破晓防线 | `game1.html` | 20 | 4 步 | 5 步 | 站桩 | — | 通用 |
| 2 | 第 2 关 · 炮火走廊 | `game2.html` | 25 | 1 步 1 炮 | 3 步 1 炮 | 站桩 | — | 通用 |
| 3 | 第 3 关 · 雪原突骑 | `game3.html` | 18 | 步 炮 散 骑 | 炮 步 步 步 骑 | `breakthrough` | — | 通用 |
| 4 | 第 4 关 · 耶拿逐猎 | `game4.html` | 20 | 6（掷 步 散 骑 掷 步） | 5 步 | `flee` → `{9.5,-0.5}` | `objective.type='retreat'` | 按逃脱数 |
| 5 | 第 5 关 · 艰难攻坚 | `game5.html` | 18 | 6（炮 骑 掷 步 步 散） | 8（掷 步×5 骑 炮） | 站桩 | — | 按通关步数 |
| 6 | 第 6 关 · 铁血强攻 | `game6.html` | 25 | 6（炮 骑 掷 步 步 散） | 6（炮 骑 步×4） | `breakthrough` + `threat:'strongest'` | — | 通用 |
| 7 | 第 7 关 · 帝国黄昏（隐藏） | `game7.html` | 26 | 6 | 8（掷×2 步×4 骑 炮） | `cluster` + `core:0` | — | 通用 |
| 8 | 最后防线 / 红线拦截战（测试） | `game8.html` | 12 | 5 炮（`speed=0` 固定） | 7 | 自带脚本（不走 `ai.js`） | `objective.type='line_defense'` | 按突破数 |

- **通用星级**（`main.js` 的 `checkWinState()`）：按过关时**存活蓝方数**——0 个 = 1 星、1 个 = 2 星、**≥2 个 = 3 星**。
- **第 4 关**：`escaped` 0 / 1 / 2 支分别 3 / 2 / 1 星；`escaped ≥ loseEscape（3）` 判负。
- **第 5 关**：`usedTurns = turns_limit - remain_turns`，**≤13 = 3 星 / ≤15 = 2 星 / 16~18 = 1 星**；超过 18 回合未全歼判负。这一套是 `CURRENT_LEVEL_ID === 5` 的**独立分支**（三种情况都 `return`，不会落到通用规则）。
- **第 8 关**：0 支突破 3 星 / 1~2 支 2 星 / 3~4 支 1 星 / ≥5 支判负（`main.js` 的 `line_defense` 分支）。注意它 `objective` 里写的 `breakthrough_limit` **引擎并不读**，实际阈值走 `loseEscape`（未给时默认 5）。

## 结局与解锁

| 结局页 | 触发 |
|--|--|
| `end-game.html` 正常结局 | 第 6 关通关后点结算页 `Next` |
| `fail.html` 失败结局 | 任意关判负（蓝方全灭 / 回合耗尽 / 第 4 关逃脱超限）后点 `View Ending` |
| `destiny-fail.html` | **第 7 关**判负时点 `View Ending: Destined to fail` |
| `hidden-end.html` 隐藏结局 | 第 7 关通关后点结算页 `Next` |

**通关流向：结算页只留一个 `Next`，主界面地图当枢纽。**

- 通关结算页只有 `#button-next-game`（文案 `Next`）：`Replay` / `View Ending` 与整条 `#game-actions`（含 `Menu`）都被隐藏。**结算页上没有任何说明文字**（原来那句"第 N 关通关！已自动存档（a.save）"已删）。
- 目标在结算时算好写进按钮的 **`data-target`**（方便验收直接读）：
  - 第 1~5 关 → `menu.html?unlock=<刚通关的关号>`：**回主界面看地图动画**，再由玩家点地图上下一个标记进关，**不直接跳下一关**。⚠️ 这个参数只是"顺手带上"：**地图播不播动画不看它**（见「主界面与战役地图」的 `revealSeen`），所以游戏页跑旧缓存、参数丢了也不会再丢动画；
  - **重打老关卡不带这个参数**：`winTargetFor(levelId)` 先读**通关前**的 `autoProgress().unlocked`，只有 `levelId >= unlocked`（确实往前推进了一关）才拼 `?unlock=`，否则回裸 `menu.html`——不然重打第 1 关也会在地图上再播一次"加载新关卡"的动画（2026-09 修的 bug）；
  - 第 6 关 → `end-game.html`；第 7 关 → `hidden-end.html`；
  - "下一关是不是结局"仍以 `levels.js` 的 `nextLevelFile()` 为准（正则匹配 `end-game.html|hidden-end.html`），不写死。
- **判胜分支必须走同一套收尾**：`hideResultAlternatives()`（藏 `Replay` / `View Ending` / `#game-actions`）+ 写 `data-target`。第 5 关有**自己的判胜分支**（按步数给星，三种情况都 `return`，不落通用分支），也得显式调这两个函数——漏掉就会出现"第 5 关通关后回主界面没有连线延伸动画"。
- **四个结局页只留一个 `Next` 按钮回 `menu.html`，页面上已无任何 `<a>` 链接**；`end-game.html` 上原有的"进入隐藏关"入口已删除。

**隐藏路线（唯一判据：`save.js` 的 `hiddenRouteOpen()`）**

- 判据：**第 1~6 关星级全部 ≥ 3**（内部逐关调 `getLevelStars(user, levelId)`，读 `a.save:<用户>.stars[levelId]`，无记录 = 0 星）。
- 两处调用同源：主界面地图的隐藏关标记、`js/game7.js` 的入口校验。
- 第 7 关入口校验失败时用 `modalNotice('需要第 1～6 关全部获得 3 星，才能解锁第 7 关。')`，点"知道了"后回 `menu.html`（无 ui.js 时退回原生 alert）。
- 第 6 关通关存档时若"路线刚被打开"，`autosaveOnWin()` 会右上角浮出提示"隐藏路线开启 · 第 1～6 关全部达成 3 星 · 隐藏的第 7 关已解锁"。
- **旧机制已停用**：原先"第 1 关 ≤12 回合通关 → 写 `hiddenUnlocked`"不再作为判据；存档里的 `hiddenUnlocked` 字段只为兼容旧档保留（手动档覆盖时仍会合并），代码不再读写它当条件。`autosaveOnWin(levelId, star, quickL1)` 的 `quickL1` 参数保留仅为兼容调用。

## 敌方（红方）AI

实现在 `js/ai.js`；**红方并非天生站桩**——第 1、2、5 关的"不动"是关卡设计（`ai: null`）。

- **挂载点**：点 Next Turn 时，`main.js` 在连跑本回合 24 帧**之前**调用一次 `applyEnemyAI()`，按 `CURRENT_GAME.ai` 给每个存活红方重设一次 `target`；一回合内不再变。**不要**把方向决策写进逐帧逻辑。
- **声明方式**：关卡在 `levels.js` 写 `ai` 字段，由 `attachLevelAI(id)` 挂到 `CURRENT_GAME.ai`（`gameN.js` 末尾调用）。缺省 / `null` = 站桩。
- **策略**：`stationary`（站桩）/ `breakthrough`（向威胁最大的蓝方集中突破，`threat` 可选 `nearest`（默认）/ `strongest` / `weakest`）/ `cluster`（向 `core` 下标抱团）/ `circle`（往 `center`+`radius` 圆环填空）/ `flee`（朝 `fleeTo` 直线撤离）。
- **两条特殊规则**：① 已交战（射程内有可命中蓝方）的红方**一律原地固守**（`aiIsEngaged()`）；② 红方**骑兵优先把蓝方炮兵**当目标（`pickThreatBlue()` 的 `cls === '骑'` 分支）。
- 约束：每关 AI 固定、可复现，不用 ML/DL；AI 只管"往哪走"，攻击仍走引擎逻辑。

## 兵种设计

| 兵种 | `class` | 速度 | 射程 | 攻击 | 生命 | 原型常量 |
|--|--|--|--|--|--|--|
| 步兵 | 步 | 0.1 | 0.5 | 0.5 | 60 | （关卡里直接写常量组合） |
| 炮兵 | 炮 | 0.05 | 4.0 | 0.7 | 60 | — |
| 骑兵 | 骑 | 0.2 | 0.5 | 1.0 | 60 | `UNIT_CAVALRY` |
| 散兵 | 散 | 0.1 | 1.0 | 0.7 | 42 | `UNIT_SKIRMISHER` |
| 掷弹兵 | 掷 | 0.05 | 0.5 | 0.7 | 120 | `UNIT_GRENADIER` |

数值常量都在 `js/constants.js`（`ATK_RANGE_*` / `MOVING_SPEED_*` / `LP_*` / `ATK_*`）。棋盘上无图时用 `class` 字符占位（不给 `img` 即可，`main.js` 自动兜底）。面板与范围圈里的中文名在 `main.js` 的 `UNIT_NAME_MAP`。

> ⚠️ 命名坑：`constants.js` 的原型用 **`class`** 作键；而 `loadGame()` 建单位时把 DOM 上的类名存成 **`cls`**（`armys[i].cls`）。**对局中判断兵种请用 `u.cls`**。

## 脚本加载顺序与模块

- **游戏页**：`constants → pieces → arrow → bgm → dialog → account → ui → save → main → fx → ai → levels → gameN`（都是 `defer`）。
  - `bgm.js` 放在 `dialog.js` **之前**：`dialog.js` 要用它的 `initBgm()` 把背景音乐挂到剧情弹窗的"继续"按钮上。
  - `gameN.js` 末尾做入口校验 / `loadGame(gameN)` / `loadSnapshot()`——**`gameX.js` 一加载就建房建棋子**。
- **其它页**：`index.html` = `account → bgm`；`register.html` = 只有 `account`；`menu.html` = `account → ui → save → levels → menu-saves → bgm`；`achievements.html` = `account → ui → save → menu-achv → bgm`；`end-game` / `fail` / `hidden-end` = `account → ui → save → bgm`；**`destiny-fail.html` 只有 `bgm.js`**（它只显示结局文字 + 一个 `Next`，不需要账号/存档/提示组件）；`group.html` 不带任何脚本。
- **只有 `gameN.js` 存本关棋子配置**，跨关卡信息一律进 `levels.js`（方便各人维护自己那关）。
- `main.js` 一加载就 `getElementById` 一批固定元素，**缺一个就报错**（见「页面结构与各页职责」）。

## 运行机制（改动前必读）

- 点一次 Next Turn = 同步连跑 **24 个"帧"**（`nextStep()`）算作一回合；画面上的平滑移动只是 CSS `transition` 补的动画，战斗结算一瞬间就完成。
- 移动模型（蓝红统一）：玩家给棋子设"目标点"，每回合可改，不改就沿用；走到就停；**路上敌方进入攻击范围就停下开打（攻击优先于移动）**。
- 攻击没有冷却、不分先后手，每帧结算一次，基本是双方 DPS 对耗。
- 棋子之间**没有碰撞也不占格**，可以重叠、穿行。
- 行动顺序 = `armys` 数组顺序（`gameN.js` 里 push 的顺序，蓝方先、红方后），每帧按序逐个结算。后果：后面的棋子同帧能打到刚移动过来的前面的棋子，而前者要等下一帧才还手（当作合理 feature 保留）。
- 判死条件是 **`lp <= 0`**（原"`lp < 0`、恰好归 0 不死"的 bug 已修）。
- **一回合 24 帧跑完立刻判胜负**：红方全灭优先判胜；否则蓝方全灭 / `remain_turns == 0` / 第 4 关逃脱超限判负。判胜负后 `#board`、`#button` 等隐藏，只留结算区。
- 死单位先灰显，下一次点 Next Turn（`clearDisable`）才从棋盘消失；`Replay` 只是整页刷新。
- 响应式：`html { min-width: 320px }`；断点 `max-width: 1100px`（面板收窄）、`max-width: 760px`（棋盘边框 6px、单列堆叠）、`max-height: 680px and min-width: 761px`（压扁纵向留白）；`prefers-reduced-motion: reduce` 关掉过渡与部分动画。

### 选择与查看模式

- 指挥模式（默认）的选中集合 `selectedPieces`（只含存活蓝方）：单击 = 单选、Ctrl/Shift+单击 = 加减选、拖拽 = 画框多选、点空白/红棋 = 给全部选中下令移动、对唯一选中再点一下 = 原地待命。**下令后选中被清空**（箭头还在、范围圈消失）。
- 左侧 `#info-bar`（`renderInfoPanel`，随选中/每回合刷新）列出类型 / 射程 / 攻击 / 速度 + LP 进度条；**没有选中时整条隐藏**（`display:none`，不显示空态文案）。
- `查看敌人` 按钮把 `viewMode` 切到 `'enemy'`：左键单选或拖拽框选红方（`selectedEnemies`，不画外圈），右侧 `#enemy-info`（`renderEnemyPanel`）显示剩余 LP；再按一次返回指挥。
- UI 通过 `getSelection()/addSelectionListener()/getEnemySelection()/addEnemySelectionListener()` 与选择逻辑解耦。

### 存档层（`js/save.js`）

- `a.save:<用户名>`：`{ unlocked, stars, snapshot, hiddenUnlocked }`——`unlocked` / `stars` 是主界面进度，`snapshot` 是当前进行关的中途快照（位置 / LP / 目标 / 剩余回合 / `escaped`）。
- `save1~3:<用户名>`：手动备份，结构相同。关卡内 Save / Load 任选目标；"Load 存档X" = 用 X 覆盖 `a.save`；覆盖手动档时**合并 `hiddenUnlocked`**。
- `achv:<用户名>` 成就、`achv-fail:<用户名>` 连败计数（**账号级**，三份手动档共用；读旧档不会回滚成就）。
- `resetAutoSave()`（主界面"重新开始游戏"）= **清空 `a.save` + 成就 + 连败计数**，手动档保留。
- `clearAuto(user)` = 只把 `a.save` 还原成"未开始"（`{unlocked:1, stars:{}, snapshot:null}`），**不碰成就与手动备份**（存档卡片里"载入空档"用）。
- 调试函数：`__saveMidLevel()` / `__clearSave()` / `__spawnUnit(color,'骑'|'散'|'掷',x,y)`（提示已降级为 `console.log`）。

## UI 提示约定（`js/ui.js`）

玩家流程**不用原生 `alert()` / `confirm()`**（仅作 DOM 不可用时的兜底），统一走四个全局函数：

- `toast(msg)`：底部轻提示（保存成功、已载入、无存档…）；
- `achievementToast(title, desc)`：**右上角浮动**（成就解锁、隐藏路线开启），可堆叠、点击可关、4.5s 自动消失；
- `modalConfirm(msg, onOk)`：卡片式确认（取消 / 确定），**只有点"确定"才执行 `onOk`**；
- `modalNotice(msg, onClose)`：卡片式通知（只有"确定"）。

**层级约定**：`.ui-modal-mask` = `z-index:100`，所以两个浮动层必须更高——`.ui-toast-stack` = **200**、`.ui-achv-stack` = **210**；`.ui-toast` 底色是不透明的 `#0d1c30` 并带浅色描边。**新增任何浮动提示层都要高于 100。**

已引入 `ui.js` 的页面（13 个）：`menu` + `game1~8` + `end-game` / `fail` / `hidden-end` + `achievements`。⚠️ **`destiny-fail.html` 没引入 `ui.js`**，那边只能用原生 alert 兜底（目前也没用到）。

## 背景音乐（`js/bgm.js`）

5 首逐页分配：

| 曲目 | 页面 |
|--|--|
| `Preussens-Gloria.mp3` | `index.html` / `menu.html` / `achievements.html` |
| `The-British-Grenadiers.mp3` | `game1` / `game2` |
| `La-Chanson-De-L-Oignon.mp3` | `game3` / `game4` |
| `Chernoberg-March.mp3` | `game5` |
| `La-Marseillaise.mp3` | `game6` / `game7` / 四个结局页 |

元素 id：`#index-music`（首页）、`#menu-music`（主界面 / 成就页）、`#game-music`（关卡与结局页），都 `<audio loop>`。**`game8.html` 没有背景音乐。**

**播放逻辑全站统一走 `initBgm(id, fallbackEl)`**：**先尝试播放**；只有 `play()` 被浏览器自动播放策略拦下（Promise reject 或同步抛错）**才**退回该页原本的"点击播放"——`fallbackEl` 不传就挂 `document` 首次点击，传了元素就挂那个元素。

| 页面 | 调用 | 回退触发点 |
|--|--|--|
| `index` / `menu` / `achievements` / 四个结局页 | `initBgm('<id>-music')` | `document` 首次点击 |
| `game1~game7` | `initBgm('game-music', next)`（在 `dialog.js` 里） | 剧情弹窗的**「继续」按钮** |

- 回退监听是 `{ once: true }`；那一下若再被拦会**自动重新挂回来**；元素不存在时静默返回 `null`。
- `volume` 统一 `0.5`。
- 已删除的旧机制：`sessionStorage.startMenuMusic` 接力（index 写 / menu 读）、`sessionStorage.game1Music`（写了没人读，2026-09 清掉）。

## 特效（`js/fx.js`）

两个特效层由 `fx.js` **动态创建**在 `#board` 内，页面 DOM 不用改：

- `#fx-layer`（`z-index:120`）：开火烟雾 + 枪口火光，盖在棋子之上；
- `#fx-trail-layer`（`z-index:8`）：移动扬尘尾迹，压在棋子之下（像留在地上的土）。

- 挂载点只有 4 行（`main.js`）：两处开火结算后 `fxMarkFired(element, atktar)`、移动落点后 `fxMarkMoving(element)`、24 帧循环结束后 `fxFlush()`。**不要写进逐帧逻辑。**
- 聚合：开火 1 撮 = 6 个烟团 + 1 次火光；移动 1 条尾迹 = 沿路径等距 ≤10 个尘团（位移 < 0.3 格不画）。
- 参数集中在 `fx.js` 顶部：`PUFFS(6) / PUFF_MS(1500) / FLASH_MS(240) / TRAIL_MAX(10) / TRAIL_MS(1400) / TRAIL_MIN_CELL(0.3) / TRAIL_SPACING(0.35) / SPAWN_DELAY(400) / MAX_NODES(200)`；外观在 `style.css` 末尾的 `.fx-puff` / `.fx-trail` / `.fx-flash`。
- **尾迹必须"亮芯 + 暗环"双对比**（深草地底与浅冰面底都要看得清）；尘团尺寸 2.4dvh。
- 开关：`window.fxEnabled = false` 即时关闭；`prefers-reduced-motion` 或页面不可见时不生成；调试 `fxDebug.liveCount()` / `fxDebug.clearAll()`。
- ⚠️ 三个坑：① `.chess` 是 `overflow:hidden`，烟**不能**挂在棋子的 `::before/::after` 上；② 坐标用棋盘几何换算（与 `pieces.js` 的 `movePieceTo` 一致），`distance`/`offset` 只能靠实测 `.cell` 矩形反推；③ 判断移动路径**不能**用 `getBoundingClientRect()`。

## 主界面与战役地图（`menu.html` + `js/menu-saves.js`）

`menu.html`（70 余行）只有：页头卡片（kicker / `h1` / 欢迎语）→ **战役地图** `#campaign-map` → `#btn-saves`「读取存档」→ 导航卡片（小组介绍 / 成就（含计数） / 退出登录）。内联脚本只做登录校验、欢迎语、`renderMenuSaves()`、`bindMenuSaves()`、`refreshAchvLink()`、登出。

**地图**

- 底图 `img/europe-map.svg`（37.9KB，`viewBox="0 0 1000 785"`）：由 **Natural Earth（公有领域）** 经 `world-atlas@2` 的 `countries-50m.json` **本地生成**（等经度 + 墨卡托；`lon −10..40 / lat 34..60`）。**生成脚本是一次性的、用完已删**；来源与参数写在 SVG 顶部注释里。
  - 不要用 Wikimedia 抓图（这台机器上 `upload.wikimedia.org` 返回 429/400）；`cdn.jsdelivr.net` / `raw.githubusercontent.com` 正常。
- **投影必须两边一致**：`menu-saves.js` 顶部的 `MAP = { lonMin:-10, lonMax:40, latMin:34, latMax:60 }` 与 `mercY()` 必须和生成 SVG 时同一套公式。**改地图范围要同时改 SVG 与这段常量。**
- 旗标位置来自 `levels.js` 每关的 `map:{lon,lat}`：L1 土伦 5.93/43.12、L2 图卢兹 1.44/43.60（手动西移）、L3 耶拿 11.59/50.93、L4 柏林方向 13.40/52.52（手动东北移）、L5 斯摩棱斯克以西 31.00/54.60、L6 滑铁卢 4.40/50.72、L7 巴黎 2.35/48.85（象征性）。
- **渐进揭示**：只画 `lv.id <= a.save.unlocked` 的关卡（加上当前进行中那一关），后面的不出现标记也不画线。
- 标记 `.map-pin`：0 尺寸的锚点（`left/top` 就是投影坐标），里面是圆钉（写关号 + 小尖脚）+ 下方一行星级；**没有名字卡牌**，关名放在原生 `title` 里。状态 `data-state` = `done` / `open` / `cont` / `hidden`。
  - 星级两个偏移量**别随手改**：纵向 `top: 22px`（窄屏 `19px`，实测钉底到星级顶边净空隙 9px）；横向 `transform: translateX(calc(-50% + 0.05em))`（窄屏 `+0.03em`）—— 因为 `letter-spacing` 算在每个字的步进里（含最后一个字），只写 `-50%` 会让**中间那颗星偏左半个字距**。
  - **隐藏关图钉**（`.map-pin--hidden`，2026-09 修）：**单圈金框** = `2px` 实线金边 + 金色小尖脚 + 斜体星级 `#7a5c33`；圆钉尺寸与其它图钉一致（26px / 2px，窄屏 22px）。**圈里不要再有任何内圈。**
    - ⚠️ 三个坑：① 原来那条规则**只写了 `border-style` / `border-width`、没写 `border-color`**，颜色一直被状态色（`--done` 暗红 / `--open`、`--cont` 深蓝）覆盖，注释里的"金框"从来没生效；② 原来的 `border-style: double` **真的会画出两道线**（圈里套一个小圆环，玩家一眼就看出来了），而且 `4px` 比别的图钉粗一圈（内径 18px vs 22px）；③ 所以既不要用 `double`，**也不要再拿 `::before` 去补内圈**——2026-09 已经因为这个返工过一次（先按"double 不生效"的猜测加了一圈内金线，玩家回"里面还是有个小圆环"）。
    - 斜体星级的墨迹比正体偏右（实测宽屏 +1.24px、窄屏 +1.73px），所以上面那条 `+0.05em` 的居中补偿要按斜体重补：宽屏 `-0.03em`、窄屏（`max-width:760px` 段内）`-0.11em`，实测残差 ≤0.06px。
    - 进行中的隐藏关（`.map-pin--hidden.map-pin--cont`）圆钉是深蓝实底，数字要改浅色，否则看不清。
- **连线**（内联 SVG，viewBox 与底图等比）：已通关 = **红色静止虚线**（`dasharray 9 7`，**没有 animation**）；还没打通的下一段 = 浅灰静止虚线 `7 9`。
  - **只有"刚解锁一关回主界面"那一下有动画**：给新解锁那段叠一层遮罩（`<defs id="route-reveal-defs">` → `<mask id="route-reveal">`），遮罩里一根白粗线用 `map-route-draw 3s linear` 把 `stroke-dashoffset` 100 → 0，**被擦到的虚线才露出来**（"虚线一段一段加载"）；期间下面那根加 `--pending`（`opacity:0`）、下一关标记加 `--wait`（`visibility:hidden`）。`DRAW_MS = 3000`（**必须与 CSS 的 3s 同步**）后 `finishReveal()` 撤遮罩、放出虚线、把标记换成 `--fresh`。
  - ⚠️ 遮罩**必须** `maskUnits="userSpaceOnUse"` 且范围写整个 viewBox：默认 `objectBoundingBox` 对水平/垂直线段会算出 0 宽度，**整根线会看不见**。
  - **播不播由主界面自己判断，不依赖上一页传参**（2026-09 第二次修的 bug）：`renderProgress()` 里记住"已展示到第几关"`revealSeen:<用户>`，`frontier`（=`a.save.unlocked`）正好比它大 1 才播，`revealId = frontier - 1`；`?unlock=` 退化成兼容 / 手动重放（`unlockId + 1 === frontier` 时也认）。
    - 为什么不用 `?unlock=` 当判据：游戏页跑的是浏览器缓存里的旧 `main.js`（或老标签页、书签）时那个参数根本不会出现，动画会莫名消失；`a.save.unlocked` 是 `autosaveOnWin()` 一直在写的，稳定得多。重打老关卡（`frontier` 不变）与载入旧档 / 重新开始（`frontier` 变小 → 记忆跟着拉回）都不会播。
    - 首次运行（没有 `revealSeen`）按"已展示到当前关"处理，不播；动画开始前就写记忆，中途刷新不会重播。
  - 时序跑完由 `history.replaceState` 抹掉 query，刷新不重播。
- ⚠️ `.campaign-map` **不能有 `padding`/`border`**（标记按百分比定位，参照盒子必须正好等于底图），`overflow` 保持 `visible`。

**「读取存档」弹卡**（点 `#btn-saves` 懒加载）：`ui.js` 的遮罩 + 加宽类 `.ui-modal--wide`，内容只有「标题 → `#manual-list` → `#btn-restart` → 关闭」，**没有说明小字**。手动档 1~3 每行写明进度（`已通关 N 关 · 星级 x/18 ｜ 第1关 ★★★ … ｜ 第 5 关进行中（剩余 9 回合）`）；非空档给「载入 / 删除」；**空档显示 `（空）` 但同样给「载入」，走两段确认**（第一次点只弹 toast 并把按钮改成「仍要载入」，再点才走 `clearAuto()`）。关闭三条路径：`关闭` / 点遮罩 / ESC。载入或删除后弹窗与页面进度同时刷新、窗口不关。

## 结算区（`#result-area`）

`game1~7.html` 把 `#win` / `#lose` 与 `#button-next-game` / `#button-replay` / `#button-fail` **一起包进 `<div id="result-area">`**（`#button`（Next Turn）留在外面）。

- CSS：`position: fixed; left/top: 50%; transform: translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:0.9rem; z-index:60`，并加 `pointer-events:none`（子元素 `auto`，空的时候不挡棋盘）。实测整组中心与视口中心偏差 **0.00 / 0.00**。
- **为什么必须包一层**：只给 `#win`/`#lose` 定位是不够的——结算按钮是 `body` 的兄弟节点，会留在文档流上方。
- **判负时 `Menu` 也要进组**：`main.js` 的 `hideMidGameControls()` 故意保留 `Menu` 作为出口，判负分支会调 `moveMenuIntoResultArea()` 把 `#button-exit` 挪进 `#result-area`——调用点是**通用判负分支 + 第 5 关自己的两条分支 + game8 的 `line_defense` 分支**（最后这个在 game8 里是空操作，那边没有 `#result-area`）；**判胜不挪**（判胜时整条 `#game-actions` 都是隐藏的，结算页只留 `Next`）。
- **`game8.html` 没动**：它有自己的一套结算分支、也没有 `#result-area`，`moveMenuIntoResultArea()` 在那边是空操作。

## 页面结构与各页职责

- **游戏页固定 DOM**：`#board`、`#button`（Next Turn）、`#result-area`（内含 `#win`/`#lose`/星级/`#button-next-game`/`#button-replay`/`#button-fail`）、`#info-bar`、`#enemy-info`、`#game-actions`（`#save-load-btns`（Save / `#slot-select` / Load / 查看敌人）+ `#button-exit`（Menu））、`.game-heading`（`h2` + `#footer-bar`）。**一套都不能少**，`main.js` 一加载就取。
- **进关流程**（`main.js` 末尾）：第 1 关 = 立绘剧情 → 战前简报（`开 战`）→ 教程图 1 → 教程图 2 → 棋盘淡入；其余关 = 立绘剧情 → 战前简报 → 淡入。每一步都裹 `try/catch`，异常直接 `revealBattlefield()`，不会卡在全黑。
  - `level-opening` 这个 `body` 类**必须成对**：它把战场藏起来，只有 `revealBattlefield()` 会摘掉。
- **结局页**：`.page-ending` + `.form-box` 里一个 `Next`。结局页的 `.form-box` 把背景/边框/圆角/阴影/内边距全部归零，**还必须关掉 `.page-ending .form-box::before`（`content:none`）**——那套皮肤给它挂了一个 `inset:7px` 的 1px 装饰线框，只清本体 `border`/`box-shadow` 它还在，按钮上会留一道细线。`index.html` / `register.html` 的登录注册表单走另一套皮肤（选择器带 `.page-ending` 前缀，不受影响）。
  - `end-game.html` 里那句 `.page-note#normal-note`"（历史正常进行……而另一种可能，还藏在更深处……）"**只在隐藏路线还没打开时显示**：页面脚本里 `hiddenRouteOpen()` 为真就把它 `display:none`（否则"还藏在更深处"跟地图上已经出现的隐藏关自相矛盾）。其余三个结局页的 `.page-note` 是常显的。
- **成就页**：成就 4 项——`victory_end` 胜利 / `tragic_fail` 惨痛失败 / `empire` 法兰西帝国 / `rise_again` 失败乃成功之母（同关连败 ≥4 后以 3 星通关）。`menu-achv.js` 优先填充页面预置的 `#achv-area`（保留它的 `.panel-card`）。
  - 页面出口**只有「返回主界面」一个链接**（`logout-btn` 与"退出登录"已删，要登出请回主界面）；内联脚本因此只做**登录校验 + 欢迎语**（BGM 由 `initBgm` 起）。
  - ⚠️ 这一页的**内联脚本必须语法自检**：2026-09 它末尾多了一个 `});`，整段 `<script>` 直接 SyntaxError、什么都不执行（表现为"成就页空白 / 打不开"：欢迎语空、成就墙空、BGM 也不起）。同一处还有一行脚本标签被写成了**字面量 `\t<script ...>`**，会在页面上显示成一段 `\t` 文字。删 DOM 元素时**记得连它的事件绑定一起删**（`getElementById` 拿到 null 再 `.addEventListener` 会抛错，同样带崩整段脚本）。
- **`game8.html`**：测试关，不在 `levels.js` / 地图里，只能直接开 URL；战斗是自带脚本，未接入 `ai.js` 与 `fx.js`。

## 排查 CSS 问题时的两条通用经验

本项目由两个 demo 合并而来（A = `demo-游戏内容多` 的玩法底座，B = `demo-美化好` 的表现层），`style.css` 里 **B 的「2026 UI 重制」段在 A 的规则之后**，它们**特异性常常相同**，于是 B 会赢。

1. **"整体替换型"属性**（`filter` / `transform` / `box-shadow` / `border` / `background`）最容易出事：A 的某状态规则（`.chess.disabled` 等）与 B 的 `.game-page .X` 同特异性时会被整个替换。加新状态样式请写在**文件末尾**并用 `.game-page` 前缀把特异性抬到 (0,3,x) 以上，别指望靠顺序。
   - 已用这条修过：阵亡单位"先变灰再消失"的**变灰阶段**失效（`.game-page .chess.disabled img`）。
   - `.selected` / `.highlighted` / `--blue:hover img` 是 B **有意**接管皮肤，不要"修"。
2. **`#board` 有 9px 边框（窄屏 6px）**，而棋子/箭头/范围圈/框选矩形都是 `#board` 的绝对定位子元素，坐标原点在 padding box。**任何"鼠标 → 棋盘坐标"的换算都要走 `boardContentRect()`**（用 `clientLeft`/`clientTop`），不要直接用 `getBoundingClientRect()`。目前 3 处在用：`renderOrderPreview()`、点击下令处、`updateBox()`。
   > `.cell` 的 1px 网格线不会造成偏移（`*{box-sizing:border-box}`）。
3. **每关棋盘桌面**靠 `style.css` **最末尾**的 `.game-page.gameN #board` 块（特异性 1,2,0）接管，必须把 `background-image / size / position / repeat` **四条一起重声明**，否则会被重制段的 `background-size: 20% 20%` 平铺成小图。

## 各关特殊玩法

- **第 4 关**：红方 `flee` 朝 `{9.5,-0.5}`（棋盘右上顶点）撤离；`game4.js` 的 `objective { type:'retreat', loseEscape:3, exitX:9.5, exitY:-0.5 }` 触发 `processTurnEscapes()` 的逐帧逃脱检测与追逐结算——逃脱 ≥3 判负，0/1/2 支 = 3/2/1 星；`escaped` 随快照持久化。
- **第 5 关**：8 名红方在右侧原地固守（`ai:null`），`turns_limit: 18`，按通关步数给星（见「关卡配置一览」）。
- **第 6 关**：6 蓝 vs 6 红（含红炮 / 红骑），`breakthrough` + `threat:'strongest'`，25 回合。
- **第 7 关**：隐藏关，`cluster` + `core:0`，26 回合；入口校验见「结局与解锁」。
- **第 8 关**：自带部署期与拖拽（类名 `game8-drag-piece` / `game8-artillery`），我方 5 门炮兵固定（`speed=0`），红方 7 人向右突破"红线"。

## 已知缺陷与待修

1. **第 5/6 关旧快照兼容**：两关的"战斗 + 回合数 + 叙事"在 2026-09 整体对调过（见「历史记录」），浏览器里遗留的旧中途快照仍记着旧布局与旧回合数，第 5 关的按步数给星会偏松。清掉这两关的快照或"重新开始"即可。
2. **第 8 关未接线（设计如此）**：不在 `levels.js` / `menu.html`；`objective.breakthrough_limit` 未被 `main.js` 读取（实际用 `loseEscape`）。
3. **红方散兵无图**：`img/` 没有 `red_skirmisher.png`，红方散兵走文字占位。补图时记得同步 `constants.js`。
4. **`destiny-fail.html` 只引了 `bgm.js`**（没有 `account.js` / `ui.js` / `save.js`）：该页当前只显示文字 + `Next`，所以能用；若要在这一页加 toast / 弹窗 / 成就，先把对应脚本补上。
5. `main.js` 的 `showWinNote(text)` 与 `.win-note` 样式**保留但当前无人调用**（结算页已不写文字）；`levels.js` 里 `quickL1` 参数同理（保留仅为兼容）。

## to-do list

按顺序一项一项做：**每完成一项先自测、给出可核对的验收指标，再让我验收，然后进入下一项**；每项完成后把结论同步进本文件。

### 第一期（1~18）：全部完成并通过验收（2026-09-05）

| # | 内容 | 结果 |
|--|--|--|
| 1 | 主页：注册/登录（localStorage）+ 小组介绍入口 | ✅ |
| 2 | 游戏主界面：按用户的存档 + 推关进度与星级展示 | ✅ |
| 3 | 关卡内存/读档按钮 + 返回主界面出口 | ✅ |
| 4 | 拖拽画框多选（顺手把判死改成 `lp <= 0`） | ✅ |
| 5 | 左侧选中显示条（属性 + LP 进度条；含查看敌人模式、`lpMax` 修复） | ✅ |
| 6 | 显示条上取消选中（含悬停卡片 → 棋子呼吸发光） | ✅ |
| 7 | 点击棋子显示攻击范围 | ✅ |
| 8 | 新增 3 个兵种（骑兵 / 散兵 / 掷弹兵原型入 `constants.js`） | ✅ |
| 9 | 红方移动 AI（集中突破 / 聚团 / 圆圈）并试调难度 | ✅ |
| 10 | 4+ 关卡设计 + 关卡注册表 `levels.js` | ✅ |
| 11 | 常驻行动指示箭头 | ✅ |
| 12 | 教学页 / 每关开始的新机制介绍（`hint` + 战前情报） | ✅ |
| 13 | 对话式剧情（`dialog.js` + 立绘） | ✅ |
| 14 | 隐藏关卡与隐藏结局 | ✅（判据 2026-09 改为"第 1~6 关全 3 星"） |
| 15 | 成就功能（4 项） | ✅ |
| 16 | 界面美化（每关棋盘桌面、结局页等） | ✅ |
| 17 | 项目文档 `README.md`（按 7 问组织） | ✅ |
| 18 | [可选] 每关 hard-version | 决定不做 |

### 第二期（19~29）

- **【高】** 19. ✅ 修复隐藏关解锁（`getLevelStars()` + `hiddenRouteOpen()` 统一判据；Node 沙箱自测 15/15）
- **【中】**
  - 20. 重做隐藏关（第 7 关"帝国黄昏"：玩法与难度重设计，当前是 `cluster` 抱团拆核心）
  - 21. ✅ 主页地图（关卡目录改成 `img/europe-map.svg` 上的旗标 + 红色虚线；原文字列表已删）
  - 22. 查看敌方功能增加数值显示（`viewMode='enemy'` 面板补攻击/射程/速度，当前只有血条）
- **【低】**
  - 23. 单位下方直接显示小血条
  - 24. 重排按钮，`Next Turn` 做得更明显
  - 25. 剧情引擎（**现状：已具备**——立绘版 `dialog.js` + 4 张立绘 + 7 关 `story`；若仍要推进请先说明还差什么，如打字机效果 / 表情差分 / 分支）
  - 26. （选做）单位图鉴页（5 兵种数值与定位）
  - 27. （选做）新加关卡（按 `gameN.js` + `levels.js` 注册表模式扩展）
  - 28. 单位交战与移动的烟尘特效（**已实现**：见「特效」一节）
  - 29. 加入更多剧情、优化场景

## 文档要求（`README.md` 至少要回答）

- 项目是什么？
- 项目的来源或背景？
- 项目的具体内容（是否有树状图或其他示意图帮助了解网站包含什么）？
- 项目的技术细节（开发平台、运行平台等）？
- 详细的角色分工？
- 详细的时间表（完整的 3 周）？
- 是否有示例图帮助理解？

## 开发/验收工具约定

- 验证方式：起本地静态服务器（`python -m http.server 8099 --bind 127.0.0.1`）+ iframe 外壳页（先写 localStorage 种子：`users` / `currentUser` / `a.save:v` / `save1:v` / `achv:v` 等），再用 headless Edge 读 DOM 指纹：
  `& $edge @edgeArgs --dump-dom $url | Out-String`，其中 `$edgeArgs` 要**复用同一个 `--user-data-dir`**（且 **URL 用数组 splat 传**，否则会得到 0 字节输出）。
  - ⚠️ **改完 `js/` 之后要换一个新 profile（或先删掉旧的）**：复用暖 profile 会让浏览器继续跑缓存里的 `main.js`，造成"改动没生效"的假象；`css` 改动会走 `If-Modified-Since` 重新校验，一般不受影响。
  - ⚠️ **自己也一样：改完 `js/` 必须 `Ctrl+F5` 整页刷新**。局部刷新的页面、以及**改动前就打开着的老标签页**会一直跑旧 JS——2026-09 的"第 5 关通关后地图不动画"就是这么误判出来的（`#button-next-game` 的 `data-target` 是空的，因为那个标签页里根本没有新代码）。验到"新逻辑没生效"时，先看这个，再怀疑代码。
  - headless 里**程序化点击不算用户激活**，所以"自动播放被拦 → 点击起播"这类行为要用**单元测试**（直接驱动函数并 spy `addEventListener`）来验证，别指望模拟点击。
  - headless 截图**抓不到"页面加载后新增的 DOM"**（两次截图可能字节相同）；测特效可见性用静态对照页 + 像素偏移量。
  - `armys` / `CURRENT_LEVEL_ID` 等是脚本顶层的 `let`/`var`，**不在 `window` 上**：测试里要用 `iframe.contentWindow.eval('armys…')`，不要用 `w.armys`。
  - 模拟通关要连 `disabled` 一起置位：`armys.forEach(u => { if (u.color === 'red') { u.lp = 0; u.disabled = true; } }); checkWinState();`（`checkWinState` 只数 `element.disabled == false` 的单位）。
  - **页面的内联 `<script>` 也要语法自检**（`node --check` 只管 `js/*.js`）。最快的一段：逐个 HTML 抽出内联脚本，`new Function(code)` 只解析不执行，出错就报"文件 + 起始行 + 信息"；顺便扫一遍 `\\t` 之类的**字面量转义残留**（会被当可见文字渲染出来）。2026-09 成就页就是这么挂的（末尾多一个 `});`，整段脚本不执行）。
- 写完临时脚本/页面**记得删掉**，并停掉后台服务器、清掉临时浏览器 profile。

## 历史记录

- **两个 demo 合并**：A（`demo-游戏内容多`：第 8 关测试关、第 4 关追逐战、AI 的 `flee` / `aiIsEngaged` / 骑兵优先打炮、背景音乐、教程图、每关桌面）为底座；B（`demo-美化好`：2026 UI 重制、立绘对话、7 关章节/剧情元数据、棋盘淡入、4 张立绘）为美化层。合并后 `main.js` 取 A 并移植了 `revealBattlefield()` / `level-opening` / 新的进关顺序；`dialog.js` 整体取 B；`levels.js` 是 A 的玩法字段 + B 的叙事字段。
- **第 5 / 6 关对调（D-1：叙事随战斗走）**：两关的"战斗 + 叙事"整体互换，所以**第 5 关 = 18 回合攻坚（斯摩棱斯克·1812）**、**第 6 关 = 25 回合铁血强攻（滑铁卢）**；幕次已随之调成与关号一致（第五幕 / 第六幕）。页面顺序、解锁顺序、隐藏路线判据都没变。
- **D-2 地图偏移**：第 2 关（剧情同为土伦）与第 4 关（奥尔施塔特离耶拿仅 20km）的旗标做了手动偏移，否则会与前一关重叠。
- **移动/攻击逻辑修订（已完成）**：只改 `js/main.js` 的 `nextStep()` 相关部分——不破坏回合系统、不让单位穿过敌人攻击范围、允许"已在敌射程内时向远处撤"、从范围外进入后停下开打、按 `selectMinimalDistance()` 判断远近，并测过 9 种情形；`movingCounts` / 胜负判断 / 死亡处理未动。
- **文本优化（已完成）**：`main.js` 第 7 关失败按钮文案改成 `View Ending: Destined to fail`。
- **2026-09 一批界面修订**：结算区整体居中 → 四个结局页 `Next` 去掉外框（含 `::before` 装饰线）→ 战役地图改成"静止红色虚线 + 只在新解锁时加载"→ 地图星级位置/大小微调 → 删除若干重复小字（`#save-note`、"已通关 N 关"、地图下方小字、`menu.html` 里 group.md 那行）→ 背景音乐统一 `initBgm()` → 清理死代码（`startMenuMusic` / `game1Music` 接力）。
- **2026-09 地图动画两个 bug**（玩家报的）：① 第 5 关通关后地图没有连线延伸——第 5 关自己的判胜分支没调 `hideResultAlternatives()` / 没写 `data-target`；② 通关第 5 关后重打第 1 关也会播一次延伸动画——结算时无条件拼了 `?unlock=`。修法是抽出 `winTargetFor(levelId)`（按**通关前**的 `unlocked` 判断有没有真推进）+ `hideResultAlternatives()`，通用判胜分支与第 5 关分支共用；菜单侧 `renderProgress()` 再用 `revealId` 兜一道。
- **2026-09 第三个 bug：动画判据改为"主界面自己比对进度"**。上面①修好后玩家仍复现"第 5 关通关后地图不动画"——查出来是他那个标签页跑的还是改动前的 `main.js`（`data-target` 为空），旧代码自然不传 `?unlock=`，而地图当时只看这个参数。根因是**跨页握手太脆**（旧缓存 / 老标签页 / 书签都会让参数消失）。于是把判断搬进 `js/menu-saves.js`：新增每用户的 `revealSeen:<用户名>` 记录"已展示到第几关"，`a.save.unlocked` 正好 +1 才播（`?unlock=` 降级为兼容 / 手动重放）；这样即便游戏页跑旧 JS，只要 `autosaveOnWin()` 写了 `unlocked`（一直如此），动画照样播。自测 5 种情形（无参数+记忆5 → 播；记忆6 重打 → 不播；无记忆 → 不播；无记忆+`?unlock=5` → 播；记忆6+进度回退到5 → 不播且记忆拉回 5）。
- **2026-09 隐藏关图钉样式修复**（返工过一次）：玩家报"第 7 关图钉样式错误"。第一轮实测（1300×900，隐藏路线已开）它 = `4px double` + **状态色**（深蓝），内径 18px（其它图钉 22px），而 CSS 注释写的"金框"因为漏写 `border-color` 从未生效。**我误判了 `border-style: double`**（以为圆角上不画双线），于是改成 `2px` 实线金边 + `::before` 内金线 —— 玩家回"里面依旧有个小圆环"：其实 `double` **本来就画出了两道线**，我又照着重做了一遍。第二轮去掉 `::before`，最终 = **单圈** `2px` 实线金边 + 金色小尖脚 + 斜体星级 `#7a5c33`；同时补上斜体星级的居中补偿（宽屏 `-0.03em`、窄屏 `-0.11em`；实测残差 ≤0.06px），进行中的隐藏关数字改浅色。顺带核对：L6/L7 图钉与星级**无几何重叠**（圆心距 64px）。⚠️ **教训：看不到像素时不要凭"浏览器应该不会画"下结论——那是玩家的屏幕说了算；不确定就先问。**
- **2026-09 `end-game.html` 的一句暗示改为条件显示**：`#normal-note`"（历史正常进行……而另一种可能，还藏在更深处……）"在 `hiddenRouteOpen()` 为真时 `display:none`（实测：路线开 → `display:none`、页面盒高 587px；未开 → `display:block`、627px）。
- **2026-09 成就页打不开（玩家报的）**：`achievements.html` 的内联脚本**末尾多了一个 `});`** → 整段 `<script>` SyntaxError、一行都不执行：欢迎语空、`#achv-area` 空、登出与 BGM 全无（看着就像"页面无法显示"）。同一处还有一行脚本标签被写成了**字面量 `\t<script src="js/menu-achv.js">`**，会在页面上渲染出一段 `\t` 文字。删掉这两个字符即恢复（`js/menu-achv.js` 与 `save.js` 都没问题）。顺手把**全项目 14 段内联脚本**用 `new Function()` 逐段语法自检，确认只有这一处坏；这条已写进「开发/验收工具约定」。
- **2026-09 成就页去掉「退出登录」**：只保留「返回主界面」一个出口（要登出回主界面）。连同内联脚本里那段 `#logout-btn` 的点击绑定一起删——只删 DOM 不删绑定的话，`getElementById('logout-btn')` 返回 null、`.addEventListener` 抛错，又会把整段脚本带崩（和上一条是同一类坑）。实测：欢迎语 `v`、标题 `成就（4/4）`、4 行、`#logout-btn` 不存在、页面内无"退出登录"字样、`.menu-link` 只剩「返回主界面」、成就区高度 458px、BGM 仍正常加载。
