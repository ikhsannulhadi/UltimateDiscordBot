import { Message } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { AutoModService } from "../services/automod.service.js";
import { LevelingService } from "../services/leveling.service.js";
import { db } from "../database/index.js";

export const messageCreateEvent: BotEvent<"messageCreate"> = {
  name: "messageCreate",
  async execute(client: UltimateClient, message: Message) {
    if (message.author.bot || !message.guild) return;

    // 1. Eksekusi AutoMod Engine
    const violated = await AutoModService.inspectMessage(client, message);
    if (violated) return; // Jika melanggar, pesan sudah dihapus, berhenti di sini

    // 2. Berikan XP jika pesan valid (Leveling System)
    await LevelingService.handleMessageXp(client, message);

    // 3. Cek Auto-Responder / Custom Triggers
    try {
      const autoResponders = await db.autoResponder.findMany({
        where: { guildId: message.guild.id },
      });

      const userText = message.content.toLowerCase().trim();
      for (const item of autoResponders) {
        const trigger = item.trigger.toLowerCase().trim();
        const matches = item.matchExact
          ? userText === trigger
          : userText.includes(trigger);

        if (matches) {
          await message.reply(item.response);
          break;
        }
      }
    } catch {
      // Ignore responder errors
    }
  },
};
