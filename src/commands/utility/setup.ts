import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";

export const setupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Atur modul komunitas (Verifikasi, Auto-Role, Welcome)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("verification")
        .setDescription("Kirim pesan panel verifikasi dengan tombol interaktif")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel tempat panel verifikasi akan dikirim")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Role yang akan diberikan saat member menekan tombol verifikasi")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("autorole")
        .setDescription("Atur role yang otomatis diberikan saat member baru bergabung")
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Role yang ingin dijadikan Auto-Role")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("welcome")
        .setDescription("Atur channel dan format pesan sambutan member baru")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel tujuan pesan sambutan")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("Template pesan (Gunakan {user}, {server}, {memberCount})")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Aktifkan fitur welcome message")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("ticket")
        .setDescription("Kirim panel pembuatan tiket bantuan ke channel yang dipilih")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel tempat panel tiket akan diletakkan")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("category")
            .setDescription("Kategori tempat channel tiket baru akan dibuat")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    if (!interaction.guild) return;
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    // 1. SUBCOMMAND: VERIFICATION
    if (sub === "verification") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const role = interaction.options.getRole("role", true);

      // Simpan verifyRoleId ke DB
      await db.guildConfig.upsert({
        where: { guildId },
        update: { verifyRoleId: role.id },
        create: {
          guildId,
          verifyRoleId: role.id,
        },
      });

      client.invalidateGuildCache(guildId);

      // Buat Embed dan Button Verifikasi
      const embed = createEmbed({
        title: "🛡️ Gerbang Verifikasi Server",
        description:
          `Selamat datang di **${interaction.guild.name}**!\n\n` +
          `Untuk mengakses seluruh channel dan berinteraksi dengan komunitas, silakan klik tombol verifikasi di bawah ini.\n\n` +
          `Dengan memverifikasi diri, kamu setuju untuk mematuhi peraturan yang berlaku di server ini.`,
        color: Colors.Primary,
      });

      const button = new ButtonBuilder()
        .setCustomId("btn_verify_member")
        .setLabel("Verifikasi Diri")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await channel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Panel verifikasi berhasil dikirim ke <#${channel.id}> dengan role reward: <@&${role.id}>!`,
        ephemeral: true,
      });
      return;
    }

    // 2. SUBCOMMAND: AUTOROLE
    if (sub === "autorole") {
      const role = interaction.options.getRole("role", true);

      await db.guildConfig.upsert({
        where: { guildId },
        update: { autoRoleId: role.id },
        create: {
          guildId,
          autoRoleId: role.id,
        },
      });

      client.invalidateGuildCache(guildId);

      await interaction.reply({
        embeds: [
          createEmbed({
            title: "✅ Auto-Role Berhasil Diatur",
            description: `Setiap member baru yang bergabung sekarang akan otomatis mendapatkan role: <@&${role.id}>.`,
            color: Colors.Success,
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    // 3. SUBCOMMAND: WELCOME
    if (sub === "welcome") {
      const channel = interaction.options.getChannel("channel", true);
      const message =
        interaction.options.getString("message") ||
        "Selamat datang {user} di **{server}**! Kamu adalah member ke-{memberCount}.";
      const enabled = interaction.options.getBoolean("enabled") ?? true;

      await db.guildConfig.upsert({
        where: { guildId },
        update: {
          welcomeChannelId: channel.id,
          welcomeMessage: message,
          welcomeEnabled: enabled,
        },
        create: {
          guildId,
          welcomeChannelId: channel.id,
          welcomeMessage: message,
          welcomeEnabled: enabled,
        },
      });

      client.invalidateGuildCache(guildId);

      await interaction.reply({
        embeds: [
          createEmbed({
            title: "✅ Pengaturan Welcome Diperbarui",
            description:
              `• **Status:** ${enabled ? "✅ Aktif" : "❌ Nonaktif"}\n` +
              `• **Channel:** <#${channel.id}>\n` +
              `• **Format Pesan:**\n\`${message}\``,
            color: Colors.Success,
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    // 4. SUBCOMMAND: TICKET
    if (sub === "ticket") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const category = interaction.options.getChannel("category", true);

      await db.guildConfig.upsert({
        where: { guildId },
        update: { ticketCategoryId: category.id },
        create: {
          guildId,
          ticketCategoryId: category.id,
        },
      });

      client.invalidateGuildCache(guildId);

      const embed = createEmbed({
        title: "📩 Pusat Bantuan & Tiket Server",
        description:
          `Butuh bantuan dari tim moderator / staf?\n\n` +
          `Klik tombol **Buka Tiket** di bawah ini untuk membuat channel percakapan privat dengan staf kami.`,
        color: Colors.Primary,
      });

      const button = new ButtonBuilder()
        .setCustomId("btn_create_ticket")
        .setLabel("Buka Tiket Support")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📩");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await channel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Panel tiket berhasil dikirim ke <#${channel.id}> dengan kategori tiket: **${category.name}**!`,
        ephemeral: true,
      });
      return;
    }
  },
};
