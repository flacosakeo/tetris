const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const levelNameElement = document.getElementById('level-name');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const themeCheckbox = document.getElementById('checkbox');
const themeLabel = document.getElementById('theme-label');

const BLOCK_SIZE = 30;
context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(30, 30);

// Paletas temáticas dinámicas por nivel (piezas + acentos del escenario)
const LEVEL_PALETTES = [
    {
        name: 'Cyberpunk',
        accent: '#00f3ff',
        title: '#00f3ff',
        colors: [null, '#ff0055', '#00f3ff', '#00ff66', '#cc00ff', '#ff7b00', '#ffe600', '#0088ff']
    },
    {
        name: 'Lava',
        accent: '#ff4d00',
        title: '#ff6600',
        colors: [null, '#ff1a1a', '#ff9900', '#ffcc00', '#cc0000', '#ff5500', '#ffaa33', '#e63900']
    },
    {
        name: 'Esmeralda',
        accent: '#00ff66',
        title: '#00ff88',
        colors: [null, '#00e676', '#00b0ff', '#76ff03', '#1de9b6', '#69f0ae', '#b2ff59', '#00e5ff']
    },
    {
        name: 'Glaciar',
        accent: '#38bdf8',
        title: '#38bdf8',
        colors: [null, '#818cf8', '#38bdf8', '#2dd4bf', '#a78bfa', '#60a5fa', '#93c5fd', '#0284c7']
    },
    {
        name: 'Amatista',
        accent: '#c084fc',
        title: '#d8b4fe',
        colors: [null, '#e879f9', '#a855f7', '#f43f5e', '#c084fc', '#d946ef', '#f472b6', '#8b5cf6']
    },
    {
        name: 'Dorado Midas',
        accent: '#fbbf24',
        title: '#fcd34d',
        colors: [null, '#f59e0b', '#fbbf24', '#facc15', '#ea580c', '#eab308', '#fef08a', '#d97706']
    },
    {
        name: 'Sakura Rubí',
        accent: '#f43f5e',
        title: '#fb7185',
        colors: [null, '#f43f5e', '#fb7185', '#ec4899', '#fda4af', '#f472b6', '#e11d48', '#be123c']
    },
    {
        name: 'Abismo Marino',
        accent: '#06b6d4',
        title: '#22d3ee',
        colors: [null, '#06b6d4', '#0284c7', '#10b981', '#3b82f6', '#14b8a6', '#0ea5e9', '#0891b2']
    },
    {
        name: 'Synthwave 80s',
        accent: '#ec4899',
        title: '#f43f5e',
        colors: [null, '#ec4899', '#06b6d4', '#a855f7', '#facc15', '#f97316', '#3b82f6', '#10b981']
    },
    {
        name: 'Cósmico',
        accent: '#8b5cf6',
        title: '#a78bfa',
        colors: [null, '#f43f5e', '#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#3b82f6', '#ec4899']
    }
];

function getCurrentPalette() {
    const idx = (player.level - 1) % LEVEL_PALETTES.length;
    return LEVEL_PALETTES[idx];
}

const LINE_POINTS = [0, 100, 300, 500, 800];

// Caché de colores de tema para evitar relayouts por frame
let themeColors = {
    canvasBg: '#080310',
    gridColor: 'rgba(0, 243, 255, 0.04)'
};

function updateThemeColors() {
    const computedStyle = getComputedStyle(document.body);
    themeColors.canvasBg = computedStyle.getPropertyValue('--canvas-bg').trim() || '#080310';
    themeColors.gridColor = computedStyle.getPropertyValue('--grid-color').trim() || 'rgba(0, 243, 255, 0.04)';
}

function applyLevelTheme() {
    const palette = getCurrentPalette();
    const isLight = document.body.classList.contains('light-mode');

    if (!isLight) {
        document.documentElement.style.setProperty('--canvas-border', palette.accent);
        document.documentElement.style.setProperty('--container-border', palette.accent + '55');
        document.documentElement.style.setProperty('--container-shadow', `0 0 35px ${palette.accent}33`);
        document.documentElement.style.setProperty('--title-color', palette.title);
        document.documentElement.style.setProperty('--panel-title', palette.accent);
        document.documentElement.style.setProperty('--panel-border', palette.accent + '44');
        themeColors.gridColor = palette.accent + '12';
    } else {
        document.documentElement.style.setProperty('--canvas-border', palette.accent);
        document.documentElement.style.setProperty('--title-color', palette.accent);
        document.documentElement.style.setProperty('--panel-title', palette.accent);
        themeColors.gridColor = 'rgba(0, 0, 0, 0.06)';
    }
    updateThemeColors();
}

let levelUpBanner = {
    text: '',
    subtext: '',
    startTime: 0,
    duration: 1800
};

function triggerLevelUp() {
    const palette = getCurrentPalette();
    levelUpBanner = {
        text: `¡NIVEL ${player.level}!`,
        subtext: palette.name.toUpperCase(),
        startTime: performance.now(),
        duration: 1800
    };
    applyLevelTheme();
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') return [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ];
    if (type === 'I') return [
        [0, 0, 0, 0],
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    if (type === 'S') return [
        [0, 3, 3],
        [3, 3, 0],
        [0, 0, 0]
    ];
    if (type === 'Z') return [
        [4, 4, 0],
        [0, 4, 4],
        [0, 0, 0]
    ];
    if (type === 'L') return [
        [0, 0, 5],
        [5, 5, 5],
        [0, 0, 0]
    ];
    if (type === 'J') return [
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0]
    ];
    if (type === 'O') return [
        [7, 7],
        [7, 7]
    ];
    return null;
}

const arena = createMatrix(10, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
};

let nextPieceMatrix = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId = null;
let isPaused = false;
let isPlaying = false;
let isGameOver = false;

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    if (!m) return false;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                let targetX = x + o.x;
                let targetY = y + o.y;
                if (targetX < 0 || targetX >= arena[0].length || targetY >= arena.length) {
                    return true;
                }
                if (targetY >= 0 && arena[targetY][targetX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(arena, player) {
    if (!player.matrix) return;
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const targetY = y + player.pos.y;
                const targetX = x + player.pos.x;
                if (targetY >= 0 && targetY < arena.length && targetX >= 0 && targetX < arena[0].length) {
                    arena[targetY][targetX] = value;
                }
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    if (!isPlaying || isPaused || isGameOver || !player.matrix) return;
    const posX = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = posX;
            return;
        }
    }
    draw();
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        rowCount++;
    }

    if (rowCount > 0) {
        player.lines += rowCount;
        const basePoints = LINE_POINTS[rowCount] || (rowCount * 200);
        player.score += basePoints * player.level;
        const oldLevel = player.level;
        player.level = Math.floor(player.lines / 10) + 1;
        if (player.level > oldLevel) {
            triggerLevelUp();
        }
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 90);
        updateStats();
    }
}

function playerDrop() {
    if (!isPlaying || isPaused || isGameOver) return;
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
        updateStats();
    }
    dropCounter = 0;
    draw();
}

function playerMove(dir) {
    if (!isPlaying || isPaused || isGameOver) return;
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
    draw();
}

function getRandomPiece() {
    const pieces = 'TJLSZOI';
    return createPiece(pieces[(pieces.length * Math.random()) | 0]);
}

function playerReset() {
    if (!nextPieceMatrix) {
        nextPieceMatrix = getRandomPiece();
    }
    player.matrix = nextPieceMatrix;
    nextPieceMatrix = getRandomPiece();

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        gameOver();
    }
}

function playerHardDrop() {
    if (!isPlaying || isPaused || isGameOver) return;
    let droppedLines = 0;
    while (!collide(arena, player)) {
        player.pos.y++;
        droppedLines++;
    }
    player.pos.y--;
    droppedLines = Math.max(0, droppedLines - 1);
    player.score += droppedLines * 2;

    merge(arena, player);
    arenaSweep();
    playerReset();
    updateStats();
    dropCounter = 0;
    draw();
}

function gameOver() {
    isPlaying = false;
    isGameOver = true;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    pauseBtn.disabled = true;
    startBtn.innerText = 'Reiniciar';
    draw();
}

function togglePause() {
    if (!isPlaying || isGameOver) return;
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? 'Reanudar' : 'Pausar';
    
    if (isPaused) {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        draw();
    } else {
        lastTime = performance.now();
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        animationId = requestAnimationFrame(update);
    }
    pauseBtn.blur();
}

function update(time = performance.now()) {
    if (!isPlaying || isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    if (isPlaying && !isPaused && !isGameOver) {
        animationId = requestAnimationFrame(update);
    }
}

function drawMatrix(matrix, offset, ctx = context) {
    if (!matrix) return;
    const palette = getCurrentPalette().colors;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = palette[value] || '#00f3ff';
                ctx.fillRect(x + offset.x, y + offset.y, 0.92, 0.92);
            }
        });
    });
}

function drawGrid() {
    context.strokeStyle = themeColors.gridColor;
    context.lineWidth = 0.03;

    for (let i = 0; i <= 10; i++) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 20);
        context.stroke();
    }
    for (let j = 0; j <= 20; j++) {
        context.beginPath();
        context.moveTo(0, j);
        context.lineTo(10, j);
        context.stroke();
    }
}

function drawLevelUpBanner() {
    if (!levelUpBanner.startTime) return;
    const elapsed = performance.now() - levelUpBanner.startTime;
    if (elapsed > levelUpBanner.duration) {
        levelUpBanner.startTime = 0;
        return;
    }

    const progress = elapsed / levelUpBanner.duration;
    let alpha = 1;
    if (progress < 0.2) {
        alpha = progress / 0.2;
    } else if (progress > 0.7) {
        alpha = (1 - progress) / 0.3;
    }

    const palette = getCurrentPalette();
    const bannerY = 7.5;
    const bannerH = 3.8;

    context.save();
    context.fillStyle = `rgba(10, 5, 25, ${0.88 * alpha})`;
    context.fillRect(0.6, bannerY, 8.8, bannerH);

    context.strokeStyle = palette.accent;
    context.lineWidth = 0.09;
    context.strokeRect(0.6, bannerY, 8.8, bannerH);

    context.fillStyle = palette.accent;
    context.font = 'bold 1.15px "Segoe UI", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(levelUpBanner.text, 5, bannerY + 1.3);

    context.fillStyle = '#ffffff';
    context.font = 'bold 0.65px "Segoe UI", sans-serif';
    context.fillText(levelUpBanner.subtext, 5, bannerY + 2.5);
    context.restore();
}

function drawOverlay(title, subtitle) {
    context.fillStyle = 'rgba(0, 0, 0, 0.78)';
    context.fillRect(0, 0, 10, 20);

    const isLight = document.body.classList.contains('light-mode');
    const palette = getCurrentPalette();
    context.fillStyle = isLight ? '#0284c7' : palette.accent;
    context.font = 'bold 1.1px "Segoe UI", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, 5, 9);

    if (subtitle) {
        context.fillStyle = '#ffffff';
        context.font = '0.65px "Segoe UI", sans-serif';
        context.fillText(subtitle, 5, 11);
    }
}

function draw() {
    context.fillStyle = themeColors.canvasBg;
    context.fillRect(0, 0, canvas.width / BLOCK_SIZE, canvas.height / BLOCK_SIZE);

    drawGrid();
    drawMatrix(arena, {x: 0, y: 0});
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }

    nextContext.fillStyle = themeColors.canvasBg;
    nextContext.fillRect(0, 0, nextCanvas.width / 30, nextCanvas.height / 30);
    if (nextPieceMatrix) {
        const offsetX = (4 - nextPieceMatrix[0].length) / 2;
        const offsetY = (4 - nextPieceMatrix.length) / 2;
        drawMatrix(nextPieceMatrix, {x: offsetX, y: offsetY}, nextContext);
    }

    drawLevelUpBanner();

    if (isGameOver) {
        drawOverlay('FIN DEL JUEGO', `Puntuación: ${player.score}`);
    } else if (isPaused) {
        drawOverlay('PAUSA', 'Pulsa P para seguir');
    }
}

function updateStats() {
    scoreElement.innerText = player.score;
    linesElement.innerText = player.lines;
    levelElement.innerText = player.level;
    if (levelNameElement) {
        levelNameElement.innerText = getCurrentPalette().name;
    }
}

themeCheckbox.addEventListener('change', () => {
    document.body.classList.toggle('light-mode', themeCheckbox.checked);
    themeLabel.innerText = themeCheckbox.checked ? '☀️' : '🌙';
    applyLevelTheme();
    draw();
});

const GAME_KEYS = ['KeyA', 'KeyD', 'KeyS', 'KeyW', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'];

document.addEventListener('keydown', event => {
    if (event.code === 'KeyP') {
        if (event.repeat) return;
        togglePause();
        return;
    }

    if (!isPlaying || isPaused || isGameOver) return;

    if (GAME_KEYS.includes(event.code)) {
        event.preventDefault();
    }

    switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            playerMove(-1);
            break;
        case 'KeyD':
        case 'ArrowRight':
            playerMove(1);
            break;
        case 'KeyS':
        case 'ArrowDown':
            playerDrop();
            break;
        case 'KeyW':
        case 'ArrowUp':
            playerRotate(1);
            break;
        case 'Space':
            if (event.repeat) return;
            playerHardDrop();
            break;
    }
});

function startGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    levelUpBanner.startTime = 0;
    applyLevelTheme();
    updateStats();
    nextPieceMatrix = null;
    isGameOver = false;
    isPaused = false;
    isPlaying = true;

    playerReset();

    dropCounter = 0;
    lastTime = performance.now();
    pauseBtn.disabled = false;
    pauseBtn.innerText = 'Pausar';
    startBtn.innerText = 'Reiniciar';

    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(update);
    startBtn.blur();
}

startBtn.addEventListener('click', startGame);

pauseBtn.addEventListener('click', togglePause);

// Configuración de controles táctiles para móviles y pantallas táctiles
function setupTouchButton(buttonId, action, repeat = true) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    let intervalId = null;
    let timeoutId = null;

    const start = (e) => {
        if (e.cancelable) e.preventDefault();
        action();
        if (repeat) {
            timeoutId = setTimeout(() => {
                intervalId = setInterval(action, 90);
            }, 220);
        }
    };

    const stop = (e) => {
        if (e.cancelable) e.preventDefault();
        clearTimeout(timeoutId);
        clearInterval(intervalId);
    };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop, { passive: false });
    btn.addEventListener('touchcancel', stop, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
}

function initTouchControls() {
    setupTouchButton('btn-left', () => playerMove(-1), true);
    setupTouchButton('btn-right', () => playerMove(1), true);
    setupTouchButton('btn-down', () => playerDrop(), true);
    setupTouchButton('btn-rotate', () => playerRotate(1), false);
    setupTouchButton('btn-drop', () => playerHardDrop(), false);

    // Gestos táctiles directamente sobre el lienzo del juego
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const swipeThreshold = 22;

    canvas.addEventListener('touchstart', (e) => {
        if (!isPlaying || isPaused || isGameOver) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = performance.now();
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isPlaying || isPaused || isGameOver) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;

            if (Math.abs(dx) > swipeThreshold) {
                playerMove(dx > 0 ? 1 : -1);
                touchStartX = touch.clientX;
            }
            if (dy > swipeThreshold) {
                playerDrop();
                touchStartY = touch.clientY;
            }
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (!isPlaying || isPaused || isGameOver) return;
        const duration = performance.now() - touchStartTime;
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const totalDx = Math.abs(touch.clientX - touchStartX);
            const totalDy = touch.clientY - touchStartY;

            // Toque rápido (tap) sin apenas desplazamiento: Rotar
            if (totalDx < 12 && Math.abs(totalDy) < 12 && duration < 250) {
                playerRotate(1);
            }
            // Deslizamiento rápido hacia abajo (flick down): Caída libre
            else if (totalDy > 60 && duration < 200) {
                playerHardDrop();
            }
        }
    }, { passive: true });
}

// Inicialización de la pantalla al cargar
applyLevelTheme();
nextPieceMatrix = getRandomPiece();
updateStats();
initTouchControls();
draw();
