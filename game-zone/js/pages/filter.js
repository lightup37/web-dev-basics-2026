/* =====================================================================
   filter.js —— 卡牌 / 遗物 / 装备等条目的多条件筛选
   用法（由内容片段直接写 HTML）：
     <div class="filter-bar" data-filter-root="#pool-1">
       <button class="chip is-active" data-filter="all">全部</button>
       <button class="chip" data-filter="攻击">攻击</button>
       ...
       <input class="filter-search" type="search" placeholder="搜索名称或效果…">
       <span class="filter-count" data-filter-count></span>
     </div>
     <div class="card-pool" id="pool-1">
       <div class="pool-item" data-tags="攻击 普通">…</div>
     </div>
   筛选逻辑：分类按钮按 data-tags 匹配；搜索框匹配条目全部文本；实时显示命中数并处理空态。
   ===================================================================== */
(function () {
  'use strict';

  function initOne(bar) {
    var rootSel = bar.getAttribute('data-filter-root');
    var pool = rootSel ? document.querySelector(rootSel) : null;
    if (!pool) return;

    var chips = Array.prototype.slice.call(bar.querySelectorAll('.chip[data-filter]'));
    var search = bar.querySelector('.filter-search');
    var counter = bar.querySelector('[data-filter-count]');
    var items = Array.prototype.slice.call(pool.querySelectorAll('.pool-item'));
    var empty = pool.parentElement.querySelector('.filter-empty');

    var state = { tag: 'all', q: '' };

    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'filter-empty';
      empty.textContent = '没有匹配的条目，换个条件试试。';
      empty.hidden = true;
      pool.insertAdjacentElement('afterend', empty);
    }

    function apply() {
      var hit = 0;
      items.forEach(function (item) {
        var tags = (item.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
        var okTag = state.tag === 'all' || tags.indexOf(state.tag) !== -1;
        var okText = !state.q || item.textContent.toLowerCase().indexOf(state.q) !== -1;
        var show = okTag && okText;
        item.hidden = !show;
        if (show) hit++;
      });
      if (counter) counter.textContent = '命中 ' + hit + ' / ' + items.length + ' 项';
      empty.hidden = hit !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        state.tag = chip.getAttribute('data-filter');
        apply();
      });
    });

    if (search) {
      var timer = null;
      search.addEventListener('input', function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          state.q = search.value.trim().toLowerCase();
          apply();
        }, 120);
      });
    }

    // 支持用 URL 上的 ?tag=xx 直接过滤（方便从其它页面深链过来）
    var m = location.search.match(/[?&]tag=([^&]+)/);
    if (m) {
      var t = decodeURIComponent(m[1]);
      var target = chips.filter(function (c) { return c.getAttribute('data-filter') === t; })[0];
      if (target) {
        chips.forEach(function (c) { c.classList.toggle('is-active', c === target); });
        state.tag = t;
      }
    }

    apply();
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll('.filter-bar')).forEach(initOne);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
