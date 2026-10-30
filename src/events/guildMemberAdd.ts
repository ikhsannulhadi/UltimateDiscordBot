import { GuildMember } from "discord.js";
import { BotEvent } from "../types/index.js";
import { UltimateClient } from "../client/UltimateClient.js";
import { Colors, createEmbed } from "../utils/embed.js";
import { logger } from "../utils/logger.js";

export const guildMemberAddEvent: BotEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  async execute(client: UltimateClient, member: GuildMember) {
    if (!member.guild) return;
    const guildId = member.guild.id;

    const config = await client.getGuildConfig(guildId);

    // 1. AUTO-ROLE ASSIGNMENT
    if (config.autoRoleId) {
      try {
        const role = await member.guild.roles.fetch(config.autoRoleId);
        if (role) {
          await member.roles.add(role, "Auto-Role Member Baru");
        }
      } catch (err) {
        logger.error(`Gagal memberikan auto-role di guild ${guildId}:`, err);
      }
    }

    // 2. WELCOME MESSAGE
    if (config.welcomeEnabled && config.welcomeChannelId) {
      try {
        const channel = await member.guild.channels.fetch(config.welcomeChannelId);
        if (channel && channel.isTextBased() && "send" in channel) {
          const rawMessage =
            config.welcomeMessage || "Selamat datang {user} di {server}!";
          const formattedMessage = rawMessage
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{server}/g, member.guild.name)
            .replace(/{memberCount}/g, member.guild.memberCount.toString());

          const embed = createEmbed({
            title: `👋 Selamat Datang!`,
            description: formattedMessage,
            color: Colors.Success,
          })
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Member #${member.guild.memberCount}`,
              iconURL: member.guild.iconURL() || undefined,
            });

          await (channel as any).send({
            content: `<@${member.id}>`,
            embeds: [embed],
          });
        }
      } catch (err) {
        logger.error(`Gagal mengirim welcome message di guild ${guildId}:`, err);
      }
    }
  },
};
