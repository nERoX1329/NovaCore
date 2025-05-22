// Player related logic
import { keys, mouse, gameRunning } from './main.js'; 
import { getCssVar } from './utils.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js'; 

// Player state
export let player = null;

let bulletsArrayRef; 
let spawnXPOrbFuncRef; 
let enemiesArrayRef; 

export function initializePlayerSystem(bulletsArr, spawnXPOrbFunc, enemiesArr, ctxRef_unused, keysRef_unused, mouseRef_unused, gameRunningRef_unused) {
    bulletsArrayRef = bulletsArr;
    spawnXPOrbFuncRef = spawnXPOrbFunc;
    enemiesArrayRef = enemiesArr;
}


export function initPlayer() {
    player = {
        x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, radius: 10,
        color: getCssVar('--player-color') || '#00FFFF',
        speed: 2, baseSpeed: 2,
        hp: 100, maxHp: 100,
        level: 1,
        angle: -Math.PI / 2,
        baseDamage: 5, damageMultiplier: 1.0,
        shotsPerSecond: 2.0, fireRate: 500, 
        lastShotTime: 0,
        bulletSpeed: 4,
        bulletColor: getCssVar('--bullet-color') || '#FFFF00',
        numProjectiles: 1,
        projectileSpreadAngle: 0, 
        bulletPiercing: 0,
        critChance: 0, 
        critDamageMultiplier: 1.5, 
        xpCollectionRadiusMultiplier: 1.0,
        luckFactor: 1.0, 
        autoAimEnabled: false, 
        currentRerolls: 0, 
        specializationsChosen: 0,
        guardianWave: { enabled: false, damageFactor: 0.25, radius: 40, lastProcTime: 0, cooldown: 200 },
        activeAugmentations: [] 
    };
}

export function updatePlayer(dT) {
    if (!player || !gameRunning) return; 

    let dx = 0; let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1; 
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const actualSpeed = player.speed * (dT / (1000 / 60)); 
        player.x += (dx / magnitude) * actualSpeed;
        player.y += (dy / magnitude) * actualSpeed;
    }

    player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y));

    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x); 

    if ((keys[' '] || mouse.down) && Date.now() - player.lastShotTime > player.fireRate) { 
        const cannonEndX = player.x + Math.cos(player.angle) * (player.radius + 2); 
        const cannonEndY = player.y + Math.sin(player.angle) * (player.radius + 2);

        for (let i = 0; i < player.numProjectiles; i++) {
            let currentAngle = player.angle;
            if (player.numProjectiles > 1) {
                const totalSpreadRad = player.projectileSpreadAngle * (Math.PI / 180); 
                 currentAngle += (i - (player.numProjectiles - 1) / 2) * (totalSpreadRad / Math.max(1, player.numProjectiles -1) );
            }

            if (bulletsArrayRef) {
                 bulletsArrayRef.push({
                    x: cannonEndX, y: cannonEndY, width: 3, height: 8, 
                    color: player.bulletColor, speed: player.bulletSpeed,
                    angle: currentAngle, damage: player.baseDamage * player.damageMultiplier,
                    owner: 'player', spawnTime: Date.now(), 
                    piercing: player.bulletPiercing 
                });
            }
        }
        player.lastShotTime = Date.now();

        if (player.guardianWave && player.guardianWave.enabled && enemiesArrayRef &&
            Date.now() - player.guardianWave.lastProcTime > player.guardianWave.cooldown) {
            enemiesArrayRef.forEach(e => {
                if (e.hp <= 0 || e.isDefeated) return; 

                const dist = Math.sqrt(Math.pow(e.x + e.width/2 - player.x, 2) + Math.pow(e.y + e.height/2 - player.y, 2));
                if (dist < player.guardianWave.radius) {
                    let waveDamage = (player.baseDamage * player.damageMultiplier) * player.guardianWave.damageFactor;
                    if (player.critChance > 0 && Math.random() < player.critChance) {
                        waveDamage *= player.critDamageMultiplier;
                    }
                    e.hp -= waveDamage;

                    if (e.hp <=0 && !e.isDefeated) {
                        e.isDefeated = true; 
                        if(spawnXPOrbFuncRef) spawnXPOrbFuncRef(e.x + e.width / 2, e.y + e.height / 2, 10 + Math.floor(e.width)); 
                    }
                }
            });
            player.guardianWave.lastProcTime = Date.now();
        }
    }
}

export function drawPlayer(ctx) { 
    if (!player || !ctx) return; 
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2); 
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.radius); 
    ctx.lineTo(player.radius * 0.7, player.radius * 0.7); 
    ctx.lineTo(-player.radius * 0.7, player.radius * 0.7); 
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export function playerTakeDamage(amount) {
    if (!player) return;
    player.hp -= amount;
    if (player.hp <= 0) {
        player.hp = 0;
    }
}

export function resetPlayerState() {
    initPlayer();
}

export function getPlayer() {
    return player;
}
