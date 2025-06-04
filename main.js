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
let gameRunning = false;

const scoreboardKey = 'nova_scoreboard';
const scoreboardList = document.getElementById('scoreboardList');
let scoreboardData = JSON.parse(localStorage.getItem(scoreboardKey) || '[]');
updateScoreboardUI();

function gameLoop() {
  if (!gameRunning) return;
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

  checkPlayerCollisions();

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
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
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  scoreboardData.push({ score, level: player.level });
  scoreboardData.sort((a, b) => b.score - a.score);
  scoreboardData = scoreboardData.slice(0, 5);
  localStorage.setItem(scoreboardKey, JSON.stringify(scoreboardData));
  const fs = document.getElementById('finalScoreDisplay');
  const fl = document.getElementById('finalLevelDisplay');
  if (fs) fs.textContent = score;
  if (fl) fl.textContent = player.level;
  updateScoreboardUI();
  showScreen('gameOverScreen');
}

function updateScoreboardUI() {
  if (!scoreboardList) return;
  scoreboardList.innerHTML = '';
  scoreboardData.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `Score: ${r.score} | Lv ${r.level}`;
    scoreboardList.appendChild(li);
  });
}

function checkPlayerCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist < player.radius + e.size / 2) {
      player.hp -= 10;
      enemies.splice(i, 1);
      if (player.hp <= 0) {
        gameOver();
        return;
      }
    }
  }
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
    updateScoreboardUI();
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

