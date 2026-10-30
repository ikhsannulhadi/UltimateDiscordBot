import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ClientEvents,
} from "discord.js";
import { UltimateClient } from "../client/UltimateClient.js";

export type AnySlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export interface Command {
  data: AnySlashCommandBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    client: UltimateClient
  ) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: UltimateClient, ...args: any[]) => Promise<void>;
}
