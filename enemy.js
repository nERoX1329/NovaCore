// Enemy related logic
import { gameRunning } from './main.js'; 
import { getCssVar } from './utils.js';
import { getPlayer } from './player.js'; 
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js'; // For spawn position

// Enemy state
export let enemies = [];

let spawnXPOrbFuncRef; 
let updateScoreFuncRef; 

export function initializeEnemySystem(xpOrbSpawner, scoreUpdater, ctxRef_unused) {
    spawnXPOrbFuncRef = xpOrbSpawner;
    updateScoreFuncRef = scoreUpdater; 
}

export function spawnEnemy() {
    const currentPlayer = getPlayer();
    if (!currentPlayer) return; 

    const size = 15 + Math.random() * 10;
    const x = Math.random() * (CANVAS_WIDTH - size); 
    const y = -size - Math.random() * 50; 

    const speed = 0.5 + Math.random() * 0.5 + (currentPlayer.level * 0.05);
    const hp = Math.floor(10 + currentPlayer.level * 5 + size * 0.5);
    const enemyColor1 = getCssVar('--enemy-color1') || '#FF0000';
    const enemyColor2 = getCssVar('--enemy-color2') || '#800080';
    const color = Math.random() < 0.5 ? enemyColor1 : enemyColor2;

    enemies.push({
        x, y,
        width: size, height: size, 
        speed,
        hp, maxHp: hp,
        color,
        angle: Math.PI / 2, 
        isDefeated: false 
    });
}

export function updateEnemies(dT) {
    const currentPlayer = getPlayer();
    if (!currentPlayer || !gameRunning) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isDefeated) { 
            if (e.hp <=0) enemies.splice(i,1);
            continue;
        }

        const dxToPlayer = currentPlayer.x - (e.x + e.width / 2);
        const dyToPlayer = currentPlayer.y - (e.y + e.height / 2);
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
        e.angle = Math.atan2(dyToPlayer, dxToPlayer);

        if (distToPlayer > 0.01) { 
            const moveSpeed = e.speed * (dT / (1000 / 60)); 
            e.x += (dxToPlayer / distToPlayer) * moveSpeed;
            e.y += (dyToPlayer / distToPlayer) * moveSpeed;
        }

        if (e.y > CANVAS_HEIGHT + e.height + 50) { 
            enemies.splice(i, 1);
        }
    }

    if (Math.random() < 0.02 + (currentPlayer.level * 0.005) && enemies.length < 10 + currentPlayer.level * 2) {
        spawnEnemy();
    }
}

export function drawEnemies(ctx) { 
    if (!ctx) return;
    enemies.forEach(e => {
        if (e.isDefeated && e.hp <=0) return; 

        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(e.angle + Math.PI / 2); 

        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.height / 2); 
        ctx.lineTo(e.width / 2, e.height / 2); 
        ctx.lineTo(-e.width / 2, e.height / 2); 
        ctx.closePath();
        ctx.fill();

        if (e.hp < e.maxHp && e.hp > 0) { 
            const barWidth = e.width;
            const barHeight = 4;
            const barX = -e.width / 2;
            const barY = e.height / 2 + 5; 

            ctx.fillStyle = getCssVar('--health-bar-bg') || '#5a0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = getCssVar('--health-bar-fg') || '#ff0000';
            const currentHealthWidth = barWidth * (e.hp / e.maxHp);
            ctx.fillRect(barX, barY, currentHealthWidth, barHeight);
        }
        ctx.restore();
    });
}

export function handleEnemyDefeat(enemy) {
    if (enemy.isDefeated) return; 
    enemy.isDefeated = true; 
    
    if (spawnXPOrbFuncRef) {
        spawnXPOrbFuncRef(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10 + Math.floor(enemy.width));
    }
    if (updateScoreFuncRef) {
        updateScoreFuncRef(10 + Math.floor(enemy.width));
    }
}

export function resetEnemiesState() {
    enemies.length = 0; 
}

export function getEnemies() {
    return enemies;
}
