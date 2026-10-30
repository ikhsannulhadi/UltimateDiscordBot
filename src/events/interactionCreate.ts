import { Interaction } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { logger } from "../utils/logger.js";
import { Colors, createEmbed } from "../utils/embed.js";

export const interactionCreateEvent: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(client: UltimateClient, interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`Command ${interaction.commandName} tidak ditemukan.`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Error saat menjalankan /${interaction.commandName}:`, error);

        const errorEmbed = createEmbed({
          title: "❌ Terjadi Kesalahan",
          description: "Terjadi error internal saat menjalankan perintah ini.",
          color: Colors.Danger,
        });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
    }
  },
};
