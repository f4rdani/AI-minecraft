// aida.js (Versi Perbaikan Error 'undefined' message)
import mineflayer from "mineflayer";
import fetch from "node-fetch";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements } = pkg;
import minecraftData from "minecraft-data";

import { followPlayer, stopMoving } from "./actions.js";

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

const createSystemPrompt = () => `
Kamu adalah Aida, AI yang hidup di dalam dunia balok sebagai teman pemain.
Tugasmu adalah mengubah chat dari pemain menjadi format JSON.

Pilihan "action" yang tersedia:
1. "follow_player": Jika diminta mengikuti atau datang.
2. "stop_moving": Jika diminta berhenti, diam, atau menunggu.
3. "chat": Untuk semua obrolan biasa yang tidak mengandung perintah.

ATURAN PENTING:
- Jika action adalah "chat", WAJIB sertakan field "message" yang berisi jawabanmu.
- Jawab dengan singkat (1-2 kalimat).
- Gaya bicara santai dan ramah.
- DILARANG KERAS menyebut kata 'Minecraft' atau 'game'.
- Kurangi penggunaan emoji.
- Balasanmu HARUS dan HANYA BOLEH berupa satu blok kode JSON. JANGAN gunakan markdown (tanda \`\`\`).
`;

async function processCommandWithAI(username, message) {
  console.log(`[AI Processing] Pesan dari ${username}: ${message}`);
  
  try {
    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b",
        messages: [
          { role: "system", content: createSystemPrompt() },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 80,
      }),
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      bot.chat("Otak AI-ku ngirim sinyal aneh...");
      return;
    }

    let aiResponseContent = data.choices[0].message.content;
    console.log("[AI Raw Content]", aiResponseContent);

    const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponseContent = jsonMatch[0];
    }

    let command;
    try {
      command = JSON.parse(aiResponseContent);
    } catch (e) {
      console.log("Gagal parse JSON, dianggap chat biasa:", aiResponseContent);
      bot.chat(aiResponseContent);
      return;
    }

    switch (command.action) {
      case "follow_player":
        followPlayer(bot, command.target || username);
        break;
      case "stop_moving":
        stopMoving(bot);
        break;
      case "chat":
        // [PERBAIKAN UTAMA] Cek dulu apakah command.message ada sebelum mengirim chat
        if (command.message) {
          bot.chat(command.message);
        } else {
          console.log("AI action 'chat' tidak memiliki properti 'message'.");
          bot.chat("Eh, aku mau ngomong apa ya tadi... lupa."); // Jawaban fallback
        }
        break;
      default:
        bot.chat("Hmm, aku nggak ngerti perintah itu.");
    }

  } catch (err) {
    console.error("❌ Error komunikasi dengan AI:", err);
    bot.chat("Maaf, otak AI-ku lagi nge-lag >_<");
  }
}

// === FUNGSI LAINNYA (TIMER, DLL) ===
async function initiateRandomChat() {
  const owner = bot.players[OWNER_USERNAME];
  if (!owner || !owner.entity) {
    startIdleChatTimer();
    return;
  }
  const prompt = `Buat sapaan singkat (1 kalimat) untuk temanku "${OWNER_USERNAME}" karena sudah lama diam.`;
  await processCommandWithAI(OWNER_USERNAME, prompt);
}

function startIdleChatTimer() {
  clearTimeout(chatTimeout);
  chatTimeout = setTimeout(initiateRandomChat, 180000); // 3 menit
}

// === EVENT HANDLERS ===
bot.on("spawn", () => {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  
  console.log("🤖 Aida sudah masuk ke server!");
  bot.chat("Aku Aida, siap main bareng!");
  startIdleChatTimer();
});

bot.on("chat", (username, message) => {
  startIdleChatTimer();
  if (username === bot.username) return;

  console.log(`[CHAT] ${username}: ${message}`);

  const lowerCaseMessage = message.toLowerCase();
  if (lowerCaseMessage.includes("aida") || lowerCaseMessage.includes("ai")) {
    processCommandWithAI(username, message);
  }
});

bot.on("kicked", console.log);
bot.on("error", console.log);