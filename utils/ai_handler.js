// utils/ai_handler.js (Versi dengan Klasifikasi Lebih Baik & Anti-Crash)
import fetch from "node-fetch";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "google/gemma-3n-e4b";

/**
 * Mengklasifikasikan perintah user menjadi format JSON.
 * @param {string} message - Pesan dari user.
 * @param {Array<object>} history - Riwayat percakapan.
 * @returns {Promise<object>} - Objek perintah.
 */
export async function commandClassifierAI(message, history = []) {
  // [PERBAIKAN] Prompt dibuat lebih detail dengan banyak contoh
  const systemPrompt = `
    Tugas utamamu adalah mengklasifikasikan pesan user menjadi sebuah aksi dalam format JSON.
    Gunakan riwayat chat untuk konteks. Fokus HANYA pada pesan user terakhir.
    Pilihan "action": "follow_player", "stop_moving", "report_status", "list_inventory", "collect_blocks", "chat".

    CONTOH PENTING:
    - "ikut aku", "sini dong", "kemari" -> {"action": "follow_player"}
    - "diam di situ", "berhenti", "tunggu" -> {"action": "stop_moving"}
    - "gimana kondisi kamu?", "cek status" -> {"action": "report_status"}
    - "apa saja itemu?", "lihatin barangmu", "kau punya apa saja" -> {"action": "list_inventory"}
    - "tolong carikan 15 batu", "ambil kayu" -> {"action": "collect_blocks", "item": "batu", "count": 15}
    - "halo", "makasih ya", "oke" -> {"action": "chat"}

    Jika tidak ada perintah jelas, anggap itu "chat". Balas HANYA dengan JSON.
  `;
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message }
  ];

  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.1, max_tokens: 60 }),
  });
  const data = await response.json();

  // [PERBAIKAN] Jaring pengaman untuk mencegah crash jika server AI error
  if (!data.choices || data.choices.length === 0) {
    console.error("❌ AI Classifier menerima respons tidak valid dari API:", data);
    return { action: "chat" }; // Kembalikan aksi 'chat' sebagai default yang aman
  }

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
    ...history,
    { role: "user", content: prompt }
  ];

  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.8, max_tokens: 80 }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}