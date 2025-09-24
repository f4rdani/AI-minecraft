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

/**
 * Merangkum item di inventaris bot.
 * @param {import('mineflayer').Bot} bot
 * @returns {object | null} - Objek berisi item dan jumlahnya, atau null jika kosong.
 */
export function getInventorySummary(bot) {
  const items = bot.inventory.items();
  if (items.length === 0) {
    return null; // Kembalikan null jika tas kosong
  }

  // Proses untuk merangkum item, contoh: { "oak_log": 64, "cobblestone": 32 }
  const summary = {};
  for (const item of items) {
    if (summary[item.name]) {
      summary[item.name] += item.count;
    } else {
      summary[item.name] = item.count;
    }
  }
  return summary;
}