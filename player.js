export class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.radius = 10;
    this.color = '#00FFFF';
    this.hp = 100;
    this.maxHp = 100;
    this.xp = 0;
    this.xpToNext = 50;
    this.level = 1;
    this.speed = 200; // pixels per second
    this.damage = 10;
    this.fireRate = 300; // ms between shots
    this.angle = -Math.PI / 2;
    this.lastShot = 0;
    this.needsUpgrade = false;
    this.weapon = 'normal';
    this.upgrades = [];
    this.synergies = [];
  }

  update(dt, keys, mouse, bullets) {
    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * this.speed * (dt / 1000);
      this.y += (dy / len) * this.speed * (dt / 1000);
    }

    this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

    if ((keys[' '] || mouse.down) && Date.now() - this.lastShot > this.fireRate) {
      this.shoot(bullets);
      this.lastShot = Date.now();
    }

    this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
  }

  shoot(bullets) {
    if (this.weapon === 'spread') {
      const spreadAngles = [this.angle - 0.2, this.angle, this.angle + 0.2];
      spreadAngles.forEach(a => bullets.push({
        x: this.x,
        y: this.y,
        angle: a,
        speed: 400,
        owner: 'player',
        damage: this.damage,
        type: 'normal'
      }));
    } else if (this.weapon === 'rocket') {
      bullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        speed: 350,
        owner: 'player',
        damage: this.damage,
        type: 'rocket',
        explosionRadius: 40
      });
    } else if (this.weapon === 'rocket-spread') {
      const spreadAngles = [this.angle - 0.2, this.angle, this.angle + 0.2];
      spreadAngles.forEach(a => bullets.push({
        x: this.x,
        y: this.y,
        angle: a,
        speed: 350,
        owner: 'player',
        damage: this.damage,
        type: 'rocket',
        explosionRadius: 40
      }));
    } else {
      bullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        speed: 400,
        owner: 'player',
        damage: this.damage,
        type: 'normal'
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.7, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.7, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  gainXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.floor(this.xpToNext * 1.2);
      this.needsUpgrade = true;
    }
  }
}
