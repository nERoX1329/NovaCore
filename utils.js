// utils.js

function loadMetaProgress() {
    try {
        const savedData = localStorage.getItem('novaCoreMetaProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            metaProgress.metaCurrency = parsedData.metaCurrency || 0;
            // Stelle sicher, dass boughtUpgrades ein Objekt ist, auch wenn es null/undefined im localStorage war
            metaProgress.boughtUpgrades = parsedData.boughtUpgrades || {};
            console.log("Loaded from localStorage:", metaProgress);
        } else {
            console.log("No Meta Progress found in localStorage, using initial defaults.");
            // Initialwerte sind bereits in metaProgress in config.js gesetzt
        }
    } catch (error) {
        console.error("Error loading meta progress from localStorage:", error);
        // Bei Fehler auf sichere Standardwerte zurückfallen
        metaProgress.metaCurrency = 0;
        metaProgress.boughtUpgrades = {};
    }

    // Berechne nun die konkreten Boni basierend auf den geladenen (oder Standard-) boughtUpgrades
    // Setze alle Boni zuerst auf 0 oder ihre Standard-Multiplikatorwerte zurück
    metaProgress.bonusStartHp = 0;
    metaProgress.bonusBaseDamage = 0;
    metaProgress.permanentRerolls = 0;
    metaProgress.bonusBaseSpeed = 0; // Falls als Meta-Upgrade hinzugefügt
    metaProgress.bonusBaseShotsPerSecond = 0;
    metaProgress.bonusBulletSpeed = 0;
    metaProgress.bonusNumProjectiles = 0;
    metaProgress.bonusBulletPiercing = 0;
    metaProgress.bonusCritChance = 0;
    metaProgress.bonusCritDamageMultiplier = 0;
    metaProgress.bonusLuckFactor = 0;
    metaProgress.bonusMaxAmmoFactor = 1.0; // Startet als Multiplikator von 1
    metaProgress.bonusReloadSpeedFactor = 1.0; // Startet als Multiplikator von 1


    if (metaProgress.boughtUpgrades && typeof META_UPGRADES_DEFINITIONS === 'object') {
        for (const upgradeId in metaProgress.boughtUpgrades) {
            const upgradeData = metaProgress.boughtUpgrades[upgradeId];
            const definition = META_UPGRADES_DEFINITIONS[upgradeId];

            if (definition && upgradeData && typeof upgradeData.level === 'number' && upgradeData.level > 0) {
                const bonusValue = definition.applyBonus(upgradeData.level);
                switch (upgradeId) {
                    case "meta_start_hp":
                        metaProgress.bonusStartHp += bonusValue;
                        break;
                    case "meta_base_damage":
                        metaProgress.bonusBaseDamage += bonusValue;
                        break;
                    case "meta_permanent_rerolls":
                        metaProgress.permanentRerolls += bonusValue;
                        break;
                    case "meta_max_ammo": // Ist ein Faktor, der auf 1.0 addiert wird
                        metaProgress.bonusMaxAmmoFactor = bonusValue; // applyBonus gibt direkt den Faktor zurück
                        break;
                    case "meta_reload_speed": // Ist ein Multiplikator
                        metaProgress.bonusReloadSpeedFactor = bonusValue; // applyBonus gibt direkt den Faktor zurück
                        break;
                    // Füge hier Cases für weitere Meta-Upgrades hinzu
                    // case "meta_base_speed":
                    //     metaProgress.bonusBaseSpeed += bonusValue; // Wenn applyBonus den additiven Wert zurückgibt
                    //     break;
                }
            }
        }
    }
    // console.log("Calculated Meta Bonuses:", metaProgress);

    // Aktualisiere UI-Elemente, die die Meta-Währung anzeigen (falls sie schon existieren)
    const startMenuCurrencyDisplay = document.getElementById('startMenuMetaCurrency');
    if(startMenuCurrencyDisplay) startMenuCurrencyDisplay.textContent = metaProgress.metaCurrency;

    const shopCurrencyDisplay = document.getElementById('shopMetaCurrency');
    if(shopCurrencyDisplay) shopCurrencyDisplay.textContent = metaProgress.metaCurrency;
}

function saveMetaProgress() {
    try {
        const dataToSave = {
            metaCurrency: metaProgress.metaCurrency,
            boughtUpgrades: metaProgress.boughtUpgrades
        };
        localStorage.setItem('novaCoreMetaProgress', JSON.stringify(dataToSave));
        // console.log("Meta Progress Saved to localStorage:", dataToSave);
    } catch (error) {
        console.error("Error saving meta progress to localStorage:", error);
    }
}


function getWeightedRandomAugmentation(pool, currentOffer) {
    // Diese Funktion benötigt die globale Variable 'player', die später definiert wird.
    // Sie wird erst während des Spiels aufgerufen, wenn 'player' existiert.
    if (!player) {
        console.warn("getWeightedRandomAugmentation called before player initialized.");
        // Fallback: einfach ein zufälliges Item aus dem Pool, wenn kein Spieler da ist (sollte nicht passieren im normalen Fluss)
        return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    }

    let availablePool = pool.filter(aug => {
        if (CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id)) return false;
        // Common Augments können mehrfach angeboten werden, aber nicht im selben Auswahlset
        if (aug.rarity === "Common") { return !currentOffer.some(sel => sel.id === aug.id); }
        // Nicht-Common Augments können nur einmal pro Run gewählt werden (über player.activeAugmentations)
        // UND nicht im aktuellen Angebot doppelt sein
        return !player.activeAugmentations.some(pa => pa.id === aug.id) &&
               !currentOffer.some(sel => sel.id === aug.id);
    });

    if (availablePool.length === 0) {
        availablePool = pool.filter(aug => aug.rarity === "Common" && !currentOffer.some(sel => sel.id === aug.id));
        if (availablePool.length === 0) { // Wenn selbst keine Commons mehr gehen (extrem seltener Fall)
            const nonClassPool = pool.filter(aug => !CLASS_SPECIALIZATIONS.find(cs => cs.id === aug.id) && !currentOffer.some(sel => sel.id === aug.id));
             if (nonClassPool.length > 0) return nonClassPool[Math.floor(Math.random() * nonClassPool.length)];
            // Absoluter Notfall-Fallback
            const allNonClassAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id));
            return allNonClassAugs.length > 0 ? allNonClassAugs[0] : null;
        }
    }

    const baseWeights = {"Common": 40, "Uncommon": 30, "Rare": 18, "Epic": 8, "Legendary": 4};
    let totalWeight = 0;
    const weightedPool = availablePool.map(aug => {
        let weight = baseWeights[aug.rarity] || 1;
        if (player && player.luckFactor > 1.0) { // player.luckFactor von initPlayer oder Augments
            if (aug.rarity === "Uncommon") weight *= player.luckFactor * 1.1;
            else if (aug.rarity === "Rare") weight *= player.luckFactor * 1.25;
            else if (aug.rarity === "Epic") weight *= player.luckFactor * 1.4;
            else if (aug.rarity === "Legendary") weight *= player.luckFactor * 1.7;
        }
        totalWeight += weight;
        return { ...aug, weight };
    });

    if (totalWeight === 0) { // Sollte durch die Fallbacks oben nicht mehr erreicht werden
         if (availablePool.length > 0) return availablePool[Math.floor(Math.random() * availablePool.length)];
         const allNonClassAugs = ALL_AUGMENTATIONS.filter(a => !CLASS_SPECIALIZATIONS.find(cs => cs.id === a.id));
         return allNonClassAugs.length > 0 ? allNonClassAugs[0] : null;
    }

    let randomNum = Math.random() * totalWeight;
    for (let aug of weightedPool) {
        randomNum -= aug.weight;
        if (randomNum <= 0) return aug;
    }
    // Fallback, falls durch Rundungsfehler etc. kein Augment gefunden wurde
    return weightedPool.length > 0 ? weightedPool[weightedPool.length - 1] : (availablePool.length > 0 ? availablePool[0] : null);
}

function recalculateAugmentSynergy() {
    if (!player || !player.augmentSynergizerActive) return;

    // Entferne alte Synergie-Boni, bevor neu berechnet wird
    if (player.synergyDamageBonus) {
        player.damageMultiplier = (player.damageMultiplier || 1.0) - player.synergyDamageBonus;
        if(player.damageMultiplier < 0.1) player.damageMultiplier = 0.1; // Sicherheitsnetz
    }
    if (player.synergyMaxHpBonus) {
        const oldHpPercentage = player.maxHp > 0 ? player.hp / player.maxHp : 1;
        player.maxHp = Math.max(10, player.maxHp - player.synergyMaxHpBonus); // Stelle sicher, dass MaxHP nicht zu niedrig wird
        player.hp = Math.floor(player.maxHp * oldHpPercentage); // Passe HP an
        player.hp = Math.min(player.hp, player.maxHp); // Stelle sicher, dass HP nicht MaxHP übersteigt
    }
    player.synergyDamageBonus = 0;
    player.synergyMaxHpBonus = 0;

    let rarityCounts = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0 };
    if (player.activeAugmentations) {
        player.activeAugmentations.forEach(aug => {
            if (aug.rarity !== 'System' && rarityCounts[aug.rarity] !== undefined) {
                rarityCounts[aug.rarity]++;
            }
        });
    }

    let totalSynergySets = 0;
    Object.values(rarityCounts).forEach(count => {
        totalSynergySets += Math.floor(count / 3);
    });

    if (totalSynergySets > 0) {
        const damageBonusPerSet = 0.05;
        const maxHpBonusValuePerSet = 10; // Fester Wert für Max HP Bonus pro Set

        player.synergyDamageBonus = totalSynergySets * damageBonusPerSet;
        player.damageMultiplier = (player.damageMultiplier || 1.0) + player.synergyDamageBonus;

        player.synergyMaxHpBonus = totalSynergySets * maxHpBonusValuePerSet;
        const oldHpPercentageBeforeAdd = player.maxHp > 0 ? player.hp / player.maxHp : 1;
        player.maxHp += player.synergyMaxHpBonus;
        player.hp = Math.floor(Math.min(player.maxHp, player.maxHp * oldHpPercentageBeforeAdd + player.synergyMaxHpBonus));
        player.hp = Math.max(0, player.hp);
    }
    // console.log(`Synergy Core: ${totalSynergySets} sets. New DMG Multi: ${player.damageMultiplier}, New MaxHP: ${player.maxHp}`);
}