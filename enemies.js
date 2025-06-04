export const enemies = [];

export function spawnEnemy(canvas, level = 1) {
  const size = 20;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * canvas.width; y = -size; }
  else if (side === 1) { x = canvas.width + size; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + size; }
  else { x = -size; y = Math.random() * canvas.height; }
  const hp = 10 + level * 5;
  enemies.push({ x, y, size, speed: 50 + level * 10, hp, maxHp: hp });
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
  enemies.forEach(e => {
    // enemy body
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // hp bar
    const barWidth = e.size;
    const barHeight = 4;
    const barX = e.x - barWidth / 2;
    const barY = e.y - e.size / 2 - 8;
    ctx.fillStyle = '#5a0000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(barX, barY, (e.hp / e.maxHp) * barWidth, barHeight);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  });
}
