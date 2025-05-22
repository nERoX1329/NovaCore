// XP Orb related logic
import { getCssVar } from './utils.js';
// import { getPlayer } from './player.js'; // For player position for attraction
// import { gainXP } from './main.js'; // Or game_logic.js - for when orb is collected

// Note: The 'xpOrbs' array itself will be managed in main.js (game.js)
// and passed to these functions.

export function spawnXPOrb(xpOrbs, x, y, value) {
    // console.log(`Spawning XP orb at ${x},${y} with value ${value}`);
    xpOrbs.push({
        x, y, value,
        size: 2 + Math.log2(value + 1) * 0.7, // Size based on value
        speed: 2, // Base speed, can be modified
        color: getCssVar('--xp-orb-color') || '#40E0D0'
    });
}

export function updateXPOrbs(xpOrbs, dT, player, gainXPFunc, canvas) {
    if (!player || !xpOrbs || !canvas) return; // Ensure all refs are available

    for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const o = xpOrbs[i];
        const moveSpeed = o.speed * (dT / (1000 / 60)); // Delta time adjustment

        // Attraction logic
        const dx = player.x - o.x;
        const dy = player.y - o.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        // Define attraction radius based on player's collection radius multiplier
        const attractionRadius = (75 + player.radius) * player.xpCollectionRadiusMultiplier;

        if (d < attractionRadius) { // If within attraction radius
            if (d > 1) { // Prevent division by zero and keep moving if not exactly on player
                o.x += (dx / d) * moveSpeed * 1.5; // Move faster when attracted
                o.y += (dy / d) * moveSpeed * 1.5;
            }
        }

        // Collection logic (check if touching player)
        if (d < player.radius + o.size / 2) {
            if (gainXPFunc) gainXPFunc(o.value); // Call the passed gainXP function
            xpOrbs.splice(i, 1); // Remove orb
            continue; // Skip to next orb
        }

        // Remove if off-screen (e.g., scrolled too far down and not collected)
        if (o.y > canvas.height + o.size + 50) { // Add a buffer
            xpOrbs.splice(i, 1);
        }
    }
}

export function drawXPOrbs(xpOrbs, ctx) {
    if (!ctx || !xpOrbs) return;

    xpOrbs.forEach(orb => {
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function resetXPOrbsState(xpOrbs) {
    if(xpOrbs) xpOrbs.length = 0;
}
