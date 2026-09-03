# 唐诗宋词网站

powered by [lightup37](https://github.com/lightup37) with ❤️.

## 项目结构

```bash
.
├── index.html                # 主页面
├── css/
│   └── style.css             # 全局样式
├── img/
│   ├── sushi.jpg
│   └── ....                  # 图片文件
├── Li-Bai.html               
├── ...                       # 各诗人的个人页面
└── README.md                 # 项目说明
```

## 设计逻辑

设计顶端导航栏用于快速跳转, 由于诗人页面数不多所以直接全部放上了, 用不同颜色的方块提示诗人的所属朝代. 顶部的方块采用无 ``border`` 的圆框设计.

主页和诗人个人页面的设计采用通用的卡片, 卡片样式由 AI 协助给出, 设计了堆叠逻辑 ``display: flex; flex-directionL: column;`` 让容器内的元素上下排列, ``padding: 1.75rem 1.75rem 2rem`` 与 ``text-align: center;`` 确保卡片内容的美观. 设计了圆框 ``border-radius: 1.5rem;``,阴影 ``box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02);`` 与鼠标移上去的延时变化 ``transition: box-shadow 0.25s ease, transform 0.2s ease;`` 来美化卡片. 由于网站整体采用白杏仁色作为背景, 卡片采用纯白色, 既能区分卡片也不显得突兀.

唐诗宋词的介绍与诗人卡片均采用图片+文字的形式, 通过响应式开发确保移动端体验, 经测试移动端可以正常渲染.

诗人诗词卡片采用两张并排的设计, 在移动端退化为一张一张呈现. 使用了自定义的容器, 并应用 css 的选择器对其内部卡片进行特殊设计, 确保了可移植性. 经测试, 渲染效果令人满意.

## 个人日志

[personal-log.md](./personal-log.md)