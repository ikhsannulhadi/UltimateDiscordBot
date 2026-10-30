import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Lihat papan peringkat 10 member teraktif di server"),

  async execute(interaction) {
    if (!interaction.guild) return;

    const topUsers = await db.userLevel.findMany({
      where: { guildId: interaction.guild.id },
      orderBy: { xp: "desc" },
      take: 10,
    });

    if (topUsers.length === 0) {
      await interaction.reply({
        content: "Belum ada data aktivitas di server ini.",
        ephemeral: true,
      });
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const rows = topUsers.map((u, idx) => {
      const medal = medals[idx] || `\`#${idx + 1}\``;
      return `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp.toLocaleString()} XP\`)`;
    });

    const embed = createEmbed({
      title: `🏆 Papan Peringkat Teraktif: ${interaction.guild.name}`,
      description: rows.join("\n\n"),
      color: Colors.Warning,
    }).setFooter({
      text: "Terus mengobrol untuk menaikkan peringkatmu!",
      iconURL: interaction.guild.iconURL() || undefined,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
