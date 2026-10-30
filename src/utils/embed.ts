import { EmbedBuilder, ColorResolvable } from "discord.js";

export const Colors = {
  Primary: "#5865F2" as ColorResolvable, // Blurple
  Success: "#57F287" as ColorResolvable, // Hijau
  Warning: "#FEE75C" as ColorResolvable, // Kuning
  Danger: "#ED4245" as ColorResolvable,  // Merah
  Dark: "#2B2D31" as ColorResolvable,
};

export function createEmbed(options?: {
  title?: string;
  description?: string;
  color?: ColorResolvable;
}) {
  const embed = new EmbedBuilder()
    .setColor(options?.color || Colors.Primary)
    .setTimestamp();

  if (options?.title) embed.setTitle(options.title);
  if (options?.description) embed.setDescription(options.description);

  return embed;
}
