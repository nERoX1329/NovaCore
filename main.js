// main.js / Finaler Initialisierungsblock

// --- GLOBALE SPIELZUSTANDS-VARIABLEN (Deklaration) ---
// Diese Variablen werden von vielen Funktionen in den anderen .js-Dateien erwartet.
// metaProgress und gameSettings sind bereits in config.js als 'let' bzw. 'const' deklariert.
// CLASS_SPECIALIZATIONS und ALL_AUGMENTATIONS sind als 'const' in ihren data_...js Dateien.

let player;
let bullets = [];
let enemies = [];
let xpOrbs = [];
let activeEffects = []; // Für Explosionen etc.

let score = 0;
let currentLevelXP = 0;
let xpToNextLevel = XP_TO_NEXT_LEVEL_BASE; // Initialwert aus config.js

let chosenSpecializations = []; // Wird von CLASS_SPECIALIZATIONS.apply gefüllt und in resetRunVariables geleert

let gameState = 'startMenu'; // Initialer Zustand
let gameRunning = false;
let animationFrameId;
let lastLoopTime = 0;

let keys = {};
let mouse = { x: 0, y: 0, down: false };

// --- DOM ELEMENT REFERENZEN (zentralisiert) ---
// Diese werden von ui_manager.js und anderen Teilen verwendet.
const screens = {
    startMenu: document.getElementById('startMenuScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    pauseMenu: document.getElementById('pauseMenuScreen'), // Hinzugefügt
    metaShop: document.getElementById('metaShopScreen')    // Hinzugefügt
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
// Schild- und Munitions-UI-Elemente werden dynamisch in updateGameUI (ui_manager.js) erstellt

const augmentationChoicePanel = document.getElementById('augmentationChoicePanel');
const augmentationPanelTitle = document.getElementById('augmentationPanelTitle');
const augmentationChoicesContainer = document.getElementById('augmentationChoices');
const rerollButtonElement = document.getElementById('rerollButtonElement');
const rerollsAvailableDisplay = document.getElementById('rerollsAvailableDisplay');

// Pausemenü Elemente
const pauseStatsDisplay = document.getElementById('pauseStatsDisplay');
const resumeGameButton = document.getElementById('resumeGameButton');
const restartRunFromPauseButton = document.getElementById('restartRunFromPauseButton');
const pauseToMenuButton = document.getElementById('pauseToMenuButton');

// Meta Shop Elemente
const metaShopButton = document.getElementById('metaShopButton'); // Im Startmenü
const metaShopButtonGameOver = document.getElementById('metaShopButtonGameOver'); // Im Game Over Screen
const backToMenuFromShopButton = document.getElementById('backToMenuFromShopButton');
const metaUpgradesContainer = document.getElementById('metaUpgradesContainer');
const shopMetaCurrencyDisplay = document.getElementById('shopMetaCurrency');

// Game Over Screen Elemente
const finalScoreDisplay = document.getElementById('finalScoreDisplay');
const finalLevelDisplay = document.getElementById('finalLevelDisplay');
const runCurrencyDisplay = document.getElementById('runCurrencyDisplay');
const gameOverMetaCurrencyDisplay = document.getElementById('gameOverMetaCurrency');
const mainMenuButtonGameOver = document.getElementById('mainMenuButtonGameOver');


// Start & Restart Buttons
const startGameButton = document.getElementById('startGameButton');
const restartGameButton = document.getElementById('restartGameButton');

// Schwierigkeitsgrad-Buttons
const difficultyEasyButton = document.getElementById('difficultyEasy');
const difficultyNormalButton = document.getElementById('difficultyNormal');
const difficultyHardButton = document.getElementById('difficultyHard');


// --- CANVAS INITIALISIERUNG ---
if (canvas) {
    canvas.width = 800;
    canvas.height = 600;
} else {
    console.error("!CRITICAL! Canvas element not found on page load! Game cannot initialize properly.");
    document.body.innerHTML = "<h1 style='color:red; text-align:center;'>Error: Game canvas not found. Please refresh or check HTML. Ensure the canvas ID is 'gameCanvas'.</h1>";
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'escape') {
        e.preventDefault();
        if (gameState === 'game' || gameState === 'paused_menu') {
            if (typeof togglePauseGame === 'function') togglePauseGame();
        }
    }
    // Verhindere Standardverhalten für Spieltasten
    if ((gameState === 'game' || gameState.startsWith('paused_') || gameState === 'paused_menu') &&
        (key === ' ' || key.startsWith('arrow') || key === 'shift' || ['w', 'a', 's', 'd', 'r'].includes(key))
       ) {
        e.preventDefault();
    }
    keys[key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

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

// Button Event Listeners
if (startGameButton) startGameButton.addEventListener('click', () => {
    if (typeof startGame === 'function') startGame();
});
if (restartGameButton) restartGameButton.addEventListener('click', () => {
    if (typeof startGame === 'function') startGame();
});

if (resumeGameButton) resumeGameButton.addEventListener('click', () => {
    if (typeof togglePauseGame === 'function') togglePauseGame();
});
if (restartRunFromPauseButton) restartRunFromPauseButton.addEventListener('click', () => {
    if (gameState === 'paused_menu' && typeof togglePauseGame === 'function') togglePauseGame(); // Erst Pause-Screen schließen
    if (typeof startGame === 'function') startGame();
});
if (pauseToMenuButton) pauseToMenuButton.addEventListener('click', () => {
    if (gameState === 'paused_menu' && typeof togglePauseGame === 'function') togglePauseGame();
    if (typeof switchScreen === 'function') switchScreen('startMenu');
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
});

if (metaShopButton) metaShopButton.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('metaShop');
});
if (metaShopButtonGameOver) metaShopButtonGameOver.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('metaShop');
});
if (backToMenuFromShopButton) backToMenuFromShopButton.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('startMenu');
});
if(mainMenuButtonGameOver) mainMenuButtonGameOver.addEventListener('click', () => {
    if (typeof switchScreen === 'function') switchScreen('startMenu');
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
if(difficultyEasyButton) difficultyEasyButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Easy'; console.log("Difficulty set to Easy"); });
if(difficultyNormalButton) difficultyNormalButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Normal'; console.log("Difficulty set to Normal"); });
if(difficultyHardButton) difficultyHardButton.addEventListener('click', () => { gameSettings.selectedDifficulty = 'Hard'; console.log("Difficulty set to Hard"); });


// --- INITIAL GAME SETUP ---
if (typeof loadMetaProgress === 'function') {
    loadMetaProgress(); // Lade Meta-Fortschritt, bevor irgendetwas anderes passiert
} else {
    console.error("loadMetaProgress function is not defined! Meta progress will not be loaded.");
}

if (typeof switchScreen === 'function') {
    switchScreen('startMenu'); // Zeige initial das Startmenü
} else {
    console.error("switchScreen function is not defined! Cannot set initial screen.");
    // Manueller Fallback, um zumindest den StartScreen anzuzeigen, falls DOM-Elemente direkt verfügbar sind
    if (document.getElementById('startMenuScreen')) document.getElementById('startMenuScreen').style.display = 'flex';
}