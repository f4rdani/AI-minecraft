// utils/materials.js (Kamus Material)
import minecraftData from 'minecraft-data';

// Kamus untuk menerjemahkan bahasa sehari-hari ke nama item teknis.
export const materialAliases = {
  'kayu': ['oak_log', 'birch_log', 'spruce_log', 'dark_oak_log', 'acacia_log', 'jungle_log', 'cherry_log', 'mangrove_log'],
  'batu': ['cobblestone', 'stone', 'diorite', 'andesite', 'granite', 'deepslate'],
  'tanah': ['dirt', 'grass_block', 'podzol', 'mycelium'],
  'pasir': ['sand', 'red_sand'],
  'besi': ['iron_ore', 'deepslate_iron_ore'],
  'emas': ['gold_ore', 'deepslate_gold_ore'],
  'diamond': ['diamond_ore', 'deepslate_diamond_ore'],
  'batubara': ['coal_ore', 'deepslate_coal_ore']
  // Tambahkan alias lain di sini jika perlu
};

/**
 * Menerjemahkan nama alias (misal: "kayu") menjadi nama blok spesifik terdekat (misal: "oak_log").
 * @param {import('mineflayer').Bot} bot - Instance bot.
 * @param {string} alias - Nama alias dari material.
 * @returns {string|null} - Nama blok spesifik atau null jika tidak ditemukan.
 */
export function translateAliasToBestBlock(bot, alias) {
  const normalizedAlias = alias.toLowerCase().replace(' ', ''); // Normalisasi input
  const possibleItemNames = materialAliases[normalizedAlias];
  const mcData = minecraftData(bot.version);

  // Jika bukan alias, mungkin itu sudah nama item yang benar.
  if (!possibleItemNames) {
    return mcData.blocksByName[alias] ? alias : null;
  }

  // Cari jenis blok terdekat dari semua kemungkinan
  let closestBlock = null;
  let minDistance = Infinity;

  for (const itemName of possibleItemNames) {
    const block = bot.findBlock({
      matching: mcData.blocksByName[itemName]?.id,
      maxDistance: 128,
    });

    if (block) {
      const distance = bot.entity.position.distanceTo(block.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestBlock = block;
      }
    }
  }

  return closestBlock ? closestBlock.name : null;
}

