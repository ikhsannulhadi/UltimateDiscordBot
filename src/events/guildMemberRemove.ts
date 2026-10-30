import { GuildMember, PartialGuildMember } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { Colors, createEmbed } from "../utils/embed.js";
import { logger } from "../utils/logger.js";

export const guildMemberRemoveEvent: BotEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  async execute(client: UltimateClient, member: GuildMember | PartialGuildMember) {
    if (!member.guild) return;
    const guildId = member.guild.id;

    const config = await client.getGuildConfig(guildId);

    // Kirim Goodbye ke welcomeChannel jika welcome diaktifkan
    if (config.welcomeEnabled && config.welcomeChannelId) {
      try {
        const channel = await member.guild.channels.fetch(config.welcomeChannelId);
        if (channel && channel.isTextBased() && "send" in channel) {
          const embed = createEmbed({
            title: `👋 Selamat Jalan`,
            description: `**${member.user?.tag || "Seseorang"}** telah meninggalkan server. Sampai jumpa lagi!`,
            color: Colors.Danger,
          })
            .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) || "")
            .setFooter({
              text: `Sisa member: ${member.guild.memberCount}`,
              iconURL: member.guild.iconURL() || undefined,
            });

          await (channel as any).send({ embeds: [embed] });
        }
      } catch (err) {
        logger.error(`Gagal mengirim goodbye message di guild ${guildId}:`, err);
      }
    }
  },
};
