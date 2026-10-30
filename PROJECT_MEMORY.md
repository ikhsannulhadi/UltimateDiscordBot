# 🧠 PROJECT MEMORY & ROADMAP: UltimateDiscordBot

Dokumen ini adalah **single source of truth** untuk mencatat visi, arsitektur, keputusan teknis, daftar fitur, dan riwayat perkembangan proyek **UltimateDiscordBot**. Setiap perubahan penting di masa mendatang wajib diperbarui di dokumen ini.

---

## 📌 Identitas Proyek
* **Nama Proyek**: UltimateDiscordBot
* **Target**: Bot Discord All-in-One modern, cepat, mandiri (tanpa API AI berbayar), dan dirancang dari awal berorientasi **Dashboard-Ready**.
* **Tech Stack**:
  * **Runtime / Engine**: Node.js (`discord.js` v14)
  * **Language**: TypeScript (Strongly-typed, modular, minim bug) / Modern ES Modules
  * **Data Layer**: Database terpusat berbasis skema (Prisma ORM / MongoDB / SQLite / PostgreSQL)
  * **Architecture Principle**: *Decoupled Services* & *Database-Driven Config* (Memisahkan logika Discord dari database & business logic agar kelak Dashboard Web tinggal panggil/update data).

---

## 📋 Daftar Rencana Fitur

### 1. 🛡️ Smart Auto-Mod Engine (Lokal, Cepat & Tanpa Ketergantungan API AI)
* **Anti-Spam & Flood Protector**: Algoritma sliding window / token bucket untuk deteksi pesan bertubi-tubi dan pesan duplikat (copy-paste).
* **Anti-Invite & Phishing Filter**: Deteksi dan penghapusan otomatis link invite server lain (`discord.gg/*`) dan link scam/phishing mencurigakan.
* **Smart Word Filter**: Sensor kata kasar/terlarang lokal yang tahan variasi *leetspeak* (angka/simbol seperti `4nj1ng`, `b4b1`).
* **Mass Mention & Caps Protector**: Blokir spam `@everyone`/mass mention serta pembatasan teks kapital berlebih (>70%).
* **Auto-Escalation System**: Eskalasi sanksi bertingkat (Hapus pesan $\rightarrow$ Warn $\rightarrow$ Auto-Timeout/Mute).

### 2. 🔨 Moderasi & Audit Logging
* **Slash Commands Moderasi**: `/ban`, `/kick`, `/timeout`, `/warn`, `/clear` (bulk purge pesan).
* **Audit & Mod-Logs**: Pencatatan otomatis ke channel mod-log (pesan dihapus/diedit, member keluar/masuk, sanksi moderasi).

### 3. ⚙️ Manajemen Komunitas & Automasi Server
* **Verification Gatekeeper**: Tombol `[Verifikasi]` untuk member baru membuka akses channel (mencegah akun bot/raid).
* **Auto-Role**: Pemberian role otomatis seketika member atau bot baru bergabung.
* **Welcome & Goodbye System**: Pesan sambutan dan pamitan otomatis (support embed custom).
* **Button/Reaction Roles**: Member mengambil role sendiri (gender, game, notifikasi) via Tombol (Buttons) atau Menu Pilihan (Select Menus).
* **Auto-Responder / Custom Triggers**: Respons otomatis untuk kata kunci FAQ tertentu (misal: pemicu `!rules` atau `!ip`).
* **Join-to-Create Voice (Temp Voice)**: Otomatis membuatkan Voice Channel sementara saat member klik channel pemicu, dan otomatis terhapus saat kosong.
* **Ticket Support System**: Buka tiket bantuan private via tombol interaktif, lengkap dengan penutupan dan transkrip chat.

### 4. 🎮 Gamifikasi & Engagement
* **XP & Leveling System**: Perhitungan level dari aktivitas kirim pesan dan aktif di voice channel.
* **Role Rewards**: Otomatis memberikan role eksklusif saat mencapai level target.
* **Rank Card & Leaderboard**: Perintah `/rank` untuk cek kartu profil dan `/leaderboard` untuk peringkat server.

### 5. 🌐 Web Dashboard (Fase Lanjutan)
* Panel kontrol berbasis web untuk toggle on/off fitur, edit konfigurasi guild, kelola role, dan view audit log secara visual.

---

## 🏗️ Prinsip Arsitektur "Dashboard-Ready"
1. **Per-Guild Database Configuration**:
   * Seluruh konfigurasi fitur (status aktif/nonaktif, ID channel log, role verifikasi, threshold spam) disimpan dalam database terpusat dengan schema `GuildConfig`. Tidak ada hardcoded config.
2. **Decoupled Architecture**:
   * Service & repository layer dipisahkan dari client Discord bot, sehingga Web Dashboard (Next.js/Express) kelak dapat langsung mengakses atau memanggil API yang sama.
3. **In-Memory Caching**:
   * Konfigurasi guild di-cache di memory (misal Node-Cache / Map) agar kinerja bot tetap instan tanpa terus-menerus query ke database pada setiap event chat. Cache dapat di-invalidate saat ada perubahan dari bot maupun dashboard.

---

## 📝 Log Keputusan & Perkembangan (Changelog)
* **2026-10-30 (Tahap 1 - Fondasi & Core AutoMod Selesai)**:
  * **Setup Lingkungan & Dependensi**: Node.js + TypeScript (ES2022/NodeNext), `discord.js` v14, `prisma` ORM, `tsx`, `dotenv`.
  * **Database Layer (SQLite)**: Berhasil inisialisasi Prisma SQLite (`dev.db`). Skema mencakup model `GuildConfig`, `AutoModConfig`, `Warning`, `UserLevel`, dan `AutoResponder`.
  * **Cache Layer (In-Memory)**: Client `UltimateClient` dilengkapi cache memory untuk konfigurasi guild (`guildConfigCache`), menjaga respon auto-mod berkecepatan tinggi tanpa spam query SQLite, siap sinkron dengan Dashboard (`invalidateGuildCache`).
  * **Core AutoMod Service Engine (`src/services/automod.service.ts`)**:
    * Sliding-window Anti-Spam & Flood Protector + Duplicate Message detector.
    * Anti-Invite regex detector (`discord.gg/*`, `discord.com/invite/*`).
    * Phishing & Scam Domain pattern detector.
    * Mass Mention protector (threshold tag limit & `@everyone`).
    * Caps Lock protector (>70% uppercase threshold).
    * Smart Word Filter dengan normalisasi leetspeak (misal: `b4b1` -> `babi`).
    * Auto-Escalation Engine: Otomatis hapus pesan $\rightarrow$ catat warning di DB SQLite $\rightarrow$ trigger timeout/kick saat batas warning tercapai $\rightarrow$ kirim log embed ke channel `#mod-log`.
  * **Event & Command Handler**:
    * Events: `ready.ts` (auto deploy slash commands), `messageCreate.ts` (automod & auto-responder), `interactionCreate.ts` (slash command handler).
    * Slash Commands:
      * `/ping`: cek latensi gateway Discord & latensi database SQLite.
      * `/automod`: subcommand `status`, `toggle`, `logchannel`, `badwords`, `escalation`.
      * `/warn`: subcommand `add`, `list`, `clear`.
      * `/clear`: bulk delete pesan (1-100 pesan).
      * `/timeout`: mute member dengan custom durasi menit.
  * **Build & Startup Test**: TypeScript kompilasi sukses (`npm run build`), startup boot berhasil terverifikasi.
* **2026-10-30 (Inisialisasi Proyek)**: Inisialisasi memori proyek, perumusan pilar fitur lengkap (Auto-mod lokal tanpa AI, Mod, Automation, Gamifikasi), serta penetapan prinsip arsitektur Dashboard-Ready.
