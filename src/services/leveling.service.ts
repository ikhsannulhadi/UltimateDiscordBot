import { Message } from "discord.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { db } from "../database/index.js";
import { Colors, createEmbed } from "../utils/embed.js";

export class LevelingService {
  // Cooldown cache untuk pemberian XP: 60 detik per user agar tidak bisa di-spam
  private static xpCooldowns: Map<string, number> = new Map();

  /**
   * Menghitung total XP yang dibutuhkan untuk mencapai level tertentu
   */
  public static xpForLevel(level: number): number {
    return 5 * level * level + 50 * level + 100;
  }

  /**
   * Handle perolehan XP setiap ada pesan masuk
   */
  public static async handleMessageXp(client: UltimateClient, message: Message) {
    if (message.author.bot || !message.guild) return;

    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const lastXp = this.xpCooldowns.get(key) || 0;

    // Cooldown 60 detik (60.000 ms)
    if (now - lastXp < 60000) return;
    this.xpCooldowns.set(key, now);

    // Dapatkan 15 - 25 XP acak
    const gainedXp = Math.floor(Math.random() * 11) + 15;

    // Ambil atau buat data level user di SQLite
    let userLevel = await db.userLevel.findUnique({
      where: {
        guildId_userId: {
          guildId: message.guild.id,
          userId: message.author.id,
        },
      },
    });

    if (!userLevel) {
      userLevel = await db.userLevel.create({
        data: {
          guildId: message.guild.id,
          userId: message.author.id,
          xp: gainedXp,
          level: 1,
        },
      });
      return;
    }

    const newXp = userLevel.xp + gainedXp;
    let newLevel = userLevel.level;
    let requiredXp = this.xpForLevel(newLevel);
    let leveledUp = false;

    // Cek apakah naik level (bisa naik multi-level jika akumulasi tinggi)
    while (newXp >= requiredXp) {
      newLevel += 1;
      requiredXp = this.xpForLevel(newLevel);
      leveledUp = true;
    }

    await db.userLevel.update({
      where: {
        guildId_userId: {
          guildId: message.guild.id,
          userId: message.author.id,
        },
      },
      data: {
        xp: newXp,
        level: newLevel,
        lastXpAt: new Date(),
      },
    });

    // Jika level up, kirim notifikasi perayaan!
    if (leveledUp) {
      try {
        if ("send" in message.channel) {
          const embed = createEmbed({
            title: "🎉 Level Up!",
            description: `Selamat ${message.author}! Kamu berhasil naik ke **Level ${newLevel}**! 🚀`,
            color: Colors.Success,
          }).setThumbnail(message.author.displayAvatarURL());

          const congratsMsg = await (message.channel as any).send({
            embeds: [embed],
          });

          // Hapus pesan level up setelah 10 detik agar chat tidak berantakan
          setTimeout(() => congratsMsg.delete().catch(() => {}), 10000);
        }
      } catch {
        // Abaikan jika tidak ada permission
      }
    }
  }
}
