// utils/ai_handler.js (Versi dengan Riwayat Chat)
import fetch from "node-fetch";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "google/gemma-3n-e4b";

/**
 * Mengklasifikasikan perintah user menjadi format JSON, dengan mempertimbangkan riwayat chat.
 * @param {string} message - Pesan terbaru dari user.
 * @param {Array<object>} history - Riwayat percakapan.
 * @returns {Promise<object>} - Objek perintah.
 */
export async function commandClassifierAI(message, history = []) {
  const systemPrompt = `
    Klasifikasikan pesan user TERAKHIR ke format JSON berdasarkan konteks percakapan.
    Pilihan "action": "follow_player", "stop_moving", "report_status", "list_inventory", "collect_blocks", "chat".
    Contoh: "item kamu" -> {"action": "list_inventory"}
    Contoh: "cariin 10 kayu" -> {"action": "collect_blocks", "item": "kayu", "count": 10}
    Balas HANYA dengan JSON.
  `;
  const messages = [
    { role: "system", content: systemPrompt },
    ...history, // Sisipkan riwayat chat
    { role: "user", content: message }
  ];

  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.1, max_tokens: 60 }),
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : `{"action":"chat"}`);
}

/**
 * Menghasilkan kalimat chat yang natural berdasarkan sebuah prompt dan riwayat chat.
 * @param {string} prompt - Konteks atau situasi untuk dibalas oleh AI.
 * @param {Array<object>} history - Riwayat percakapan.
 * @returns {Promise<string>} - Kalimat balasan dari AI.
 */
export async function chatGeneratorAI(prompt, history = []) {
  const systemPrompt = `
    Kamu adalah Aida, asisten yang ramah di dunia balok. Balas prompt dari user dengan santai dan singkat (1-2 kalimat) dalam Bahasa Indonesia.
    Gunakan riwayat percakapan untuk memahami konteks. Jangan kaku atau formal. Jangan gunakan emoji. DILARANG KERAS menyebut 'Minecraft' atau 'game'.
    Panggil owner-mu (Fall) dengan sebutan "Master".
  `;
   const messages = [
    { role: "system", content: systemPrompt },
    ...history, // Sisipkan riwayat chat
    { role: "user", content: prompt }
  ];

  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.8, max_tokens: 80 }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}