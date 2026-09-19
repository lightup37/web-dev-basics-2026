/* =====================================================================
   common.js —— 全站通用行为（渐进增强：禁用 JS 后页面依然完整可用）
   1) 导航条滚动阴影  2) 回到顶部  3) 同栏目跳转淡入过渡
   4) 三级分页高亮与滚动定位  5) 图片加载淡入  6) 页脚年份
   7) 翻转卡点击/键盘翻转  8) 技能图标组（教材 showHide 的现代版）
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------- 1. 导航条滚动阴影 */
  function navShadow() {
    var nav = $('.site-navbar');
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------- 2. 回到顶部按钮 */
  function backToTop() {
    var btn = $('#back-to-top');
    if (!btn) return;
    var toggle = function () {
      if (window.scrollY > 480) btn.removeAttribute('hidden');
      else btn.setAttribute('hidden', '');
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------- 3. 同栏目内跳转时做淡入（Tab 的观感） */
  function sameSectionTransition() {
    var main = $('main.site-main');
    if (!main) return;

    var KEY = 'gz:from-section';
    var prev = null;
    try { prev = sessionStorage.getItem(KEY); } catch (e) { /* 隐私模式忽略 */ }
    var cur = document.body.getAttribute('data-section');

    if (prev && cur && prev === cur && !reduceMotion) {
      main.classList.add('is-entering');
      window.setTimeout(function () { main.classList.remove('is-entering'); }, 460);
      // 同栏目切换时回到顶部，视觉上更接近 Tab 切换
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }

    try { sessionStorage.setItem(KEY, cur || ''); } catch (e) { /* 忽略 */ }
  }

  /* --------------------------------------- 4. 三级导航分页：高亮与定位 */
  function pageNav() {
    var nav = $('#page-nav');
    if (!nav) return;

    var links = $$('#page-nav .page-link');
    var items = $$('#page-nav .page-item');
    if (!links.length) return;

    var targets = links
      .map(function (a) {
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        var el = id ? document.getElementById(id) : null;
        return el ? { link: a, item: a.parentElement, el: el } : null;
      })
      .filter(Boolean);

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var top = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('scroll-padding-top'), 10) || 84);
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
        // 同步地址栏锚点，支持前进/后退
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        setCurrent(a.parentElement);
      });
    });

    function setCurrent(item) {
      items.forEach(function (it) { it.classList.toggle('current', it === item); });
    }

    // 滚动时高亮当前章节
    if ('IntersectionObserver' in window && targets.length) {
      var visible = new Map();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
        });
        var best = null;
        var bestRatio = 0;
        targets.forEach(function (t) {
          var r = visible.get(t.el) || 0;
          if (r > bestRatio) { bestRatio = r; best = t; }
        });
        if (!best) {
          // 没有可见章节时，取最后一个已滚过的
          for (var i = targets.length - 1; i >= 0; i--) {
            if (targets[i].el.getBoundingClientRect().top < 140) { best = targets[i]; break; }
          }
        }
        if (best) setCurrent(best.item);
      }, { rootMargin: '-88px 0px -55% 0px', threshold: [0, 0.12, 0.4, 0.75, 1] });
      targets.forEach(function (t) { io.observe(t.el); });
    }

    // 带锚点直接进入时，定位并高亮
    if (location.hash) {
      var hit = targets.find(function (t) { return '#' + t.el.id === location.hash; });
      if (hit) window.setTimeout(function () { setCurrent(hit.item); }, 60);
    }
  }

  /* --------------------------------------------- 5. 懒加载图片淡入 */
  /**
   * 只对**确实还在加载中**的图片淡入，并且用 class 而不是内联 style。
   *
   * 早先的实现给所有未加载完的图片写了内联 `transition: opacity 420ms`。
   * 内联样式优先级高于样式表，于是覆盖掉了卡片缩略图本来的
   * `transition: transform`——鼠标悬停时图片不再平滑放大，而是一下跳到位；
   * 如果此刻图片刚好加载完成，透明度还在过渡，看上去就是"悬停时闪一下"。
   * 改成纯 CSS class，不再侵入元素自身的过渡。
   */
  function imageFade() {
    $$('img').forEach(function (img) {
      if (img.complete) return; // 已加载好的完全不碰
      var done = function () { img.classList.add('is-loaded'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      // 注册监听与执行之间可能已经加载结束，这里补一次判断
      if (img.complete) done();
      else img.classList.add('is-loading');
    });
  }

  /* ------------------------------------------------- 6. 页脚年份填充 */
  function footerYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------------------- 7. 翻转卡：点击与键盘均可翻转 */
  function flipCards() {
    $$('.flipcard').forEach(function (card) {
      var toggle = function () {
        var on = card.classList.toggle('is-flipped');
        card.setAttribute('aria-expanded', on ? 'true' : 'false');
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* --------------------- 8. 技能图标组：鼠标/键盘/触屏三种交互都支持 */
  function skillGroups() {
    $$('[data-skill-group]').forEach(function (group) {
      var buttons = $$('[data-skill-target]', group);
      var panels = $$('.skill-panel', group);
      if (!buttons.length) return;

      function select(btn) {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        var id = btn.getAttribute('data-skill-target');
        panels.forEach(function (p) { p.hidden = p.id !== id; });
      }

      buttons.forEach(function (btn) {
        var activate = function () { select(btn); };
        btn.addEventListener('mouseenter', activate);
        btn.addEventListener('focus', activate);
        btn.addEventListener('click', function (e) { e.preventDefault(); activate(); });
      });

      select(buttons[0]);
    });
  }

  /* ---------------------------------------------------------------- 启动 */
  function init() {
    navShadow();
    backToTop();
    sameSectionTransition();
    pageNav();
    flipCards();
    skillGroups();
    footerYear();
    // 图片淡入放到 load 之后，避免和懒加载冲突
    if (document.readyState === 'complete') imageFade();
    else window.addEventListener('load', imageFade);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
