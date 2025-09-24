// utils/ai_handler.js
import fetch from "node-fetch";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "google/gemma-3n-e4b";

/**
 * Mengklasifikasikan perintah user menjadi format JSON.
 * @param {string} message - Pesan dari user.
 * @returns {Promise<object>} - Objek perintah (contoh: { action: 'follow_player' }).
 */
export async function commandClassifierAI(message) {
  const systemPrompt = `
    Klasifikasikan pesan user ke format JSON.
    Pilihan "action": "follow_player", "stop_moving", "report_status", "list_inventory", "collect_blocks", "chat".
    Contoh: "ikut aku" -> {"action": "follow_player"}
    Contoh: "item kamu" -> {"action": "list_inventory"}
    Contoh: "cariin 10 kayu" -> {"action": "collect_blocks", "item": "kayu", "count": 10}
    Balas HANYA dengan JSON.
  `;
  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
      temperature: 0.1, max_tokens: 60
    }),
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : `{"action":"chat"}`);
}

/**
 * Menghasilkan kalimat chat yang natural berdasarkan sebuah prompt.
 * @param {string} prompt - Konteks atau situasi untuk dibalas oleh AI.
 * @returns {Promise<string>} - Kalimat balasan dari AI.
 */
export async function chatGeneratorAI(prompt) {
  const systemPrompt = `
    Kamu adalah Aida, teman, maid, asisten user di dunia minecraft java, jadi gunakan semua informasi minecraft java yang kau punya. Balas prompt berikut dengan gaya santai, ramah, dan singkat (1-2 kalimat) dalam Bahasa Indonesia.
    Jangan kaku atau formal. Jangan gunakan emot atau emoji. DILARANG KERAS menyebut 'Minecraft' atau 'game'.
    Roleplay kau sebagai Aida, pelayan atau asisten yang baik, ramah, dan membantu atau melayani user di dunia minecraft java.
    `;
  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
      temperature: 0.8, max_tokens: 80
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}