/* ============================================================
   pages.js —— 全站页面词典
   作用:维护"名称 → 页面路径(相对站点根)"的对照表,
   供 search.js 实现"完全匹配"站内搜索与输入提示。
   说明:页面路径均相对站点根目录写,search.js 会按当前页面
   深度自动补 "../" 前缀,因此词典只需维护一份。
   ============================================================ */
var SITE_PAGES = [
  { n: '首页',       u: 'index.html' },
  { n: '独家菜单',   u: 'featured.html' },

  { n: '川菜',       u: 'chuan/index.html' },
  { n: '宫保鸡丁',   u: 'chuan/gongbaojiding.html' },
  { n: '东坡肘子',   u: 'chuan/dongpozhouzi.html' },
  { n: '毛血旺',     u: 'chuan/maoxuewang.html' },
  { n: '麻婆豆腐',   u: 'chuan/mapodoufu.html' },
  { n: '回锅肉',     u: 'chuan/huiguorou.html' },

  { n: '鲁菜',       u: 'lu/index.html' },
  { n: '糖醋鲤鱼',   u: 'lu/tangculiyu.html' },
  { n: '葱烧海参',   u: 'lu/congshaohaishen.html' },
  { n: '九转大肠',   u: 'lu/jiuzhuandachang.html' },
  { n: '爆炒腰花',   u: 'lu/baochaoyaohua.html' },
  { n: '油焖大虾',   u: 'lu/youmendaxia.html' },

  { n: '粤菜',       u: 'yue/index.html' },
  { n: '蜜汁叉烧',   u: 'yue/michazhashao.html' },
  { n: '白切鸡',     u: 'yue/baiqueji.html' },
  { n: '虾饺',       u: 'yue/xiajiao.html' },
  { n: '干炒牛河',   u: 'yue/ganchaoniuhe.html' },
  { n: '烧鹅',       u: 'yue/shaoe.html' },

  { n: '湘菜',       u: 'xiang/index.html' },
  { n: '剁椒鱼头',   u: 'xiang/duojiyutou.html' },
  { n: '毛氏红烧肉', u: 'xiang/maoshihongshaorou.html' },
  { n: '口味虾',     u: 'xiang/kouweixia.html' },
  { n: '辣椒炒肉',   u: 'xiang/lajiaochaorou.html' },
  { n: '长沙臭豆腐', u: 'xiang/changshachoudoufu.html' }
];
