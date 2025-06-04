export const upgradeOptions = [
  { name: 'Increase Damage', apply: p => { p.damage += 5; } },
  { name: 'Increase Max HP', apply: p => { p.maxHp += 20; p.hp += 20; } },
  { name: 'Faster Fire Rate', apply: p => { p.fireRate = Math.max(100, p.fireRate - 50); } },
  { name: 'Increase Speed', apply: p => { p.speed += 30; } },
  { name: 'Spread Shot', apply: p => { p.weapon = 'spread'; } },
  { name: 'Rocket Launcher', apply: p => { p.weapon = 'rocket'; } }
];

export const synergyCombos = [
  {
    name: 'Cluster Rockets',
    requires: ['Spread Shot', 'Rocket Launcher'],
    apply: p => { p.weapon = 'rocket-spread'; }
  },
  {
    name: 'Overclock',
    requires: ['Increase Damage', 'Faster Fire Rate'],
    apply: p => { p.damage = Math.floor(p.damage * 1.2); p.fireRate = Math.max(50, Math.floor(p.fireRate * 0.8)); }
  }
];

function checkSynergies(player) {
  synergyCombos.forEach(s => {
    if (player.synergies.includes(s.name)) return;
    if (s.requires.every(r => player.upgrades.includes(r))) {
      s.apply(player);
      player.synergies.push(s.name);
      showSynergyToast(`${s.name} unlocked!`);
    }
  });
}

function showSynergyToast(text) {
  const toast = document.getElementById('achievementToast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function pickRandom(arr, n) {
  const copy = arr.slice();
  const res = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

export function showUpgradeMenu(player) {
  const panel = document.getElementById('augmentationChoicePanel');
  const choicesDiv = document.getElementById('augmentationChoices');
  panel.classList.remove('hidden');
  choicesDiv.innerHTML = '';
  const options = pickRandom(upgradeOptions, 3);
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.name;
    // highlight if picking this would trigger a synergy
    synergyCombos.forEach(s => {
      if (!player.synergies.includes(s.name) && s.requires.includes(opt.name)) {
        const others = s.requires.filter(r => r !== opt.name);
        if (others.every(r => player.upgrades.includes(r))) {
          btn.classList.add('synergy-hint');
        }
      }
    });
    btn.addEventListener('click', () => {
      opt.apply(player);
      player.upgrades.push(opt.name);
      checkSynergies(player);
      panel.classList.add('hidden');
    });
    choicesDiv.appendChild(btn);
  });
}
