// ai_minecraft.js
import mineflayer from "mineflayer";
import fetch from "node-fetch";

// === CONFIG ===
const bot = mineflayer.createBot({
  host: "localhost",   // ganti dengan IP server Minecraft (misalnya "127.0.0.1")
  port: 11111,         // port server (default 25565)
  username: "AIBot",   // nama bot di server
  version: false       // auto detect
});

// === FUNCTION: Kirim pesan ke AI LM Studio ===
async function askAI(message) {
  try {
    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b",
        messages: [
          { role: "system", content: "Kamu adalah teman anime yang bermain Minecraft. Jawab dengan bahasa Indonesia yang ramah, sedikit kawaii, seolah-olah kamu player manusia." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 150,
        stream: false
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (err) {
    console.error("❌ Error komunikasi AI:", err);
    return "Maaf, aku lagi error >_<";
  }
}

// === EVENT: Bot join server ===
bot.on("spawn", () => {
  console.log("🤖 AIBot sudah masuk ke server!");
  bot.chat("Halo semuanya! Aku bot AI siap menemani di Minecraft ✨");
});

// === EVENT: Chat listener ===
bot.on("chat", async (username, message) => {
  if (username === bot.username) return; // jangan respon chat sendiri

  console.log(`[CHAT] ${username}: ${message}`);

  // kalau nama bot dipanggil, baru respon
  if (message.toLowerCase().includes("ai") || message.toLowerCase().includes("bot")) {
    bot.chat("Tunggu ya, aku pikirin dulu... 🤔");

    const reply = await askAI(`${username} berkata: ${message}`);
    console.log(`[AI] ${reply}`);

    bot.chat(reply);
  }
});

// === EVENT: Error & Kick handling ===
bot.on("kicked", console.log);
bot.on("error", console.log);
