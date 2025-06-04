export const xpOrbs = [];

export function spawnXPOrb(x, y, amount) {
  xpOrbs.push({ x, y, amount, radius: 5, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 });
}

export function updateXPOrbs(dt, player) {
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const o = xpOrbs[i];
    o.x += o.vx * (dt / 1000);
    o.y += o.vy * (dt / 1000);
    o.vx *= 0.98;
    o.vy *= 0.98;
    const dx = player.x - o.x;
    const dy = player.y - o.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + o.radius) {
      player.gainXp(o.amount);
      xpOrbs.splice(i, 1);
      continue;
    }
    if (dist > 0) {
      o.x += (dx / dist) * 30 * (dt / 1000);
      o.y += (dy / dist) * 30 * (dt / 1000);
    }
  }
}

export function drawXPOrbs(ctx) {
  ctx.fillStyle = '#40E0D0';
  xpOrbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
