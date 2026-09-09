// 电影欣赏网 全站脚本：首页 banner 轮播 + 栏目海报自动滚动 + 返回顶部按钮
window.onload = function () {

    // 首页 banner 轮播：每 3 秒切换一张
    var slides = document.getElementById("slides");
    if (slides) {
        var imgs = slides.getElementsByTagName("img");
        var current = 0;
        setInterval(function () {
            imgs[current].className = "";
            current = (current + 1) % imgs.length;
            imgs[current].className = "show";
        }, 3000);
    }

    // 首页各栏目：海报横向自动滚动循环
    // 鼠标悬停在某个栏目上时，暂停该栏目的滚动；
    // 滚轮在栏目上滚动时，海报平滑地快速滚动
    var rows = document.querySelectorAll(".scroll");
    for (var i = 0; i < rows.length; i++) {
        initRow(rows[i]);
    }

    function initRow(box) {
        var track = box.querySelector(".track");
        if (!track) { return; }
        track.innerHTML += track.innerHTML;   //复制一份海报，向左滚完即可无缝接上
        var pos = 0;         //当前位置（负值向左）
        var target = 0;      //目标位置：滚轮改变它，画面平滑地追上去
        var paused = false;  //是否暂停

        box.onmouseenter = function () { paused = true; };
        box.onmouseleave = function () { paused = false; };

        //鼠标滚轮：只改变目标位置，滚动交给动画平滑完成；同时阻止页面整体滚动
        box.addEventListener("wheel", function (e) {
            e.preventDefault();
            var delta = e.deltaY || e.deltaX;
            if (e.deltaMode === 1) { delta *= 16; }   //按行滚动的设备换算成像素
            target -= delta * 1.2;
        }, { passive: false });

        (function step() {
            var half = track.scrollWidth / 2;   //一份内容的宽度，即循环一周的长度
            if (!paused) { target -= 0.6; }     //未悬停时慢速自动滚动
            //沿最短路径向目标位置缓动，避免生硬的瞬移
            var diff = target - pos;
            if (diff < -half / 2) { diff += half; }
            if (diff > half / 2) { diff -= half; }
            pos += diff * 0.12;
            //把位置和目标一起限制在一个循环周期内，保证首尾无缝衔接
            while (pos <= -half) { pos += half; target += half; }
            while (pos > 0) { pos -= half; target -= half; }
            track.style.transform = "translateX(" + pos + "px)";
            requestAnimationFrame(step);
        })();
    }

    // 返回顶部按钮：向下滚动超过约一屏后出现
    var backtop = document.createElement("a");
    backtop.id = "backtop";
    backtop.href = "javascript:void(0)";
    backtop.innerHTML = "返回<br>顶部";
    document.body.appendChild(backtop);
    backtop.onclick = function () {
        window.scrollTo(0, 0);
    };
    window.onscroll = function () {
        var top = document.documentElement.scrollTop || document.body.scrollTop;
        if (top > 400) {
            backtop.style.display = "block";
        } else {
            backtop.style.display = "none";
        }
    };
};
