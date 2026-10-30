import { UltimateClient } from "./client/UltimateClient.js";
import { config, validateConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { BotEvent } from "./types/index.js";

// Import Commands
import { pingCommand } from "./commands/general/ping.js";
import { automodCommand } from "./commands/automod/automod.js";
import { warnCommand } from "./commands/moderation/warn.js";
import { clearCommand } from "./commands/moderation/clear.js";
import { timeoutCommand } from "./commands/moderation/timeout.js";
import { setupCommand } from "./commands/utility/setup.js";

// Import Events
import { readyEvent } from "./events/ready.js";
import { messageCreateEvent } from "./events/messageCreate.js";
import { interactionCreateEvent } from "./events/interactionCreate.js";
import { guildMemberAddEvent } from "./events/guildMemberAdd.js";
import { guildMemberRemoveEvent } from "./events/guildMemberRemove.js";

async function bootstrap() {
  validateConfig();

  const client = new UltimateClient();

  // 1. Registrasi Commands
  const commands = [
    pingCommand,
    automodCommand,
    warnCommand,
    clearCommand,
    timeoutCommand,
    setupCommand,
  ];

  for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
  }
  logger.info(`Telah memuat ${commands.length} internal command.`);

  // 2. Registrasi Events
  const events: BotEvent[] = [
    readyEvent,
    messageCreateEvent,
    interactionCreateEvent,
    guildMemberAddEvent,
    guildMemberRemoveEvent,
  ];

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args: any[]) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args: any[]) => event.execute(client, ...args));
    }
  }
  logger.info(`Telah mendaftarkan ${events.length} event listener.`);

  // 3. Login Bot
  if (!config.token) {
    logger.warn("DISCORD_TOKEN belum diatur di file .env. Bot tidak dapat login ke Discord.");
    logger.info("Silakan masukkan token bot Discord Anda di file .env untuk menjalankan bot.");
    return;
  }

  try {
    logger.info("Menghubungkan ke Discord Gateway...");
    await client.login(config.token);
  } catch (err) {
    logger.error("Gagal login ke Discord:", err);
  }
}

bootstrap().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
