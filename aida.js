// aida.js (Struktur Utama)
import mineflayer from "mineflayer";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements } = pkg;
import minecraftData from "minecraft-data";
import { plugin as collectBlockPlugin } from 'mineflayer-collectblock';

// Impor dari file utilitas
import { commandClassifierAI, chatGeneratorAI } from "./utils/ai_handler.js";

// Impor fitur NON-AUTO
import { followPlayer, stopMoving } from "./features/moving.js";
import { getStatusData, getInventorySummary } from "./features/status.js";
import { collectBlocks } from "./features/mining.js";

// Impor fitur AUTO
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

// Variabel untuk menyimpan riwayat percakapan
let chatHistory = [];

// === OTAK PEMROSES PERINTAH ===
async function processCommand(username, message) {
  try {
    // 1. AI membaca chat dan memilih case (mengklasifikasikan aksi)
    const command = await commandClassifierAI(message, chatHistory);
    console.log(`[AI Command]`, command);
    
    // Tambahkan pesan user ke riwayat
    chatHistory.push({ role: 'user', content: message });

    let reply = ""; // Variabel untuk menampung balasan Aida

    switch (command.action) {
      case "follow_player": {
        const success = followPlayer(bot, username);
        const prompt = success 
          ? `Aku baru saja mulai mengikuti ${username}. Beri respons singkat dan positif, contohnya "Baik, Master, saya ikuti!"` 
          : `Aku tidak bisa menemukan ${username} untuk diikuti. Beritahu dia kalau aku tidak bisa melihatnya.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "stop_moving": {
        stopMoving(bot);
        const prompt = `Aku baru saja berhenti bergerak karena disuruh ${username}. Beri respons singkat bahwa aku akan menunggu di sini, contohnya "Siap, saya menunggu perintah selanjutnya."`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "report_status": {
        const statusData = getStatusData(bot);
        const prompt = `Temanku bertanya soal kondisiku. Ini datanya: ${JSON.stringify(statusData)}. Tolong buatkan laporan yang santai, jangan kaku seperti membaca data.`;
        reply = await chatGeneratorAI(prompt, chatHistory);
        break;
      }
      case "list_inventory": {
        const inventory = getInventorySummary(bot);
        const prompt = inventory 
          ? `Temanku bertanya apa saja item yang aku punya. Ini daftarnya dalam format JSON: ${JSON.stringify(inventory)}. Sebutkan SEMUA item beserta jumlahnya dengan gaya santai, jangan seperti membaca daftar.`
          : `Aku diminta menunjukkan itemku, tapi tasku kosong. Beritahu temanku kalau aku tidak punya apa-apa.`;
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
    bot.chat("Duh, aku agak bingung nih, Master.");
  }
}

// === EVENT HANDLERS ===
bot.on("spawn", () => {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  
  // Optimasi Pathfinder
  bot.pathfinder.thinkTimeout = 10000; // Beri waktu 10 detik untuk berpikir
  bot.pathfinder.tickTimeout = 40;     // Izinkan lebih banyak kalkulasi per tick

  console.log("🤖 Aida sudah masuk ke server!");
  bot.chat("Aku Aida, siap melayani Master.");
});

// Event AUTO: dipicu oleh kondisi internal bot
bot.on('health', () => {
  // Case: autostatus
  checkProactiveStatus(bot, (prompt) => chatGeneratorAI(prompt, chatHistory));
});

// Event NON-AUTO: dipicu oleh chat user
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

