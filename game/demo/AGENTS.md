# 项目概况

这是一个简单的 web 小游戏项目。基于 html + css + js 打造的静态页面，无需构建工具。

玩法：棋盘上若干友方（`color: 'blue'`）与敌方（`color: 'red'`）棋子，每回合给蓝方设定移动目标点，点一次 Next Turn 内部同步跑 24 帧结算，方向在一回合内固定。**在给定回合内消灭所有红方即通关**；蓝方全灭 / 回合耗尽 / 第 4 关逃脱超限判负。

- 棋盘尺寸：各关 `gameN.js` 里的 `n × m`，目前都是 **10 × 10**。
- **5 个兵种**：步兵 / 炮兵 / 骑兵 / 散兵 / 掷弹兵，数值见「兵种设计」。
- 引擎逻辑看 `js/main.js`；跨关卡信息看 `js/levels.js`；各关棋子配置在各自的 `js/gameN.js`。

**规模（按当前仓库实际文件；2026-09-16 重新点数，2026-09-17 补入 4 张兵种教学图后复点）**：根目录 HTML **19** 个 + `members/` **6** 个 = **25** 个页面；JS **23** 个（`js/` 内）+ 根目录 `offline-sw.js` = **24** 个脚本；CSS 项目自用 **1** 个（`css/style.css`，**7192** 行 / 250KB，另有 2 个成员页自带样式）；图片 **58** 个（`img/` 内 PNG 原图 **27** + WebP 运行版 **30** + `europe-map.svg`，其中 `img/portraits/` 立绘占 **18** 个）；音频 **5** 首。
> 计数口径：不含 `game/demo-old` / `game/demo-origin` 两个历史快照目录，也不含仓库根与其它同学子项目（`chinese-food` / `movies` / `poems` / 根 `js/lang.js`）。

## 技术栈审查：只用「前端三件套」（2026-09-16 全量扫描）

**结论：是。`game/demo` 是纯 HTML + CSS + JS 的静态站点，没有后端、没有框架、没有构建步骤、没有外部网络依赖。**
但有 3 处「浏览器原生 API」超出了"三件套"字面范围，需要知情（都是浏览器能力，不是服务端）：

| 位置 | 用了什么 | 说明 |
|--|--|--|
| `js/multiplayer.js`（1104 行） | **WebRTC `RTCPeerConnection` + `createDataChannel`** | 联机会战。`iceServers: []` —— **不连 STUN / TURN / 信令服务器**，双方手动复制粘贴一次 offer/answer 凭证，在可直连的局域网内 P2P。蓝方权威端跑同一套 24 帧结算后广播战局 |
| `offline-sw.js`（60 行） | **Service Worker + Cache API** | 由 `multiplayer.js` 调 `navigator.serviceWorker.register('offline-sw.js', {scope:'./'})` 注册；只缓存**同源**资源，`fetch` 事件里对非同源/非 scope 内请求直接 `return`（不拦截），**不发任何第三方请求** |
| `members/wuchenan/assets/fx.js` | **Canvas 2D**（`getContext('2d')`） | 成员个人页的自绘背景特效，与游戏本体无关 |

其余全部是"三件套 + 浏览器存储"：`localStorage`（33 处，账号 `users`/`currentUser`、存档 `a.save:`/`save1~3:`、成就 `achv:`、三语 `napoleon-language`、主题、静音、`prologue:`/`revealSeen:`）。

**扫描证据（`game/demo` 全树，25 HTML + 25 JS + 3 CSS）：**

- **构建/包管理**：`package.json` / `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `tsconfig.json` / `vite|webpack|rollup|gulp|babel|eslint|postcss|tailwind` 配置 —— **命中 0**；`node_modules` **不存在**。
- **非前端语言**：`.ts .tsx .jsx .mjs .cjs .scss .sass .less .styl .vue .svelte .php .py .rb .java .go .rs .cs .aspx .jsp .sql .wasm` —— **命中 0**。
- **框架/库**：React / Vue / Angular / Svelte / jQuery / Bootstrap / Tailwind / Socket.IO / PeerJS —— **命中 0**（`css/style.css` 与 `members/*` 的 136 处是 `document.createElement` 被正则误伤的假阳性）。
- **模块系统**：`type="module"` **0 个**、`import` / `export` / `require(` **0 处**。**162 个 `<script>` 全是传统 classic script**（靠 `defer` + 全局函数互相调用）。
- **网络请求**：`XMLHttpRequest` / `new WebSocket` / `new EventSource` / `sendBeacon` **各 0 处**；`fetch(` 只有 1 处，在 `offline-sw.js` 的 `fetch` 事件处理器里做**缓存未命中时的同源透传**。无 API key / token。
- **`game/demo` 里的外部 URL 只有 1 条**：`members/TanYiqing.html:56` 的 `<a href="https://music.163.com/...">`（成员个人页的外链，**普通超链接，不是资源依赖**）。
- **本地资源引用 248 个，缺失 0 个**；无 `<iframe>`；3 个 CSS 全部是原生 CSS（`var(--x)` 自定义属性），**无 `@import` / 无 `$var` / 无 `@mixin`** 等预处理器语法。
- `css/style.css` 实测 **7192 行 / 250KB**（旧文档写的 5209 行已过时）；`js/` 23 个文件共 **约 11600 行**。

> ⚠️ **仓库根与其它同学子项目不属于本项目的技术栈**：仓库根 `index.html` 从 `cdn.jsdelivr.net` 加载 **PicoCSS**；`chinese-food/tools/` 有 **5 个 Python 脚本** + `images/_hits.json`，页面还引用了 `commons.wikimedia.org` / `res.weread.qq.com` 的图片；`poems/` 各页外链 `wikipedia.org`；`movies/` 干净。这些都不要按本文件的约定去"对齐"。

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
├── index.html                # 主页：内嵌登录 + 注册/小组介绍入口；登录成功播放序章并以地图推镜转场
├── register.html             # 注册页（另开页面）
├── menu.html                 # 游戏主界面：承接登录序章的地图显影 + 液态玻璃战役地图 #campaign-map + 存档/导航
├── mode.html                 # 模式选择页：单人战役 / 联机会战入口（登录后由 index.html 进来）
├── multiplayer.html          # 联机会战页：红蓝 P2P 对战（WebRTC DataChannel，无联机服务器）
├── offline-sw.js             # Service Worker：首次在线访问后缓存本地资源，供联机页离线重进（无外链）
├── achievements.html         # 成就页（2026-09 独立成页，成就墙 #achv-area 在 .panel-card 里；页面只有「返回主界面」一个出口）
├── group.html                # 小组介绍页：主页同款军情室背景 + 玻璃成员面板 + 6 个个人页入口
├── game1.html                # 第 1 关 破晓防线（20 回合）
├── game2.html                # 第 2 关 炮火走廊（25 回合）
├── game3.html                # 第 3 关 晨雾突骑（21 回合，前 2 回合整队后 breakthrough）
├── game4.html                # 第 4 关 双胜逐猎（20 回合，红方 flee 撤退结算）
├── game5.html                # 第 5 关 烈焰攻坚（18 回合，红方站桩，按步数给星）
├── game6.html                # 第 6 关 利尼决战（22 回合，集火最强蓝方）
├── game7.html                # 第 7 关 滑铁卢改写（隐藏关，18 回合，guarded_core 双阶段近卫阵；入口带校验）
├── game8.html                # 第 8 关 最后防线（测试关；自带布阵与拖拽，注册在 levels.js 的 SUPPLEMENTAL_LEVELS）
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
│   └── style.css             # 全局样式（约 5209 行）：基础 UI →「2026 UI 重制」→ 每关桌面 → 三语/夜览 → 电影化 UI → 战场反馈 → 两阶段军令箭头 → 小组页 → 连续立绘动作/跨页接镜
├── js/                       # 22 个文件、约 9263 行
│   ├── constants.js          # 兵种数值原型 + 图片常量 + loseTips 初值
│   ├── pieces.js             # 棋子 DOM 创建 / 移动落点（movePieceTo）
│   ├── arrow.js              # 常驻方向箭头
│   ├── dialog.js             # 立绘式剧情对话引擎 playDialogue()；actor 层逐句重启并在整句期间循环表演；顺带用 initBgm 起关卡背景音乐
│   ├── account.js            # 注册/登录/登出（localStorage 账号层）
│   ├── ui.js                 # UI 提示组件：toast / achievementToast / modalConfirm / modalNotice
│   ├── bgm.js                # 背景音乐统一入口 initBgm()：先尝试播放，被拦才退回"点击播放"
│   ├── save.js               # 存档层：a.save + save1~3；成就；隐藏路线判据；clearAuto / resetAutoSave
│   ├── main.js               # 引擎主体（约 3000 行）：回合、移动、攻击、选择、面板、范围圈、结算、进关流程
│   ├── fx.js                 # 表现层特效：行军颠簸/扬尘 + 后坐/烟雾/枪口火光 + 弹道/命中冲击
│   ├── ai.js                 # 红方 AI：stationary / breakthrough / cluster / circle / flee / guarded_core
│   ├── levels.js             # 关卡注册表：顺序、标题、AI、hint、章节/立绘剧情、map{lon,lat}
│   ├── menu-saves.js         # 主界面：战役地图渲染 + 「读取存档」弹卡（含重新开始）
│   ├── menu-achv.js          # 成就墙渲染（供 achievements.html）
│   ├── game1.js … game7.js   # 各关棋子配置（一律用 constants.js 的常量）+ 末尾 loadGame / loadSnapshot
│   └── game8.js              # 测试关资源（约 2800 行；自带部署期、拖拽、红线结算，未接线）
├── img/                      # 58 个文件（PNG 原图 27 + WebP 运行版 30 + europe-map.svg）
│   ├── blue_infantry / blue_artillery / blue_cavalry / blue_skirmisher / blue_grenadier .png
│   ├── red_infantry / red_artillery / red_cavalry / red_grenadier .png  # 红方无散兵图（走文字占位）
│   ├── background1.png、backgrass1/2、backdis1/2、backice1/2 .png        # 每关棋盘桌面（style.css 末尾接管）
│   ├── europe-map.svg        # 主界面战役地图底图（37.9KB，viewBox 0 0 1000 785）
│   ├── level1-intro-1.png    # 第 1 关教学图①：选中/下令/攻击 四步操作
│   ├── level1-intro-2.png    # 第 1 关教学图②：步兵兵种介绍
│   ├── level2-intro-1.webp   # 第 2 关教学图：炮兵（新兵种首秀）
│   ├── level3-intro-1.webp   # 第 3 关教学图①：骑兵
│   ├── level3-intro-2.webp   # 第 3 关教学图②：散兵
│   ├── level4-intro-1.webp   # 第 4 关教学图：掷弹兵
│   └── portraits/            # 立绘 9 组（中性 4 + 动作差分 5），每组 PNG + WebP
├── favicon.svg               # 网站图标
├── README.md                 # 项目文档（按"文档要求"7 问组织）
└── AGENTS.md                 # 本文件：项目现状 + 工程约定 + 验收清单
```

## 关卡配置一览


| 关 | 标题（`levels.js` 的 `name`） | 页面 | 回合 | 我方 | 敌方 | AI | 特殊结算 | 星级规则 |
|--|--|--|--|--|--|--|--|--|
| 1 | 第 1 关 · 破晓防线 | `game1.html` | 20 | 4 步 | 5 步 | 站桩 | — | 通用 |
| 2 | 第 2 关 · 炮火走廊 | `game2.html` | 25 | 1 步 1 炮 | 3 步 1 炮 | 站桩 | — | 通用 |
| 3 | 第 3 关 · 晨雾突骑 | `game3.html` | 21 | 4 | 5 | `breakthrough` + 前 2 回合整队 | — | 通用 |
| 4 | 第 4 关 · 双胜逐猎 | `game4.html` | 20 | 6 | 5 | `flee` → `{9.5,-0.5}` | `objective.type='retreat'` | 按逃脱数 |
| 5 | 第 5 关 · 烈焰攻坚 | `game5.html` | 18 | 6 | 8 | 站桩 | — | 按通关步数 |
| 6 | 第 6 关 · 利尼决战 | `game6.html` | 22 | 6 | 6 | `breakthrough` | — | 通用 |
| 7 | 第 7 关 · 滑铁卢改写（隐藏） | `game7.html` | 18 | 6 | 9 | `guarded_core` | — | 通用 |
| 8 | 第 8 关 · 最后防线（测试） | `game8.html` | 12 | 5 炮（`speed=0` 固定） | 7 | 自带脚本（不走 `ai.js`） | `objective.type='line_defense'` | 按突破数 |

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
- **声明方式**：关卡在 `levels.js` 写 `ai` 字段，由 `attachLevelAI(id)` 挂到 `CURRENT_GAME.ai`（`gameN.js` 末尾调用）。缺省 / `null` = 站桩；`openingDelay:N` 可让红方开局整队 N 回合，`cavalryPriority:false` 可关闭骑兵强制优先追炮。
- **策略**：`stationary`（站桩）/ `breakthrough`（向威胁最大的蓝方集中突破，`threat` 可选 `nearest`（默认）/ `strongest` / `weakest`）/ `cluster`（向 `core` 下标抱团）/ `circle`（往 `center`+`radius` 圆环填空）/ `flee`（朝 `fleeTo` 直线撤离）。
- **两条特殊规则**：① 已交战（射程内有可命中蓝方）的红方**一律原地固守**（`aiIsEngaged()`）；② 红方骑兵默认优先把蓝方炮兵当目标，但关卡可用 `cavalryPriority:false` 关闭（第 3 关轻骑采用此配置）。
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

**新兵种靠"战前教学图"介绍**（2026-09-17 起，见「页面结构与各页职责」的进关流程）：每个新兵种首次成建制登场的关卡，把一整页 PPT 风格的教学图挂到该关 `levels.js` 的 `introImages` 上，玩家在战前简报之后、进棋盘之前逐张翻。

| 关 | 教学图 | 内容 |
|--|--|--|
| 1 | `level1-intro-1/2.webp` | 选中 / Ctrl 多选 / 框选 / 下令 / 接敌开打四步操作；步兵 |
| 2 | `level2-intro-1.webp` | 炮兵（射程 4.0 最远、速度 0.05 最慢） |
| 3 | `level3-intro-1/2.webp` | 骑兵（速度 0.2 最快、攻击 1.0 最高）、散兵（射程 1.0 / 血 42） |
| 4 | `level4-intro-1.webp` | 掷弹兵（射程 0.5 / 血 120 / 速度 0.05） |

> 每张教学图都挂在**该兵种首次成建制登场的那一关**：炮兵 L2、骑兵与散兵 L3（`game3.js` 的蓝方编队里两者都有）、掷弹兵 L4。要改顺序只动 `levels.js` 的 `introImages` 即可，`main.js` 不用改。

## 脚本加载顺序与模块

- **游戏页**：`constants → pieces → arrow → bgm → dialog → account → ui → save → main → fx → ai → levels → gameN`（都是 `defer`）。
  - `bgm.js` 放在 `dialog.js` **之前**：`dialog.js` 要用它的 `initBgm()` 把背景音乐挂到剧情弹窗的"继续"按钮上。
  - `gameN.js` 末尾做入口校验 / `loadGame(gameN)` / `loadSnapshot()`——**`gameX.js` 一加载就建房建棋子**。
- **其它页**：`index.html` = `ui → account → bgm`（登录成功后先播 5.2 秒可跳过序章，再用约 0.98 秒地图推镜离场）；`register.html` = 只有 `account`；`menu.html` = `account → ui → save → levels → menu-saves → bgm`（带 `?intro=1` 时由 `#campaign-arrival` 承接全屏地图，并用 1.9 秒显影到真实地图框）；`achievements.html` = `account → ui → save → menu-achv → bgm`；`end-game` / `fail` / `hidden-end` = `account → ui → save → bgm`；**`destiny-fail.html` 只有 `bgm.js`**（它只显示结局文字 + 一个 `Next`，不需要账号/存档/提示组件）；`group.html` = `ui`（三语与日夜主题）。
- **只有 `gameN.js` 存本关棋子配置**，跨关卡信息一律进 `levels.js`（方便各人维护自己那关）。
- `main.js` 一加载就 `getElementById` 一批固定元素，**缺一个就报错**（见「页面结构与各页职责」）。

## 运行机制（改动前必读）

- 点一次「下一步」（原 Next Turn）= 同步连跑 **24 个"帧"**（`nextStep()`）算作一回合；画面上的平滑移动只是 CSS `transition` 补的动画，战斗结算一瞬间就完成。
- 移动模型（蓝红统一）：玩家给棋子设"目标点"，每回合可改，不改就沿用；走到就停；**路上敌方进入攻击范围就停下开打（攻击优先于移动）**。
- 攻击没有冷却、不分先后手，每帧结算一次，基本是双方 DPS 对耗。
- 棋子中心保持至少 **0.56 格**间距；目标受阻时按左右 55°、90°依次尝试绕行，全部受阻就原地等待。近战接战距离同步提高到 0.58 格，避免为了开火再次叠在一起。
- 每次推进前保留一步内存快照（位置、目标、LP、阵亡/逃脱、剩余回合、选中状态），本关最多使用 **3 次回退**；读档或刷新后重新计数。
- 每次结算击破至少 1 支红军会积累 **1 级战意**（最多 3 级），下一步蓝军攻击分别 +8% / +16% / +24%；本步未歼敌则衰减 1 级。威胁等级、剩余敌军、战意常驻左上战况条，配置来自 `levels.js` 的 `difficulty` / `mechanic`。
- 每个棋子上方常驻实时 LP 条：>55% 绿色、≤55% 黄色、≤25% 红色呼吸；每次伤害、阵亡、读档和回退均立即重绘。
- 行动顺序 = `armys` 数组顺序（`gameN.js` 里 push 的顺序，蓝方先、红方后），每帧按序逐个结算。后果：后面的棋子同帧能打到刚移动过来的前面的棋子，而前者要等下一帧才还手（当作合理 feature 保留）。
- 判死条件是 **`lp <= 0`**（原"`lp < 0`、恰好归 0 不死"的 bug 已修）。
- **一回合 24 帧跑完立刻判胜负**：红方全灭优先判胜；否则蓝方全灭 / `remain_turns == 0` / 第 4 关逃脱超限判负。判胜负后 `#board`、`#button` 等隐藏，只留结算区。
- 死单位先灰显，下一次点 Next Turn（`clearDisable`）才从棋盘消失；结算区的 `Replay` 会带一次性 `?replay=1` 重载，跳过剧情、简报及**战前教学图**并直达棋盘，然后用 `history.replaceState` 消耗该参数。
- 响应式：`html { min-width: 320px }`；断点 `max-width: 1100px`（面板收窄）、`max-width: 760px`（棋盘边框 6px、单列堆叠）、`max-height: 680px and min-width: 761px`（压扁纵向留白）；`prefers-reduced-motion: reduce` 关掉过渡与部分动画。

### 选择与查看模式

- 指挥模式（默认）的选中集合 `selectedPieces`（只含存活蓝方）：单击 = 单选、Ctrl/Shift+单击 = 加减选、拖拽 = 画框多选、点空白/红棋 = 给全部选中下令移动、对唯一选中再点一下 = 原地待命。**下令后选中被清空**（箭头还在、范围圈消失）。
- 左侧 `#info-bar`（`renderInfoPanel`，随选中/每回合刷新）列出类型 / 射程 / 攻击 / 速度 + LP 进度条；**没有选中时整条隐藏**（`display:none`，不显示空态文案）。
- `查看敌人` 按钮把 `viewMode` 切到 `'enemy'`：左键单选或拖拽框选红方（`selectedEnemies`，不画外圈），右侧 `#enemy-info`（`renderEnemyPanel`）显示剩余 LP；再按一次返回指挥。
- 战场没有弹窗/剧情遮罩时按 **Esc**，统一清空 `selectedPieces`、`selectedEnemies`、框选状态、攻击范围和临时预览箭头；弹窗存在时由弹窗自己的 Esc 关闭逻辑优先。
- 选中蓝方后棋盘进入 `.is-order-aiming`：鼠标移动时为每个选中单位复用同一条 `.order-arrow--preview`，长度/方向连续过渡，内部金色信号向目标流动；下令后保留蓝色常驻箭头，红方 AI 用红色版本。箭头结构固定为 `.oa-origin + .oa-line + .oa-head`，不要退回普通 2px 虚线三角形。
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

**三语机制要点**（2026-09-16 大修后）：

- 语言存 `localStorage['napoleon-language']`（`zh-CN` / `zh-TW` / `en`），主题 `napoleon-theme`、静音 `napoleon-sound-muted`。
- `uiT(key, vars, fallback)`：zh-TW 缺词条时**回退简体再走 `toTraditional()` 繁化**（此前直接显简体，是结局页夹简的根因）；所以新 UI 文案至少要给简 / 英两套，zh-TW 自动生成。`toTraditional()` 先替换词组表再逐字查 `TRADITIONAL_CHARS`，新增残简时优先补词组表（避免单字误伤，如"游击"）。
- 语言切换事件 **`ui:languagechange` 在 `window` 上 dispatch**（挂 document 收不到）；动态渲染的入口（如 menu 成就计数）必须监听它重渲染。
- 关卡元数据用 `localizedText(zh, en)` 包成 `{zh,en}` 对象，经 `gameContent()` / `uiLocalize()` 在 zh-TW 自动繁化；裸简中串（如曾写在 `levels.js` 的第 8 关名）会在英文简报里残简。
- CSS generated content（`::before content`）不能用 data 属性翻译，用 `html[lang="zh-TW"] #x::before { content:'…' }` 分别声明（见 game8 红线标签）。

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
- 所有带 `<audio>` 的页面由 `ui.js` 在右上工具条生成声音按钮；点击调用 `toggleBgmMuted()`，状态保存到 `localStorage['napoleon-sound-muted']` 并同步页面内所有音频。无音频的 `game8.html` 不生成该按钮。
- 已删除的旧机制：`sessionStorage.startMenuMusic` 接力（index 写 / menu 读）、`sessionStorage.game1Music`（写了没人读，2026-09 清掉）。

## 特效（`js/fx.js`）

两个特效层由 `fx.js` **动态创建**在 `#board` 内，页面 DOM 不用改：

- `#fx-layer`（`z-index:120`）：开火烟雾 + 枪口火光 + 弹道曳光 + 命中冲击环，盖在棋子之上；
- `#fx-trail-layer`（`z-index:8`）：移动扬尘尾迹，压在棋子之下（像留在地上的土）。

- 挂载点只有 4 类（`main.js`）：两处开火结算后 `fxMarkFired(element, atktar)`、移动前坐标传给 `fxMarkMoving(element, x0, y0)`、24 帧循环结束后 `fxFlush()`。**不要逐帧创建 DOM。**
- ⚠️ **参数是 `armys` 里的军队数据对象，不是 DOM 元素**（对象含字符串 `id='piece-N'` / `posx` / `disabled`）；fx.js 内部按 `unit.id` 自行 `getElementById`。
- ⚠️ **特效锚定"事件发生瞬间"的逻辑坐标**：`fxMarkFired` 记下开火当帧双方坐标，同回合同一对单位只聚合一次；flush 时射手已离开开火点（> `FIRE_STAY_EPS=0.05` 格，典型是击杀后继续推进）就**不挂 `.is-firing`**，烟/火光/曳光/命中环全部画在开火瞬间的地面旧坐标上——修的就是"棋子移动时身上冒战斗特效"。
- 聚合：开火 1 撮 = 烟团 + 火光 + 1 条曳光 + 1 个命中环；移动 1 条尾迹 = 沿路径等距 ≤10 个尘团，并给棋子图添加 0.68 秒行军颠簸（位移 < 0.3 格不画尾迹）。
- 参数集中在 `fx.js` 顶部：`PUFFS(6) / PUFF_MS(1500) / FLASH_MS(240) / TRACER_MS(320) / IMPACT_MS(760) / TRAIL_MAX(10) / TRAIL_MS(1400) / TRAIL_MIN_CELL(0.3) / TRAIL_SPACING(0.35) / SPAWN_DELAY(40) / MAX_NODES(200)`；外观集中在 `style.css` 最后一段。
- **尾迹必须"亮芯 + 暗环"双对比**（深草地底与浅冰面底都要看得清）；尘团尺寸 2.4dvh。
- 开关：`window.fxEnabled = false` 即时关闭；`prefers-reduced-motion` 或页面不可见时不生成；调试 `fxDebug.liveCount()` / `fxDebug.clearAll()`。
- ⚠️ 三个坑：① `.chess` 是 `overflow:hidden`，烟**不能**挂在棋子的 `::before/::after` 上；② 坐标用棋盘几何换算（与 `pieces.js` 的 `movePieceTo` 一致：相对棋盘内容区 `left/top = offset + distance*逻辑坐标`），`distance`/`offset` 只能靠实测 `.cell` 矩形反推；③ fx 层是 `#board` 的 `position:absolute; inset:0` 子元素，containing block 是棋盘 padding box，**坐标里绝不能加 `getBoundingClientRect()` 的屏幕偏移**（2026-09-16 曾整体错位约一个棋盘位置）。

## 主界面与战役地图（`menu.html` + `js/menu-saves.js`）

`menu.html` 只有：登录序章接镜层 `#campaign-arrival`（仅 `?intro=1` 时显示）→ 页头卡片（kicker / `h1` / 欢迎语）→ **液态玻璃 HUD 外壳** `.campaign-map-shell`（内含战役地图 `#campaign-map`）→ 底部导航行 `ul.menu-list`（小组介绍 / 成就（含计数，`refreshAchvLink()` 走 `uiT('menu.achievements')`）/ 退出登录 / **`#btn-saves`「读取存档」**，2026-09-16 起按钮归到这一排末位）。内联脚本做登录校验、欢迎语、`renderMenuSaves()`、`bindMenuSaves()`、接镜显影、`refreshAchvLink()`（并监听 window 的 `ui:languagechange` 重渲染）、登出。外壳可做 padding / border，内层 `#campaign-map` 仍禁止这些属性，以保证旗标坐标不偏移。

**地图**

- 底图 `img/europe-map.svg`（37.9KB，`viewBox="0 0 1000 785"`）：由 **Natural Earth（公有领域）** 经 `world-atlas@2` 的 `countries-50m.json` **本地生成**（等经度 + 墨卡托；`lon −10..40 / lat 34..60`）。**生成脚本是一次性的、用完已删**；来源与参数写在 SVG 顶部注释里。
  - 不要用 Wikimedia 抓图（这台机器上 `upload.wikimedia.org` 返回 429/400）；`cdn.jsdelivr.net` / `raw.githubusercontent.com` 正常。
- **投影必须两边一致**：`menu-saves.js` 顶部的 `MAP = { lonMin:-10, lonMax:40, latMin:34, latMax:60 }` 与 `mercY()` 必须和生成 SVG 时同一套公式。**改地图范围要同时改 SVG 与这段常量。**
- 旗标位置来自 `levels.js` 每关的 `map:{lon,lat}`（以仓库当前值为准，**下面就是实测值**）：
  L1 土伦 **5.93/44.50**（上移）、L2 图卢兹 1.44/43.60（手动西移）、L3 耶拿 11.59/50.93、
  L4 柏林方向 13.40/52.52（手动东北移）、L5 斯摩棱斯克以西 31.00/54.60、
  L6 滑铁卢 4.58/50.51、L7 法国北部一带 **1.28/48.20**（象征性，左移+下移）。
  - 2026-09-16 玩家调整（三次，每次都要复算）：
    ① L1 从 43.12 上移到 **44.50**（≈27px）—— 原位置正压在地中海岸线上，图钉下方的星级会落进海里；
    ② L7 从 49.05 下移到 **48.20**（≈18px）—— 原来和 L6 的图钉挤在一起；
    ③ L7 又从 3.08 左移到 **1.28**（≈1.8°）—— 下移之后它**转而压住了 L6 星级的最左那颗**
       （L6 的星级是以圆钉中心为轴左右展开的，最左那颗正好探向左下）。实测各视口需要左移
       1.25°~1.67°，取最坏情况 1.8°。
  - 换算口径：`mercY()` 投影下 **1 经度 ≈ 地图内宽 × 20 / 1000 px**、**1 纬度 ≈ 地图内宽 × 26 / 1000 px**
    （地图内宽 = 外壳宽 − 16）。改完必须用 `mapPos()` 复算，并且**实测 `elementFromPoint`**
    确认星级没被相邻图钉的圆钉盖住 —— 只看"{中心距 ≥ 半径和}"是不够的，星级横向铺开 35px 才是真矛盾。
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

`game1~7.html` 把 `#win` / `#lose` 与 `#button-next-game` / `#button-replay` / `#button-fail` **一起包进 `<div id="result-area">`**（`#button`（「下一步」）留在外面）。

- CSS：`position: fixed; left/top: 50%; transform: translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:0.9rem; z-index:60`，并加 `pointer-events:none`（子元素 `auto`，空的时候不挡棋盘）。实测整组中心与视口中心偏差 **0.00 / 0.00**。
- **为什么必须包一层**：只给 `#win`/`#lose` 定位是不够的——结算按钮是 `body` 的兄弟节点，会留在文档流上方。
- **判负时 `Menu` 也要进组**：`main.js` 的 `hideMidGameControls()` 故意保留 `Menu` 作为出口，判负分支会调 `moveMenuIntoResultArea()` 把 `#button-exit` 挪进 `#result-area`——调用点是**通用判负分支 + 第 5 关自己的两条分支 + game8 的 `line_defense` 分支**（最后这个在 game8 里是空操作，那边没有 `#result-area`）；**判胜不挪**（判胜时整条 `#game-actions` 都是隐藏的，结算页只留 `Next`）。
- **`game8.html` 没动**：它有自己的一套结算分支、也没有 `#result-area`，`moveMenuIntoResultArea()` 在那边是空操作。

## 页面结构与各页职责

- **游戏页固定 DOM**：`#board`、`#button`（「下一步」）、`#result-area`（内含 `#win`/`#lose`/星级/`#button-next-game`/`#button-replay`/`#button-fail`）、`#info-bar`、`#enemy-info`、`#game-actions`（`#save-load-btns`（Save / `#slot-select` / Load / 查看敌人）+ `#button-exit`（Menu））、`.game-heading`（`h2` + `#footer-bar`）。**一套都不能少**，`main.js` 一加载就取。
- **登录序章按账号记忆**（2026-09-16）：序章是否播过存 `localStorage['prologue:<用户名>']='1'`（`account.js` 的 `hasSeenPrologue/markPrologueSeen`）。登录成功：有标记直跳 `menu.html`，无标记播序章；序章正常收尾与"跳过序章"都落标记后跳 `menu.html?intro=1`；注册成功跳 `index.html?prologue=1`（IIFE 自动播）。老账号无标记首次登录最多补播一次。
- **战况条与右侧指挥停靠坞**（2026-09-16）：`renderBattleStatus()` 左上战况条含金色 pill「剩余 N 回合」（`.battle-status__turns`，key `game.turnsLeft`；`remain_turns<=5` 加 `is-urgent` 红色呼吸，reduced-motion 关闭）；`h2` 与 `document.title` 统一取 levels 注册表的 `meta.name`。宽屏 `@media (min-width:1101px)` 下 `#button` 与 `#game-actions` 改为 `position:fixed; right:14px` 的右侧纵向停靠坞（窄屏 ≤1100px 仍是棋盘下方流式；game8 不套右坞）；判胜/判负后右坞随结算隐藏，`view-enemy` 时敌方面板挪到左侧。
- **进关流程**（`main.js` 末尾）：**有战前教学图的关（第 1~4 关）** = 立绘剧情 → 战前简报（`开 战`）→ 教学图 1..N（逐张弹窗，点右上角 `×` 看下一张）→ 棋盘淡入；**其余关** = 立绘剧情 → 战前简报 → 淡入。每一步都裹 `try/catch`，异常直接 `revealBattlefield()`，不会卡在全黑。
  - **教学图清单写在 `levels.js` 每关的 `introImages`**（字符串数组，`main.js` 的 `levelIntroImages(meta)` 读取）：**没写 / 空数组 = 本关不弹教学图**（第 5~8 关就是这样）。第 1 关 2 张（操作四步 + 步兵）、第 2 关 1 张（炮兵）、第 3 关 2 张（骑兵 + 散兵）、第 4 关 1 张（掷弹兵）。
  - **弹窗样式完全复用第 1 关那一套**（`.level-intro-image-overlay` / `-box` / `-image` / `-close`），**CSS 一行没改**；渲染尺寸 `max-width: 96vw; max-height: 94vh` + `object-fit: contain`。删掉原来硬编码的 `if (CURRENT_LEVEL_ID !== 1) { next(); return; }` 与 `const images = [两张固定路径]`，改成读 `introImages`。
  - **预热与 preload 都跟到第 2/3/4 关**：`warmLevelIntroAssets()` 现在遍历 `levelIntroImages(meta)`；`game2/3/4.html` 也各加了 `<link rel="preload" as="image" ... type="image/webp">`。
  - **跳过条件与第 1 关完全一致**：`?replay=1`（Replay 按钮）与中途读档的 `opts.skipIntro` 都会**整套**跳过（剧情 + 简报 + 教学图），直接淡入战场。
  - `level-opening` 这个 `body` 类**必须成对**：它把战场藏起来，只有 `revealBattlefield()` 会摘掉。
- **结局页**：`.page-ending` + `.form-box` 里一个 `Next`。结局页的 `.form-box` 把背景/边框/圆角/阴影/内边距全部归零，**还必须关掉 `.page-ending .form-box::before`（`content:none`）**——那套皮肤给它挂了一个 `inset:7px` 的 1px 装饰线框，只清本体 `border`/`box-shadow` 它还在，按钮上会留一道细线。`index.html` / `register.html` 的登录注册表单走另一套皮肤（选择器带 `.page-ending` 前缀，不受影响）。
  - `end-game.html` 里那句 `.page-note#normal-note`"（历史正常进行……而另一种可能，还藏在更深处……）"**只在隐藏路线还没打开时显示**：页面脚本里 `hiddenRouteOpen()` 为真就把它 `display:none`（否则"还藏在更深处"跟地图上已经出现的隐藏关自相矛盾）。其余三个结局页的 `.page-note` 是常显的。
- **成就页**：成就 4 项——`victory_end` 胜利 / `tragic_fail` 惨痛失败 / `empire` 法兰西帝国 / `rise_again` 失败乃成功之母（同关连败 ≥4 后以 3 星通关）。`menu-achv.js` 优先填充页面预置的 `#achv-area`（保留它的 `.panel-card`）。
  - 页面出口**只有「返回主界面」一个链接**（`logout-btn` 与"退出登录"已删，要登出请回主界面）；内联脚本因此只做**登录校验 + 欢迎语**（BGM 由 `initBgm` 起）。
  - ⚠️ 这一页的**内联脚本必须语法自检**：2026-09 它末尾多了一个 `});`，整段 `<script>` 直接 SyntaxError、什么都不执行（表现为"成就页空白 / 打不开"：欢迎语空、成就墙空、BGM 也不起）。同一处还有一行脚本标签被写成了**字面量 `\t<script ...>`**，会在页面上显示成一段 `\t` 文字。删 DOM 元素时**记得连它的事件绑定一起删**（`getElementById` 拿到 null 再 `.addEventListener` 会抛错，同样带崩整段脚本）。
- **`game8.html`**：测试关，不在战役地图里（但在 `levels.js` 的 `SUPPLEMENTAL_LEVELS` 注册，id=8，因此也有战前剧情/简报与三语 `meta.name`），只能直接开 URL；红方推进是自带脚本（不走 `ai.js` 的策略）；`fx.js` / `main.js` 已接入（部署后的战斗复用回合引擎、`line_defense` 胜负分支与特效层）。

## 排查 CSS 问题时的两条通用经验

本项目由两个 demo 合并而来（A = `demo-游戏内容多` 的玩法底座，B = `demo-美化好` 的表现层），`style.css` 里 **B 的「2026 UI 重制」段在 A 的规则之后**，它们**特异性常常相同**，于是 B 会赢。

1. **"整体替换型"属性**（`filter` / `transform` / `box-shadow` / `border` / `background`）最容易出事：A 的某状态规则（`.chess.disabled` 等）与 B 的 `.game-page .X` 同特异性时会被整个替换。加新状态样式请写在**文件末尾**并用 `.game-page` 前缀把特异性抬到 (0,3,x) 以上，别指望靠顺序。
   - 已用这条修过：阵亡单位"先变灰再消失"的**变灰阶段**失效（`.game-page .chess.disabled img`）。
   - `.selected` / `.highlighted` / `--blue:hover img` 是 B **有意**接管皮肤，不要"修"。
2. **`#board` 有 9px 边框（窄屏 6px）**，而棋子/箭头/范围圈/框选矩形都是 `#board` 的绝对定位子元素，坐标原点在 padding box。**任何"鼠标 → 棋盘坐标"的换算都要走 `boardContentRect()`**（用 `clientLeft`/`clientTop`），不要直接用 `getBoundingClientRect()`。目前 4 处在用：`renderOrderPreview()`、点击下令处、`updateBox()`、框选夹取 `clampPointToBoard()`。⚠️ **`boardContentRect()` 必须返回完整的 `left/top/right/bottom/width/height`**（右/下对称扣边框）——2026-09-16 它只返回 left/top，夹取算到 `undefined` 出 NaN，框选永远进不了 moved 态。
   > `.cell` 的 1px 网格线不会造成偏移（`*{box-sizing:border-box}`）。
   - 框选的 mousemove/mouseup 必须挂 **window**（鼠标移出棋盘甚至移出窗口外松手都要能完成框选），左键/右键都可起框，Esc 走 `cancelBoxDrag()`；window mouseup 处理器要**先无条件摘监听 / 清 `is-box-dragging` 再判空**，否则棋盘内松手（board mouseup 先冒泡清状态）会泄漏监听。
3. **每关棋盘桌面**靠 `style.css` **最末尾**的 `.game-page.gameN #board` 块（特异性 1,2,0）接管，必须把 `background-image / size / position / repeat` **四条一起重声明**，否则会被重制段的 `background-size: 20% 20%` 平铺成小图。

## 各关特殊玩法

- **第 4 关**：红方 `flee` 朝 `{9.5,-0.5}`（棋盘右上顶点）撤离；`game4.js` 的 `objective { type:'retreat', loseEscape:3, exitX:9.5, exitY:-0.5 }` 触发 `processTurnEscapes()` 的逐帧逃脱检测与追逐结算——逃脱 ≥3 判负，0/1/2 支 = 3/2/1 星；`escaped` 随快照持久化。
- **第 5 关**：8 名红方在右侧原地固守（`ai:null`），`turns_limit: 18`，按通关步数给星（见「关卡配置一览」）。
- **第 6 关**：6 蓝 vs 6 红（含红炮 / 红骑），`breakthrough`（利尼决战），22 回合。
- **第 7 关**：隐藏关，`guarded_core` 双阶段近卫阵（核心存活时护卫补环、核心倒下转追击），18 回合；入口校验见「结局与解锁」。
  - **可通关性已实测确认（2026-09-16，见「历史记录」第十轮）**：**能过，而且能 3 星**；但**容错极低**——
    384 组启发式策略里只有 6 组获胜，获胜线要用满 17 个回合、终局只剩 2~4 名蓝方。
  - 关键打法：**炮打核心、骑/掷/步/散全部扑"最近的炮位"**，而且**必须每 1~2 回合重新下令**
    （一次性下令必败：终局仍剩 4 红、合计 291.6 血）。
- **第 8 关**：自带部署期与拖拽（类名 `game8-drag-piece` / `game8-artillery`），我方 5 门炮兵固定（`speed=0`），红方 7 人向右突破"红线"。

## 已知缺陷与待修

1. **第 5/6 关旧快照兼容**：两关的"战斗 + 回合数 + 叙事"在 2026-09 整体对调过（见「历史记录」），浏览器里遗留的旧中途快照仍记着旧布局与旧回合数，第 5 关的按步数给星会偏松。清掉这两关的快照或"重新开始"即可。
2. **第 8 关未接战役地图（设计如此）**：只能直接开 URL，不在 `menu.html` 地图上；它在 `levels.js` 的 `SUPPLEMENTAL_LEVELS` 注册（有剧情/简报/三语名），但不走主流程解锁。`objective.breakthrough_limit` 未被 `main.js` 读取（实际用 `loseEscape`）。
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
  - 23. ✅ 单位上方实时血条（伤害/阵亡/读档/回退同步，绿/黄/红三段状态）
  - 24. ✅ 按钮统一大圆角与点击回弹；`Next Turn` 改为「下一步」；自动存档选择器与按钮同皮肤
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
- ⚠️ **改完 `js/` 必须同时升 HTML 里的 `?v=` 版本号**（2026-09-16 实测踩坑）：
  只改 `js/main.js` 而不动版本号，浏览器会继续跑缓存里的旧文件。
  本次加"回合重入锁"后复测，程序化连点仍然一次消耗 7 个回合 ——
  一度据此以为"锁没生效"，实际是页面加载的还是旧的 `main.js`。
  **自查手法**：在页面里 `typeof 新函数名`（例如 `typeof turnRunning`），
  返回 `"undefined"` 就说明跑的是旧代码；或用 `page.request.get(url)` 直接读源码字符串比对。
  Playwright 侧可给 context 设 `Cache-Control: no-cache` 请求头，但**最稳的还是升版本号**。
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
- **2026-09-13 仓库合并重复修复**：清除入口、菜单、关卡与结局页的重复文档片段和重复 ID；恢复被拼接破坏的 `main.js` / `levels.js` / `style.css`；删除 `dialog.js` 重复 `finish()`、`save.js` 提前返回与重复提示、`game7.js` 重复锁定弹窗。三类胜利分支收敛到 `completeVictory()`，统一为「存档一次 → 成就判定一次 → 通关对话 → 中央战果卡」。验收：23 个 HTML 结构/内联脚本/重复 ID 通过，22 个 JS 通过 `node --check`，213 个本地资源引用有效，CSS 大括号平衡，无合并冲突标记。
- **2026-09-13 电影化 UI 精修**：`dialog.js` 为每句对白重启正文入场与说话者手势动画，底部对话台升级为深蓝/金线液态玻璃；登录页增加动态军情室背景、居中玻璃卡和 5.2 秒可跳过三语序章；主菜单在不改变 `#campaign-map` 坐标盒的前提下增加 `.campaign-map-shell` 玻璃 HUD，并把地图压成暗色指挥屏；全站按钮统一 14px 圆角和点击回弹；「下一回合」三语改为「下一步 / 下一步 / Next Step」；`#slot-select` 自动存档选择器改成按钮同款皮肤；桌面尽量锁在 100svh，移动端棋盘缩到 `min(88vw, 60svh)`。验收：22 个 JS 全部通过 `node --check`，17 个根目录 HTML 的内联脚本均能解析，本地资源引用 0 缺失，CSS 大括号深度归零，`git diff --check` 通过。
- **2026-09-13 Pages 缓存处理**：首次上线验收时公开页已返回新版 `index.html`，但无版本号的 `css/style.css` / `ui.js` / `dialog.js` 仍命中浏览器旧缓存（实测登录卡圆角仍为 3px）。因此 17 个根目录页面统一给关键资源加版本号；二次视觉验收又发现 `.form-box button` 的高优先级旧规则把登录按钮压回 2px，已补同级覆盖；公开剧情页验收再发现高屏幕下绝对定位对话框因遮罩滤镜产生 12px 渲染偏移，最终改为视口固定定位，并将遮罩入场改成纯透明度动画。CSS 最终升至 `style.css?v=20260914-ui4`。所有引用 `ui.js` / `dialog.js` 的页面仍使用 `v=20260913-ui`，测试关另给 `game8.js` 加同版号；确保组员打开公开网址即可拿到同一版 UI。
- **2026-09-14 战场玩法与反馈改造**：21 张运行图片改用 WebP，兵种图缩至 384px，教程/立绘/地形图保持适合展示的分辨率；对应资源总量由 **17,247,222 B 降为 858,558 B（-95.0%）**，第一关两张教程图再通过 `<link rel="preload">` 和 `Image.decode()` 提前加载。`main.js` 新增最多 3 次的内存回退、空行动弹窗、0.56 格防重叠绕行与实时血条；`fx.js` 新增行军颠簸、射击后坐、曳光和命中冲击；棋盘增加地形调色、等高线、暗角和精细边框；日/夜主题的环境亮度与色温差异扩大；自动存档控件统一为蓝底黄字。17 个 HTML 使用 `20260914-play1` 版本号。静态验收：22 个 JS 通过 `node --check`，17 个 HTML 内联脚本可解析、资源引用 0 缺失、CSS 大括号归零、初始编队最小间距各关均 ≥1.000 格。
- **2026-09-14 难度曲线 / 军令剧情 / 声音控制**：`levels.js` 给 1~7 关增加连续威胁等级与独有机制说明，战前简报、左上战况条同步展示；引擎新增击杀战意连段（最多 +24% 攻击）。第 3 关改为 21 回合，红方开局整队 2 回合，骑兵降为轻骑且不再强制追炮，缓解从第 2 关到第 3 关的断崖；后续关仍按撤退、限时攻坚、强攻集火、最终抱团逐级叠加机制。`Replay` 改为一次性跳过剧情直接开战。`dialog.js` 把底部玻璃条重做为“军令台 + 蜡封 + 羊皮军报”，发言者按下令 / 汇报 / 对峙 / 沉思执行不同动作，另一侧同步回应；右上工具条新增可持久化静音按钮。17 个 HTML 统一使用 `20260914-gameplay2` 版本号。
- **2026-09-14 Esc 与动态军令箭头**：补上战场级 Esc 监听，一次清除蓝方/敌方选中、框选、攻击范围和临时箭头，遮罩打开时不抢弹窗事件。预览箭头由“每次 mousemove 清空重建”改为按单位 id 复用节点，方向与长度连续变化；外观升级为海军蓝/帝国金描边轨道、向目标行进的信号段、扫光、起点军徽和军旗式箭头，红方使用克制的深红版本。选中单位自身增加低频指挥脉冲，`prefers-reduced-motion` 下停用动画。CSS 与 `main.js` 使用 `20260914-arrow3` 版本号。
- **2026-09-14 小组页与剧情人物动作**：`group.html` 去掉两层内联 flex 行和旧米黄纸卡，改为主页同款深蓝军情室动态背景、帝国金标题、液态玻璃总面板与 3×2 成员卡（820px/520px 两级自适应）；补回三语副标题并统一返回按钮。`dialog.js` 每句先清除动作类，强制刷新 `img` 自身布局后同步挂回动作类，并用 Web Animations API 将新动画拨回 0 秒，保证开场第一句、翻页瞬间与同一人物连续发言都重新播放；动作幅度重新调大并区分下令、汇报、对峙、沉思、倾听回应。17 个 HTML 的 CSS 与 8 个关卡页的 `dialog.js` 缓存版本统一为 `20260914-team-motion5`。
- **2026-09-14 剧情动作与登录接镜返工**：纠正“只在第一秒让整张静态立绘轻晃”的错误实现。`dialog.js` 在图片外增加独立 `.dialog-portrait__actor`，每句清类/强制布局后重启动画；所有发言者在整句期间循环动作，拿破仑另有 3.05/3.35 秒的下令与沉思循环（单次最大位移 38px、缩放 1.07、旋转 2.25°），并通过 `data-speaker` / `data-speaker-action` 暴露验收指纹。登录序章结束先用 0.98 秒将地图推近增亮，`menu.html?intro=1` 再由 `#campaign-arrival` 保持同图并用 1.9 秒完成“全屏地图 → 地图 HUD + 页头/按钮”的分层显影；无 `intro=1` 的普通主界面访问不播放。17 个 HTML 的 CSS 与 8 个关卡页 `dialog.js` 缓存版统一为 `20260914-cinematic7`。
- **2026-09-14 两阶段军令箭头返工与全项复核**：纠正 `arrow3` 把重动效放在鼠标预览、确认命令后却不从起点展开的状态倒置。选目标时恢复轻量红色虚线；确认目标后改为低饱和军蓝/深红、墨色轮廓、地图刷痕与宽杆尖头的纪录片沙盘军势箭头，去掉霓虹扫光、起点圆环和燕尾旗头。`main.js` 以“棋子 id + 目标坐标”记录命令签名，仅新下令/改令时用 0.72 秒从士兵位铺到目标位，后续行军缩短箭头时不重播。补齐 `game8.html` 的中央结算容器、统一结算/操作按钮类及三语钩子，移除一段重复 `#arrowSvg` CSS；17 个页面 CSS 与 8 个关卡的 `main.js` 缓存版统一为 `20260914-arrow4`。
- **2026-09-14 线上验收补丁**：在 GitHub Pages 逐页实测剧情、箭头、Esc、三语、夜览、重玩、无移动提示与三次回退。发现夜览模式的旧高优先级规则会压过自动存档选择器的蓝色渐变，现将最终蓝底黄字规则的边框与背景显式提权，保证昼夜两种主题一致；17 个页面 CSS 缓存版升级为 `20260914-arrow5`，`main.js` 保持 `20260914-arrow4`。
- **2026-09-16 六问题修复包（版本号统一 `20260916-fixpack1`）**：
  1. **序章按账号记忆**：`account.js` 新增 `prologueSeenKey/hasSeenPrologue/markPrologueSeen`，localStorage key = `prologue:<用户名>`（与 users / a.save 同套规则）。`index.html` 登录分支：有标记直跳 `menu.html`，无标记播序章；序章收尾 `go()`（含地图过渡层"跳过序章"按钮与 1.8s 自动进入两条路径）落标记后跳 `menu.html?intro=1`；`register.html` 注册成功改跳 `index.html?prologue=1`（IIFE 读 query + `currentUser()` 自动播）。老账号无标记首次登录最多再播一次。
  2. **布局三项**：`menu.html` 的 `#btn-saves`「读取存档」移入 `ul.menu-list` 末位 `<li class="menu-link">`（与小组介绍 / 成就 / 退出同排，`style.css` 补 `.menu-list button.menu-link` 皮肤）；关卡左上战况条新增金色 pill「剩余 N 回合」（`.battle-status__turns`，`remain_turns<=5` 加 `is-urgent` 红色呼吸动画 `turnsUrgentPulse`，`prefers-reduced-motion` 关闭）；宽屏（`@media (min-width:1101px)`）把 `#button` 与 `#game-actions` 收成右侧固定"指挥停靠坞"（`position:fixed; right:14px`，纵向排列，`#slot-select`/存档按钮全宽），窄屏 ≤1100px 保持棋盘下方流式；`game8` body 类是 `game8` 不是 `game-page`，天然不套右坞；`view-enemy` 时敌方面板挪到 `left:12px` 避免与右坞重叠；判胜/判负后右坞隐藏。
  3. **繁体大修**：根因是 `uiT()` 的 zh-TW 分支缺词条时直接回退简体（结局页因此夹简），已改为 zh-TW 缺词条走 `toTraditional()`；`toTraditional` 词组表与 `TRADITIONAL_CHARS` 单字表大幅扩充（约 +170 字）；新增约 50 个 MESSAGES 词条（简 / 英两套，zh-TW 靠 fallback 自动繁化），覆盖存档弹卡、game8 部署/战斗/结算、modal 默认按钮（`common.ok/cancel/gotIt`）、剩余回合等；`menu-saves.js` 约 24 处硬编码串、`menu-achv.js` 标题/徽章、`game8.js` 8+3 个字符串块、`group.html` 六个人名、game8 红线 CSS 标签（`html[lang] #defense-line::before` content 三语）全部接入；`levels.js` 第 8 关 `name` 由裸简中串改为 `localizedText`（修英文简报卡标题残简）；`menu.html` 成就入口计数改走 `uiT('menu.achievements')` 并监听 **window** 上的 `ui:languagechange`（注意事件在 window 派发，挂 document 收不到）。OpenCC 审计残余仅 4 个可接受项（仑/游为词组级误报，账→帳、湿→濕为台湾通行异体）。
  4. **战斗特效不再挂在移动中的棋子身上**：`fx.js` 重写为"开火瞬间坐标锚定"——`fxMarkFired` 记录开火当帧双方逻辑坐标，同回合同一对单位只聚合一次；`fxFlush` 时若射手已离开开火点（> `FIRE_STAY_EPS=0.05` 格）就不挂 `.is-firing`，烟团/枪口火光/曳光/命中环一律按开火瞬间旧坐标画在地面层。**参数契约：`fxMarkMoving/fxMarkFired` 收的是 `armys` 里的军队数据对象（不是 DOM），fx.js 内部按 `unit.id` 自行 `getElementById`**；特效坐标用相对棋盘的 `offset + distance*逻辑坐标`（与 `pieces.js movePieceTo` 完全一致），**禁止加 `getBoundingClientRect()` 屏幕偏移**。
  5. **小组页工具栏归位**：`.page-group > *` 通配规则把动态挂 body 的 `#ui-toolbar` 打成 relative，已改为 `.page-group > *:not(#ui-toolbar):not(#ui-notices)`，恢复全站统一的右上 `fixed; top:6px; right:6px`。
  6. **框选手感**：mousedown（左键 / 右键都可起框）后把 mousemove/mouseup 挂到 **window**（鼠标移出棋盘、移出窗口外松手都能完成框选）；`clampPointToBoard()` 把坐标夹在棋盘内；新增 `cancelBoxDrag()`（Esc / 异常中断统一摘监听）、`body.is-box-dragging` 全局十字光标 + 禁选文本；棋盘永久拦截 `contextmenu`，window 上仅右键拖拽中拦截。⚠️ **两个配套坑**：① `boardContentRect()` 必须返回完整的 `left/top/right/bottom/width/height`（原来只有 left/top，夹取算到 `undefined` 变 NaN，框选永远进不了 moved 态）；② window 的 mouseup 处理器必须**先无条件 removeEventListener / 清 body 类再判空**（棋盘内松手时 board mouseup 先冒泡清空 `dragBoxState`，先判空会泄漏两个 window 监听且残留 `is-box-dragging`）。
  - 验收：内置浏览器 file:// 实测——新账号注册自动播序章、跳过/看完都落 `prologue:<用户>=1`、重登直跳主界面；menu 底部导航同排含「读取存档」；三语逐页（登录/注册/menu/存档弹卡/小组/成就/四结局/game1·3·8 战斗与部署 UI）无残简，词条三语 0 missing；4 蓝兵冲锋实战有行军扬尘与交火烟雾、特效锚在地面、`fxDebug.liveCount()` 自动归零；group 工具栏 computed `position:fixed; top/right:6px`；框选窗外松手/右键/Esc/连点 10 次无监听泄漏；game8 红线校验、5 门部署拦截、首击只跑一回合（12→11）、12 回合判定与星级（0/1~2/3~4/≥5 突破 = 3/2/1 星/负）不回归。22 个 JS `node --check` 全过。
- **2026-09-16 美术素材替换包（图片版本号 `?v=20260916-img1`，CSS/JS 缓存版 `20260916-fixpack2`）**：替换 6 张素材的 PNG 原图并重新生成同名 WebP——棋盘底图 `backgrass1`（game1，2000px 源→WebP 1024²）、`backgrass2`（game2，源仅 354²，按原尺寸不放大）、`backdis1`（game3，1254px 源→1024²）、`backice2`（game5/game7，1254px 源→1024²）；教程图 `level1-intro-1/2`（game1 开战前两张教学图，保持 1530px 原尺寸，q82、method=6）。转换工具 ImageMagick：`magick in.png -resize 1024x1024> -quality 82 -define webp:method=6 out.webp`。为破缓存，`style.css` 中这 4 张底图的全部 `url()`（通用类 + `.game-page.gameN` + `--board-terrain` 共 15 处）与 `main.js`（预热 + 教程数组 4 处）、`game1.html`（2 条 preload）的 WebP 路径统一加 `?v=20260916-img1`；17 个 HTML 的 `style.css` / `main.js` 引用升到 `20260916-fixpack2`。⚠️ 棋盘底图统一与 `#board` 的羊皮纸底色 `rgb(215,195,154)` 做 `background-blend-mode:soft-light`，再叠地形 tint / 等高线 ::before（multiply 0.44）/ 暗角 ::after，所以新图在棋盘上会偏暖、偏淡，这是既有"作战地图"美术风格，不是图片没生效；判断是否生效看 `naturalWidth`（新底图为 1024）。验收：game1/2/3/5 棋盘 computed backgroundImage 均带 `?v=20260916-img1` 且解码尺寸正确，教程图为新版手绘教学页，`main.js` 通过 `node --check`。
  - 同批未采纳：随素材包带来的 `game1.js` / `game2.js` 是**更旧的副本**（红方坐标分别为 1.65/7.6、5.7/9.5 一带），仓库现行版已经是调整后的 (3.0,6.0)/(6.0,6.0) 与 (6.0,9.0)/(9.0,9.0)，覆盖会回退，故未应用。

- **2026-09-16 第二批界面修订 6 项（CSS/JS 缓存版统一 `20260916-fixpack3`）**：
  1. **主界面导航统一与换位**：`menu.html` 导航顺序改为 小组介绍 → 成就 → 读取存档 → 退出登录（读取存档与退出登录交换）；`#btn-saves` 此前被遗留 id 规则压成另一套字号/字重/宽度，`style.css` 改用 `.menu-list #btn-saves`（id 特异性）显式对齐锚点皮肤（11.52px/650、高 34、圆角 14、同款渐变；宽 145、≤760px 归 0 与锚点一致）。实测四按钮 computed style 完全一致。
  2. **删目标行 + 棋盘放大**：`main.js` `renderFooterStatus()` 的 goal 分支直接 return（不再渲染“消灭全部红方部队即可获胜！——你有 N 回合”，红方下划线 span/点击逻辑一并移除），尾部三档回合提示也删除（剩余回合只由左上 `#battle-status` pill 显示）；棋盘尺寸四档同步放大：宽屏 `min(72dvh,100vw-450px)`→`min(78dvh,100vw-440px)`、≤1100px `min(70dvh,82vw)`→`min(76dvh,86vw)`、≤760px 两处（1874 行块 `min(94vw,72dvh)`→`min(94vw,78dvh)`；注意 3684 行还有一个更晚生效的同媒体块 `min(88vw,60svh)`→`min(92vw,66svh)`，漏改它棋盘不会变大）、矮屏块 66dvh→72dvh。
  3. **右坞重排 + 回车**：`main.js` 初始化 IIFE 把 `#button`（下一步）移到 `#game-actions` 之后（game8 无效果，它是 `body.game8`）；宽屏坞改为贴棋盘右缘留 20px：`left:calc(50% + min(78dvh,calc(100vw - 440px))/2 + 20px)`（不再 `right:14px` 贴屏幕边），六个辅助按钮一列宽 188（top `calc(50% - 158px)`），下一步宽 188、min-height 48、字号 1rem、置底（top `calc(50% + 122px)`），两组间距约 25px；窄屏流式 `#button{margin-top:22px}` 自然置底。`#slot-select` 下拉箭头被 3835 行 `!important` 蓝渐变吞掉，用一对 8px 金色（#ffd978）三角 `!important` 重画（宽屏块 + 全局各一份，窄屏也生效）。新增回车 keydown 监听 = 点“下一步”，守卫：不 repeat、无 `.ui-modal-mask/.dialog-overlay/.level-intro-image-overlay`、焦点不在 INPUT/SELECT/TEXTAREA/BUTTON/A（在按钮上时交给浏览器原生激活）、按钮可见未禁用、棋盘未隐藏。
  4. **小组页**：`group.html` 删除副标题 `<p class="page-sub">六位成员的简介…</p>`（i18n 键 group.subtitle 保留未删）；`.page-group .page-back` 由 `margin:0` 改为 `margin:2.4rem 0 .6rem`（实测与卡片网格间距约 50px）。
  5. **地图 4→5 连线下凸**：`menu-saves.js` `routeCurve(a,b,index)` 增加 `fromNo,toNo` 参数（调用处传 `entries[i].no`），对 4→5 段特判 `bend=Math.abs(bend)*1.45`（该段向东 dx>0，正 bend 即向南/下凸）；原奇偶交替在这段与折回的 5→6 同为上凸、弧段在第 5 关附近重合。实测路径 4→5 控制点 (655,291) 下凸、5→6 控制点 (541,211) 上凸，两线分离。
  6. **教学图近窗口显示**：`style.css` 末尾新增规则，`.level-intro-image-box`/`.level-intro-image` 由 max 50vw/50vh 放大到 96vw/94vh（≤760px：98vw/92vh），`object-fit:contain`、width/height auto 保持原始比例；overlay 加 16px（窄屏 8px）padding，窄屏关闭钮收进 36px 防裁切。实测图1 1530×1064 显示 704×490、图2 1524×903 显示 704×417，比例 1.437/1.688 不变。
  - 验收：内置浏览器实测——menu 四按钮同字体同高同背景、顺序正确；game1/game5 无目标行、棋盘 400→440px（718px 视口）；窄屏按钮两行后“下一步”置底间隔 22px；真实回车在无命令时弹出“本回合没有任何部队机动”弹窗（=触发下一步）、焦点在按钮上时不重复触发；探针注入宽屏几何测得六按钮列 176..431、下一步 456..506、间隔 25px、金箭头可见；公式核验 1400×900 与 1101×667 坞均贴棋盘右缘 20px 且不出屏；group 无副标题、返回钮下移；地图 4→5 下凸与 5→6 分离；两张教学图近全屏保比例；game8（body.game8、按钮 static、棋盘 575 不受影响）与 game5 加载无回归；22 个 JS `node --check` 全过、CSS 大括号 1197/1197 平衡。

- **2026-09-16 第三批界面/逻辑修复 8+1 项（CSS/JS 缓存版统一 `20260916-fixpack4`）**：
  1. **战败界面残留按钮**：`hideMidGameControls()` 此前只藏存读档与左右显示条，补藏 `#button-undo`、`#battle-status`、整个 `#game-actions`（Menu 钮由 `moveMenuIntoResultArea()` 先挪进 `#result-area`，不受影响）；`restoreBattleControlsAfterUndo()` 同步恢复这些元素并重置结局锁、棋盘 pointer-events。
  2. **主界面第 3 关图钉状态错误**：`menu-saves.js` `renderProgress()` 里"进行中快照"优先于星级，读旧手动档留下的陈旧 `snapshot.level` 会把已通关关卡显示成蓝色 cont 点。改为先取星级：`cont = s===0 && 快照停在本关`，有星级一律红色 done。
  3. **主界面整体上移**：`body.page-menu` 顶部 padding 由 `clamp(54px,6vh,66px)` 覆盖为 `clamp(24px,3.2vh,40px)`。
  4. **结局延迟 1 秒**：`checkWinState()` 拆成判定包装 + `resolveWinState()`（原函数体，开头仍是 `--remain_turns`）。终局（蓝全灭 / 本回合后回合耗尽 / 红全灭 / 追猎关逃够 / Game8 突破达阈值）时先立即藏"下一步"与右坞、棋盘 `pointer-events:none` 但**保留显示**，`setTimeout(1000)` 后才藏棋盘并执行原有对白/结算面板；`outcomePending` 防重入，回车守卫因按钮隐藏自然失效。注意 **Game8（line_defense）全歼敌军不算终局**（须守满 12 回合），判定函数对该 objective 提前 return false。
  5. **无法存档（根因是按钮整组不可见）**：`#game-actions` 的 transition 含 `visibility 0.65s`，开场淡入时序下 Chrome 会把它永久卡在 `visibility:hidden`（opacity/transform 同理可能卡住），保存/读取/回退/主界面六钮从可访问性树消失。双保险修复：transition 去掉 visibility（只留 opacity/transform），并给 `.level-revealing #game-actions` 加 fill both 的 `gameActionsReveal` 关键帧（终态必然 opacity:1）。实测连续 3 次冷加载均可见，真实点"保存→确定"写入 `a.save` 成功。
  6. **聚兵绕圈**：cluster 等 AI 把目标点设为核心所在格，单位贴到 0.56 格附近后每帧 desired 点被占、`collisionSafeMove()` 左右偏转交替，形成公转。`nextStep()` 在到达判定后新增：**目标点被友军占住**（敌方占住仍允许绕行包抄）且距离 ≤ `UNIT_MIN_SEPARATION + speed + eps` 时视为到达、原地开火不再绕行。模拟 4 单位从 0.58/3.0 距离靠拢，均稳定停在核心 0.60~0.61 格、连续 4 回合位移 0。
  7. **"下一步"间距加大**：窄屏 `#button{margin-top:22px→34px}`；宽屏坞 `top:calc(50% + 122px)→+150px`（与六钮组间距由约 25px 增至约 55px，组内按钮间隙仍 7px）。
  8. **剩余回合 pill 移位精简**：`renderBattleStatus()` 只渲染剩余回合一项（删掉威胁/敌军/战意；无回合数时整条隐藏），结局延迟期间与棋盘隐藏后拒绝重画；CSS 把 `.battle-status` 由左上角 `position:fixed` 改为标题下随流居中（`body.game-page .game-heading .battle-status{position:static;margin:0 auto 4px}`）。
  9. **吴宸安角色补"程序员"**：`ui.js` 三语 `group.role3` 改为 程序员 · 摄影 · 剪辑 / 程式設計師 · 攝影 · 剪輯 / Programmer · Photography · Video Editing（HTML fallback 本来就有，是 i18n 词条覆盖掉了）。
  - 验收：内置浏览器 file:// 实测——game1 连续 3 次冷加载六钮全可见、真实存档写入 a.save（snapshot.level=1）；强制终局后 0.35s 棋盘仍在且无 lose 面板、1.75s 后才出面板/对白，战败页无回退钮无 pill、Menu 钮在结算区；胜利延迟后正常播第一幕对白；主界面第 3 关为红色 done、地图整体上移；聚团模拟 0 公转；窄屏下一步间距 34px；pill 居标题下只显示"剩余 N 回合"；group 三语角色正确；game2~8 冷加载无新报错（控制台仅 favicon CORS / 扩展噪声 / preload warning）；终局判定函数 7 组用例正确（含 Game8 全歼不终局）；22 个 JS `node --check` 全过、CSS 大括号 1206/1206 平衡。

- **2026-09-16 与远端 xingyue/main 合并（本地"6 项修复包"× 远端"联机会战"）**：把远端 `xingyue/main` 的 2 个提交（`bc52048` 联机会战与电影化统帅部、`1a5d017` 离线/LAN 与释义气泡）与本地工作区未提交的改动合并。**本地改动先落成一次 checkpoint 提交（`a477697`），否则 `git merge` 会把它当成"可快速前进"而整体丢弃**——实测试合并时 22 个重叠文件 100% 被远端覆盖，一个都没保留。
  - **冲突面**：19 个文件 43 处冲突（17 个 HTML 全在缓存版本号；`style.css` 1 处巨型冲突；`main.js` 1 处）。`levels.js` / `ui.js` / `menu-saves.js` 三方自动合并成功。
  - **`style.css`**：两边都把新段落**追加在文件末尾**，于是 git 看到一整块冲突。解法是**两段都保留**（本地 203 行的"交互与布局修订"在前，远端 938 行的"统帅部扩展"在后），得到 6671 行、大括号平衡。远端在后，其 `.game-page .battle-status__item` 会覆盖本地同特异性的 pill 内边距；本地 `.menu-list #btn-saves`（含 id）与 `body.game-page .game-heading .battle-status` 特异性更高，仍然生效。
  - **`main.js` 战况条（唯一语义冲突）**：本地新版**只显示"剩余 N 回合"金色 pill**并移到标题下方；远端是**威胁/敌军/战意三项 + "i" 释义气泡**。两套不能并存，采用**本地的回合 pill 方案**（更新，且本地 CSS 明确写了 `position:static` 把远端的三项定位覆盖掉，若保留三项会得到一个空壳定位条），同时**保留远端的 `strip.removeAttribute('title')`**（那个修复的是"整框原生标题与释义气泡重叠"）。`game.threatHelp` / `game.momentumHelp` 词条与 `.battle-term-*` 样式**保留未删**，想改回三项只需还原这一段。
  - **顺序合并逻辑**：远端在 `index.html` 登录后先进 `mode.html` 选模式；本地有"序章按账号记忆"（`hasSeenPrologue`/`markPrologueSeen`）。合并后：登录 →（看过序章）`menu.html` /（没看过）`mode.html` → 选"通关模式" →（看过）`menu.html?intro=1` /（没看过）`index.html?prologue=1` 播完整序章并落标记。`mode.html` 是远端新文件，按本地序章记忆改了这一处分支。
  - **缓存版本号统一**：本地 `20260916-fixpack4` 与远端 `20260915-command2` / `20260916-offline1` 两套并存，会让部分页面继续命中旧缓存。19 个页面共 **134 处**统一升到 **`?v=20260916-merge1`**（图片的 `?v=20260916-img1` 保持不变）。
  - **验收（静态）**：无冲突标记；25 个 JS 全部解析通过；15 段内联脚本可解析；25 个页面无重复 id；277 个静态资源引用 0 缺失；3 个 CSS 大括号平衡（`style.css` 6671 行）。
  - **验收（浏览器，Chromium headless）**：19 个页面逐一冷加载 **0 报错**；8 个关卡运行期状态正确（id/回合/AI 策略/棋子数/objective 均符合预期，含第 7 关 `guarded_core`）；远端功能在（`.army-roster` 2 个、9 行、实时血条文本、`ui:languagechange` 可派发）；本地功能在（`#battle-status` 只剩 1 项且 `position:static`、金色 pill、`#button`/`#game-actions` 宽屏 `position:fixed`）；真实对局 game1 判负、game2/game3 判胜且 `data-target` 正确；胜利面板渲染 `胜利 ★★★` + 远端星钉动画（3 个 `.victory-star` + 3 个 `.victory-star__dust`）；新账号登录 → `mode.html` → 序章 → `menu.html` 且落 `prologue:<用户>=1`，老账号登录直进 `menu.html`。
  - ⚠️ **注意**：合并不改游戏平衡，但**第 6 关现在是 22 回合**（此前文档写的 25），第 4/5/6/7 关标题也已随远端改名（双胜逐猎 / 烈焰攻坚 / 利尼决战 / 滑铁卢改写）。

- **2026-09-16 审查报告 B01–B13 修复 + 体验改进**：依据外部《审查报告》逐项独立复现后修复 13 项缺陷，并做了一轮体验改进。所有结论都是在本机 Chromium（Playwright）里实测得到的，不是静态推断。

  **第一批 · 存档与模态**
  1. **B01（P1）取消读取仍覆盖活动档**：`button-load` 在弹确认框**之前**就调了 `loadManualToAuto()`，而 `save.js` 内部直接 `putAuto` —— 确认框刚出现（还没点任何按钮）活动档就已经被换成旧档，点取消也回不去。修法：把 `loadManualToAuto()` 移进确认成功的 `doLoad()`。实测：取消 / Esc / 点遮罩 三条路径下 `a.save` 序列化内容前后完全一致。
  2. **B08（P2）确认框开着时键盘仍能操作背景**：`buildModal` 只创建遮罩并聚焦按钮，没有焦点限制、不隔离背景；`main.js` 的 Enter 守卫也拦不住"已聚焦 button 被浏览器原生激活"。修法：`ui.js` 加真模态（`Tab`/`Shift+Tab` 焦点陷阱、关闭回焦、`onDismiss`），`main.js` 的回合入口加模态守卫，`style.css` 新增 `body.ui-modal-open`（背景 `pointer-events:none` + 不可滚动）。实测：10 次 Tab + 6 次 Shift+Tab 焦点全程在弹窗内，Esc 关闭后焦点回到打开前的元素，回合数不变。
  3. **B10（P2）保存后档位悄悄跳回活动档**：`refreshSlotSelect()` 重建选项后无条件 `sel.value = AUTO_ID`。修法：重建前记住原值，合法档位就恢复。实测：保存后 = `'1'`，语言切换后仍 = `'1'`。
  4. **B12（P2）未解锁第 7 关按 Esc 后停在空白战场页**：`modalNotice` 的 `onClose` 只在点按钮时才跑，Esc / 点遮罩关闭只移除 DOM。修法：把 `onClose` 接到所有关闭途径；`modalConfirm` **不复用**该回调（取消绝不能执行破坏性操作）。实测：Esc 后 URL → `menu.html`。

  **第二批 · 棋盘与规则**
  5. **B02（P1）改窗口大小后棋子不跟着缩放**：`distance/offset` 用 `getBoundingClientRect()` 相减测量（受 `.level-opening` 的 `scale(0.97)` 污染，开场就偏约 3%），且只在开局测一次、resize 从不重算 —— 1440→390 时每格 62.8→34.48px 而 `distance` 仍 60.93，9 个棋子 6 个跑出棋盘。修法：新增 `measureBoardGeometry()`（改用 `clientWidth/clientHeight ÷ 格数`，**不受 transform 影响**）、`relayoutBoardUnits()`、resize/orientationchange 防抖监听，`revealBattlefield()` 后再量一次重排。实测：distance 62.8→34.5→62.8 正确跟随；各断点出界数 0；1440↔390↔1101 往返后 HP / 回合 / 命令 / 选中 / 箭头 / 范围圈**完全不变**（不重开战局）。
  6. **B03（P1）第 7 关护卫目标坐标 NaN**：`ringSlot()` 读 `center.x/center.y`，调用处却传军队对象（字段 `posx/posy`），6 名护卫目标全是 NaN、不补位。修法：传 `{x:core.posx, y:core.posy}`；`ringSlot` 加有限值检查；`applyEnemyAI` 外层统一兜底（任何策略算出非法目标就退回原地守位）。实测：第一回合红方 NaN 目标数 0。
  7. **B04（P1）边缘集结时避让把普通蓝军推出棋盘**：`collisionSafeMove()` 的 55°/90° 绕行候选点只查"是否与别人重叠"、不查边界。修法：新增 `clampToBoardBounds()`（合法范围 `[-0.5, n-0.5]`，即格子外沿），期望点与全部绕行候选点都夹取；`isRetreatMove()` 放行追猎关朝出口的移动（第 4 关出口 `(9.5,-0.5)` 恰在合法范围角上）；`issueMoveTo` 统一夹取。实测：普通蓝军极值全程在 `[-0.5,9.5]` 内；第 4 关红方仍能撤到 `(9.5,-0.5)`、escaped=5 → 正常判负（出口没被夹死）。⚠️ **不要图省事把所有人夹在 0~9，那样第 4 关永远无法撤退。**
  8. **B09（P2）射程圈显示 0.5 实际 0.58 开火**：范围圈与部队面板直接用 `p.atkrange`，未走 `unitCombatRange()`（引擎为避免近战重叠把有效射程下限抬到 `UNIT_MIN_SEPARATION+0.02=0.58`）。修法：两处统一改用 `unitCombatRange()`。实测：面板显示"射程 0.58"；范围圈直径 72.84px（半径 36.42）= 0.58 × distance 62.8，三者一致。

  **第三批 · 特效与结算**
  9. **B06（P2）读档后特效层失去挂载**：`loadSnapshot` 重建 `board.innerHTML` 把旧特效层节点移出文档，但 `fx.js` 的 `boardLayer/trailLayer` 仍指着那些脱离的节点 —— 再交火时 `liveCount` 有节点却看不见。修法：`ensureLayers` 增加 `layerUsable()`（`isConnected` + `parentNode===board`，失效就重建）；重建棋盘的两处都调 `fxReset()`。实测：先交火（trail 24）→ 存/读档 → 再交火：两层均 `inBoard=true`、smoke 24 + trail 20。
  10. **B07（P2）撤退被记成"歼敌"并奖励战意**：用"前后存活红军数之差"当歼敌数，而撤退/突破单位同样被置 disabled 移出棋盘 —— 第 4 关红方撤走会弹"歼敌 2 支"、战意白涨到 3/3。修法：回合开始记 `escaped` 数，`redDefeatedThisTurn = 存活差 - 本回合新增逃脱数`（本回合实现为 `redCountBefore - aliveUnitCount('red') - redEscapedThisTurn`）；逃脱只计失败条件、不给奖励。实测：第 4 关全程撤退时 `battleMomentum` 恒为 0。
  11. **B11（P2）第 5 关特殊分支与公共逻辑脱节**：①页脚把硬编码英文 `You have 17 turns left. Used: 1 turns.` 直接写进 `innerHTML`（中文模式也照显）；②两条失败分支各自复制收尾、漏掉 `button-fail` 的显示与 `data-target`，导致第 5 关打输没有别的关都有的"查看结局：提早失利"。修法：抽出 `finishDefeat()` 统一失败收尾（第 5 关两条 + 通用失败分支共三处调用），页脚改走 `gameText('game.turnsLeftUsed')` + `footerMode='turn'` 由 `renderFooterStatus()` 渲染，`ui.js` 补三语词条。实测：页脚 zh「剩余 17 回合 · 已用 1 回合」/ zh-TW「剩餘 …」/ en「17 turns left · 1 used」；失败时 `button-fail` 可见且 `data-target=fail.html`。

  **第四批 · 布局**
  12. **B05（P1 手机 / P2 桌面）悬浮控件与内容重叠**：≤760px 时 `#ui-toolbar` 仍 `position:fixed`（top 6 / 高 56），而 `.game-heading` 从 y≈5 起算，两者 6~62px 完全压住；战况条写的 `margin-top:48px` 在 flex 列容器里会被相邻项挤压后垂直居中，实测仍停在 y=5（等于没让位）。修法：`≤760px` 给 `body.game-page` 留 74px 顶部内边距（工具栏继续固定不动），战况条与标题各占正常一行。实测：手机端工具栏 6~62 / 战况条 74~105.7 / 标题 125.4~157.4，两两不重叠，被遮挡棋子数 0。
  13. **B13（P2）陈思行成员页手机裁掉正文**：内联 CSS 的 `div{width:800px}` + `body{overflow:hidden;height:100vh}`，390px 下正文盒 806px、文档 814px 且无法滚动，也没有返回小组链接。修法：容器改 `width:100%;max-width:800px`，body 允许纵向滚动、加左右内边距，窄屏缩小缩进与头像，右上角加"返回小组"。**保留其本人全部配色 / 背景图 / 圆角描边风格。** 实测：390px 下 docW=390=winW、可滚动、返回链接存在。

  **体验改进**
  14. **读档 / 继续存档跳过开场**（报告"体验建议 5"）：`loadSnapshot()` 末尾无条件调 `showLevelIntro()`，于是关卡内"读取"和主界面"继续存档"都要重看一遍立绘剧情 + 战前简报，第一关还多两张操作图。修法：`showLevelIntro(opts)` 支持 `skipIntro`，`loadSnapshot(snap, opts)` 接收并传递（默认 true），7 个 `gameN.js` 的"继续存档"显式传 `{skipIntro:true}`；**首次从主界面正常进关不传 opts，完整开场照旧**。实测：全新进关 `dialog=true` / remain=20；`?resume=1` 进关 `dialog=false`、`introImg=false`、remain=17（等于快照值）、可立即操作。
  15. **空转回合改为执行前提醒**（报告"体验建议 3"）：原来没选兵就点"下一步"，程序先把 24 帧跑完、白白消耗一回合，之后才弹"本回合没有任何部队机动"。修法：新增 `wouldTurnBeIdle()`（无待执行目标 **且** 双方均未进入射程），点击时若为空转先用确认框提醒 —— 确定（静观其变）才执行，取消则什么都不发生；每关只提醒一次（`idleTurnWarned`）。诱敌 / 防守 / 第三关开场整队等需要合理等待的场景不受影响。回合主体抽成 `runOneTurn()`。实测：未下令点下一步 → 弹窗且 remain 20→20（未消耗）；取消 → 仍 20；选"静观其变" → 20→19；已下令或已交火 → 不弹、直接推进。
  16. **第 5 关页脚数据同步隐患**：页脚原用另一份拷贝 `game5TurnNotice`，回退/读档改了 `remain_turns` 后可能停在旧数值。改为在 `renderFooterStatus()` 里直接从 `remain_turns` 与 `CURRENT_GAME.turns_limit` 推导已用回合，删掉该变量。实测：第 5 关推进两次再回退，页脚与回退前完全一致。

  **验收口径**：`B01–B13` 十三项回归全部 PASS；17 个页面 + 6 个成员页冷加载 **0 报错**；8 关实战（含第 8 关部署五门炮）**0 报错**，胜负 / 星级 / 出口 / 特效层均符合预期；通关星级正确写入 `a.save`（`stars:{1:3}`、`unlocked` 递增、隐藏路线判据 `hiddenRouteOpen()` 正常）。临时验证脚本已删，未推送远端。

- **2026-09-16 边界审查：新增 E1 修复（回合推进重入锁）**：上一轮修完 B01–B13 后，按目标要求再做一轮**边界与异常路径**审查（主流程之外）。共设计了 10 个边界场景，结果 9 项本来就正确、1 项是真缺陷。

  **新发现并修复：E1 —— 连点"下一步"会一次丢掉多个回合**
  - 原行为：同一个 JS tick 里连点 8 次会消耗 **7 个回合**；间隔 150ms 连点 6 次消耗 6 个回合。
  - 根因：原来只在回合末尾写 `this.disabled = true; setTimeout(..., 300)`。三重不足：① `disabled` 只对"浏览器原生触发的点击"生效，拦不住程序化 `click()`；② 300ms 窗口之后照样生效，且**不覆盖终局判定的 1 秒延迟期**；③ 回合推进本身没有重入保护（24 帧是同步跑完的，但入口没锁）。
  - 修改：`main.js` 新增同步重入锁 `turnRunning`；`runOneTurn()` 加四道入口守卫（模态/剧情遮罩、终局延迟中、棋盘已藏、重入锁），并放进 `try/finally` 保证异常也释放锁；按钮短暂 `disabled` 退化为纯视觉反馈。
  - 实测：把 `nextStep` 代理成"执行到第 1 帧时再调一次 `runOneTurn`"来构造**真重入** —— mid-turn 观测到 `turnRunning=true`、重入被挡住、全程只消耗 1 回合。连点场景下每次点击各自是完整一回合（`handlerCalls=1`，无重入）。
  - 注意口径：按钮 `disabled` 会让同 tick 内后续的 `click()` **直接不派发事件**，所以"连点消耗 N 回合"在真实鼠标场景下本来就有一部分被挡住；本修复补的是它拦不住的那部分（程序化触发、disabled 恢复后、终局延迟期）。
  - 附带：19 个页面共 134 处缓存版本号 `?v=20260916-merge1` → `?v=20260916-fixB13`。

  **同轮验证为"本来就正确"的 9 项**（均已实测，避免误改）：
  1. **E2 终局后再点"下一步"**：按钮已隐藏，再次调用不改变回合/存档，无二次结算。
  2. **E3 空手动档点"读取"**：弹 toast「存档 2 里没有中途存档」，不弹确认框、不写档。
  3. **E4 跨关快照点"读取"**：正确拒绝并提示「该存档属于第 5 关，当前在第 1 关……」。
  4. **E5 存读往返一致性**：存档→读回后回合 / 蓝红存活数 / 战意完全一致。
  5. **E6 回退上限**：连点回退，第 4 次时按钮已 `disabled`、文案 `回退 0/3`、`undoUses=3`，上限有效。
  6. **E7/E8 语言与主题切换**：切 en / 切主题 / 切回 zh-CN，回合与双方存活数全程不变。
  7. **E9 手机尺寸棋子可点**：390×844 下 9 个棋子 `elementFromPoint` **9/9 命中**，工具条不再遮挡。
  8. **E10 第 8 关未部署完**：未放炮兵时不存在可点的"开始防守"，不会带空阵开战。
  9. **B12 在独立账号下复测**：未解锁第 7 关 → 弹提示 → Esc → 正确回 `menu.html`。

  **回归口径**：`B01–B13 + E1` 共 **14 项全部 PASS**；17 个页面冷加载 0 报错；8 关实战（含第 8 关部署五门炮）0 报错。

- **2026-09-16 用户反馈 4 项（徽记摆正 / 骑兵尘烟 / 序章卡住 / 主界面星级）**：玩家在游戏里实际游玩后报了 4 个问题，逐项复现后处理如下。

  1. **N 徽记歪了 / 没居中（已修）** —— 序章与关卡对话框左侧那个圆形"帝国徽记"。
     - 原行为：整个金环是**斜的**；窄屏下它还挤在对话框左上角，矮视口里被裁掉一半。
     - 根因：`.dialog-crest` 从早期版本就带 `transform: rotate(-3deg)`；`@media (max-width:760px)` 把它 `position:absolute; top:-39px; left:15px` 钉在左上角，而不是居中。
     - 修改：`css/style.css` 末尾统一覆盖 —— 桌面端 `transform:none` 摆正、`.dialog-crest__monogram` 改 `font-style:normal`；≤760px 改为 `left:50%` + `translateX(-50%)` 居中悬在羊皮纸上方，并同步收尺寸与两条飘带位置。
     - 实测：桌面 `transform=none`、`font-style=normal`；390×844 下徽记中心 x=195，与对话框中心 195 **完全对齐（偏移 0）**。
     - ⚠️ **不要动 `.dialog-box` 的 `grid-template-columns`** 来实现"居中"——那是「徽章 | 羊皮纸 | 继续」三列网格，改列会连带 `.dialog-next` 的绝对定位一起乱。

  2. **移动尘烟只该骑兵有（已修）** ——
     - 原行为：任何兵种行军都在地面留扬尘尾迹，整张棋盘到处是尘团，盖住棋子与射程圈。
     - 修改：`js/fx.js` 的 `flushMovement` 增加 `unitLeavesDustTrail(unit)`（只认 `unit.cls === '骑'`）。
       **行军颠簸 `.is-marching` 仍保留给所有兵种** —— 那是"这一步动了"的即时反馈，与地面尾迹是两件事，别一起删。
     - 实测（第 3 关，各兵种单独走 3 格、每次先 `fxDebug.clearAll()` 避免累计污染）：**骑兵 8 个尘团 / 步兵 0 / 炮兵 0 / 散兵 0**。
     - 玩家同时提到"战斗时都要有开火特效"：**实测本来就是双方都有** —— `fxMarkFired` 无颜色过滤，`main.js` 里蓝红攻击路径都调用它。第 1 关双方贴脸实测：烟雾 48 + 曳光 8 + 命中环 8。
       （注意这些节点按设计会过期：`PUFF_MS=1500` / `TRACER_MS=320` / `IMPACT_MS=760`，所以要在结算后 1.5s 内观察，之后查会看到 0，那是正常的。）

  3. **注册新账号后 / 新账号点"通关模式"一直加载（已加固）** ——
     - 原行为：序章流程一旦中断（剧情没走完、定时器被浏览器节流、页面切后台），玩家就永久停在 `index.html?prologue=1`。
     - 修改：`index.html` 整条序章流程加"确保前进"兜底 —— `prologueNavigated` 标记 + 单一 `goToMenu()`（任何路径只跳一次）；地图转场 0.98s 正常跳转之外再挂 2.6s 兜底；自动进主界面由 1.8s 放宽到 **2.6s**（让玩家看清"跳过序章"按钮）；剧情引擎 30s 未收尾也强制进入转场。
     - 实测：注册 → `menu.html?intro=1` 全流程正常；`?resume=1` 与关卡内读档仍正确跳过开场。
     - ⚠️ 排查时踩的坑：**headless 的整页 `page.screenshot()` 抓不到 `.dialog-box` 那一层**（DOM/几何/计算样式全部正常、元素级截图有内容，但整页截图是空白）。当时差点据此误判"对话框渲染坏了"。要判断对话框是否存在，**用元素级截图 `locator('.dialog-box').screenshot()` 或直接读 `elementFromPoint`**，别只看整页截图。

  4. **"游戏主界面没显示每关获得的星"（已复现并修复 —— 矮视口下被裁掉）** ——
     - **前几轮没抓到**：一直在 1440×900 下测，那尺寸完全正常。玩家用的是**宽而矮的笔记本屏**，才会复现。
     - **复现结果**：`1280×600` / `1366×768` / `1024×768` 下，地图左下的土伦（第 1 关）、图卢兹（第 2 关）图钉，其下方那行 **49px 宽的星级被容器裁掉**（第 1 关那颗还被 BODY 盖住）；而 `1440×900` / `1910×873` / `1280×600` / `820×1180` 正常。
     - **根因**：`.campaign-map-shell` 是 **`overflow: hidden`**（原本用来裁圆角），而它的宽度被 **`calc(100svh - 215px)`** 限住 —— **屏幕一矮，地图就明显变窄**，边缘图钉的星级越过 shell 的左右边界被裁。
     - **修改**：`css/style.css` 末尾把 shell 的裁剪放开（`overflow: visible`）。圆角本来就有 `.campaign-map` 自己那层负责（它已是 `overflow:visible` + `border-radius:19px`）。
       ⚠️ **不要改用 `clip-path` 去"保留圆角"** —— 那同样会切掉边缘图钉的星级。
     - **实测**：六个视口下各关星级矩形 **5 点采样全部 5/5 命中**（修复前 1366/1024 是 0/5）；内层地图圆角仍是 19px，视觉未破坏。
     - ⚠️ **排查经验**：判断"某元素是否真的看得见"要**用 `elementFromPoint` 在元素矩形上多点采样**，只看"DOM 里存在 / opacity=1 / visibility=visible"会漏判——被祖先 `overflow:hidden` 裁掉时这些属性全都是正常的。
     - ⚠️ **顺带记录一次失败的改动**：为了让桌面端徽记真正居中，我曾把 `.dialog-box` 的 `grid-template-columns` 第一列改成 `0`，结果 **grid 的自动放置把羊皮纸挤成 64px 宽、徽章跑到视口外（`t:-897`）**，已**完整回退**。桌面端徽记目前仍是"摆正 + 停在左侧列（离中心 −538px）"；真正的居中需要重排三列网格并同步 `.dialog-next` 的定位，风险较高，**留待单独一轮**。

  **回归**：`B01–B13 + E1` 共 **14 项全部 PASS**；JS 错误 0。缓存版本号 19 页 134 处 `?v=20260916-fixB13` → `?v=20260916-fixB14`。

- **2026-09-16 用户反馈第二轮：桌面端徽记居中 + 对话键盘推进**：接着上一轮把玩家说的"放中间一点"在桌面端也做到了，并给对话加了键盘推进。

  1. **桌面端 N 徽记居中（已修，第二次才成功）**
     - 原行为：徽记虽然已经摆正（去掉 `rotate(-3deg)`），但仍停在「徽章 | 羊皮纸 | 继续」三列网格的左侧列，离视口中心 **−538px**。
     - 走通它必须**四件事一起做**，缺一样布局就塌：
       1. 第一列 `96px` → `0`（徽记改绝对定位后不需要那一列）；
       2. padding 基准同步 −96：`(100vw - 1210px)/2` → `(100vw - 960px)/2`
          —— 原公式把「3 列 96+900+138 + 2×16 gap = 1210」当内容宽度，列数一变就得跟着变；
       3. 羊皮纸改成 `grid-column: 1 / -1` + `justify-self: center`
          —— **徽记脱离网格后，grid 的自动放置会把羊皮纸丢进那个 0 宽的第一列**（我第一版就是这么塌的：羊皮纸被挤成 145px、正文 81px）；
       4. 「继续」按钮改成绝对定位贴右下 —— 它原本占第三列，列结构变了之后留在网格里会被挤走（实测宽度异常到 900px）。
     - 实测（1440×900 / 1366×768 / 1024×768 / 800×600 / 760×900 / 390×844 / 360×640）：
       徽记 cx 与羊皮纸 cx **都精确等于视口中心（偏差 0.0px）**，羊皮纸宽 893 / 893 / 771，正文 829 / 829 / 722，继续按钮 132；
       窄屏（≤760px）由媒体查询恢复单列，行为不变。
     - ⚠️ **教训**：动 grid 的列定义时，**自动放置的落位会跟着变**，必须把每个子元素显式安置好，并同步 padding 这类"按列宽算出来"的值。

  2. **对话支持键盘推进（Enter / 空格）** —— `js/dialog.js`
     - 原来只有「继续 / 跳过」两个按钮可以推进，外加 Esc 结束。
     - 现在 **Enter / 空格也能推进**（焦点在按钮上时交给按钮自己处理，避免一按推进两句）。
     - 实测：**只用 Enter 就能走完 7 句序章** → `menu.html?intro=1`，`prologue` 标记落 1，0 报错。
     - 动机见下一条：某些渲染环境下底部对话框那一层不参与绘制，玩家找不到按钮，键盘是可靠的第二条路。

  3. **关于"对话框在某些环境看不见"的结论（重要，避免后人重复踩坑）**
     - 现象：序章/剧情弹窗在自动化环境里整块不绘制，屏幕上只剩背后地图和一枚 N 徽记；`index.html` 的兜底 30s 后会自动把人送到主界面（实测 19s 离开），所以玩家不会被永久困住。
     - 排查结论：**DOM、几何、computed style（opacity:1 / visibility:visible / rect 正确）、`elementFromPoint` 命中全部正常**；`locator('.dialog-box').screenshot()` 与 `page.screenshot()` 都看不到文字。
     - **试过并排除**：`backdrop-filter`（去掉后无变化）、`filter: blur()` 入场动画（去掉后无变化）、`clip-path`、`overflow`、`z-index`、`transform`、`mask-image`、`mix-blend-mode`（逐个内联覆盖，**截图哈希全部完全相同**）。
     - ⚠️ **测量方法本身不可靠**：在 `index.html?prologue=1` 上反复出现"改了内联样式但元素截图完全不变"的情况（11 个变体哈希一模一样），说明这条测量路径在这个页面上根本不反映样式改动。**不要仅凭 headless 截图判定"渲染坏了"**；本次真实用户是能看到对话框的（玩家报告的是"一直加载"，也就是看到了地图背景）。
     - 因此这一条**没有代码修复**，改为三重体验兜底：**键盘可推进**（本次新增）+ **30s 强制转场** + **2.6s 地图转场兜底**。
     - 唯一保留的改动：去掉了 `.dialog-box` 的 `backdrop-filter`（它的背景本就是 .98/.995 不透明渐变，毛玻璃贡献极小，而滤镜会创建独立合成层）。

- **2026-09-16 用户反馈第三轮：注册后卡住（真凶找到）+ 主界面底部按钮看不到 + "差一点点就压缩排版"**：

  1. **"注册完一直进不去 / 卡在 `index.html?prologue=1` 约 1 分钟"（根因终于找到并修掉）**
     - **真凶：全屏换场幕布 `.page-route-curtain` 盖住了对话层。**
       `index.html` 在 `?prologue=1` 分支里为了遮挡"注册页 → 序章"的 560ms 空档，给 body 挂了 `is-routing`，
       而 `.page-route-curtain` 是 **`z-index: 9999` 的不透明全屏层**，对话层 `.dialog-overlay` 只有 **`z-index: 600`**
       —— 幕布没撤，整段序章玩家只看得见幕布正中那枚金圈 N，看起来就是"一直在加载"。
       表现就是：对话读不完 → 30s 兜底 + 2.6s 转场 + 0.98s 推镜才离开，加起来约 1 分钟。
     - **这一步之前查错方向的原因**（重要）：`elementFromPoint` / `elementsFromPoint` **测不出它** ——
       幕布带 `pointer-events: none`，**根本不参与命中测试**，但它照常绘制在最上层。
       所以当时看到的是"DOM、几何、computed style、命中全都正常，截图上却什么都没有"，
       并据此误判成"渲染层问题"。**教训：命中测试看不见的元素不等于没画在屏幕上；判断"谁盖住谁"要直接比 z-index + 绘制顺序。**
     - **修改**：`index.html` 的 `playCampaignPrologue()` 开头 `document.body.classList.remove('is-routing')`；
       `css/style.css` 末尾再加一道 CSS 保险 `body.dialogue-active .page-route-curtain { opacity:0; visibility:hidden }`，
       保证以后任何忘记摘幕布的路径都不会挡住剧情。
     - **实测**：注册 → `index.html?prologue=1` 时 `body=page-login dialogue-active`（无 `is-routing`）、
       幕布 `opacity:0 / visibility:hidden`、对话层在屏；点 7 次「继续」**8.0s 到达 `menu.html?intro=1`**（此前约 60s）。
     - **顺带纠错**：上一轮 599–605 行那段"对话框在自动化环境里整块不绘制 / 测量方法不可靠"的结论是**误判**，
       病因就是这块幕布。CSS 里那段 `backdrop-filter` 的注释也已就地更正（代码保留，无害）。
       上游 `xingyueji8/web-dev-basics-2026` 最新提交（`1a5d017`）**没有**这条修复 ——
       上游 `index.html` 里根本没有 `?prologue=1` 这条流程（是本仓库合并时接的），所以只能自己修。

  2. **"主页面缩放错误，看不到下面的按钮"（底部导航被裁）**
     - **根因**：`@media (min-width:761px)` 把地图外壳写成
       `width: min(97vw, 1280px, calc((100svh - 188px) * 1.274))`，**只预留 188px** 给上下所有非地图内容；
       可外壳自身还有 `8px×2` 内边距 + 顶部 32px + 底部 29px 军令栏
       （换算：外壳高度 = (宽−16)/1.274 + 77），加页头约 90~110px、底部导航行 128px、body 内外边距，
       真正需要的是 **约 1.13 × 视口高度**。
     - **复现**：1280×600 / 1366×768 / 1024×768 / 1440×900 / 1600×900 / 1920×1080 …
       **所有桌面视口都命中**（例：1920×1080 外壳底边 y=1129、整页 1267，而 body 是 `height:100svh; overflow:hidden`），
       底部导航（模式选择 / 小组介绍 / 成就 / 读取存档 / 退出登录）被裁掉且**滚都滚不到**。
     - **修改**（`css/style.css` 末尾）：
       - 外壳宽度改成 `min(97vw, 1280px, calc(112svh - 320px))`，`min-width` 由 620px 去掉（置 0）
         —— 这个线性式是照 620~1080 十三个高度的**实测纵向预算**拟合的，每个高度留 9~14px 余量；
       - `body.page-menu` 由 `height:100svh; overflow:hidden` 改成 `min-height:100svh; overflow-y:auto` 兜底
         （**只动 page-menu，`body.game-page` 的 100svh 锁屏是棋盘布局前提，别一起改**）。
     - **实测**：**286 个视口（高度 620~1120 × 宽度 762~1920）全部 overflow=0、无滚动条、导航行在首屏**。

  3. **玩家追加要求："如果页面要通过滚动才能查看全貌，但是只要一点点滚动，就稍微压缩一下排版，让一页放得下"**
     - **主界面**：底部导航行那层 `.page-menu > .page-box` 一直带着 `padding: 1rem 0`（上下共 32px 纯留白），压到 `0.25rem 0` 直接还给地图。
       ⚠️ 这里**必须用 `:has()`**：`ui.js` 会在 body 末尾 append 一个 `.ui-toolbar`，
       它是 body 的**最后一个 div**，所以项目里 `.page-menu > .page-box:last-of-type`（3408 行）
       与 `:first-child`（3211 行）**一直匹配不到任何元素，是死规则**；
       同理 `:first-of-type` 也不行 —— 带 `?intro=1` 时 `#campaign-arrival` 才是第一个 div。
     - **游戏页**：`@media (min-width:901px) and (max-height:720px)` —— 按视口高度收棋盘
       （`min(56dvh, 100vw - 440px)`、下限 300px）+ 压 `#game-actions` / `#button` 上边距。
       实测 game1@960×640 原本 `docH 670 / 视口 640`，**被裁掉的正是「下一步」按钮**（top 626 → bottom 670）；修后 overflow=0。
       loader 下限取 **901px** 是有意的：761–900px 那段（`@media (min-width:761px) and (max-width:900px)`）
       是**有意改成纵向排列 + `overflow-y:auto`** 的（"中等窄屏容不下序列栏+详情栏+棋盘三列"），
       那边本来就该滚动，不该再被压；但给它的「下一步」补了一条
       `@media (min-width:761px) and (max-width:900px) and (max-height:700px)` 收棋盘，保证主操作不掉出首屏。
     - **登录 / 注册页**：原来的"紧凑档"门槛写在 `@media (max-height:680px)`，**门槛太高** ——
       1280×760 溢出 9px、1280×720 溢出 47px、1280×700 溢出 67px。新增
       `@media (min-width:761px) and (max-height:820px)` 把页头 / 表单内边距 / 行距整体收紧一档。
     - **结局页**：`.page-ending` 的 body 内边距是 `clamp(2.5rem,7vw,6rem)` + `4rem`，
       1280×720 下光内边距就吃掉 153px，`Next` 被顶到 y=726（差 6px）。压到 `26px / 22px` 后 4 个结局页全部达标。
       另加小组页 / 成就页 / 选模式页的同类压缩。
     - **实测（全站扫描）**：主界面 16/16、登录 17/17、注册 17/17、4 个结局页全部 OK、游戏页 ≥901px 全部 OK。
       **仍未解决（超出"一点点"范畴，需要单独一轮）**：`mode.html` 在 761~960px 矮屏（两张卡并排本身就 ~500px 高，
       溢出 138~204px）、`group.html` / `achievements.html` 在 ≤480px 窄屏（成员卡/成就行单列堆叠）。

  4. **本轮的验证方法学更新（省下以后大量返工时间）**
     - ⚠️ **`?v=` 升版本号 + CDP `Network.setCacheDisabled` 都不够**：本轮出现"改了 CSS、升了版本号、
       还关了缓存，浏览器跑的仍是上一版 CSS"，导致连续两轮扫描结果一模一样、差点误判"规则没生效"。
       **最可靠的是换一个全新的 Edge `--user-data-dir`**（本轮最终就是这么干净的）；
       查证手法：在页面里读 `[...document.styleSheets].map(s => s.href)` 以及遍历 `cssRules`
       确认某条规则**是否真的进了解析树**（`getComputedStyle` 只能说明"没赢"，不能说明"没解析"）。
     - ⚠️ **内联脚本语法自检必须用 JS，不能用 Python**：早先写的 `compile(code,'<inline>','exec')` 是 **Python 编译器**，
       把 14 段 JS 全判成 `SyntaxError`（`invalid character '：'` 之类）。正确做法：
       Node 里对抽出的脚本调 `new Function(code)`（本轮 14 段全部 0 错误）。
     - ⚠️ **`page.screenshot()` 之外还要做"滚动条"检查**：`documentElement.scrollHeight - clientHeight > 0`
       或 `innerWidth - documentElement.clientWidth > 0` 才算真"要滚动"；
       只看 `#button` 是否在视口内会漏掉"页面整体高 30px、出现了一条滚动条"这种情况。

  5. **版本号**：19 个页面 136 处 `?v=20260916-fixB16` → `?v=20260916-fixB23`
     （本轮逐次升到 fixB23；另外补上 `mode.html` / `multiplayer.html` 里漏掉版本号的 `js/account.js`）。
     ⚠️ **遗留**：`game1~game8` 的 `js/constants.js` / `js/pieces.js` / `js/arrow.js` / `js/gameN.js`
     仍然**完全没有版本号**（本轮核查发现，未改动；将来若改这几个文件，记得一并补上）。

- **2026-09-16 用户反馈第四轮：七张棋盘桌面图替换 + 主界面/注册/小组页/登录页四处 UI**：

  1. **棋盘桌面图替换（`img/back*.png` → 运行时 `back*.webp`）**
     - 收到 7 张同名图：`backdis1` / `backdis2` / `backgrass1` / `backgrass2` / `backice1` / `backice2` / `background1`。
       **其中 3 张（`backgrass1` / `backgrass2` / `background1`）与原文件逐字节（md5）相同**，4 张是真新图；
       `backdis2`（354→1254px）与 `backice1`（355→1254px）是**清晰度升级**。
     - ⚠️ **只换 PNG 不生效**：`style.css` 里 7 个关卡的棋盘桌面全部引用 **`.webp`**（`backdis2` / `backice1` 甚至没有 `?v=`），
       所以必须**连 WebP 一起重新生成**。做法：最长边压到 1024、`quality=82`、`method=6`
       （沿用工程既有约定；先用 85 试过，改 82 省 127KB 且肉眼无差）。
     - ⚠️ **没换的图不要重编码**：`backgrass1` / `backgrass2` 的 PNG 与原文件完全相同，
       却被我一起重编了 WebP（172KB→227KB、34KB→39KB，纯粹变大），已用 `git checkout` 还原这两个 webp。
     - 版本号：所有棋盘图引用统一升到 `?v=20260916-img2`，**并给 `backdis2` / `backice1` 补上原来缺失的版本号**。
       （`level1-intro-*.webp?v=20260916-img1` 与兵种图**没动** —— 那些图这次没换。）
     - 实测：7 个关卡页实际取回的 webp 字节与本地文件 md5 **逐一相同**（`background-size: cover`）；
       棋盘截图目视确认新图已生效。
     - ⚠️ `background1.png`（2.8MB）**全项目没有任何引用**，是历史遗留原图，只覆盖了 PNG 本体。

  2. **主界面：地图按"网页缩放 80%"显示 + 底部按钮排成一行、退出登录靠最右**
     - 地图尺寸三处一起 ×0.8：`min(97vw, 1280px, calc(112svh - 320px))`
       → `min(77.6vw, 1024px, calc(89.6svh - 256px))`。地图是"宽度驱动 + 固定宽高比"，宽度 ×0.8 就是整张图等比缩到 80%。
     - 按钮原来会折成两行：`.page-box{width:min(92vw,720px)}` 把容器限死 720px，
       而 5 个按钮 = 5×145 + 4×8 = **757 > 720**。修法：那层放宽到 `min(96vw, 1000px)`、
       `ul` 加 `flex-wrap: nowrap`、最后一个 `li`（退出登录）加 `margin-left: auto` 顶到最右；
       761~900px 窄桌面放不下 5×145，那一段把 `.menu-link` 的 `min-width` 放开。
     - **实测 12 个视口：全部 1 行、退出登录都在最右、外壳宽度精确等于旧公式的 80%、溢出全 0。**
     - ⚠️ **副作用（已知，未修）**：地图缩小后图钉更挤。星级可见度 1440×900 仍是 16/18，
       但 1366×768 / 1280×720 / 1024×768 从 16/18 掉到 **15/18**（多出的一颗是 L1 的星被 L2 的星级压住）。
       L6←L7 的遮挡在所有尺寸下本来就有。**根治办法是让图钉尺寸随地图等比缩放**，
       那会动到"返工过两次"的隐藏关图钉样式，未擅自改。

  3. **注册完不再先闪登录页（`index.html?prologue=1` 直接进加载页）**
     - 原来 `?prologue=1` 的流程是：先画出登录表单 → body 末尾脚本才挂 `is-routing` → 幕布盖上来 → 560ms 后播序章。
       中间那一小段（网络慢时可达数百 ms）玩家会看到"先跳登录页再加载"。
     - 修法：`<head>` 里加一段内联脚本，按 query 给 `<html>` 挂 `.prologue-boot`，
       CSS `html.prologue-boot .page-box{display:none}` 从**第一帧**就藏掉登录卡；
       幕布（金圈 N）保留为玩家要的"加载页"，一直盖到剧情层出现。
     - ⚠️ 与之配套：`playCampaignPrologue()` 里**故意不再摘 `is-routing`**
       （上一轮那行 `classList.remove('is-routing')` 已删），改由既有的
       `body.dialogue-active .page-route-curtain{opacity:0;visibility:hidden}` 让幕布自动让位。
       **那条 CSS 保险现在成了关键路径，不能删**；删了就退回"序章被幕布挡住"的老毛病。
       另外 `startCampaignTransition()`（不演立绘、直接走地图转场那条路）里**必须**摘掉 `is-routing`，
       否则幕布会盖住 `.campaign-prologue` 地图。
     - 兜底：query 要求序章但实际不播（未登录 / 已看过），脚本会摘掉 `.prologue-boot` 把登录卡放回来，避免白屏。
     - 实测（注册提交后每 100ms 采样）：**登录卡全程 `display:none`**、幕布已出现 →
       300ms 时剧情层出现（body 带 `dialogue-active`）→ 点完 7 句到 `menu.html?intro=1`。

  4. **两处上一轮遗留问题（都是我上一轮改出来的 / 早该改的）**
     - **`index.html` 下方那条深色带**：上一轮的"矮视口压缩排版"给 `body.page-login` 写了 `min-height: 0`，
       body 于是只剩内容高度（1366×768 实测 **545.7px**），下面 222px 露出 `html` 底色 `rgb(8,19,33)`（近黑），
       与上方 body 的蓝色渐变断层。原有的 `@media (max-height:680px)` 里也有同一份 `min-height: 0`。
       修法：文件末尾用 `@media (min-width:761px){ body.page-login, body.page-register{ min-height:100svh } }` 统一覆盖。
       实测 4 个视口 body 高度都等于视口高度、纵向 4 点采样全部落在 BODY 上。
     - **小组页标题与成员卡贴在一起**（实测间距只有 body 的 `gap` = 10px）：
       加 `.page-group .member-grid{ margin-top: 2rem }`（≤760px 为 `1.25rem`）。
       ⚠️ **必须带 `.page-group` 前缀**：4652 行那条 `.page-group .member-grid{margin:0}` 特异性是 (0,2,0)，
       光写 `.member-grid`（(0,1,0)）压不住 —— 第一版就是这么没生效的（实测 margin-top 仍是 0px）。
       改后间距 42 / 51 / 49px（1366 / 1920 / 1500），窄屏 28px。

  5. **本地测试账号「1 / 1」全通关（**只写本机 localStorage，游戏代码零改动**）**
     - 玩家要求"只为本地测试方便"，**明确不要**写成"任何叫 1 的账号都全通关"的规则，所以完全不碰代码。
     - 需要在浏览器控制台粘一行（`users` / `currentUser` / `a.save:1` / `prologue:1` / `revealSeen:1` / `achv:1` 六个 key）：
       写入 `a.save:1 = {unlocked:8, stars:{1..7 全 3}, snapshot:null}`、
       `prologue:1='1'`（不重播序章）、`revealSeen:1='8'`（不重播解锁动画）、`achv:1` 四项成就全开。
     - 实测（隔离 profile 清空 localStorage 后执行）：跳 `menu.html`；地图 **7 个图钉全部 `done` + ★★★**；
       成就入口显示「成就（4/4）」；成就页 4 项全「已达成」；`game7.html` 入口校验放行（15 个棋子、无锁定弹窗）。
     - ⚠️ 第 7 关入口判据是 `hiddenRouteOpen()` = **第 1~6 关全 3 星**，所以 `stars` 里 1~6 必须都是 3，
       只给 `unlocked` 是没用的。地图上那行"`n/18 星`"只统计**第 1~6 关**（`mainRouteStars`），第 7 关星级另算。

  6. **本轮回归**：`menu` / `index` / `register` / 四个结局页 —— 18 个视口下控件全部在首屏，**全部 OK**。
     仍不达标的页面（**均为既存问题，本轮未动**）：
     - `mode.html`：961~960px 矮屏超出 125~190px（两张模式卡并排本身就 ~500px 高，需要加"窄屏纵向堆叠"断点）；
     - `multiplayer.html`：≤900px 超出 427~974px（联机大厅本身就是长页面）；
     - `group.html`：761~900px 矮屏超出 27~43px，≤480px 超出 226~270px（6 张成员卡单列堆叠）；
     - `achievements.html`：≤600px 超出 51px，390px 超出 11px。
  7. **版本号**：19 个页面 136 处 `?v=20260916-fixB23` → `?v=20260916-fixB25`；
     7 张棋盘图 → `?v=20260916-img2`。

- **2026-09-16 用户反馈第五轮：加载徽记统一 + 主界面按钮/地图 + 关卡页棋盘与右侧坞**：

  1. **统一"加载页那枚 N 徽记"** —— 全站有两处加载态会显示"N 套一个圆圈"，
     原来它们长得不一样，而它们是**前后脚出现**的（换场幕布 → 下一页接镜）：
     | | 尺寸 | 边框 | 字体 | 底色 | 光晕 | 动画 |
     |---|---|---|---|---|---|---|
     | `.page-route-curtain span`（旧） | 96px | 2px 金 | `--ui-display` **斜体** | 无 | `0 0 0 8px` | 入场 `scale(.72) rotate(-8deg)` → 1 |
     | `.campaign-arrival__seal strong`（旧） | 68px | 1px 金 | Georgia **正体** | 深色 | `0 0 36px` | 退场 `scale(1)` → `.72` + 模糊 |
     - 统一为：`88px / 2px 金边 / --ui-display 斜体 / rgba(10,26,43,.46) 底 / 三层光晕`，
       并且**同一条旋转**：幕布入场从 `scale(.72) rotate(-8deg)` 起步，接镜退场回到同一姿态
       （`loadingSealOut` 关键帧），跨页连起来就是"徽记留在原地，背景换掉了"。
     - ⚠️ 接镜那枚的说明文字（EUROPEAN THEATER）原来在 grid 流里，会把圆环顶到中心线**以上约 12px**；
       改成 `position:absolute; top:calc(100% + .6rem)` 挂在圆环下方后，两枚才真正同点。
     - 实测：两枚的计算样式（尺寸/边框/字号/字重/字色/底色/阴影）**逐项相同**，
       屏幕坐标都是 `(720,450)` = 视口正中（1440×900）。
     - ⚠️ 对话里的 `.dialog-crest`（带 GRANDE ARMÉE 与飘带的帝国徽记）**没有并入** ——
       那不是加载指示，是有意做得更繁复的纹章，玩家说的是"加载时显示的"那一枚。

  2. **主界面底部五个按钮排成一行且互相挨着** —— 上一版我把「退出登录」用
     `margin-left:auto` 顶到了最右（玩家当时的原话是"放到最右边去"），这一轮玩家改口要"在一起"，
     所以去掉 auto margin、整排 `justify-content:center`。实测 8 个视口全部 1 行、按钮间隙统一 8px。

  3. **主界面地图大小 = "页面缩到 80% 时的观感"（玩家澄清后的正确版本）**
     - 上一版我把公式整体 ×0.8 让地图变小，**理解错了**。正确做法：在 100% 缩放下，
       让地图渲染出"80% 缩放时"的**设备像素**尺寸。
     - 推导：80% 缩放时 `vw/svh` 变大 1.25 倍、最终渲染又 ×0.8，两者相消 ⇒
       **只有绝对 px 项需要缩放**：`1280px→1024px`、`(112svh - 320px) → (112svh - 256px)`，
       而 `97vw` 保持不变。
     - 所以最终是 `min(97vw, 1024px, calc(112svh - 256px))`。
       实测 1440×900：旧公式 688px、上一版 550px、**本次 752px**（比原来还大 9%）。
     - 地图变大后纵向不够，同段里把页头字号/行距/导航行留白压了一档（沿用玩家"差一点点就压缩排版"的原则）。
       实测 8 个视口：1 行按钮、溢出 0、无滚动条。

  4. **右侧指挥停靠坞改成"跟棋盘的真实几何走"**（`main.js` 新增 `syncDockGeometry()`）
     - 原问题：坞的 `left` 用的是 `min(78dvh, calc(100vw - 440px))`，而棋盘在三个断点里
       分别是 `72dvh/100vw-740`、`65dvh/100vw-530`、`78dvh/100vw-440` —— **三套公式对不上**，
       实测缝隙在 **43~102px** 之间乱跳；垂直用 `top: calc(50% ± …)`，比棋盘中心**最多低 83px**。
     - CSS 里没有办法"引用另一个盒子的实际宽度"，所以由 JS 把棋盘的真实右缘与垂直中心
       写成 `--board-right` / `--board-center-y`（另加 `--dock-max-left` 防止压到编制栏）。
     - ⚠️ **必须用 `offsetWidth/offsetHeight` + body 的 rect 来算，不能用 `#board` 自己的 rect**：
       开场 `.level-opening` 会给棋盘挂 `transform: scale(.97) translateY(12px)`，
       而 `getBoundingClientRect()` 是含 transform 的，直接量会把变量写偏。
     - ⚠️ **fixed 元素的 `margin` 仍会叠加到 `top` 上**：`#button` 有 `margin-top:34px`，
       第一版没减掉它，整条坞就低了 17px（实测坞中心比棋盘中心恒定 +17）。
     - 实测 9 个视口：坞缝 **30px（≥1366）/ 24px（1101~1280）**、**坞中心与棋盘中心差 0px**。

  5. **关卡页棋盘：下移、放大、下方不留空隙**
     - 棋盘原来紧贴着战况条（实测只隔 **4px**），现在 `#board { margin-top: 16px }` → 净空 **20px**。
     - 尺寸：`≥1181px` 由 `min(72dvh, 100vw-740)` 改成 `min(78dvh, 100vw-708)`；
       `1101~1180` 用 `min(71dvh, 100vw-704)`；`901~1100` 用 `min(71dvh, 100vw-530)`。
     - ⚠️ **三个断点必须分开写**：右侧停靠坞的断点是 1101，所以 `901~1100` **不该**背坞的占位约束 ——
       第一版把 `100vw-704` 套到了 `901~1180`，1024×768 的棋盘从 494 掉到 410。
     - ⚠️ **同时把 ≥1181px 的两侧编制栏从 154px/12px 收窄到 124px/6px**：
       要同时满足"棋盘放大 + 坞离棋盘 26px 且不压编制栏 + 下方不留空隙"，
       右侧一列需要 `坞 188 + 缝 26 + 隔 10` + 常驻编制栏 ⇒ 棋盘宽 ≤ `100vw - 708`。
       原来的 154/12 只能反推出 `100vw-784`，1440×900 下棋盘被卡在 656（高度本可到 702），
       下方白空 95px —— 正是玩家抱怨的"空隙"。**124px/6px 不是新尺寸，901~1180 档本来就是这么写的**。
     - 实测棋盘尺寸（旧 → 新）：1920×1080 `778→842`、1440×900 `648→702`、
       1366×768 `553→599`、1280×800 `540→572`、1200×800 `460→492`、1181×800 `441→474`；
       1440×900 下方空隙 `119px → 49px`。
     - ⚠️ **顺带修掉一个一直存在的重叠**：坞会压到常驻的「敌方序列」编制栏
       （实测原来 1180×800 压 42px、1102×800 压 81px，本轮棋盘放大后 1440×900 也开始压 15px）。
       现在由 `--dock-max-left` 硬约束，**9 个视口实测重叠 0**。

  6. **本地测试账号「1 / 1」全通关**：玩家选了"临时放一个页"的方式。
     在 `game/demo/seed.html` 写一个**临时页**（写完 localStorage 后 `location.replace('menu.html')`），
     玩家打开一次即可；**用完立刻删掉、不提交进仓库**。
     实测：跳 `menu.html`；7 个图钉全 ★★★；成就 4/4；`game7.html` 入口放行。
     ⚠️ 游戏代码**零改动** —— 玩家明确要求不能变成"任何叫 1 的账号都全通关"的规则。

  7. **本轮回归**：关卡页 15 视口 × 7 关 = 105 项，**98 项 OK**；
     仅剩的 7 项全是 `760×900`（移动端纵向堆叠，`overflow-y:auto` 本来就是设计如此，与改动前一致）。
     版本号：136 处 `?v=20260916-fixB25` → `?v=20260916-fixB30`。

- **2026-09-16 用户反馈第六轮：页脚回合文案 / 地图图钉 / 徽记 N 居中 / 登录流向**：

  1. **关卡页标题下不再出现「剩余 N 回合 · 已用 M 回合」**（玩家截图指出）
     - 这行是 `#footer-bar` 在 `footerMode === 'turn'` 时渲染的，而 `checkWinState()` 每回合末尾
       都会把它置成 `'turn'` 再重画，所以**每一关都有**（不只第 5 关）。
     - 其实文件里早就写着"剩余回合统一由左上战况 pill 显示，footer 不再重复"，
       但 `'turn'` 分支是第 5 关"限时攻坚"进度留下的残迹，一直没删。
     - 修法：`renderFooterStatus()` 的 `'turn'` 分支保留（语言切换仍会走到它把 bar 清空）
       但**不再写文案**。`#footer-bar` 留空后高度是 0，不占位。
     - 实测 game1 / game4 / game5 / game6：页脚文本 `''`、高度 0；战况 pill 仍正常显示
       「剩余 N 回合」；标题到棋盘的净空仍是 20px。
     - ⚠️ `footerMode === 'resume'`（读档后的"已读取第 N 关存档，还剩 M 回合。"）**保留了** ——
       那是读档后的一次性确认，不是常驻重复信息。若玩家也要去掉，改那一支即可。

  2. **主界面地图上的关卡标志整体缩小**（玩家："关卡标志太大了"）
     - 桌面档圆钉 36px、隐藏关 52px、星级 1.08rem；而 1920×873 下地图外壳只有 722px 宽，显得很占地方。
     - 修法：**整枚图钉等比缩放**，不逐个改 px ——
       `.map-pin { transform: scale(.8); transform-origin: 0 0 }`。
       理由：`.map-pin` 是 **0×0 的锚点**（`left/top` 就是投影坐标、宽高都是 0），
       所以给父级加 `scale` + `transform-origin: 0 0` 就等于"绕着钉尖缩放"，
       圆钉 / 小尖脚 / 星级 / 锁形图标一起缩，**投影坐标一点都不会偏**，
       而且不用去动那批手工调过的星级偏移量（`top: 31px`、`translateX(-50% + .05em)`）。
     - ⚠️ 前置条件（已核对）：`.map-pin` 自身没有别的 transform；
       `map-pin-pop` 动画作用在子级 `.map-pin__dot` 上；`map-pin-breathe` 只动 `box-shadow`；
       `menu-saves.js` 不写 pin 的 `style.transform`。
     - ⚠️ 只在 `@media (min-width: 761px)` 生效：窄屏档图钉本来只有 22px，再缩就看不清。
     - 实测：圆钉 36 → **29px**、隐藏钉 52 → **42px**（1440/1920/1366 一致；760 宽仍是 28px 未缩）。
     - **顺带的好处**：图钉变小之后被遮住的星少了一颗 —— 1440×900 由 16/18 变 **17/18**，
       1366×768 由 15/18 变 **16/18**（L6←L7 那处老遮挡仍在，要根治得让图钉随地图等比缩放）。

  3. **加载徽记里的 N 往左挪，让墨迹中心和圆心重合**（玩家截图指出 N 偏右）
     - 根因：徽记是**斜体**衬线 N。用 canvas 量出来 `advance = 37.62px`，
       而**墨迹右边界在 45px** —— 斜体的悬挑让墨迹比"字宽"多出 7.4px；
       CSS 是按键宽（advance）居中的，于是墨迹中心比圆心**偏右 3.69px**。
     - 修法：`padding-right: 0.162em`（= 7.38px @45.6px 字号）。按 em 写，随字号自适应。
     - ⚠️ **不能用 `transform: translateX()`**：幕布那枚的 `transform` 被入场动画
       （`scale` + `rotate`）占着，写静态位移会被动画终态覆盖。`padding` 不参与 transform。
     - ⚠️ **两处（`.page-route-curtain span` 与 `.campaign-arrival__seal strong`）必须一起改**，
       否则跨页接力时徽记会横向跳一下。
     - 实测：圆心 x = 960.00、墨迹中心 x = 960.00，**偏差 −0.00px**。
     - 量法（可复用）：`canvas.measureText('N').actualBoundingBoxLeft/Right` 取墨迹左右边界，
       再按"内容盒宽 − padding − advance"推算文字起点。

  4. **登录 / 注册后先跳模式选择页**（玩家："应该先跳转到 mode，再经过选择跳转到相应界面"）
     - 原来 `index.html` 的登录分支按 `hasSeenPrologue` 决定直跳 `menu.html` 还是 `mode.html`；
       `register.html` 直接跳 `index.html?prologue=1`。
     - 改成：**两条路都跳 `mode.html`**，由玩家在那一页选「通关模式 / 联机模式」，
       再由 `mode.html` 分流（`campaign-mode` 按钮按 `hasSeenPrologue` 决定去
       `index.html?prologue=1` 补播序章，还是 `menu.html?intro=1`）。**没有改动 mode.html。**
     - 实测：老账号（已看过序章）登录 → `mode.html`；新账号注册 → `mode.html`；
       点「通关模式」（未看过序章）→ `index.html?prologue=1`，且幕布加载页正常、登录卡不闪。

  5. **本轮回归**：关卡页 14 视口 × 7 关 = **98 项全部 OK**（含页脚文案为空）；
     `menu` / `index` / `register` / 四个结局页控件全在首屏；控制台错误 0。
     仍不达标（**均为既存问题**）：`mode.html` 矮屏 125~190px、`multiplayer.html` ≤960px 427~974px、
     `group.html` 800×660 起 27~270px、`achievements.html` ≤480px 11~51px。
     版本号：136 处 `?v=20260916-fixB30` → `?v=20260916-fixB31`。
     ⚠️ `game/demo/seed.html`（本地测试账号 1/1 的临时页）**仍未提交**，等玩家用完后删除。

- **2026-09-16 用户反馈第七轮：地图图钉再缩小/统一/移位 + 第 4 关残血开局**：

  1. **地图标志：再缩小一档 + 隐藏关图钉统一成普通尺寸 + 两处旗标移位**
     - 玩家原话："关卡标志仍然过大，再次缩小，7 标志显著大于其它标志，统一成 1 标志大小，
       7 标志稍微往下，1 标志往上到大陆上。"
     - **缩小**：`scale` 由 `0.8` 收到 **`0.7`**（圆钉 36 → **25.2px**）。
     - **统一**：第 7 关那枚在合并后的远端版本里被写成了 **52px / 3px 边 / 1.42rem**
       （`::after` 还有 6px 光环，视觉直径 64px），比普通图钉大一圈 ——
       而文档里写的意图一直是"圆钉尺寸与其它图钉一致"。
       现在尺寸 / 边框 / 字号 / 阴影全部对齐普通图钉，**只保留"金框 + 金尖脚"这个身份特征**；
       星级偏移与锁形图标也回到普通图钉的数值。
     - **移位**（改的是 `levels.js` 的 `map.lat`）：L1 土伦 `43.12 → 44.50`（上移 ≈27px，落到大陆上）、
       L7 `49.05 → 48.20`（下移 ≈18px）。换算口径见「主界面与战役地图」一节。
     - **实测（1920×873，地图外壳 722px）**：7 枚圆钉全部 **25.2×25.2px**；
       星级可见度由 16/18 升到 **18/18**；L6–L7 图钉中心距由 38px 拉开到 **54px**。
       多视口复测：≥1440 是 18/18，1366/1024 是 17/18，窄屏 760 是 17/18，全部无溢出、无滚动条。
     - 说明：`scale` 是**绕着钉尖**缩的（`.map-pin` 是 0×0 锚点 + `transform-origin: 0 0`），
       所以**投影坐标一点都不会偏**，星级那批手工偏移量也不用动。

  2. **第 4 关改成"红方残血开局 + 新增一支步兵"**
     - 玩家要求：`(7,4)` 新增一支红方步兵（30/60）；本关红方全部不是满血，
       分别是 40 / 35 / 45 / 50 / 50 / 30（满血上限 60）。
     - **引擎侧的最小改动**：单位配置原来只有 `lp` 一个字段，`loadGame()` 里
       `lp: element.lp, lpMax: element.lp` —— 也就是"初始血量 = 满血上限"，
       写 `lp: 30` 只会得到 30/30 的满血单位。现在配置里可以**额外给一个 `lpMax`**：
       `lp: 30, lpMax: LP_standard` = 30/60，血条按 50% 画。
       - `loadGame()`：`lpMax: Number(element.lpMax) || element.lp`
       - `loadSnapshot()`：`cfgLp` 同样改成 `Number(pieces[idx].lpMax) || pieces[idx].lp`
         （否则读档后残血单位的上限会被当成 60 之外的旧值）
       - **不写 `lpMax` 的关卡行为完全不变**（`|| element.lp` 兜底），已逐关核对：
         game1/2/3/5/6 的红方全部仍是满血（`60/60` 等）。
     - 残血效果不需要额外样式：单位上方那条实时血条本来就按 `lp / lpMax` 画，
       50% 及以下还会自动加 `is-wounded`（转黄）。实测 (7,4) 那支是 `--unit-health=50.0%` + `is-wounded=true`，
       其余依次 66.7% / 58.3% / 75% / 83.3% / 83.3%。
     - 新增的 (7,4) 距最近的友军 (6.5,4.5) **0.707 格**，大于 0.56 格防重叠下限。
     - 实测：红方编制栏读作 `步兵1 40/60 … 步兵6 30/60`；
       **存档 → 读档往返后仍是 40/35/45/50/50/30**（上限没被吃掉）。

  3. **本轮回归**：关卡页 12 视口 × 7 关 = **84 项全部 OK**；
     逐关核对血量（只有 game4 是残血）；`menu` / `index` / `register` / 四个结局页控件全在首屏；
     控制台错误 0；23 个 JS 通过 `node --check`；CSS 大括号平衡。
     版本号：136 处 `?v=20260916-fixB31` → `?v=20260916-fixB32`。
     ⚠️ `game/demo/seed.html` **仍未提交**，等玩家用完后删除。

- **2026-09-16 第八轮：第 4 关「到底还能不能 3 星」——用引擎实跑推演 + 平衡修正**（玩家提问）

  **背景**：上一轮把第 4 关红方从 5 支（满血 60）改成 6 支（残血 40/35/45/50/50/30）之后，
  玩家问"现在第 4 关真的可以 3 星过关吗"，并给了预案："如果不行，就把蓝方的骑兵和散兵往右上角移动一格"。

  **推演方法**（可复用）：起本地服务器 + Edge(CDP)，直接开 `game4.html?replay=1`，
  在页面里改 `armys` 的 `targetx/targety` 当"玩家下令"，点 `#button` 推回合；
  ⚠️ 两个坑：① 第一回合点"下一步"会弹**空转确认框**（`game4` 开局没人进射程），
  必须先点掉最后那个按钮，否则回合根本不动（第一次跑出来"12 回合什么都没变"就是这个）；
  ② 想临时还原旧配置时**不要把棋子从 DOM 里 remove()**，引擎里有按 id 取元素的代码会抛错、
  回合直接推不动；正确做法是 `disabled = true` + `element.style.display = 'none'`。

  **结论（改动前 vs 改动后，各跑 5~9 种蓝方策略）**：
  | 配置 | 最佳策略结果 |
  |---|---|
  | 改动前（5 支满血 60） | 8 回合、歼 5、**逃 0 → ★3 星** |
  | 改动后（6 支残血） | 最好只有 **2 星**（骑→(9.2,0.2)、散→出口、步兵(6,9)→出口） |
  ⇒ **上一轮的改动确实把 3 星打没了**。原因：红方 2.4 格/回合直奔 `(9.5,-0.5)`，
  蓝方唯一来得及封口的只有骑兵（4.8 格/回合）与散兵（2.4 格/回合），多一支红方之后封口晚了一步。

  **修正**（玩家给的预案，实测有效）：`game4.js` 里
  **散兵 `(3,1) → (4,0)`**（斜向上一格）、**骑兵 `(9,9) → (9,8)`**（已在最右列，只能沿右边界往上一格）。
  到位时间由 2.78 / 1.98 回合提前到 **2.30 / 1.77 回合**，正好抢在红方第一支（2.15 回合）之前。
  - 顺带核对初始间距：散(4,0) 与最近友军 掷(1,1) 相距 3.16 格；骑(9,8) 与 掷(8,7) 相距 1.41 格，都远大于 0.56 格。

  **修正后复测**：9 种蓝方策略里 **4 种能打出 ★3 星**（7~8 回合、全歼 0 逃脱）；
  另外 5 种失败的共同点是"让散兵去追人、没去封出口"——**属于打法不对，不是数值不可能**，
  这正是策略游戏该有的样子。蓝方初始站位实测：`掷(1,1) 步(0,3) 散(4,0) 骑(9,8) 掷(8,7) 步(6,9)`。
  - ⚠️ 第 7 关（隐藏关）的解锁判据是**第 1~6 关全部 3 星**，所以第 4 关必须 3 星可达 ——
    这也是为什么这次平衡修正不能拖。

  **回归**：七关逐关核对血量（只有 game4 是残血）、`#button` 全在视口内、无溢出、页脚为空；
  控制台错误 0；版本号 136 处 `?v=20260916-fixB32` → `?v=20260916-fixB33`。
  ⚠️ `game/demo/seed.html` 仍未提交，等玩家用完后删除。

- **2026-09-16 第九轮：第 7 关图钉再左移（不遮 L6 的星级）**（玩家报"7 号标志遮挡 6 号的星级标志"）

  **根因**：上一轮把 L7 往下挪 18px 之后，它**转而压住了 L6 星级的最左那一颗** ——
  因为 `.map-pin__stars` 是**以圆钉中心为轴左右展开**的（宽 35px），最左那颗正好探向左下方向，
  正落进 L7 圆钉的范围内。**只看"两枚图钉中心距 ≥ 半径和"是不够的**：实测 1280×720 下
  中心距 41px、半径和只有 25.2px，圆钉并不重叠，但第一颗星照样被挡。
  - 实测遮挡量（隐藏路线已开、L7 正常显示 ★★★ 时）：L7 圆钉右缘越过 L6 第一颗星左缘
    1366×768 / 1024×768（外壳 604）11.7px、1280×720（550）13.3px、900×700（528）14.0px、
    760×900 窄屏（620）15.4px、480×800（461）20.2px。
  - 换算：**1 经度 ≈ 地图内宽 × 20 / 1000 px**（地图内宽 = 外壳宽 − 16），各视口需左移 1.25°~1.67°。

  **修法**：`levels.js` 的 HIDDEN_LEVEL `map.lon` 由 **3.08 → 1.28**（左移 1.8°，取最坏情况再留余量），
  lat 保持 48.20。位置仍是象征性的（法国北部一带），不是精确战场坐标。

  **复测**（11 个视口，1920×1080 一直到 480×800）：
  - L6 的 ★★★ 全部命中 `L6`、L7 的 ★★★ 全部命中 `L7`，**互不遮挡**；
  - 隐藏路线全开时地图上共 **21 颗星，21/21 全部可见**（此前 1280×720 / 900×700 各被挡 1 颗）。
  - 顺带核对：两枚图钉圆心距由 41px 恢复到 **51.6px**（1280×720）。

  **可复用的教训**（已写进「主界面与战役地图」一节）：判断地图图钉会不会打架，
  不能只比圆钉半径 —— **星级那行有 35px 宽，横向铺开才是真矛盾**；
  必须用 `elementFromPoint` 逐颗星实测。改坐标时按上面的经/纬度换算公式估，再实测收口。

  版本号 136 处 `?v=20260916-fixB33` → `?v=20260916-fixB34`。
  ⚠️ `game/demo/seed.html` 仍未提交，等玩家用完后删除。

- **2026-09-16 第十轮：第 7 关（隐藏关）可通关性推演**（玩家问"第 7 关真的能过关吗"）
  —— **结论：能过，而且能 3 星；但容错极低，属于"卡着最后一回合"的难度。**

  **推演方法**（可复用）：起 8099 静态服务器 + 带 CDP 的临时 Edge，
  Playwright 里 `page.goto('game7.html?replay=1')`（跳过剧情/简报直达棋盘），
  `add_init_script` 在页面脚本前种 `a.save:v`（`stars` 里 1~6 全 3 才算隐藏路线已开），
  然后**逐回合直接调 `runOneTurn()`** —— 它就是 `#button` 点击处理器的内核
  （"静观其变"确认后也复用它），所以与真人点「下一步」完全等价；
  给蓝方下令就是写 `u.targetx/u.targety`，这正是 `issueMoveTo()` 内部做的事。
  - ⚠️ **坑**：`page.evaluate(DRIVER)` 若 DRIVER 的最后一条语句是
    `window.__run = function(){}`，Playwright 会**把这个函数当成要执行的函数直接调用一次**
    （表现为"还没开始推演，战局已经打到剩 1 回合"）。**末尾补一句 `'driver-ready';`** 即可。

  **扫描结果**（按角色选目标：炮 / 骑 / 掷 / 步散 各选一个目标选择器，共 384 组）：
  | 指标 | 结果 |
  |--|--|
  | 获胜组数 | **6 / 384（1.6%）**，全部 3 星 |
  | 获胜线终局 | 第 17 回合全歼，蓝方剩 2 名（炮满血 60 + 散 14） |
  | 更优解（细扫 180 组） | **12 / 180（6.7%）** 获胜，最好一组**剩 4 名蓝方**（炮 60 / 掷 8.5 / 步 0.8 / 散 7） |
  | 最接近的失败 | 剩 1 红、合计 **17.6 血**（差最后一击） |
  | 固定命令（只下令一次，全程不改） | **必败**：终局剩 4 红、合计 291.6 血 |

  **获胜打法**（`{炮→核心, 骑→最近炮位, 掷→最近炮位, 步散→南炮位}`，每回合重下）：
  ① 开局骑 / 掷 / 步 / 散一起扑**最近的炮位**（南边 `(9,2)`），第 4 回合打掉；
  ② 掷弹兵（120 血）顶前排，转到北炮位 `(9,7.5)`，第 10~11 回合打掉；
  ③ 最后全体围攻核心 `(6.5,5)`（150 血），第 17 回合结束。
  炮全程在西侧 `(2.6,2.6)` 附近远程输出，**它瞄谁几乎不影响胜负，关键是别让它停火**。

  **真实结算复核**（不是脚本假象）：推演完等 1s 结算延迟后读 DOM ——
  `#3star` 计算样式 `block`、`#lose` 为 `none`、`#button-next-game[data-target]` = `hidden-end.html`、
  `a.save:v.stars['7']` = **3**（`autosaveOnWin` 真的写了）。

  **若要放宽**（同一批 384 组策略对比，仅作备选，尚未实施）：
  | 改动 | 胜率 | 最接近的失败 |
  |--|--|--|
  | 现状（18 回合 / 核心 150 血） | 1.6% | 剩 1 红 / 17.6 血 |
  | **回合 18 → 20** | **4.2%** | 剩 2 红 / 71.2 血 |
  | 核心 150 → 120 血 | 2.6% | 剩 1 红 / 1 血 |
  | 红炮射程 4.5 → 4.0 | 1.8% | 剩 1 红 / 8.2 血 |
  - **回合 18 → 20 是唯一"高杠杆"改动**（胜率 ×2.6，且最接近的失败从"差一击"变成明显有余量）；
    核心血量 / 红炮射程都只是小幅缓解。⚠️ 改回合数要同步改 `game7.js` 的 `turns_limit`
    与 `levels.js` 的 `meta`，以及页面标题里的回合文案。
  - ⚠️ 推演脚本里若写死 `for (let t = 1; t <= 18; t++)`，改回合数的对照实验会**静默失效**
    （多出来的回合根本没跑）；必须用 `Number(CURRENT_GAME.turns_limit)`。

### 第十二轮：新兵种「战前教学图」（2026-09-17）

玩家要求："加新手教程。炮兵加到第二关，骑兵加到第三关，散兵和掷弹兵加到第四关。新手教程参考关卡一。"
**后续修正（同轮）：**"散兵改成放第三关。" —— 散兵介绍页从 L4 挪到 L3，L4 只剩掷弹兵。

**做法：把第 1 关那套教学图机制抽成"每关一张清单"，再把 4 张新兵种 PPT 挂到第 2/3/4 关。**
命名规律 = **`levelN-intro-M.webp`**：N 是关卡号、M 是该关第几张。散兵挪关后按新关号重排了文件名（`level4-intro-1.webp` → `level3-intro-2.webp`，原 `level4-intro-2.webp` → `level4-intro-1.webp`），`git mv` 保留历史。

| 关 | 新增教学图 | 兵种要点（图上的文案） |
|--|--|--|
| 2 | `img/level2-intro-1.webp` | 炮兵：重要兵种；攻击力较高、血量一般、攻击距离极高；中坚力量，是战斗的核心 |
| 3 | `img/level3-intro-1.webp` | 骑兵：特殊兵种；攻击力较高、血量一般、移动速度极快；突破力量，截杀敌方重要单位 |
| 3 | `img/level3-intro-2.webp` | 散兵：特殊兵种；攻击范围较高、血量较低、移动速度较快；火力支援，游击骚扰 |
| 4 | `img/level4-intro-1.webp` | 掷弹兵：特殊兵种；攻击范围较低、血量较高、移动速度较慢；战线支点，重要力量 |

**代码改动（破坏最小的方式，`style.css` 一行没动）：**

1. `js/levels.js`：第 1~4 关各加一个 `introImages: ['…webp?v=…']` 字段（第 1 关就是把原来写死在 `main.js` 里的两个路径搬过来）。**跨关卡信息进 `levels.js`** 符合既有约定，且各关作者以后改自己的教学图不用碰 `main.js`；**挪关 = 改一个数组，`main.js` 零改动**（散兵挪到 L3 时验证了这一点）。
2. `js/main.js`：新增 `levelIntroImages(meta)`（没写 / 空数组 → 返回 `[]`）；`showIntroImages()` 删掉硬编码的 `if (CURRENT_LEVEL_ID !== 1)` 和固定路径数组，改成读清单（**空清单直接 `next()`**，与原来"非第 1 关直接跳过"等价）；`warmLevelIntroAssets()` 里的 `if (Number(CURRENT_LEVEL_ID) === 1) { 预热两张固定图 }` 同样换成遍历清单。`alt` 文案从"第一关教程图 N"改成 `<关名> · 战前教学图 N / M`。
3. `game2/3/4.html`：各加 `<link rel="preload" as="image" href="…" type="image/webp">`（L3 两条、L4 一条），与 `game1.html` 一致。
4. **19 个 HTML 的资源版本号 `20260916-fixB34` → `20260917-tutor1`**（136 处；散兵挪关时再升到 **`20260917-tutor2`**，同样 136 处）。4 张新教学图的 URL 统一带 **`?v=20260917-img2`**；`level1-intro-*.webp` 保持 `20260916-img1` 不动（图没换）。
   - ⚠️ 挪关时**必须换版本号**：`level4-intro-1.webp` 这个 URL 之前服务的是散兵、挪关后服务的是掷弹兵，**同一个 URL 换了内容**，不换 query 就会拿到缓存里的旧图。

**素材**：4 张源 PNG（2000×1184 / 1629×965 / 2000×1184 / 1630×965）统一 `magick in.png -resize 1530x -strip -quality 82 -define webp:method=6 out.webp` → **全部 1530×906，合计 712,636 B**（单张 136~223KB）。比例 1.688 与 `level1-intro-2`（1524×903）完全一致，所以在同一个弹窗里渲染尺寸相同。**只入库 WebP、不留 PNG 母版**：母版每张约 2MB（4 张 ≈ 8MB），而页面只加载 `.webp`；`level1-intro-1/2` 的 PNG 是历史遗留，不影响。

**验收（Playwright + headless Edge，1366×768，程序化点完剧情/简报后逐张关闭教学图）：**

| 页面 | 期望张数 | 实测 | 每张 URL（按弹出顺序） | `naturalWidth×naturalHeight` | 渲染尺寸 |
|--|--|--|--|--|--|
| `game1.html` | 2 | **2** | `level1-intro-1/2` | 1530×1064、1524×903 | 1038×722、1218×722 |
| `game2.html` | 1 | **1** | `level2-intro-1` | 1530×906 | 1219×722 |
| `game3.html` | 2 | **2** | `level3-intro-1`（骑兵）→ `level3-intro-2`（散兵） | 1530×906 ×2 | 1219×722 |
| `game4.html` | 1 | **1** | `level4-intro-1`（掷弹兵） | 1530×906 | 1219×722 |
| `game5/6/7.html` | 0 | **0** | — | — | — |
| `game3/4.html?replay=1` | 0 | **0** | — | — | — |
| `game8.html`（走完对话） | 0 | **0** | — | — | — |

- 教学图 `is-loading` 全部 `false`（图片已解码才显示）、`×` 按钮存在、关闭后 `body` 不再带 `level-opening`、`#board` 子元素 108~117 个、**页面破图 0、`pageerror` 0**。
- 静态：改动的 `main.js` / `levels.js` 通过 `node --check`；**16 段内联 `<script>` 语法自检 0 错**；索引/主界面/模式/成就/三个结局页/小组页/第 8 关 smoke 全部无 `pageerror`、无破图；`git diff --check` 干净。
- **图片内容也肉眼核对过**（`read_image`）：`level3-intro-2.webp` 确实是「散兵」页、`level4-intro-1.webp` 确实是「掷弹兵」页 —— 挪关时改名很容易串页，这一步别省。
- ⚠️ 首次跑 smoke 时 `game8.html` 报 `!!`（`level-opening` + 一张 `src` 为空的 `<img>`）——那是**测试脚本在对话没走完时就取样**，`game8` 本来就要等剧情播完才揭开战场；补上"点完对话"后再测就是 `game8 / overlays 0 / board 109 / 破图 0`。**这类"疑似回归"先怀疑取样时机。**
- ⚠️ 另一个坑：`pwsh` 里 `Set-Location` 在**同一次调用内是持续的**，`Set-Location game\demo\img` → `Set-Location ..\..` 会停在 `game\`，后续相对路径就全错了。临时脚本一律用 `workdir` 参数或绝对路径。

