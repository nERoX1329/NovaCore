(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NovaCoreEffects = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function createExplosion(activeEffects, x, y, radius, damage, ownerType = 'player', color = 'orange', duration = 300) {
        activeEffects.push({
            type: 'explosion',
            x,
            y,
            radius,
            currentRadius: 0,
            maxRadius: radius,
            damage,
            ownerType,
            color,
            durationMs: duration,
            creationTime: Date.now(),
            damagedEnemies: []
        });
    }

    function drawActiveEffects(ctx, activeEffects, now = Date.now()) {
        if (!ctx) return;
        activeEffects.forEach(effect => {
            if (effect.type === 'explosion') {
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, Math.max(0, effect.currentRadius), 0, Math.PI * 2);
                const remaining = effect.creationTime + effect.durationMs - now;
                effect.duration = remaining;
                ctx.globalAlpha = Math.max(0, remaining / (remaining + 1));
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });
    }

    return { createExplosion, drawActiveEffects };
}));
