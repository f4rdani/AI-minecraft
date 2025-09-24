// features/mining.js (Versi Final dengan Pencarian Hibrida)
import minecraftData from 'minecraft-data';
import { translateAliasToBestBlock } from '../utils/materials.js';

const RARE_ITEMS = ['diamond_ore', 'gold_ore', 'emerald_ore', 'ancient_debris'];

/**
 * Fungsi utama untuk mencari dan mengumpulkan blok dengan metode pencarian yang lebih tangguh.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 * @param {string} itemName - Nama item/blok yang ingin dicari (contoh: "kayu", "batu").
 * @param {number} count - Jumlah yang ingin dikumpulkan.
 * @param {Function} chatAI - Fungsi untuk menghasilkan chat natural.
 */
export async function collectBlocks(bot, itemName, count, chatAI) {
  // 1. Terjemahkan nama alias ke nama blok spesifik yang paling masuk akal.
  const specificBlockName = translateAliasToBestBlock(bot, itemName);
  if (!specificBlockName) {
    bot.chat(`Hmm, aku nggak tahu apa itu "${itemName}".`);
    return;
  }

  const mcData = minecraftData(bot.version);
  const blockType = mcData.blocksByName[specificBlockName];
  if (!blockType) {
    bot.chat(`Aku nemu blok ${specificBlockName} tapi kok aneh ya, nggak kukenal.`);
    return;
  }

  bot.chat(`Oke, aku mulai cari ${count} ${itemName} (target: ${specificBlockName})...`);

  // 2. Kumpulkan blok satu per satu menggunakan metode `collectBlock` yang lebih dinamis
  try {
    let collected = 0;
    while (collected < count) {
      // Cari SATU blok terdekat yang bisa dijangkau.
      const block = await bot.findBlock({
        matching: blockType.id,
        maxDistance: 64,
        // Pastikan blok tersebut bisa dijangkau
        useExtraInfo: (block) => {
          const blockAbove = bot.blockAt(block.position.offset(0, 1, 0));
          // Syarat: Bisa dijangkau jika blok di atasnya adalah udara (atau tanaman yang bisa dihancurkan)
          return blockAbove && blockAbove.type === 0; // 0 adalah ID untuk udara
        }
      });

      if (!block) {
        // Jika tidak ada lagi blok yang bisa dijangkau, hentikan pencarian.
        bot.chat(`Sepertinya sudah tidak ada lagi ${itemName} yang bisa kuambil di sekitar sini.`);
        break;
      }

      // Gunakan plugin collectBlock untuk mengambil blok spesifik yang sudah kita temukan.
      await bot.collectBlock.collect(block);
      collected++;

      // Beri laporan setiap 5 blok terkumpul
      if (collected > 0 && collected % 5 === 0 && collected < count) {
        bot.chat(`Sudah dapat ${collected} ${itemName} nih.`);
      }

      // Cek jika item langka
      if (RARE_ITEMS.some(rareItem => specificBlockName.includes(rareItem))) {
        const prompt = `Aku baru saja menemukan item langka: ${specificBlockName}! Buat kalimat seru.`;
        const excitedMessage = await chatAI(prompt);
        bot.chat(excitedMessage);
      }
    }
    
    bot.chat(`Selesai! Aku berhasil mengumpulkan ${collected} ${itemName}.`);

  } catch (error) {
    console.error("Error saat mining:", error.message);
    const reply = await chatAI(`Duh, aku gagal ngumpulin ${itemName}, sepertinya jalannya kehalang atau ada error.`);
    bot.chat(reply);
  }
}