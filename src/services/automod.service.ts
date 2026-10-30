import { Message, GuildMember, PermissionFlagsBits } from "discord.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { db } from "../database/index.js";
import { Colors, createEmbed } from "../utils/embed.js";
import { logger } from "../utils/logger.js";

interface UserSpamHistory {
  timestamps: number[];
  lastMessage: string;
  repeatCount: number;
}

export class AutoModService {
  // In-Memory cache untuk spam tracker: key = `${guildId}-${userId}`
  private static spamCache: Map<string, UserSpamHistory> = new Map();

  /**
   * Normalisasi leetspeak agar variasi sensor tetap tertangkap
   * misal: b4b1 -> babi, 4nj1ng -> anjing
   */
  public static normalizeLeetSpeak(text: string): string {
    return text
      .toLowerCase()
      .replace(/[@4]/g, "a")
      .replace(/[1!|]/g, "i")
      .replace(/[3]/g, "e")
      .replace(/[0]/g, "o")
      .replace(/[5$]/g, "s")
      .replace(/[7]/g, "t")
      .replace(/[^a-zA-Z0-9\s]/g, ""); // hilangkan karakter aneh pemisah
  }

  /**
   * Handler utama yang memeriksa setiap pesan baru
   */
  public static async inspectMessage(
    client: UltimateClient,
    message: Message
  ): Promise<boolean> {
    // Abaikan bot atau pesan di DM
    if (message.author.bot || !message.guild || !message.member) return false;

    // Abaikan jika member punya permission Administrator / ManageMessages
    if (
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return false;
    }

    const guildConfig = await client.getGuildConfig(message.guild.id);
    const automod = guildConfig.autoMod;
    if (!automod) return false;

    const content = message.content;
    const now = Date.now();
    const cacheKey = `${message.guild.id}-${message.author.id}`;

    // 1. CEK ANTI-SPAM & FLOODING
    if (automod.antiSpamEnabled) {
      const history = this.spamCache.get(cacheKey) || {
        timestamps: [],
        lastMessage: "",
        repeatCount: 0,
      };

      // Filter timestamp dalam rentang window
      const intervalMs = automod.spamIntervalSeconds * 1000;
      history.timestamps = history.timestamps.filter(
        (t) => now - t < intervalMs
      );
      history.timestamps.push(now);

      // Cek duplicate message spam
      if (history.lastMessage === content.trim() && content.trim().length > 3) {
        history.repeatCount += 1;
      } else {
        history.lastMessage = content.trim();
        history.repeatCount = 1;
      }

      this.spamCache.set(cacheKey, history);

      if (
        history.timestamps.length > automod.spamMaxMessages ||
        history.repeatCount >= 3
      ) {
        // Reset cache agar tidak terpicu berkali-kali dalam 1 detik
        this.spamCache.delete(cacheKey);
        await this.penalize(
          client,
          message,
          "Spam berlebihan atau mengirim pesan berulang (Flood)"
        );
        return true;
      }
    }

    // 2. CEK ANTI-INVITE LINK
    if (automod.antiInviteEnabled) {
      const inviteRegex =
        /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
      if (inviteRegex.test(content)) {
        await this.penalize(
          client,
          message,
          "Mengirim link invite server Discord lain"
        );
        return true;
      }
    }

    // 3. CEK ANTI-PHISHING / SCAM LINK
    if (automod.antiLinkEnabled) {
      const phishingRegex =
        /(dlscord|discorcl|disord|free-nitro|steam-gift|steamcomminuty|discord-nitro)/i;
      if (phishingRegex.test(content)) {
        await this.penalize(
          client,
          message,
          "Terdeteksi link scam / phishing palsu"
        );
        return true;
      }
    }

    // 4. CEK MASS MENTION
    if (automod.antiMassMention) {
      const mentionCount =
        message.mentions.users.size + message.mentions.roles.size;
      const hasEveryone = message.mentions.everyone;

      if (mentionCount > automod.mentionThreshold || hasEveryone) {
        await this.penalize(
          client,
          message,
          `Mass mention berlebihan (melebihi ${automod.mentionThreshold} tag)`
        );
        return true;
      }
    }

    // 5. CEK CAPS LOCK BERLEBIHAN
    if (automod.antiCapsEnabled && content.length >= 8) {
      const letters = content.replace(/[^a-zA-Z]/g, "");
      if (letters.length >= 6) {
        const uppercaseCount = letters.replace(/[^A-Z]/g, "").length;
        const capsPercentage = (uppercaseCount / letters.length) * 100;

        if (capsPercentage >= automod.capsThresholdPercent) {
          await this.penalize(
            client,
            message,
            `Penggunaan HURUF KAPITAL berlebihan (${Math.round(capsPercentage)}%)`
          );
          return true;
        }
      }
    }

    // 6. CEK KATA KASAR / TERLARANG (SMART WORD FILTER)
    if (automod.badWordsEnabled && automod.badWordsList) {
      const normalized = this.normalizeLeetSpeak(content);
      const bannedWords = automod.badWordsList
        .split(",")
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);

      const detectedWord = bannedWords.find((word) =>
        normalized.includes(this.normalizeLeetSpeak(word))
      );

      if (detectedWord) {
        await this.penalize(
          client,
          message,
          `Menggunakan kata terlarang ("${detectedWord}")`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Eksekusi hukuman, catat warning di DB, dan jalankan auto-escalation jika batas tercapai
   */
  private static async penalize(
    client: UltimateClient,
    message: Message,
    reason: string
  ) {
    if (!message.guild || !message.member) return;

    // 1. Hapus pesan pelanggar
    try {
      if (message.deletable) {
        await message.delete();
      }
    } catch (err) {
      logger.error("Gagal menghapus pesan pelanggar:", err);
    }

    // 2. Simpan warning ke SQLite
    const warning = await db.warning.create({
      data: {
        guildId: message.guild.id,
        userId: message.author.id,
        moderatorId: client.user?.id || "AUTOMOD",
        reason: `[AutoMod] ${reason}`,
      },
    });

    // Hitung total warnings aktif user di guild ini
    const totalWarnings = await db.warning.count({
      where: {
        guildId: message.guild.id,
        userId: message.author.id,
      },
    });

    const guildConfig = await client.getGuildConfig(message.guild.id);
    const automod = guildConfig.autoMod;
    let escalated = false;
    let actionTaken = "Pesan Dihapus & Diberikan Peringatan (Warn)";

    // 3. Auto-Escalation Check
    if (automod && totalWarnings >= automod.escalateWarnings) {
      try {
        if (
          automod.escalateAction === "TIMEOUT" &&
          message.member.moderatable
        ) {
          const durationMs = automod.escalateDurationMins * 60 * 1000;
          await message.member.timeout(
            durationMs,
            `[AutoMod Escalation] Akumulasi ${totalWarnings} peringatan.`
          );
          escalated = true;
          actionTaken = `Otomatis di-Timeout selama ${automod.escalateDurationMins} menit (Batas ${automod.escalateWarnings} warning tercapai)`;
        } else if (
          automod.escalateAction === "KICK" &&
          message.member.kickable
        ) {
          await message.member.kick(
            `[AutoMod Escalation] Akumulasi ${totalWarnings} peringatan.`
          );
          escalated = true;
          actionTaken = `Otomatis di-Kick (Batas ${automod.escalateWarnings} warning tercapai)`;
        }
      } catch (err) {
        logger.error("Gagal mengeksekusi auto-escalation:", err);
      }
    }

    // 4. Kirim notifikasi peringatan ke channel
    try {
      if ("send" in message.channel) {
        const warnMsg = await (message.channel as any).send({
          embeds: [
            createEmbed({
              title: "🛡️ Auto-Moderator Shield",
              description: `${message.author}, pesan kamu dihapus karena **${reason}**.\n\n⚠️ **Total Peringatan:** ${totalWarnings} warning.\n📌 **Tindakan:** ${actionTaken}`,
              color: escalated ? Colors.Danger : Colors.Warning,
            }),
          ],
        });

        // Hapus notif peringatan setelah 7 detik agar channel tetap bersih
        setTimeout(() => warnMsg.delete().catch(() => {}), 7000);
      }
    } catch {
      // Abaikan jika bot tidak punya send permission
    }

    // 5. Kirim log ke channel mod-log jika ada
    if (guildConfig.modLogChannelId) {
      try {
        const logChannel = await message.guild.channels.fetch(
          guildConfig.modLogChannelId
        );
        if (logChannel && logChannel.isTextBased()) {
          const targetChan = logChannel as any;
          if (typeof targetChan.send === "function") {
            await targetChan.send({
              embeds: [
                createEmbed({
                  title: "🛡️ [Log AutoMod] Pelanggaran Terdeteksi",
                  description: `**Pelanggar:** ${message.author} (\`${message.author.id}\`)\n**Channel:** ${message.channel}\n**Alasan:** ${reason}\n**Total Warning:** ${totalWarnings}\n**Tindakan:** ${actionTaken}\n\n**Isi Pesan Asli:**\n\`\`\`\n${message.content.substring(0, 1000)}\n\`\`\``,
                  color: escalated ? Colors.Danger : Colors.Warning,
                }),
              ],
            });
          }
        }
      } catch (err) {
        logger.error("Gagal mengirim log ke mod-log channel:", err);
      }
    }
  }
}
