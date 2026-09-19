/* =====================================================================
   effects.js —— 滚动与数据可视化效果
   1) 滚动淡入 .reveal   2) 数字滚动 .metric-value[data-count]
   3) 时间轴进度与节点点亮   4) 阅读进度条
   全部基于 IntersectionObserver，且在 prefers-reduced-motion 下自动降级为直接显示。
   ===================================================================== */
(function () {
  'use strict';

  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* --------------------------------------------------- 1. 滚动淡入 */
  function setupReveal() {
    // 自动为正文里的主要块级元素加 .reveal（不想手写的元素加 class="no-reveal" 可排除）
    var auto = $$('.md-body > h2, .md-body > .md-figure, .md-body > .metrics, .md-body > .timeline, .md-body > .flipcards, .md-body > .md-cards, .md-body > .callout, .md-body > .table-responsive, .md-body > .md-emphasis, .md-body > .md-stats, .md-body > .md-steps, .entry-grid > *, .section-extra, .planned-block, .home-section > *');
    auto.forEach(function (el) {
      if (!el.classList.contains('no-reveal')) el.classList.add('reveal');
    });

    var targets = $$('.reveal');
    if (!targets.length) return;
    // 首页首屏（轮播）不做淡入，避免影响 LCP
    targets = targets.filter(function (el) { return !el.closest('.home-carousel'); });
    if (!targets.length) return;

    if (reduceMotion || !hasIO) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------- 2. 数字滚动 */
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  function countUp(el) {
    var raw = el.getAttribute('data-count');
    if (raw == null) return;
    var target = parseFloat(raw);
    if (isNaN(target)) return;

    var decimals = (raw.split('.')[1] || '').length;
    var tail = el.querySelector('.metric-tail');
    var tailHtml = tail ? tail.outerHTML : '';
    // 数字滚动结束后的最终文本：优先用生成时写入的原文（保留千分位写法）
    var finalText = el.getAttribute('data-formatted') || format(target, decimals);

    if (reduceMotion) {
      el.innerHTML = finalText + tailHtml;
      return;
    }

    var dur = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.innerHTML = format(target * easeOutCubic(p), decimals) + tailHtml;
      if (p < 1) requestAnimationFrame(step);
      else el.innerHTML = finalText + tailHtml;
    }
    requestAnimationFrame(step);
  }

  function format(n, decimals) {
    var s = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function setupCounters() {
    var els = $$('.metric-value[data-count]');
    if (!els.length) return;

    if (!hasIO || reduceMotion) {
      els.forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          countUp(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------- 3. 时间轴进度 */
  function setupTimeline() {
    var timelines = $$('.timeline');
    if (!timelines.length) return;

    timelines.forEach(function (tl) {
      var items = $$('.tl-item', tl);
      if (!items.length) return;

      if (reduceMotion) {
        items.forEach(function (it) { it.classList.add('is-active'); });
        tl.style.setProperty('--tl-progress', '100%');
        return;
      }

      var onScroll = function () {
        var rect = tl.getBoundingClientRect();
        var vh = window.innerHeight;
        // 以视口中线为「读到的位置」
        var readLine = vh * 0.62;
        var total = rect.height;
        var passed = Math.min(Math.max(readLine - rect.top, 0), total);
        tl.style.setProperty('--tl-progress', ((passed / total) * 100).toFixed(2) + '%');

        items.forEach(function (it) {
          var r = it.getBoundingClientRect();
          it.classList.toggle('is-active', r.top < readLine);
        });
      };

      var ticking = false;
      var req = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { onScroll(); ticking = false; });
      };
      onScroll();
      window.addEventListener('scroll', req, { passive: true });
      window.addEventListener('resize', req);
    });
  }

  /* ------------------------------------------------- 4. 阅读进度条 */
  function setupReadingProgress() {
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    document.body.appendChild(bar);

    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p.toFixed(2) + '%';
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------- 5. 对比条填充 */
  function setupBars() {
    var bars = $$('[data-bars]');
    if (!bars.length) return;

    if (reduceMotion || !hasIO) {
      bars.forEach(function (b) { b.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.25 });
    bars.forEach(function (b) { io.observe(b); });
  }

  function init() {
    setupReveal();
    setupCounters();
    setupTimeline();
    setupBars();
    setupReadingProgress();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
