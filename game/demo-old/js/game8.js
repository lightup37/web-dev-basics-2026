/*
 * ============================================================
 * Game8：The Last Defensive Line
 * 最后防线
 *
 * 我方：
 *     5 门炮兵
 *
 * 敌方：
 *     3 步兵
 *     1 投掷兵
 *     3 炮兵
 *
 * 核心：
 *     炮兵部署位置 + 敌军炮兵火力压制 + 红线防守
 *
 * ============================================================
 */


/* ============================================================
 * Game8 关卡数据
 * ============================================================ */

var game8 = {

    n: 10,

    m: 10,

    turns_limit: 12,

    objective: {

        type: 'line_defense',

        breakthrough_limit: 5
    },

    pieces: new Array()
};


/* ============================================================
 * 敌军：
 *
 * 3 步兵
 * 1 投掷兵
 * 3 炮兵
 *
 * 共 7 个敌军
 * ============================================================ */


/* ==========================
 * 步兵 1
 * ========================== */

game8.pieces.push({

    color: 'red',

    class: '步',

    img: IMG_RED_infantry,

    posx: 9.2,

    posy: 1.0,

    speed: MOVING_SPEED_standard,

    atkrange: ATK_RANGE_standard,

    atk: ATK_standard,

    lp: LP_standard
});


/* ==========================
 * 步兵 2
 * ========================== */

game8.pieces.push({

    color: 'red',

    class: '步',

    img: IMG_RED_infantry,

    posx: 9.0,

    posy: 5.0,

    speed: MOVING_SPEED_standard,

    atkrange: ATK_RANGE_standard,

    atk: ATK_standard,

    lp: LP_standard
});


/* ==========================
 * 步兵 3
 * ========================== */

game8.pieces.push({

    color: 'red',

    class: '步',

    img: IMG_RED_infantry,

    posx: 9.2,

    posy: 8.4,

    speed: MOVING_SPEED_standard,

    atkrange: ATK_RANGE_standard,

    atk: ATK_standard,

    lp: LP_standard
});


/* ==========================
 * 投掷兵
 * ========================== */

game8.pieces.push({

    color: 'red',

    class: '掷',

    img: IMG_RED_grenadier,

    posx: 8.2,

    posy: 5.0,

    speed: MOVING_SPEED_slow,

    atkrange: ATK_RANGE_standard,

    atk: ATK_medium_high,

    lp: LP_high
});


/* ============================================================
 * 敌军三门炮
 *
 * 适当增加射程，
 * 保证可以威胁靠近红线的我方炮兵。
 * ============================================================ */

var GAME8_ENEMY_ARTILLERY_RANGE =
    Math.max(
        Number(ATK_RANGE_far),
        5.0
    );


/* 上炮 */

game8.pieces.push({

    color: 'red',

    class: '炮',

    img: IMG_RED_artillery,

    posx: 7.0,

    posy: 2.0,

    speed: MOVING_SPEED_slow,

    atkrange:
        GAME8_ENEMY_ARTILLERY_RANGE,

    atk: ATK_medium_high,

    lp: LP_standard
});


/* 中炮 */

game8.pieces.push({

    color: 'red',

    class: '炮',

    img: IMG_RED_artillery,

    posx: 7.4,

    posy: 5.0,

    speed: MOVING_SPEED_slow,

    atkrange:
        GAME8_ENEMY_ARTILLERY_RANGE,

    atk: ATK_medium_high,

    lp: LP_standard
});


/* 下炮 */

game8.pieces.push({

    color: 'red',

    class: '炮',

    img: IMG_RED_artillery,

    posx: 7.0,

    posy: 8.0,

    speed: MOVING_SPEED_slow,

    atkrange:
        GAME8_ENEMY_ARTILLERY_RANGE,

    atk: ATK_medium_high,

    lp: LP_standard
});


/* ============================================================
 * 全局
 * ============================================================ */

var CURRENT_LEVEL_ID = 8;

var CURRENT_GAME = game8;


/* 红线 */

var GAME8_LINE_X = 4.5;


/* 游戏是否开始 */

var game8Started = false;


/* 突破数 */

var game8BreakthroughCount = 0;


/* 游戏是否已经结束 */

var game8Finished = false;


/* ============================================================
 * 我方 5 门炮
 * ============================================================ */

var GAME8_ARTILLERY_COUNT = 5;


var game8PlacedArtillery = [

    false,

    false,

    false,

    false,

    false
];


/* 当前正在部署的炮 */

var game8DraggingIndex = -1;


/* 拖拽预览 */

var game8DragPiece = null;

var game8DragRange = null;


/* ============================================================
 * 初始化
 * ============================================================ */

function game8Init() {

    game8Started = false;

    game8Finished = false;

    game8BreakthroughCount = 0;

    game8DraggingIndex = -1;

    game8DragPiece = null;

    game8DragRange = null;


    game8PlacedArtillery = [

        false,

        false,

        false,

        false,

        false
    ];
}


/* ============================================================
 * 获取棋盘 cell
 * ============================================================ */

function game8GetCell(row, col) {

    return document.querySelector(

        '#board .cell[data-row="' +
        row +
        '"][data-col="' +
        col +
        '"]'
    );
}


/* ============================================================
 * 鼠标 -> 棋盘连续坐标
 * ============================================================ */

function game8MouseToBoardPosition(e) {

    var rect =
        boardContainer.getBoundingClientRect();


    var x = (

        e.clientX -
        rect.left -
        offset

    ) / distance;


    var y = (

        e.clientY -
        rect.top -
        offset

    ) / distance;


    return {

        x: x,

        y: y
    };
}


/* ============================================================
 * 创建拖拽中的真实炮兵
 * ============================================================ */

function game8CreateDragPiece() {

    if (game8DragPiece) {

        return;
    }


    game8DragPiece =
        document.createElement(
            'div'
        );


    game8DragPiece.className =
        'chess chess--blue game8-drag-piece';


    game8DragPiece.innerHTML =
        getHtmlForPiece({

            img:
                IMG_BLUE_artillery,

            class:
                '炮'
        });


    game8DragPiece.style.pointerEvents =
        'none';


    game8DragPiece.style.opacity =
        '0.82';


    game8DragPiece.style.zIndex =
        '200';


    boardContainer.appendChild(
        game8DragPiece
    );
}


/* ============================================================
 * 创建拖拽攻击范围
 * ============================================================ */

function game8CreateDragRange() {

    if (game8DragRange) {

        return;
    }


    game8DragRange =
        document.createElement(
            'div'
        );


    game8DragRange.id =
        'game8-drag-range';


    game8DragRange.className =
        'range-circle range-circle--ally';


    game8DragRange.style.position =
        'absolute';


    game8DragRange.style.pointerEvents =
        'none';


    game8DragRange.style.zIndex =
        '3';


    game8DragRange.style.display =
        'none';


    boardContainer.appendChild(
        game8DragRange
    );
}


/* ============================================================
 * 炮兵位置是否合法
 * ============================================================ */

function game8IsValidPosition(
    x,
    y
) {

    if (x < 0.1) {

        return false;
    }


    if (y < 0.1) {

        return false;
    }


    if (y > 8.9) {

        return false;
    }


    if (
        x >
        GAME8_LINE_X - 0.35
    ) {

        return false;
    }


    return true;
}


/* ============================================================
 * 判断炮兵是否和其他单位重叠
 * ============================================================ */

function game8IsOccupied(
    x,
    y
) {

    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var p =
            armys[i];


        if (!p) {

            continue;
        }


        if (
            p.color !== 'blue'
        ) {

            continue;
        }


        if (
            p.cls !== '炮'
        ) {

            continue;
        }


        if (
            p.disabled
        ) {

            continue;
        }


        var dx =
            p.posx - x;


        var dy =
            p.posy - y;


        var d =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            d < 0.65
        ) {

            return true;
        }
    }


    return false;
}


/* ============================================================
 * 实时更新炮兵预览
 * ============================================================ */

function game8UpdateDragPiece(
    x,
    y,
    valid
) {

    if (!game8DragPiece) {

        return;
    }


    var left =
        offset +
        distance * x;


    var top =
        offset +
        distance * y;


    game8DragPiece.style.left =
        left + 'px';


    game8DragPiece.style.top =
        top + 'px';


    if (valid) {

        game8DragPiece.style.opacity =
            '0.82';

        game8DragPiece.style.filter =
            'none';

    } else {

        game8DragPiece.style.opacity =
            '0.35';

        game8DragPiece.style.filter =
            'grayscale(100%)';
    }
}


/* ============================================================
 * 实时更新攻击范围
 * ============================================================ */

function game8UpdateDragRange(
    x,
    y,
    valid
) {

    if (!game8DragRange) {

        return;
    }


    var r =
        Number(ATK_RANGE_far) *
        distance;


    var cx =
        offset +
        distance * x;


    var cy =
        offset +
        distance * y;


    game8DragRange.style.left =
        (cx - r) + 'px';


    game8DragRange.style.top =
        (cy - r) + 'px';


    game8DragRange.style.width =
        (2 * r) + 'px';


    game8DragRange.style.height =
        (2 * r) + 'px';


    game8DragRange.style.display =
        'block';


    game8DragRange.style.opacity =
        valid
            ? '1'
            : '0.35';
}


/* ============================================================
 * 删除拖拽预览
 * ============================================================ */

function game8RemoveDragPreview() {

    if (game8DragPiece) {

        game8DragPiece.remove();

        game8DragPiece =
            null;
    }


    if (game8DragRange) {

        game8DragRange.remove();

        game8DragRange =
            null;
    }


    game8DraggingIndex =
        -1;
}


/* ============================================================
 * 更新部署栏
 * ============================================================ */

function game8UpdateDeploymentPanel() {

    var cards =
        document.querySelectorAll(
            '.deploy-card'
        );


    var count =
        0;


    for (
        var i = 0;
        i < cards.length;
        i++
    ) {

        var card =
            cards[i];


        var index =
            Number(
                card.dataset.index
            );


        if (
            game8PlacedArtillery[index]
        ) {

            card.classList.add(
                'game8-used'
            );


            card.setAttribute(
                'draggable',
                'false'
            );


            count++;

        } else {

            card.classList.remove(
                'game8-used'
            );


            card.setAttribute(
                'draggable',
                game8Started
                    ? 'false'
                    : 'true'
            );
        }
    }


    var status =
        document.getElementById(
            'deployment-status'
        );


    if (status) {

        status.innerText =
            '已部署炮兵：' +
            count +
            ' / ' +
            GAME8_ARTILLERY_COUNT;
    }


    var button =
        document.getElementById(
            'button'
        );


    if (!button) {

        return;
    }


    if (game8Started) {

        button.disabled =
            false;

        button.innerText =
            'Next Turn';

        return;
    }


    if (
        count ===
        GAME8_ARTILLERY_COUNT
    ) {

        button.disabled =
            false;

        button.innerText =
            '开始防守';


        var tip =
            document.getElementById(
                'deployment-tip'
            );


        if (tip) {

            tip.innerHTML =
                '5 门炮兵部署完毕。<br>' +
                '敌军重炮已经进入阵地。';
        }

    } else {

        button.disabled =
            true;

        button.innerText =
            '请部署全部炮兵（' +
            count +
            '/' +
            GAME8_ARTILLERY_COUNT +
            '）';
    }
}


/* ============================================================
 * 创建正式炮兵
 * ============================================================ */

function game8DeployArtillery(
    index,
    x,
    y
) {

    if (game8Started) {

        return false;
    }


    if (
        game8PlacedArtillery[index]
    ) {

        return false;
    }


    if (
        !game8IsValidPosition(
            x,
            y
        )
    ) {

        return false;
    }


    if (
        game8IsOccupied(
            x,
            y
        )
    ) {

        return false;
    }


    var piece =
        document.createElement(
            'div'
        );


    piece.className =
        'chess chess--blue game8-artillery';


    piece.id =
        'piece-' +
        piece_cnt;


    piece.innerHTML =
        getHtmlForPiece({

            img:
                IMG_BLUE_artillery,

            class:
                '炮'
        });


    boardContainer.appendChild(
        piece
    );


    armys.push({

        id:
            piece.id,

        color:
            'blue',

        posx:
            x,

        posy:
            y,

        speed:
            MOVING_SPEED_slow,

        targetx:
            x,

        targety:
            y,

        atkrange:
            ATK_RANGE_far,

        atk:
            ATK_medium_high,

        lp:
            LP_standard,

        lpMax:
            LP_standard,

        disabled:
            false,

        escaped:
            false,

        cls:
            '炮',

        img:
            IMG_BLUE_artillery,

        game8Index:
            index,

        /*
         * Game8 固定炮兵标记
         */
        game8FixedArtillery:
            true
    });


    movePieceTo(
        piece.id,
        x,
        y
    );


    piece_cnt++;


    game8PlacedArtillery[index] =
        true;


    game8UpdateDeploymentPanel();


    return true;
}


/* ============================================================
 * 绑定炮兵部署
 * ============================================================ */

function game8BindDeployment() {

    var cards =
        document.querySelectorAll(
            '.deploy-card'
        );


    if (!boardContainer) {

        return;
    }


    for (
        var i = 0;
        i < cards.length;
        i++
    ) {

        (function(card) {

            card.addEventListener(
                'pointerdown',
                function(e) {

                    if (
                        game8Started
                    ) {

                        return;
                    }


                    if (
                        e.button !== 0
                    ) {

                        return;
                    }


                    var index =
                        Number(
                            card.dataset.index
                        );


                    if (
                        game8PlacedArtillery[
                            index
                        ]
                    ) {

                        return;
                    }


                    e.preventDefault();


                    game8DraggingIndex =
                        index;


                    game8CreateDragPiece();

                    game8CreateDragRange();


                    var pos =
                        game8MouseToBoardPosition(
                            e
                        );


                    var valid =
                        game8IsValidPosition(
                            pos.x,
                            pos.y
                        );


                    if (
                        valid &&
                        game8IsOccupied(
                            pos.x,
                            pos.y
                        )
                    ) {

                        valid =
                            false;
                    }


                    game8UpdateDragPiece(
                        pos.x,
                        pos.y,
                        valid
                    );


                    game8UpdateDragRange(
                        pos.x,
                        pos.y,
                        valid
                    );


                    try {

                        card.setPointerCapture(
                            e.pointerId
                        );

                    } catch (err) {
                    }


                    card.classList.add(
                        'game8-dragging'
                    );
                }
            );


            card.addEventListener(
                'pointerup',
                function(e) {

                    if (
                        game8DraggingIndex < 0
                    ) {

                        return;
                    }


                    e.preventDefault();


                    var pos =
                        game8MouseToBoardPosition(
                            e
                        );


                    var valid =
                        game8IsValidPosition(
                            pos.x,
                            pos.y
                        );


                    if (
                        valid &&
                        game8IsOccupied(
                            pos.x,
                            pos.y
                        )
                    ) {

                        valid =
                            false;
                    }


                    if (valid) {

                        game8DeployArtillery(
                            game8DraggingIndex,
                            pos.x,
                            pos.y
                        );
                    }


                    card.classList.remove(
                        'game8-dragging'
                    );


                    game8RemoveDragPreview();
                }
            );


            card.addEventListener(
                'pointercancel',
                function() {

                    card.classList.remove(
                        'game8-dragging'
                    );


                    game8RemoveDragPreview();
                }
            );

        })(cards[i]);
    }


    document.addEventListener(
        'pointermove',
        function(e) {

            if (
                game8DraggingIndex < 0
            ) {

                return;
            }


            if (
                game8Started
            ) {

                return;
            }


            e.preventDefault();


            var pos =
                game8MouseToBoardPosition(
                    e
                );


            var valid =
                game8IsValidPosition(
                    pos.x,
                    pos.y
                );


            if (
                valid &&
                game8IsOccupied(
                    pos.x,
                    pos.y
                )
            ) {

                valid =
                    false;
            }


            game8UpdateDragPiece(
                pos.x,
                pos.y,
                valid
            );


            game8UpdateDragRange(
                pos.x,
                pos.y,
                valid
            );
        },
        {
            passive: false
        }
    );


    document.addEventListener(
        'pointerup',
        function(e) {

            if (
                game8DraggingIndex < 0
            ) {

                return;
            }


            if (
                game8Started
            ) {

                game8RemoveDragPreview();

                return;
            }


            var pos =
                game8MouseToBoardPosition(
                    e
                );


            var valid =
                game8IsValidPosition(
                    pos.x,
                    pos.y
                );


            if (
                valid &&
                game8IsOccupied(
                    pos.x,
                    pos.y
                )
            ) {

                valid =
                    false;
            }


            if (valid) {

                game8DeployArtillery(
                    game8DraggingIndex,
                    pos.x,
                    pos.y
                );
            }


            game8RemoveDragPreview();


            document
                .querySelectorAll(
                    '.deploy-card'
                )
                .forEach(
                    function(card) {

                        card.classList.remove(
                            'game8-dragging'
                        );
                    }
                );
        }
    );
}


/* ============================================================
 * 炮兵火力
 * ============================================================ */

function game8ArtilleryThreat(
    x,
    y
) {

    var threat =
        0;


    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var p =
            armys[i];


        if (!p) {

            continue;
        }


        if (
            p.color !== 'blue'
        ) {

            continue;
        }


        if (
            p.cls !== '炮'
        ) {

            continue;
        }


        if (
            p.disabled
        ) {

            continue;
        }


        var dx =
            p.posx -
            x;


        var dy =
            p.posy -
            y;


        var d2 =
            dx * dx +
            dy * dy;


        var range =
            Number(
                p.atkrange
            );


        if (
            d2 >
            range * range
        ) {

            continue;
        }


        threat +=
            1 /
            (
                1 +
                d2
            );
    }


    return threat;
}


/* ============================================================
 * 红线火力
 * ============================================================ */

function game8LineThreat(y) {

    return game8ArtilleryThreat(
        GAME8_LINE_X,
        y
    );
}


/* ============================================================
 * 寻找火力较弱突破点
 * ============================================================ */

function game8FindWeakPoint() {

    var bestY =
        0;


    var bestThreat =
        Infinity;


    for (
        var y = 0;
        y <= 9;
        y += 0.25
    ) {

        var threat =
            game8LineThreat(
                y
            );


        if (
            threat <
            bestThreat
        ) {

            bestThreat =
                threat;

            bestY =
                y;
        }
    }


    return bestY;
}


/* ============================================================
 * 敌军目标位置
 * ============================================================ */

function game8ChooseTargetY(
    enemy,
    index
) {

    var weakY =
        game8FindWeakPoint();


    var candidates;


    if (
        enemy.cls === '步'
    ) {

        candidates = [

            weakY,

            weakY - 0.7,

            weakY + 0.7,

            weakY - 1.4,

            weakY + 1.4,

            enemy.posy
        ];

    } else if (
        enemy.cls === '掷'
    ) {

        candidates = [

            4.0,

            5.0,

            6.0,

            weakY,

            enemy.posy
        ];

    } else {

        candidates = [

            enemy.posy,

            weakY,

            weakY - 1.0,

            weakY + 1.0
        ];
    }


    var bestY =
        enemy.posy;


    var bestScore =
        Infinity;


    for (
        var i = 0;
        i < candidates.length;
        i++
    ) {

        var y =
            candidates[i];


        if (y < 0) {

            y = 0;
        }


        if (y > 9) {

            y = 9;
        }


        var threat =
            game8LineThreat(
                y
            );


        var movementCost =
            Math.abs(
                y -
                enemy.posy
            ) *
            0.08;


        var score =
            threat +
            movementCost;


        if (
            score <
            bestScore
        ) {

            bestScore =
                score;

            bestY =
                y;
        }
    }


    return bestY;
}


/* ============================================================
 * 敌军 AI
 *
 * 保留原来的敌军 AI。
 *
 * 唯一增加：
 * 战斗开始后，强制我方固定炮兵：
 *
 *     speed = 0
 *     targetx = 当前 x
 *     targety = 当前 y
 *
 * ============================================================ */

window.applyEnemyAI =
function() {

    if (
        typeof CURRENT_LEVEL_ID !==
        'undefined' &&
        CURRENT_LEVEL_ID !== 8
    ) {

        return;
    }


    var index =
        0;


    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var enemy =
            armys[i];


        if (!enemy) {

            continue;
        }


        if (
            enemy.color !== 'red'
        ) {

            continue;
        }


        if (
            enemy.disabled
        ) {

            continue;
        }


        /*
         * 敌方炮兵
         *
         * 保持后方阵地
         */
        if (
            enemy.cls === '炮'
        ) {

            if (
                enemy.posy < 3.5
            ) {

                enemy.targetx =
                    7.0;

                enemy.targety =
                    2.0;

            } else if (
                enemy.posy > 6.5
            ) {

                enemy.targetx =
                    7.0;

                enemy.targety =
                    8.0;

            } else {

                enemy.targetx =
                    7.4;

                enemy.targety =
                    5.0;
            }


            index++;

            continue;
        }


        /*
         * 步兵 / 投掷兵
         *
         * 继续使用之前的“寻找弱点”逻辑。
         */
        enemy.targetx =
            GAME8_LINE_X;


        enemy.targety =
            game8ChooseTargetY(
                enemy,
                index
            );


        index++;
    }


    /*
     * ========================================================
     * 本次修改的核心：
     *
     * 战斗中锁定我方炮兵。
     *
     * 注意：
     * 不阻止鼠标点击。
     * 不阻止 main.js。
     * 只是让炮兵速度为 0。
     * ========================================================
     */

    for (
        var j = 0;
        j < armys.length;
        j++
    ) {

        var blue =
            armys[j];


        if (
            !blue
        ) {

            continue;
        }


        if (
            blue.color !== 'blue'
        ) {

            continue;
        }


        if (
            blue.cls !== '炮'
        ) {

            continue;
        }


        if (
            blue.disabled
        ) {

            continue;
        }


        blue.speed =
            0;


        blue.targetx =
            blue.posx;


        blue.targety =
            blue.posy;
    }


    if (
        typeof renderOrderArrows ===
        'function'
    ) {

        renderOrderArrows();
    }
};


/* ============================================================
 * 处理敌军突破
 * ============================================================ */

window.processLineBreakthroughs =
function() {

    if (
        typeof CURRENT_LEVEL_ID !==
        'undefined' &&
        CURRENT_LEVEL_ID !== 8
    ) {

        return;
    }


    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var enemy =
            armys[i];


        if (!enemy) {

            continue;
        }


        if (
            enemy.color !== 'red'
        ) {

            continue;
        }


        if (
            enemy.disabled
        ) {

            continue;
        }


        /*
         * 敌军越过红线
         */
        if (
            enemy.posx <=
            GAME8_LINE_X
        ) {

            if (
                enemy.escaped
            ) {

                continue;
            }


            enemy.escaped =
                true;


            enemy.disabled =
                true;


            game8BreakthroughCount++;


            /*
             * 从棋盘隐藏
             */
            var el =
                document.getElementById(
                    enemy.id
                );


            if (el) {

                el.style.display =
                    'none';
            }


            /*
             * 突破以后立即在旁边提示。
             */
            game8UpdateBreakthroughTip();
        }
    }


    game8UpdateHUD();
};


/* ============================================================
 * 突破提示
 *
 * 在棋盘左上角 HUD 中显示：
 *
 * ⚠ 已有 X 支敌军到达红线！
 * ============================================================ */

function game8UpdateBreakthroughTip() {

    var hud =
        document.getElementById(
            'defense-hud'
        );


    if (!hud) {

        return;
    }


    /*
     * 如果还没开始战斗
     */
    if (!game8Started) {

        return;
    }


    if (
        game8BreakthroughCount <= 0
    ) {

        hud.innerHTML =
            '最后防线 · 尚无敌军到达红线 · 剩余回合：' +
            remain_turns;

        return;
    }


    /*
     * 红色警告。
     */
    hud.innerHTML =
        '⚠ 已有 <b>' +
        game8BreakthroughCount +
        '</b> 支敌军到达红线！' +
        '<br>' +
        '剩余回合：' +
        remain_turns;
}


/* ============================================================
 * HUD
 * ============================================================ */

function game8UpdateHUD() {

    var hud =
        document.getElementById(
            'defense-hud'
        );


    if (!hud) {

        return;
    }


    if (!game8Started) {

        var count =
            game8PlacedArtillery.filter(
                function(x) {
                    return x;
                }
            ).length;


        hud.innerText =
            '部署阶段 · 炮兵：' +
            count +
            ' / 5';


        return;
    }


    game8UpdateBreakthroughTip();
}


/* ============================================================
 * 隐藏结果页面中的炮兵图片
 *
 * 胜利/失败后：
 *
 *     - 棋盘隐藏
 *     - 左侧部署栏隐藏
 *     - info-bar 隐藏
 *     - enemy-info 隐藏
 *
 * 因此结果页面不会出现炮兵图片。
 * ============================================================ */

function game8HideBattleUI() {

    if (boardContainer) {

        boardContainer.style.display =
            'none';
    }


    var panel =
        document.getElementById(
            'deployment-panel'
        );


    if (panel) {

        panel.style.display =
            'none';
    }


    var info =
        document.getElementById(
            'info-bar'
        );


    if (info) {

        info.style.display =
            'none';
    }


    var enemyInfo =
        document.getElementById(
            'enemy-info'
        );


    if (enemyInfo) {

        enemyInfo.style.display =
            'none';
    }


    /*
     * 红线一起隐藏。
     */
    var line =
        document.getElementById(
            'defense-line'
        );


    if (line) {

        line.style.display =
            'none';
    }


    /*
     * HUD 隐藏。
     */
    var hud =
        document.getElementById(
            'defense-hud'
        );


    if (hud) {

        hud.style.display =
            'none';
    }
}


/* ============================================================
 * Game8 胜利
 * ============================================================ */

function game8Win() {

    if (game8Finished) {

        return;
    }


    game8Finished =
        true;


    /*
     * 先隐藏所有战斗 UI。
     */
    game8HideBattleUI();


    if (buttonContainer) {

        buttonContainer.style.display =
            'none';
    }


    /*
     * 胜利页面
     */
    var win =
        document.getElementById(
            'win'
        );


    if (win) {

        win.style.display =
            'flex';

        win.style.flexDirection =
            'column';

        win.style.alignItems =
            'center';
    }


    /*
     * 星级只根据突破数。
     *
     * 0 -> 3星
     * 1~2 -> 2星
     * 3~4 -> 1星
     *
     * 5 -> 失败，不会进入这里
     */
    var star;


    if (
        game8BreakthroughCount === 0
    ) {

        star = 3;

    } else if (
        game8BreakthroughCount <= 2
    ) {

        star = 2;

    } else {

        star = 1;
    }


    var s1 =
        document.getElementById(
            '1star'
        );


    var s2 =
        document.getElementById(
            '2star'
        );


    var s3 =
        document.getElementById(
            '3star'
        );


    if (s1) {

        s1.style.display =
            'none';
    }


    if (s2) {

        s2.style.display =
            'none';
    }


    if (s3) {

        s3.style.display =
            'none';
    }


    if (
        star === 3 &&
        s3
    ) {

        s3.style.display =
            '';

    } else if (
        star === 2 &&
        s2
    ) {

        s2.style.display =
            '';

    } else if (
        star === 1 &&
        s1
    ) {

        s1.style.display =
            '';
    }


    var detail =
        document.getElementById(
            'win-detail'
        );


    if (detail) {

        detail.innerText =
            '防线守住了！敌军共有 ' +
            game8BreakthroughCount +
            ' 支到达红线。';
    }


    var next =
        document.getElementById(
            'button-next-game'
        );


    if (next) {

        next.style.display =
            '';
    }
}


/* ============================================================
 * Game8 失败
 * ============================================================ */

function game8Lose() {

    if (game8Finished) {

        return;
    }


    game8Finished =
        true;


    /*
     * 隐藏所有战斗 UI。
     *
     * 因此失败页面不会出现炮兵图片。
     */
    game8HideBattleUI();


    if (buttonContainer) {

        buttonContainer.style.display =
            'none';
    }


    var lose =
        document.getElementById(
            'lose'
        );


    if (lose) {

        lose.style.display =
            'flex';

        lose.style.flexDirection =
            'column';

        lose.style.alignItems =
            'center';
    }


    var tips =
        document.getElementById(
            'loseTips'
        );


    if (tips) {

        tips.innerText =
            '敌军突破最后防线，阵地失守。' +
            '\n' +
            '共有 ' +
            game8BreakthroughCount +
            ' 支敌军到达红线。';
    }


    var replay =
        document.getElementById(
            'button-replay'
        );


    if (replay) {

        replay.style.display =
            '';
    }
}


/* ============================================================
 * Game8 胜负判断
 * ============================================================ */

window.checkWinState =
function() {

    if (game8Finished) {

        return;
    }


    /*
     * 统计突破
     */
    if (
        typeof processLineBreakthroughs ===
        'function'
    ) {

        processLineBreakthroughs();
    }


    /*
     * 每回合 -1
     */
    remain_turns--;


    /*
     * 存活炮兵
     */
    var bluec =
        0;


    for (
        var i = 0;
        i < armys.length;
        i++
    ) {

        var p =
            armys[i];


        if (
            p &&
            p.color === 'blue' &&
            !p.disabled
        ) {

            bluec++;
        }
    }


    /*
     * 突破 5 次
     */
    if (
        game8BreakthroughCount >= 5
    ) {

        game8Lose();

        return;
    }


    /*
     * 所有炮兵被摧毁
     */
    if (
        bluec === 0
    ) {

        game8Lose();

        return;
    }


    /*
     * 坚持 12 回合
     */
    if (
        remain_turns <= 0
    ) {

        game8Win();

        return;
    }


    game8UpdateBreakthroughTip();


    var footer =
        document.getElementById(
            'footer-bar'
        );


    if (footer) {

        footer.innerHTML =
            'You have ' +
            remain_turns +
            ' turns left.';
    }
};


/* ============================================================
 * 开始战斗
 * ============================================================ */

function game8StartBattle() {

    if (game8Started) {

        return;
    }


    /*
     * 5 门炮必须全部部署
     */

    for (
        var i = 0;
        i < GAME8_ARTILLERY_COUNT;
        i++
    ) {

        if (
            !game8PlacedArtillery[i]
        ) {

            return;
        }
    }


    game8Started =
        true;


    /*
     * ========================================================
     * 本次修改：
     *
     * 战斗开始后炮兵全部固定。
     *
     * 仍然可以：
     *     - 被鼠标点击
     *     - 被选中
     *     - 显示攻击范围
     *     - 攻击敌军
     *
     * 但是不能移动。
     * ========================================================
     */

    for (
        var j = 0;
        j < armys.length;
        j++
    ) {

        var p =
            armys[j];


        if (
            p &&
            p.color === 'blue' &&
            p.cls === '炮'
        ) {

            p.speed =
                0;


            p.targetx =
                p.posx;


            p.targety =
                p.posy;


            p.fixedDeployment =
                true;


            p.game8FixedArtillery =
                true;
        }
    }


    game8RemoveDragPreview();


    /*
     * 战斗开始后不能继续部署。
     */
    var cards =
        document.querySelectorAll(
            '.deploy-card'
        );


    for (
        var k = 0;
        k < cards.length;
        k++
    ) {

        cards[k].setAttribute(
            'draggable',
            'false'
        );
    }


    var panel =
        document.getElementById(
            'deployment-panel'
        );


    if (panel) {

        panel.classList.add(
            'game8-battle-started'
        );
    }


    var tip =
        document.getElementById(
            'deployment-tip'
        );


    if (tip) {

        tip.innerHTML =
            '战斗开始！<br>' +
            '5 门炮兵已经固定。' +
            '<br>' +
            '阻止敌军突破最后防线。';
    }


    game8UpdateHUD();
}


/* ============================================================
 * 开始按钮
 * ============================================================ */

function game8BindStartButton() {

    var button =
        document.getElementById(
            'button'
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        'click',
        function() {

            if (
                !game8Started
            ) {

                game8StartBattle();
            }
        },
        true
    );
}


/* ============================================================
 * 初始化
 * ============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    function() {

        game8Init();


        if (
            typeof loadGame ===
            'function'
        ) {

            loadGame(game8);
        }


        game8BindDeployment();


        game8BindStartButton();


        game8UpdateDeploymentPanel();


        game8UpdateHUD();
    }
);