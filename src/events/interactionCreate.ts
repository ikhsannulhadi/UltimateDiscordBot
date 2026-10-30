import {
  Interaction,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
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
        return;
      }

      // BUAT TIKET BARU
      if (interaction.customId === "btn_create_ticket") {
        if (!interaction.guild) return;

        const config = await client.getGuildConfig(interaction.guild.id);
        const categoryId = config.ticketCategoryId;

        // Cek apakah channel tiket untuk user ini sudah ada
        const sanitizedUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
        const channelName = `ticket-${sanitizedUsername}`;

        const existingChannel = interaction.guild.channels.cache.find(
          (c) => c.name === channelName
        );

        if (existingChannel) {
          await interaction.reply({
            content: `⚠️ Kamu sudah memiliki tiket yang aktif di <#${existingChannel.id}>. Selesaikan tiket tersebut terlebih dahulu.`,
            ephemeral: true,
          });
          return;
        }

        try {
          const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId || undefined,
            permissionOverwrites: [
              {
                id: interaction.guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              {
                id: client.user!.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageChannels,
                ],
              },
            ],
          });

          // Tombol Tutup Tiket
          const closeButton = new ButtonBuilder()
            .setCustomId("btn_close_ticket")
            .setLabel("Tutup Tiket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒");

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

          const embed = createEmbed({
            title: `🎫 Tiket Dukungan: ${interaction.user.username}`,
            description:
              `Halo ${interaction.user}, terima kasih telah menghubungi tim dukungan.\n\n` +
              `Silakan jelaskan pertanyaan atau masalah kamu secara rinci di sini. Staf kami akan segera merespons.\n\n` +
              `*Jika masalah sudah selesai, klik tombol **Tutup Tiket** di bawah.*`,
            color: Colors.Primary,
          });

          await ticketChannel.send({
            content: `${interaction.user} Selamat datang di tiket bantuanmu!`,
            embeds: [embed],
            components: [row],
          });

          await interaction.reply({
            content: `✅ Tiket bantuan kamu berhasil dibuat di <#${ticketChannel.id}>!`,
            ephemeral: true,
          });
        } catch (err) {
          logger.error("Gagal membuat channel tiket:", err);
          await interaction.reply({
            content: "❌ Gagal membuat channel tiket. Pastikan bot memiliki permission Manage Channels.",
            ephemeral: true,
          });
        }
        return;
      }

      // TUTUP TIKET
      if (interaction.customId === "btn_close_ticket") {
        const channel = interaction.channel as TextChannel;
        if (!channel) return;

        await interaction.reply({
          content: "🔒 **Tiket ini akan ditutup dan dihapus dalam 5 detik...**",
        });

        setTimeout(async () => {
          try {
            await channel.delete("Tiket ditutup");
          } catch (err) {
            logger.error("Gagal menghapus channel tiket:", err);
          }
        }, 5000);
        return;
      }
    }
  },
};
