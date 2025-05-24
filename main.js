// main.js

// --- DOM ELEMENT REFERENZEN (zentral für einfachen Zugriff) ---
// Einige davon werden auch in ui_manager.js direkt per getElementById geholt,
// was in Ordnung ist, solange die IDs konsistent sind.
const screens = {
    startMenu: document.getElementById('startMenuScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    pauseMenu: document.getElementById('pauseMenuScreen'),
    metaShop: document.getElementById('metaShopScreen')
};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const gameUi = document.getElementById('gameUi'); // Wird von updateGameUI genutzt
// Spezifische UI-Elemente innerhalb von gameUi werden in updateGameUI geholt

// Buttons, die hier Listener bekommen
const startGameButton = document.getElementById('startGameButton');
const restartGameButton = document.getElementById('restartGameButton');
const rerollButtonElement = document.getElementById('rerollButtonElement');

const resumeGameButton = document.getElementById('resumeGameButton');
const restartRunFromPauseButton = document.getElementById('restartRunFromPauseButton');
const pauseToMenuButton = document.getElementById('pauseToMenuButton');

const metaShopButton = document.getElementById('metaShopButton');
const metaShopButtonGameOver = document.getElementById('metaShopButtonGameOver');
const backToMenuFromShopButton = document.getElementById('backToMenuFromShopButton');
const mainMenuButtonGameOver = document.getElementById('mainMenuButtonGameOver');

const difficultyEasyButton = document.getElementById('difficultyEasy');
const difficultyNormalButton = document.getElementById('difficultyNormal');
const difficultyHardButton = document.getElementById('difficultyHard');


// --- GLOBALE SPIELZUSTANDS-VARIABLEN (Deklaration) ---
// metaProgress und gameSettings sind bereits in config.js als 'let' bzw. 'const' deklariert.
// CLASS_SPECIALIZATIONS und ALL_AUGMENTATIONS sind als 'const' in ihren data_...js Dateien.

let player;
let bullets = [];
let enemies = [];
let xpOrbs = [];
let activeEffects = [];

let score = 0;
let currentLevelXP = 0;
let xpToNextLevel = XP_TO_NEXT_LEVEL_BASE; // Initialwert aus config.js

let chosenSpecializations = [];

let gameState = 'startMenu'; // Initialer Zustand
let gameRunning = false;
let animationFrameId;
let lastLoopTime = 0;

let keys = {};
let mouse = { x: 0, y: 0, down: false };


// --- CANVAS INITIALISIERUNG PRÜFEN ---
if (!canvas || !ctx) {
    console.error("!CRITICAL! Canvas element or context not found on page load! Game cannot initialize properly.");
    // Zeige eine sichtbare Fehlermeldung für den Benutzer, falls Canvas kritisch ist
    if(document.body) document.body.innerHTML = "<h1 style='color:red; text-align:center;'>Error: Game canvas not found. Please refresh or check HTML. Ensure the canvas ID is 'gameCanvas'.</h1>";
} else {
    canvas.width = 800; // Stelle sicher, dass die Größe gesetzt wird
    canvas.height = 600;
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'escape') {
        e.preventDefault();
        if ((gameState === 'game' || gameState === 'paused_menu') && typeof togglePauseGame === 'function') {
            togglePauseGame();
        }
    }
    // Verhindere Standardverhalten für Spieltasten
    if ((gameState === 'game' || gameState === 'paused_menu' || gameState.startsWith('paused_')) &&
        (key === ' ' || key.startsWith('arrow') || key === 'shift' || ['w', 'a', 's', 'd', 'r'].includes(key))
       ) {
        e.preventDefault();
    }
    keys[key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

if (canvas) { // Event Listener nur anfügen, wenn Canvas existiert
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) mouse.down = true; });
    canvas.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.down = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Button Event Listeners
if (startGameButton) startGameButton.addEventListener('click', () => {
    if (typeof startGame === 'function') startGame(); else console.error("startGame function not defined");
});
if (restartGameButton) restartGameButton.addEventListener('click', () => {
    if (typeof startGame === 'function') startGame(); else console.error("startGame function not defined");
});

if (resumeGameButton) resumeGameButton.addEventListener('click', () => {
    if (typeof togglePauseGame === 'function') togglePauseGame(); else console.error("togglePauseGame function not defined");
});
if (restartRunFromPauseButton) restartRunFromPauseButton.addEventListener('click', () => {
    if (gameState === 'paused_menu' && typeof togglePauseGame === 'function') togglePauseGame();
    if (typeof startGame === 'function') startGame(); else console.error("startGame function not defined");
});
if (pauseToMenuButton) pauseToMenuButton.addEventListener('click', () => {
    if (gameState === 'paused_menu' && typeof togglePauseGame === 'function') togglePauseGame();
    if (typeof switchScreen === 'function') switchScreen('startMenu'); else console.error("switchScreen function not defined");
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
});

if (metaShopButton) metaShopButton.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('metaShop'); else console.error("switchScreen function not defined");
});
if (metaShopButtonGameOver) metaShopButtonGameOver.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('metaShop'); else console.error("switchScreen function not defined");
});
if (backToMenuFromShopButton) backToMenuFromShopButton.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('startMenu'); else console.error("switchScreen function not defined");
});
if(mainMenuButtonGameOver) mainMenuButtonGameOver.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('startMenu'); else console.error("switchScreen function not defined");
});

if (rerollButtonElement) {
    rerollButtonElement.addEventListener('click', () => {
        if (player && player.currentRerolls > 0) {
            player.currentRerolls--;
            if (gameState === 'paused_class_choice' || gameState === 'paused_second_class_choice') {
                if(typeof showSpecializationChoiceScreen === 'function') showSpecializationChoiceScreen();
            } else if (gameState === 'paused_augment') {
                if(typeof showAugmentationChoiceScreen === 'function') showAugmentationChoiceScreen();
            }
            if(typeof updateRerollUI === 'function') updateRerollUI();
        }
    });
}

// Schwierigkeitsgrad-Buttons
if(difficultyEasyButton) difficultyEasyButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Easy'; console.log("Difficulty set to Easy"); updateDifficultyButtonStyles(); });
if(difficultyNormalButton) difficultyNormalButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Normal'; console.log("Difficulty set to Normal"); updateDifficultyButtonStyles(); });
if(difficultyHardButton) difficultyHardButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Hard'; console.log("Difficulty set to Hard"); updateDifficultyButtonStyles(); });

function updateDifficultyButtonStyles() {
    [difficultyEasyButton, difficultyNormalButton, difficultyHardButton].forEach(btn => {
        if (btn) btn.classList.remove('button-like-active'); // Annahme: .button-like-active CSS-Klasse für aktiven Button
    });
    if (gameSettings.selectedDifficulty === 'Easy' && difficultyEasyButton) difficultyEasyButton.classList.add('button-like-active');
    else if (gameSettings.selectedDifficulty === 'Normal' && difficultyNormalButton) difficultyNormalButton.classList.add('button-like-active');
    else if (gameSettings.selectedDifficulty === 'Hard' && difficultyHardButton) difficultyHardButton.classList.add('button-like-active');
}


// --- INITIAL GAME SETUP ---
// Stelle sicher, dass alle Skripte geladen wurden, bevor diese Funktionen aufgerufen werden.
// loadMetaProgress sollte idealerweise als erstes aufgerufen werden.
if (typeof loadMetaProgress === 'function') {
    loadMetaProgress();
} else {
    console.error("loadMetaProgress function is not defined! Meta progress will not be loaded.");
}

if (typeof switchScreen === 'function') {
    switchScreen('startMenu'); // Zeige initial das Startmenü
    updateDifficultyButtonStyles(); // Setze initialen aktiven Button für Schwierigkeit
} else {
    console.error("switchScreen function is not defined! Cannot set initial screen.");
    const startScreen = document.getElementById('startMenuScreen');
    if (startScreen) startScreen.style.display = 'flex'; // Manueller Fallback
}
