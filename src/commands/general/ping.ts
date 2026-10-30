import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Cek latensi bot dan koneksi database SQLite"),

  async execute(interaction, client) {
    const startDb = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startDb;

    const wsLatency = client.ws.ping;

    const embed = createEmbed({
      title: "🏓 Pong!",
      description: `📡 **Bot Latency:** \`${wsLatency}ms\`\n💾 **SQLite Latency:** \`${dbLatency}ms\``,
      color: Colors.Success,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
