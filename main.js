import { Player } from './player.js';
import { enemies, spawnEnemy, updateEnemies, drawEnemies } from './enemies.js';
import { bullets, explosions, updateBullets, drawBullets, checkBulletCollisions, updateExplosions, drawExplosions, createExplosion } from './effects.js';
import { xpOrbs, spawnXPOrb, updateXPOrbs, drawXPOrbs } from './xp.js';
import { showUpgradeMenu } from './upgrades.js';
import { updateUI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

let player;
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let score = 0;
let lastSpawn = 0;
let lastTime = performance.now();

function gameLoop() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  if (now - lastSpawn > 2000) {
    spawnEnemy(canvas, Math.floor(score / 100) + 1);
    lastSpawn = now;
  }

  player.update(dt, keys, mouse, bullets);
  updateBullets(dt, canvas);
  updateEnemies(dt, player, canvas);
  checkBulletCollisions(enemies, (enemy, idx) => {
    enemies.splice(idx, 1);
    score += 10;
    createExplosion(enemy.x, enemy.y);
    spawnXPOrb(enemy.x, enemy.y, 10);
  });
  updateXPOrbs(dt, player);
  updateExplosions(dt);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);
  drawXPOrbs(ctx);
  drawExplosions(ctx);
  updateUI(player, score);

  if (player.needsUpgrade) {
    player.needsUpgrade = false;
    showUpgradeMenu(player);
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  player = new Player(canvas);
  score = 0;
  enemies.length = 0;
  bullets.length = 0;
  explosions.length = 0;
  xpOrbs.length = 0;
  lastSpawn = 0;
  lastTime = performance.now();
  showScreen('gameScreen');
  const panel = document.getElementById('augmentationChoicePanel');
  if (panel) panel.classList.add('hidden');
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });

document.getElementById('startGameButton').addEventListener('click', startGame);

// menu navigation handlers
const openMetaShopButton = document.getElementById('openMetaShopButton');
if (openMetaShopButton) {
  openMetaShopButton.addEventListener('click', () => {
    showScreen('metaShopScreen');
  });
}

const openScoreboardButton = document.getElementById('openScoreboardButton');
if (openScoreboardButton) {
  openScoreboardButton.addEventListener('click', () => {
    showScreen('scoreboardScreen');
  });
}

const backToMenuButton = document.getElementById('backToMenuButton');
if (backToMenuButton) {
  backToMenuButton.addEventListener('click', () => {
    showScreen('startMenuScreen');
  });
}

const backFromShopButton = document.getElementById('backFromShopButton');
if (backFromShopButton) {
  backFromShopButton.addEventListener('click', () => {
    showScreen('startMenuScreen');
  });
}

const restartGameButton = document.getElementById('restartGameButton');
if (restartGameButton) {
  restartGameButton.addEventListener('click', startGame);
}

const gameOverMenuButton = document.getElementById('gameOverMenuButton');
if (gameOverMenuButton) {
  gameOverMenuButton.addEventListener('click', () => {
    showScreen('startMenuScreen');
  });
}

