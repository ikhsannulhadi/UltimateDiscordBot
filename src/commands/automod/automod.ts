import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Command } from "../../types/index.js";
import { Colors, createEmbed } from "../../utils/embed.js";
import { db } from "../../database/index.js";

export const automodCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Kelola konfigurasi Auto-Moderator pintar di server ini")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Lihat status konfigurasi AutoMod saat ini")
    )
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Aktifkan atau nonaktifkan modul perlindungan AutoMod")
        .addStringOption((opt) =>
          opt
            .setName("module")
            .setDescription("Pilih modul yang ingin diubah")
            .setRequired(true)
            .addChoices(
              { name: "Anti-Spam & Flood", value: "antiSpamEnabled" },
              { name: "Anti-Invite Server Lain", value: "antiInviteEnabled" },
              { name: "Anti-Link Phishing / Scam", value: "antiLinkEnabled" },
              { name: "Anti-Caps Lock Berlebihan", value: "antiCapsEnabled" },
              { name: "Anti-Mass Mention", value: "antiMassMention" },
              { name: "Filter Kata Terlarang (Bad Words)", value: "badWordsEnabled" }
            )
        )
        .addBooleanOption((opt) =>
          opt
            .setName("status")
            .setDescription("True untuk aktif, False untuk mati")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("logchannel")
        .setDescription("Atur channel tempat pengiriman log AutoMod")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Pilih channel teks untuk mod-log")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("badwords")
        .setDescription("Atur daftar kata kasar/terlarang (pisahkan dengan koma)")
        .addStringOption((opt) =>
          opt
            .setName("words")
            .setDescription("Contoh: kata1, kata2, kata3")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("escalation")
        .setDescription("Atur hukuman otomatis saat akumulasi warning tercapai")
        .addIntegerOption((opt) =>
          opt
            .setName("warnings")
            .setDescription("Batas akumulasi warning (contoh: 3)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Tindakan yang diambil")
            .setRequired(true)
            .addChoices(
              { name: "Timeout (Mute Sementara)", value: "TIMEOUT" },
              { name: "Kick Member", value: "KICK" }
            )
        )
        .addIntegerOption((opt) =>
          opt
            .setName("duration_minutes")
            .setDescription("Durasi timeout dalam menit (hanya untuk TIMEOUT)")
            .setRequired(false)
        )
    ),

  async execute(interaction, client) {
    if (!interaction.guild) return;
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    const config = await client.getGuildConfig(guildId);
    let automod = config.autoMod;

    if (!automod) {
      automod = await db.autoModConfig.create({
        data: { guildId },
      });
    }

    // 1. SUBCOMMAND: STATUS
    if (sub === "status") {
      const statusIcon = (val: boolean) => (val ? "✅ **Aktif**" : "❌ *Nonaktif*");

      const embed = createEmbed({
        title: `🛡️ Pengaturan AutoMod: ${interaction.guild.name}`,
        description: `Status perlindungan otomatis di server saat ini:\n\n` +
          `• **Anti-Spam & Flood:** ${statusIcon(automod.antiSpamEnabled)} (Max: \`${automod.spamMaxMessages}\` pesan / \`${automod.spamIntervalSeconds}s\`)\n` +
          `• **Anti-Invite Links:** ${statusIcon(automod.antiInviteEnabled)}\n` +
          `• **Anti-Phishing/Scam:** ${statusIcon(automod.antiLinkEnabled)}\n` +
          `• **Anti-Caps Lock:** ${statusIcon(automod.antiCapsEnabled)} (Ambang: \`${automod.capsThresholdPercent}%\`)\n` +
          `• **Anti-Mass Mention:** ${statusIcon(automod.antiMassMention)} (Batas: \`${automod.mentionThreshold}\` tag)\n` +
          `• **Filter Kata Terlarang:** ${statusIcon(automod.badWordsEnabled)}\n` +
          `\n**⚖️ Auto-Escalation:**\n` +
          `• Hukuman Otomatis: \`${automod.escalateAction}\` saat mencapai \`${automod.escalateWarnings}\` warnings.\n` +
          `• Durasi Timeout: \`${automod.escalateDurationMins}\` menit.\n` +
          `\n**📋 Mod-Log Channel:** ${config.modLogChannelId ? `<#${config.modLogChannelId}>` : "*Belum diatur*"}`,
        color: Colors.Primary,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 2. SUBCOMMAND: TOGGLE
    if (sub === "toggle") {
      const moduleName = interaction.options.getString("module", true);
      const status = interaction.options.getBoolean("status", true);

      await db.autoModConfig.update({
        where: { guildId },
        data: { [moduleName]: status },
      });

      client.invalidateGuildCache(guildId);

      const embed = createEmbed({
        title: "✅ Pengaturan Disimpan",
        description: `Modul **${moduleName}** berhasil diubah menjadi: ${status ? "✅ **Aktif**" : "❌ *Nonaktif*"}.`,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 3. SUBCOMMAND: LOGCHANNEL
    if (sub === "logchannel") {
      const channel = interaction.options.getChannel("channel", true);

      await db.guildConfig.update({
        where: { guildId },
        data: { modLogChannelId: channel.id },
      });

      client.invalidateGuildCache(guildId);

      const embed = createEmbed({
        title: "✅ Mod-Log Channel Diperbarui",
        description: `Laporan aktivitas AutoMod & moderasi sekarang akan dikirim ke: <#${channel.id}>.`,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 4. SUBCOMMAND: BADWORDS
    if (sub === "badwords") {
      const words = interaction.options.getString("words", true);

      await db.autoModConfig.update({
        where: { guildId },
        data: {
          badWordsList: words,
          badWordsEnabled: true,
        },
      });

      client.invalidateGuildCache(guildId);

      const embed = createEmbed({
        title: "✅ Daftar Kata Terlarang Diperbarui",
        description: `Kata terlarang berhasil disimpan dan modul Bad Words diaktifkan.\n\n**Daftar Kata:**\n\`${words}\``,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 5. SUBCOMMAND: ESCALATION
    if (sub === "escalation") {
      const warnings = interaction.options.getInteger("warnings", true);
      const action = interaction.options.getString("action", true);
      const duration = interaction.options.getInteger("duration_minutes") || 10;

      await db.autoModConfig.update({
        where: { guildId },
        data: {
          escalateWarnings: warnings,
          escalateAction: action,
          escalateDurationMins: duration,
        },
      });

      client.invalidateGuildCache(guildId);

      const embed = createEmbed({
        title: "✅ Auto-Escalation Dikonfigurasi",
        description: `Sanksi otomatis berhasil diatur:\n• Pelanggar yang mencapai **${warnings} warning** akan otomatis dikenakan sanksi **${action}**${action === "TIMEOUT" ? ` selama **${duration} menit**` : ""}.`,
        color: Colors.Success,
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
