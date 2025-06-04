export const levelDisplay = document.getElementById('levelDisplay');
export const scoreDisplay = document.getElementById('scoreDisplay');
export const xpBar = document.getElementById('xpBar');
export const xpProgressText = document.getElementById('xpProgressText');
export const hpDisplay = document.getElementById('hpDisplay');
export const maxHpDisplay = document.getElementById('maxHpDisplay');

export function updateUI(player, score) {
  if (levelDisplay) levelDisplay.textContent = player.level || 1;
  if (scoreDisplay) scoreDisplay.textContent = score;
  if (xpBar) xpBar.style.width = ((player.xp / player.xpToNext) * 100) + '%';
  if (xpProgressText) xpProgressText.textContent = `${player.xp}/${player.xpToNext} XP`;
  if (hpDisplay) hpDisplay.textContent = Math.floor(player.hp);
  if (maxHpDisplay) maxHpDisplay.textContent = player.maxHp;
}
