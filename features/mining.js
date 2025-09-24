// mining.js (Versi dengan penerjemah material)
import { Movements } from 'mineflayer-pathfinder';
import minecraftData from 'minecraft-data';
import { translateAliasToBestBlock } from '../materials.js'; // Impor penerjemah

const RARE_ITEMS = ['diamond', 'gold_ore', 'emerald', 'ancient_debris'];

export async function collectBlocks(bot, itemName, count, chatAI) {
  // [PERBAIKAN] Terjemahkan nama item dari bahasa manusia ke nama teknis
  const specificBlockName = translateAliasToBestBlock(bot, itemName);

  if (!specificBlockName) {
    await bot.chat(`Hmm, aku nggak tahu apa itu "${itemName}".`);
    return;
  }

  const mcData = minecraftData(bot.version);
  const item = mcData.itemsByName[specificBlockName];
  if (!item) {
    await bot.chat(`Aku nemu blok ${specificBlockName} tapi kok aneh ya, nggak kukenal.`);
    return;
  }

  await bot.chat(`Oke, aku cari ${count} ${itemName} (target: ${specificBlockName})...`);

  const blocksToFind = bot.findBlocks({
    matching: (block, extra) => block.name === specificBlockName && extra && extra.exposed > 0,
    useExtraInfo: true,
    maxDistance: 64,
    count: count,
  });

  if (blocksToFind.length === 0) {
    await bot.chat(`Aku nggak nemu ${itemName} yang bisa dijangkau di sekitar sini.`);
    return;
  }
  
  await bot.chat(`Sip, ketemu! Aku mulai kumpulin ya.`);

  try {
    let collected = 0;
    while (collected < count && blocksToFind.length > 0) {
      const block = bot.blockAt(blocksToFind.shift());
      if (!block) continue;

      await bot.collectBlock.collect(block, { ignoreNoPath: true });
      collected++;
      
      if (collected % 5 === 0 && collected < count) {
        await bot.chat(`Sudah dapat ${collected} ${itemName} nih.`);
      }

      if (RARE_ITEMS.some(rareItem => specificBlockName.includes(rareItem))) {
        const prompt = `Aku baru saja menemukan item langka: ${specificBlockName}! Buat kalimat seru untuk memberitahu temanku.`;
        const excitedMessage = await chatAI(prompt);
        await bot.chat(excitedMessage);
      }
    }
    
    await bot.chat(`Selesai! Aku berhasil mengumpulkan ${collected} ${itemName}.`);

  } catch (error) {
    console.error("Error saat mining:", error.message);
    await bot.chat(`Duh, ada masalah pas lagi ngumpulin ${itemName}.`);
  }
}