export const upgradeOptions = [
  { name: 'Increase Damage', apply: p => { p.damage += 5; } },
  { name: 'Increase Max HP', apply: p => { p.maxHp += 20; p.hp += 20; } },
  { name: 'Faster Fire Rate', apply: p => { p.fireRate = Math.max(100, p.fireRate - 50); } },
  { name: 'Increase Speed', apply: p => { p.speed += 30; } }
];

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
    btn.addEventListener('click', () => {
      opt.apply(player);
      panel.classList.add('hidden');
    });
    choicesDiv.appendChild(btn);
  });
}
