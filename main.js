    const screens = {
        startMenu: document.getElementById('startMenuScreen'),
        game: document.getElementById('gameScreen'),
        gameOver: document.getElementById('gameOverScreen')
    };
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const gameUi = document.getElementById('gameUi');
    const levelDisplay = document.getElementById('levelDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const hpDisplay = document.getElementById('hpDisplay');
    const maxHpDisplay = document.getElementById('maxHpDisplay');
    const xpBarElement = document.getElementById('xpBar');
    const xpProgressTextElement = document.getElementById('xpProgressText');
    const augmentationChoicePanel = document.getElementById('augmentationChoicePanel');
    const augmentationPanelTitle = document.getElementById('augmentationPanelTitle');
    const augmentationChoicesContainer = document.getElementById('augmentationChoices');
    const rerollButtonElement = document.getElementById('rerollButtonElement');
    const rerollsAvailableDisplay = document.getElementById('rerollsAvailableDisplay');

    const startGameButton = document.getElementById('startGameButton');
    const restartGameButton = document.getElementById('restartGameButton');

    if (canvas) { canvas.width = 800; canvas.height = 600; }
    let gameState = 'startMenu';
    let gameRunning = false;
    let animationFrameId;

    let player;
    let bullets = [];
    let enemies = [];
    let xpOrbs = [];
    let activeEffects = [];

    let keys = {};
    let mouse = { x: 0, y: 0, down: false };

    let score = 0;
    let currentLevelXP = 0;
    let xpToNextLevel = 40;
    const BASE_REROLLS_PER_CHOICE = 3;
    // Track chosen class specializations for the current run
    let chosenSpecializations = [];

    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    const CLASS_SPECIALIZATIONS = [
            {
        id: "class_overdrive_positive",
        name: "Hyper Drive System",
        description: "<span class='positive'>+60% Fire Rate, +25% Projectile Speed, +20% Movement Speed, +10% Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.shotsPerSecond = (p.shotsPerSecond || p.baseShotsPerSecond) * 1.60;
            p.fireRate = 1000 / p.shotsPerSecond;
            p.bulletSpeed = (p.bulletSpeed || p.baseBulletSpeed) * 1.25;
            p.speed = (p.speed || p.baseSpeed) * 1.20;
            p.damageMultiplier = (p.damageMultiplier || 1.0) * 1.10;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_overdrive_positive")) chosenSpecializations.push("class_overdrive_positive");
        }
    },
    {
        id: "class_heavy_artillery",
        name: "Heavy Artillery",
        description: "<span class='positive'>+80% Damage, Projectiles Pierce +2 enemies, +15% Max HP.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.damageMultiplier = (p.damageMultiplier || 1.0) * 1.80;
            p.bulletPiercing = (p.bulletPiercing || 0) + 2;
            const hpBoost = Math.floor((p.baseMaxHp || 100) * 0.15); // Nutzt p.baseMaxHp aus initPlayer
            p.maxHp = (p.maxHp || p.baseMaxHp) + hpBoost;
            p.hp = Math.min(p.hp + hpBoost, p.maxHp);
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_heavy_artillery")) chosenSpecializations.push("class_heavy_artillery");
        }
    },
    {
        id: "class_spreadshot_master",
        name: "Spreadshot Master",
        description: "<span class='positive'>+4 Projectiles, Projectile Spread slightly increased (+10°), +15% Projectile Speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.numProjectiles = (p.numProjectiles || p.baseNumProjectiles) + 4;
            p.projectileSpreadAngle = (p.projectileSpreadAngle || p.baseProjectileSpreadAngle) + 10;
            p.bulletSpeed = (p.bulletSpeed || p.baseBulletSpeed) * 1.15;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_spreadshot_master")) chosenSpecializations.push("class_spreadshot_master");
        }
    },
    {
        id: "class_apex_predator",
        name: "Apex Predator",
        description: "<span class='positive'>+25% Critical Hit Chance, +125% Critical Hit Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.critChance = (p.critChance || p.baseCritChance) + 0.25;
            p.critDamageMultiplier = (p.critDamageMultiplier || p.baseCritDamageMultiplier) + 1.25;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_apex_predator")) chosenSpecializations.push("class_apex_predator");
        }
    },
    {
        id: "class_bulwark_protocol",
        name: "Bulwark Protocol",
        description: "<span class='positive'>Shooting emits a damaging wave (scales with your damage), +50 Max HP, +10% Damage Reduction.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.guardianWave = p.guardianWave || { enabled: false, damageFactor: 0.25, radius: 40, lastProcTime: 0, cooldown: 200 }; // Initialisieren, falls nicht vorhanden
            p.guardianWave.enabled = true;
            p.guardianWave.damageFactor = (p.guardianWave.damageFactor || 0.25) + 0.1;
            p.guardianWave.radius = (p.guardianWave.radius || 40) + 5; // Original war 45
            p.guardianWave.cooldown = (p.guardianWave.cooldown || 200) - 20; // Original war 180
            const hpBoost = 50;
            p.maxHp = (p.maxHp || p.baseMaxHp) + hpBoost;
            p.hp = Math.min(p.hp + hpBoost, p.maxHp);
            p.damageReduction = (p.damageReduction || 0) + 0.10;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_bulwark_protocol")) chosenSpecializations.push("class_bulwark_protocol");
        }
    },

    // 15 Neue Klassen-Spezialisierungen (angepasst)
    {
        id: "class_temporal_master",
        name: "Temporal Master",
        description: "<span class='positive'>Projectiles have a 10% chance to briefly stun enemies (1.5s). +25% Movement Speed, +35% Projectile Speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.stunChanceOnHit = (p.stunChanceOnHit || 0) + 0.10; // Stun Logik muss in checkCollisions implementiert werden
            p.stunDuration = 1500;
            p.speed = (p.speed || p.baseSpeed) * 1.25;
            p.bulletSpeed = (p.bulletSpeed || p.baseBulletSpeed) * 1.35;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_temporal_master")) chosenSpecializations.push("class_temporal_master");
        }
    },
    {
        id: "class_elemental_conduit",
        name: "Elemental Conduit",
        description: "<span class='positive'>+35% Global Elemental Chance, +60% Global Elemental Damage. Elemental effects are more potent (e.g. +2 Lightning Chains).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.globalElementalChanceBonus = (p.globalElementalChanceBonus || 0) + 0.35;
            p.globalElementalDamageBonus = (p.globalElementalDamageBonus || 1.0) * 1.60;
            p.lightningChainTargets = (p.lightningChainTargets || 0) + 2;
            // Weitere "potenter" Effekte (Feuer DoT Stärke, Eis Dauer/Slow Stärke) müssten in applyElementalEffect angepasst werden,
            // oder hier spezifische Multiplikatoren/Boni für diese Effekte setzen.
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_elemental_conduit")) chosenSpecializations.push("class_elemental_conduit");
        }
    },
    {
        id: "class_vampiric_reaver",
        name: "Vampiric Reaver",
        description: "<span class='positive'>+6% Lifesteal. Killing an enemy grants +4% Damage for 6s (stacks up to 10 times).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.lifeStealPercent = (p.lifeStealPercent || 0) + 0.06;
            p.killStreakDamageBonus = { // Diese Logik muss in handleEnemyDefeat (für Stack-Erhöhung) und updatePlayer (für Stack-Abbau/Bonus-Anwendung) implementiert werden
                enabled: true,
                bonusPerStack: 0.04,
                maxStacks: 10,
                duration: 6000,
                currentStacks: 0,
                timer: 0,
                activeDamageBonus: 0 // Temporärer Speicher für den aktiven Bonus
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_vampiric_reaver")) chosenSpecializations.push("class_vampiric_reaver");
        }
    },
    {
        id: "class_unseen_assassin",
        name: "Unseen Assassin",
        description: "<span class='positive'>First hit on an enemy is a guaranteed Critical Hit with +150% bonus Critical Damage. +15% base Critical Hit Chance.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.firstHitCritBonus = { enabled: true, bonusCritDamage: 1.50 }; // Logik in checkCollisions (Bullet-Hit) benötigt
            p.critChance = (p.critChance || p.baseCritChance) + 0.15;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_unseen_assassin")) chosenSpecializations.push("class_unseen_assassin");
        }
    },
    {
        id: "class_colossus_armor",
        name: "Colossus Armor",
        description: "<span class='positive'>+120 Max HP, +20% Damage Reduction, +2.5 HP/sec Regeneration.</span>",
        rarity: "Legendary",
        apply: (p) => {
            const hpBoost = 120;
            p.maxHp = (p.maxHp || p.baseMaxHp) + hpBoost;
            p.hp = Math.min(p.hp + hpBoost, p.maxHp);
            p.damageReduction = (p.damageReduction || 0) + 0.20;
            p.hpRegenRate = (p.hpRegenRate || 0) + 2.5;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_colossus_armor")) chosenSpecializations.push("class_colossus_armor");
        }
    },
    {
        id: "class_bullet_virtuoso",
        name: "Bullet Virtuoso",
        description: "<span class='positive'>+2 Projectiles. Projectiles gain +20% Homing Strength and Pierce +1 additional enemy.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.numProjectiles = (p.numProjectiles || p.baseNumProjectiles) + 2;
            p.homingStrength = (p.homingStrength || 0) + 0.20;
            p.bulletPiercing = (p.bulletPiercing || 0) + 1;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_bullet_virtuoso")) chosenSpecializations.push("class_bullet_virtuoso");
        }
    },
    {
        id: "class_nova_pulsar",
        name: "Nova Pulsar",
        description: "<span class='positive'>Critical hits release a potent energy nova, damaging nearby enemies. Greatly increased Area Damage (+50%).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.critNova = { enabled: true, damageFactor: 0.75, radius: 70 }; // Logik in checkCollisions (bei Crit) benötigt
            p.areaDamageMultiplier = (p.areaDamageMultiplier || 1.0) * 1.50;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_nova_pulsar")) chosenSpecializations.push("class_nova_pulsar");
        }
    },
    {
        id: "class_chrono_accelerant",
        name: "Chrono Accelerant",
        description: "<span class='positive'>+80% Fire Rate, +30% Movement Speed. Dash cooldown significantly reduced (-60%).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.shotsPerSecond = (p.shotsPerSecond || p.baseShotsPerSecond) * 1.80;
            p.fireRate = 1000 / p.shotsPerSecond;
            p.speed = (p.speed || p.baseSpeed) * 1.30;
            p.dashCooldown = (p.dashCooldown || 1500) * 0.40;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_chrono_accelerant")) chosenSpecializations.push("class_chrono_accelerant");
        }
    },
    {
        id: "class_aegis_fortress",
        name: "Aegis Fortress",
        description: "<span class='positive'>Grants +100 Max Shield. Shield recharges 60% faster (delay & rate). Shield explodes on break dealing 75 damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            // Initialisiere Schildsystem falls nicht vorhanden (kopiert von 'shield_capacity_s' Augmentierung)
            if (!p.maxShield || p.maxShield === 0) {
                p.maxShield = 0;
                p.shield = 0;
                p.shieldRechargeDelay = p.shieldRechargeDelay || 3000; // Standardwert aus initPlayer
                p.shieldRegenRate = 0; // Wird unten gesetzt/erhöht
                if (!p.activeAugmentations) p.activeAugmentations = [];
                if (!p.activeAugmentations.some(aug => aug.id === 'shield_system_online')) {
                    p.activeAugmentations.push({ id: 'shield_system_online', rarity: 'System' });
                }
            }
            p.maxShield += 100;
            p.shield = Math.min(p.shield + 100, p.maxShield);
            if (p.shieldRegenRate === 0 && p.maxShield > 0) p.shieldRegenRate = (0.05 * p.maxShield); // Setze Basis-Regenrate

            p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.40;
            p.shieldRegenRate = (p.shieldRegenRate || (0.05 * p.maxShield)) * 1.60; // Erhöhe aktuelle oder Basis-Regenrate

            p.unstableShieldCoreActive = true; // Dein Code hat bereits unstableShieldCore Logik
            p.unstableShieldCoreDamage = 75;
            p.unstableShieldCorePushback = (p.unstableShieldCorePushback || 50); // Behalte alten Wert oder setze Default

            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_aegis_fortress")) chosenSpecializations.push("class_aegis_fortress");
        }
    },
    {
        id: "class_fate_weaver",
        name: "Fate Weaver",
        description: "<span class='positive'>Massively increased Luck Factor (+150%). Augment choices always include one of a higher rarity (if possible). Gain +2 base Rerolls.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.luckFactor = (p.luckFactor || p.baseLuckFactor) * 2.50;
            p.guaranteedHigherRarityChoice = true; // Diese Logik muss in getWeightedRandomAugmentation implementiert werden
            p.bonusRerolls = (p.bonusRerolls || 0) + 2; // Passt zur Berechnung in levelUp
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_fate_weaver")) chosenSpecializations.push("class_fate_weaver");
        }
    },
    {
        id: "class_kinetic_storm",
        name: "Kinetic Storm",
        description: "<span class='positive'>Gain +30% Damage and +30% Fire Rate while moving. These bonuses are doubled when below 35% HP.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.kineticStormBonus = { // Diese Logik muss in updatePlayer implementiert werden, um Boni dynamisch anzuwenden
                enabled: true,
                damageBonusMoving: 0.30,
                fireRateBonusMoving: 0.30,
                lowHpThreshold: 0.35,
                lowHpMultiplier: 2.0,
                isActive: false // Wird in updatePlayer gesetzt
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_kinetic_storm")) chosenSpecializations.push("class_kinetic_storm");
        }
    },
    {
        id: "class_storm_caller",
        name: "Storm Caller",
        description: "<span class='positive'>All projectiles have a 35% chance to become chain lightning, striking up to 4 foes. +60% Lightning Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.projectilesBecomeChainLightningChance = 0.35; // Logik beim Abfeuern von Kugeln (updatePlayer) oder in checkCollisions (beim ersten Treffer)
            p.chainLightningMaxBounces = 4;
            p.elementalChance = (p.elementalChance || {});
            // Diese Klasse garantiert nicht, dass alle Schüsse Blitze sind, sondern gibt eine Chance, dass Projektile zu Kettenblitzen werden.
            // Der Bonus auf Lightning Damage wirkt, wenn ein Blitz ausgelöst wird.
            p.lightningDamageMultiplier = (p.lightningDamageMultiplier || 1.0) * 1.60; // Spezifischer Multiplikator für Blitzschaden
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_storm_caller")) chosenSpecializations.push("class_storm_caller");
        }
    },
    {
        id: "class_velocity_dynamo",
        name: "Velocity Dynamo",
        description: "<span class='positive'>+15% Base Movement Speed. Convert 1.5% of your total movement speed into bonus weapon damage per point of speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.baseSpeed *= 1.15; // Erhöhe den tatsächlichen Basiswert
            p.speed = (p.speed / (p.baseSpeed / 1.15)) * p.baseSpeed; // Skaliere aktuellen Speed proportional mit

            p.velocityDynamo = { enabled: true, damageConversionFactor: 0.00015 }; // 1.5% pro Speed-Einheit ist viel, eher 0.015% oder 0.15%? 0.015 / 100 = 0.00015 für den Faktor. Annahme: 0.015 bedeutet 1.5facher Bonus, nicht +1.5%. Wenn es +1.5% des Speeds als Schadensbonus ist, dann eher damageMultiplier += p.speed * 0.015. Hier: Bonus-Schadensmultiplikator wird p.speed * factor. Diese Logik muss in updatePlayer oder Schadensberechnung.
            // Nehmen wir an, es ist ein direkter Multiplikator auf den Schaden:
            // p.damageMultiplier *= (1 + (p.speed * 0.015)); // Dies müsste aber dynamisch in updatePlayer geschehen.
            // Die Klasse aktiviert nur den Mechanismus.
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_velocity_dynamo")) chosenSpecializations.push("class_velocity_dynamo");
        }
    },
    {
        id: "class_soul_harvester",
        name: "Soul Harvester",
        description: "<span class='positive'>Each XP orb collected grants +0.15 Max HP and +0.03% Damage (stacks for current run). +60% XP Collection Radius.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.soulHarvester = { enabled: true, hpPerOrb: 0.15, damagePercentPerOrb: 0.0003, collectedOrbs: 0 }; // Logik in gainXP oder XP Orb Kollision
            p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || p.baseXpCollectionRadiusMultiplier) * 1.60;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_soul_harvester")) chosenSpecializations.push("class_soul_harvester");
        }
    },
    {
        id: "class_divine_interventionist",
        name: "Divine Interventionist",
        description: "<span class='positive'>Every 25 seconds, gain a random powerful 5-second buff (Invulnerability, Max Crit, Infinite Ammo, Rapid Regen).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.divineIntervention = { // Logik für Timer und Buff-Aktivierung in updatePlayer
                enabled: true,
                interval: 25000,
                duration: 5000,
                timer: 25000, // Startet "geladen" oder 0 für ersten Cooldown
                activeBuff: null,
                activeBuffTimer: 0,
                possibleBuffs: ['invulnerability', 'max_crit', 'infinite_ammo', 'rapid_regen'] // Infinite Ammo & Max Crit müssten im Schuss-Code beachtet werden
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_divine_interventionist")) chosenSpecializations.push("class_divine_interventionist");
        }
    }
    ];

    const ALL_AUGMENTATIONS = [
        // Common
        { id: "hp_boost_s", name: "+15 Max HP", description: "Small health increase.", rarity: "Common", apply: (p) => { p.maxHp = (p.maxHp || 0) + 15; p.hp = Math.min((p.hp || 0) + 15, p.maxHp); }},
        { id: "dmg_boost_s", name: "+7% Damage", description: "Minor damage increase.", rarity: "Common", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.07; }},
        { id: "firerate_boost_s", name: "+7% Fire Rate", description: "Minor fire rate increase.", rarity: "Common", apply: (p) => { p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 1.07; p.fireRate = 1000 / p.shotsPerSecond; }},
        { id: "speed_boost_s", name: "+5% Speed", description: "Minor speed increase.", rarity: "Common", apply: (p) => { p.speed = (p.speed || 1.0) * 1.05; }},
        { id: "xp_radius_s", name: "Magnet S", description: "+25% XP Collection Radius", rarity: "Common", apply: (p) => { p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || 1.0) * 1.25; }},
        { id: "hp_regen_s", name: "Regenerative Nanites S", description: "+0.5 HP/sec Regen.", rarity: "Common", apply: (p) => { p.hpRegenRate = (p.hpRegenRate || 0) + 0.5; }},
        { id: "dmg_reduction_s", name: "Ballistic Weave S", description: "Reduce incoming damage by 3%.", rarity: "Common", apply: (p) => { p.damageReduction = (p.damageReduction || 0) + 0.03; }},
        { id: "ammo_capacity_s", name: "Extra Pockets S", description: "+10% Max Ammo.", rarity: "Common", apply: (p) => { p.maxAmmoMultiplier = (p.maxAmmoMultiplier || 1.0) * 1.10; }},
        { id: "reload_speed_s", name: "Quick Fingers S", description: "+7% Reload Speed.", rarity: "Common", apply: (p) => { p.reloadTimeMultiplier = (p.reloadTimeMultiplier || 1.0) * 0.93; }},
        { id: "projectile_size_s", name: "Bigger Bullets S", description: "+10% Projectile Size.", rarity: "Common", apply: (p) => { p.projectileSizeMultiplier = (p.projectileSizeMultiplier || 1.0) * 1.10; }},
        { id: "xp_gain_s", name: "Fast Learner S", description: "+5% XP Gain.", rarity: "Common", apply: (p) => { p.xpGainMultiplier = (p.xpGainMultiplier || 1.0) * 1.05; }},
        { id: "crit_chance_xs", name: "Faint Hope", description: "+3% Crit Chance.", rarity: "Common", apply: (p) => { p.critChance = (p.critChance || 0) + 0.03; }},
        { id: "knockback_s", name: "Impact Rounds S", description: "+10% Knockback Strength.", rarity: "Common", apply: (p) => { p.knockbackMultiplier = (p.knockbackMultiplier || 1.0) * 1.10; }},
        { id: "pickup_range_m", name: "Magnet M", description: "+50% Pickup Radius (XP, HP, etc.).", rarity: "Common", apply: (p) => { p.pickupRadiusMultiplier = (p.pickupRadiusMultiplier || 1.0) * 1.50; p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || 1.0) * 1.50; }},
        { id: "dodge_chance_s", name: "Slight of Foot S", description: "+3% Dodge Chance.", rarity: "Common", apply: (p) => { p.dodgeChance = (p.dodgeChance || 0) + 0.03; }},
        { id: "healing_amp_s", name: "Med-Kit Upgrade S", description: "+10% all incoming HP healing.", rarity: "Common", apply: (p) => { p.healingAmp = (p.healingAmp || 1.0) * 1.10; }},
        { id: "credits_s", name: "Small Stash", description: "Gain 50 Credits immediately.", rarity: "Common", apply: (p) => { p.credits = (p.credits || 0) + 50; }},

        // Uncommon
        { id: "hp_boost_m", name: "+35 Max HP", description: "Medium health increase.", rarity: "Uncommon", apply: (p) => { p.maxHp = (p.maxHp || 0) + 35; p.hp = Math.min((p.hp || 0) + 35, p.maxHp); }},
        { id: "dmg_boost_m", name: "+15% Damage", description: "Medium damage increase.", rarity: "Uncommon", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.15; }},
        { id: "firerate_boost_m", name: "+15% Fire Rate", description: "Medium fire rate increase.", rarity: "Uncommon", apply: (p) => { p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 1.15; p.fireRate = 1000 / p.shotsPerSecond; }},
        { id: "crit_chance_s", name: "Critical Lens S", description: "+7% Crit Chance", rarity: "Uncommon", apply: (p) => { p.critChance = (p.critChance || 0) + 0.07; }},
        { id: "proj_speed_s", name: "Velocity Coils S", description: "+15% Projectile Speed", rarity: "Uncommon", apply: (p) => { p.bulletSpeed = (p.bulletSpeed || 1.0) * 1.15; }},
        { id: "hp_on_kill_s", name: "Vampiric Touch S", description: "Heal 1 HP on Kill.", rarity: "Uncommon", apply: (p) => { p.hpOnKill = (p.hpOnKill || 0) + 1; }},
        { id: "evasion_s", name: "Nimble Feet S", description: "+5% Evasion Chance (separate from dodge).", rarity: "Uncommon", apply: (p) => { p.evasionChance = (p.evasionChance || 0) + 0.05; }},
        { id: "crit_damage_xs", name: "Precision Strikes XS", description: "+20% Crit Damage.", rarity: "Uncommon", apply: (p) => { p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.20; }},
        { id: "elemental_fire_chance_s", name: "Incendiary Coating S", description: "+5% Chance to Ignite enemies for 3s.", rarity: "Uncommon", apply: (p) => { p.elementalChance = (p.elementalChance || {}); p.elementalChance.fire = (p.elementalChance.fire || 0) + 0.05; p.fireDotDuration = (p.fireDotDuration || 3000); }},
        { id: "elemental_ice_chance_s", name: "Cryo Coating S", description: "+5% Chance to Chill enemies (slow 20%) for 2s.", rarity: "Uncommon", apply: (p) => { p.elementalChance = (p.elementalChance || {}); p.elementalChance.ice = (p.elementalChance.ice || 0) + 0.05; p.iceSlowFactor = (p.iceSlowFactor || 0.2); p.iceSlowDuration = (p.iceSlowDuration || 2000); }},
        { id: "projectile_bounce_s", name: "Ricochet S", description: "Projectiles bounce +1 time.", rarity: "Uncommon", apply: (p) => { p.projectileBounces = (p.projectileBounces || 0) + 1; }},
        { id: "speed_boost_m", name: "Agility Matrix M", description: "+10% Speed.", rarity: "Uncommon", apply: (p) => { p.speed = (p.speed || 1.0) * 1.10; }},
        { id: "firerate_tradeoff_dmg_s", name: "Light Trigger", description: "+15% Fire Rate, <span class='tradeoff'>-5% Damage</span>.", rarity: "Uncommon", apply: (p) => { p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 1.15; p.fireRate = 1000 / p.shotsPerSecond; p.damageMultiplier = (p.damageMultiplier || 1.0) * 0.95; }},
        { id: "area_damage_s", name: "Shrapnel S", description: "+10% Area Damage.", rarity: "Uncommon", apply: (p) => { p.areaDamageMultiplier = (p.areaDamageMultiplier || 1.0) * 1.10; }},
        { id: "shield_regen_s", name: "Shield Battery S", description: "+10% Shield Regen Rate.", rarity: "Uncommon", apply: (p) => { if(p.maxShield && p.maxShield > 0) p.shieldRegenRate = (p.shieldRegenRate || (0.05 * p.maxShield) || 1) * 1.10; }},
        { id: "status_effect_duration_s", name: "Lingering Effects S", description: "+15% Status Effect Duration (Fire, Ice, etc.).", rarity: "Uncommon", apply: (p) => { p.statusEffectDurationMultiplier = (p.statusEffectDurationMultiplier || 1.0) * 1.15; }},
        { id: "luck_xs", name: "Four-Leaf Clover Scrap", description: "+10% Luck Factor.", rarity: "Uncommon", apply: (p) => { p.luckFactor = (p.luckFactor || 1.0) * 1.10; }},
        { id: "shield_delay_reduction_s", name: "Quick Charge S", description: "-10% Shield Recharge Delay.", rarity: "Uncommon", apply: (p) => { if(p.maxShield && p.maxShield > 0) p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.90; }},
        { id: "crit_knockback_s", name: "Concussive Crits S", description: "Critical hits have +30% Knockback Strength.", rarity: "Uncommon", apply: (p) => { p.critKnockbackBonus = (p.critKnockbackBonus || 0) + 0.30; }},
        { id: "enemy_slow_on_hit_s", name: "Sticky Goo S", description: "5% chance on hit to slow enemy by 15% for 2s.", rarity: "Uncommon", apply: (p) => { p.slowOnHitChance = (p.slowOnHitChance || 0) + 0.05; p.slowOnHitFactor = 0.15; p.slowOnHitDuration = 2000; }},

        // Rare
        { id: "hp_boost_l", name: "+60 Max HP", description: "Large health increase.", rarity: "Rare", apply: (p) => { p.maxHp = (p.maxHp || 0) + 60; p.hp = Math.min((p.hp || 0) + 60, p.maxHp); }},
        { id: "dmg_boost_l", name: "+30% Damage", description: "Large damage increase.", rarity: "Rare", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.30; }},
        { id: "multishot_1", name: "Twin Barrel", description: "+1 Projectile", rarity: "Rare", apply: (p) => { p.numProjectiles = (p.numProjectiles || 1) + 1; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(5, (p.projectileSpreadAngle || 5)) : 0; }},
        { id: "crit_damage_s", name: "Sharpshooter S", description: "+40% Crit Damage", rarity: "Rare", apply: (p) => { p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.40; }},
        { id: "focused_power", name: "Focused Power", description: "+40% Dmg, <span class='tradeoff'>-15% FR</span>", rarity: "Rare", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.40; p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 0.85;p.fireRate = 1000 / p.shotsPerSecond;}},
        { id: "pierce_1", name: "Piercer Rounds", description: "Projectiles pierce +1 enemy.", rarity: "Rare", apply: (p) => { p.bulletPiercing = (p.bulletPiercing || 0) + 1; }},
        { id: "hp_regen_m", name: "Regenerative Nanites M", description: "+1.5 HP/sec Regen.", rarity: "Rare", apply: (p) => { p.hpRegenRate = (p.hpRegenRate || 0) + 1.5; }},
        { id: "dmg_reduction_m", name: "Ballistic Weave M", description: "Reduce incoming damage by 7%.", rarity: "Rare", apply: (p) => { p.damageReduction = (p.damageReduction || 0) + 0.07; }},
        { id: "multishot_spread_reduction", name: "Focus Lens", description: "-15% Projectile Spread with Multishot.", rarity: "Rare", apply: (p) => { p.projectileSpreadAngle = Math.max(0, (p.projectileSpreadAngle || 5) * 0.85); }},
        { id: "life_steal_s", name: "Siphon Rounds S", description: "1% of damage dealt is returned as HP.", rarity: "Rare", apply: (p) => { p.lifeStealPercent = (p.lifeStealPercent || 0) + 0.01; }},
        { id: "elemental_lightning_chance_s", name: "Shock Inductors S", description: "+7% Chance for Lightning to Chain to 1 nearby enemy.", rarity: "Rare", apply: (p) => { p.elementalChance = (p.elementalChance || {}); p.elementalChance.lightning = (p.elementalChance.lightning || 0) + 0.07; p.lightningChainTargets = (p.lightningChainTargets || 0) + 1; }},
        { id: "homing_projectiles_s", name: "Seeker Protocol S", description: "Projectiles have slight homing capabilities.", rarity: "Rare", apply: (p) => { p.homingStrength = (p.homingStrength || 0) + 0.1; }},
        { id: "crit_chance_m", name: "Critical Lens M", description: "+12% Crit Chance.", rarity: "Rare", apply: (p) => { p.critChance = (p.critChance || 0) + 0.12; }},
        { id: "proj_speed_m", name: "Velocity Coils M", description: "+30% Projectile Speed.", rarity: "Rare", apply: (p) => { p.bulletSpeed = (p.bulletSpeed || 1.0) * 1.30; }},
        { id: "explosive_rounds_s", name: "HE Rounds S", description: "5% chance for bullets to explode on impact (small AoE).", rarity: "Rare", apply: (p) => { p.bulletExplosionChance = (p.bulletExplosionChance || 0) + 0.05; p.bulletExplosionRadius = (p.bulletExplosionRadius || 50); p.bulletExplosionDamage = (p.bulletExplosionDamage || 10); }},
        { id: "shield_capacity_s", name: "Energy Shield S", description: "+25 Max Shield. Activates shield system if not present.", rarity: "Rare", apply: (p) => { if (!p.maxShield || p.maxShield === 0) { p.maxShield = 0; p.shield = 0; p.shieldRechargeDelay = p.shieldRechargeDelay || 3000; p.shieldRegenRate = p.shieldRegenRate || 0; } p.maxShield += 25; if(p.shieldRegenRate === 0 && p.maxShield > 0) p.shieldRegenRate = 0.05 * p.maxShield; p.shield = Math.min((p.shield || 0) + 25, p.maxShield); if (!p.activeAugmentations) p.activeAugmentations = []; if(!p.activeAugmentations.some(aug => aug.id === 'shield_system_online')) {p.activeAugmentations.push({id:'shield_system_online', rarity: 'System'});} }},
        { id: "adrenaline_rush_s", name: "Adrenaline Junkie", description: "+10% Move Speed & Fire Rate for 3s after a kill.", rarity: "Rare", apply: (p) => { p.adrenalineOnKill = true; p.adrenalineDuration = 3000; p.adrenalineMoveSpeedBonus = 0.10; p.adrenalineFireRateBonus = 0.10; }},
        { id: "pierce_2", name: "Adamantium Rounds", description: "Projectiles pierce +2 enemies.", rarity: "Rare", apply: (p) => { p.bulletPiercing = (p.bulletPiercing || 0) + 2; }},
        { id: "glass_cannon_s", name: "Glass Cannon", description: "+50% Damage, <span class='tradeoff'>Max HP set to 50</span>.", rarity: "Rare", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.50; p.maxHp = 50; p.hp = Math.min(p.hp, p.maxHp); p.isGlassCannon = true; }},
        { id: "homing_strength_m", name: "Advanced Targeting M", description: "+25% Homing Strength for projectiles.", rarity: "Rare", apply: (p) => { p.homingStrength = (p.homingStrength || 0) + 0.25; }},
        { id: "multishot_tradeoff_firerate_s", name: "Splitter Module", description: "+1 Projectile, <span class='tradeoff'>-10% Fire Rate</span>.", rarity: "Rare", apply: (p) => { p.numProjectiles = (p.numProjectiles || 1) + 1; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(5, (p.projectileSpreadAngle || 5)) : 0; p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 0.90; p.fireRate = 1000 / p.shotsPerSecond; }},
        { id: "damage_on_dash_s", name: "Kinetic Dash S", description: "Dashing through enemies deals 25 damage.", rarity: "Rare", apply: (p) => { p.dashDamage = (p.dashDamage || 0) + 25; }},

        // Epic
        { id: "overcharge", name: "Overcharge", description: "+25% FR, +10% Dmg, <span class='tradeoff'>-15 Max HP</span>", rarity: "Epic", apply: (p) => { p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 1.25; p.fireRate = 1000/p.shotsPerSecond; p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.10; p.maxHp = Math.max(10, (p.maxHp || 0) - 15); p.hp = Math.min(p.hp, p.maxHp);}},
        { id: "luck_s", name: "Lucky Charm", description: "Better Augment Rarity", rarity: "Epic", apply: (p) => { p.luckFactor = (p.luckFactor || 1.0) * 1.25; }},
        { id: "crit_mastery", name: "Critical Mastery", description: "+10% Crit Chance, +50% Crit Dmg", rarity: "Epic", apply: (p) => { p.critChance = (p.critChance || 0) + 0.10; p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.50; }},
        { id: "elemental_mastery_s", name: "Elemental Affinity", description: "+10% Elemental Effect Chance, +15% Elemental Damage.", rarity: "Epic", apply: (p) => { p.globalElementalChanceBonus = (p.globalElementalChanceBonus || 0) + 0.10; p.globalElementalDamageBonus = (p.globalElementalDamageBonus || 1.0) * 1.15; }},
        { id: "invulnerability_on_hit_s", name: "Reactive Armor S", description: "20% chance for 1s invulnerability on taking damage (10s cooldown).", rarity: "Epic", apply: (p) => { p.invulnOnHitChance = 0.20; p.invulnOnHitDuration = 1000; p.invulnOnHitCooldown = 10000; p.invulnOnHitTimer = 0; }},
        { id: "chain_reaction_s", name: "Chain Reaction", description: "Enemies explode on death, dealing 15% of their max HP as damage to nearby enemies.", rarity: "Epic", apply: (p) => { p.chainReactionOnDeath = true; p.chainReactionDamagePercent = 0.15; }},
        { id: "crit_causes_bleed", name: "Grievous Wounds", description: "Critical hits also cause enemies to bleed for 30% of hit damage over 3s.", rarity: "Epic", apply: (p) => { p.critCausesBleed = true; p.bleedDpsPercentOfHit = 0.30; p.bleedDuration = 3000; }},
        { id: "multishot_2", name: "Triple Barrel", description: "+2 Projectiles.", rarity: "Epic", apply: (p) => { p.numProjectiles = (p.numProjectiles || 1) + 2; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(10, (p.projectileSpreadAngle || 5)) : 0; }},
        { id: "shield_recharge_delay_reduction_m", name: "Fast Charge M", description: "-30% Shield Recharge Delay.", rarity: "Epic", apply: (p) => { if(p.maxShield && p.maxShield > 0) p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.70; }},
        { id: "xp_radius_l", name: "Magnet L", description: "+100% XP Collection Radius.", rarity: "Epic", apply: (p) => { p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || 1.0) * 2.00; p.pickupRadiusMultiplier = (p.pickupRadiusMultiplier || 1.0) * 2.00;}},
        { id: "berserker_fury", name: "Berserker's Fury", description: "+1% Damage for every 1% HP missing.", rarity: "Epic", apply: (p) => { p.berserkerFuryActive = true; }},
        { id: "orbital_striker_s", name: "Orbital Strike Beacon", description: "Calls down a small laser strike every 20 seconds.", rarity: "Epic", apply: (p) => { p.orbitalStrike = { active: true, damage: 50, cooldown: 20, timer: 20 }; }}, // Timer in seconds
        { id: "regenerative_plating_epic", name: "Regenerative Plating", description: "If HP is below 25%, regenerate 5 HP/sec.", rarity: "Epic", apply: (p) => { p.lowHpRegenThreshold = 0.25; p.lowHpRegenRate = 5; }},
        { id: "luck_m", name: "Rabbit's Foot", description: "+40% Luck Factor.", rarity: "Epic", apply: (p) => { p.luckFactor = (p.luckFactor || 1.0) * 1.40; }},
        { id: "aoe_size_l", name: "Expansive Ordnance L", description: "+30% Area of Effect size for all AoE.", rarity: "Epic", apply: (p) => { p.areaDamageMultiplier = (p.areaDamageMultiplier || 1.0) * 1.30; }},
        { id: "max_hp_percent_boost_s", name: "Vitality Core", description: "+15% Max HP.", rarity: "Epic", apply: (p) => { const baseMaxHpForCalc = p.baseMaxHp || p.maxHp; const boost = Math.floor(baseMaxHpForCalc * 0.15); p.maxHp = (p.maxHp || 0) + boost; p.hp = Math.min((p.hp || 0) + boost, p.maxHp); }},
        { id: "temporary_invulnerability_on_dash", name: "Phase Dash", description: "Dash grants 0.25s of invulnerability.", rarity: "Epic", apply: (p) => { p.dashInvulnDuration = 250; }}, // ms
        { id: "elemental_cascade", name: "Elemental Cascade", description: "Enemies dying with a status effect explode with that element.", rarity: "Epic", apply: (p) => { p.elementalCascadeActive = true; }},
        { id: "crit_ricochet", name: "Critical Deflection", description: "Critical hits have 50% chance to ricochet to a nearby enemy for 50% damage.", rarity: "Epic", apply: (p) => {p.critRicochetChance = 0.5; p.critRicochetDamageFactor = 0.5; }},
        { id: "phantom_strike_s", name: "Phantom Strike", description: "Every 5th shot fires an additional phantom projectile that pierces all enemies and deals 75% damage.", rarity: "Epic", apply: (p) => { p.phantomStrikeShotInterval = 5; p.phantomStrikeDamageFactor = 0.75; p.phantomStrikeCounter = 0;}},
        { id: "precision_focus", name: "Precision Focus", description: "After 3 non-critical hits in a row, your next hit is a guaranteed critical hit with +25% crit damage.", rarity: "Epic", apply: (p) => {p.nonCritStreakThreshold = 3; p.guaranteedCritDamageBonus = 0.25; p.nonCritStreak = 0; p.guaranteedCritNextShot = false;}},


        // Legendary
        { id: "legendary_power_surge", name: "Power Surge", description: "+75% Damage!", rarity: "Legendary", apply: (p) => { p.damageMultiplier = (p.damageMultiplier || 1.0) + 0.75; }},
        { id: "legendary_bullet_hell", name: "Bullet Hell", description: "+50% Fire Rate, +2 Projectiles!", rarity: "Legendary", apply: (p) => { p.shotsPerSecond = (p.shotsPerSecond || 1.0) * 1.5; p.fireRate = 1000/p.shotsPerSecond; p.numProjectiles = (p.numProjectiles || 1) +2; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(10, (p.projectileSpreadAngle || 5)) : 0;}},
        { id: "legendary_omni_shield", name: "Omni-Shield", description: "+50 Max Shield, Shield recharges faster.", rarity: "Legendary", apply: (p) => { if (!p.maxShield || p.maxShield === 0) { p.maxShield = 0; p.shield = 0;} p.maxShield += 50; if(p.shieldRegenRate === 0 && p.maxShield > 0) p.shieldRegenRate = (0.05 * p.maxShield) || 2.5; p.shield = Math.min((p.shield || 0) + 50, p.maxShield); if(!p.activeAugmentations) p.activeAugmentations = []; if(!p.activeAugmentations.some(aug => aug.id === 'shield_system_online')) {p.activeAugmentations.push({id:'shield_system_online', rarity: 'System'});} p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.7; p.shieldRegenRate = p.shieldRegenRate * 1.3;}},
        { id: "temporal_distortion", name: "Temporal Distortion", description: "10% chance on hit to freeze enemy in time for 2s. You move 15% faster.", rarity: "Legendary", apply: (p) => { p.timeFreezeChance = 0.10; p.timeFreezeDuration = 2000; p.speed = (p.speed || 1.0) * 1.15; }},
        // Blackhole Projectiles removed
        { id: "phoenix_protocol", name: "Phoenix Protocol", description: "Revive once per run with 50% HP.", rarity: "Legendary", apply: (p) => { p.phoenixProtocolEnabled = true; p.phoenixProtocolUsed = false; }},
        { id: "elemental_overlord", name: "Elemental Overlord", description: "All shots are imbued with random elemental effects (Fire, Ice, Lightning, Poison). +25% Elemental Damage & Chance.", rarity: "Legendary", apply: (p) => { p.isElementalOverlord = true; p.globalElementalDamageBonus = (p.globalElementalDamageBonus || 1.0) * 1.25; p.globalElementalChanceBonus = (p.globalElementalChanceBonus || 0) + 0.25; }},
        { id: "adaptive_armor_legendary", name: "Adaptive Armor", description: "Gain +5% resistance to the last damage type received (stacks up to 25%). Resets on new damage type.", rarity: "Legendary", apply: (p) => { p.adaptiveArmor = { active: true, currentResistance: 0, maxResistance: 0.25, increment: 0.05, lastDamageType: null }; }},
        { id: "second_wind_legendary", name: "Second Wind", description: "Once per combat, if HP drops below 10%, gain +50% fire rate and invulnerability for 3 seconds.", rarity: "Legendary", apply: (p) => { p.secondWindEnabled = true; p.secondWindThreshold = 0.10; p.secondWindBuffDuration = 3000; p.secondWindFireRateBonus = 0.50; p.secondWindUsedThisCombat = false; }},
        { id: "omni_crit_legendary", name: "Omni-Crit", description: "All damage can crit (AoE, Status etc.). Non-weapon damage has 50% of your crit chance/damage.", rarity: "Legendary", apply: (p) => { p.omniCritActive = true; }},
        { id: "duplicator_rounds_legendary", name: "Duplicator Rounds", description: "Projectiles have a 15% chance to split into two after hitting an enemy.", rarity: "Legendary", apply: (p) => { p.duplicatorRoundsChance = 0.15; }},
        { id: "vampiric_embrace_legendary", name: "Vampiric Embrace", description: "+5% Lifesteal. Killing an enemy with lifesteal grants a temporary +1 Max HP (up to +50 per run).", rarity: "Legendary", apply: (p) => { p.lifeStealPercent = (p.lifeStealPercent || 0) + 0.05; p.vampiricEmbraceMaxHpGainCap = 50; p.vampiricEmbraceCurrentHpGain = 0; }},
        { id: "arsenal_overdrive_legendary", name: "Arsenal Overdrive", description: "+2 Projectiles, Projectiles Pierce +2, +25% Projectile Speed, <span class='tradeoff'>-10% Damage</span>.", rarity: "Legendary", apply: (p) => { p.numProjectiles = (p.numProjectiles || 1) + 2; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(10, (p.projectileSpreadAngle || 5)) : 0; p.bulletPiercing = (p.bulletPiercing || 0) + 2; p.bulletSpeed = (p.bulletSpeed || 1.0) * 1.25; p.damageMultiplier = (p.damageMultiplier || 1.0) * 0.90; }},
        { id: "true_strike_legendary", name: "True Strike", description: "Your attacks cannot miss and ignore 25% of enemy armor.", rarity: "Legendary", apply: (p) => { p.trueStrikeActive = true; p.armorPenetration = (p.armorPenetration || 0) + 0.25; }},
        { id: "augment_synergizer_legendary", name: "Synergy Core", description: "For every 3 Augments of the same Rarity you possess, gain +5% damage and +5% Max HP.", rarity: "Legendary", apply: (p) => { p.augmentSynergizerActive = true; recalculateAugmentSynergy(); }},
        { id: "ultimate_sacrifice_legendary", name: "Ultimate Sacrifice", description: "At start of next floor, permanently sacrifice 50% current HP for +30% DMG, +30% FR, +15% Speed, +15% Max HP.", rarity: "Legendary", apply: (p) => { p.ultimateSacrificePending = true; }},
        { id: "death_defiance_s_leg", name: "Cheat Death", description: "The first time you would take fatal damage, survive with 1 HP (once per run).", rarity: "Legendary", apply: (p) => { p.deathDefianceUsed = false; /* Flag to check if used */ }},
    ];

    function initPlayer() {
        player = {
            baseSpeed: 3, baseHp: 100, baseMaxHp: 100, baseDamage: 10, baseShotsPerSecond: 3.0,
            baseBulletSpeed: 5, baseNumProjectiles: 1, baseProjectileSpreadAngle: 0,
            baseBulletPiercing: 0, baseCritChance: 0.0, baseCritDamageMultiplier: 1.5,
            baseXpCollectionRadiusMultiplier: 1.0, baseLuckFactor: 1.0,
            baseProjectileSizeMultiplier: 1.0, baseAreaDamageMultiplier: 1.0,
            baseKnockbackMultiplier: 1.0, basePickupRadiusMultiplier: 1.0,

            x: canvas.width / 2, y: canvas.height - 30, radius: 10,
            color: getCssVar('--player-color') || '#00FFFF',
            speed: 2, hp: 100, maxHp: 100, level: 1, angle: -Math.PI / 2,
            damageMultiplier: 1.0, shotsPerSecond: 2.0, fireRate: 500, lastShotTime: 0,
            bulletSpeed: 4, bulletColor: getCssVar('--bullet-color') || '#FFFF00',
            numProjectiles: 1, projectileSpreadAngle: 0, bulletPiercing: 0,
            critChance: 0.0, critDamageMultiplier: 1.5,
            xpCollectionRadiusMultiplier: 1.0, luckFactor: 1.0,
            projectileSizeMultiplier: 1.0, areaDamageMultiplier: 1.0,
            knockbackMultiplier: 1.0, pickupRadiusMultiplier: 1.0,

            autoAimEnabled: false, currentRerolls: BASE_REROLLS_PER_CHOICE,
            specializationsChosen: 0,
            guardianWave: { enabled: false, damageFactor: 0.25, radius: 40, lastProcTime: 0, cooldown: 200 },
            activeAugmentations: [],

            hpRegenRate: 0, damageReduction: 0.0, maxAmmoMultiplier: 1.0, reloadTimeMultiplier: 1.0,
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

            phoenixProtocolEnabled: false, phoenixProtocolUsed: false, deathDefianceUsed: undefined, // Init as undefined to distinguish from false

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
        };
        player.fireRate = 1000 / player.shotsPerSecond;
        player.baseMaxHp = player.maxHp;
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

        const speed = 0.5 + Math.random() * 0.5 + (player.level * 0.03);
        const hp = Math.floor(10 + player.level * 5 + size * 0.5);
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
        });
    }

    function spawnXPOrb(x, y, value) {
        if (!player) return;
        const actualValue = Math.floor(value * (player.xpGainMultiplier || 1.0));
        xpOrbs.push({ x, y, value: actualValue, size: 2 + Math.log2(actualValue + 1) * 0.7, speed: 2.5, color: getCssVar('--xp-orb-color') || '#40E0D0' });
    }

    function createExplosion(x, y, radius, damage, ownerType = 'player', color = 'orange', duration = 300) {
        activeEffects.push({
            type: 'explosion', x, y, radius, currentRadius: 0, maxRadius: radius,
            damage, ownerType, color, durationMs: duration, creationTime: Date.now(), // Verwende durationMs
            damagedEnemies: []
        });
    }
    // createBlackHoleEffect wurde entfernt

    function getWeightedRandomAugmentation(pool, currentOffer) {
        let availablePool = pool.filter(aug => {
            if (CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id)) return false;
            if (aug.rarity === "Common") { return !currentOffer.some(sel => sel.id === aug.id); }
            return !player.activeAugmentations.some(pa => pa.id === aug.id) &&
                   !currentOffer.some(sel => sel.id === aug.id);
        });

        if (availablePool.length === 0) {
            availablePool = pool.filter(aug => aug.rarity === "Common" && !currentOffer.some(sel => sel.id === aug.id));
            if (availablePool.length === 0) {
                const nonClassPool = pool.filter(aug => !CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id) && !currentOffer.some(sel => sel.id === aug.id));
                 if (nonClassPool.length > 0) return nonClassPool[Math.floor(Math.random() * nonClassPool.length)];
                const fallbackAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id) && !player.activeAugmentations.some(pa => pa.id === a.id) && !currentOffer.some(sel => sel.id === a.id));
                return fallbackAugs.length > 0 ? fallbackAugs[0] : ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id))[0];
            }
        }

        const baseWeights = {"Common": 40, "Uncommon": 30, "Rare": 18, "Epic": 8, "Legendary": 4};
        let totalWeight = 0;
        const weightedPool = availablePool.map(aug => {
            let weight = baseWeights[aug.rarity] || 1;
            if (player && player.luckFactor > 1.0) {
                if (aug.rarity === "Uncommon") weight *= player.luckFactor * 1.1;
                else if (aug.rarity === "Rare") weight *= player.luckFactor * 1.25;
                else if (aug.rarity === "Epic") weight *= player.luckFactor * 1.4;
                else if (aug.rarity === "Legendary") weight *= player.luckFactor * 1.7;
            }
            totalWeight += weight;
            return { ...aug, weight };
        });

        if (totalWeight === 0) {
             if (availablePool.length > 0) return availablePool[Math.floor(Math.random() * availablePool.length)];
             const fallbackAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id) && !player.activeAugmentations.some(pa => pa.id === a.id) && !currentOffer.some(sel => sel.id === a.id));
             return fallbackAugs.length > 0 ? fallbackAugs[0] : ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id))[0];
        }

        let randomNum = Math.random() * totalWeight;
        for (let aug of weightedPool) {
            randomNum -= aug.weight;
            if (randomNum <= 0) return aug;
        }
        return weightedPool.length > 0 ? weightedPool[weightedPool.length - 1] : (availablePool.length > 0 ? availablePool[0] : ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id))[0]);
    }


    function updatePlayer(dT) {
        if (!player) return;

        if (player.dashTimer > 0 && !player.isDashing) {
             player.dashTimer -= dT;
             if(player.dashTimer < 0) player.dashTimer = 0;
        }
        if (player.dashActiveTimer > 0) {
            player.dashActiveTimer -= dT;
            if (player.dashActiveTimer <= 0) {
                player.isDashing = false;
                player.dashActiveTimer = 0;
                if (player.invulnerableTimer > 0 && player.dashInvulnDuration > 0 && player.invulnerableTimer <= player.dashInvulnDuration ) { // Nur wenn Dash die Quelle war
                   player.isInvulnerable = false;
                   player.invulnerableTimer = 0;
                }
            }
        }

        let dx = 0; let dy = 0;
        if (!player.isDashing) {
            if (keys['w'] || keys['arrowup']) dy -= 1;
            if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;
        }

        if (keys['shift'] && player.canDash && player.dashTimer <= 0 && !player.isDashing) {
            player.isDashing = true;
            player.dashActiveTimer = player.dashDuration;
            player.dashTimer = player.dashCooldown;
            if (player.dashInvulnDuration > 0) {
                player.isInvulnerable = true;
                player.invulnerableTimer = Math.max(player.invulnerableTimer, player.dashInvulnDuration);
            }

            if (dx === 0 && dy === 0) {
                const angleToMouse = Math.atan2(mouse.y - player.y, mouse.x - player.x);
                player.dashDirection = { x: Math.cos(angleToMouse), y: Math.sin(angleToMouse) };
            } else {
                const mag = Math.sqrt(dx*dx + dy*dy);
                player.dashDirection = { x: dx/mag, y: dy/mag };
            }
            dx = player.dashDirection.x;
            dy = player.dashDirection.y;
        }

        let currentSpeed = player.speed;
        if (player.isDashing) {
            currentSpeed *= player.dashSpeedMultiplier;
            dx = player.dashDirection.x;
            dy = player.dashDirection.y;
        } else {
            if (player.adrenalineTimer > 0) {
                currentSpeed *= (1 + player.adrenalineMoveSpeedBonus);
            }
        }

        if (dx !== 0 || dy !== 0) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const actualSpeed = currentSpeed * (dT / (1000 / 60));
            player.x += (dx / magnitude) * actualSpeed;
            player.y += (dy / magnitude) * actualSpeed;

            if (player.isDashing && player.dashDamage > 0) {
                enemies.forEach((e, index) => {
                    if (e.isDefeated || e.dashedThisDash) return;
                    const dist = Math.sqrt(Math.pow(player.x - (e.x + e.width/2), 2) + Math.pow(player.y - (e.y + e.height/2), 2));
                    if (dist < player.radius + e.width / 2) {
                        e.hp -= player.dashDamage;
                        e.dashedThisDash = true;
                        if (e.hp <= 0) { handleEnemyDefeat(e, index, 'dash_collision'); }
                    }
                });
            }
        }
        if (player.isDashing && player.dashActiveTimer <=0) {
            enemies.forEach(e => e.dashedThisDash = false);
        }

        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

        if (!player.isDashing) {
             player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        }

        let currentShotsPerSecond = player.shotsPerSecond;
        if (player.adrenalineTimer > 0) {
            currentShotsPerSecond *= (1 + player.adrenalineFireRateBonus);
        }
        if (player.secondWindActiveTimer > 0) {
            currentShotsPerSecond *= (1 + player.secondWindFireRateBonus);
        }
        const effectiveFireRateDelay = 1000 / currentShotsPerSecond;

        if ((keys[' '] || mouse.down) && Date.now() - player.lastShotTime > effectiveFireRateDelay && !player.isDashing) {
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
                        damage: (player.baseDamage * player.damageMultiplier) * (player.phantomStrikeDamageFactor || 0.75),
                        owner: 'player_phantom', spawnTime: Date.now(),
                        piercingLeft: 999,
                        bouncesLeft: 0, element: null, hitEnemies: [],
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
                bullets.push({
                    x: cannonEndX, y: cannonEndY,
                    width: 3 * bulletSizeFactor, height: 8 * bulletSizeFactor,
                    color: player.bulletColor, speed: player.bulletSpeed,
                    angle: currentAngle,
                    damage: player.baseDamage * player.damageMultiplier,
                    owner: 'player', spawnTime: Date.now(),
                    piercingLeft: player.bulletPiercing,
                    bouncesLeft: player.projectileBounces,
                    element: bulletElement,
                    // canCauseBlackHole removed
                    canDuplicate: player.duplicatorRoundsChance > 0,
                    homingStrength: player.homingStrength,
                    canExplodeOnImpact: player.bulletExplosionChance > 0 && Math.random() < player.bulletExplosionChance,
                    hitEnemies: [],
                    uniqueId: Math.random().toString(36).substr(2, 9)
                });
            }
            player.lastShotTime = Date.now();

            if (player.guardianWave && player.guardianWave.enabled && Date.now() - (player.guardianWave.lastProcTime || 0) > (player.guardianWave.cooldown || 200)) {
                enemies.forEach((e, index) => {
                    if (e.isDefeated) return;
                    const dist = Math.sqrt(Math.pow(e.x + e.width/2 - player.x, 2) + Math.pow(e.y + e.height/2 - player.y, 2));
                    if (dist < (player.guardianWave.radius || 40) * (player.areaDamageMultiplier || 1.0) ) {
                        let waveDamage = (player.baseDamage * player.damageMultiplier) * (player.guardianWave.damageFactor || 0.25);
                        if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                            waveDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                        }
                        e.hp -= waveDamage;
                        if (e.hp <= 0) { handleEnemyDefeat(e, index, 'guardian_wave'); }
                    }
                });
                player.guardianWave.lastProcTime = Date.now();
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

            if (e.statusEffects.active.fire && e.statusEffects.active.fire.duration > 0) {
                let fireDamageThisFrame = (e.statusEffects.active.fire.damagePerTick || 0) * (dT / 1000);
                if (player.globalElementalDamageBonus) fireDamageThisFrame *= player.globalElementalDamageBonus;
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
        if (player && Math.random() < 0.015 + (player.level * 0.003) && enemies.length < 10 + player.level * 1) {
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

    function updateActiveEffects(dT) {
        for (let i = activeEffects.length - 1; i >= 0; i--) {
            const effect = activeEffects[i];
            if (!effect.creationTime) effect.creationTime = Date.now();

            let effectMaxDuration = effect.durationMs || 300; // Default für Explosion
            // Schwarzes Loch wurde entfernt

            effect.duration = (effect.creationTime + effectMaxDuration) - Date.now();


            if (effect.type === 'explosion') {
                const lifetime = Date.now() - effect.creationTime;
                const progress = Math.min(1, lifetime / effectMaxDuration);
                effect.currentRadius = effect.maxRadius * Math.sin(progress * Math.PI / 2);

                enemies.forEach((e, enemyIdx) => {
                    if (e.isDefeated || effect.damagedEnemies.includes(e.uniqueId)) return;
                    const dist = Math.sqrt(Math.pow(e.x + e.width/2 - effect.x, 2) + Math.pow(e.y + e.height/2 - effect.y, 2));
                    if (dist < effect.currentRadius) {
                        let explosionDamage = effect.damage;
                        if (effect.ownerType === 'player' && player && player.areaDamageMultiplier) {
                            explosionDamage *= player.areaDamageMultiplier;
                        }
                        if (effect.ownerType === 'player' && player && player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)) {
                            explosionDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                        }
                        e.hp -= explosionDamage;
                        effect.damagedEnemies.push(e.uniqueId);
                        if (e.hp <= 0) { handleEnemyDefeat(e, enemyIdx, effect.ownerType === 'player_effect' ? 'player_aoe' : 'explosion'); }
                    }
                });
            }
            // else if (effect.type === 'black_hole') removed

            if (effect.duration <= 0) {
                activeEffects.splice(i, 1);
            }
        }
    }

    function applyElementalEffect(enemy, elementType, hitDamage) {
        if (!player || !enemy || enemy.isDefeated) return;
        enemy.statusEffects = enemy.statusEffects || {};
        enemy.statusEffects.active = enemy.statusEffects.active || {};

        let durationMultiplier = player.statusEffectDurationMultiplier || 1.0;
        let damageMultiplier = player.globalElementalDamageBonus || 1.0;

        switch (elementType) {
            case 'fire':
                enemy.statusEffects.active.fire = {
                    duration: (player.fireDotDuration || 3000) * durationMultiplier,
                    damagePerTick: (hitDamage * (player.fireDotDamageFactor || 0.1)) * damageMultiplier
                };
                break;
            case 'ice':
                enemy.statusEffects.active.ice = {
                    duration: (player.iceSlowDuration || 2000) * durationMultiplier,
                    slowFactor: (player.iceSlowFactor || 0.2)
                };
                break;
            case 'lightning':
                let lightningBaseDamage = hitDamage * 0.3 * damageMultiplier;
                if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)){
                    lightningBaseDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                }
                enemy.hp -= lightningBaseDamage;
                const enemyIndexForLightning = enemies.indexOf(enemy);
                if (enemy.hp <= 0) { if(enemyIndexForLightning !== -1) handleEnemyDefeat(enemy, enemyIndexForLightning, 'lightning_initial'); return; }

                let chainedTargets = 0;
                const maxChains = player.lightningChainTargets || 0;
                let currentTarget = enemy;
                let potentialTargets = [...enemies].filter(e => e.uniqueId !== currentTarget.uniqueId && !e.isDefeated);


                while(chainedTargets < maxChains && potentialTargets.length > 0) {
                    let closestNextTarget = null;
                    let minDistSq = (120*120) * (player.areaDamageMultiplier || 1.0);

                    potentialTargets.forEach(pt => {
                        const distSq = (pt.x + pt.width/2 - (currentTarget.x + currentTarget.width/2))**2 + (pt.y + pt.height/2 - (currentTarget.y + currentTarget.height/2))**2;
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            closestNextTarget = pt;
                        }
                    });

                    if (closestNextTarget) {
                        let chainDamage = hitDamage * (player.lightningChainDamageFactor || 0.5) * damageMultiplier;
                         if (player.omniCritActive && player.critChance && Math.random() < (player.critChance * 0.5)){
                            chainDamage *= (player.critDamageMultiplier * 0.5 || 0.75);
                        }
                        closestNextTarget.hp -= chainDamage;
                        // TODO: Visuellen Effekt für Kettenblitz zeichnen
                        const nextTargetIndex = enemies.indexOf(closestNextTarget);
                        if (closestNextTarget.hp <= 0) { if(nextTargetIndex !== -1) handleEnemyDefeat(closestNextTarget, nextTargetIndex, 'lightning_chain'); }

                        chainedTargets++;
                        currentTarget = closestNextTarget;
                        potentialTargets = potentialTargets.filter(pt => pt.uniqueId !== currentTarget.uniqueId);
                    } else {
                        break;
                    }
                }
                break;
            case 'bleed':
                enemy.statusEffects.active.bleed = {
                    duration: (player.bleedDuration || 3000) * durationMultiplier,
                    dps: (hitDamage * (player.bleedDpsPercentOfHit || 0.3)) / ((player.bleedDuration || 3000)/1000)
                };
                break;
            case 'poison':
                 enemy.statusEffects.active.poison = {
                    duration: (player.poisonDotDuration || 5000) * durationMultiplier,
                    dps: (hitDamage * (player.poisonDotDamageFactor || 0.05)) * damageMultiplier
                };
                break;
        }
    }

    function handleEnemyDefeat(enemy, enemyIndex, killType = 'unknown') {
        if (!player || !enemy || enemy.isDefeated) return; // Zusätzliche Prüfung für 'enemy'
        enemy.isDefeated = true;

        spawnXPOrb(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10 + Math.floor(enemy.width));
        score += 10 + Math.floor(enemy.width);

        if (player.hpOnKill > 0) {
            player.hp = Math.min(player.maxHp, player.hp + (player.hpOnKill * (player.healingAmp || 1.0)));
        }

        if (player.adrenalineOnKill) {
            player.adrenalineTimer = player.adrenalineDuration;
        }

        if (player.vampiricEmbraceMaxHpGainCap && player.lifeStealPercent > 0 && player.vampiricEmbraceCurrentHpGain < player.vampiricEmbraceMaxHpGainCap) {
            player.maxHp += 1;
            player.hp = Math.min(player.hp + 1, player.maxHp);
            player.vampiricEmbraceCurrentHpGain +=1;
        }

        if (player.chainReactionOnDeath) {
            const explosionDamage = enemy.maxHp * (player.chainReactionDamagePercent || 0.15);
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 70 * (player.areaDamageMultiplier || 1.0), explosionDamage, 'player_effect', 'darkred');
        }

        if (player.elementalCascadeActive) {
            let cascadeType = null;
            if (enemy.statusEffects && enemy.statusEffects.active) {
                if (enemy.statusEffects.active.fire) cascadeType = 'fire';
                else if (enemy.statusEffects.active.ice) cascadeType = 'ice';
                // else if (enemy.statusEffects.active.lightning) cascadeType = 'lightning'; // Lightning ist direkter Schaden, kein DoT hier
                else if (enemy.statusEffects.active.poison) cascadeType = 'poison';
            }
            if (cascadeType) {
                let cascadeColor = 'gray';
                if(cascadeType === 'fire') cascadeColor = 'orangered';
                if(cascadeType === 'ice') cascadeColor = 'deepskyblue';
                if(cascadeType === 'lightning') cascadeColor = 'yellow'; // Ggf. anpassen, wenn Blitze DoT hinterlassen
                if(cascadeType === 'poison') cascadeColor = 'greenyellow';
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 60 * (player.areaDamageMultiplier || 1.0), enemy.maxHp * 0.1, 'player_effect', cascadeColor);
            }
        }
        // Gravity Well (Blackhole) wurde entfernt

        if (enemyIndex !== -1 && enemyIndex < enemies.length && enemies[enemyIndex] && enemies[enemyIndex].uniqueId === enemy.uniqueId) {
             enemies.splice(enemyIndex, 1);
        } else {
            const actualIndex = enemies.findIndex(e => e.uniqueId === enemy.uniqueId);
            if (actualIndex !== -1) enemies.splice(actualIndex, 1);
        }
    }

    function checkCollisions() {
        if (!player) return;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b) continue; // Kugel könnte bereits entfernt worden sein
            if (b.owner !== 'player' && b.owner !== 'player_phantom') continue;

            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (!e || e.isDefeated || (b.hitEnemies && b.hitEnemies.includes(e.uniqueId))) continue;

                const bulletEffectiveWidth = b.width * (player.projectileSizeMultiplier || 1.0);
                const bulletEffectiveHeight = b.height * (player.projectileSizeMultiplier || 1.0);
                const distSq = (b.x - (e.x + e.width/2))**2 + (b.y - (e.y + e.height/2))**2;
                const enemyRadiusApprox = Math.max(e.width, e.height) / 2;
                const bulletRadiusApprox = Math.max(bulletEffectiveWidth, bulletEffectiveHeight) / 2;

                if (distSq < (enemyRadiusApprox + bulletRadiusApprox)**2 * 0.85) { // etwas großzügiger
                    let damageDealt = b.damage;

                    if (player.berserkerFuryActive) {
                        const missingHpPercent = Math.max(0, (player.maxHp - player.hp) / player.maxHp);
                        damageDealt *= (1 + missingHpPercent);
                    }
                    if (player.damageToElitesMultiplier && e.width >= 20) {
                        damageDealt *= player.damageToElitesMultiplier;
                    }

                    let wasCrit = false;
                    if (player.guaranteedCritNextShot && b.owner === 'player') {
                        damageDealt *= (player.critDamageMultiplier || 1.5) * (1 + (player.guaranteedCritDamageBonus || 0));
                        wasCrit = true;
                        player.guaranteedCritNextShot = false;
                        player.nonCritStreak = 0;
                    } else if (player.critChance && Math.random() < player.critChance && b.owner === 'player') {
                        damageDealt *= (player.critDamageMultiplier || 1.5);
                        wasCrit = true;
                        player.nonCritStreak = 0;
                    } else if (b.owner === 'player') {
                        player.nonCritStreak = (player.nonCritStreak || 0) + 1;
                        if (player.nonCritStreakThreshold && player.nonCritStreak >= player.nonCritStreakThreshold) {
                            player.guaranteedCritNextShot = true;
                        }
                    }

                    e.hp -= damageDealt;
                    if (!b.hitEnemies) b.hitEnemies = []; // Initialisieren falls nicht vorhanden
                    b.hitEnemies.push(e.uniqueId);

                    let appliedElement = b.element;
                    if (!appliedElement && player.elementalChance && b.owner === 'player') {
                        const rand = Math.random(); let cumulativeChance = 0;
                        const effectiveGlobalChance = player.globalElementalChanceBonus || 0;
                        if (player.elementalChance.fire > 0 && rand < (cumulativeChance += player.elementalChance.fire + effectiveGlobalChance)) appliedElement = 'fire';
                        else if (player.elementalChance.ice > 0 && rand < (cumulativeChance += player.elementalChance.ice + effectiveGlobalChance)) appliedElement = 'ice';
                        else if (player.elementalChance.lightning > 0 && rand < (cumulativeChance += player.elementalChance.lightning + effectiveGlobalChance)) appliedElement = 'lightning';
                        else if (player.elementalChance.poison > 0 && rand < (cumulativeChance += player.elementalChance.poison + effectiveGlobalChance)) appliedElement = 'poison';
                    }
                    if (appliedElement) applyElementalEffect(e, appliedElement, damageDealt);

                    if (player.slowOnHitChance > 0 && Math.random() < player.slowOnHitChance && b.owner === 'player') {
                        applyElementalEffect(e, 'ice', 0);
                    }
                    if (player.timeFreezeChance > 0 && Math.random() < player.timeFreezeChance && !e.isFrozen && b.owner === 'player') {
                        e.isFrozen = true;
                        e.freezeTimer = (player.timeFreezeDuration || 2000) * (player.statusEffectDurationMultiplier || 1.0);
                    }

                    if (wasCrit && b.owner === 'player') {
                        if (player.critCausesBleed) applyElementalEffect(e, 'bleed', damageDealt);
                        if (player.critKnockbackBonus > 0 && player.knockbackMultiplier) {
                            const knockbackForce = 15 * player.knockbackMultiplier * (1 + player.critKnockbackBonus);
                            e.x -= Math.cos(b.angle) * knockbackForce * 0.2;
                            e.y -= Math.sin(b.angle) * knockbackForce * 0.2;
                        }
                        if (player.critAoeDamagePercent > 0) {
                            createExplosion(e.x + e.width/2, e.y + e.height/2, (player.critAoeRadius || 30) * (player.areaDamageMultiplier || 1.0), damageDealt * player.critAoeDamagePercent, 'player_effect', 'gold');
                        }
                        if (player.critRicochetChance > 0 && Math.random() < player.critRicochetChance) {
                            let ricochetTarget = null;
                            let minDistSq = (100 * (player.areaDamageMultiplier || 1.0))**2;
                            enemies.forEach(otherE => {
                                if (otherE.uniqueId === e.uniqueId || otherE.isDefeated) return;
                                const dSq = (otherE.x + otherE.width/2 - (e.x+e.width/2))**2 + (otherE.y + otherE.height/2 - (e.y+e.height/2))**2;
                                if (dSq < minDistSq) {
                                    minDistSq = dSq;
                                    ricochetTarget = otherE;
                                }
                            });
                            if (ricochetTarget) {
                                bullets.push({ ...b, x: e.x+e.width/2, y: e.y+e.height/2, angle: Math.atan2(ricochetTarget.y + ricochetTarget.height/2 - (e.y+e.height/2), ricochetTarget.x + ricochetTarget.width/2 - (e.x+e.width/2)), damage: b.damage * (player.critRicochetDamageFactor || 0.5), piercingLeft: 0, bouncesLeft:0, hitEnemies: [e.uniqueId], uniqueId: Math.random().toString(36).substr(2,9)+"_rico", canDuplicate: false });
                            }
                        }
                    }

                    if (player.lifeStealPercent > 0 && b.owner === 'player') {
                        const healedAmount = damageDealt * player.lifeStealPercent * (player.healingAmp || 1.0);
                        player.hp = Math.min(player.maxHp, player.hp + healedAmount);
                    }

                    if (b.piercingLeft > 0) {
                        b.piercingLeft--;
                    } else if (b.canDuplicate && Math.random() < player.duplicatorRoundsChance && b.owner === 'player') {
                        b.canDuplicate = false;
                        const dupAngle1 = b.angle + Math.PI / 18; // Kleine Winkeländerung für Duplikate
                        const dupAngle2 = b.angle - Math.PI / 18;
                        bullets.push({ ...b, damage: b.damage * 0.6, uniqueId: Math.random().toString(36).substr(2, 9)+"_dup1", x: b.x, y: b.y, angle: dupAngle1, hitEnemies: [e.uniqueId], canDuplicate: false });
                        bullets.push({ ...b, damage: b.damage * 0.6, uniqueId: Math.random().toString(36).substr(2, 9)+"_dup2", x: b.x, y: b.y, angle: dupAngle2, hitEnemies: [e.uniqueId], canDuplicate: false });
                        const currentBulletIndex = bullets.indexOf(b);
                        if(currentBulletIndex !== -1) bullets.splice(currentBulletIndex, 1);
                        i--; // Wichtig, da das Array modifiziert wurde
                    } else {
                        const currentBulletIndex = bullets.indexOf(b);
                        if(currentBulletIndex !== -1) bullets.splice(i, 1);
                        i--;
                    }

                    // Blackhole wurde entfernt
                    if (b && b.canExplodeOnImpact && b.owner === 'player') { // b könnte schon entfernt sein
                        createExplosion(e.x + e.width/2, e.y + e.height/2, player.bulletExplosionRadius * (player.areaDamageMultiplier || 1.0) , player.bulletExplosionDamage, 'player');
                        if (bullets.includes(b) && !(b.piercingLeft > 0)) { // Nur entfernen, wenn nicht gepierct
                             const currentBulletIndex = bullets.indexOf(b);
                             if(currentBulletIndex !== -1) bullets.splice(currentBulletIndex, 1);
                             i--;
                        }
                    }

                    if (e.hp <= 0) {
                        handleEnemyDefeat(e, j, wasCrit ? 'crit_kill' : 'normal_kill');
                    }
                    if (!bullets[i+1] && b.piercingLeft <= 0 && !b.canDuplicate) break; // bullets[i+1] weil i dekrementiert wurde; break if bullet removed and no pierce/dup
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

                let damageTaken = 10 * (1 + player.level * 0.05);

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
                    if (player.dodgeChance > 0 && Math.random() < player.dodgeChance) { /* Gedodged */ }
                    else if (player.evasionChance > 0 && Math.random() < player.evasionChance) { /* Evaded */ }
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

    function gainXP(amount) {
        if (!player) return;
        currentLevelXP += amount;
        if (currentLevelXP >= xpToNextLevel) {
            levelUp();
        }
    }

    function levelUp() {
        if (!player) return;
        player.level++;
        currentLevelXP = Math.max(0, currentLevelXP - xpToNextLevel);
        xpToNextLevel = Math.floor(40 * Math.pow(1.15, player.level -1));
        player.hp = Math.min(player.maxHp, player.hp + (20 * (player.healingAmp || 1.0)));
        player.currentRerolls = BASE_REROLLS_PER_CHOICE + (player.bonusRerolls || 0);

        player.secondWindUsedThisCombat = false;

        if (player.ultimateSacrificePending) {
            const hpSacrifice = player.hp * 0.5;
            const oldMaxHp = player.maxHp;

            player.hp -= hpSacrifice;
            player.maxHp = Math.max(10, oldMaxHp - hpSacrifice);

            player.damageMultiplier = (player.damageMultiplier || 1.0) * 1.30;
            player.shotsPerSecond = (player.shotsPerSecond || 1.0) * 1.30;
            player.fireRate = 1000 / player.shotsPerSecond;
            player.speed = (player.speed || 1.0) * 1.15;

            const maxHpBoost = Math.floor(player.maxHp * 0.15);
            player.maxHp += maxHpBoost;
            player.baseMaxHp = player.maxHp;

            player.hp = Math.min(player.hp, player.maxHp);
            player.ultimateSacrificePending = false;
            console.log("Ultimate Sacrifice vollzogen!");
        }

        gameRunning = false;

          const MAX_SPECIALIZATIONS_TO_CHOOSE = 10; 

        // Prüfe, ob das aktuelle Level ein Vielfaches von 10 ist (und größer als 0)
        if (player.level % 10 === 0 && player.level > 0) {
            // Überprüfe, ob der Spieler noch Spezialisierungen wählen darf
            const canChooseMoreSpecializations = (player.specializationsChosen || 0) < MAX_SPECIALIZATIONS_TO_CHOOSE;
            // Und ob überhaupt noch nicht gewählte Spezialisierungen verfügbar sind:
            const availableSpecializations = CLASS_SPECIALIZATIONS.filter(spec => !chosenSpecializations.includes(spec.id));

            if (canChooseMoreSpecializations && availableSpecializations.length > 0) {
                // Es ist nicht mehr nötig, zwischen 'paused_class_choice' und 'paused_second_class_choice' zu unterscheiden.
                // Wir verwenden einen allgemeineren Gamestate oder den bestehenden.
                gameState = 'paused_specialization_choice'; // Du könntest einen neuen State definieren oder 'paused_class_choice' wiederverwenden
                augmentationPanelTitle.textContent = "Choose Your Specialization!";
                showSpecializationChoiceScreen(); // Diese Funktion zeigt die Auswahl an
            } else {
                // Keine Spezialisierung mehr möglich (Limit erreicht oder keine mehr verfügbar), also normale Augmentierung anbieten
                gameState = 'paused_augment';
                augmentationPanelTitle.textContent = "Choose Upgrade!";
                showAugmentationChoiceScreen();
            }
        } else {
            // Kein 10er-Level, also normale Augmentierung anbieten
            gameState = 'paused_augment';
            augmentationPanelTitle.textContent = "Choose Upgrade!";
            showAugmentationChoiceScreen();
        }
    }

    function showSpecializationChoiceScreen() {
        if (!augmentationChoicesContainer || !augmentationChoicePanel) return;
        augmentationChoicesContainer.innerHTML = '';
        augmentationPanelTitle.textContent = "Choose Your Specialization!";

        const availableClasses = CLASS_SPECIALIZATIONS.filter(spec => !chosenSpecializations.includes(spec.id));
        const shuffledClasses = [...availableClasses].sort(() => 0.5 - Math.random());
        const offeredClasses = shuffledClasses.slice(0, Math.min(3, availableClasses.length));

        offeredClasses.forEach(spec => {
            const card = document.createElement('div');
            card.classList.add('augmentation-card', `rarity-${spec.rarity}`);
            card.innerHTML = `<h4>${spec.name}</h4><p>${spec.description}</p><div class="rarity-text">${spec.rarity}</div>`;
            card.addEventListener('click', () => selectSpecialization(spec.id));
            augmentationChoicesContainer.appendChild(card);
        });
        augmentationChoicePanel.classList.remove('hidden');
        updateRerollUI();
    }


    function showAugmentationChoiceScreen() {
        if (!augmentationChoicesContainer || !augmentationChoicePanel || !player) return;
        augmentationPanelTitle.textContent = "Choose Upgrade!";
        augmentationChoicesContainer.innerHTML = '';
        let offeredAugs = [];

        let tempAvailableUpgrades = ALL_AUGMENTATIONS.filter(aug => {
            if (CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id)) return false;
            if (aug.rarity !== "Common" && player.activeAugmentations.some(pa => pa.id === aug.id)) {
                return false;
            }
            return true;
        });

        for(let i=0; i<3; i++){
            if (tempAvailableUpgrades.length === 0 && offeredAugs.length < 3) {
                let commonFallbackPool = ALL_AUGMENTATIONS.filter(aug => aug.rarity === "Common" && !CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id) && !offeredAugs.some(oa => oa.id === aug.id));
                if (commonFallbackPool.length > 0) {
                    offeredAugs.push(commonFallbackPool[Math.floor(Math.random() * commonFallbackPool.length)]);
                    continue;
                } else break;
            }
            if (tempAvailableUpgrades.length === 0 && offeredAugs.length >=3) break;


            let potentialAug = getWeightedRandomAugmentation(tempAvailableUpgrades, offeredAugs);
            if(potentialAug){
                offeredAugs.push(potentialAug);
                tempAvailableUpgrades = tempAvailableUpgrades.filter(aug => aug.id !== potentialAug.id);
            } else if (offeredAugs.length < 3) {
                 let fallbackPool = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id) && !offeredAugs.some(oa => oa.id === a.id) && !player.activeAugmentations.some(pa => pa.id === a.id && a.rarity !== "Common") );
                 if (fallbackPool.length > 0) offeredAugs.push(fallbackPool[Math.floor(Math.random() * fallbackPool.length)]);
                 else break;
            }
        }
        offeredAugs = offeredAugs.filter(aug => aug !== undefined).slice(0,3);


        offeredAugs.forEach(aug => {
            if(!aug) return;
            const card = document.createElement('div');
            card.classList.add('augmentation-card', `rarity-${aug.rarity}`);
            card.innerHTML = `<h4>${aug.name}</h4><p>${aug.description}</p><div class="rarity-text">${aug.rarity}</div>`;
            card.addEventListener('click', () => selectAugmentation(aug.id));
            augmentationChoicesContainer.appendChild(card);
        });
        augmentationChoicePanel.classList.remove('hidden');
        updateRerollUI();
    }

    function selectAugmentation(augmentId) {
        const aug = ALL_AUGMENTATIONS.find(a => a.id === augmentId);
        if (aug && player) {
            aug.apply(player);
            if (!player.activeAugmentations.some(pa => pa.id === aug.id && pa.rarity === aug.rarity)) {
                player.activeAugmentations.push({id: aug.id, rarity: aug.rarity});
            }
            if (player.augmentSynergizerActive) {
                recalculateAugmentSynergy();
            }
        }
        finishUpgradeSelection();
    }

    function recalculateAugmentSynergy() {
        if (!player || !player.augmentSynergizerActive) return;

        if (player.synergyDamageBonus) {
            player.damageMultiplier = (player.damageMultiplier || 1.0) - player.synergyDamageBonus;
            if(player.damageMultiplier < 0.1) player.damageMultiplier = 0.1;
        }
        if (player.synergyMaxHpBonus) {
            const oldHpPercentage = player.hp / player.maxHp;
            player.maxHp = Math.max(10, player.maxHp - player.synergyMaxHpBonus);
            player.hp = player.maxHp * oldHpPercentage; // Versuche HP-Prozentsatz zu erhalten
        }
        player.synergyDamageBonus = 0;
        player.synergyMaxHpBonus = 0;

        let rarityCounts = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0 };
        player.activeAugmentations.forEach(aug => {
            if (aug.rarity !== 'System' && rarityCounts[aug.rarity] !== undefined) {
                rarityCounts[aug.rarity]++;
            }
        });

        let totalSynergySets = 0;
        Object.values(rarityCounts).forEach(count => {
            totalSynergySets += Math.floor(count / 3);
        });

        if (totalSynergySets > 0) {
            const damageBonusPerSet = 0.05;
            const maxHpBonusValuePerSet = 10;

            player.synergyDamageBonus = totalSynergySets * damageBonusPerSet;
            player.damageMultiplier = (player.damageMultiplier || 1.0) + player.synergyDamageBonus;

            player.synergyMaxHpBonus = totalSynergySets * maxHpBonusValuePerSet;
            const oldHpPercentageBeforeAdd = player.hp / player.maxHp;
            player.maxHp += player.synergyMaxHpBonus;
             // Skaliere aktuelle HP mit, aber nicht über die neue MaxHP
            player.hp = Math.min(player.maxHp, player.maxHp * oldHpPercentageBeforeAdd + player.synergyMaxHpBonus);
            player.hp = Math.max(0, player.hp); // HP darf nicht negativ werden
        }
    }


    function selectSpecialization(specId) {
        const spec = CLASS_SPECIALIZATIONS.find(s => s.id === specId);
        if (spec && player && !chosenSpecializations.includes(spec.id)) {
            spec.apply(player);
        }
        finishUpgradeSelection();
    }

    function finishUpgradeSelection() {
        augmentationChoicePanel.classList.add('hidden');
        gameRunning = true;
        gameState = 'game';
        lastLoopTime = performance.now();
        if(!animationFrameId) animationFrameId = requestAnimationFrame(gameLoop);
    }

    function updateRerollUI() {
        if (player && rerollsAvailableDisplay && rerollButtonElement) {
            rerollsAvailableDisplay.textContent = player.currentRerolls;
            rerollButtonElement.disabled = player.currentRerolls <= 0;
        }
    }


    function updateGameUI() {
        if (!player) return;
        if(levelDisplay) levelDisplay.textContent = player.level;
        if(scoreDisplay) scoreDisplay.textContent = score;
        if(hpDisplay) hpDisplay.textContent = Math.max(0, Math.ceil(player.hp));
        if(maxHpDisplay) maxHpDisplay.textContent = player.maxHp;

        const shieldBarContainerId = 'shieldBarContainer';
        let shieldBarContainer = document.getElementById(shieldBarContainerId);
        if (player.maxShield > 0) {
            if (!shieldBarContainer && gameUi) {
                shieldBarContainer = document.createElement('div');
                shieldBarContainer.id = shieldBarContainerId;
                shieldBarContainer.classList.add('shield-bar-container');
                shieldBarContainer.innerHTML = `<div id="shieldBar" style="background-color: var(--shield-bar-fg);"></div><span id="shieldProgressText">0/0 S</span>`;
                const hpElement = Array.from(gameUi.children).find(child => child.textContent && child.textContent.startsWith("HP:"));
                if (hpElement && hpElement.nextSibling) {
                    gameUi.insertBefore(shieldBarContainer, hpElement.nextSibling);
                } else {
                    gameUi.appendChild(shieldBarContainer);
                }
            }
            const shieldBarElement = document.getElementById('shieldBar');
            const shieldProgressTextElement = document.getElementById('shieldProgressText');
            if(shieldBarElement && shieldProgressTextElement) {
                const shieldPercentage = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
                shieldBarElement.style.width = shieldPercentage + '%';
                shieldProgressTextElement.textContent = `${Math.max(0, Math.ceil(player.shield))}/${player.maxShield} S`;
            }
        } else if (shieldBarContainer) {
            shieldBarContainer.remove();
        }

        const xpPercentage = Math.max(0, Math.min(100, (currentLevelXP / xpToNextLevel) * 100));
        if(xpBarElement) xpBarElement.style.width = xpPercentage + '%';
        if(xpProgressTextElement) xpProgressTextElement.textContent = `${Math.max(0,currentLevelXP)}/${xpToNextLevel} XP`;
    }

    function drawPlayer() {
        if (!player || !ctx) return;
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle + Math.PI / 2);

        if (player.isInvulnerable || (player.isDashing && player.dashActiveTimer > 0 && player.dashInvulnDuration > 0 && player.invulnerableTimer > 0)) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100)*0.2;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(0, -player.radius - 3);
            ctx.lineTo(player.radius * 0.7 + 3, player.radius * 0.7 + 3);
            ctx.lineTo(-player.radius * 0.7 - 3, player.radius * 0.7 + 3);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(0, -player.radius);
        ctx.lineTo(player.radius * 0.7, player.radius * 0.7);
        ctx.lineTo(-player.radius * 0.7, player.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        if (player.shield > 0 && player.maxShield > 0) {
            ctx.strokeStyle = getCssVar('--shield-bar-fg');
            ctx.lineWidth = 2;
            ctx.globalAlpha = Math.max(0.3, player.shield / player.maxShield);
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    }

    function drawBullets() {
        if (!ctx || !player) return;
        bullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle + Math.PI / 2);
            ctx.fillStyle = b.color;
            const w = b.width * (player.projectileSizeMultiplier || 1.0);
            const h = b.height * (player.projectileSizeMultiplier || 1.0);
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.restore();
        });
    }

    function drawEnemies() {
        if (!ctx) return;
        enemies.forEach(e => {
            if (e.isDefeated) return;
            ctx.save();
            ctx.translate(e.x + e.width/2, e.y + e.height/2);
            ctx.rotate(e.angle + Math.PI/2);
            ctx.fillStyle = e.color;

            if (e.isFrozen) ctx.fillStyle = 'rgba(173, 216, 230, 0.8)';
            else if (e.statusEffects.active.fire) ctx.fillStyle = 'orangered';
            else if (e.statusEffects.active.ice) ctx.fillStyle = 'powderblue';
            else if (e.statusEffects.active.poison) ctx.fillStyle = 'lightgreen';
            else if (e.statusEffects.active.bleed) { ctx.strokeStyle = 'darkred'; ctx.lineWidth = 1; }

            ctx.beginPath();
            ctx.moveTo(0, -e.height / 2);
            ctx.lineTo(e.width / 2, e.height / 2);
            ctx.lineTo(-e.width / 2, e.height / 2);
            ctx.closePath();
            ctx.fill();
            if (e.statusEffects.active.bleed) ctx.stroke();

            if (e.hp < e.maxHp) {
                const barWidth = e.width;
                const barHeight = 4;
                const barX = -e.width / 2;
                const barY = e.height / 2 + 5;

                ctx.fillStyle = getCssVar('--health-bar-bg') || '#5a0000';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = getCssVar('--health-bar-fg') || '#ff0000';
                const currentHealthWidth = barWidth * (Math.max(0, e.hp) / e.maxHp);
                ctx.fillRect(barX, barY, currentHealthWidth, barHeight);
            }
            ctx.restore();
        });
    }

    function drawXPOrbs() {
        if (!ctx) return;
        xpOrbs.forEach(orb => {
            ctx.fillStyle = orb.color;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawActiveEffects() {
        if (!ctx) return;
        activeEffects.forEach(effect => {
            if (effect.type === 'explosion') {
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, Math.max(0, effect.currentRadius), 0, Math.PI * 2);
                ctx.globalAlpha = Math.max(0, effect.duration / (effect.creationTime + effect.durationMs - Date.now() + 1)); // +1 to avoid div by zero
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            // Blackhole drawing removed
        });
    }

    function clearCanvas() {
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function resetRunVariables() {
        bullets = []; enemies = []; xpOrbs = []; activeEffects = []; keys = {};
        score = 0; currentLevelXP = 0; xpToNextLevel = 40;
        chosenSpecializations = []; // chosenAugmentations wurde entfernt, player.activeAugmentations ist jetzt maßgeblich
        initPlayer();
        if (player && enemies.length === 0) {
            for(let i=0; i<3; i++) spawnEnemy();
        }
        updateGameUI();
    }

    function startGame() {
        if (!canvas || !ctx) {
            console.error("Canvas or Context not found! Game cannot start.");
            return;
        }
        resetRunVariables();
        gameRunning = true;
        gameState = 'game';
        switchScreen('game');
        lastLoopTime = performance.now();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false;
        gameState = 'gameOver';
        if(document.getElementById('finalScoreDisplay')) document.getElementById('finalScoreDisplay').textContent = score;
        if(document.getElementById('finalLevelDisplay')) document.getElementById('finalLevelDisplay').textContent = player ? player.level : '1';
        switchScreen('gameOver');
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    let lastLoopTime = 0; // Nur einmal global deklarieren
    function gameLoop(currentTime) {
        if (!gameRunning && gameState !== 'paused_augment' && gameState !== 'paused_class_choice' && gameState !== 'paused_second_class_choice') {
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

    function switchScreen(screenName) {
        Object.values(screens).forEach(s => { if(s) s.classList.add('hidden'); s.classList.remove('active'); });
        if(screens[screenName]) {
            screens[screenName].classList.remove('hidden');
            screens[screenName].classList.add('active');
        } else { console.error("Error: Screen not found - " + screenName); return; }
        gameState = screenName;

        if (gameUi) {
            if (screenName === 'game') gameUi.classList.remove('hidden');
            else gameUi.classList.add('hidden');
        }
        if (augmentationChoicePanel) {
            if (gameState === 'paused_augment' || gameState === 'paused_class_choice' || gameState === 'paused_second_class_choice') {
                 augmentationChoicePanel.classList.remove('hidden');
            } else {
                 augmentationChoicePanel.classList.add('hidden');
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if ((gameState === 'game' || gameState.startsWith('paused_')) &&
            (key === ' ' || key.startsWith('arrow') || key === 'shift' || key === 'w' || key === 'a' || key === 's' || key === 'd')
           ) {
            e.preventDefault();
        }
        keys[key] = true;
    });
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    if (canvas) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', (e) => { if (e.button === 0) mouse.down = true; });
        canvas.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.down = false; });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    } else {
        console.error("Canvas element not found on page load!");
    }

    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    } else {
        console.error("StartGameButton not found!");
    }

    if (restartGameButton) {
        restartGameButton.addEventListener('click', startGame);
    } else {
        console.error("RestartGameButton not found!");
    }

    if (rerollButtonElement) {
        rerollButtonElement.addEventListener('click', () => {
            if (player && player.currentRerolls > 0) {
                player.currentRerolls--;
                if (gameState === 'paused_class_choice' || gameState === 'paused_second_class_choice') {
                    showSpecializationChoiceScreen();
                } else if (gameState === 'paused_augment') {
                    showAugmentationChoiceScreen();
                }
                updateRerollUI();
            }
        });
    }

    switchScreen('startMenu');

