import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;

/**
 * Membuat bot mengikuti pemain. TIDAK MENGIRIM CHAT.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 * @param {string} username - Nama pemain yang akan diikuti.
 * @returns {boolean} - True jika berhasil, false jika gagal.
 */
export function followPlayer(bot, username) {
  const player = bot.players[username];
  if (!player || !player.entity) {
    console.log(`Gagal menemukan pemain: ${username}`);
    return false;
  }
  const goal = new goals.GoalFollow(player.entity, 1);
  bot.pathfinder.setGoal(goal, true);
  return true;
}

/**
 * Membuat bot berhenti bergerak. TIDAK MENGIRIM CHAT.
 * @param {import('mineflayer').Bot} bot - Instance bot mineflayer.
 */
export function stopMoving(bot) {
  bot.pathfinder.stop();
}