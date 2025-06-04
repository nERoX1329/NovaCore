export const levelDisplay = document.getElementById('levelDisplay');
export const scoreDisplay = document.getElementById('scoreDisplay');

export function updateUI(player, score) {
  if (levelDisplay) levelDisplay.textContent = player.level || 1;
  if (scoreDisplay) scoreDisplay.textContent = score;
}
