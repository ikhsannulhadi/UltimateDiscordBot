<div align="center">

# 🤖 UltimateDiscordBot

**Modern, Lightning-Fast, Standalone & Dashboard-Ready Discord Bot**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

*Bot Discord All-in-One modern berbasis Node.js & TypeScript dengan engine Auto-Moderator pintar tanpa ketergantungan API AI pihak ketiga (100% gratis & latensi instan), didesain secara decoupled dan siap disambungkan ke Web Dashboard di masa depan.*

---

</div>

## ✨ Fitur Utama

### 🛡️ Smart Auto-Mod Engine (Lokal & Cepat)
* **Anti-Spam & Flood Protector**: Algoritma sliding window & deteksi duplikasi pesan berulang secara instan (< 5ms).
* **Anti-Invite Links**: Blokir dan hapus otomatis link invite server lain (`discord.gg/*`).
* **Anti-Phishing & Scam Links**: Filter domain scam hadiah gratisan, steam phising, dan link mencurigakan.
* **Smart Word Filter**: Sensor kata kasar lokal yang kebal terhadap variasi huruf angka (*leetspeak*, contoh: `4nj1ng`, `b4b1`).
* **Mass Mention & Caps Protector**: Pembatasan spam tag (`@everyone` / role) dan pesan HURUF KAPITAL berlebihan (>70%).
* **Auto-Escalation System**: Penegakan sanksi bertingkat otomatis (Hapus Pesan $\rightarrow$ Peringatan $\rightarrow$ Otomatis Timeout/Kick saat batas warning tercapai).

### 🔨 Moderasi & Logging Server
* **Slash Commands Lengkap**: `/warn [add|list|clear]`, `/timeout`, `/clear` (bulk purge pesan), dan perintah moderasi lainnya.
* **Audit & Mod-Logs**: Integrasi channel khusus laporan audit moderasi (`#mod-log`).

### ⚙️ Manajemen Komunitas & Automasi (Ongoing)
* **Verification Gatekeeper**: Tombol verifikasi interaktif sebelum member baru dapat mengakses server (anti-raid).
* **Auto-Role System**: Otomatis memberikan role saat member atau bot pertama kali bergabung.
* **Welcome & Goodbye System**: Pesan sambutan dan pamitan otomatis dengan embed modern.
* **Ticket Support System**: Private channel tiket bantuan otomatis via Discord Button.

### 🏗️ Arsitektur "Dashboard-Ready"
* **Per-Guild Database Configuration**: Konfigurasi setiap server tersimpan terpusat di database (Prisma + SQLite), bukan hardcoded.
* **In-Memory Caching**: Pengaturan server di-cache di memori sementara untuk kecepatan eksekusi tinggi tanpa membebani disk/DB.
* **Decoupled Architecture**: Logika database dan service terisolasi dari bot Discord, memudahkan pembuatan Web Dashboard (Next.js / React) di masa depan.

---

## 📁 Struktur Direktori

```plaintext
UltimateDiscordBot/
├── prisma/
│   ├── schema.prisma       # Skema database relasional (GuildConfig, AutoMod, Warnings, dll)
│   └── dev.db              # Database SQLite lokal (tanpa perlu setup server)
├── src/
│   ├── client/             # Extended Discord Client + In-Memory Guild Cache
│   ├── commands/           # Slash commands modular (automod, moderation, general)
│   ├── config/             # Environment validator & app configuration
│   ├── database/           # Prisma client instance & DB utilities
│   ├── events/             # Event listeners (ready, messageCreate, interactionCreate)
│   ├── services/           # Logika bisnis murni (AutoMod Service, Escalation Engine)
│   ├── types/              # TypeScript interface & definition
│   ├── utils/              # Helper embeds, logger, dan tools
│   └── index.ts            # Entry point aplikasi
├── .env.example            # Template konfigurasi environment
├── package.json
└── tsconfig.json
```

---

## 🚀 Panduan Memulai

### 1. Prasyarat
* [Node.js](https://nodejs.org/) v18.0.0 atau lebih baru
* [Git](https://git-scm.com/)

### 2. Kloning Repository
```bash
git clone https://github.com/USERNAME/UltimateDiscordBot.git
cd UltimateDiscordBot
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka `.env` dan isi token bot Discord Anda:
```env
DISCORD_TOKEN="TOKEN_BOT_DISCORD_ANDA"
CLIENT_ID="APPLICATION_ID_BOT_ANDA"
DATABASE_URL="file:./dev.db"
```

> **Catatan Pengaturan di Discord Developer Portal**:
> Pastikan opsi **Privileged Gateway Intents** berikut diaktifkan di tab **Bot**:
> - ✅ **Presence Intent**
> - ✅ **Server Members Intent**
> - ✅ **Message Content Intent**

### 5. Inisialisasi Database
Jalankan sinkronisasi skema Prisma ke database SQLite:
```bash
npm run db:push
```

### 6. Menjalankan Bot
* **Mode Pengembangan (Hot-Reload):**
  ```bash
  npm run dev
  ```
* **Build & Mode Produksi:**
  ```bash
  npm run build
  npm start
  ```

---

## 🎮 Daftar Slash Commands

| Command | Subcommand | Deskripsi | Izin Diperlukan |
| :--- | :--- | :--- | :--- |
| `/ping` | - | Cek latensi Gateway Discord & database SQLite | Semua Member |
| `/automod` | `status` | Menampilkan ringkasan status proteksi AutoMod server | Manage Guild |
| `/automod` | `toggle` | Mengaktifkan/mematikan modul (Spam, Invite, Caps, dll) | Manage Guild |
| `/automod` | `logchannel` | Mengatur channel tujuan pengiriman log AutoMod | Manage Guild |
| `/automod` | `badwords` | Menambahkan kata kasar/terlarang ke filter leetspeak | Manage Guild |
| `/automod` | `escalation` | Mengatur sanksi otomatis akumulasi warning (Timeout/Kick) | Manage Guild |
| `/warn` | `add` | Memberikan catatan peringatan manual ke member | Moderate Members |
| `/warn` | `list` | Melihat riwayat peringatan yang dimiliki member | Moderate Members |
| `/warn` | `clear` | Menghapus seluruh riwayat peringatan member | Moderate Members |
| `/timeout` | - | Memberikan sanksi mute / timeout dengan durasi menit | Moderate Members |
| `/clear` | - | Menghapus banyak pesan sekaligus (1-100 pesan) | Manage Messages |
| `/setup` | `verification` | Mengirim panel verifikasi interaktif dengan tombol `[✅ Verifikasi]` | Administrator |
| `/setup` | `autorole` | Mengatur role otomatis saat member baru join | Administrator |
| `/setup` | `welcome` | Mengatur channel dan format pesan sambutan member | Administrator |
| `/setup` | `ticket` | Mengirim panel tiket bantuan interaktif dengan tombol `[📩 Buka Tiket]` | Administrator |
| `/rank` | - | Menampilkan kartu peringkat, level, XP, dan progress bar visual | Semua Member |
| `/leaderboard` | - | Menampilkan papan peringkat 10 member teraktif di server | Semua Member |

---

## 🛠️ Manajemen Database GUI
Kamu bisa melihat dan mengedit data server, warning, dan konfigurasi secara visual melalui Prisma Studio:
```bash
npm run db:studio
```
Buka browser di `http://localhost:5555`.

---

## 📜 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
