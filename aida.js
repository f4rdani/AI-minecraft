// aida.js
import mineflayer from "mineflayer";
import fetch from "node-fetch";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements, goals } = pkg;
import collectBlock from "mineflayer-collectblock";
import minecraftData from "minecraft-data";

// === CONFIG ===
const OWNER = "Fall"; // nama player kamu (case-sensitive)
const AIDA_NAME = "Aida"; // nama bot
const LMSTUDIO_URL = "http://localhost:1234/v1/chat/completions";
const CHAT_INTERVAL_MINUTES = 5; // buka obrolan tiap 5 menit

// === CREATE BOT ===
const bot = mineflayer.createBot({
  host: "localhost",
  port: 25565,
  username: AIDA_NAME,
  version: false
});

// load plugins (collectBlock plugin exposes .plugin)
bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock.plugin);

// mcData harus diset setelah spawn (karena versi diketahui setelah spawn)
let mcData = null;

// === HELPERS ===
async function askAI(message) {
  try {
    const response = await fetch(LMSTUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b",
        messages: [
          { role: "system", content: "Kamu adalah Aida, teman Minecraft dari Fall. Kamu humoris, asik, ngobrol santai, seperti orang asli. Gunakan bahasa Indonesia, kadang selip emoticon kawaii atau lucu. Jika diminta melakukan tugas game (contoh: mining, farm, follow), jawab singkat kemudian lakukan tugas." },
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 250,
        stream: false
      }),
      // timeout fallback: node-fetch v3 tidak punya native timeout, tapi server lokal biasanya cepat
    });

    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      return "Hehe, aku bingung mau jawab apa nih 😅";
    }
  } catch (err) {
    console.error("❌ Error AI:", err);
    return "Ehh aku nge-lag >_<";
  }
}

// Utility: simple lowercase includes
function includesCMD(msg, keyword) {
  if (!msg) return false;
  return msg.toLowerCase().includes(keyword.toLowerCase());
}

// Simple safe delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === ON SPAWN ===
bot.once("spawn", () => {
  mcData = minecraftData(bot.version);
  const mcMovements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(mcMovements);

  bot.chat("Haiii! Aku Aida, teman barumu! Siap nemenin Fall main bareng~ ✨");
  console.log("Aida spawned. mcData loaded for version:", bot.version);
});

// === CHAT HANDLER ===
bot.on("chat", async (username, message) => {
  if (!message) return;
  if (username === bot.username) return;

  console.log(`[CHAT] ${username}: ${message}`);

  // Jika ada kata "aida" panggil AI untuk balasan (lebih natural)
  if (includesCMD(message, "aida")) {
    const reply = await askAI(`${username} berkata: ${message}`);
    bot.chat(reply);
    return;
  }

  // Commands khusus dari OWNER (Fall)
  if (username === OWNER) {
    // lebih fleksibel: cek include kata
    if (includesCMD(message, "samperin") || includesCMD(message, "sampеrin") || includesCMD(message, "sini")) {
      followOwner();
      return;
    }
    if (includesCMD(message, "mining") || includesCMD(message, "mine")) {
      startMining();
      return;
    }
    if (includesCMD(message, "farm")) {
      startFarming();
      return;
    }
    if (includesCMD(message, "bangun") || includesCMD(message, "build") || includesCMD(message, "rumah")) {
      buildHouse();
      return;
    }
    if (includesCMD(message, "status") || includesCMD(message, "hp") || includesCMD(message, "lapar")) {
      sayStatus();
      return;
    }
  }

  // Kalau chat orang lain: sapaan umum
  if (includesCMD(message, "halo") || includesCMD(message, "hi") || includesCMD(message, "hey")) {
    bot.chat(`Halo juga ${username}! 👋`);
  }
});

// === FOLLOW OWNER ===
function followOwner() {
  const player = bot.players[OWNER];
  if (!player || !player.entity) {
    bot.chat("Fall kemana sih? Aku nggak lihat 😅");
    return;
  }
  const target = player.entity;
  bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
  bot.chat("Otw samperin kamu, tunggu ya 🚀");
}

// === MINING (sederhana): cari block log/stone/ore lalu dig ===
let miningFlag = false;
async function startMining() {
  if (!mcData) { bot.chat("Belum siap cari block, tunggu sebentar."); return; }
  if (miningFlag) { bot.chat("Lagian mining dulu nih, sabar ya~"); return; }
  miningFlag = true;

  bot.chat("Baik! Aku mulai mining dulu yaa ⛏️");

  try {
    // Build list of block ids to target (log, stone, ores)
    const wanted = mcData.blocksArray
      .filter(b => b && b.name && (b.name.includes("log") || b.name.includes("stone") || b.name.includes("ore")))
      .map(b => b.id);

    // find several blocks
    const positions = bot.findBlocks({
      matching: wanted,
      maxDistance: 48,
      count: 8
    });

    if (!positions || positions.length === 0) {
      bot.chat("Ga ada block mining di dekat sini 😢");
      miningFlag = false;
      return;
    }

    // loop through found block positions (try dig one by one)
    for (const pos of positions) {
      if (bot.health <= 2) {
        bot.chat("Wah aku sekarat, berhenti dulu ya! 😵");
        break;
      }
      const block = bot.blockAt(pos);
      if (!block) continue;

      // move near block
      try {
        await bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
      } catch (e) {
        // ignore movement errors
      }

      // dig (non-forced). if tool needed, will dig slower.
      try {
        await bot.dig(block);
        bot.chat(`Aku gali ${block.name} ✨`);
        await wait(500); // kecil delay
      } catch (err) {
        console.log("Gagal ngali block:", err?.message || err);
      }
    }

    bot.chat("Mining kelar! Semoga dapat yang bagus~ 💎");
  } catch (e) {
    console.error("Error startMining:", e);
    bot.chat("Maaf, aku gagal mining karena error.");
  } finally {
    miningFlag = false;
  }
}

// === FARMING (sederhana): cari wheat/carrot/potato dan harvest (dig) ===
let farmingFlag = false;
async function startFarming() {
  if (!mcData) { bot.chat("Belum siap farming, tunggu sebentar."); return; }
  if (farmingFlag) { bot.chat("Lagi farming dulu, tunggu bentar ya~"); return; }
  farmingFlag = true;

  bot.chat("Oke, aku coba garap ladang dulu ya 🌱");

  try {
    const cropNames = ["wheat", "carrots", "potatoes", "beetroots"];
    const cropIds = mcData.blocksArray
      .filter(b => b && b.name && cropNames.some(n => b.name.includes(n)))
      .map(b => b.id);

    const positions = bot.findBlocks({
      matching: cropIds,
      maxDistance: 48,
      count: 12
    });

    if (!positions || positions.length === 0) {
      bot.chat("Kayaknya belum ada tanaman siap panen di dekat sini 😅");
      farmingFlag = false;
      return;
    }

    for (const pos of positions) {
      const block = bot.blockAt(pos);
      if (!block) continue;

      try {
        await bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
      } catch (e) {}

      try {
        await bot.dig(block);
        bot.chat(`Panen ${block.name} berhasil ✨`);
        await wait(400);
      } catch (err) {
        console.log("Gagal panen:", err?.message || err);
      }
    }

    bot.chat("Selesai panen! Semoga dapat banyak hasil 🌾");
  } catch (e) {
    console.error("Error startFarming:", e);
    bot.chat("Maaf, aku gagal farming karena error.");
  } finally {
    farmingFlag = false;
  }
}

// === BUILD HOUSE (sederhana): bikin lantai kecil 5x5 dari dirt jika material ada ===
let buildingFlag = false;
async function buildHouse() {
  if (!mcData) { bot.chat("Belum siap build, tunggu sebentar."); return; }
  if (buildingFlag) { bot.chat("Sedang bangun, sabar ya~"); return; }
  buildingFlag = true;

  bot.chat("Aku coba bikin rumah kotak sederhana ya 🏠 (jangan bully ya haha)");

  try {
    // cek bahan (dirt atau cobblestone)
    const dirtItem = bot.inventory.items().find(i => /dirt|cobblestone|stone/.test(i.name));
    if (!dirtItem) {
      bot.chat("Eh aku ga punya bahan buat bangun 😭");
      buildingFlag = false;
      return;
    }

    // equip bahan
    try {
      await bot.equip(dirtItem, "hand");
    } catch (e) {
      // lanjut saja jika gagal equip
    }

    // tentukan base posisi depan bot
    const baseX = Math.floor(bot.entity.position.x + 1);
    const baseY = Math.floor(bot.entity.position.y);
    const baseZ = Math.floor(bot.entity.position.z + 1);

    // place simple floor 5x5 (letakkan di atas tanah)
    const size = 5;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const placePos = bot.blockAt({ x: baseX + x, y: baseY - 1, z: baseZ + z });
        if (!placePos) continue;

        try {
          // place on top of the block at position (so set reference block to that block)
          await bot.placeBlock(placePos, { x: 0, y: 1, z: 0 });
          await wait(120);
        } catch (err) {
          // ignore placement error
        }
      }
    }

    bot.chat("Rumah mini selesai! Simple tapi penuh cinta 💖");
  } catch (e) {
    console.error("Error buildHouse:", e);
    bot.chat("Gagal bangun rumah, maaf ya :(");
  } finally {
    buildingFlag = false;
  }
}

// === STATUS ===
function sayStatus() {
  const hp = Math.round(bot.health ?? 0);
  const food = Math.round(bot.food ?? 0);
  const oxygen = Math.round(bot.oxygenLevel ?? 0);
  bot.chat(`HP-ku: ${hp} ❤, Lapar: ${food}/20 🍖, Oksigen: ${oxygen}`);
}

// === AUTO CHAT tiap 5 menit (random ringan) ===
setInterval(async () => {
  try {
    // hanya ngobrol kalau owner ada di world (mengurangi spam)
    if (!bot.players[OWNER] || !bot.players[OWNER].entity) return;
    const prompt = `Buka topik ngobrol random yang asik untuk Fall. Mulai pembicaraan singkat dan ramah. (Bahasa Indonesia)`;
    const reply = await askAI(prompt);
    if (reply) bot.chat(reply);
  } catch (e) {
    console.log("Auto chat error:", e);
  }
}, 1000 * 60 * CHAT_INTERVAL_MINUTES);

// === Makan otomatis saat lapar (event health) ===
bot.on("health", async () => {
  try {
    if (bot.food < 12) {
      const foodItem = bot.inventory.items().find(item => /(bread|apple|cooked|steak|pork|cooked_beef|cooked_pork)/i.test(item.name));
      if (foodItem) {
        try {
          await bot.equip(foodItem, "hand");
        } catch (e) {}
        // consume using callback-style if promise not available
        bot.consume((err) => {
          if (!err) bot.chat("Aku lapar... nyam nyam 😋");
        });
      } else {
        bot.chat("Aku lapar tapi ga ada makanan di inventori 😢");
      }
    }
  } catch (e) {
    console.log("Health handler error:", e);
  }
});

// === EFFECT HANDLER ===
bot.on("entityEffect", (entity, effect) => {
  if (entity === bot.entity) {
    // effect.displayName might be undefined in some versions; fallback to effect.id
    const name = (effect && effect.displayName) ? effect.displayName : `effect_${effect ? effect.id : "?"}`;
    bot.chat(`Uh oh, aku kena ${name} 😵`);
  }
});

// === ERROR HANDLING ===
bot.on("kicked", (reason) => {
  console.log("Kicked:", reason);
});
bot.on("error", (err) => {
  console.log("Error:", err);
});
