/*
 * Game8：最后防线
 *
 * 玩家：
 * 3 步兵
 * 2 投掷兵
 * 1 炮兵
 *
 * 战前拖拽部署到棋盘任意位置
 * 放置后不能移动
 * 坚持 12 回合
 *
 * 5~6 人存活：3 星
 * 3~4 人存活：2 星
 * 1~2 人存活：1 星
 * 0 人：失败
 */


/* =========================================================
   1. Game8 配置
   ========================================================= */

var game8 = {
    n: 10,
    m: 10,
    turns_limit: 12,

    objective: {
        type: 'defense',
        totalUnits: 6,
        threeStarMin: 5,
        twoStarMin: 3
    },

    pieces: []
};


/* =========================================================
   2. 敌军
   ========================================================= */

/* 步兵 */
game8.pieces.push({
    color: 'red',
    class: '步',
    img: IMG_RED_infantry,
    posx: 9.0,
    posy: 1.0,
    speed: MOVING_SPEED_standard,
    atkrange: ATK_RANGE_standard,
    atk: ATK_standard,
    lp: LP_standard
});

game8.pieces.push({
    color: 'red',
    class: '步',
    img: IMG_RED_infantry,
    posx: 9.0,
    posy: 3.8,
    speed: MOVING_SPEED_standard,
    atkrange: ATK_RANGE_standard,
    atk: ATK_standard,
    lp: LP_standard
});

game8.pieces.push({
    color: 'red',
    class: '步',
    img: IMG_RED_infantry,
    posx: 9.0,
    posy: 6.2,
    speed: MOVING_SPEED_standard,
    atkrange: ATK_RANGE_standard,
    atk: ATK_standard,
    lp: LP_standard
});

game8.pieces.push({
    color: 'red',
    class: '步',
    img: IMG_RED_infantry,
    posx: 9.0,
    posy: 9.0,
    speed: MOVING_SPEED_standard,
    atkrange: ATK_RANGE_standard,
    atk: ATK_standard,
    lp: LP_standard
});


/* 投掷兵 */
game8.pieces.push({
    color: 'red',
    class: '掷',
    img: IMG_RED_grenadier,
    posx: 8.2,
    posy: 4.8,
    speed: MOVING_SPEED_slow,
    atkrange: ATK_RANGE_standard,
    atk: ATK_medium_high,
    lp: LP_high
});


/* 炮兵 */
game8.pieces.push({
    color: 'red',
    class: '炮',
    img: IMG_RED_artillery,
    posx: 9.0,
    posy: 7.4,
    speed: MOVING_SPEED_slow,
    atkrange: ATK_RANGE_far,
    atk: ATK_medium_high,
    lp: LP_standard
});


/* =========================================================
   3. 当前关卡
   ========================================================= */

var CURRENT_LEVEL_ID = 8;
var CURRENT_GAME = game8;


/* =========================================================
   4. Game8 状态
   ========================================================= */

var game8Started = false;
var placedCount = 0;
var usedSlots = {};


/* =========================================================
   5. 蓝方兵种配置
   ========================================================= */

var deployDefs = {

    '步': {
        img: IMG_BLUE_infantry,
        speed: MOVING_SPEED_standard,
        range: ATK_RANGE_standard,
        atk: ATK_standard,
        lp: LP_standard
    },

    '掷': {
        img: IMG_BLUE_grenadier,
        speed: MOVING_SPEED_slow,
        range: ATK_RANGE_standard,
        atk: ATK_medium_high,
        lp: LP_high
    },

    '炮': {
        img: IMG_BLUE_artillery,
        speed: MOVING_SPEED_slow,
        range: ATK_RANGE_far,
        atk: ATK_medium_high,
        lp: LP_standard
    }

};


/* =========================================================
   6. 更新左侧部署面板
   ========================================================= */

function game8UpdatePanel() {

    var status =
        document.getElementById('deployment-status');

    var hud =
        document.getElementById('defense-hud');

    var button =
        document.getElementById('button');

    var cards =
        document.querySelectorAll('.deploy-card');


    /* 已部署数量 */

    if (status) {
        status.textContent =
            '已部署 ' + placedCount + ' / 6';
    }


    /* 更新卡片状态 */

    for (var i = 0; i < cards.length; i++) {

        var card = cards[i];

        var key =
            card.dataset.unit +
            ':' +
            card.dataset.index;

        if (usedSlots[key]) {

            card.classList.add('used');

        } else {

            card.classList.remove('used');
        }
    }


    /* 没部署完 */

    if (placedCount < 6) {

        if (hud) {
            hud.textContent =
                '部署阶段 · 将 6 支部队拖入棋盘';
        }

        if (button) {

            button.disabled = true;

            button.textContent =
                '请先完成部署';
        }

        return;
    }


    /* 全部部署完 */

    if (hud) {
        hud.textContent =
            '部署完成 · 点击“开始防守”';
    }

    if (button) {

        button.disabled = false;

        button.textContent =
            '开始防守';
    }
}


/* =========================================================
   7. 创建蓝方棋子
   ========================================================= */

function game8CreateBlue(unitKey, x, y) {

    var def =
        deployDefs[unitKey];

    if (!def) {
        return false;
    }


    var piece =
        document.createElement('div');

    piece.className =
        'chess chess--blue';

    piece.id =
        'piece-' + piece_cnt;


    /*
     * 直接使用 main.js 原来的棋子图片生成函数
     */

    piece.innerHTML =
        getHtmlForPiece({
            img: def.img,
            class: unitKey
        });


    boardContainer.appendChild(piece);


    /*
     * 加入 armys
     */

    armys.push({

        id: piece.id,

        color: 'blue',

        posx: x,
        posy: y,

        speed: def.speed,

        targetx: x,
        targety: y,

        atkrange: def.range,

        atk: def.atk,

        lp: def.lp,
        lpMax: def.lp,

        disabled: false,

        cls: unitKey,

        img: def.img,

        escaped: false,

        fixedDeployment: true
    });


    /*
     * 使用 main.js 的原定位方式
     */

    movePieceTo(
        piece.id,
        x,
        y
    );


    piece_cnt++;

    return true;
}


/* =========================================================
   8. 允许拖拽进入棋盘
   ========================================================= */

boardContainer.addEventListener(
    'dragover',
    function (e) {

        if (game8Started) {
            return;
        }

        e.preventDefault();

        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }
);


/* =========================================================
   9. 松开鼠标：部署单位
   ========================================================= */

function game8Drop(e) {

    if (game8Started) {
        return;
    }

    e.preventDefault();


    /*
     * 读取拖拽卡片传来的数据
     */

    var key =
        e.dataTransfer.getData(
            'text/plain'
        );

    if (!key) {
        return;
    }


    /*
     * 这张卡已经使用过
     */

    if (usedSlots[key]) {
        return;
    }


    var parts =
        key.split(':');

    var unitKey =
        parts[0];


    /*
     * 获取棋盘位置
     */

    var rect =
        boardContainer.getBoundingClientRect();


    var px =
        e.clientX -
        rect.left;

    var py =
        e.clientY -
        rect.top;


    /*
     * 限制鼠标位置在棋盘内部
     */

    px =
        Math.max(
            0,
            Math.min(
                rect.width,
                px
            )
        );

    py =
        Math.max(
            0,
            Math.min(
                rect.height,
                py
            )
        );


    /*
     * 连续坐标
     *
     * 不调用 getPosByCell()
     *
     * 所以可以放在任意位置，
     * 不会强制吸附到整数格。
     */

    var x =
        px / rect.width * 10 - 0.5;

    var y =
        py / rect.height * 10 - 0.5;


    /*
     * 给棋子留一点边缘
     */

    x =
        Math.max(
            0.15,
            Math.min(
                8.85,
                x
            )
        );

    y =
        Math.max(
            0.15,
            Math.min(
                8.85,
                y
            )
        );


    /*
     * 防止单位重叠
     */

    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var u = armys[i];

        if (
            u.color === 'blue' &&
            !u.disabled
        ) {

            if (
                calcdis(
                    u,
                    {
                        posx: x,
                        posy: y
                    }
                ) < 0.65
            ) {

                alert(
                    '这个位置太拥挤，请换一个位置。'
                );

                return;
            }
        }
    }


    /*
     * 创建单位
     */

    var success =
        game8CreateBlue(
            unitKey,
            x,
            y
        );


    if (!success) {
        return;
    }


    /*
     * 标记卡片已经使用
     */

    usedSlots[key] = true;

    placedCount++;


    /*
     * 自动选中新部署的单位
     *
     * 这样可以直接显示和其他 Game 一样的攻击范围。
     */

    var newPiece =
        armys[armys.length - 1];

    if (
        typeof selectOnly === 'function' &&
        newPiece
    ) {

        selectOnly(newPiece);
    }


    game8UpdatePanel();
}


boardContainer.addEventListener(
    'drop',
    game8Drop
);


/* =========================================================
   10. 左侧兵种卡片
   ========================================================= */

var deployCards =
    document.querySelectorAll(
        '.deploy-card'
    );


for (
    var cardIndex = 0;
    cardIndex < deployCards.length;
    cardIndex++
) {

    (function (card) {

        card.addEventListener(
            'dragstart',
            function (e) {

                var key =
                    card.dataset.unit +
                    ':' +
                    card.dataset.index;


                /*
                 * 已经放置或者已经开战
                 */

                if (
                    usedSlots[key] ||
                    game8Started
                ) {

                    e.preventDefault();

                    return;
                }


                /*
                 * 保存单位类型
                 */

                e.dataTransfer.setData(
                    'text/plain',
                    key
                );

                e.dataTransfer.effectAllowed =
                    'move';


                /*
                 * 设置小型拖拽图像
                 *
                 * 不再把整个长方形卡片
                 * 显示成拖拽图标。
                 */

                var sourceImg =
                    card.querySelector(
                        'img'
                    );

                if (sourceImg) {

                    var ghost =
                        document.createElement(
                            'img'
                        );

                    ghost.src =
                        sourceImg.src;

                    ghost.style.width =
                        '32px';

                    ghost.style.height =
                        '32px';

                    ghost.style.position =
                        'fixed';

                    ghost.style.left =
                        '-1000px';

                    ghost.style.top =
                        '-1000px';

                    ghost.style.pointerEvents =
                        'none';

                    document.body.appendChild(
                        ghost
                    );

                    e.dataTransfer.setDragImage(
                        ghost,
                        16,
                        16
                    );


                    setTimeout(
                        function () {

                            if (
                                ghost.parentNode
                            ) {

                                ghost.parentNode
                                    .removeChild(
                                        ghost
                                    );
                            }

                        },
                        100
                    );
                }

            }
        );

    })(deployCards[cardIndex]);
}


/* =========================================================
   11. 战斗开始后禁止蓝方移动
   ========================================================= */

/*
 * 这里采用一个非常简单的方式：
 *
 * 当 Game8 开战以后，
 * main.js 的鼠标点击仍然会产生，
 * 但是我们把蓝兵的 targetx / targety
 * 每回合都固定回自己的当前位置。
 *
 * 这样不会破坏：
 *
 * - 选择
 * - 攻击范围
 * - main.js
 *
 * 同时可以确保蓝兵不会被移动。
 */


/*
 * 保存部署位置
 */

function game8FreezeBlueUnits() {

    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var u = armys[i];

        if (
            u.color === 'blue' &&
            u.fixedDeployment
        ) {

            u.targetx =
                u.posx;

            u.targety =
                u.posy;
        }
    }
}


/*
 * 开战后定期检查
 */

setInterval(
    function () {

        if (!game8Started) {
            return;
        }

        game8FreezeBlueUnits();

    },
    50
);


/* =========================================================
   12. Game8 敌军 AI
   ========================================================= */

window.applyEnemyAI =
    function () {

        var blues =
            armys.filter(
                function (u) {

                    return (
                        u.color === 'blue' &&
                        !u.disabled
                    );
                }
            );


        if (blues.length === 0) {
            return;
        }


        armys.forEach(
            function (u) {

                if (
                    u.color !== 'red' ||
                    u.disabled
                ) {
                    return;
                }


                /*
                 * 找最近的蓝方
                 */

                var best = null;

                var bestDistance =
                    Infinity;


                blues.forEach(
                    function (b) {

                        var d =
                            calcdis(
                                u,
                                b
                            );

                        if (
                            d <
                            bestDistance
                        ) {

                            bestDistance =
                                d;

                            best = b;
                        }
                    }
                );


                if (!best) {
                    return;
                }


                /*
                 * 炮兵：
                 * 不直接冲上去
                 */

                if (u.cls === '炮') {

                    var dx =
                        best.posx -
                        u.posx;

                    var dy =
                        best.posy -
                        u.posy;

                    var len =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );


                    if (
                        len <
                        0.0001
                    ) {

                        len = 1;
                    }


                    var stop =
                        Math.max(
                            0.8,
                            Number(
                                ATK_RANGE_far
                            ) - 0.35
                        );


                    u.targetx =
                        Math.max(
                            0,
                            Math.min(
                                9,
                                best.posx -
                                dx / len *
                                stop
                            )
                        );


                    u.targety =
                        Math.max(
                            0,
                            Math.min(
                                9,
                                best.posy -
                                dy / len *
                                stop
                            )
                        );

                } else {

                    /*
                     * 步兵、投掷兵：
                     * 向最近蓝兵推进
                     */

                    u.targetx =
                        best.posx;

                    u.targety =
                        best.posy;
                }

            }
        );


        renderOrderArrows();
    };


/* =========================================================
   13. 开始防守按钮
   ========================================================= */

document
    .getElementById('button')
    .addEventListener(
        'click',
        function (e) {

            /*
             * 如果已经开战：
             *
             * 什么都不做
             *
             * 让 main.js 正常执行 Next Turn
             */

            if (game8Started) {
                return;
            }


            /*
             * 没有部署完
             */

            if (placedCount < 6) {

                e.preventDefault();

                e.stopImmediatePropagation();

                alert(
                    '请先部署 3 个步兵、2 个投掷兵和 1 个炮兵。'
                );

                return;
            }


            /*
             * 进入战斗
             */

            game8Started = true;


            /*
             * 固定所有蓝方目标
             */

            game8FreezeBlueUnits();


            /*
             * 禁用部署卡
             */

            var cards =
                document.querySelectorAll(
                    '.deploy-card'
                );

            for (
                var i = 0;
                i < cards.length;
                i++
            ) {

                cards[i].draggable =
                    false;
            }


            /*
             * 更新文字
             */

            var tip =
                document.getElementById(
                    'deployment-tip'
                );

            if (tip) {

                tip.innerHTML =
                    '防守开始！<br>' +
                    '蓝方单位已经固定。';
            }


            var hud =
                document.getElementById(
                    'defense-hud'
                );

            if (hud) {

                hud.textContent =
                    '防守开始 · 坚守 12 回合';
            }


            /*
             * 清除选中
             *
             * 避免刚点击“开始防守”时出现
             * 奇怪的移动预览。
             */

            if (
                typeof clearSelection ===
                'function'
            ) {

                clearSelection();
            }


            /*
             * 非常重要：
             *
             * 阻止这一次点击继续传给 main.js。
             *
             * 否则会直接执行第一回合。
             */

            e.preventDefault();

            e.stopImmediatePropagation();

        },
        true
    );


/* =========================================================
   14. 最关键：初始化 Game8
   ========================================================= */

/*
 * 不读自动存档
 * 不创建弹窗
 * 不调用 showLevelIntro
 * 不重复初始化
 *
 * 只初始化一次。
 */

loadGame(game8);


/*
 * 玩家需要重新部署
 */

game8Started = false;

placedCount = 0;

usedSlots = {};


/*
 * 更新部署界面
 */

game8UpdatePanel();


/*
 * 刷新存档下拉框
 */

if (
    typeof refreshSlotSelect ===
    'function'
) {

    refreshSlotSelect();
}


/*
 * Game8 失败提示
 */

if (
    typeof loseTips !==
    'undefined'
) {

    loseTips.push(
        'The final line is yours. Protect your position and hold the line.'
    );
}