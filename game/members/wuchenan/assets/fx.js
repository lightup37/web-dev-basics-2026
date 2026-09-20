(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    var HEROES = [
      "assets/hero/hero-01-fireworks.jpg",
      "assets/hero/hero-02-greenbutterfly.jpg",
      "assets/hero/hero-04-golden.jpg"
    ];
    if (heroBg.dataset.heroes) {
      var custom = heroBg.dataset.heroes.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (custom.length) HEROES = custom;
    }

    var order = HEROES.slice();
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i];
      order[i] = order[j];
      order[j] = t;
    }

    var idx = 0;
    function tryHero() {
      if (idx >= order.length) return;
      var img = new Image();
      img.onload = function () {
        heroBg.style.backgroundImage = 'url("' + order[idx] + '")';
      };
      img.onerror = function () {
        idx += 1;
        tryHero();
      };
      img.src = order[idx];
    }
    tryHero();
  }

  var canvas = document.getElementById("fx");
  var ctx = canvas && canvas.getContext("2d");

  if (canvas && ctx && !reduceMotion.matches) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    var CYAN = ["95, 232, 204", "150, 240, 219", "84, 210, 190"];
    var WARM = "255, 217, 122";

    var flies = [];
    var flyCount = Math.min(30, Math.max(16, Math.round(W / 48)));
    for (var i = 0; i < flyCount; i++) {
      var warm = Math.random() < 0.22;
      flies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.26,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.0,
        color: warm ? WARM : CYAN[Math.floor(Math.random() * CYAN.length)]
      });
    }

    var motes = [];
    var moteCount = Math.min(52, Math.max(26, Math.round(W / 28)));
    for (var j = 0; j < moteCount; j++) {
      motes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 1.4,
        fall: 0.12 + Math.random() * 0.26,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.1 + Math.random() * 0.24
      });
    }

    function drawFly(now, f) {
      f.x += f.vx + Math.sin(now / 1400 + f.phase) * 0.16;
      f.y += f.vy + Math.cos(now / 1500 + f.phase) * 0.1;
      if (f.x < -14) f.x = W + 14;
      if (f.x > W + 14) f.x = -14;
      if (f.y < -14) f.y = H + 14;
      if (f.y > H + 14) f.y = -14;

      var tw = 0.4 + 0.6 * Math.abs(Math.sin(now / 900 * f.speed + f.phase));
      var glowR = f.r * 6.5;

      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
      g.addColorStop(0, "rgba(" + f.color + ", " + 0.85 * tw + ")");
      g.addColorStop(0.35, "rgba(" + f.color + ", " + 0.3 * tw + ")");
      g.addColorStop(1, "rgba(" + f.color + ", 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(" + f.color + ", " + 0.9 * tw + ")";
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawMote(now, m) {
      m.y += m.fall;
      m.sway += 0.004;
      m.rot += m.spin;
      m.x += Math.sin(m.sway) * 0.14;
      if (m.y > H + 8) {
        m.y = -8;
        m.x = Math.random() * W;
      }
      if (m.x < -8) m.x = W + 8;
      if (m.x > W + 8) m.x = -8;

      var a = m.alpha * (0.7 + 0.3 * Math.sin(now / 1200 + m.sway * 2));
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.fillStyle = "rgba(150, 240, 219, " + a + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, m.r * 2.4, m.r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) drawMote(now, motes[i]);
      for (var j = 0; j < flies.length; j++) drawFly(now, flies[j]);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var progress = document.getElementById("progress");
  if (progress) {
    function updateProgress() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = pct + "%";
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  var toTop = document.getElementById("toTop");
  if (toTop) {
    function toggleToTop() {
      toTop.classList.toggle("show", window.scrollY > 420);
    }
    window.addEventListener("scroll", toggleToTop, { passive: true });
    toggleToTop();
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }
})();
