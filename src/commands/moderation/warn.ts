import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";

export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Kelola peringatan (warning) member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Beri peringatan manual ke member")
        .addUserOption((opt) =>
          opt
            .setName("target")
            .setDescription("Pilih member yang ingin diberi warning")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Alasan peringatan")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("Lihat riwayat peringatan member")
        .addUserOption((opt) =>
          opt
            .setName("target")
            .setDescription("Pilih member yang ingin dicek")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Hapus seluruh catatan peringatan member")
        .addUserOption((opt) =>
          opt
            .setName("target")
            .setDescription("Pilih member yang ingin di-reset warning-nya")
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    if (!interaction.guild) return;
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("target", true);

    // 1. SUBCOMMAND: ADD
    if (sub === "add") {
      const reason = interaction.options.getString("reason", true);

      await db.warning.create({
        data: {
          guildId,
          userId: targetUser.id,
          moderatorId: interaction.user.id,
          reason,
        },
      });

      const total = await db.warning.count({
        where: { guildId, userId: targetUser.id },
      });

      const embed = createEmbed({
        title: "⚠️ Peringatan Diberikan",
        description: `Member ${targetUser} telah diberikan peringatan oleh ${interaction.user}.\n\n📌 **Alasan:** ${reason}\n📊 **Total Warning:** ${total}`,
        color: Colors.Warning,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 2. SUBCOMMAND: LIST
    if (sub === "list") {
      const warnings = await db.warning.findMany({
        where: { guildId, userId: targetUser.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      if (warnings.length === 0) {
        const embed = createEmbed({
          title: `Catatan Warning: ${targetUser.tag}`,
          description: `Member ini bersih dan belum memiliki catatan peringatan! 🎉`,
          color: Colors.Success,
        });
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const listText = warnings
        .map(
          (w, idx) =>
            `**${idx + 1}.** [${w.createdAt.toLocaleDateString()}] <@${w.moderatorId}>: *${w.reason}*`
        )
        .join("\n");

      const embed = createEmbed({
        title: `Catatan Warning: ${targetUser.tag}`,
        description: `Total: **${warnings.length}** warning tercatat.\n\n${listText}`,
        color: Colors.Warning,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 3. SUBCOMMAND: CLEAR
    if (sub === "clear") {
      const deleted = await db.warning.deleteMany({
        where: { guildId, userId: targetUser.id },
      });

      const embed = createEmbed({
        title: "🧹 Warning Direset",
        description: `Berhasil menghapus **${deleted.count}** catatan peringatan untuk ${targetUser}.`,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
