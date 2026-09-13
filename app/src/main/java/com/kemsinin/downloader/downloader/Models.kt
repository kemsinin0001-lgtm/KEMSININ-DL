package com.kemsinin.downloader.downloader

data class VideoInfo(
    val title: String,
    val thumbnail: String,
    val uploader: String,
    val duration: Long,
    val extractor: String,
    val formats: List<VideoFormat>,
    val isPlaylist: Boolean = false,
    val entries: List<VideoEntry> = emptyList(),
)

/** One video inside a playlist, used for the "Download All" flow. */
data class VideoEntry(
    val id: String,
    val title: String,
    val url: String,
    val thumbnail: String,
    val duration: Long,
)

/** Per-video progress inside a playlist during a batch download. */
enum class EntryStatus { Queued, Downloading, Saved, Failed, Cancelled }

enum class KhmerAudioFormat(val extension: String, val label: String, val bitrate: String) {
    MP3("mp3", "MP3 Audio", "320 kbps · High Quality"),
    M4A("m4a", "M4A Audio", "256 kbps · AAC"),
    WAV("wav", "WAV Audio", "1411 kbps · Lossless"),
}

data class VideoFormat(
    val id: String,
    val label: String,
    val kind: String,
    val ext: String,
    val height: Int,
    val abr: Int,
    val selector: String,
) {
    val qualityText: String
        get() = if (kind == "audio") "$abr kbps · $ext" else "${height}p · $ext"
}

data class DownloadItem(
    val id: String,
    val title: String,
    val platform: String,
    val fileName: String,
    val uri: String,
    val sizeBytes: Long,
    val timestamp: Long,
    val status: String,
)

data class DownloadProgress(
    val percent: Float,
    val status: String,
    val downloadedBytes: Long,
    val totalBytes: Long,
)

enum class Tab { Download, History }

enum class Platform(val emoji: String, val example: String) {
    YouTube("▶️", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    TikTok("🎵", "https://www.tiktok.com/@tiktok/video/7123456789012345678"),
    Facebook("👍", "https://www.facebook.com/watch/?v=1234567890123456"),
    Instagram("📸", "https://www.instagram.com/reel/ABC123xyz/"),
    X("🐦", "https://x.com/i/status/1234567890123456789"),
    Pinterest("📌", "https://www.pinterest.com/pin/123456789012345678/"),
    Vimeo("🎬", "https://vimeo.com/123456789"),
    Snapchat("👻", "https://www.snapchat.com/spotlight/ABC123"),
    Reddit("👽", "https://www.reddit.com/r/videos/comments/abc123/"),
    Twitch("🎮", "https://www.twitch.tv/videos/1234567890"),
    Dailymotion("📹", "https://www.dailymotion.com/video/x8abcde"),
}
