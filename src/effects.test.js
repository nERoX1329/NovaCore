const { createExplosion, drawActiveEffects } = require('./effects');

describe('drawActiveEffects', () => {
  test('ctx.globalAlpha decreases as effect ages', () => {
    const effects = [];
    const ctx = {
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };
    let recorded = [];
    Object.defineProperty(ctx, 'globalAlpha', {
      set(v) { recorded.push(v); },
      get() { return recorded[recorded.length - 1]; }
    });

    const start = Date.now();
    createExplosion(effects, 0, 0, 10, 0, 'player', 'orange', 1000);

    const alphaAt = (t) => {
      recorded = [];
      drawActiveEffects(ctx, effects, start + t);
      return recorded[0];
    };

    const a1 = alphaAt(0);
    const a2 = alphaAt(500);

    expect(a2).toBeLessThan(a1);
  });
});
