import { Interaction } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { logger } from "../utils/logger.js";
import { Colors, createEmbed } from "../utils/embed.js";

export const interactionCreateEvent: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(client: UltimateClient, interaction: Interaction) {
    // 1. CHAT INPUT COMMANDS
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
      return;
    }

    // 2. BUTTON INTERACTIONS (VERIFIKASI & KOMPONEN LAINNYA)
    if (interaction.isButton()) {
      if (interaction.customId === "btn_verify_member") {
        if (!interaction.guild || !interaction.member) return;

        const config = await client.getGuildConfig(interaction.guild.id);
        if (!config.verifyRoleId) {
          await interaction.reply({
            content: "⚠️ Role verifikasi belum diatur oleh admin server ini.",
            ephemeral: true,
          });
          return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) {
          await interaction.reply({
            content: "❌ Data member tidak ditemukan.",
            ephemeral: true,
          });
          return;
        }

        if (member.roles.cache.has(config.verifyRoleId)) {
          await interaction.reply({
            content: "ℹ️ Kamu sudah terverifikasi di server ini!",
            ephemeral: true,
          });
          return;
        }

        try {
          await member.roles.add(config.verifyRoleId, "Verifikasi via tombol interaktif");
          await interaction.reply({
            content: "🎉 **Selamat!** Kamu telah berhasil diverifikasi dan sekarang dapat mengakses server.",
            ephemeral: true,
          });
        } catch (err) {
          logger.error("Gagal memberikan role verifikasi:", err);
          await interaction.reply({
            content: "❌ Gagal memberikan role verifikasi. Pastikan posisi role bot berada di atas role verifikasi.",
            ephemeral: true,
          });
        }
      }
    }
  },
};
