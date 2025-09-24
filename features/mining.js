// features/mining.js (Versi Perbaikan Logika Pencarian)
import minecraftData from 'minecraft-data';
import { translateAliasToBestBlock } from '../utils/materials.js';

const RARE_ITEMS = ['diamond', 'gold_ore', 'emerald', 'ancient_debris'];

export async function collectBlocks(bot, itemName, count, chatAI) {
  // Terjemahkan nama item dari bahasa manusia ke nama teknis
  const specificBlockName = translateAliasToBestBlock(bot, itemName);

  if (!specificBlockName) {
    bot.chat(`Hmm, aku nggak tahu apa itu "${itemName}".`);
    return;
  }

  const mcData = minecraftData(bot.version);
  const item = mcData.itemsByName[specificBlockName];
  if (!item) {
    bot.chat(`Aku nemu blok ${specificBlockName} tapi kok aneh ya, nggak kukenal.`);
    return;
  }

  bot.chat(`Oke, aku mulai cari ${count} ${itemName} (target: ${specificBlockName})...`);

  try {
    let collected = 0;
    while (collected < count) {
      // [PERBAIKAN UTAMA] Biarkan collectBlock yang mencari blok terdekat
      // Ini jauh lebih efektif daripada bot.findBlocks
      const blockType = mcData.blocksByName[specificBlockName];
      await bot.collectBlock.collect(blockType.id, { count: 1 });
      
      collected++;
      
      // Beri laporan setiap 5 blok terkumpul
      if (collected % 5 === 0 && collected < count) {
        bot.chat(`Sudah dapat ${collected} ${itemName} nih.`);
      }

      if (RARE_ITEMS.some(rareItem => specificBlockName.includes(rareItem))) {
        const prompt = `Aku baru saja menemukan item langka: ${specificBlockName}! Buat kalimat seru untuk memberitahu temanku.`;
        const excitedMessage = await chatAI(prompt);
        bot.chat(excitedMessage);
      }
    }
    
    bot.chat(`Selesai! Aku berhasil mengumpulkan ${collected} ${itemName}.`);

  } catch (error) {
    console.error("Error saat mining:", error.message);
    bot.chat(`Duh, aku nggak nemu lagi ${itemName} di sekitar sini atau jalannya kehalang.`);
  }
}