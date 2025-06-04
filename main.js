import { Player } from './player.js';
import { enemies, spawnEnemy, updateEnemies, drawEnemies } from './enemies.js';
import {
  bullets,
  explosions,
  updateBullets,
  drawBullets,
  checkBulletCollisions,
  updateExplosions,
  drawExplosions,
  createExplosion,
} from './effects.js';
import { updateUI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const screens = {
  startMenu: document.getElementById('startMenuScreen'),
  game: document.getElementById('gameScreen'),
  gameOver: document.getElementById('gameOverScreen'),
  scoreboard: document.getElementById('scoreboardScreen'),
  metaShop: document.getElementById('metaShopScreen'),
};

const pauseOverlay = document.getElementById('pauseOverlay');

function switchScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  const target = screens[name];
  if (target) target.classList.add('active');
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
  checkBulletCollisions(enemies, idx => {
    enemies.splice(idx, 1);
    score += 10;
    createExplosion(player.x, player.y);
  });
  updateExplosions(dt);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);
  drawExplosions(ctx);
  updateUI(player, score);

  requestAnimationFrame(gameLoop);
}

function startGame() {
  player = new Player(canvas);
  score = 0;
  enemies.length = 0;
  bullets.length = 0;
  explosions.length = 0;
  lastSpawn = 0;
  lastTime = performance.now();
  if (pauseOverlay) pauseOverlay.classList.add('hidden');
  switchScreen('game');
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape' && pauseOverlay) {
    if (pauseOverlay.classList.contains('hidden')) {
      pauseOverlay.classList.remove('hidden');
    } else {
      pauseOverlay.classList.add('hidden');
    }
  }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => {
  mouse.down = true;
});
canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

document.getElementById('startGameButton').addEventListener('click', startGame);
document.getElementById('restartGameButton').addEventListener('click', startGame);
document.getElementById('openMetaShopButton').addEventListener('click', () => switchScreen('metaShop'));
document.getElementById('openScoreboardButton').addEventListener('click', () => switchScreen('scoreboard'));
document.getElementById('backToMenuButton').addEventListener('click', () => switchScreen('startMenu'));
document.getElementById('backFromShopButton').addEventListener('click', () => switchScreen('startMenu'));
document.getElementById('gameOverMenuButton').addEventListener('click', () => switchScreen('startMenu'));
document.getElementById('resumeButton').addEventListener('click', () => {
  if (pauseOverlay) pauseOverlay.classList.add('hidden');
  switchScreen('game');
});
document.getElementById('quitButton').addEventListener('click', () => switchScreen('gameOver'));
document.getElementById('pauseMainMenuButton').addEventListener('click', () => switchScreen('startMenu'));
