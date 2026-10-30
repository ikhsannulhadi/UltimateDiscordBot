import { ActivityType, REST, Routes } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export const readyEvent: BotEvent<"ready"> = {
  name: "ready",
  once: true,
  async execute(client: UltimateClient) {
    logger.success(`🤖 Bot berhasil online sebagai: ${client.user?.tag}`);

    // Set activity
    client.user?.setActivity({
      name: "🛡️ Melindungi Server | /help",
      type: ActivityType.Custom,
    });

    // Deploy Slash Commands ke Discord API
    if (config.token && config.clientId) {
      const rest = new REST({ version: "10" }).setToken(config.token);
      const commandData = client.commands.map((cmd) => cmd.data.toJSON());

      try {
        logger.info(`Memuat ${commandData.length} Slash Command(s) ke Discord API...`);
        await rest.put(Routes.applicationCommands(config.clientId), {
          body: commandData,
        });
        logger.success(`Berhasil mendaftarkan ${commandData.length} Slash Command(s)!`);
      } catch (error) {
        logger.error("Gagal mendaftarkan slash command ke Discord API:", error);
      }
    } else {
      logger.warn("CLIENT_ID atau DISCORD_TOKEN belum disetel di .env; skip pendaftaran slash command.");
    }
  },
};
