// 电影欣赏网 V7：顶部搜索 + 首页循环电影架 + 返回与轻量入场动画
(function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 顶部实时搜索：支持片名、导演、主演和类型。
    var search = document.getElementById('movieSearch');
    var results = document.getElementById('searchResults');
    var searchBox = document.getElementById('navSearch');

    if (search && results) {
        var cards = Array.prototype.slice.call(document.querySelectorAll('.home-grid .movie-card'));
        var movies = cards.map(function (card) {
            var link = card.querySelector('.m-name a');
            var img = card.querySelector('.poster');
            var meta = card.querySelector('.movie-sub');
            return {
                name: link ? link.textContent.trim() : '',
                href: link ? link.getAttribute('href') : '#',
                image: img ? img.getAttribute('src') : '',
                alt: img ? img.getAttribute('alt') : '',
                meta: meta ? meta.textContent.trim() : '',
                search: (card.getAttribute('data-search') || '').toLowerCase()
            };
        });

        function closeResults() {
            results.classList.remove('active');
        }

        function renderResults() {
            var key = search.value.trim().toLowerCase();
            results.innerHTML = '';
            if (!key) {
                closeResults();
                return;
            }

            var matched = movies.filter(function (movie) {
                return movie.search.indexOf(key) !== -1;
            });

            if (!matched.length) {
                var empty = document.createElement('p');
                empty.className = 'no-results';
                empty.textContent = '没有找到与“' + search.value.trim() + '”相关的电影';
                results.appendChild(empty);
            } else {
                matched.forEach(function (movie) {
                    var a = document.createElement('a');
                    a.className = 'search-result-item';
                    a.href = movie.href;

                    var image = document.createElement('img');
                    image.src = movie.image;
                    image.alt = movie.alt;

                    var copy = document.createElement('div');
                    copy.className = 'search-result-copy';
                    var name = document.createElement('p');
                    name.className = 'search-result-name';
                    name.textContent = movie.name;
                    var meta = document.createElement('p');
                    meta.className = 'search-result-meta';
                    meta.textContent = movie.meta || '电影详情';
                    copy.appendChild(name);
                    copy.appendChild(meta);

                    a.appendChild(image);
                    a.appendChild(copy);
                    results.appendChild(a);
                });
            }
            results.classList.add('active');
        }

        search.addEventListener('input', renderResults);
        if (searchBox) {
            searchBox.addEventListener('click', function () {
                if (window.innerWidth <= 640 && !searchBox.classList.contains('open')) {
                    searchBox.classList.add('open');
                    search.focus();
                }
            });
        }
        search.addEventListener('focus', function () {
            if (searchBox) { searchBox.classList.add('open'); }
            if (search.value.trim()) { renderResults(); }
        });
        search.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                search.value = '';
                closeResults();
                search.blur();
                if (searchBox) { searchBox.classList.remove('open'); }
            }
        });
        document.addEventListener('click', function (e) {
            if (searchBox && !searchBox.contains(e.target)) {
                closeResults();
                searchBox.classList.remove('open');
            }
        });
    }

    // 首页电影架：恢复最初版本的核心交互方式。
    // 桌面端复制一份内容形成无缝循环，悬停暂停自动滚动，滚轮平滑横向查看；
    // 不再使用 scrollLeft 边界判断和鼠标拖拽，因此普通点击电影始终直接跳转。
    var shelves = document.querySelectorAll('.home-grid');
    for (var i = 0; i < shelves.length; i++) {
        initShelf(shelves[i]);
    }

    function initShelf(box) {
        if (!box.children.length) { return; }

        // 触屏设备保留浏览器原生横向滑动，不复制内容。
        var coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (coarsePointer || window.innerWidth <= 640) {
            box.classList.add('native-shelf');
            return;
        }

        var track = document.createElement('div');
        track.className = 'home-track';

        while (box.firstChild) {
            track.appendChild(box.firstChild);
        }

        var originals = Array.prototype.slice.call(track.children);
        originals.forEach(function (card) {
            var clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
        box.appendChild(track);

        var pos = 0;
        var target = 0;
        var paused = false;
        var manualUntil = 0;
        var gap = 18;

        function visibleCount() {
            return window.innerWidth < 820 ? 3 : 4;
        }

        function sizeCards() {
            var count = visibleCount();
            var cardWidth = (box.clientWidth - gap * (count - 1)) / count;
            var items = track.children;
            for (var j = 0; j < items.length; j++) {
                items[j].style.width = Math.max(150, cardWidth) + 'px';
            }
            pos = 0;
            target = 0;
            track.style.transform = 'translate3d(0,0,0)';
        }

        sizeCards();
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(sizeCards, 120);
        });

        box.addEventListener('mouseenter', function () {
            paused = true;
        });
        box.addEventListener('mouseleave', function () {
            paused = false;
        });

        box.addEventListener('wheel', function (e) {
            // 与最初版本一致：鼠标位于电影架时，普通滚轮直接控制横向电影浏览。
            e.preventDefault();
            var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            if (e.deltaMode === 1) { delta *= 16; }
            if (e.deltaMode === 2) { delta *= box.clientWidth; }
            target -= delta * 1.05;
            manualUntil = performance.now() + 900;
        }, { passive: false });

        function getCycleWidth() {
            var firstClone = track.children[originals.length];
            var firstOriginal = track.children[0];
            if (!firstClone || !firstOriginal) { return 0; }
            return firstClone.offsetLeft - firstOriginal.offsetLeft;
        }

        function step(now) {
            var cycle = getCycleWidth();
            if (cycle > 0) {
                if (!reduceMotion && !paused && now > manualUntil) {
                    target -= 0.32;
                }

                var diff = target - pos;
                while (diff < -cycle / 2) { diff += cycle; }
                while (diff > cycle / 2) { diff -= cycle; }
                pos += diff * 0.14;

                while (pos <= -cycle) {
                    pos += cycle;
                    target += cycle;
                }
                while (pos > 0) {
                    pos -= cycle;
                    target -= cycle;
                }

                track.style.transform = 'translate3d(' + pos + 'px,0,0)';
            }
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    // 非首页页面的返回按钮：优先返回真实上一页；直接打开页面则回首页。
    document.querySelectorAll('.page-back').forEach(function (button) {
        button.addEventListener('click', function () {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../index.html';
            }
        });
    });

    // 非必要动态效果只做轻量淡入。
    if (!reduceMotion && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('reveal-ready');
        var targets = document.querySelectorAll('.home-section, .category-grid, .detail-story');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        targets.forEach(function (el) { observer.observe(el); });
    }

    var backtop = document.createElement('button');
    backtop.id = 'backtop';
    backtop.type = 'button';
    backtop.setAttribute('aria-label', '返回顶部');
    backtop.textContent = '顶部';
    document.body.appendChild(backtop);

    backtop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    function updateBackTop() {
        var top = document.documentElement.scrollTop || document.body.scrollTop;
        backtop.style.display = top > 520 ? 'grid' : 'none';
    }

    window.addEventListener('scroll', updateBackTop, { passive: true });
    updateBackTop();
})();
