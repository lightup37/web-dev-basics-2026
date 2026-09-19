/* =====================================================================
   skills.js —— 技能图标组（教材 showHide 效果的现代版）

   对应教材 10.4.3 里那个「默认第 1 个图标高亮、鼠标悬停到其它图标时
   内容跟着切换」的效果，但做了三点增强：
     1. 事件委托 + 三种触发通道（鼠标悬停 / 键盘聚焦 / 点击），触屏也能用；
     2. 用 aria-selected 表达状态，读屏软件可感知；
     3. 无 JS 时全部内容面板都显示，页面不会变空——脚本运行时才收起其它面板。

   结构（由内容片段直接写 HTML）：
     <div data-skill-group>
       <div class="skill-icons">
         <button type="button" data-skill-target="skill-a" aria-selected="true">
           <img src="..." alt="技能一"></button>
         ...
       </div>
       <div class="skill-panel" id="skill-a">...</div>
       <div class="skill-panel" id="skill-b">...</div>
     </div>

   注意：面板**不要**预先写 hidden 属性，脚本会自己收起初次之外的面板。
   ===================================================================== */
(function () {
  'use strict';

  function initOne(group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-skill-target]'));
    var panels = Array.prototype.slice.call(group.querySelectorAll('.skill-panel'));
    if (!buttons.length || !panels.length) return;

    function select(btn, moveFocus) {
      var id = btn.getAttribute('data-skill-target');
      buttons.forEach(function (b) {
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        b.tabIndex = b === btn ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.hidden = p.id !== id;
      });
      if (moveFocus && document.activeElement !== btn) btn.focus();
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { select(btn); });
      btn.addEventListener('focus', function () { select(btn); });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        select(btn);
      });

      // 左右方向键在图标之间移动（键盘可达性）
      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = buttons[(i + 1) % buttons.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = buttons[(i - 1 + buttons.length) % buttons.length];
        else if (e.key === 'Home') next = buttons[0];
        else if (e.key === 'End') next = buttons[buttons.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    // 初次渲染：收起除第一个之外的面板
    var current = buttons.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || buttons[0];
    select(current);
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll('[data-skill-group]')).forEach(initOne);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
