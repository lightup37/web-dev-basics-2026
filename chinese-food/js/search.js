/* ============================================================
   search.js —— 站内"完全匹配"搜索(全站共用一个文件)
   作用:
   1) 把词典里的名称填进输入框的下拉提示(datalist);
   2) 提交时把输入与名称做"完全匹配":一致则跳转到对应页面,
      不一致则给出简短提示,不跳转。
   说明:用户要求尽量简单的完全匹配,因此不做分词/模糊匹配;
   页面深度前缀由每个页面开头的 window.SITE_PREFIX 提供
   (根目录页面为空串,子目录页面为 "../")。
   ============================================================ */
(function () {
  'use strict';
  var PREFIX = (typeof window.SITE_PREFIX !== 'undefined') ? window.SITE_PREFIX : '';

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    var form = document.getElementById('searchform');
    var input = document.getElementById('searchinput');
    var msg = document.getElementById('searchmsg');
    if (!form || !input) { return; }

    // 1) 为输入框填充全部页面名称作为可选项(便于用户直接点选)
    var list = document.getElementById('searchsuggest');
    if (list && typeof SITE_PAGES !== 'undefined') {
      SITE_PAGES.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.n;
        list.appendChild(opt);
      });
    }

    // 2) 提交:完全匹配 → 跳转;否则提示
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = input.value.replace(/\s+/g, ''); // 去掉空白后比较
      if (!val) { return; }
      var hit = null;
      if (typeof SITE_PAGES !== 'undefined') {
        for (var i = 0; i < SITE_PAGES.length; i++) {
          if (SITE_PAGES[i].n === val) { hit = SITE_PAGES[i]; break; }
        }
      }
      if (hit) {
        window.location.href = PREFIX + hit.u;
      } else if (msg) {
        msg.textContent = '未找到「' + input.value.trim() + '」。请输入完整名称,如:宫保鸡丁、川菜、联系我们。';
        msg.hidden = false;
        clearTimeout(msg._t);
        msg._t = setTimeout(function () { msg.hidden = true; }, 4000);
        input.focus();
      }
    });

    // 3) 重新输入时隐藏上次的提示
    input.addEventListener('input', function () {
      if (msg) { msg.hidden = true; }
    });
  });
})();
