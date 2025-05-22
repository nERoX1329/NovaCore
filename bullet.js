// Bullet related logic
// import { canvas, ctx } from './game.js'; // Temporary, will be main.js or passed as args

// Note: The 'bullets' array itself will be managed in main.js (game.js)
// and passed to these functions, or these functions will be imported into main.js
// and operate on the 'bullets' array there.
// For this step, let's assume 'bullets' array is passed as an argument.

export function updateBullets(bullets, dT, canvas) {
    if (!canvas) return; // Ensure canvas is available for boundary checks

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const moveSpeed = b.speed * (dT / (1000 / 60)); // Delta time adjustment
        b.x += Math.cos(b.angle) * moveSpeed;
        b.y += Math.sin(b.angle) * moveSpeed;

        // Remove bullets that go off-screen
        // Add a small buffer to ensure they are well off-screen
        const buffer = Math.max(b.width, b.height) + 10; 
        if (b.y < -buffer || b.y > canvas.height + buffer ||
            b.x < -buffer || b.x > canvas.width + buffer) {
            bullets.splice(i, 1);
        }
        // TODO: Add bullet lifetime expiry if needed (e.g., b.spawnTime and Date.now())
    }
}

export function drawBullets(bullets, ctx) {
    if (!ctx || !bullets) return;

    bullets.forEach(b => {
        ctx.save();
        // Translate to the bullet's center for rotation, assuming x,y is top-left
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.angle + Math.PI / 2); // Assuming bullets are drawn pointing "up" before rotation
        
        ctx.fillStyle = b.color;
        // Draw the bullet centered around the new (0,0) after translation
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        
        ctx.restore();
    });
}

// If we wanted a createBullet function here:
// export function createBullet(x, y, angle, speed, damage, color, width, height, owner, piercing = 0) {
//     return {
//         x, y, angle, speed, damage, color, width, height, owner, piercing,
//         spawnTime: Date.now() 
//     };
// }
// Then player.js would import and call this. For now, player.js creates bullet objects directly.

export function resetBulletsState(bullets) {
    if(bullets) bullets.length = 0;
}
