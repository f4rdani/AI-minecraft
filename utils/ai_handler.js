// utils/ai_handler.js (Modul Otak AI)
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
  const systemPrompt = `
    Anda adalah AI yang sangat teliti. Tugas Anda adalah mengklasifikasikan pesan dari 'user' menjadi SATU aksi dalam format JSON.
    Gunakan riwayat chat untuk konteks. Fokus HANYA pada pesan user terakhir.

    Pilihan aksi dan kata kuncinya:
    - "follow_player": Jika user meminta untuk diikuti, datang, kemari, sini.
    - "stop_moving": Jika user meminta untuk berhenti, diam, tunggu.
    - "list_inventory": Jika user bertanya tentang item, barang, atau isi tas. INI BUKAN PERINTAH MENCARI BARANG.
    - "collect_blocks": HANYA JIKA user secara eksplisit meminta untuk MENCARI, MENGAMBIL, atau MENAMBANG blok. Ekstrak nama 'item' dan 'count'.
    - "report_status": Jika user bertanya soal kondisi, darah, lapar, atau status.
    - "chat": Untuk semua percakapan lain, sapaan, atau jika Anda tidak yakin.

    CONTOH:
    - User: "ai sini dong" -> {"action": "follow_player"}
    - User: "apa saja barang di tasmu?" -> {"action": "list_inventory"}
    - User: "sudah, berhenti dulu" -> {"action": "stop_moving"}
    - User: "tolong carikan 15 batu" -> {"action": "collect_blocks", "item": "batu", "count": 15}

    PERINGATAN: Balasanmu HARUS dan HANYA BOLEH berupa SATU blok JSON. JANGAN tambahkan teks, penjelasan, atau JSON lain.
  `;
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message }
  ];

  const response = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.0, max_tokens: 60 }),
  });
  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    console.error("❌ AI Classifier menerima respons tidak valid dari API:", data);
    return { action: "chat" };
  }

  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*?\}/); 
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
  if (!data.choices || data.choices.length === 0) {
      console.error("❌ AI Generator menerima respons tidak valid dari API:", data);
      return "Maaf, Master. Aku sedikit bingung.";
  }
  return data.choices[0].message.content.trim();
}

