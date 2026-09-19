/* =====================================================================
   lightbox.js —— 图片灯箱（无第三方依赖）
   · 自动接管所有 .lightbox-trigger（由 Markdown 的 ::: figure / ::: split 生成）
   · 支持左右切换、Esc 关闭、点击遮罩关闭、键盘焦点陷阱
   ===================================================================== */
(function () {
  'use strict';

  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    var triggers = $$('.lightbox-trigger').filter(function (a) {
      return a.getAttribute('href') && !/^https?:/i.test(a.getAttribute('href'));
    });
    if (!triggers.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '图片预览');
    box.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="关闭预览"><i class="bi bi-x-lg"></i></button>' +
      '<button class="lightbox-prev" type="button" aria-label="上一张"><i class="bi bi-chevron-left"></i></button>' +
      '<button class="lightbox-next" type="button" aria-label="下一张"><i class="bi bi-chevron-right"></i></button>' +
      '<figure class="lightbox-figure"><img class="lightbox-img" alt=""><figcaption class="lightbox-caption"></figcaption></figure>' +
      '<span class="lightbox-counter" aria-hidden="true"></span>';
    document.body.appendChild(box);

    var imgEl = box.querySelector('.lightbox-img');
    var capEl = box.querySelector('.lightbox-caption');
    var cntEl = box.querySelector('.lightbox-counter');
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      var a = triggers[index];
      var inner = a.querySelector('img');
      var src = a.getAttribute('href');
      imgEl.setAttribute('src', src);
      imgEl.setAttribute('alt', inner ? inner.getAttribute('alt') || '' : '');
      var cap = a.getAttribute('data-caption') || (inner ? inner.getAttribute('alt') : '') || '';
      capEl.textContent = cap;
      cntEl.textContent = triggers.length > 1 ? index + 1 + ' / ' + triggers.length : '';
      var multi = triggers.length > 1;
      box.querySelector('.lightbox-prev').style.display = multi ? '' : 'none';
      box.querySelector('.lightbox-next').style.display = multi ? '' : 'none';
    }

    function open(i) {
      lastFocus = document.activeElement;
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      show(i);
      box.querySelector('.lightbox-close').focus();
      document.addEventListener('keydown', onKey);
    }

    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { show(index - 1); return; }
      if (e.key === 'ArrowRight') { show(index + 1); return; }
      if (e.key === 'Tab') {
        // 简易焦点陷阱：只在灯箱内的可聚焦元素之间循环
        var focusables = $$('button', box);
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    triggers.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
    box.querySelector('.lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    // 触摸左右滑动切换
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    if (reduceMotion) box.style.animation = 'none';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
