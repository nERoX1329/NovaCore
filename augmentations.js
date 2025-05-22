// Augmentation Definitions and Logic
import { player, chosenSpecializations, chosenAugmentations, BASE_REROLLS_PER_CHOICE } from './game.js'; // Temporary import, will be refactored
// TODO: Refactor player, chosenSpecializations, chosenAugmentations to be managed via main.js or a state module

export const CLASS_SPECIALIZATIONS = [
    { id: "class_overdrive", name: "Overdrive System", description: "<span class='positive'>+50% FR, +20% Proj.Spd, +15% Mv.Spd</span><br><span class='tradeoff'>-25% Damage</span>", rarity: "Legendary", apply: (p) => { p.shotsPerSecond *= 1.5; p.fireRate = 1000 / p.shotsPerSecond; p.bulletSpeed *= 1.2; p.speed *= 1.15; p.damageMultiplier *= 0.75; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_overdrive");}},
    { id: "class_heavy_ordnance", name: "Heavy Ordnance", description: "<span class='positive'>+60% Dmg, Proj. Pierce +1</span><br><span class='tradeoff'>-30% FR, -15% Mv.Spd</span>", rarity: "Legendary", apply: (p) => { p.damageMultiplier *= 1.6; p.bulletPiercing = (p.bulletPiercing || 0) + 1; p.shotsPerSecond *= 0.7; p.fireRate = 1000 / p.shotsPerSecond; p.speed *= 0.85; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_heavy_ordnance");}},
    { id: "class_scatter_core", name: "Scatter Core", description: "<span class='positive'>+3 Proj, +15° Spread</span><br><span class='tradeoff'>-20% Dmg, -10% Proj.Spd</span>", rarity: "Legendary", apply: (p) => { p.numProjectiles += 3; p.projectileSpreadAngle = (p.projectileSpreadAngle || 0) + 15; p.damageMultiplier *= 0.8; p.bulletSpeed *= 0.9; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_scatter_core");}},
    { id: "class_precision_protocol", name: "Precision Protocol", description: "<span class='positive'>+15% Crit Chance, +75% Crit Dmg</span><br><span class='tradeoff'>-10% FR</span>", rarity: "Legendary", apply: (p) => { p.critChance += 0.15; p.critDamageMultiplier = (p.critDamageMultiplier || 1.5) + 0.75; p.shotsPerSecond *= 0.9; p.fireRate = 1000 / p.shotsPerSecond; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_precision_protocol");}},
    { id: "class_guardian_array", name: "Guardian Array", description: "<span class='positive'>Shooting emits Dmg Wave, +25 Max HP</span><br><span class='tradeoff'>-10% Mv.Spd</span>", rarity: "Legendary", apply: (p) => { p.guardianWave = { enabled: true, damageFactor: 0.25 }; p.maxHp += 25; p.hp +=25; p.speed *= 0.9; p.specializationsChosen = (p.specializationsChosen || 0) + 1; chosenSpecializations.push("class_guardian_array");}},
];

export const ALL_AUGMENTATIONS = [
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

// --- Augmentation Choice Logic ---
// These functions will need access to DOM elements for UI updates,
// and game state like 'player'.
// For now, assume they are passed or imported.
// Let's get them from ui.js or main.js later.
let augmentationChoicesContainer, augmentationPanelTitle, augmentationChoicePanel;
let updateRerollUI_func; // Placeholder for the actual function from ui.js

export function initializeAugmentationUI(elements, rerollUIUpdater) {
    augmentationChoicesContainer = elements.augmentationChoicesContainer;
    augmentationPanelTitle = elements.augmentationPanelTitle;
    augmentationChoicePanel = elements.augmentationChoicePanel; // This is for showing/hiding the panel
    updateRerollUI_func = rerollUIUpdater;
}


function getWeightedRandomAugmentation(availableAugs, alreadyOfferedAugs) {
    // Basic random for now, can be expanded with luckFactor
    const luck = player ? player.luckFactor : 1.0;

    // Filter out already offered augs to prevent duplicates in the same offering
    const filteredAugs = availableAugs.filter(aug => !alreadyOfferedAugs.some(offered => offered.id === aug.id));
    if (filteredAugs.length === 0) return null; // No more unique augs to offer from this set

    // Simple rarity weighting (can be more sophisticated)
    const weights = filteredAugs.map(aug => {
        let weight = 1;
        if (aug.rarity === "Uncommon") weight = 3 * luck;
        else if (aug.rarity === "Rare") weight = 2 * luck;
        else if (aug.rarity === "Epic") weight = 1.5 * luck;
        else if (aug.rarity === "Legendary") weight = 1 * luck; // Should be rarer
        else weight = 5; // Common
        return weight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < filteredAugs.length; i++) {
        random -= weights[i];
        if (random < 0) {
            return filteredAugs[i];
        }
    }
    return filteredAugs[filteredAugs.length - 1] || filteredAugs[0]; // Fallback
}


export function showSpecializationChoiceScreen() {
    if (!augmentationChoicesContainer || !augmentationChoicePanel) return;
    augmentationChoicesContainer.innerHTML = '';
    augmentationPanelTitle.textContent = "Choose Your Specialization!";

    const availableClasses = CLASS_SPECIALIZATIONS.filter(spec => !chosenSpecializations.includes(spec.id));
    const shuffledClasses = [...availableClasses].sort(() => 0.5 - Math.random());
    const offeredClasses = shuffledClasses.slice(0, 3);

    offeredClasses.forEach(spec => {
        const card = document.createElement('div');
        card.classList.add('augmentation-card', `rarity-${spec.rarity}`);
        card.innerHTML = `<h4>${spec.name}</h4><p>${spec.description}</p><div class="rarity-text">${spec.rarity}</div>`;
        card.addEventListener('click', () => selectSpecialization(spec.id));
        augmentationChoicesContainer.appendChild(card);
    });
    // augmentationChoicePanel.classList.remove('hidden'); // This will be handled by ui.js or main.js switchScreen
    if (updateRerollUI_func) updateRerollUI_func();
}

export function showAugmentationChoiceScreen() {
    if (!augmentationChoicesContainer || !augmentationChoicePanel) return;
    augmentationPanelTitle.textContent = "Choose Upgrade!";
    augmentationChoicesContainer.innerHTML = '';
    let offeredAugs = [];

    let tempAvailableUpgrades = ALL_AUGMENTATIONS.filter(aug => {
        if (CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id)) return false;
        if (aug.rarity !== "Common" && chosenAugmentations.find(chosen => chosen.id === aug.id)) {
            return false;
        }
        return true;
    });

    for(let i=0; i<3; i++){
        let potentialAug = getWeightedRandomAugmentation(tempAvailableUpgrades, offeredAugs);
        if(potentialAug){
            offeredAugs.push(potentialAug);
            if (potentialAug.rarity !== "Common") {
                tempAvailableUpgrades = tempAvailableUpgrades.filter(aug => aug.id !== potentialAug.id);
            }
        } else if (ALL_AUGMENTATIONS.length > 0) {
            let fallbackAug = ALL_AUGMENTATIONS.find(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id) && !offeredAugs.some(oa => oa.id === a.id));
            if (fallbackAug) offeredAugs.push(fallbackAug);
            else if (offeredAugs.length < 3) {
                const nonClassAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id));
                if (nonClassAugs.length > 0) {
                    offeredAugs.push(nonClassAugs[Math.floor(Math.random() * nonClassAugs.length)]);
                }
            }
        }
    }
    offeredAugs = offeredAugs.slice(0,3);

    offeredAugs.forEach(aug => {
        if(!aug) return;
        const card = document.createElement('div');
        card.classList.add('augmentation-card', `rarity-${aug.rarity}`);
        card.innerHTML = `<h4>${aug.name}</h4><p>${aug.description}</p><div class="rarity-text">${aug.rarity}</div>`;
        card.addEventListener('click', () => selectAugmentation(aug.id));
        augmentationChoicesContainer.appendChild(card);
    });
    // augmentationChoicePanel.classList.remove('hidden'); // Handled by ui.js or main.js switchScreen
    if (updateRerollUI_func) updateRerollUI_func();
}

// These functions are called by event listeners on the cards, so they need player and potentially other state.
// They also need to trigger the game to resume. This will be handled by calling a function from main.js.
let finishUpgradeSelection_callback;

export function setFinishUpgradeSelectionCallback(callback) {
    finishUpgradeSelection_callback = callback;
}

export function selectAugmentation(augmentId) {
    const aug = ALL_AUGMENTATIONS.find(a => a.id === augmentId);
    if (aug && player) { // player needs to be accessible
        aug.apply(player);
        if (aug.rarity !== "Common") {
            chosenAugmentations.push({id: aug.id, rarity: aug.rarity});
        }
    }
    if (finishUpgradeSelection_callback) finishUpgradeSelection_callback();
}

export function selectSpecialization(specId) {
    const spec = CLASS_SPECIALIZATIONS.find(s => s.id === specId);
    if (spec && player && !chosenSpecializations.includes(spec.id)) { // player needs to be accessible
        spec.apply(player);
        // chosenSpecializations is pushed within the spec's apply method
    }
    if (finishUpgradeSelection_callback) finishUpgradeSelection_callback();
}

// Reroll logic might also go here or in ui.js depending on how it's structured
// For now, the reroll button event listener is in game.js, it calls these show...Screen functions.
// updateRerollUI is a good candidate for ui.js.

// The actual reroll action:
export function handleReroll() {
    // This function will be called by the reroll button in ui.js or main.js
    // It needs access to player and current game state (paused_augment or paused_class_choice)
    // For now, assume these are available or passed.
    // Let's say currentGameState is imported or passed.
    // import { player, gameState as currentGameState } from './game.js'; // Example
    
    // This is simplified. The actual currentGameState needs to be correctly obtained.
    // This function might better live in main.js or ui.js and call the appropriate show...Screen function.
    // For now, just showing the structure.
    
    // if (player && player.currentRerolls > 0) {
    //     player.currentRerolls--;
    //     if (currentGameState === 'paused_class_choice' || currentGameState === 'paused_second_class_choice') {
    //         showSpecializationChoiceScreen();
    //     } else if (currentGameState === 'paused_augment') {
    //         showAugmentationChoiceScreen();
    //     }
    //     if (updateRerollUI_func) updateRerollUI_func();
    // }
}
