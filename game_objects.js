// game_objects.js

function initPlayer() {
    // Lade Meta-Fortschritt (angenommen, metaProgress ist global verfügbar und wurde von loadMetaProgress in utils.js gefüllt)
    // Die Boni sind bereits in metaProgress.bonus... berechnet.

    player = {
        // Basiswerte des Spielers für diesen Run (Meta-Boni sind hier schon drin)
        baseStats: {
            maxHp: (100 + metaProgress.bonusStartHp),
            damage: (5 + metaProgress.bonusBaseDamage),
            speed: (2 + metaProgress.bonusBaseSpeed),
            shotsPerSecond: (2.0 + metaProgress.bonusBaseShotsPerSecond),
            bulletSpeed: (4 + metaProgress.bonusBulletSpeed),
            numProjectiles: (1 + metaProgress.bonusNumProjectiles),
            projectileSpreadAngle: 0, // Kann durch Meta-Upgrades beeinflusst werden, wenn gewünscht
            bulletPiercing: (0 + metaProgress.bonusBulletPiercing),
            critChance: (0.05 + metaProgress.bonusCritChance),
            critDamageMultiplier: (1.5 + metaProgress.bonusCritDamageMultiplier),
            xpCollectionRadiusMultiplier: (1.0 + (metaProgress.bonusXpRadiusFactor || 0)), // Falls als Faktor
            luckFactor: (1.0 + metaProgress.bonusLuckFactor),
            projectileSizeMultiplier: 1.0, // Meta könnte dies beeinflussen
            areaDamageMultiplier: 1.0,   // Meta könnte dies beeinflussen
            knockbackMultiplier: 1.0,  // Meta könnte dies beeinflussen
            pickupRadiusMultiplier: 1.0,   // Meta könnte dies beeinflussen
            rerollsPerLevel: BASE_REROLLS_PER_CHOICE + metaProgress.permanentRerolls,
            maxAmmo: Math.floor(PLAYER_BASE_MAX_AMMO * (metaProgress.bonusMaxAmmoFactor || 1.0)),
            reloadTime: Math.floor(PLAYER_BASE_RELOAD_TIME * (metaProgress.bonusReloadSpeedFactor || 1.0)),
        },

        // Aktuelle In-Run Werte (initialisiert aus Basiswerten + Schwierigkeit, dann von Augments modifiziert)
        level: 1,
        x: canvas.width / 2, y: canvas.height - 30, radius: 10,
        angle: -Math.PI / 2,
        color: getCssVar('--player-color') || '#00FFFF',

        maxHp: 0, hp: 0,
        effectiveBaseDamage: 0, damageMultiplier: 1.0,
        shotsPerSecond: 0, fireRate: 0, lastShotTime: 0,
        speed: 0,
        bulletSpeed: 0, bulletColor: getCssVar('--bullet-color') || '#FFFF00',
        numProjectiles: 0, projectileSpreadAngle: 0, bulletPiercing: 0,
        critChance: 0, critDamageMultiplier: 0,
        xpCollectionRadiusMultiplier: 1.0, luckFactor: 1.0,
        projectileSizeMultiplier: 1.0, areaDamageMultiplier: 1.0,
        knockbackMultiplier: 1.0, pickupRadiusMultiplier: 1.0,

        currentRerolls: 0, specializationsChosen: 0,
        guardianWave: { enabled: false, damageFactor: 0.25, radius: 40, lastProcTime: 0, cooldown: 200 },
        activeAugmentations: [],

        hpRegenRate: 0, damageReduction: 0.0,
        xpGainMultiplier: 1.0, dodgeChance: 0.0, healingAmp: 1.0, credits: 0, hpOnKill: 0, evasionChance: 0.0,

        elementalChance: { fire: 0.0, ice: 0.0, lightning: 0.0, poison: 0.0 },
        fireDotDuration: 3000, fireDotDamageFactor: 0.1, iceSlowFactor: 0.2, iceSlowDuration: 2000,
        lightningChainTargets: 0, lightningChainDamageFactor: 0.5, poisonDotDuration: 5000, poisonDotDamageFactor: 0.05,
        globalElementalChanceBonus: 0, globalElementalDamageBonus: 1.0,

        projectileBounces: 0, bouncingProjectileDamageBonusPerBounce: 0.1,

        maxShield: 0, shield: 0, shieldRechargeDelay: 3000, shieldRegenRate: 0, shieldLastHitTime: 0,
        unstableShieldCoreActive: false, unstableShieldCoreDamage: 20, unstableShieldCorePushback: 50,

        statusEffectDurationMultiplier: 1.0, critKnockbackBonus: 0.0,
        slowOnHitChance: 0.0, slowOnHitFactor: 0.15, slowOnHitDuration: 2000,

        lifeStealPercent: 0.0, homingStrength: 0.0,
        bulletExplosionChance: 0.0, bulletExplosionRadius: 50, bulletExplosionDamage: 10,
        aoeOnDespawnDamage: 0,

        adrenalineOnKill: false, adrenalineTimer: 0, adrenalineDuration: 3000,
        adrenalineMoveSpeedBonus: 0.1, adrenalineFireRateBonus: 0.1,

        isGlassCannon: false,

        invulnOnHitChance: 0.0, invulnOnHitDuration: 1000, invulnOnHitCooldown: 10000,
        invulnOnHitTimer: 0, isInvulnerable: false, invulnerableTimer: 0,

        chainReactionOnDeath: false, chainReactionDamagePercent: 0.15,

        critCausesBleed: false, bleedDpsPercentOfHit: 0.3, bleedDuration: 3000,

        berserkerFuryActive: false,

        orbitalStrike: { active: false, damage: 50, cooldown: 20, timer: 0 },

        lowHpRegenThreshold: 0.0, lowHpRegenRate: 0,

        timeFreezeChance: 0.0, timeFreezeDuration: 2000,

        phoenixProtocolEnabled: false, phoenixProtocolUsed: false, deathDefianceUsed: undefined,

        isElementalOverlord: false,

        adaptiveArmor: { active: false, currentResistance: 0.0, maxResistance: 0.25, increment: 0.05, lastDamageType: null },

        secondWindEnabled: false, secondWindThreshold: 0.1, secondWindBuffDuration: 3000,
        secondWindFireRateBonus: 0.5, secondWindUsedThisCombat: false, secondWindActiveTimer: 0,

        omniCritActive: false, duplicatorRoundsChance: 0.0,

        vampiricEmbraceMaxHpGainCap: 50, vampiricEmbraceCurrentHpGain: 0,

        trueStrikeActive: false, armorPenetration: 0.0,

        augmentSynergizerActive: false, synergyDamageBonus: 0, synergyMaxHpBonus: 0,

        ultimateSacrificePending: false,

        canDash: true, dashCooldown: 1500, dashTimer: 0, dashDuration: 200,
        dashActiveTimer: 0, dashSpeedMultiplier: 3.0, isDashing: false,
        dashDirection: {x:0, y:0}, dashDamage: 0, dashInvulnDuration: 0,

        nonCritStreak: 0, nonCritStreakThreshold: 3,
        guaranteedCritNextShot: false, guaranteedCritDamageBonus: 0.25,

        elementalCascadeActive: false,
        critAoeDamagePercent: 0, critAoeRadius: 30, critRicochetChance: 0, critRicochetDamageFactor: 0.5,
        phantomStrikeShotInterval: 0, phantomStrikeDamageFactor: 0.75, phantomStrikeCounter: 0,
        runCurrency: 0,

        // Munitionssystem
        maxAmmo: 0, // Wird unten gesetzt
        currentAmmo: 0, // Wird unten gesetzt
        reloadTime: 0, // Wird unten gesetzt
        isReloading: false,
        reloadTimer: 0, // ms
        maxAmmoMultiplier: 1.0, // Für Augments
        reloadTimeMultiplier: 1.0, // Für Augments
    };

    // Initialisiere aktuelle Run-Stats basierend auf BasisStats und Schwierigkeitsgrad
    let difficultyHpFactor = 1.0;
    let difficultyDamageFactor = 1.0;
    let difficultySpeedFactor = 1.0;
    let difficultyShotsPerSecondFactor = 1.0;
    let difficultyEnemyHpFactor = 1.0;
    let difficultyEnemySpeedFactor = 1.0;


    if (gameSettings.selectedDifficulty === 'Easy') {
        difficultyHpFactor = 1.2; // Spieler hat mehr HP
        difficultyDamageFactor = 1.1; // Spieler macht mehr Schaden
        // Gegner-Modifikatoren werden in spawnEnemy verwendet
    } else if (gameSettings.selectedDifficulty === 'Hard') {
        difficultyHpFactor = 0.8;
        difficultyDamageFactor = 0.9;
    }

    player.maxHp = Math.floor(player.baseStats.maxHp * difficultyHpFactor);
    player.hp = player.maxHp;
    player.effectiveBaseDamage = player.baseStats.damage * difficultyDamageFactor;

    player.shotsPerSecond = player.baseStats.shotsPerSecond * difficultyShotsPerSecondFactor;
    player.fireRate = 1000 / player.shotsPerSecond;

    player.speed = player.baseStats.speed * difficultySpeedFactor;
    player.bulletSpeed = player.baseStats.bulletSpeed;
    player.numProjectiles = player.baseStats.numProjectiles;
    player.projectileSpreadAngle = player.baseStats.projectileSpreadAngle;
    player.bulletPiercing = player.baseStats.bulletPiercing;
    player.critChance = player.baseStats.critChance;
    player.critDamageMultiplier = player.baseStats.critDamageMultiplier;
    player.xpCollectionRadiusMultiplier = player.baseStats.xpCollectionRadiusMultiplier;
    player.luckFactor = player.baseStats.luckFactor;
    player.currentRerolls = player.baseStats.rerollsPerLevel;

    // Munition initialisieren
    player.maxAmmo = Math.floor(player.baseStats.maxAmmo); // Meta-Boni sind schon in baseStats.maxAmmo verrechnet
    player.currentAmmo = player.maxAmmo;
    player.reloadTime = player.baseStats.reloadTime; // Meta-Boni sind schon in baseStats.reloadTime verrechnet
}


function spawnEnemy() {
    if (!player || !canvas) return;
    const size = 15 + Math.random() * 10;
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { x = Math.random() * canvas.width; y = -size -10;
    } else if (side === 1) { x = canvas.width + size + 10; y = Math.random() * canvas.height;
    } else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + size + 10;
    } else { x = -size -10 ; y = Math.random() * canvas.height; }

    let difficultyEnemyHpFactor = 1.0;
    let difficultyEnemySpeedFactor = 1.0;
    let xpMultiplierEnemy = 1.0;

    if (gameSettings.selectedDifficulty === 'Easy') {
        difficultyEnemyHpFactor = 0.75; difficultyEnemySpeedFactor = 0.8; xpMultiplierEnemy = 0.8;
    } else if (gameSettings.selectedDifficulty === 'Hard') {
        difficultyEnemyHpFactor = 1.5; difficultyEnemySpeedFactor = 1.2; xpMultiplierEnemy = 1.2;
    }

    const baseEnemyHp = ENEMY_BASE_HP + player.level * ENEMY_HP_PER_LEVEL + size * ENEMY_HP_PER_SIZE;
    const baseEnemySpeed = ENEMY_BASE_SPEED_MIN + Math.random() * ENEMY_BASE_SPEED_RANDOM_ADD + (player.level * ENEMY_SPEED_PER_LEVEL);

    const hp = Math.floor(baseEnemyHp * difficultyEnemyHpFactor);
    const speed = baseEnemySpeed * difficultyEnemySpeedFactor;

    const enemyColor1 = getCssVar('--enemy-color1') || '#FF0000';
    const enemyColor2 = getCssVar('--enemy-color2') || '#800080';
    const color = Math.random() < 0.5 ? enemyColor1 : enemyColor2;
    const uniqueId = Math.random().toString(36).substr(2, 9) + Date.now();

    enemies.push({
        x, y, width: size, height: size,
        speed, currentSpeed: speed,
        hp, maxHp: hp, color,
        angle: Math.PI / 2,
        isDefeated: false,
        statusEffects: { active: {} },
        isFrozen: false,
        freezeTimer: 0,
        uniqueId: uniqueId,
        xpValue: Math.floor((10 + Math.floor(size)) * xpMultiplierEnemy),
    });
}

function updatePlayer(dT) {
    if (!player) return;

    // Dash Timer & Cooldown
    if (player.dashTimer > 0 && !player.isDashing) {
         player.dashTimer -= dT;
         if(player.dashTimer < 0) player.dashTimer = 0;
    }
    if (player.dashActiveTimer > 0) {
        player.dashActiveTimer -= dT;
        if (player.dashActiveTimer <= 0) {
            player.isDashing = false;
            player.dashActiveTimer = 0;
            if (player.invulnerableTimer > 0 && player.dashInvulnDuration > 0 && player.invulnerableTimer <= player.dashInvulnDuration ) {
               player.isInvulnerable = false;
               player.invulnerableTimer = 0;
            }
        }
    }

    // Reload Timer
    if (player.isReloading) {
        player.reloadTimer -= dT;
        if (player.reloadTimer <= 0) {
            player.currentAmmo = player.maxAmmo;
            player.isReloading = false;
            player.reloadTimer = 0;
        }
    }

    // Bewegung
    let dx = 0; let dy = 0;
    if (!player.isDashing) {
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
    }

    // Dash Auslösung
    if (keys['shift'] && player.canDash && player.dashTimer <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashActiveTimer = player.dashDuration;
        player.dashTimer = player.dashCooldown;
        if (player.dashInvulnDuration > 0) {
            player.isInvulnerable = true;
            player.invulnerableTimer = Math.max(player.invulnerableTimer, player.dashInvulnDuration);
        }
        player.dashDirection = (dx === 0 && dy === 0) ?
            { x: Math.cos(player.angle), y: Math.sin(player.angle) } :
            { x: dx / Math.sqrt(dx*dx + dy*dy), y: dy / Math.sqrt(dx*dx + dy*dy) };
        dx = player.dashDirection.x; dy = player.dashDirection.y; // Bewegung durch Dash überschreiben
    }

    // Effektive Geschwindigkeit berechnen
    let effectiveSpeed = player.speed;
    if (player.isDashing) {
        effectiveSpeed *= player.dashSpeedMultiplier;
    } else if (player.adrenalineTimer > 0) {
        effectiveSpeed *= (1 + player.adrenalineMoveSpeedBonus);
    }
    if (player.kineticStormBonus?.enabled && (dx !== 0 || dy !== 0 || player.isDashing) ) { // Bonus wenn in Bewegung
        let speedBonusFactor = 1 + player.kineticStormBonus.damageBonusMoving;
        if (player.hp < player.maxHp * player.kineticStormBonus.lowHpThreshold) {
            speedBonusFactor = 1 + (player.kineticStormBonus.damageBonusMoving * player.kineticStormBonus.lowHpMultiplier);
        }
        // Dieser Bonus ist für Schaden/FR, nicht direkt Speed, siehe Schadensberechnung unten
    }


    if (dx !== 0 || dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const actualSpeed = effectiveSpeed * (dT / (1000 / 60));
        player.x += (dx / magnitude) * actualSpeed;
        player.y += (dy / magnitude) * actualSpeed;

        if (player.isDashing && player.dashDamage > 0) {
            enemies.forEach((e, index) => {
                if (e.isDefeated || e.dashedThisDash) return;
                const dist = Math.sqrt(Math.pow(player.x - (e.x + e.width/2), 2) + Math.pow(player.y - (e.y + e.height/2), 2));
                if (dist < player.radius + e.width / 2) {
                    e.hp -= player.dashDamage; e.dashedThisDash = true;
                    if (e.hp <= 0) handleEnemyDefeat(e, index, 'dash_collision');
                }
            });
        }
    }
    if (player.isDashing && player.dashActiveTimer <=0) {
        enemies.forEach(e => e.dashedThisDash = false);
    }

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    if (!player.isDashing) player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Schusslogik
    let effectiveShotsPerSecond = player.shotsPerSecond;
    if (player.adrenalineTimer > 0) effectiveShotsPerSecond *= (1 + player.adrenalineFireRateBonus);
    if (player.secondWindActiveTimer > 0) effectiveShotsPerSecond *= (1 + player.secondWindFireRateBonus);
    if (player.kineticStormBonus?.enabled && (dx !== 0 || dy !== 0 || player.isDashing)) {
        let frBonus = player.kineticStormBonus.fireRateBonusMoving;
        if (player.hp < player.maxHp * player.kineticStormBonus.lowHpThreshold) {
            frBonus *= player.kineticStormBonus.lowHpMultiplier;
        }
        effectiveShotsPerSecond *= (1 + frBonus);
    }

    const effectiveFireRateDelay = 1000 / effectiveShotsPerSecond;

    // Manuelles Nachladen
    if (keys['r'] && !player.isReloading && player.currentAmmo < player.maxAmmo) {
        player.isReloading = true;
        player.reloadTimer = player.reloadTime;
    }

    if ((keys[' '] || mouse.down) && Date.now() - player.lastShotTime > effectiveFireRateDelay && !player.isDashing && !player.isReloading) {
        if (player.currentAmmo > 0) {
            player.currentAmmo--;
            const cannonEndX = player.x + Math.cos(player.angle) * (player.radius + 2);
            const cannonEndY = player.y + Math.sin(player.angle) * (player.radius + 2);
            let bulletElement = null;

            if (player.isElementalOverlord) {
                const elements = ['fire', 'ice', 'lightning', 'poison'].filter(el => player.elementalChance[el] === undefined || player.elementalChance[el] >= 0);
                if (elements.length > 0) bulletElement = elements[Math.floor(Math.random() * elements.length)];
            }

            let projectileCount = player.numProjectiles;
             if (player.phantomStrikeShotInterval > 0) {
                player.phantomStrikeCounter = (player.phantomStrikeCounter || 0) + 1;
                if (player.phantomStrikeCounter >= player.phantomStrikeShotInterval) {
                     bullets.push({
                        x: cannonEndX, y: cannonEndY, width: 4 * (player.projectileSizeMultiplier || 1.0), height: 10 * (player.projectileSizeMultiplier || 1.0),
                        color: 'rgba(173, 216, 230, 0.7)',
                        speed: player.bulletSpeed * 1.1, angle: player.angle,
                        damage: (player.effectiveBaseDamage * player.damageMultiplier) * (player.phantomStrikeDamageFactor || 0.75),
                        owner: 'player_phantom', spawnTime: Date.now(),
                        piercingLeft: 999, bouncesLeft: 0, element: null, hitEnemies: [],
                        uniqueId: Math.random().toString(36).substr(2, 9) + '_phantom'
                    });
                    player.phantomStrikeCounter = 0;
                }
            }

            for (let k = 0; k < projectileCount; k++) {
                let currentAngle = player.angle;
                if (projectileCount > 1) {
                    const totalSpread = player.projectileSpreadAngle * (Math.PI / 180);
                    const spreadPerBullet = projectileCount > 1 ? totalSpread / (projectileCount -1) : 0;
                    currentAngle += (k - (projectileCount - 1) / 2) * spreadPerBullet;
                }
                 if (player.trueStrikeActive && projectileCount > 1) currentAngle = player.angle;

                let bulletSizeFactor = player.projectileSizeMultiplier || 1.0;
                let finalBulletDamage = player.effectiveBaseDamage * player.damageMultiplier;
                if (player.velocityDynamo?.enabled) {
                    const speedBonus = (effectiveSpeed / player.baseStats.speed) - 1; // % Bonus Speed
                    finalBulletDamage *= (1 + (Math.max(0, speedBonus) * 100 * player.velocityDynamo.damageConversionFactor / 2) ); // 1% dmg per 2% bonus speed
                }
                 if (player.kineticStormBonus?.enabled && (dx !== 0 || dy !== 0 || player.isDashing) ) {
                    let dmgBonus = player.kineticStormBonus.damageBonusMoving;
                    if (player.hp < player.maxHp * player.kineticStormBonus.lowHpThreshold) {
                        dmgBonus *= player.kineticStormBonus.lowHpMultiplier;
                    }
                    finalBulletDamage *= (1 + dmgBonus);
                }


                bullets.push({
                    x: cannonEndX, y: cannonEndY,
                    width: 3 * bulletSizeFactor, height: 8 * bulletSizeFactor,
                    color: player.bulletColor, speed: player.bulletSpeed,
                    angle: currentAngle, damage: finalBulletDamage,
                    owner: 'player', spawnTime: Date.now(),
                    piercingLeft: player.bulletPiercing, bouncesLeft: player.projectileBounces,
                    element: bulletElement, canDuplicate: player.duplicatorRoundsChance > 0,
                    homingStrength: player.homingStrength,
                    canExplodeOnImpact: player.bulletExplosionChance > 0 && Math.random() < player.bulletExplosionChance,
                    hitEnemies: [], uniqueId: Math.random().toString(36).substr(2, 9)
                });
            }
            player.lastShotTime = Date.now();

            if (player.guardianWave && player.guardianWave.enabled && Date.now() - (player.guardianWave.lastProcTime || 0) > (player.guardianWave.cooldown || 200)) {
                enemies.forEach((e, index) => {
                    if (e.isDefeated) return;
                    const dist = Math.sqrt(Math.pow(e.x + e.width/2 - player.x, 2) + Math.pow(e.y + e.height/2 - player.y, 2));
                    if (dist < (player.guardianWave.radius || 40) * (player.areaDamageMultiplier || 1.0) ) {
                        let waveDamage = (player.effectiveBaseDamage * player.damageMultiplier) * (player.guardianWave.damageFactor || 0.25);
                        if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                            waveDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                        }
                        e.hp -= waveDamage;
                        if (e.hp <= 0) { handleEnemyDefeat(e, index, 'guardian_wave'); }
                    }
                });
                player.guardianWave.lastProcTime = Date.now();
            }
        } else if (player.currentAmmo <= 0 && !player.isReloading) { // Automatisches Nachladen
            player.isReloading = true;
            player.reloadTimer = player.reloadTime;
        }
    }
}

function updateBullets(dT) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const moveSpeed = b.speed * (dT / (1000 / 60));

        if (b.homingStrength > 0 && b.owner === 'player' && enemies.length > 0) {
            let closestEnemy = null;
            let minDistSq = (150 * b.homingStrength)**2;

            enemies.forEach(e => {
                if (e.isDefeated) return;
                const distSq = (e.x + e.width/2 - b.x)**2 + (e.y + e.height/2 - b.y)**2;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    closestEnemy = e;
                }
            });
            if (closestEnemy) {
                const targetAngle = Math.atan2(closestEnemy.y + closestEnemy.height/2 - b.y, closestEnemy.x + closestEnemy.width/2 - b.x);
                let angleDiff = targetAngle - b.angle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                const turnSpeedFactor = Math.min(1, b.homingStrength * 0.15 * (dT / 16.66));
                b.angle += angleDiff * turnSpeedFactor;
            }
        }

        b.x += Math.cos(b.angle) * moveSpeed;
        b.y += Math.sin(b.angle) * moveSpeed;

        if (b.bouncesLeft > 0) {
            let bounced = false;
            const effectiveWidth = b.width * (player && player.projectileSizeMultiplier || 1.0);
            const effectiveHeight = b.height * (player && player.projectileSizeMultiplier || 1.0);

            if ((b.x - effectiveWidth/2 <= 0 && Math.cos(b.angle) < 0) || (b.x + effectiveWidth/2 >= canvas.width && Math.cos(b.angle) > 0)) {
                b.angle = Math.PI - b.angle;
                b.x = Math.max(effectiveWidth/2 + 1, Math.min(canvas.width - effectiveWidth/2 - 1, b.x));
                bounced = true;
            }
            if ((b.y - effectiveHeight/2 <= 0 && Math.sin(b.angle) < 0) || (b.y + effectiveHeight/2 >= canvas.height && Math.sin(b.angle) > 0)) {
                b.angle = -b.angle;
                 b.y = Math.max(effectiveHeight/2 + 1, Math.min(canvas.height - effectiveHeight/2 - 1, b.y));
                bounced = true;
            }
            if (bounced) {
                b.bouncesLeft--;
                b.hitEnemies = [];
                if (player && player.bouncingProjectileDamageBonusPerBounce) {
                    b.damage *= (1 + player.bouncingProjectileDamageBonusPerBounce);
                }
            }
        }

        if (b.y < -b.height*3 || b.y > canvas.height + b.height*3 || b.x < -b.width*3 || b.x > canvas.width + b.width*3) {
            if (player && player.aoeOnDespawnDamage > 0 && b.owner === 'player') {
                createExplosion(b.x, b.y, 25 * (player.areaDamageMultiplier || 1.0), player.aoeOnDespawnDamage, 'player_effect', 'rgba(100,100,200,0.5)', 150);
            }
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies(dT) {
    if (!player) return;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isDefeated) continue;

        e.currentSpeed = e.speed;

        if (e.statusEffects.active.ice && e.statusEffects.active.ice.duration > 0) {
            e.currentSpeed *= (1 - e.statusEffects.active.ice.slowFactor);
            e.statusEffects.active.ice.duration -= dT;
            if (e.statusEffects.active.ice.duration <= 0) delete e.statusEffects.active.ice;
        }
        if (e.isFrozen && e.freezeTimer > 0) {
            e.currentSpeed = 0;
            e.freezeTimer -= dT;
            if (e.freezeTimer <= 0) e.isFrozen = false;
        }
        if (e.statusEffects.active.stun && e.statusEffects.active.stun.duration > 0) { // Stun-Effekt
            e.currentSpeed = 0;
            e.statusEffects.active.stun.duration -= dT;
            if (e.statusEffects.active.stun.duration <= 0) delete e.statusEffects.active.stun;
        }

        if (e.statusEffects.active.fire && e.statusEffects.active.fire.duration > 0) {
            let fireDamageThisFrame = (e.statusEffects.active.fire.damagePerTick || 0) * (dT / 1000);
            // globalElementalDamageBonus ist schon im damagePerTick beim Anwenden berücksichtigt
            if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                fireDamageThisFrame *= (player.critDamageMultiplier * 0.5 || 0.75);
            }
            e.hp -= fireDamageThisFrame;
            e.statusEffects.active.fire.duration -= dT;
            if (e.statusEffects.active.fire.duration <= 0) delete e.statusEffects.active.fire;
            if (e.hp <= 0) { handleEnemyDefeat(e, i, 'fire_dot'); continue; }
        }
        if (e.statusEffects.active.bleed && e.statusEffects.active.bleed.duration > 0) {
            let bleedDamageThisFrame = (e.statusEffects.active.bleed.dps || 0) * (dT / 1000);
             if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                 bleedDamageThisFrame *= (player.critDamageMultiplier * 0.5 || 0.75);
            }
            e.hp -= bleedDamageThisFrame;
            e.statusEffects.active.bleed.duration -= dT;
            if (e.statusEffects.active.bleed.duration <= 0) delete e.statusEffects.active.bleed;
            if (e.hp <= 0) { handleEnemyDefeat(e, i, 'bleed_dot'); continue; }
        }
         if (e.statusEffects.active.poison && e.statusEffects.active.poison.duration > 0) {
            let poisonDamageThisFrame = (e.statusEffects.active.poison.dps || 0) * (dT / 1000);
             if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                 poisonDamageThisFrame *= (player.critDamageMultiplier * 0.5 || 0.75);
            }
            e.hp -= poisonDamageThisFrame;
            e.statusEffects.active.poison.duration -= dT;
            if (e.statusEffects.active.poison.duration <= 0) delete e.statusEffects.active.poison;
            if (e.hp <= 0) { handleEnemyDefeat(e, i, 'poison_dot'); continue; }
        }

        if (e.currentSpeed > 0) {
            const dxToPlayer = player.x - (e.x + e.width / 2);
            const dyToPlayer = player.y - (e.y + e.height / 2);
            const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
            e.angle = Math.atan2(dyToPlayer, dxToPlayer);

            if (distToPlayer > e.width / 2) {
                e.x += (dxToPlayer / distToPlayer) * e.currentSpeed * (dT / (1000 / 60));
                e.y += (dyToPlayer / distToPlayer) * e.currentSpeed * (dT / (1000 / 60));
            }
        }
        if (e.y > canvas.height + e.height * 2 || e.y < -e.height * 2 || e.x > canvas.width + e.width * 2 || e.x < -e.width * 2) {
            enemies.splice(i, 1);
        }
    }
    if (player && Math.random() < ENEMY_SPAWN_BASE_CHANCE + (player.level * ENEMY_SPAWN_LEVEL_FACTOR) && enemies.length < ENEMY_MAX_COUNT_BASE + player.level * ENEMY_MAX_COUNT_PER_LEVEL) {
        spawnEnemy();
    }
}

function updateXPOrbs(dT) {
    if (!player) return;
    for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const o = xpOrbs[i];
        const moveSpeed = o.speed * (dT / (1000 / 60));
        const collectionRadius = (player.radius + 40) * (player.pickupRadiusMultiplier || 1.0) * (player.xpCollectionRadiusMultiplier || 1.0);
        const dx = player.x - o.x;
        const dy = player.y - o.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < collectionRadius) {
            if (d > player.radius / 2) {
                o.x += (dx / d) * moveSpeed * 1.8 * (d < collectionRadius / 2 ? 2.5 : 1);
                o.y += (dy / d) * moveSpeed * 1.8 * (d < collectionRadius / 2 ? 2.5 : 1);
            }
        }
        if (d < player.radius + o.size / 2) {
            gainXP(o.value);
            xpOrbs.splice(i, 1);
        } else if (o.y > canvas.height + 20 || o.y < -20 || o.x > canvas.width + 20 || o.x < -20) {
            xpOrbs.splice(i, 1);
        }
    }
}