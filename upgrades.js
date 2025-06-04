import { spawnDrone } from './companions.js';

export const basicUpgrades = [
  { name: 'Health Boost', rarity: 'Common', apply: p => { p.maxHp += 5; p.hp += 5; } },
  { name: 'Swift Foot', rarity: 'Common', apply: p => { p.speed += 20; } },
  { name: 'Reinforced Core', rarity: 'Uncommon', apply: p => { p.maxHp += 10; p.hp += 10; } },
  { name: 'Fleet-Footed', rarity: 'Uncommon', apply: p => { p.speed += 30; } },
  { name: 'Vigor of the Warrior', rarity: 'Rare', apply: p => { p.maxHp += 15; p.hp += 15; } },
  { name: 'Adrenaline Rush', rarity: 'Rare', apply: p => { p.damage += 3; } },
  { name: 'Indomitable Spirit', rarity: 'Epic', apply: p => { p.maxHp += 25; p.hp += 25; } },
  { name: 'Temporal Shift', rarity: 'Epic', apply: p => { p.speed += 40; } },
  { name: 'Divine Providence', rarity: 'Legendary', apply: p => { p.maxHp += 50; p.hp += 50; } },
  { name: 'Master of All', rarity: 'Legendary', apply: p => { p.damage += 5; p.speed += 20; } }
];

export const classUpgrades = {
  'Drone Commander': [
    { name: 'Drone Efficiency', rarity: 'Common', apply: p => { p.droneDamageMult = (p.droneDamageMult || 1) * 1.1; } },
    { name: 'Drone Recharge', rarity: 'Common', apply: p => { p.droneFireRateMult = (p.droneFireRateMult || 1) * 0.95; } },
    { name: 'Modular Construction', rarity: 'Uncommon', apply: p => { p.maxDrones = (p.maxDrones || 1) + 1; if (typeof spawnDrone === 'function') spawnDrone(p); } },
    { name: 'Aggressive Programming', rarity: 'Uncommon', apply: p => { p.droneDamageMult = (p.droneDamageMult || 1) * 1.15; } },
    { name: 'Advanced Fabrication', rarity: 'Rare', apply: p => { p.maxDrones = (p.maxDrones || 1) + 1; if (typeof spawnDrone === 'function') spawnDrone(p); } },
    { name: 'Overclocked Processors', rarity: 'Rare', apply: p => { p.droneFireRateMult = (p.droneFireRateMult || 1) * 0.8; } },
    { name: 'Drone Swarm Protocol', rarity: 'Epic', apply: p => { p.maxDrones = (p.maxDrones || 1) + 1; if (typeof spawnDrone === 'function') spawnDrone(p); } },
    { name: 'Alpha Drone Designation', rarity: 'Epic', apply: p => { p.alphaDrone = true; } },
    { name: 'Hive Mind', rarity: 'Legendary', apply: p => { p.maxDrones = 5; } },
    { name: 'Annihilation Sequence', rarity: 'Legendary', apply: p => { p.droneExplosive = true; } }
  ],
  'Arsenal Expert': [
    { name: 'Calibrated Barrels', rarity: 'Common', apply: p => { p.damage += 7; } },
    { name: 'Efficient Reloads', rarity: 'Common', apply: p => { p.fireRate = Math.max(50, p.fireRate - 20); } },
    { name: 'Piercing Ammo', rarity: 'Uncommon', apply: p => { p.piercing = (p.piercing || 0) + 1; } },
    { name: 'Critical Insight', rarity: 'Uncommon', apply: p => { p.crit = (p.crit || 0) + 5; } },
    { name: 'Volley Control', rarity: 'Rare', apply: p => { p.projectiles = (p.projectiles || 1) + 1; } },
    { name: 'Explosive Ordinance', rarity: 'Rare', apply: p => { p.rocket = true; } },
    { name: 'Ricochet Rounds', rarity: 'Epic', apply: p => { p.ricochet = true; } },
    { name: 'Elemental Infusion', rarity: 'Epic', apply: p => { p.elemental = true; } },
    { name: 'Unlimited Ammunition', rarity: 'Legendary', apply: p => { p.infiniteAmmo = true; } },
    { name: 'Dual Wielding Mastery', rarity: 'Legendary', apply: p => { p.dualWield = true; } }
  ],
  'Shield Guardian': [
    { name: 'Stalwart Guard', rarity: 'Common', apply: p => { p.maxHp += 15; p.hp += 15; } },
    { name: 'Defensive Stance', rarity: 'Common', apply: p => { p.regen = (p.regen || 0) + 5; } },
    { name: 'Rapid Shield Recharge', rarity: 'Uncommon', apply: p => { p.regen = (p.regen || 0) + 10; } },
    { name: 'Impact Nova', rarity: 'Uncommon', apply: p => { p.nova = true; } },
    { name: 'Shield Overload', rarity: 'Rare', apply: p => { p.maxHp += 25; p.hp += 25; } },
    { name: 'Reactive Shield', rarity: 'Rare', apply: p => { p.regen = (p.regen || 0) + 15; } },
    { name: 'Aegis Dome', rarity: 'Epic', apply: p => { p.invuln = true; } },
    { name: 'Kinetic Absorb', rarity: 'Epic', apply: p => { p.absorb = true; } },
    { name: 'Bulwark of the Ancients', rarity: 'Legendary', apply: p => { p.regen = (p.regen || 0) + 30; } },
    { name: 'Impenetrable Fortress', rarity: 'Legendary', apply: p => { p.damageReduction = (p.damageReduction || 0) + 15; } }
  ],
  'Technomancer': [
    { name: 'Basic Circuitry', rarity: 'Common', apply: p => { p.turretDamageMult = (p.turretDamageMult || 1) * 1.1; } },
    { name: 'Energy Cells', rarity: 'Common', apply: p => { p.energy = (p.energy || 0) + 10; } },
    { name: 'Second Turret Slot', rarity: 'Uncommon', apply: p => { p.maxTurrets = (p.maxTurrets || 1) + 1; } },
    { name: 'Overheated Beam', rarity: 'Uncommon', apply: p => { p.turretFireRateMult = (p.turretFireRateMult || 1) * 0.9; } },
    { name: 'Turret Specialization', rarity: 'Rare', apply: p => { p.explosiveTurret = true; } },
    { name: 'Regenerative Shields', rarity: 'Rare', apply: p => { p.turretRegen = true; } },
    { name: 'Autonomous Turret', rarity: 'Epic', apply: p => { p.autoTurret = true; } },
    { name: 'Shock Aura', rarity: 'Epic', apply: p => { p.shockAura = true; } },
    { name: 'Permanent Turrets', rarity: 'Legendary', apply: p => { p.permanentTurret = true; } },
    { name: 'Singularity Generator', rarity: 'Legendary', apply: p => { p.singularity = true; } }
  ]
};

function pickRandom(arr, n) {
  const copy = arr.slice();
  const res = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

export function showUpgradeMenu(player, onPick) {
  const panel = document.getElementById('augmentationChoicePanel');
  const choicesDiv = document.getElementById('augmentationChoices');
  panel.classList.remove('hidden');
  choicesDiv.innerHTML = '';
  const all = basicUpgrades.concat(classUpgrades[player.classType] || []);
  const options = pickRandom(all, 3);
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.name;
    btn.classList.add(`rarity-${opt.rarity}`);
    btn.addEventListener('click', () => {
      opt.apply(player);
      panel.classList.add('hidden');
      if (onPick) onPick();
    });
    choicesDiv.appendChild(btn);
  });
}
