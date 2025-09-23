// aida.js (Versi Perbaikan Respons Aksi)
import mineflayer from "mineflayer";
import fetch from "node-fetch";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements } = pkg;
import minecraftData from "minecraft-data";

import { followPlayer, stopMoving } from "./actions.js";
import { getStatusData } from "./status.js";

// === KONFIGURASI ===
const OWNER_USERNAME = "Fall";
const bot = mineflayer.createBot({
  host: "localhost",
  port: 25565,
  username: "Aida",
  version: false
});

bot.loadPlugin(pathfinder);
let chatTimeout;

// === FUNGSI AI & PEMROSESAN PERINTAH ===

const commandClassifierAI = async (message) => {
    // Fungsi ini tidak berubah
    const systemPrompt = `
    Tugasmu adalah mengklasifikasikan pesan dari pemain menjadi format JSON.
    Pilihan "action": "follow_player", "stop_moving", "report_status", "chat".
    Contoh: "ikut aku" -> {"action": "follow_player"}
    Contoh: "status kamu" -> {"action": "report_status"}
    Contoh: "halo" -> {"action": "chat"}
    Balas HANYA dengan JSON.
  `;
  const response = await fetch("http://localhost:1234/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemma-3n-e4b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.1, max_tokens: 50
    }),
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
};

const chatGeneratorAI = async (prompt) => {
    // Fungsi ini tidak berubah
    const systemPrompt = `
    Kamu adalah Aida, teman bermain user di minecraft. Balas prompt berikut dengan gaya santai, ramah, dan singkat (1-2 kalimat) dalam Bahasa Indonesia.
    Jangan kaku seperti robot. Kurangi emoji. DILARANG KERAS menyebut 'Minecraft' atau 'game'.
  `;
  const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.8, max_tokens: 80
      }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
};

async function processCommand(username, message) {
  try {
    const command = await commandClassifierAI(message);
    console.log(`[AI Command]`, command);

    switch (command.action) {
      case "follow_player": {
        const success = followPlayer(bot, username);
        // [PERBAIKAN] Beri AI sebuah SITUASI, bukan perintah "buat kalimat"
        const prompt = success 
          ? `Aku baru saja mulai mengikuti ${username}. Beri respons singkat dan positif.` 
          : `Aku tidak bisa menemukan ${username} untuk diikuti. Beritahu dia kalau aku tidak bisa melihatnya.`;
        const reply = await chatGeneratorAI(prompt);
        bot.chat(reply);
        break;
      }
      case "stop_moving": {
        stopMoving(bot);
        // [PERBAIKAN] Beri AI sebuah SITUASI, bukan perintah "buat kalimat"
        const prompt = `Aku baru saja berhenti bergerak karena disuruh ${username}. Beri respons singkat bahwa aku akan menunggu di sini.`;
        const reply = await chatGeneratorAI(prompt);
        bot.chat(reply);
        break;
      }
      case "report_status": {
        const statusData = getStatusData(bot);
        const prompt = `Temanku bertanya soal kondisiku. Ini datanya: ${JSON.stringify(statusData)}. Tolong buatkan laporan yang santai, jangan kaku seperti membaca data.`;
        const reply = await chatGeneratorAI(prompt);
        bot.chat(reply);
        break;
      }
      case "chat":
      default: {
        const reply = await chatGeneratorAI(message);
        bot.chat(reply);
        break;
      }
    }
  } catch (err) {
    console.error("❌ Error saat memproses perintah:", err);
    bot.chat("Duh, aku agak bingung nih.");
  }
}

// === FUNGSI LAINNYA (TIMER, DLL) ===
async function initiateRandomChat() {
  const owner = bot.players[OWNER_USERNAME];
  if (!owner || !owner.entity) { return; }
  const prompt = `Buat sapaan singkat (1 kalimat) untuk temanku "${OWNER_USERNAME}" karena sudah lama diam.`;
  await processCommand(OWNER_USERNAME, prompt);
}
function startIdleChatTimer() {
    clearTimeout(chatTimeout);
    chatTimeout = setTimeout(initiateRandomChat, 180000);
}

// === EVENT HANDLERS ===
bot.on("spawn", () => {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  console.log("🤖 Aida sudah masuk ke server!");
  bot.chat("Aku Aida, siap main bareng!");
});

bot.on("chat", (username, message) => {
  if (username === bot.username) return;
  const lowerCaseMessage = message.toLowerCase();
  if (lowerCaseMessage.includes("aida") || lowerCaseMessage.includes("ai")) {
    processCommand(username, message);
  }
});

bot.on("kicked", console.log);
bot.on("error", console.log);