// effects.js

// Globale Annahme: activeEffects Array ist in einer Hauptdatei (z.B. game_logic.js oder main.js) deklariert:
// let activeEffects = [];

function createExplosion(x, y, radius, damage, ownerType = 'player', color = 'orange', durationMs = 300) {
    if (typeof activeEffects === 'undefined') {
        console.error("activeEffects array is not defined globally!");
        return;
    }
    activeEffects.push({
        type: 'explosion',
        x, y,
        radius, // Endgültiger Radius
        currentRadius: 0, // Startradius
        maxRadius: radius, // Behalte maxRadius für klare Referenz
        damage,
        ownerType, // 'player' oder 'enemy' oder 'player_effect'
        color,
        durationMs, // Gesamtdauer der Explosion in ms
        creationTime: Date.now(),
        damagedEnemies: [] // Array von uniqueIds der bereits von dieser Explosion getroffenen Gegner
    });
}

// Funktion zum Anwenden von Elementarstatus-Effekten auf einen Gegner
function applyElementalEffect(enemy, elementType, hitDamage) {
    if (!player || !enemy || enemy.isDefeated) return; // Player-Referenz für Boni
    enemy.statusEffects = enemy.statusEffects || {};
    enemy.statusEffects.active = enemy.statusEffects.active || {};

    let durationMultiplier = player.statusEffectDurationMultiplier || 1.0;
    let baseDamageForEffect = hitDamage; // Schaden des Treffers, der den Effekt auslöst

    switch (elementType) {
        case 'fire':
            enemy.statusEffects.active.fire = {
                duration: (player.fireDotDuration || 3000) * durationMultiplier,
                // Schaden pro Sekunde, skaliert mit globalem Elementarschaden
                damagePerSecond: (baseDamageForEffect * (player.fireDotDamageFactor || 0.1)) * (player.globalElementalDamageBonus || 1.0)
            };
            break;
        case 'ice': // Eis macht per se keinen Schaden, nur Slow
            enemy.statusEffects.active.ice = {
                duration: (player.iceSlowDuration || 2000) * durationMultiplier,
                slowFactor: (player.iceSlowFactor || 0.2)
            };
            break;
        case 'lightning':
            // Direkter Schaden durch den Blitz (nicht der Kettenschaden, der ist separat)
            let initialLightningDamage = baseDamageForEffect * 0.3 * (player.globalElementalDamageBonus || 1.0);
            if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                initialLightningDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
            }
            enemy.hp -= initialLightningDamage;
            // Kettenschaden wird ausgelöst, wenn `applyElementalEffect` in `checkCollisions` aufgerufen wird
            // und dort die Logik für Kettenblitze enthalten ist.
            // Dieser Teil hier stellt nur sicher, dass der Statuseffekt-Name bekannt ist.
            // Man könnte hier auch einen kurzen "Schock"-Status setzen, wenn gewünscht.
            if (enemy.hp <= 0 && !enemy.isDefeated) {
                const enemyIndex = enemies.indexOf(enemy);
                if (enemyIndex !== -1) handleEnemyDefeat(enemy, enemyIndex, 'lightning_initial_proc');
                return; // Gegner ist schon besiegt
            }
            break;
        case 'bleed': // Für Grievous Wounds
             enemy.statusEffects.active.bleed = {
                duration: (player.bleedDuration || 3000) * durationMultiplier,
                // Schaden pro Sekunde
                dps: (baseDamageForEffect * (player.bleedDpsPercentOfHit || 0.3)) / ((player.bleedDuration || 3000)/1000)
            };
            break;
        case 'poison':
             enemy.statusEffects.active.poison = {
                duration: (player.poisonDotDuration || 5000) * durationMultiplier,
                // Schaden pro Sekunde, skaliert mit globalem Elementarschaden
                dps: (baseDamageForEffect * (player.poisonDotDamageFactor || 0.05)) * (player.globalElementalDamageBonus || 1.0)
            };
            break;
        case 'stun': // Für Temporal Master Class
             enemy.statusEffects.active.stun = {
                duration: (player.stunDuration || 1500) * durationMultiplier,
            };
            break;
    }
}


function updateActiveEffects(dT) {
    if (typeof activeEffects === 'undefined' || !player) { // player für omniCrit etc.
        return;
    }
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        const elapsedTime = Date.now() - effect.creationTime;

        if (effect.type === 'explosion') {
            const progress = Math.min(1, elapsedTime / effect.durationMs);
            effect.currentRadius = effect.maxRadius * Math.sin(progress * Math.PI / 2); // Sanftes Wachsen

            enemies.forEach((e, enemyIdx) => {
                if (e.isDefeated || effect.damagedEnemies.includes(e.uniqueId)) return;
                const dist = Math.sqrt(Math.pow(e.x + e.width/2 - effect.x, 2) + Math.pow(e.y + e.height/2 - effect.y, 2));

                if (dist < effect.currentRadius + (e.width + e.height) / 4) { // Kollisionscheck mit Gegnergröße
                    let explosionDamage = effect.damage;
                    if (effect.ownerType === 'player' || effect.ownerType === 'player_effect') {
                        explosionDamage *= (player.areaDamageMultiplier || 1.0);
                        if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                            explosionDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                        }
                    }
                    e.hp -= explosionDamage;
                    effect.damagedEnemies.push(e.uniqueId);
                    if (e.hp <= 0) {
                        handleEnemyDefeat(e, enemyIdx, effect.ownerType === 'player_effect' ? 'player_aoe' : 'explosion_effect');
                    }
                }
            });
        }
        // Black Hole wurde entfernt

        if (elapsedTime >= effect.durationMs) {
            activeEffects.splice(i, 1);
        }
    }
}

function drawActiveEffects() {
    if (!ctx || typeof activeEffects === 'undefined') return;
    activeEffects.forEach(effect => {
        if (effect.type === 'explosion') {
            const elapsedTime = Date.now() - effect.creationTime;
            const alphaProgress = Math.max(0, 1 - (elapsedTime / effect.durationMs));

            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, Math.max(0, effect.currentRadius), 0, Math.PI * 2);
            ctx.globalAlpha = alphaProgress * 0.7; // Fade out
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        // Black Hole wurde entfernt
    });
}