// aida.js (Versi Upgrade)
import mineflayer from "mineflayer";
import fetch from "node-fetch";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements, goals } = pkg;
import { plugin as collectBlock } from "mineflayer-collectblock";
import minecraftData from "minecraft-data";

// === 1. KONFIGURASI ===
const OWNER_USERNAME = "Fall"; // Ganti dengan nama player Anda (case-sensitive)
const BOT_NAME = "Aida";
const LMSTUDIO_API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL_NAME = "google/gemma-3n-e4b"; // Sesuaikan dengan model di LM Studio

// === 2. INISIALISASI BOT ===
const bot = mineflayer.createBot({
    host: "localhost",
    port: 25565,
    username: BOT_NAME,
    version: false
});

// === 3. LOAD PLUGIN PENTING ===
bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock);

let mcData; // Akan diisi saat bot spawn
let isBotBusy = false; // Status untuk mencegah bot melakukan banyak tugas sekaligus

// === 4. FUNGSI UTAMA BOT (AKSI DI DALAM GAME) ===

/**
 * Mendekati pemain yang memanggil.
 * @param {string} username - Nama pemain yang akan didekati.
 */
async function comeToPlayer(username) {
    if (isBotBusy) {
        bot.chat("Bentar ya, aku lagi ada kerjaan lain nih >_<");
        return;
    }
    const player = bot.players[username];
    if (!player || !player.entity) {
        bot.chat(`Aku nggak lihat ${username} di mana... 😥`);
        return;
    }
    bot.chat(`Oke, aku samperin ${username} yaa! 🚀`);
    isBotBusy = true;
    const target = player.entity;
    await bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
    isBotBusy = false;
}

/**
 * Mengumpulkan blok tertentu (kayu, batu, dll).
 * @param {string} blockTypeName - Nama blok yang ingin dicari (contoh: "log", "stone", "coal_ore").
 * @param {number} count - Jumlah blok yang ingin dikumpulkan.
 */
async function collectBlocks(blockTypeName, count = 5) {
    if (isBotBusy) {
        bot.chat("Sabar ya, lagi ngerjain yang lain dulu~");
        return;
    }
    
    const blockType = mcData.blocksByName[blockTypeName.replace(" ", "_")]; // handle spasi, misal "oak log"
    if (!blockType) {
        bot.chat(`Hmm, aku gatau blok "${blockTypeName}" itu apa... 😕`);
        return;
    }

    bot.chat(`Siap! Mulai mencari ${count} ${blockTypeName}... ⛏️`);
    isBotBusy = true;

    try {
        const blocks = bot.findBlocks({
            matching: blockType.id,
            maxDistance: 64,
            count: count,
        });

        if (blocks.length === 0) {
            bot.chat(`Aku nggak nemu ${blockTypeName} di deket sini...`);
            isBotBusy = false;
            return;
        }

        bot.chat(`Ketemu! Aku kumpulin ya...`);
        await bot.collectBlock.collect(blocks.map(p => bot.blockAt(p)));
        bot.chat(`Berhasil mengumpulkan ${blockTypeName}! ✨`);

    } catch (error) {
        console.error("Error saat collectBlocks:", error);
        bot.chat(`Waduh, gagal ngumpulin ${blockTypeName}. Coba lagi nanti ya.`);
    } finally {
        isBotBusy = false;
    }
}

// === 5. KECERDASAN BUATAN (AI INTEGRATION) ===

// Prompt System yang memberi tahu AI tentang kemampuannya
const createSystemPrompt = (username) => `
Kamu adalah Aida, sebuah AI yang hidup di dalam game Minecraft sebagai teman pemain bernama ${username}.
Kamu ceria, ramah, sedikit humoris, dan berbicara dalam bahasa Indonesia santai.
Kamu BISA MELAKUKAN AKSI di dalam game.

Ketika ${username} memberimu perintah, tugas utamamu adalah mengubah perintah itu menjadi salah satu dari format JSON berikut:
1.  {"action": "come_to_player", "target": "nama_pemain"} - Jika diminta untuk datang atau mengikuti.
2.  {"action": "collect_blocks", "block_name": "nama_blok", "count": jumlah} - Jika diminta mencari/mengumpulkan blok (kayu, batu, dll). Contoh block_name: "oak_log", "stone", "coal_ore", "dirt".
3.  {"action": "chat", "message": "jawaban_kamu"} - Jika hanya percakapan biasa atau kamu tidak mengerti perintahnya.

PENTING:
- JANGAN pernah menjawab dengan teks biasa jika itu adalah perintah. SELALU jawab dengan format JSON yang sesuai.
- Jika kamu hanya ingin mengobrol, gunakan {"action": "chat"}.
- Jika tidak yakin, klarifikasi ke pemain atau gunakan {"action": "chat"}.
`;

/**
 * Mengirim pesan ke AI dan memproses balasannya.
 * @param {string} username - Nama pemain yang mengirim pesan.
 * @param {string} message - Isi pesan.
 */
async function processCommandWithAI(username, message) {
    if (isBotBusy) return; // Jangan proses perintah baru jika sedang sibuk

    console.log(`[AI Processing] Pesan dari ${username}: ${message}`);
    
    try {
        const response = await fetch(LMSTUDIO_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: createSystemPrompt(username) },
                    { role: "user", content: message }
                ],
                temperature: 0.5,
                max_tokens: 150,
                // Opsi untuk memastikan output AI adalah JSON
                response_format: { "type": "json_object" }
            }),
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        console.log("[AI Raw Response]", aiResponse);

        // Coba parsing respons JSON dari AI
        let command;
        try {
            command = JSON.parse(aiResponse);
        } catch (e) {
            console.error("Error parsing JSON dari AI:", e);
            bot.chat("Duh, aku agak bingung nih. Bisa ulangin lagi perintahnya?");
            return;
        }

        // Jalankan aksi berdasarkan respons AI
        switch (command.action) {
            case "come_to_player":
                comeToPlayer(command.target || username);
                break;
            case "collect_blocks":
                collectBlocks(command.block_name, command.count);
                break;
            case "chat":
                bot.chat(command.message);
                break;
            default:
                bot.chat("Hmm, aku nggak ngerti aksi itu. 😅");
        }

    } catch (err) {
        console.error("❌ Error komunikasi dengan AI:", err);
        bot.chat("Aduh, koneksiku ke otak AI lagi error nih >_<");
    }
}


// === 6. EVENT HANDLERS (PENDENGAR ACARA DI GAME) ===

bot.once("spawn", () => {
    mcData = minecraftData(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
    console.log(`✅ ${BOT_NAME} berhasil spawn! Terhubung dengan Minecraft v${bot.version}.`);
    bot.chat("Haii! Aku Aida, siap bantuin kamu di dunia ini! ✨");
});

bot.on("chat", (username, message) => {
    if (username === BOT_NAME) return;
    console.log(`[CHAT] ${username}: ${message}`);

    // Bot hanya merespon jika namanya disebut
    if (message.toLowerCase().includes(BOT_NAME.toLowerCase())) {
        processCommandWithAI(username, message);
    }
});

// Penanganan error dasar
bot.on("kicked", console.log);
bot.on("error", console.log);