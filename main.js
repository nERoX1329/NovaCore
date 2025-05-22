// --- DOM Element Getters & Basic Setup ---
const screens = {
    startMenu: document.getElementById('startMenuScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen')
    // pauseMenu screen element is removed as per last request
};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Import utility functions
import { getCssVar } from './utils.js';
// Import configuration constants
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_REROLLS_PER_CHOICE } from './config.js';
// Import player related modules
import { initPlayer as initPlayerSystem, updatePlayer as updatePlayerSystem, drawPlayer as drawPlayerSystem, getPlayer, playerTakeDamage, initializePlayerSystem } from './player.js';
// Import enemy related modules
import { spawnEnemy as spawnEnemySystem, updateEnemies as updateEnemiesSystem, drawEnemies as drawEnemiesSystem, getEnemies, initializeEnemySystem, resetEnemiesState, handleEnemyDefeat } from './enemy.js';
// Import bullet related modules
import { updateBullets as updateBulletsSystem, drawBullets as drawBulletsSystem, resetBulletsState } from './bullet.js';
// Import XP Orb related modules
import { spawnXPOrb as spawnXPOrbSystem, updateXPOrbs as updateXPOrbsSystem, drawXPOrbs as drawXPOrbsSystem, resetXPOrbsState } from './xp_orb.js';
// Import UI related modules
import {
    // screens, // screens is used internally by ui.js's switchScreenUI
    canvas as uiCanvas, // Use this canvas reference
    // gameUi, levelDisplay, scoreDisplay, hpDisplay, maxHpDisplay, // These are used by ui.js's updateGameUISystem
    // xpBarElement, xpProgressTextElement, // Used by ui.js's updateGameUISystem
    augmentationChoicePanel, augmentationPanelTitle, augmentationChoicesContainer, // Used by initializeAugmentationUI
    // rerollButtonElement, rerollsAvailableDisplay, // Used by ui.js's updateRerollUISystem
    switchScreen as switchScreenUI, updateGameUI as updateGameUISystem, updateRerollUI as updateRerollUISystem,
    updateFinalScoreUI, initializeUI
} from './ui.js';

// DOM elements like startGameButton are usually specific to main.js or handled by ui.js initialization
const startGameButton = document.getElementById('startGameButton'); 
const restartGameButton = document.getElementById('restartGameButton'); 
const resumeGameButton = document.getElementById('resumeGameButton'); // Added
const pauseToMenuButton = document.getElementById('pauseToMenuButton'); // Added

// Canvas and Context
let ctx; // Define ctx in main.js
if (uiCanvas) {
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    ctx = uiCanvas.getContext('2d'); // Get context from the imported canvas
} else {
    console.error("Canvas element not found or not provided by ui.js!");
}

// --- Game State Variables ---
export let gameState = 'startMenu';
export function setGameState(newState) { 
    gameState = newState;
}
export let gameRunning = false;
let animationFrameId;

// let player; // Player object is now managed within player.js
export let bullets = []; // Export bullets
// export let enemies = []; // enemies array is now managed within enemy.js
export let xpOrbs = []; // Export xpOrbs

export let keys = {}; // Export keys
export let mouse = { x: 0, y: 0, down: false }; // Export mouse - player.js will import this

export let score = 0; // Export score
let currentLevelXP = 0;
let xpToNextLevel = 40;
// const BASE_REROLLS_PER_CHOICE = 3; // Moved to config.js
export let chosenAugmentations = []; // Tracks chosen non-common augments // Export for augmentations.js
export let chosenSpecializations = []; // Tracks chosen class specializations // Export for augmentations.js

// Import augmentations
import {
    // CLASS_SPECIALIZATIONS, // Augmentation data itself is used within augmentations.js
    // ALL_AUGMENTATIONS,    // No longer directly used in game.js
    showSpecializationChoiceScreen,
    showAugmentationChoiceScreen,
    // selectAugmentation, // Handled by augmentations.js via callback
    // selectSpecialization, // Handled by augmentations.js via callback
    setFinishUpgradeSelectionCallback,
    initializeAugmentationUI
} from './augmentations.js';

// --- Screen Management ---
// switchScreen is now imported as switchScreenUI from ui.js

// --- Player Initialization ---
// initPlayer is now imported as initPlayerSystem from player.js.
// It will set the player object within player.js.

// --- Enemy Spawning ---
// spawnEnemy is now imported as spawnEnemySystem from enemy.js
// It will use getPlayer() internally and add to its own 'enemies' array.

// spawnXPOrb is now imported as spawnXPOrbSystem from xp_orb.js
// It will take xpOrbs array as the first argument.

// --- Update Functions ---
// updatePlayer is now imported as updatePlayerSystem from player.js
// updateBullets is now imported as updateBulletsSystem from bullet.js
// updateEnemies is now imported as updateEnemiesSystem from enemy.js
// updateXPOrbs is now imported as updateXPOrbsSystem from xp_orb.js

// --- Collision Detection ---
function checkCollisions() {
    const currentPlayer = getPlayer();
    if (!currentPlayer) return;
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
                if (currentPlayer.critChance && Math.random() < currentPlayer.critChance) { // Use currentPlayer
                    damageDealt *= (currentPlayer.critDamageMultiplier || 1.5); // Basic crit damage
                }
                e.hp -= damageDealt;
                bullets.splice(i, 1); // Remove bullet on hit (PROBLEM: bullets is global, but e is from getEnemies())
                                      // This collision logic needs to be robust.
                                      // For now, we'll assume e has hp and can be modified.
                                      // And handleEnemyDefeat will be called.
                if (e.hp <= 0 && !e.isDefeated) {
                    handleEnemyDefeat(e); // Call from enemy.js to handle XP orb spawning and score
                    // The actual removal of 'e' from 'enemies' array will be handled by enemy.js logic or main loop
                }
                break; // Bullet can only hit one enemy
            }
        }
    }
    // Player vs Enemies
    const currentEnemies = getEnemies(); // Get current list of enemies
    for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const e = currentEnemies[i];
        if (e.isDefeated) continue;

        const dist = Math.sqrt(Math.pow(currentPlayer.x - (e.x + e.width/2), 2) + Math.pow(currentPlayer.y - (e.y + e.height/2), 2)); // Use currentPlayer
        if (dist < currentPlayer.radius + e.width/2 * 0.8) { // Collision with enemy
            playerTakeDamage(10); // Use imported function
            handleEnemyDefeat(e); // Mark enemy as defeated, handle XP/score
            // currentEnemies.splice(i, 1); // Let enemy.js or main loop handle removal
            if (currentPlayer.hp <= 0) { // Use currentPlayer
                gameOver(); // Call original gameOver from this file (main.js)
                return; // Stop further checks if game over
            }
        }
    }
}

// --- Game Logic (Damage, XP, Level Up) ---
function gainXP(amount) {
    const currentPlayer = getPlayer();
    if (!currentPlayer) return;
    currentLevelXP += amount;
    if (currentLevelXP >= xpToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    const currentPlayer = getPlayer();
    if (!currentPlayer) return;
    currentPlayer.level++;
    currentLevelXP -= xpToNextLevel;
    xpToNextLevel = Math.floor(40 * Math.pow(1.15, currentPlayer.level -1)); // Adjusted XP curve
    currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + 20); // Heal a bit on level up
    currentPlayer.currentRerolls = BASE_REROLLS_PER_CHOICE; // Reset rerolls

    gameRunning = false; // Pause game for augmentation choice
    // gameState will be set by switchScreen
    if ((currentPlayer.level === 10 && chosenSpecializations.length === 0) || (currentPlayer.level === 20 && chosenSpecializations.length === 1)) {
        // UI concern for title is handled by showSpecializationChoiceScreen or ui.js
        switchScreenUI(currentPlayer.level === 10 ? 'paused_class_choice' : 'paused_second_class_choice');
        showSpecializationChoiceScreen(); // This function now primarily handles displaying choices
    } else {
        switchScreenUI('paused_augment');
        showAugmentationChoiceScreen();
    }
}

// finishUpgradeSelection is called by augmentations.js via callback
function finishUpgradeSelection() {
    gameRunning = true;
    switchScreenUI('game'); // Use UI module's screen switcher
    lastLoopTime = performance.now();
    if(!animationFrameId) animationFrameId = requestAnimationFrame(gameLoop);
}

// updateRerollUI is now imported as updateRerollUISystem from ui.js

// --- Drawing Functions ---
// updateGameUI is now imported as updateGameUISystem from ui.js
// drawPlayer is now imported as drawPlayerSystem from player.js
// drawBullets is now imported as drawBulletsSystem from bullet.js
// drawEnemies is now imported as drawEnemiesSystem from enemy.js (This was already done in the previous successful patch for enemy.js)

// For drawEnemies, it was already removed and replaced by drawEnemiesSystem.
// The previous diff for enemy.js correctly handled removing drawEnemies.
// This means I only need to remove drawBullets and ensure drawEnemiesSystem is used if it wasn't already.
// Re-checking the previous successful diff for enemy.js, it *did* replace drawEnemies with drawEnemiesSystem.
// So, only drawBullets needs to be handled here. (Comment from previous step, drawBullets is now handled)
// drawXPOrbs is now imported as drawXPOrbsSystem from xp_orb.js

function clearCanvas() {
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Game Flow & Loop ---
function resetRunVariables() {
    // console.log("Resetting run variables"); // Removed
    bullets = []; enemies = []; xpOrbs = []; keys = {};
    score = 0; currentLevelXP = 0; xpToNextLevel = 40;
    chosenAugmentations = []; 
    chosenSpecializations = []; 
    initPlayerSystem(); 
    resetEnemiesState(); 
    resetBulletsState(bullets); 
    resetXPOrbsState(xpOrbs); // Reset XP orbs using imported function
    // Reset keys, score, currentLevelXP, xpToNextLevel
    Object.keys(keys).forEach(key => delete keys[key]); 
    score = 0;
    currentLevelXP = 0;
    xpToNextLevel = 40;


    const currentPlayer = getPlayer();
    if (currentPlayer && getEnemies().length === 0) { // Check enemies from enemy.js
        for(let i=0; i<3; i++) spawnEnemySystem(); // Call imported spawnEnemy
    }
    updateGameUI(); // This will be from ui.js
}

function startGame() {
    // console.log("startGame function called");
    resetRunVariables();
    gameRunning = true; // Set global gameRunning state
    // gameState = 'game'; // gameState is set by switchScreen
    // console.log(`startGame - gameRunning: ${gameRunning}, gameState: ${gameState}`);
    // console.log("Before switchScreen('game'):", "startMenu:", screens.startMenu.classList, "gameScreen:", screens.game.classList);
    switchScreen('game');
    // console.log("After switchScreen('game'):", screens.startMenu.classList, screens.game.classList); // Use imported screens

    // Use uiCanvas for checks, ctx remains local for now or could be managed by ui.js too
    if (!uiCanvas) console.error("Canvas element not found (via ui.js)!");
    if (!ctx) console.error("Canvas 2D context not obtained!"); // ctx is still local

    if (!uiCanvas || !ctx) {
        gameRunning = false; 
        return;
    }
    lastLoopTime = performance.now();
    if (animationFrameId) {
        // console.log("Cancelling existing animationFrameId:", animationFrameId);
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // console.log("Requesting new animation frame for gameLoop.");
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    const currentPlayer = getPlayer();
    updateFinalScoreUI(score, currentPlayer ? currentPlayer.level : 1); // Use UI function
    switchScreenUI('gameOver'); // Use UI function
}

export let lastLoopTime = 0; 
function gameLoop(currentTime) {
    // console.log(`gameLoop entered. gameRunning: ${gameRunning}, gameState: ${gameState}, animationFrameId: ${animationFrameId}`); // Removed
    // Allow drawing during augmentation/class choice pauses, but not manual pause
    // Also allow drawing for the main pause menu
    if (!gameRunning && 
        gameState !== 'paused_augment' && 
        gameState !== 'paused_class_choice' && 
        gameState !== 'paused_second_class_choice' &&
        gameState !== 'pauseMenu') { // Allow drawing for pauseMenu
        // console.log("gameLoop: gameRunning is false and not in an active drawing pause state. Cancelling animation frame and returning."); // Can be removed
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null; 
        return;
    }
    animationFrameId = requestAnimationFrame(gameLoop); // Request next frame immediately

    if (!currentTime) currentTime = performance.now();
    const deltaTime = currentTime - lastLoopTime;
    const cappedDeltaTime = Math.max(0, Math.min(deltaTime, 100));
    lastLoopTime = currentTime;

    if (gameRunning && gameState === 'game') {
        updatePlayerSystem(cappedDeltaTime); 
        updateBulletsSystem(bullets, cappedDeltaTime, uiCanvas); // Pass uiCanvas
        updateEnemiesSystem(cappedDeltaTime); 
        updateXPOrbsSystem(xpOrbs, cappedDeltaTime, getPlayer(), gainXP, uiCanvas); // Pass uiCanvas
        checkCollisions();
    }

    // Always draw the current state
    clearCanvas(); // Uses local ctx
    const currentPlayer = getPlayer();
    if (currentPlayer) drawPlayerSystem(ctx);  // Pass ctx
    drawEnemiesSystem(ctx); // Pass ctx
    drawBulletsSystem(bullets, ctx); // Pass ctx (already was)
    drawXPOrbsSystem(xpOrbs, ctx); // Pass ctx (already was)
    if (currentPlayer) updateGameUISystem(score, currentLevelXP, xpToNextLevel); 
}

// --- Event Listeners ---
// These will likely stay in main.js or be moved to an input.js module
document.addEventListener('keydown', (e) => {
    // console.log("Keydown:", e.key, "Current gameState:", gameState);
    // Prevent default for space/arrows only when game is active or paused (to allow text input if future menus need it)
    if ((gameState === 'game' || gameState === 'pauseMenu' || gameState.startsWith('paused_')) && (e.key === ' ' || e.key.startsWith('Arrow'))) {
        e.preventDefault();
    }

    // Handle Escape key for pausing - ONLY if in 'game' state
    if (e.key.toLowerCase() === 'escape') {
        if (gameState === 'game') {
            gameRunning = false; 
            switchScreenUI('pauseMenu'); 
        } else if (gameState === 'pauseMenu') {
            gameRunning = true;
            switchScreenUI('game');
            lastLoopTime = performance.now(); 
        }
        // Do not allow pausing from augmentation screens
    }

    // Allow shooting only if game is active and running
    if (gameState === 'game' && gameRunning) {
        keys[e.key.toLowerCase()] = true;
    } else {
        // For other states, ensure keys related to shooting are not set,
        // or handle them based on context if needed.
        // For now, just not setting them if not in active game state.
        if (e.key.toLowerCase() === ' ') keys[' '] = true; // Still allow space for UI if needed. Player shooting logic checks gameRunning.
    }
});
document.addEventListener('keyup', (e) => {
    // Always register keyup to prevent stuck keys if game state changes
    keys[e.key.toLowerCase()] = false;
});

if (uiCanvas) { 
    uiCanvas.addEventListener('mousemove', (e) => {
        const rect = uiCanvas.getBoundingClientRect(); 
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    uiCanvas.addEventListener('mousedown', (e) => {
        // Allow mouse down for shooting only if game is active and running
        if (e.button === 0 && gameState === 'game' && gameRunning) {
            mouse.down = true;
        }
        // Allow mouse down for UI interactions in other states
        else if (e.button === 0 && (gameState !== 'game' || !gameRunning)) {
             mouse.down = true; // UI elements will check this flag if they need it
        }
    });
    uiCanvas.addEventListener('mouseup', (e) => { 
        if (e.button === 0) mouse.down = false; // Always register mouseup
    });
    uiCanvas.addEventListener('contextmenu', (e) => e.preventDefault()); 
}


if (startGameButton) startGameButton.addEventListener('click', startGame);
if (restartGameButton) restartGameButton.addEventListener('click', startGame);

if (resumeGameButton) {
    resumeGameButton.addEventListener('click', () => {
        if (gameState === 'pauseMenu') {
            gameRunning = true;
            switchScreenUI('game');
            lastLoopTime = performance.now(); // Reset lastLoopTime
        }
    });
}

if (pauseToMenuButton) {
    pauseToMenuButton.addEventListener('click', () => {
        if (gameState === 'pauseMenu') {
            gameRunning = false; // Ensure game is not running
            resetRunVariables(); // Reset game progress
            switchScreenUI('startMenu');
        }
    });
}


if (rerollButtonElement) { // rerollButtonElement is imported from ui.js
    rerollButtonElement.addEventListener('click', () => {
        const currentPlayer = getPlayer();
        if (currentPlayer && currentPlayer.currentRerolls > 0) {
            currentPlayer.currentRerolls--;
        // gameState is already set to the correct paused state
            if (gameState === 'paused_class_choice' || gameState === 'paused_second_class_choice') {
            showSpecializationChoiceScreen(); // From augmentations.js
            } else if (gameState === 'paused_augment') {
            showAugmentationChoiceScreen(); // From augmentations.js
            }
        updateRerollUISystem(); // This is from ui.js
        }
    });
}

// --- Initial Load ---
// loadGameData(); // No complex save/load in this basic version for now

// Initialize systems that require references from this file (main.js)
// Ensure ctx is available before calling functions that might use it indirectly through other modules if not passed
if(ctx) {
    initializePlayerSystem(bullets, (x,y,val) => spawnXPOrbSystem(xpOrbs,x,y,val), getEnemies(), ctx, keys, mouse, gameRunning); // Pass ctx and other needed states
    initializeEnemySystem((x,y,val) => spawnXPOrbSystem(xpOrbs,x,y,val), (points) => { score += points; }, ctx); // Pass ctx
    // Bullet system does not need initialization in this manner, functions are pure or take bullets array.
    // XP Orb system also does not need specific initialization beyond its functions taking arrays.

    // Initialize UI elements needed by augmentations.js, pass the UI updater from ui.js
    initializeAugmentationUI({
        augmentationChoicesContainer: augmentationChoicesContainer, 
        augmentationPanelTitle: augmentationPanelTitle,       
        augmentationChoicePanel: augmentationChoicePanel         
    }, updateRerollUISystem); 

    // Set the callback for when an augmentation is selected (function defined in this file)
    setFinishUpgradeSelectionCallback(finishUpgradeSelection);

    // Initialize UI (e.g. initial screen)
    initializeUI(); 
    switchScreenUI('startMenu'); 
} else {
    console.error("CRITICAL: Canvas context (ctx) not initialized. Game cannot start.");
}
