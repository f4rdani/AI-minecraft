// [PERBAIKAN] Impor diubah sesuai dengan format yang benar
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;

/**
 * Membuat bot mengikuti pemain.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 * @param {string} username - Nama pemain yang akan diikuti.
 */
export function followPlayer(bot, username) {
  const player = bot.players[username];
  if (!player || !player.entity) {
    bot.chat(`Aku nggak lihat ${username} di mana...`);
    return;
  }
  bot.chat(`Oke, aku ikutin ${username} dari belakang ya.`);
  
  const goal = new goals.GoalFollow(player.entity, 1);
  bot.pathfinder.setGoal(goal, true);
}

/**
 * Membuat bot berhenti bergerak.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 */
export function stopMoving(bot) {
  bot.chat("Oke, aku diem di sini.");
  bot.pathfinder.stop();
}