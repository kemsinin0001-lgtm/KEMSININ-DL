# KEMSININ Downloader (React + Express)

A high-performance video & audio downloader web application ported from Android (Jetpack Compose / Chaquopy) to React with Tailwind CSS and an Express backend wrapping the high-performance `yt-dlp` media extraction engine.

## Features Preserved & Enhanced

- **Multi-Platform Support**: YouTube, TikTok, Facebook Reels & Profiles, Instagram, X (Twitter), Pinterest, Vimeo, Snapchat, Reddit, Twitch, Dailymotion.
- **Video Resolutions**: High definition MP4 formats (Best Quality, 1080p FHD, 720p HD, 480p SD, 360p Data Saver).
- **Khmer & Audio Extraction**: High quality MP3 (320 kbps HQ, 192 kbps), AAC M4A (256 kbps), and Lossless WAV (1411 kbps).
- **Playlist & Batch Downloads**: Sequential batch downloader with real-time per-entry tracking and progress reporting.
- **Bot-check & Token Management**: Dedicated settings dialog for TikTok `ms_token`, `tt_chain_token`, YouTube Cookie headers, and Facebook tokens.
- **Full Localization**: English & Khmer (ភាសាខ្មែរ) with instant language switching.
- **Download History**: Offline-persisted history tab with one-click media save/open, individual deletion, and history clearing.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js 22, Express, `yt-dlp`, `ffmpeg`
- **Languages**: TypeScript, HTML5, CSS3

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Build for production
npm run build
```
