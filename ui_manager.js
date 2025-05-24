// ui_manager.js

// DOM-Element-Referenzen (die meisten sollten global sein, aber hier für Klarheit nochmal gesammelt,
// oder sie werden direkt aus dem globalen Scope verwendet, wenn sie in main.js/HTML deklariert wurden)

// Annahme: Diese Konstanten werden im Hauptskript (oder einer zentralen Initialisierungsdatei) deklariert,
// sobald die DOM-Elemente verfügbar sind. Hier definieren wir die Funktionen, die sie verwenden.
// Für dieses Beispiel greifen wir direkt auf die global erwarteten IDs zu.

function switchScreen(screenName) {
    // Verstecke alle Hauptbildschirme zuerst
    if (screens.startMenu) screens.startMenu.classList.add('hidden');
    if (screens.game) screens.game.classList.add('hidden');
    if (screens.gameOver) screens.gameOver.classList.add('hidden');

    const pauseMenu = document.getElementById('pauseMenuScreen');
    const metaShop = document.getElementById('metaShopScreen');
    if (pauseMenu) pauseMenu.classList.add('hidden');
    if (metaShop) metaShop.classList.add('hidden');

    let targetScreenElement = null;
    if (screens[screenName]) {
        targetScreenElement = screens[screenName];
    } else if (screenName === 'pauseMenu' && pauseMenu) {
        targetScreenElement = pauseMenu;
    } else if (screenName === 'metaShop' && metaShop) {
        targetScreenElement = metaShop;
        updateMetaShopUI(); // Meta Shop UI aktualisieren, wenn er angezeigt wird
    }

    if (targetScreenElement) {
        targetScreenElement.classList.remove('hidden');
        targetScreenElement.classList.add('active'); // 'active' wird hier nicht mehr für display:flex genutzt, nur 'hidden'
    } else {
        console.error("Error: Screen not found in switchScreen - " + screenName);
        if(screens.startMenu) screens.startMenu.classList.remove('hidden'); // Fallback zum Startmenü
        gameState = 'startMenu';
        return;
    }

    gameState = screenName; // Setze den globalen Spielzustand

    // Sichtbarkeit der Spiel-UI (Level, Score etc.)
    const gameUiElement = document.getElementById('gameUi');
    if (gameUiElement) {
        if (screenName === 'game') gameUiElement.classList.remove('hidden');
        else gameUiElement.classList.add('hidden');
    }

    // Sichtbarkeit des Augmentierungs-Panels
    const augChoicePanel = document.getElementById('augmentationChoicePanel');
    if (augChoicePanel) {
        if (gameState === 'paused_augment' || gameState === 'paused_class_choice' || gameState === 'paused_second_class_choice') {
             augChoicePanel.classList.remove('hidden');
        } else {
             augChoicePanel.classList.add('hidden');
        }
    }
}

function updateGameUI() {
    if (!player || !document.getElementById('gameUi')) return;

    const levelDisp = document.getElementById('levelDisplay');
    const scoreDisp = document.getElementById('scoreDisplay');
    const hpDisp = document.getElementById('hpDisplay');
    const maxHpDisp = document.getElementById('maxHpDisplay');
    const xpBarEl = document.getElementById('xpBar');
    const xpProgressTextEl = document.getElementById('xpProgressText');
    const gameUiContainer = document.getElementById('gameUi');


    if(levelDisp) levelDisp.textContent = player.level;
    if(scoreDisp) scoreDisp.textContent = score; // Globale Variable 'score'
    if(hpDisp) hpDisp.textContent = Math.max(0, Math.ceil(player.hp));
    if(maxHpDisp) maxHpDisp.textContent = player.maxHp;

    // Schild-Anzeige
    const shieldBarContainerId = 'shieldBarContainerInUI';
    let shieldBarContainer = document.getElementById(shieldBarContainerId);
    if (player.maxShield > 0) {
        if (!shieldBarContainer && gameUiContainer) {
            shieldBarContainer = document.createElement('div');
            shieldBarContainer.id = shieldBarContainerId;
            shieldBarContainer.classList.add('shield-bar-container');
            shieldBarContainer.innerHTML = `<div id="shieldBar" style="background-color: var(--shield-bar-fg);"></div><span id="shieldProgressText">${Math.ceil(player.shield)}/${player.maxShield} S</span>`;
            const hpElement = Array.from(gameUiContainer.children).find(child => child.textContent && child.textContent.startsWith("HP:"));
            if (hpElement && hpElement.nextSibling) {
                gameUiContainer.insertBefore(shieldBarContainer, hpElement.nextSibling);
            } else {
                gameUiContainer.appendChild(shieldBarContainer);
            }
        }
        const shieldBarElement = document.getElementById('shieldBar');
        const shieldProgressTextElement = document.getElementById('shieldProgressText');
        if(shieldBarElement && shieldProgressTextElement) {
            const shieldPercentage = player.maxShield > 0 ? Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100)) : 0;
            shieldBarElement.style.width = shieldPercentage + '%';
            shieldProgressTextElement.textContent = `${Math.max(0, Math.ceil(player.shield))}/${player.maxShield} S`;
        }
    } else if (shieldBarContainer) {
        shieldBarContainer.remove();
    }

    // Munitions-Anzeige
    const ammoBarContainerId = 'ammoBarContainerInUI';
    let ammoBarContainer = document.getElementById(ammoBarContainerId);
    if (player.hasOwnProperty('maxAmmo')) {
        if (!ammoBarContainer && gameUiContainer) {
            ammoBarContainer = document.createElement('div');
            ammoBarContainer.id = ammoBarContainerId;
            ammoBarContainer.classList.add('ammo-bar-container');
            ammoBarContainer.innerHTML = `<div id="ammoBar"></div><span id="ammoProgressText">${player.currentAmmo}/${player.maxAmmo}</span>`;
            const targetElementForAmmo = document.getElementById(shieldBarContainerId) || Array.from(gameUiContainer.children).find(child => child.textContent && child.textContent.startsWith("HP:"));
            if (targetElementForAmmo && targetElementForAmmo.nextSibling) {
                gameUiContainer.insertBefore(ammoBarContainer, targetElementForAmmo.nextSibling);
            } else {
                gameUiContainer.appendChild(ammoBarContainer);
            }
        }
        const ammoBarElement = document.getElementById('ammoBar');
        const ammoProgressTextElement = document.getElementById('ammoProgressText');
        if (ammoBarElement && ammoProgressTextElement) {
            const ammoPercentage = player.maxAmmo > 0 ? Math.max(0, Math.min(100, (player.currentAmmo / player.maxAmmo) * 100)) : 0;
            ammoBarElement.style.width = ammoPercentage + '%';
            ammoProgressTextElement.textContent = `${player.currentAmmo}/${player.maxAmmo}`;

            if (player.isReloading) {
                 ammoProgressTextElement.textContent = `RELOADING`;
                 const reloadProgress = player.reloadTime > 0 ? Math.max(0, 100 - ((player.reloadTimer / player.reloadTime) * 100)) : 100;
                 ammoBarElement.style.width = reloadProgress + '%';
                 ammoBarElement.style.backgroundColor = '#FF8C00'; // Orange für Reload
            } else {
                ammoBarElement.style.backgroundColor = getCssVar('--ammo-bar-fg');
            }
        }
    } else if (ammoBarContainer) {
        ammoBarContainer.remove();
    }

    const currentXPForLevel = Math.max(0, Math.floor(currentLevelXP)); // Globale Variable currentLevelXP
    const xpNeeded = xpToNextLevel; // Globale Variable xpToNextLevel
    const xpPercentage = (xpNeeded > 0) ? Math.max(0, Math.min(100, (currentXPForLevel / xpNeeded) * 100)) : 0;

    if(xpBarEl) xpBarEl.style.width = xpPercentage + '%';
    if(xpProgressTextEl) xpProgressTextEl.textContent = `${currentXPForLevel}/${xpNeeded} XP`;
}

function showAugmentationChoiceScreen() {
    const augChoicePanel = document.getElementById('augmentationChoicePanel');
    const augChoicesContainer = document.getElementById('augmentationChoices');
    const augPanelTitle = document.getElementById('augmentationPanelTitle');

    if (!augChoicesContainer || !augChoicePanel || !player || !augPanelTitle) return;

    augPanelTitle.textContent = "Choose Upgrade!";
    augChoicesContainer.innerHTML = '';
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
                tempAvailableUpgrades = tempAvailableUpgrades.filter(aug => !offeredAugs.some(offered => offered.id === aug.id)); // Update pool
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
             if (fallbackPool.length > 0) {
                const newFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
                offeredAugs.push(newFallback);
                tempAvailableUpgrades = tempAvailableUpgrades.filter(aug => aug.id !== newFallback.id);
             } else break;
        }
    }
    offeredAugs = offeredAugs.filter(aug => aug !== undefined).slice(0,3);

    offeredAugs.forEach(aug => {
        if(!aug) return;
        const card = document.createElement('div');
        card.classList.add('augmentation-card', `rarity-${aug.rarity}`);
        card.innerHTML = `<h4>${aug.name}</h4><p>${aug.description}</p><div class="rarity-text">${aug.rarity}</div>`;
        card.addEventListener('click', () => selectAugmentation(aug.id));
        augChoicesContainer.appendChild(card);
    });
    augChoicePanel.classList.remove('hidden');
    updateRerollUI();
}

function showSpecializationChoiceScreen() {
    const augChoicePanel = document.getElementById('augmentationChoicePanel');
    const augChoicesContainer = document.getElementById('augmentationChoices');
    const augPanelTitle = document.getElementById('augmentationPanelTitle');

    if (!augChoicesContainer || !augChoicePanel || !augPanelTitle) return;
    augChoicesContainer.innerHTML = '';
    augPanelTitle.textContent = "Choose Your Specialization!";

    const availableClasses = CLASS_SPECIALIZATIONS.filter(spec => !chosenSpecializations.includes(spec.id));
    const shuffledClasses = [...availableClasses].sort(() => 0.5 - Math.random());
    const offeredClasses = shuffledClasses.slice(0, Math.min(3, availableClasses.length));

    offeredClasses.forEach(spec => {
        const card = document.createElement('div');
        card.classList.add('augmentation-card', `rarity-${spec.rarity}`);
        card.innerHTML = `<h4>${spec.name}</h4><p>${spec.description}</p><div class="rarity-text">${spec.rarity}</div>`;
        card.addEventListener('click', () => selectSpecialization(spec.id));
        augChoicesContainer.appendChild(card);
    });
    augChoicePanel.classList.remove('hidden');
    updateRerollUI();
}

function updateRerollUI() {
    const rerollsDisp = document.getElementById('rerollsAvailableDisplay');
    const rerollBtn = document.getElementById('rerollButtonElement');
    if (player && rerollsDisp && rerollBtn) {
        rerollsDisp.textContent = player.currentRerolls;
        rerollBtn.disabled = player.currentRerolls <= 0;
    }
}

function updatePauseMenuStatsUI() {
    const statsDisplay = document.getElementById('pauseStatsDisplay');
    if (!player || !statsDisplay) return;
    statsDisplay.innerHTML = ''; // Clear old stats

    const effectiveDamage = (player.effectiveBaseDamage || player.baseStats.damage) * (player.damageMultiplier || 1.0);
    let currentShotsPerSecond = player.shotsPerSecond;
     if (player.adrenalineTimer > 0) {
        currentShotsPerSecond *= (1 + player.adrenalineFireRateBonus);
    }
    if (player.secondWindActiveTimer > 0) {
        currentShotsPerSecond *= (1 + player.secondWindFireRateBonus);
    }

    const statsToShow = {
        "HP": `${Math.ceil(player.hp)} / ${player.maxHp}`,
        "Shield": player.maxShield > 0 ? `${Math.ceil(player.shield)} / ${player.maxShield}` : "N/A",
        "Total Damage": `${effectiveDamage.toFixed(1)}`,
        "Fire Rate": `${currentShotsPerSecond.toFixed(2)}/s`,
        "Crit Chance": `${((player.critChance || 0) * 100).toFixed(0)}%`,
        "Crit Damage": `${((player.critDamageMultiplier || 1.5) * 100).toFixed(0)}%`,
        "Move Speed": `${((player.speed / player.baseStats.speed) * 100).toFixed(0)}%`,
        "Projectiles": `${player.numProjectiles || 1}`,
        "Proj. Speed": `${((player.bulletSpeed / player.baseStats.bulletSpeed) * 100).toFixed(0)}%`,
        "Piercing": `${player.bulletPiercing || 0}`,
        "Bounces": `${player.projectileBounces || 0}`,
        "XP Gain Multi": `${((player.xpGainMultiplier || 1.0) * 100).toFixed(0)}%`,
        "Luck Factor": `${((player.luckFactor || 1.0) * 100).toFixed(0)}%`,
        "Ammo": player.hasOwnProperty('maxAmmo') ? `${player.currentAmmo} / ${player.maxAmmo}` : "N/A",
        "Reload Time": player.hasOwnProperty('reloadTime') ? `${(player.reloadTime / 1000).toFixed(2)}s` : "N/A",
        "Damage Reduction": `${((player.damageReduction || 0) * 100).toFixed(0)}%`,
        "HP Regen": `${(player.hpRegenRate || 0).toFixed(1)}/s`,
    };

    for (const [statName, statValue] of Object.entries(statsToShow)) {
        const statDiv = document.createElement('div');
        statDiv.innerHTML = `${statName}: <span>${statValue}</span>`;
        statsDisplay.appendChild(statDiv);
    }
}

function updateMetaShopUI() {
    const upgradesContainer = document.getElementById('metaUpgradesContainer');
    const shopCurrencyDisplay = document.getElementById('shopMetaCurrency');

    if (!upgradesContainer || !metaProgress || !META_UPGRADES_DEFINITIONS) return;

    if (shopCurrencyDisplay) shopCurrencyDisplay.textContent = metaProgress.metaCurrency;
    upgradesContainer.innerHTML = ''; // Clear old upgrades

    for (const id in META_UPGRADES_DEFINITIONS) {
        const def = META_UPGRADES_DEFINITIONS[id];
        const currentUpgradeData = metaProgress.boughtUpgrades[id] || { level: 0 };
        const currentLevel = currentUpgradeData.level;
        const maxLevel = def.maxLevel;
        const canUpgrade = currentLevel < maxLevel;
        const cost = canUpgrade ? def.costPerLevel[currentLevel] : "MAX";

        const card = document.createElement('div');
        card.classList.add('augmentation-card');
        card.style.width = "calc(50% - 20px)"; // Zwei Karten pro Zeile mit etwas Abstand
        card.style.minHeight = "120px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";


        let buttonHtml = "";
        if (canUpgrade) {
            buttonHtml = `<button class="buy-meta-button" data-id="${id}" ${metaProgress.metaCurrency < cost ? 'disabled' : ''}>Upgrade (${cost} NS)</button>`;
        } else {
            buttonHtml = `<button disabled>Max Level</button>`;
        }

        card.innerHTML = `
            <div>
                <h4>${def.name}</h4>
                <p style="font-size:0.65em; margin-bottom: 5px;">${def.description}</p>
                <p style="font-size:0.6em;">Level: ${currentLevel}/${maxLevel}</p>
            </div>
            ${buttonHtml}
        `;
        upgradesContainer.appendChild(card);
    }

    document.querySelectorAll('.buy-meta-button').forEach(button => {
        button.removeEventListener('click', handleMetaUpgradeBuy); // Entferne alte Listener
        button.addEventListener('click', handleMetaUpgradeBuy);    // Füge neue hinzu
    });
}

function handleMetaUpgradeBuy(event) { // Eigene Handler-Funktion, um "this" korrekt zu binden
    const upgradeId = event.target.dataset.id;
    buyMetaUpgrade(upgradeId);
}


function buyMetaUpgrade(upgradeId) {
    const def = META_UPGRADES_DEFINITIONS[upgradeId];
    const currentUpgradeData = metaProgress.boughtUpgrades[upgradeId] || { level: 0 };
    const currentLevel = currentUpgradeData.level;

    if (currentLevel < def.maxLevel) {
        const cost = def.costPerLevel[currentLevel];
        if (metaProgress.metaCurrency >= cost) {
            metaProgress.metaCurrency -= cost;
            currentUpgradeData.level++;
            metaProgress.boughtUpgrades[upgradeId] = currentUpgradeData;

            saveMetaProgress(); // Fortschritt speichern
            loadMetaProgress(); // Boni im metaProgress Objekt neu berechnen (bonusStartHp etc.)
            showMetaShopUI();   // UI des Shops neu zeichnen
        } else {
            // Optional: Visuelles Feedback, dass nicht genug Währung vorhanden ist
            console.log("Not enough Nova Shards to buy " + def.name);
        }
    }
}
// --- END VIRTUAL FILE: ui_manager.js ---