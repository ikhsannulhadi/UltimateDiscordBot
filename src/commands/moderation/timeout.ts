import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";

export const timeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Mute / timeout member untuk jangka waktu tertentu")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("target")
        .setDescription("Pilih member yang ingin di-timeout")
        .setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("duration")
        .setDescription("Durasi timeout dalam menit (1 - 10080 menit / 7 hari)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10080)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Alasan timeout")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser("target", true);
    const durationMins = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason") || "Tidak ada alasan spesifik";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.reply({
        content: "Member tidak ditemukan di server ini.",
        ephemeral: true,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content: "Saya tidak dapat meng-timeout member ini (posisi role mereka lebih tinggi atau setara dengan bot).",
        ephemeral: true,
      });
      return;
    }

    const durationMs = durationMins * 60 * 1000;
    await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

    const embed = createEmbed({
      title: "⏳ Member Di-Timeout",
      description: `Member ${member} telah berhasil di-timeout.\n\n⏱️ **Durasi:** ${durationMins} menit\n📌 **Alasan:** ${reason}\n👮 **Moderator:** ${interaction.user}`,
      color: Colors.Warning,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
