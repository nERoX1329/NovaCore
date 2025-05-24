// config.js

// --- GLOBAL CONSTANTS ---
const BASE_REROLLS_PER_CHOICE = 3;
const XP_TO_NEXT_LEVEL_BASE = 40;
const XP_LEVEL_SCALING_FACTOR = 1.15;
const ENEMY_BASE_HP = 10;
const ENEMY_HP_PER_LEVEL = 5;
const ENEMY_HP_PER_SIZE = 0.5;
const ENEMY_BASE_SPEED_MIN = 0.5;
const ENEMY_BASE_SPEED_RANDOM_ADD = 0.5;
const ENEMY_SPEED_PER_LEVEL = 0.05;
const ENEMY_SPAWN_BASE_CHANCE = 0.025;
const ENEMY_SPAWN_LEVEL_FACTOR = 0.006;
const ENEMY_MAX_COUNT_BASE = 15;
const ENEMY_MAX_COUNT_PER_LEVEL = 3;
const PLAYER_BASE_MAX_AMMO = 30; // Basis-Maximalmunition
const PLAYER_BASE_RELOAD_TIME = 2000; // ms

// --- GAME SETTINGS ---
const gameSettings = {
    selectedDifficulty: 'Normal', // Mögliche Werte: 'Easy', 'Normal', 'Hard'
};

// --- META PROGRESSION DATA ---
let metaProgress = {
    metaCurrency: 0,
    boughtUpgrades: {}, // z.B. { "meta_start_hp": 2, "meta_base_damage": 1 } (Level des Upgrades)
    // Direkte Boni, die aus gekauften Upgrades resultieren (werden von loadMetaProgress berechnet)
    bonusStartHp: 0,
    bonusBaseDamage: 0,
    bonusBaseSpeed: 0,
    bonusBaseShotsPerSecond: 0,
    bonusBulletSpeed: 0,
    bonusNumProjectiles: 0,
    bonusBulletPiercing: 0,
    bonusCritChance: 0,
    bonusCritDamageMultiplier: 0,
    bonusLuckFactor: 0,
    permanentRerolls: 0,
    bonusMaxAmmoFactor: 1.0, // Als Multiplikator auf PLAYER_BASE_MAX_AMMO
    bonusReloadSpeedFactor: 1.0, // Multiplikator, 1.0 = keine Änderung
};

// Definitionen für den Meta-Shop
const META_UPGRADES_DEFINITIONS = {
    "meta_start_hp": { name: "+10 Starting Max HP", maxLevel: 5, costPerLevel: [100, 150, 220, 300, 400], description: "Increases starting Max HP by 10 per level.", applyBonus: (level) => level * 10 },
    "meta_base_damage": { name: "+0.5 Base Damage", maxLevel: 5, costPerLevel: [150, 220, 300, 400, 550], description: "Increases base weapon damage by 0.5 per level.", applyBonus: (level) => level * 0.5 },
    "meta_permanent_rerolls": { name: "+1 Reroll", maxLevel: 3, costPerLevel: [200, 350, 500], description: "Grants an additional reroll option per level up.", applyBonus: (level) => level * 1 },
    "meta_max_ammo": { name: "+10% Max Ammo", maxLevel: 5, costPerLevel: [80, 120, 180, 250, 350], description: "Increases maximum ammunition by 10% of base per level.", applyBonus: (level) => 1.0 + (level * 0.10) }, // Additiver Faktor auf 1.0 Basis
    "meta_reload_speed": { name: "-7% Reload Time", maxLevel: 3, costPerLevel: [120, 200, 300], description: "Reduces reload time by 7% per level.", applyBonus: (level) => Math.pow(0.93, level) }, // Multiplikativ
    // Füge hier weitere Meta-Upgrades hinzu
    // "meta_base_speed": { name: "+5% Base Speed", maxLevel: 3, costPerLevel: [100, 180, 280], description: "Increases base movement speed by 5% per level.", applyBonus: (level) => level * 0.05 },
};