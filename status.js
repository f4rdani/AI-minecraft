/**
 * Mengumpulkan semua data status bot dalam bentuk objek.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 * @returns {object} - Objek berisi data status.
 */
export function getStatusData(bot) {
  const health = Math.ceil(bot.health);
  const food = Math.ceil(bot.food);
  const level = bot.experience.level;
  
  const activeEffects = Object.values(bot.entity.effects);
  let effectsList = "tidak ada";
  if (activeEffects.length > 0) {
    effectsList = activeEffects.map(effect => {
      const cleanedName = effect.name.replace('minecraft:', '').replace('_', ' ');
      return `${cleanedName} ${effect.amplifier + 1}`;
    }).join(', ');
  }

  return { health, food, level, effects: effectsList };
}