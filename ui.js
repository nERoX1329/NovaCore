// UI related logic and DOM element management
import { getPlayer } from './player.js';
import { gameState as getGameState, setGameState } from './game.js'; // Assuming gameState is exported and has a setter from game.js (main.js)
// TODO: Resolve circular dependency if game.js also imports from ui.js for screens.
// Best to have game.js/main.js pass callbacks or necessary state to UI functions.

// --- DOM Element Getters ---
export const screens = {
    startMenu: document.getElementById('startMenuScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    pauseMenu: document.getElementById('pauseMenuScreen') // Added pauseMenu
};
export const canvas = document.getElementById('gameCanvas'); // May be needed by other modules too

export const gameUi = document.getElementById('gameUi');
export const levelDisplay = document.getElementById('levelDisplay');
export const scoreDisplay = document.getElementById('scoreDisplay');
export const hpDisplay = document.getElementById('hpDisplay');
export const maxHpDisplay = document.getElementById('maxHpDisplay');
export const xpBarElement = document.getElementById('xpBar');
export const xpProgressTextElement = document.getElementById('xpProgressText');

export const augmentationChoicePanel = document.getElementById('augmentationChoicePanel');
export const augmentationPanelTitle = document.getElementById('augmentationPanelTitle');
export const augmentationChoicesContainer = document.getElementById('augmentationChoices');
export const rerollButtonElement = document.getElementById('rerollButtonElement');
export const rerollsAvailableDisplay = document.getElementById('rerollsAvailableDisplay');

// --- Screen Management ---
export function switchScreen(screenName) {
    // console.log("ui.js switchScreen called with screenName:", screenName);
    Object.values(screens).forEach(s => {
        if (s) {
            s.classList.remove('active'); // Ensure all are inactive first
            s.classList.add('hidden');    // Then hide them
        }
    });

    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
        setGameState(screenName); // Update game state via imported setter
    } else {
        console.error("Error: Screen not found in ui.js - " + screenName + ". Defaulting to startMenu.");
        if (screens.startMenu) {
            screens.startMenu.classList.remove('hidden');
            screens.startMenu.classList.add('active');
        }
        setGameState('startMenu'); // Reflect fallback state
        return;
    }

    // Manage visibility of game UI elements based on the current screen
    const currentGameState = getGameState(); // Use getter
    if (gameUi) {
        // Show gameUi if on game screen or any augmentation/class choice pause state
        // Hide it for startMenu, gameOver, and the new pauseMenu
        if (currentGameState === 'game' || currentGameState === 'paused_augment' || currentGameState === 'paused_class_choice' || currentGameState === 'paused_second_class_choice') {
            gameUi.classList.remove('hidden');
        } else {
            gameUi.classList.add('hidden');
        }
    }

    // Manage visibility of augmentation choice panel
    if (augmentationChoicePanel) {
        if (currentGameState === 'paused_augment' || currentGameState === 'paused_class_choice' || currentGameState === 'paused_second_class_choice') {
            augmentationChoicePanel.classList.remove('hidden');
        } else {
            augmentationChoicePanel.classList.add('hidden');
        }
    }
}


// --- UI Update Functions ---
export function updateGameUI(currentScore, currentLevelXP, xpToNextLevel) { // Pass necessary values
    const currentPlayer = getPlayer();
    if (!currentPlayer) {
        // console.warn("updateGameUI called but player is not available.");
        // Optionally clear or hide UI elements if no player
        if(levelDisplay) levelDisplay.textContent = '-';
        if(scoreDisplay) scoreDisplay.textContent = '-';
        if(hpDisplay) hpDisplay.textContent = '-';
        if(maxHpDisplay) maxHpDisplay.textContent = '-';
        if(xpBarElement) xpBarElement.style.width = '0%';
        if(xpProgressTextElement) xpProgressTextElement.textContent = '-/- XP';
        return;
    }

    if(levelDisplay) levelDisplay.textContent = currentPlayer.level;
    if(scoreDisplay) scoreDisplay.textContent = currentScore; // Use passed score
    if(hpDisplay) hpDisplay.textContent = Math.max(0, Math.ceil(currentPlayer.hp));
    if(maxHpDisplay) maxHpDisplay.textContent = currentPlayer.maxHp;

    if(xpBarElement && xpProgressTextElement) {
        const xpPercentage = Math.max(0, Math.min(100, (currentLevelXP / xpToNextLevel) * 100));
        xpBarElement.style.width = xpPercentage + '%';
        xpProgressTextElement.textContent = `${currentLevelXP}/${xpToNextLevel} XP`;
    }
}

export function updateRerollUI() {
    const currentPlayer = getPlayer();
    if (currentPlayer && rerollsAvailableDisplay && rerollButtonElement) {
        rerollsAvailableDisplay.textContent = currentPlayer.currentRerolls;
        rerollButtonElement.disabled = currentPlayer.currentRerolls <= 0;
    } else if (rerollsAvailableDisplay && rerollButtonElement) { // Ensure UI is cleared if no player
        rerollsAvailableDisplay.textContent = '0';
        rerollButtonElement.disabled = true;
    }
}

export function updateFinalScoreUI(finalScore, levelReached) {
    const finalScoreDisplay = document.getElementById('finalScoreDisplay');
    const finalLevelDisplay = document.getElementById('finalLevelDisplay');
    if (finalScoreDisplay) finalScoreDisplay.textContent = finalScore;
    if (finalLevelDisplay) finalLevelDisplay.textContent = levelReached;
}

// This function could be called from main.js at the start
export function initializeUI() {
    // console.log("UI Initialized. Screens:", screens);
    // Any other UI setup that needs to happen once
    updateRerollUI(); // Initial state for reroll button
}
