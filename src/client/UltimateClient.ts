import {
  Client,
  ClientOptions,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { Command } from "../types/index.js";
import { GuildConfig, AutoModConfig } from "@prisma/client";
import { db } from "../database/index.js";

export type CachedGuildSettings = GuildConfig & {
  autoMod: AutoModConfig | null;
};

export class UltimateClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  // In-Memory cache config per guild untuk latensi ultra cepat
  public guildConfigCache: Map<string, CachedGuildSettings> = new Map();

  constructor(
    options: ClientOptions = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
      ],
    }
  ) {
    super(options);
  }

  /**
   * Mengambil setting guild dari memory cache, atau load dari database jika belum ada.
   * Dashboard-Ready: Saat dashboard update config, bot tinggal memanggil invalidateGuildCache(guildId).
   */
  public async getGuildConfig(guildId: string): Promise<CachedGuildSettings> {
    const cached = this.guildConfigCache.get(guildId);
    if (cached) return cached;

    let config = await db.guildConfig.findUnique({
      where: { guildId },
      include: { autoMod: true },
    });

    if (!config) {
      // Inisialisasi default record jika server baru
      config = await db.guildConfig.create({
        data: {
          guildId,
          autoMod: {
            create: {
              antiSpamEnabled: false,
              antiInviteEnabled: false,
              antiCapsEnabled: false,
              badWordsEnabled: false,
            },
          },
        },
        include: { autoMod: true },
      });
    }

    this.guildConfigCache.set(guildId, config as CachedGuildSettings);
    return config as CachedGuildSettings;
  }

  public invalidateGuildCache(guildId: string) {
    this.guildConfigCache.delete(guildId);
  }
}
