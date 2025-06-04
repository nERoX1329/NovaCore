export const enemies = [];

export function spawnEnemy(canvas, level = 1) {
  const size = 20;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * canvas.width; y = -size; }
  else if (side === 1) { x = canvas.width + size; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + size; }
  else { x = -size; y = Math.random() * canvas.height; }
  enemies.push({ x, y, size, speed: 50 + level * 10, hp: 10 + level * 5 });
}

export function updateEnemies(dt, player, canvas) {
  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed * (dt / 1000);
    e.y += (dy / dist) * e.speed * (dt / 1000);
  });
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.x < -40 || e.x > canvas.width + 40 || e.y < -40 || e.y > canvas.height + 40) {
      enemies.splice(i, 1);
    }
  }
}

export function drawEnemies(ctx) {
  ctx.fillStyle = '#ff4757';
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}
