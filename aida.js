// aida.js (Versi dengan Riwayat Chat & Respon Proaktif)
import mineflayer from "mineflayer";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements } = pkg;
import minecraftData from "minecraft-data";
import { plugin as collectBlockPlugin } from 'mineflayer-collectblock';

// Impor dari file utilitas
import { commandClassifierAI, chatGeneratorAI } from "./utils/ai_handler.js";

// Impor fitur
import { followPlayer, stopMoving } from "./features/moving.js";
import { getStatusData, getInventorySummary } from "./features/status.js";
import { collectBlocks } from "./features/mining.js";
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

// [BARU] Variabel untuk menyimpan riwayat percakapan
let chatHistory = [];

// === OTAK PEMROSES PERINTAH ===
async function processCommand(username, message) {
  try {
    const command = await commandClassifierAI(message, chatHistory);
    console.log(`[AI Command]`, command);
    
    // Tambahkan pesan user ke riwayat
    chatHistory.push({ role: 'user', content: message });

    let reply = ""; // Variabel untuk menampung balasan Aida

    switch (command.action) {
      case "follow_player": {
        const success = followPlayer(bot, username);
        const prompt = success ? `Aku akan mulai mengikuti ${username}. Beri respons singkat.` : `Aku tidak bisa menemukan ${username}.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "stop_moving": {
        stopMoving(bot);
        const prompt = `Aku akan berhenti dan menunggu sesuai perintah ${username}.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "report_status": {
        const statusData = getStatusData(bot);
        const prompt = `Temanku bertanya soal kondisiku. Ini datanya: ${JSON.stringify(statusData)}. Buatkan laporan yang santai.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
       case "list_inventory": {
        const inventory = getInventorySummary(bot);
        // [PERBAIKAN] Prompt diperjelas untuk meminta SEMUA item
        const prompt = inventory ? `Temanku bertanya apa saja itemku. Ini daftarnya: ${JSON.stringify(inventory)}. Sebutkan SEMUA item beserta jumlahnya dalam format daftar yang rapi.` : `Tasku kosong. Beritahu temanku.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "collect_blocks": {
        const item = command.item || "kayu";
        const count = command.count || 5;
        // Fungsi mining akan menangani chatnya sendiri, jadi tidak perlu `reply`
        collectBlocks(bot, item, count, (prompt) => chatGeneratorAI(prompt, chatHistory));
        break;
      }
      case "chat":
      default: {
        reply = await chatGeneratorAI(message, chatHistory);
        break;
      }
    }
    
    if (reply) {
      bot.chat(reply);
      // Tambahkan balasan Aida ke riwayat
      chatHistory.push({ role: 'assistant', content: reply });
    }

    // Batasi riwayat agar tidak terlalu panjang (misal: 10 percakapan terakhir)
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }

  } catch (err) {
    console.error("❌ Error saat memproses perintah:", err);
    bot.chat("Duh, aku agak bingung nih.");
  }
}

// === EVENT HANDLERS ===
bot.on("spawn", () => {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  console.log("🤖 Aida sudah masuk ke server!");
  bot.chat("Aku Aida, siap melayani Master.");
});

bot.on('health', () => {
  checkProactiveStatus(bot, (prompt) => chatGeneratorAI(prompt, chatHistory));
});

bot.on("chat", (username, message) => {
  if (username === bot.username) return;

  // Cek jumlah pemain (tidak termasuk bot itu sendiri)
  const playerCount = Object.keys(bot.players).filter(p => p !== bot.username).length;
  
  // [PERBAIKAN] Logika pemicu chat
  const shouldRespond = (playerCount === 1) || message.toLowerCase().includes("aida") || message.toLowerCase().includes("ai");

  if (shouldRespond) {
    processCommand(username, message);
  }
});

bot.on("kicked", console.log);
bot.on("error", console.log);