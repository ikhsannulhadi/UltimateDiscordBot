import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";
import { LevelingService } from "../../services/leveling.service.js";

export const rankCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Lihat profil level, total XP, dan peringkat kamu atau member lain")
    .addUserOption((opt) =>
      opt
        .setName("target")
        .setDescription("Member yang ingin dicek rank-nya")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser("target") || interaction.user;

    const userLevel = await db.userLevel.findUnique({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id,
        },
      },
    });

    if (!userLevel) {
      await interaction.reply({
        content: `${targetUser} belum memiliki catatan XP di server ini. Mulailah mengobrol di channel untuk mendapatkan XP!`,
        ephemeral: true,
      });
      return;
    }

    // Hitung posisi ranking di server
    const higherUsers = await db.userLevel.count({
      where: {
        guildId: interaction.guild.id,
        xp: { gt: userLevel.xp },
      },
    });
    const rankPosition = higherUsers + 1;

    const nextLevelXp = LevelingService.xpForLevel(userLevel.level);
    const prevLevelXp =
      userLevel.level > 1
        ? LevelingService.xpForLevel(userLevel.level - 1)
        : 0;

    const progressInCurrentLevel = userLevel.xp - prevLevelXp;
    const neededForNextLevel = nextLevelXp - prevLevelXp;
    const percentage = Math.min(
      100,
      Math.max(0, Math.round((progressInCurrentLevel / neededForNextLevel) * 100))
    );

    // Bikin progress bar visual: [▓▓▓▓░░░░░░]
    const totalBars = 12;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    const progressBar = "▓".repeat(filledBars) + "░".repeat(emptyBars);

    const embed = createEmbed({
      title: `📊 Kartu Peringkat: ${targetUser.username}`,
      description:
        `🏆 **Peringkat Server:** #${rankPosition}\n` +
        `⭐ **Level Saat Ini:** Level ${userLevel.level}\n` +
        `✨ **Total XP:** \`${userLevel.xp.toLocaleString()} XP\`\n\n` +
        `**Progres ke Level ${userLevel.level + 1}:**\n` +
        `\`[${progressBar}]\` **${percentage}%**\n` +
        `*(${progressInCurrentLevel.toLocaleString()} / ${neededForNextLevel.toLocaleString()} XP)*`,
      color: Colors.Primary,
    }).setThumbnail(targetUser.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  },
};
