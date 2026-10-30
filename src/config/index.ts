import dotenv from "dotenv";
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
};

export function validateConfig() {
  if (!config.token) {
    console.warn("⚠️ [Config] DISCORD_TOKEN belum diisi di file .env!");
  }
}
