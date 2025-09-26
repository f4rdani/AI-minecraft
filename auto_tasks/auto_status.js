// auto_tasks/auto_status.js

let lowHealthWarned = false, criticalHealthWarned = false;
let lowFoodWarned = false, criticalFoodWarned = false;

/**
 * Memeriksa status kesehatan dan kelaparan bot secara proaktif.
 * @param {import('mineflayer').Bot} bot - Instance bot.
 * @param {Function} chatFn - Fungsi bot.chat untuk mengirim pesan.
 */
export function checkProactiveStatus(bot, chatFn) {
  try {
    const health = bot.health;
    const food = bot.food;

    if (health <= 5 && !criticalHealthWarned) {
      chatFn("Darahku kritis sekali, Master! Tolong!");
      criticalHealthWarned = true; lowHealthWarned = true;
    } else if (health <= 10 && !lowHealthWarned) {
      chatFn("Duh, darahku tinggal setengah, harus hati-hati.");
      lowHealthWarned = true;
    } else if (health > 10) {
      lowHealthWarned = false; criticalHealthWarned = false;
    }

    if (food <= 5 && !criticalFoodWarned) {
      chatFn("Master, aku lapar banget, ada makanan?");
      criticalFoodWarned = true; lowFoodWarned = true;
    } else if (food <= 10 && !lowFoodWarned) {
      chatFn("Perutku mulai keroncongan nih, Master.");
      lowFoodWarned = true;
    } else if (food > 10) {
      lowFoodWarned = false; criticalFoodWarned = false;
    }
  } catch (e) {
    console.error("Error di auto_status:", e);
  }
}
