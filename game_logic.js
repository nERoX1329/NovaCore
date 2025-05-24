// game_logic.js

// Globale Variablen, die von anderen Dateien deklariert werden (hier nur zur Referenz):
// let player, bullets, enemies, xpOrbs, activeEffects;
// let score, currentLevelXP, xpToNextLevel;
// let gameState, gameRunning, animationFrameId, lastLoopTime;
// let keys, mouse;
// let metaProgress, gameSettings; (aus config.js)
// const ALL_AUGMENTATIONS, CLASS_SPECIALIZATIONS; (aus data_...js)


function togglePauseGame() {
    const pauseMenuEl = document.getElementById('pauseMenuScreen');
    if (!pauseMenuEl) return;

    if (gameState === 'game') {
        gameRunning = false;
        gameState = 'paused_menu';
        updatePauseMenuStatsUI(); // Füllt das Pausemenü mit aktuellen Stats (aus ui_manager.js)
        switchScreen('pauseMenu'); // Zeigt das Pausemenü an (aus ui_manager.js)
    } else if (gameState === 'paused_menu') {
        gameRunning = true;
        gameState = 'game';
        switchScreen('game'); // Kehrt zum Spiel zurück
        lastLoopTime = performance.now(); // Wichtig, um deltaTime Sprung zu vermeiden
        if (!animationFrameId) { // Starte den Loop nur, wenn er nicht schon läuft (sollte nicht der Fall sein)
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
}

function resetRunVariables() {
    // Lade Meta-Fortschritt, um Boni für initPlayer verfügbar zu machen
    // Annahme: loadMetaProgress ist in utils.js und metaProgress ist global
    if (typeof loadMetaProgress === 'function') {
        loadMetaProgress();
    }

    bullets = [];
    enemies = [];
    xpOrbs = [];
    activeEffects = [];
    keys = {}; // Tastenstatus zurücksetzen

    score = 0;
    currentLevelXP = 0;
    // xpToNextLevel wird in initPlayer basierend auf Level und Skalierung gesetzt

    // Globale Variable 'chosenSpecializations' zurücksetzen (aus config.js oder main.js)
    if (typeof chosenSpecializations !== 'undefined') {
        chosenSpecializations = [];
    }


    // initPlayer (aus game_objects.js) initialisiert den Spieler mit Meta-Boni und Schwierigkeitsgrad
    if (typeof initPlayer === 'function') {
        initPlayer();
    } else {
        console.error("initPlayer function is not defined!");
        return; // Spiel kann nicht ohne Spieler initialisiert werden
    }
    
    xpToNextLevel = Math.floor(XP_TO_NEXT_LEVEL_BASE * Math.pow(XP_LEVEL_SCALING_FACTOR, (player.level || 1) - 1));


    if (player && enemies.length === 0) {
        for(let i=0; i<3; i++) {
            if (typeof spawnEnemy === 'function') spawnEnemy();
        }
    }
    if (typeof updateGameUI === 'function') updateGameUI();
}

function startGame() {
    if (!canvas || !ctx) {
        console.error("Canvas or Context not found! Game cannot start.");
        // Hier könnte man eine Fehlermeldung im UI anzeigen
        const startButton = document.getElementById('startGameButton');
        if(startButton) startButton.disabled = true;
        document.body.insertAdjacentHTML('beforeend', '<p style="color:red; text-align:center; font-size:1.2em; padding-top: 20px;">Critical Error: Canvas not found. Cannot start game.</p>');
        return;
    }
    resetRunVariables();
    gameRunning = true;
    // gameState = 'game'; // Wird in switchScreen gesetzt
    switchScreen('game');
    lastLoopTime = performance.now();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    // gameState = 'gameOver'; // Wird in switchScreen gesetzt

    if (player) {
        metaProgress.metaCurrency = (metaProgress.metaCurrency || 0) + (player.runCurrency || 0);
        if (typeof saveMetaProgress === 'function') saveMetaProgress();
        const runCurrencyDisplay = document.getElementById('runCurrencyDisplay');
        if(runCurrencyDisplay) runCurrencyDisplay.textContent = player.runCurrency || 0;
    }
    const finalScoreDisplay = document.getElementById('finalScoreDisplay');
    const finalLevelDisplay = document.getElementById('finalLevelDisplay');
    const gameOverMetaCurrencyDisplay = document.getElementById('gameOverMetaCurrency');


    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    if(finalLevelDisplay) finalLevelDisplay.textContent = player ? player.level : '1';
    if(gameOverMetaCurrencyDisplay) gameOverMetaCurrencyDisplay.textContent = metaProgress.metaCurrency;

    switchScreen('gameOver');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function gainXP(amount) {
    if (!player || !gameRunning) return;
    currentLevelXP += amount;
    if (currentLevelXP >= xpToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    if (!player) return;
    player.level++;
    currentLevelXP = Math.max(0, currentLevelXP - xpToNextLevel); // Behalte überschüssige XP
    xpToNextLevel = Math.floor(XP_TO_NEXT_LEVEL_BASE * Math.pow(XP_LEVEL_SCALING_FACTOR, player.level -1));

    // Heilung beim Level-Up (verstärkt durch healingAmp)
    player.hp = Math.min(player.maxHp, player.hp + (20 * (player.healingAmp || 1.0)));
    player.currentRerolls = player.baseStats.rerollsPerLevel; // Setze Rerolls zurück (Meta-Boni sind in baseStats)

    player.secondWindUsedThisCombat = false; // Reset für "pro Kampf"-Effekte

    if (player.ultimateSacrificePending) {
        const hpSacrifice = player.hp * 0.5;
        // Basiswerte direkt im player.baseStats anpassen, wenn das Opfer permanent sein soll
        // Für diesen Run:
        player.maxHp = Math.max(10, player.maxHp - hpSacrifice);
        player.hp -= hpSacrifice;


        player.damageMultiplier = (player.damageMultiplier || 1.0) * 1.30;
        player.shotsPerSecond = (player.shotsPerSecond || 1.0) * 1.30;
        player.fireRate = 1000 / player.shotsPerSecond;
        player.speed = (player.speed || 1.0) * 1.15;
        const maxHpBoost = Math.floor(player.maxHp * 0.15); // Auf die bereits reduzierte MaxHP
        player.maxHp += maxHpBoost;

        player.hp = Math.min(player.hp, player.maxHp);
        player.ultimateSacrificePending = false;
        // console.log("Ultimate Sacrifice vollzogen!");
    }

    gameRunning = false; // Pausiere das Spiel für die Auswahl
    if ((player.level === 10 && player.specializationsChosen === 0) || (player.level === 20 && player.specializationsChosen === 1)) {
        gameState = player.level === 10 ? 'paused_class_choice' : 'paused_second_class_choice';
        if (typeof showSpecializationChoiceScreen === 'function') showSpecializationChoiceScreen();
    } else {
        gameState = 'paused_augment';
        if (typeof showAugmentationChoiceScreen === 'function') showAugmentationChoiceScreen();
    }
}

function checkCollisions() {
    if (!player) return;

    // Kugel trifft Gegner
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) { bullets.splice(i,1); continue; } // Kugel wurde möglicherweise schon entfernt
        if (b.owner !== 'player' && b.owner !== 'player_phantom') continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDefeated || (b.hitEnemies && b.hitEnemies.includes(e.uniqueId))) continue;

            const bulletEffectiveWidth = b.width * (player.projectileSizeMultiplier || 1.0);
            const bulletEffectiveHeight = b.height * (player.projectileSizeMultiplier || 1.0);
            const distSq = (b.x - (e.x + e.width/2))**2 + (b.y - (e.y + e.height/2))**2;
            const enemyRadiusApprox = Math.max(e.width, e.height) / 2;
            const bulletRadiusApprox = Math.max(bulletEffectiveWidth, bulletEffectiveHeight) / 2;

            if (distSq < (enemyRadiusApprox + bulletRadiusApprox)**2 * 0.85) {
                let damageDealt = b.damage; // Beinhaltet player.effectiveBaseDamage * player.damageMultiplier

                if (player.berserkerFuryActive) {
                    const missingHpPercent = player.maxHp > 0 ? Math.max(0, (player.maxHp - player.hp) / player.maxHp) : 0;
                    damageDealt *= (1 + missingHpPercent);
                }
                if (player.damageToElitesMultiplier && e.width >= 20) { // Annahme für Elite
                    damageDealt *= player.damageToElitesMultiplier;
                }

                let wasCrit = false;
                if (player.guaranteedCritNextShot && b.owner === 'player') {
                    damageDealt *= (player.critDamageMultiplier || 1.5) * (1 + (player.guaranteedCritDamageBonus || 0));
                    wasCrit = true;
                    player.guaranteedCritNextShot = false; player.nonCritStreak = 0;
                } else if (player.critChance && Math.random() < player.critChance && b.owner === 'player') {
                    damageDealt *= (player.critDamageMultiplier || 1.5);
                    wasCrit = true; player.nonCritStreak = 0;
                } else if (b.owner === 'player') { // Nur für Spieler-Kugeln Streak zählen
                    player.nonCritStreak = (player.nonCritStreak || 0) + 1;
                    if (player.nonCritStreakThreshold && player.nonCritStreak >= player.nonCritStreakThreshold) {
                        player.guaranteedCritNextShot = true;
                    }
                }

                e.hp -= damageDealt;
                if (!b.hitEnemies) b.hitEnemies = []; // Initialisieren falls nicht vorhanden
                b.hitEnemies.push(e.uniqueId);

                // Elementar- und andere On-Hit-Effekte (nur für 'player' Kugeln, nicht 'player_phantom')
                if (b.owner === 'player') {
                    let appliedElement = b.element; // Von Elemental Overlord
                    if (!appliedElement && player.elementalChance) {
                        const rand = Math.random(); let cumulativeChance = 0;
                        const effectiveGlobalChance = player.globalElementalChanceBonus || 0;
                        if (player.elementalChance.fire > 0 && rand < (cumulativeChance += player.elementalChance.fire + effectiveGlobalChance)) appliedElement = 'fire';
                        else if (player.elementalChance.ice > 0 && rand < (cumulativeChance += player.elementalChance.ice + effectiveGlobalChance)) appliedElement = 'ice';
                        else if (player.elementalChance.lightning > 0 && rand < (cumulativeChance += player.elementalChance.lightning + effectiveGlobalChance)) appliedElement = 'lightning';
                        else if (player.elementalChance.poison > 0 && rand < (cumulativeChance += player.elementalChance.poison + effectiveGlobalChance)) appliedElement = 'poison';
                    }
                    if (appliedElement) applyElementalEffect(e, appliedElement, damageDealt);

                    if (player.slowOnHitChance > 0 && Math.random() < player.slowOnHitChance) {
                        applyElementalEffect(e, 'ice', 0); // Nutze Ice-Effekt für Slow ohne direkten Schaden durch diesen Trigger
                    }
                    if (player.timeFreezeChance > 0 && Math.random() < player.timeFreezeChance && !e.isFrozen) {
                        e.isFrozen = true;
                        e.freezeTimer = (player.timeFreezeDuration || 2000) * (player.statusEffectDurationMultiplier || 1.0);
                    }
                    if (player.stunChanceOnHit > 0 && Math.random() < player.stunChanceOnHit && !e.isFrozen && (!e.statusEffects.active.stun || e.statusEffects.active.stun.duration <=0)) {
                        applyElementalEffect(e, 'stun', 0);
                    }

                    if (wasCrit) {
                        if (player.critCausesBleed) applyElementalEffect(e, 'bleed', damageDealt);
                        if (player.critKnockbackBonus > 0 && player.knockbackMultiplier) {
                            const knockbackForce = 15 * player.knockbackMultiplier * (1 + player.critKnockbackBonus);
                            e.x -= Math.cos(b.angle) * knockbackForce * 0.2;
                            e.y -= Math.sin(b.angle) * knockbackForce * 0.2;
                        }
                        if (player.critNova?.enabled) {
                            createExplosion(e.x + e.width/2, e.y + e.height/2, (player.critNova.radius || 70) * (player.areaDamageMultiplier || 1.0), damageDealt * (player.critNova.damageFactor || 0.75), 'player_effect', 'yellow');
                        }
                        if (player.critAoeDamagePercent > 0) { // Altes Crit AoE
                            createExplosion(e.x + e.width/2, e.y + e.height/2, (player.critAoeRadius || 30) * (player.areaDamageMultiplier || 1.0), damageDealt * player.critAoeDamagePercent, 'player_effect', 'gold');
                        }
                        if (player.critRicochetChance > 0 && Math.random() < player.critRicochetChance) {
                            let ricochetTarget = null; let minDistSq = (120 * (player.areaDamageMultiplier || 1.0))**2;
                            enemies.forEach(otherE => {
                                if (otherE.uniqueId === e.uniqueId || otherE.isDefeated) return;
                                const dSq = (otherE.x + otherE.width/2 - (e.x+e.width/2))**2 + (otherE.y + otherE.height/2 - (e.y+e.height/2))**2;
                                if (dSq < minDistSq) { minDistSq = dSq; ricochetTarget = otherE; }
                            });
                            if (ricochetTarget) {
                                bullets.push({ ...b, x: e.x+e.width/2, y: e.y+e.height/2, angle: Math.atan2(ricochetTarget.y + ricochetTarget.height/2 - (e.y+e.height/2), ricochetTarget.x + ricochetTarget.width/2 - (e.x+e.width/2)), damage: b.damage * (player.critRicochetDamageFactor || 0.5), piercingLeft: 0, bouncesLeft:0, hitEnemies: [e.uniqueId], uniqueId: Math.random().toString(36).substr(2,9)+"_rico", canDuplicate: false });
                            }
                        }
                    }

                    if (player.lifeStealPercent > 0) {
                        const healedAmount = damageDealt * player.lifeStealPercent * (player.healingAmp || 1.0);
                        player.hp = Math.min(player.maxHp, player.hp + healedAmount);
                    }
                } // Ende if (b.owner === 'player') für On-Hit

                let bulletRemovedThisHit = false;
                if (b.piercingLeft > 0) {
                    b.piercingLeft--;
                } else if (b.canDuplicate && b.owner === 'player' && Math.random() < player.duplicatorRoundsChance) {
                    b.canDuplicate = false; // Verhindere erneutes Duplizieren dieser Instanz
                    const dupAngleOffset = Math.PI / 18; // Kleiner Winkel für Duplikate
                    bullets.push({ ...b, damage: b.damage * 0.6, uniqueId: Math.random().toString(36).substr(2, 9)+"_dup1", x: b.x, y: b.y, angle: b.angle + dupAngleOffset, hitEnemies: [e.uniqueId], canDuplicate: false });
                    bullets.push({ ...b, damage: b.damage * 0.6, uniqueId: Math.random().toString(36).substr(2, 9)+"_dup2", x: b.x, y: b.y, angle: b.angle - dupAngleOffset, hitEnemies: [e.uniqueId], canDuplicate: false });
                    bullets.splice(i, 1); bulletRemovedThisHit = true;
                } else {
                    bullets.splice(i, 1); bulletRemovedThisHit = true;
                }

                // Effekte, auch wenn Kugel durchdringt oder dupliziert wurde (Originalkugel ist ggf. weg)
                if (b.canExplodeOnImpact && b.owner === 'player') {
                    createExplosion(e.x + e.width/2, e.y + e.height/2, player.bulletExplosionRadius * (player.areaDamageMultiplier || 1.0) , player.bulletExplosionDamage, 'player');
                    if (!bulletRemovedThisHit && !(b.piercingLeft > 0) && bullets.includes(b)) { // Wenn sie explodiert und nicht mehr pierct, entfernen
                         bullets.splice(i, 1); bulletRemovedThisHit = true;
                    }
                }
                // Blackhole wurde entfernt

                if (e.hp <= 0) {
                    handleEnemyDefeat(e, j, wasCrit ? 'crit_kill' : 'normal_kill');
                }
                if (bulletRemovedThisHit) break; // Nächste Kugel prüfen, da diese Kugel weg ist
            }
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isDefeated) continue;

        const dist = Math.sqrt(Math.pow(player.x - (e.x + e.width/2), 2) + Math.pow(player.y - (e.y + e.height/2), 2));
        if (dist < player.radius + e.width/2 * 0.7) {
            if (player.isInvulnerable || (player.isDashing && player.dashActiveTimer > 0 && player.dashInvulnDuration > 0 && player.invulnerableTimer > 0) ) {
                 if (player.isDashing && player.dashDamage > 0 && !e.dashedThisDash) {
                    e.hp -= player.dashDamage;
                    e.dashedThisDash = true;
                    if (e.hp <= 0) { handleEnemyDefeat(e, i, 'dash_collision'); continue;}
                 }
                continue;
            }

            let damageTaken = 10 * (1 + player.level * 0.05); // Basis Gegnerschaden
            // Hier könnte Gegnerschaden auch durch gameSettings.selectedDifficulty modifiziert werden

            if (player.damageReduction > 0) {
                damageTaken *= (1 - player.damageReduction);
            }
            if (player.adaptiveArmor && player.adaptiveArmor.active) {
                const enemyDamageType = e.damageType || 'physical';
                if (player.adaptiveArmor.lastDamageType === enemyDamageType) {
                    damageTaken *= (1 - player.adaptiveArmor.currentResistance);
                } else {
                    player.adaptiveArmor.currentResistance = player.adaptiveArmor.increment;
                    player.adaptiveArmor.lastDamageType = enemyDamageType;
                    damageTaken *= (1 - player.adaptiveArmor.currentResistance);
                }
                 player.adaptiveArmor.currentResistance = Math.min(player.adaptiveArmor.maxResistance, player.adaptiveArmor.currentResistance + player.adaptiveArmor.increment);
            }

            if (player.maxShield > 0 && player.shield > 0) {
                if (player.shield >= damageTaken) {
                    player.shield -= damageTaken;
                    damageTaken = 0;
                } else {
                    damageTaken -= player.shield;
                    player.shield = 0;
                }
                player.shieldLastHitTime = Date.now();
                if (player.shield <= 0 && player.unstableShieldCoreActive) {
                    createExplosion(player.x, player.y, 80 * (player.areaDamageMultiplier || 1.0), player.unstableShieldCoreDamage, 'player_effect', 'cyan', 250);
                }
            }

            if (damageTaken > 0) {
                if (player.dodgeChance > 0 && Math.random() < player.dodgeChance) {}
                else if (player.evasionChance > 0 && Math.random() < player.evasionChance) {}
                else {
                    player.hp -= damageTaken;
                    if (player.invulnOnHitChance > 0 && player.invulnOnHitTimer <= 0 && Math.random() < player.invulnOnHitChance) {
                        player.isInvulnerable = true;
                        player.invulnerableTimer = player.invulnOnHitDuration;
                        player.invulnOnHitTimer = player.invulnOnHitCooldown;
                    }
                }
            }

            if (player.hp > 0 && player.secondWindEnabled && !player.secondWindUsedThisCombat && player.hp <= player.maxHp * player.secondWindThreshold) {
                player.isInvulnerable = true;
                player.invulnerableTimer = player.secondWindBuffDuration;
                player.secondWindActiveTimer = player.secondWindBuffDuration;
                player.secondWindUsedThisCombat = true;
            }

            enemies.splice(i, 1);

            if (player.hp <= 0) {
                if (player.phoenixProtocolEnabled && !player.phoenixProtocolUsed) {
                    player.hp = player.maxHp * 0.5;
                    player.phoenixProtocolUsed = true;
                    player.isInvulnerable = true; player.invulnerableTimer = 1500;
                } else if (player.hasOwnProperty('deathDefianceUsed') && player.deathDefianceUsed === false ) {
                    player.hp = 1;
                    player.deathDefianceUsed = true;
                    player.isInvulnerable = true; player.invulnerableTimer = 1000;
                }
                else {
                    gameOver();
                    return;
                }
            }
        }
    }
}

// gameLoop wurde hierher verschoben, da es die Kernlogik ist
function gameLoop(currentTime) {
    if (!gameRunning && gameState !== 'paused_augment' && gameState !== 'paused_class_choice' && gameState !== 'paused_second_class_choice' && gameState !== 'paused_menu') {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    animationFrameId = requestAnimationFrame(gameLoop);
    if (!currentTime) currentTime = performance.now();
    const deltaTime = currentTime - lastLoopTime;
    const cappedDeltaTime = Math.max(0, Math.min(deltaTime, 100));
    lastLoopTime = currentTime;

    if (gameRunning && gameState === 'game' && player) {
        if (player.hpRegenRate > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + player.hpRegenRate * (cappedDeltaTime / 1000));
        }
        if (player.lowHpRegenThreshold > 0 && player.hp < player.maxHp * player.lowHpRegenThreshold && (player.lowHpRegenRate || 0) > 0) {
            player.hp = Math.min(player.maxHp, player.hp + player.lowHpRegenRate * (cappedDeltaTime / 1000));
        }
        if (player.maxShield > 0 && player.shield < player.maxShield && (player.shieldRegenRate || 0) > 0) {
            if (Date.now() - (player.shieldLastHitTime || 0) > (player.shieldRechargeDelay || 3000)) {
                player.shield = Math.min(player.maxShield, player.shield + player.shieldRegenRate * (cappedDeltaTime / 1000));
            }
        }
        if (player.adrenalineTimer > 0) {
            player.adrenalineTimer -= cappedDeltaTime;
            if(player.adrenalineTimer < 0) player.adrenalineTimer = 0;
        }
        if (player.isInvulnerable && player.invulnerableTimer > 0) {
            player.invulnerableTimer -= cappedDeltaTime;
            if (player.invulnerableTimer <= 0) {
                player.isInvulnerable = false;
                player.invulnerableTimer = 0;
            }
        }
        if (player.invulnOnHitTimer > 0) {
            player.invulnOnHitTimer -= cappedDeltaTime;
            if(player.invulnOnHitTimer < 0) player.invulnOnHitTimer = 0;
        }

        if (player.secondWindActiveTimer > 0) {
            player.secondWindActiveTimer -= cappedDeltaTime;
             if(player.secondWindActiveTimer < 0) player.secondWindActiveTimer = 0;
        }

        if (player.orbitalStrike && player.orbitalStrike.active) {
            if (player.orbitalStrike.timer > 0) {
                player.orbitalStrike.timer -= (cappedDeltaTime / 1000);
            }
            if (player.orbitalStrike.timer <= 0) {
                createExplosion(player.x, player.y, 150 * (player.areaDamageMultiplier || 1.0), player.orbitalStrike.damage, 'player_effect', 'cyan', 500);
                player.orbitalStrike.timer = player.orbitalStrike.cooldown;
            }
        }
        if (player.dashTimer > 0 && !player.isDashing) {
            player.dashTimer -= cappedDeltaTime;
            if (player.dashTimer < 0) player.dashTimer = 0;
        }
        // Divine Intervention Timer
        if (player.divineIntervention?.enabled) {
            if (player.divineIntervention.activeBuffTimer > 0) {
                player.divineIntervention.activeBuffTimer -= cappedDeltaTime;
                if (player.divineIntervention.activeBuffTimer <= 0) {
                    // Remove buff effect specifically
                    if (player.divineIntervention.activeBuff === 'invulnerability' && player.invulnerableTimer <= player.divineIntervention.duration) {
                         player.isInvulnerable = false;
                         if(player.invulnerableTimer <= player.divineIntervention.duration) player.invulnerableTimer = 0; // Nur zurücksetzen wenn dieser Buff die Quelle war
                    }
                    if (player.divineIntervention.activeBuff === 'rapid_regen') player.tempRapidRegenActive = false;
                    if (player.divineIntervention.activeBuff === 'infinite_ammo') player.tempInfiniteAmmoActive = false;

                    player.divineIntervention.activeBuff = null;
                    player.divineIntervention.activeBuffTimer = 0;
                }
            } else { // Nur wenn kein Buff aktiv ist, Cooldown für nächsten Buff prüfen
                 player.divineIntervention.timer -= cappedDeltaTime;
                 if (player.divineIntervention.timer <= 0) {
                    player.divineIntervention.timer = player.divineIntervention.interval;
                    const buffType = player.divineIntervention.possibleBuffs[Math.floor(Math.random() * player.divineIntervention.possibleBuffs.length)];
                    player.divineIntervention.activeBuff = buffType;
                    player.divineIntervention.activeBuffTimer = player.divineIntervention.duration;
                    // Apply immediate start of buff if needed
                    if (buffType === 'invulnerability') { player.isInvulnerable = true; player.invulnerableTimer = Math.max(player.invulnerableTimer, player.divineIntervention.duration); }
                    if (buffType === 'rapid_regen') player.tempRapidRegenActive = true;
                    if (buffType === 'infinite_ammo') player.tempInfiniteAmmoActive = true;
                    if (buffType === 'max_crit') player.tempMaxCritActive = true; // Flag für max_crit
                }
            }
            // Apply continuous part of buff (rapid_regen)
            if (player.divineIntervention.activeBuff === 'rapid_regen' && player.tempRapidRegenActive && player.hp < player.maxHp) {
                player.hp = Math.min(player.maxHp, player.hp + 25 * (cappedDeltaTime / 1000)); // Stärkere Regeneration
            }
        }


        updatePlayer(cappedDeltaTime);
        updateBullets(cappedDeltaTime);
        updateEnemies(cappedDeltaTime);
        updateXPOrbs(cappedDeltaTime);
        updateActiveEffects(cappedDeltaTime);
        checkCollisions();
    }

    clearCanvas();
    if (player) drawPlayer();
    drawEnemies();
    drawBullets();
    drawXPOrbs();
    drawActiveEffects();
    if (player) updateGameUI();
}
// --- END VIRTUAL FILE: game_logic.js ---