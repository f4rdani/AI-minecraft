// auto_tasks/auto_status.js

let lowHealthWarned = false, criticalHealthWarned = false;
let lowFoodWarned = false, criticalFoodWarned = false;

/**
 * Memeriksa status kesehatan dan kelaparan bot secara proaktif.
 * @param {import('mineflayer').Bot} bot - Instance bot.
 * @param {Function} chatAI - Fungsi chatGeneratorAI untuk membuat kalimat.
 */
export async function checkProactiveStatus(bot, chatAI) {
  try {
    const health = bot.health;
    const food = bot.food;

    if (health <= 5 && !criticalHealthWarned) {
      const reply = await chatAI("Darahku kritis sekali! Tolong aku!");
      bot.chat(reply);
      criticalHealthWarned = true; lowHealthWarned = true;
    } else if (health <= 10 && !lowHealthWarned) {
      const reply = await chatAI("Duh, darahku tinggal setengah nih, harus hati-hati.");
      bot.chat(reply);
      lowHealthWarned = true;
    } else if (health > 10) {
      lowHealthWarned = false; criticalHealthWarned = false;
    }

    if (food <= 5 && !criticalFoodWarned) {
      const reply = await chatAI("Aku lapar banget nih, ada makanan nggak?");
      bot.chat(reply);
      criticalFoodWarned = true; lowFoodWarned = true;
    } else if (food <= 10 && !lowFoodWarned) {
      const reply = await chatAI("Perutku mulai keroncongan nih, bentar lagi harus makan.");
      bot.chat(reply);
      lowFoodWarned = true;
    } else if (food > 10) {
      lowFoodWarned = false; criticalFoodWarned = false;
    }
  } catch (e) {
    console.error("Error di auto_status:", e);
  }
}