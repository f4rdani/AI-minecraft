// aida.js (Versi dengan Eksekutor Kode Dinamis)
import mineflayer from "mineflayer";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements } = pkg;
import minecraftData from "minecraft-data";
import { plugin as collectBlockPlugin } from 'mineflayer-collectblock';

// [PERBAIKAN] Impor dari file utilitas dan pustaka skill yang benar
import { codeGeneratorAI } from "./utils/ai_handler.js";
import { skills } from "./features/skill_library.js";
import { checkProactiveStatus } from "./auto_tasks/auto_status.js";

// === KONFIGURASI ===
const OWNER_USERNAME = "Fall";
const bot = mineflayer.createBot({
  host: "localhost",
  port: 25565,
  username: "Aida",
  version: false
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlockPlugin);

let chatHistory = [];

// === OTAK PEMROSES PERINTAH ===
async function processCommand(username, message) {
  try {
    // 1. AI menghasilkan kode berdasarkan chat
    const codeToExecute = await codeGeneratorAI(message, username, chatHistory);
    console.log(`[AI Code]`, codeToExecute);

    chatHistory.push({ role: 'user', content: message });
    let reply = "";

    // 2. Cek apakah AI menghasilkan kode atau chat biasa
    if (codeToExecute.startsWith("skills.")) {
      // Jika ini kode, jalankan dengan aman menggunakan constructor AsyncFunction
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const executor = new AsyncFunction('bot', 'skills', `return ${codeToExecute}`);
      reply = await executor(bot, skills);
    } else {
      // Jika ini chat biasa, gunakan sebagai balasan
      reply = codeToExecute.replace(/"/g, ''); // Hapus tanda kutip jika ada
    }
    
    if (reply) {
      bot.chat(reply);
      chatHistory.push({ role: 'assistant', content: reply });
    }

    // Batasi riwayat agar tidak terlalu panjang
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }

  } catch (err) {
    console.error("❌ Error saat menjalankan kode AI:", err);
    bot.chat("Duh, sepertinya ada yang salah dengan logikaku, Master.");
  }
}

// === EVENT HANDLERS ===
bot.on("spawn", () => {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  console.log("🤖 Aida sudah masuk ke server!");
  bot.chat("Aida siap melayani, Master.");
});

bot.on('health', () => {
    // Untuk auto-status, kita tidak perlu memanggil AI, cukup cek kondisi
    checkProactiveStatus(bot, (prompt) => bot.chat(prompt)); // Disederhanakan
});

bot.on("chat", (username, message) => {
  if (username === bot.username) return;
  const playerCount = Object.keys(bot.players).filter(p => p !== bot.username).length;
  const shouldRespond = (playerCount <= 1) || message.toLowerCase().includes("aida") || message.toLowerCase().includes("ai");

  if (shouldRespond) {
    processCommand(username, message);
  }
});

bot.on("kicked", console.log);
bot.on("error", console.log);

