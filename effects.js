export const bullets = [];
export const explosions = [];

export function updateBullets(dt, canvas) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += Math.cos(b.angle) * b.speed * (dt / 1000);
    b.y += Math.sin(b.angle) * b.speed * (dt / 1000);
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  }
}

export function drawBullets(ctx) {
  ctx.fillStyle = '#ffff00';
  bullets.forEach(b => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle + Math.PI / 2);
    ctx.fillRect(-2, -8, 4, 16);
    ctx.restore();
  });
}

export function checkBulletCollisions(enemies, onHit) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < e.size / 2) {
        onHit(e, j);
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

export function createExplosion(x, y) {
  // explosions start small and expand until reaching maxR, then are removed
  explosions.push({ x, y, r: 0, maxR: 30 });
}

export function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.r += 100 * (dt / 1000);
    if (ex.r > ex.maxR) {
      explosions.splice(i, 1);
    }
  }
}

export function drawExplosions(ctx) {
  ctx.fillStyle = 'orange';
  explosions.forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
