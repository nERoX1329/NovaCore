// data_classes.js

const CLASS_SPECIALIZATIONS = [
    // Überarbeitete ursprüngliche Klassen (nur positive Effekte)
    {
        id: "class_overdrive_positive",
        name: "Hyper Drive System",
        description: "<span class='positive'>+60% Fire Rate, +25% Projectile Speed, +20% Movement Speed, +10% Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.shotsPerSecond = (p.shotsPerSecond || p.baseStats.shotsPerSecond) * 1.60;
            p.fireRate = 1000 / p.shotsPerSecond;
            p.bulletSpeed = (p.bulletSpeed || p.baseStats.bulletSpeed) * 1.25;
            p.speed = (p.speed || p.baseStats.speed) * 1.20;
            p.damageMultiplier = (p.damageMultiplier || 1.0) * 1.10;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_overdrive_positive")) chosenSpecializations.push("class_overdrive_positive");
        }
    },
    {
        id: "class_heavy_artillery", // Umbenannt, da "Ordnance" oft schwerfällig klingt
        name: "Heavy Artillery",
        description: "<span class='positive'>+80% Damage, Projectiles Pierce +2 enemies, +15% Max HP.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.damageMultiplier = (p.damageMultiplier || 1.0) * 1.80;
            p.bulletPiercing = (p.bulletPiercing || 0) + 2;
            const hpBoost = Math.floor((p.baseStats.maxHp || 100) * 0.15); // Basierend auf Basis-MaxHP
            p.maxHp = (p.maxHp || p.baseStats.maxHp) + hpBoost;
            p.hp = Math.min(p.hp + hpBoost, p.maxHp);
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_heavy_artillery")) chosenSpecializations.push("class_heavy_artillery");
        }
    },
    {
        id: "class_spreadshot_master", // Umbenannt für Klarheit
        name: "Spreadshot Master",
        description: "<span class='positive'>+4 Projectiles, Projectile Spread slightly increased (+10°), +15% Projectile Speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.numProjectiles = (p.numProjectiles || p.baseStats.numProjectiles) + 4;
            p.projectileSpreadAngle = (p.projectileSpreadAngle || p.baseStats.projectileSpreadAngle) + 10;
            p.bulletSpeed = (p.bulletSpeed || p.baseStats.bulletSpeed) * 1.15;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_spreadshot_master")) chosenSpecializations.push("class_spreadshot_master");
        }
    },
    {
        id: "class_apex_predator", // Umbenannt für mehr "Impact"
        name: "Apex Predator",
        description: "<span class='positive'>+25% Critical Hit Chance, +125% Critical Hit Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.critChance = (p.critChance || p.baseStats.critChance) + 0.25;
            p.critDamageMultiplier = (p.critDamageMultiplier || p.baseStats.critDamageMultiplier) + 1.25;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_apex_predator")) chosenSpecializations.push("class_apex_predator");
        }
    },
    {
        id: "class_bulwark_protocol", // Umbenannt für defensive Konnotation
        name: "Bulwark Protocol",
        description: "<span class='positive'>Shooting emits a damaging wave (scales with your damage), +50 Max HP, +10% Damage Reduction.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.guardianWave.enabled = true;
            p.guardianWave.damageFactor = (p.guardianWave.damageFactor || 0.25) + 0.1; // Leicht gebufft
            p.guardianWave.radius = p.guardianWave.radius || 45; // Etwas größer
            p.guardianWave.cooldown = p.guardianWave.cooldown || 180; // Etwas schneller
            const hpBoost = 50;
            p.maxHp = (p.maxHp || p.baseStats.maxHp) + hpBoost;
            p.hp = Math.min(p.hp + hpBoost, p.maxHp);
            p.damageReduction = (p.damageReduction || 0) + 0.10;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_bulwark_protocol")) chosenSpecializations.push("class_bulwark_protocol");
        }
    },

    // 15 Neue Klassen-Spezialisierungen (nur positive Effekte)
    {
        id: "class_temporal_master",
        name: "Temporal Master",
        description: "<span class='positive'>Projectiles have a 10% chance to briefly stun enemies (1.5s). +25% Movement Speed, +35% Projectile Speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.stunChanceOnHit = (p.stunChanceOnHit || 0) + 0.10;
            p.stunDuration = 1500; //ms
            p.speed = (p.speed || p.baseStats.speed) * 1.25;
            p.bulletSpeed = (p.bulletSpeed || p.baseStats.bulletSpeed) * 1.35;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_temporal_master")) chosenSpecializations.push("class_temporal_master");
        }
    },
    {
        id: "class_elemental_conduit",
        name: "Elemental Conduit",
        description: "<span class='positive'>+35% Global Elemental Chance, +60% Global Elemental Damage. Elemental effects are more potent.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.globalElementalChanceBonus = (p.globalElementalChanceBonus || 0) + 0.35;
            p.globalElementalDamageBonus = (p.globalElementalDamageBonus || 1.0) * 1.60;
            p.lightningChainTargets = (p.lightningChainTargets || 0) + 2; // Zusätzliche Ketten
            // Feuer-Verbreitung oder stärkere DoTs müssten in der applyElementalEffect Logik gehandhabt werden.
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
            p.killStreakDamageBonus = {
                enabled: true,
                bonusPerStack: 0.04,
                maxStacks: 10,
                duration: 6000, // ms
                currentStacks: 0,
                timer: 0
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_vampiric_reaver")) chosenSpecializations.push("class_vampiric_reaver");
        }
    },
    {
        id: "class_unseen_assassin", // Umbenannt
        name: "Unseen Assassin",
        description: "<span class='positive'>First hit on an enemy is a guaranteed Critical Hit with +150% bonus Critical Damage. +15% base Critical Hit Chance.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.firstHitCritBonus = { enabled: true, bonusCritDamage: 1.50 };
            p.critChance = (p.critChance || p.baseStats.critChance) + 0.15;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_unseen_assassin")) chosenSpecializations.push("class_unseen_assassin");
        }
    },
    {
        id: "class_colossus_armor", // Umbenannt
        name: "Colossus Armor",
        description: "<span class='positive'>+120 Max HP, +20% Damage Reduction, +2.5 HP/sec Regeneration.</span>",
        rarity: "Legendary",
        apply: (p) => {
            const hpBoost = 120;
            p.maxHp = (p.maxHp || p.baseStats.maxHp) + hpBoost;
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
            p.numProjectiles = (p.numProjectiles || p.baseStats.numProjectiles) + 2;
            p.homingStrength = (p.homingStrength || 0) + 0.20;
            p.bulletPiercing = (p.bulletPiercing || 0) + 1;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_bullet_virtuoso")) chosenSpecializations.push("class_bullet_virtuoso");
        }
    },
    {
        id: "class_nova_pulsar", // Umbenannt, da Blackhole raus ist
        name: "Nova Pulsar",
        description: "<span class='positive'>Critical hits release a potent energy nova, damaging nearby enemies. Greatly increased Area Damage (+50%).</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.critNova = { enabled: true, damageFactor: 0.75, radius: 70 }; // damageFactor des Crit-Schadens
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
            p.shotsPerSecond = (p.shotsPerSecond || p.baseStats.shotsPerSecond) * 1.80;
            p.fireRate = 1000 / p.shotsPerSecond;
            p.speed = (p.speed || p.baseStats.speed) * 1.30;
            p.dashCooldown = (p.dashCooldown || 1500) * 0.40;
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_chrono_accelerant")) chosenSpecializations.push("class_chrono_accelerant");
        }
    },
    {
        id: "class_aegis_fortress", // Umbenannt
        name: "Aegis Fortress",
        description: "<span class='positive'>Grants +100 Max Shield. Shield recharges 60% faster (delay & rate). Shield explodes on break dealing 75 damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            if (!p.maxShield || p.maxShield === 0) { p.maxShield = 0; p.shield = 0; p.shieldRegenRate = 0; } // Initialisiere Schildsystem falls nicht vorhanden
            p.maxShield += 100;
            p.shield = Math.min(p.shield + 100, p.maxShield);
            if (p.shieldRegenRate === 0) p.shieldRegenRate = (0.05 * p.maxShield) || 5; // Setze eine Basis-Regenrate wenn 0

            p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.40; // 60% schneller = 40% der Zeit
            p.shieldRegenRate *= 1.60;
            p.unstableShieldCoreActive = true; // Wiederverwenden der Logik
            p.unstableShieldCoreDamage = 75;
            if (!p.activeAugmentations) p.activeAugmentations = [];
            if (!p.activeAugmentations.some(aug => aug.id === 'shield_system_online')) {p.activeAugmentations.push({id:'shield_system_online', rarity: 'System'});}
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_aegis_fortress")) chosenSpecializations.push("class_aegis_fortress");
        }
    },
    {
        id: "class_fate_weaver", // Umbenannt
        name: "Fate Weaver",
        description: "<span class='positive'>Massively increased Luck Factor (+150%). Augment choices always include one of a higher rarity (if possible). Gain +2 base Rerolls.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.luckFactor = (p.luckFactor || p.baseStats.luckFactor) * 2.50; // +150%
            p.guaranteedHigherRarityChoice = true;
            p.baseStats.rerollsPerLevel +=2; // Erhöhe die Basis für Rerolls
            p.currentRerolls +=2; // Gib auch sofort 2 Rerolls
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_fate_weaver")) chosenSpecializations.push("class_fate_weaver");
        }
    },
    {
        id: "class_kinetic_storm", // Umbenannt
        name: "Kinetic Storm",
        description: "<span class='positive'>Gain +30% Damage and +30% Fire Rate while moving. These bonuses are doubled when below 35% HP.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.kineticStormBonus = {
                enabled: true,
                damageBonusMoving: 0.30,
                fireRateBonusMoving: 0.30,
                lowHpThreshold: 0.35,
                lowHpMultiplier: 2.0
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_kinetic_storm")) chosenSpecializations.push("class_kinetic_storm");
        }
    },
    {
        id: "class_storm_caller", // Umbenannt
        name: "Storm Caller",
        description: "<span class='positive'>All projectiles have a 35% chance to become chain lightning, striking up to 4 foes. +60% Lightning Damage.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.projectilesBecomeChainLightningChance = 0.35;
            p.chainLightningMaxBounces = 4; // Wie viele Ziele getroffen werden können
            // Stelle sicher, dass lightning im elementalChance Objekt ist, falls nicht durch andere Augs
            p.elementalChance = (p.elementalChance || {});
            p.elementalChance.lightning = (p.elementalChance.lightning || 0); // Wird nicht additiv genutzt, sondern die neue Chance
            p.lightningDamageMultiplier = (p.lightningDamageMultiplier || 1.0) * 1.60; // Spezifischer Multiplikator für Blitzschaden
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_storm_caller")) chosenSpecializations.push("class_storm_caller");
        }
    },
    {
        id: "class_velocity_dynamo", // Umbenannt
        name: "Velocity Dynamo",
        description: "<span class='positive'>+15% Base Movement Speed. Convert 1.5% of your total movement speed into bonus weapon damage per point of speed.</span>",
        rarity: "Legendary",
        apply: (p) => {
            p.baseStats.speed *= 1.15; // Erhöhe Basis-Speed für diesen Run
            p.speed = p.baseStats.speed;   // Aktualisiere aktuellen Speed
            p.velocityDynamo = { enabled: true, damageConversionFactor: 0.015 }; // 1.5% pro Speed-Einheit
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
            p.soulHarvester = { enabled: true, hpPerOrb: 0.15, damagePercentPerOrb: 0.0003 }; // 0.03% = 0.0003
            p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || p.baseStats.xpCollectionRadiusMultiplier) * 1.60;
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
            p.divineIntervention = {
                enabled: true,
                interval: 25000, // ms
                duration: 5000,  // ms
                timer: 25000,    // Startet "geladen"
                activeBuff: null,
                activeBuffTimer: 0,
                possibleBuffs: ['invulnerability', 'max_crit', 'infinite_ammo', 'rapid_regen']
            };
            p.specializationsChosen = (p.specializationsChosen || 0) + 1;
            if (!chosenSpecializations.includes("class_divine_interventionist")) chosenSpecializations.push("class_divine_interventionist");
        }
    }
];