// features/skill_library.js
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import minecraftData from 'minecraft-data';

// Pustaka ini berisi semua fungsi dasar yang bisa dipanggil oleh AI.
// Setiap fungsi harus mengembalikan string sebagai respons untuk di-chat.

export const skills = {
    /** Mendekati pemain yang ditentukan. */
    goToPlayer: (bot, username) => {
        const player = bot.players[username];
        if (!player || !player.entity) return `Aku tidak melihat ${username}, Master.`;
        const goal = new goals.GoalFollow(player.entity, 1);
        bot.pathfinder.setGoal(goal, true);
        return `Siap, aku akan mengikuti Master ${username}.`;
    },

    /** Berhenti bergerak. */
    stop: (bot) => {
        bot.pathfinder.stop();
        return `Baik, aku berhenti di sini.`;
    },

    /** Melaporkan status (darah, lapar, level). */
    reportStatus: (bot) => {
        const health = Math.ceil(bot.health);
        const food = Math.ceil(bot.food);
        const level = bot.experience.level;
        return `Saat ini darahku ${health}/20, lapar ${food}/20, dan levelku ${level}, Master.`;
    },

    /** Mendaftar semua item di inventaris. */
    listInventory: (bot) => {
        const items = bot.inventory.items();
        if (items.length === 0) return "Tasku kosong, Master.";
        const summary = items.map(item => `${item.name} x${item.count}`).join(', ');
        return `Aku punya: ${summary}.`;
    },
    
    /** Menambang sejumlah blok tertentu. */
    mineBlock: async (bot, itemName, count = 1) => {
        bot.chat(`Baik, aku akan coba cari dan tambang ${count} ${itemName}.`);
        const mcData = minecraftData(bot.version);
        const blockType = mcData.blocksByName[itemName];
        if (!blockType) return `Aku tidak tahu blok bernama '${itemName}'.`;

        try {
            await bot.collectBlock.collect(blockType.id, { count: count });
            return `Tugas selesai, berhasil mengumpulkan ${count} ${itemName}.`;
        } catch (err) {
            console.error(err);
            return `Maaf Master, aku tidak menemukan ${itemName} di sekitar sini atau jalannya terhalang.`;
        }
    },

    /** Membuat item. */
    craftItem: async (bot, itemName, count = 1) => {
        const mcData = minecraftData(bot.version);
        const item = mcData.recipesFor(mcData.itemsByName[itemName].id, null, 1, true)[0];
        if (!item) return `Aku tidak tahu cara membuat ${itemName}.`;
        
        try {
            await bot.craft(item, count, null);
            return `Berhasil membuat ${count} ${itemName}.`;
        } catch (err) {
            console.error(err);
            return `Gagal membuat ${itemName}, mungkin bahannya kurang.`;
        }
    },
    
    /** Menyerang monster atau hewan terdekat. */
    attackNearestMob: (bot) => {
        const mob = bot.nearestEntity(entity => entity.type === 'hostile');
        if (!mob) return "Tidak ada monster di dekat sini.";
        bot.attack(mob);
        return `Menyerang ${mob.displayName}!`;
    },

    /** Memberikan item kepada pemain. */
    giveToPlayer: async (bot, itemName, username, count = 1) => {
        const player = bot.players[username];
        if (!player) return `Aku tidak melihat ${username}.`;
        
        const item = bot.inventory.items().find(i => i.name.includes(itemName));
        if (!item) return `Maaf, aku tidak punya ${itemName}.`;
        
        const amountToGive = Math.min(count, item.count);

        try {
            await bot.toss(item.type, null, amountToGive);
            return `Ini ${amountToGive} ${itemName} untukmu, Master ${username}.`;
        } catch (err) {
            console.error(err);
            return `Gagal memberikan ${itemName}.`;
        }
    },
};

