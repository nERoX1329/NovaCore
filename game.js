// --- DOM Element Getters & Basic Setup ---
const screens = {
    startMenu: document.getElementById('startMenuScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen')
    // pauseMenu screen element is removed as per last request
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
// resumeGameButton and pauseToMenuButton are removed

// --- Game State Variables ---
if (canvas) { canvas.width = 600; canvas.height = 400; }
let gameState = 'startMenu';
let gameRunning = false;
let animationFrameId;

let player;
let bullets = [];
let enemies = [];
let xpOrbs = [];

let keys = {};
let mouse = { x: 0, y: 0, down: false };

let score = 0;
let currentLevelXP = 0;
let xpToNextLevel = 40;
const BASE_REROLLS_PER_CHOICE = 3;
let chosenAugmentations = []; // Tracks chosen non-common augments
let chosenSpecializations = []; // Tracks chosen class specializations

// --- Helper function to get computed CSS variable values ---
function getCssVar(varName) {
    try {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    } catch (e) {
        console.warn(`Could not get CSS variable ${varName}. Using fallback. Error: ${e}`);
        // Provide sensible fallbacks if CSS variables are not found
        if (varName === '--player-color') return '#00FFFF';
        if (varName === '--bullet-color') return '#FFFF00';
        if (varName === '--enemy-color1') return '#FF0000';
        if (varName === '--enemy-color2') return '#800080';
        if (varName === '--xp-orb-color') return '#40E0D0';
        if (varName === '--health-bar-bg') return '#5a0000';
        if (varName === '--health-bar-fg') return '#ff0000';
        return '#FFFFFF'; // Default fallback
    }
}

// --- Augmentation Definitions ---
const CLASS_SPECIALIZATIONS = [
    { id: "class_overdrive", name: "Overdrive System", description: "<span class='positive'>+50% FR, +20% Proj.Spd, +15% Mv.Spd</span><br><span class='tradeoff'>-25% Damage</span>", rarity: "Legendary", apply: (p) => { p.shotsPerSecond *= 1.5; p.fireRate = 1000 / p.shotsPerSecond; p.bulletSpeed *= 1.2; p.speed *= 1.15; p.damageMultiplier *= 0.75; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_overdrive");}},
    { id: "class_heavy_ordnance", name: "Heavy Ordnance", description: "<span class='positive'>+60% Dmg, Proj. Pierce +1</span><br><span class='tradeoff'>-30% FR, -15% Mv.Spd</span>", rarity: "Legendary", apply: (p) => { p.damageMultiplier *= 1.6; p.bulletPiercing = (p.bulletPiercing || 0) + 1; p.shotsPerSecond *= 0.7; p.fireRate = 1000 / p.shotsPerSecond; p.speed *= 0.85; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_heavy_ordnance");}},
    { id: "class_scatter_core", name: "Scatter Core", description: "<span class='positive'>+3 Proj, +15° Spread</span><br><span class='tradeoff'>-20% Dmg, -10% Proj.Spd</span>", rarity: "Legendary", apply: (p) => { p.numProjectiles += 3; p.projectileSpreadAngle = (p.projectileSpreadAngle || 0) + 15; p.damageMultiplier *= 0.8; p.bulletSpeed *= 0.9; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_scatter_core");}},
    { id: "class_precision_protocol", name: "Precision Protocol", description: "<span class='positive'>+15% Crit Chance, +75% Crit Dmg</span><br><span class='tradeoff'>-10% FR</span>", rarity: "Legendary", apply: (p) => { p.critChance += 0.15; p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.75; p.shotsPerSecond *= 0.9; p.fireRate = 1000 / p.shotsPerSecond; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_precision_protocol");}},
    { id: "class_guardian_array", name: "Guardian Array", description: "<span class='positive'>Shooting emits Dmg Wave, +25 Max HP</span><br><span class='tradeoff'>-10% Mv.Spd</span>", rarity: "Legendary", apply: (p) => { p.guardianWave = { enabled: true, damageFactor: 0.25 }; p.maxHp += 25; p.hp +=25; p.speed *= 0.9; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_guardian_array");}},
];

const ALL_AUGMENTATIONS = [
    { id: "hp_boost_s", name: "+15 Max HP", description: "Small health increase.", rarity: "Common", apply: (p) => { p.maxHp += 15; p.hp = Math.min(p.hp + 15, p.maxHp); }},
    { id: "dmg_boost_s", name: "+7% Damage", description: "Minor damage increase.", rarity: "Common", apply: (p) => { p.damageMultiplier += 0.07; }},
    { id: "firerate_boost_s", name: "+7% Fire Rate", description: "Minor fire rate increase.", rarity: "Common", apply: (p) => { p.shotsPerSecond *= 1.07; p.fireRate = 1000 / p.shotsPerSecond; }},
    { id: "speed_boost_s", name: "+5% Speed", description: "Minor speed increase.", rarity: "Common", apply: (p) => { p.speed *= 1.05; }},
    { id: "xp_radius_s", name: "Magnet S", description: "+25% XP Collection Radius", rarity: "Common", apply: (p) => { p.xpCollectionRadiusMultiplier = (p.xpCollectionRadiusMultiplier || 1.0) * 1.25; }},
    { id: "hp_boost_m", name: "+35 Max HP", description: "Medium health increase.", rarity: "Uncommon", apply: (p) => { p.maxHp += 35; p.hp = Math.min(p.hp + 35, p.maxHp); }},
    { id: "dmg_boost_m", name: "+15% Damage", description: "Medium damage increase.", rarity: "Uncommon", apply: (p) => { p.damageMultiplier += 0.15; }},
    { id: "firerate_boost_m", name: "+15% Fire Rate", description: "Medium fire rate increase.", rarity: "Uncommon", apply: (p) => { p.shotsPerSecond *= 1.15; p.fireRate = 1000 / p.shotsPerSecond; }},
    { id: "crit_chance_s", name: "Critical Lens S", description: "+7% Crit Chance", rarity: "Uncommon", apply: (p) => { p.critChance += 0.07; }},
    { id: "proj_speed_s", name: "Velocity Coils S", description: "+15% Projectile Speed", rarity: "Uncommon", apply: (p) => { p.bulletSpeed *= 1.15; }},
    { id: "hp_boost_l", name: "+60 Max HP", description: "Large health increase.", rarity: "Rare", apply: (p) => { p.maxHp += 60; p.hp = Math.min(p.hp + 60, p.maxHp); }},
    { id: "dmg_boost_l", name: "+30% Damage", description: "Large damage increase.", rarity: "Rare", apply: (p) => { p.damageMultiplier += 0.30; }},
    { id: "multishot_1", name: "Twin Barrel", description: "+1 Projectile", rarity: "Rare", apply: (p) => { p.numProjectiles += 1; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(5, p.projectileSpreadAngle) : 0; }},
    { id: "crit_damage_s", name: "Sharpshooter S", description: "+40% Crit Damage", rarity: "Rare", apply: (p) => { p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.40; }},
    { id: "focused_power", name: "Focused Power", description: "+40% Dmg, <span class='tradeoff'>-15% FR</span>", rarity: "Rare", apply: (p) => { p.damageMultiplier += 0.40; p.shotsPerSecond *= 0.85;p.fireRate = 1000 / p.shotsPerSecond;}},
    { id: "pierce_1", name: "Piercer Rounds", description: "Projectiles pierce +1 enemy.", rarity: "Rare", apply: (p) => { p.bulletPiercing = (p.bulletPiercing || 0) + 1; }},
    { id: "overcharge", name: "Overcharge", description: "+25% FR, +10% Dmg, <span class='tradeoff'>-15 Max HP</span>", rarity: "Epic", apply: (p) => { p.shotsPerSecond *= 1.25; p.fireRate = 1000/p.shotsPerSecond; p.damageMultiplier += 0.10; p.maxHp = Math.max(10, p.maxHp - 15); p.hp = Math.min(p.hp, p.maxHp);}},
    { id: "luck_s", name: "Lucky Charm", description: "Better Augment Rarity", rarity: "Epic", apply: (p) => { p.luckFactor = (p.luckFactor || 1.0) * 1.25; }},
    { id: "crit_mastery", name: "Critical Mastery", description: "+10% Crit Chance, +50% Crit Dmg", rarity: "Epic", apply: (p) => { p.critChance += 0.10; p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.50; }},
    { id: "legendary_power_surge", name: "Power Surge", description: "+75% Damage!", rarity: "Legendary", apply: (p) => { p.damageMultiplier += 0.75; }},
    { id: "legendary_bullet_hell", name: "Bullet Hell", description: "+50% Fire Rate, +2 Projectiles!", rarity: "Legendary", apply: (p) => { p.shotsPerSecond *= 1.5; p.fireRate = 1000/p.shotsPerSecond; p.numProjectiles +=2; p.projectileSpreadAngle = (p.numProjectiles > 1) ? Math.max(10, p.projectileSpreadAngle) : 0;}},
    { id: "legendary_omni_shield", name: "Omni-Shield", description: "+50 Max Shield, Shield recharges faster.", rarity: "Legendary", apply: (p) => { p.maxShield = (p.maxShield || 0) + 50; p.shield = Math.min(p.shield + 50, p.maxShield); if(!p.activeAugmentations.includes('shield_system_online')) {p.activeAugmentations.push('shield_system_online');} p.shieldRechargeDelay = (p.shieldRechargeDelay || 3000) * 0.7; p.shieldRegenRate = (p.shieldRegenRate || 0.05) * 1.3;}},
];

// --- Screen Management ---
function switchScreen(screenName) {
    Object.values(screens).forEach(s => { if(s) s.classList.add('hidden');});
    if(screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
    } else {
        console.error("Error: Screen not found - " + screenName);
        return;
    }
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

// --- Player Initialization ---
function initPlayer() {
    player = {
        x: canvas.width / 2, y: canvas.height - 30, radius: 10,
        color: getCssVar('--player-color') || '#00FFFF',
        speed: 2, baseSpeed: 2,
        hp: 100, maxHp: 100,
        level: 1,
        angle: -Math.PI / 2,
        baseDamage: 5, damageMultiplier: 1.0,
        shotsPerSecond: 2.0, fireRate: 500, lastShotTime: 0,
        bulletSpeed: 4,
        bulletColor: getCssVar('--bullet-color') || '#FFFF00',
        numProjectiles: 1,
        projectileSpreadAngle: 0,
        bulletPiercing: 0,
        critChance: 0,
        critDamageMultiplier: 1.5,
        xpCollectionRadiusMultiplier: 1.0,
        luckFactor: 1.0,
        autoAimEnabled: false, // Not used in this basic version
        currentRerolls: BASE_REROLLS_PER_CHOICE,
        specializationsChosen: 0,
        guardianWave: { enabled: false, damageFactor: 0.25, radius: 40, lastProcTime: 0, cooldown: 200 },
        activeAugmentations: []
    };
}

// --- Enemy Spawning ---
function spawnEnemy() {
    if (!player || !canvas) return;
    const size = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 0.5 + Math.random() * 0.5 + (player.level * 0.05);
    const hp = Math.floor(10 + player.level * 5 + size * 0.5);
    const enemyColor1 = getCssVar('--enemy-color1') || '#FF0000';
    const enemyColor2 = getCssVar('--enemy-color2') || '#800080';
    const color = Math.random() < 0.5 ? enemyColor1 : enemyColor2;
    enemies.push({ x, y, width: size, height: size, speed, hp, maxHp: hp, color, angle: Math.PI / 2 });
}

function spawnXPOrb(x, y, value) {
    xpOrbs.push({ x, y, value, size: 2 + Math.log2(value + 1) * 0.7, speed: 2, color: getCssVar('--xp-orb-color') || '#40E0D0' });
}

// --- Update Functions ---
function updatePlayer(dT) {
    if (!player) return;
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
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    if ((keys[' '] || mouse.down) && Date.now() - player.lastShotTime > player.fireRate) {
        const cannonEndX = player.x + Math.cos(player.angle) * (player.radius + 2);
        const cannonEndY = player.y + Math.sin(player.angle) * (player.radius + 2);

        for (let i = 0; i < player.numProjectiles; i++) {
            let currentAngle = player.angle;
            if (player.numProjectiles > 1) {
                const totalSpread = player.projectileSpreadAngle * (Math.PI / 180);
                currentAngle += (i - (player.numProjectiles - 1) / 2) * (totalSpread / Math.max(1, player.numProjectiles -1));
            }
            bullets.push({
                x: cannonEndX, y: cannonEndY, width: 3, height: 8,
                color: player.bulletColor, speed: player.bulletSpeed,
                angle: currentAngle, damage: player.baseDamage * player.damageMultiplier,
                owner: 'player', spawnTime: Date.now()
            });
        }
        player.lastShotTime = Date.now();

        if (player.guardianWave && player.guardianWave.enabled && Date.now() - player.guardianWave.lastProcTime > player.guardianWave.cooldown) {
            enemies.forEach(e => {
                const dist = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
                if (dist < player.guardianWave.radius) {
                    e.hp -= (player.baseDamage * player.damageMultiplier) * player.guardianWave.damageFactor;
                    if (e.hp <=0 && !e.isDefeated) { // Check isDefeated to prevent multiple XP/score
                        e.isDefeated = true;
                        spawnXPOrb(e.x + e.width / 2, e.y + e.height / 2, 10 + Math.floor(e.width));
                        score += 10 + Math.floor(e.width);
                        // Enemy removal is handled in checkCollisions or main enemy update loop
                    }
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
        b.x += Math.cos(b.angle) * moveSpeed;
        b.y += Math.sin(b.angle) * moveSpeed;
        if (b.y < -b.height || b.y > canvas.height + b.height || b.x < -b.width || b.x > canvas.width + b.width) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies(dT) {
    if (!player) return;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dxToPlayer = player.x - e.x;
        const dyToPlayer = player.y - e.y;
        const distToPlayer = Math.sqrt(dxToPlayer*dxToPlayer + dyToPlayer*dyToPlayer);
        e.angle = Math.atan2(dyToPlayer, dxToPlayer);

        if (distToPlayer > 0.01) { // Basic chase
             e.x += (dxToPlayer / distToPlayer) * e.speed * (dT/(1000/60));
             e.y += (dyToPlayer / distToPlayer) * e.speed * (dT/(1000/60));
        }
        if (e.y > canvas.height + e.height) {
            enemies.splice(i, 1); // Remove if off-screen bottom
        }
    }
    // Spawn new enemies periodically
    if (Math.random() < 0.02 + (player.level * 0.005) && enemies.length < 10 + player.level * 2) {
        spawnEnemy();
    }
}

function updateXPOrbs(dT) {
    if (!player) return;
    for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const o = xpOrbs[i];
        const moveSpeed = o.speed * (dT / (1000 / 60));
        const dx = player.x - o.x;
        const dy = player.y - o.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 75 + player.radius) { // Attraction radius
             if (d > 1) { // Prevent division by zero if too close
                o.x += (dx / d) * moveSpeed * 1.5; // Move faster when attracted
                o.y += (dy / d) * moveSpeed * 1.5;
             }
        }
        if (d < player.radius + o.size / 2) { // If actually touching
            gainXP(o.value);
            xpOrbs.splice(i, 1);
        } else if (o.y > canvas.height + 20) { // Remove if off-screen (bottom)
            xpOrbs.splice(i, 1);
        }
    }
}

// --- Collision Detection ---
function checkCollisions() {
    if (!player) return;
    // Player bullets vs Enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.owner !== 'player') continue;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            // Simple AABB collision
            if (b.x < e.x + e.width && b.x + b.width > e.x &&
                b.y < e.y + e.height && b.y + b.height > e.y) {
                let damageDealt = b.damage;
                if (player.critChance && Math.random() < player.critChance) {
                    damageDealt *= (player.critDamageMultiplier || 1.5); // Basic crit damage
                }
                e.hp -= damageDealt;
                bullets.splice(i, 1); // Remove bullet on hit
                if (e.hp <= 0) {
                    spawnXPOrb(e.x + e.width / 2, e.y + e.height / 2, 10 + Math.floor(e.width)); // XP based on size
                    score += 10 + Math.floor(e.width);
                    enemies.splice(j, 1);
                }
                break; // Bullet can only hit one enemy
            }
        }
    }
    // Player vs Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dist = Math.sqrt(Math.pow(player.x - (e.x + e.width/2), 2) + Math.pow(player.y - (e.y + e.height/2), 2));
        if (dist < player.radius + e.width/2 * 0.8) { // Collision with enemy (using width as approx radius)
            player.hp -= 10; // Player takes damage
            enemies.splice(i, 1); // Remove enemy
            if (player.hp <= 0) {
                gameOver();
                return; // Stop further checks if game over
            }
        }
    }
}

// --- Game Logic (Damage, XP, Level Up) ---
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
    currentLevelXP -= xpToNextLevel;
    xpToNextLevel = Math.floor(40 * Math.pow(1.15, player.level -1)); // Adjusted XP curve
    player.hp = Math.min(player.maxHp, player.hp + 20); // Heal a bit on level up
    player.currentRerolls = BASE_REROLLS_PER_CHOICE; // Reset rerolls

    gameRunning = false; // Pause game for augmentation choice
    if ((player.level === 10 && player.specializationsChosen === 0) || (player.level === 20 && player.specializationsChosen === 1)) {
        gameState = player.level === 10 ? 'paused_class_choice' : 'paused_second_class_choice';
        augmentationPanelTitle.textContent = "Choose Your Specialization!";
        showSpecializationChoiceScreen();
    } else {
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
    const offeredClasses = shuffledClasses.slice(0, 3); // Offer 3 random classes from available

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
    if (!augmentationChoicesContainer || !augmentationChoicePanel) return;
    augmentationPanelTitle.textContent = "Choose Upgrade!";
    augmentationChoicesContainer.innerHTML = '';
    let offeredAugs = [];

    // Filter out class specializations and already chosen non-common augments
    let tempAvailableUpgrades = ALL_AUGMENTATIONS.filter(aug => {
        if (CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id)) return false;
        // Allow common augments to be re-offered.
        // For non-common, check if it's already in chosenAugmentations (this list is reset after class choice).
        if (aug.rarity !== "Common" && chosenAugmentations.find(chosen => chosen.id === aug.id)) {
            return false;
        }
        return true;
    });


    for(let i=0; i<3; i++){
        let potentialAug = getWeightedRandomAugmentation(tempAvailableUpgrades, offeredAugs);
        if(potentialAug){
            offeredAugs.push(potentialAug);
            // To avoid offering the exact same card twice in *this specific selection of 3*, remove it from temp pool for this round.
            // This is more important for non-commons. Commons can reappear more freely.
            if (potentialAug.rarity !== "Common") {
                tempAvailableUpgrades = tempAvailableUpgrades.filter(aug => aug.id !== potentialAug.id);
            }
        } else if (ALL_AUGMENTATIONS.length > 0) { // Fallback if unique pool exhausted for this offer
            // Try to get any augment not yet in offeredAugs, excluding classes
            let fallbackAug = ALL_AUGMENTATIONS.find(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id) && !offeredAugs.some(oa => oa.id === a.id));
            if (fallbackAug) offeredAugs.push(fallbackAug);
            else if (offeredAugs.length < 3) { // Absolute fallback: pick any non-class augment
                const nonClassAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id));
                if (nonClassAugs.length > 0) {
                    offeredAugs.push(nonClassAugs[Math.floor(Math.random() * nonClassAugs.length)]);
                }
            }
        }
    }
    offeredAugs = offeredAugs.slice(0,3); // Ensure only 3 are shown


    offeredAugs.forEach(aug => {
        if(!aug) return; // Should ideally not happen with fallbacks
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
        if (aug.rarity !== "Common") { // Track chosen non-common augments
            chosenAugmentations.push({id: aug.id, rarity: aug.rarity});
        }
    }
    finishUpgradeSelection();
}

function selectSpecialization(specId) {
    const spec = CLASS_SPECIALIZATIONS.find(s => s.id === specId);
    if (spec && player && !chosenSpecializations.includes(spec.id)) { // Ensure class isn't already chosen
        spec.apply(player);
        // chosenSpecializations.push(spec.id); // This is handled inside class apply method now
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


// --- Drawing Functions ---
function updateGameUI() {
    if (!player) return;
    levelDisplay.textContent = player.level;
    scoreDisplay.textContent = score;
    hpDisplay.textContent = Math.max(0, Math.ceil(player.hp));
    maxHpDisplay.textContent = player.maxHp;
    const xpPercentage = Math.max(0, Math.min(100, (currentLevelXP / xpToNextLevel) * 100));
    xpBarElement.style.width = xpPercentage + '%';
    xpProgressTextElement.textContent = `${currentLevelXP}/${xpToNextLevel} XP`;
}

function drawPlayer() {
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

function drawBullets() {
    if (!ctx) return;
    bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle + Math.PI / 2);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.restore();
    });
}

function drawEnemies() {
    if (!ctx) return;
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle + Math.PI/2);
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.height / 2);
        ctx.lineTo(e.width / 2, e.height / 2);
        ctx.lineTo(-e.width / 2, e.height / 2);
        ctx.closePath();
        ctx.fill();

        if (e.hp < e.maxHp) {
            const barWidth = e.width;
            const barHeight = 4;
            const barX = -e.width / 2;
            const barY = e.height / 2 + 3;

            ctx.fillStyle = getCssVar('--health-bar-bg') || '#5a0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = getCssVar('--health-bar-fg') || '#ff0000';
            const currentHealthWidth = barWidth * (e.hp / e.maxHp);
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

function clearCanvas() {
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Game Flow & Loop ---
function resetRunVariables() {
    bullets = []; enemies = []; xpOrbs = []; keys = {};
    score = 0; currentLevelXP = 0; xpToNextLevel = 40;
    chosenAugmentations = [];
    chosenSpecializations = [];
    initPlayer();
    if (player && enemies.length === 0) {
        for(let i=0; i<3; i++) spawnEnemy();
    }
    updateGameUI();
}

function startGame() {
    resetRunVariables();
    gameRunning = true;
    gameState = 'game';
    switchScreen('game');
    if (!canvas || !ctx) { gameRunning = false; return; }
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
}

let lastLoopTime = 0;
function gameLoop(currentTime) {
    // Allow drawing during augmentation/class choice pauses, but not manual pause
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

    if (gameRunning && gameState === 'game') { // Only update game logic if actively in 'game' state
        updatePlayer(cappedDeltaTime);
        updateBullets(cappedDeltaTime);
        updateEnemies(cappedDeltaTime);
        updateXPOrbs(cappedDeltaTime);
        checkCollisions();
    }

    // Always draw the current state
    clearCanvas();
    if (player) drawPlayer();
    drawEnemies();
    drawBullets();
    drawXPOrbs();
    if (player) updateGameUI();
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    // Removed ESC key listener for pause
    if ((gameState === 'game' || gameState.startsWith('paused_')) && (e.key === ' ' || e.key.startsWith('Arrow'))) {
        e.preventDefault();
    }
    keys[e.key.toLowerCase()] = true;
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
}

// Removed togglePause function

if (startGameButton) startGameButton.addEventListener('click', startGame);
if (restartGameButton) restartGameButton.addEventListener('click', startGame);
// Removed event listeners for resumeGameButton and pauseToMenuButton


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

// --- Initial Load ---
// loadGameData(); // No complex save/load in this basic version for now
switchScreen('startMenu');
    </script>
</body>
</html>
