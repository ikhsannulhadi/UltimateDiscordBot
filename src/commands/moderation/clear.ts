import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";

export const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Hapus banyak pesan sekaligus dari channel ini")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Jumlah pesan yang ingin dihapus (1 - 100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({
        content: "Perintah ini hanya bisa digunakan di channel teks.",
        ephemeral: true,
      });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);
    const channel = interaction.channel as TextChannel;

    try {
      const deleted = await channel.bulkDelete(amount, true);

      const embed = createEmbed({
        title: "🧹 Pesan Dibersihkan",
        description: `Berhasil menghapus **${deleted.size}** pesan dari channel ini.`,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch {
      await interaction.reply({
        content: "Gagal menghapus pesan. Pesan yang berumur lebih dari 14 hari tidak dapat dihapus massal oleh Discord.",
        ephemeral: true,
      });
    }
  },
};
