export const drones = [];
export const turrets = [];

export function spawnDrone(player) {
  drones.push({
    angle: 0,
    distance: 40,
    fireRate: 1000,
    lastShot: 0,
    damage: player.damage * 0.5,
    owner: player
  });
}

export function updateDrones(dt, player, enemies, bullets) {
  const now = Date.now();
  drones.forEach(d => {
    d.angle += (dt / 1000);
    d.x = player.x + Math.cos(d.angle) * d.distance;
    d.y = player.y + Math.sin(d.angle) * d.distance;
    if (now - d.lastShot > d.fireRate && enemies.length > 0) {
      const target = enemies.reduce((a, b) => {
        const da = Math.hypot(a.x - d.x, a.y - d.y);
        const db = Math.hypot(b.x - d.x, b.y - d.y);
        return da < db ? a : b;
      });
      const ang = Math.atan2(target.y - d.y, target.x - d.x);
      bullets.push({
        x: d.x,
        y: d.y,
        angle: ang,
        speed: 300,
        owner: 'drone',
        damage: d.damage,
        type: 'normal'
      });
      d.lastShot = now;
    }
  });
}

export function drawDrones(ctx) {
  ctx.fillStyle = '#88ffff';
  drones.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function placeTurret(x, y, player) {
  turrets.push({
    x,
    y,
    fireRate: 500,
    lastShot: 0,
    damage: player.damage * 0.8,
    duration: 10000
  });
}

export function updateTurrets(dt, enemies, bullets) {
  const now = Date.now();
  for (let i = turrets.length - 1; i >= 0; i--) {
    const t = turrets[i];
    t.duration -= dt;
    if (t.duration <= 0) {
      turrets.splice(i, 1);
      continue;
    }
    if (now - t.lastShot > t.fireRate && enemies.length > 0) {
      const target = enemies.reduce((a, b) => {
        const da = Math.hypot(a.x - t.x, a.y - t.y);
        const db = Math.hypot(b.x - t.x, b.y - t.y);
        return da < db ? a : b;
      });
      const ang = Math.atan2(target.y - t.y, target.x - t.x);
      bullets.push({
        x: t.x,
        y: t.y,
        angle: ang,
        speed: 300,
        owner: 'turret',
        damage: t.damage,
        type: 'normal'
      });
      t.lastShot = now;
    }
  }
}

export function drawTurrets(ctx) {
  ctx.fillStyle = '#ffaa00';
  turrets.forEach(t => {
    ctx.beginPath();
    ctx.fillRect(t.x - 5, t.y - 5, 10, 10);
  });
}
