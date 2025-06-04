export class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.radius = 10;
    this.color = '#00FFFF';
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200; // pixels per second
    this.angle = -Math.PI / 2;
    this.lastShot = 0;
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

    if ((keys[' '] || mouse.down) && Date.now() - this.lastShot > 300) {
      bullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        speed: 400,
        owner: 'player'
      });
      this.lastShot = Date.now();
    }

    this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
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
}
