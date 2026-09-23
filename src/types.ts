export interface VideoFormat {
  id: string;
  label: string;
  kind: 'video' | 'audio';
  ext: string;
  height: number;
  abr: number;
  selector: string;
  filesizeText: string;
  qualityText: string;
}

export interface VideoEntry {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  extractor: string;
  formats: VideoFormat[];
  isPlaylist: boolean;
  entries: VideoEntry[];
}

export type EntryStatus = 'Queued' | 'Downloading' | 'Saved' | 'Failed' | 'Cancelled';

export interface DownloadItem {
  id: string;
  title: string;
  platform: string;
  fileName: string;
  uri: string;
  sizeBytes: number;
  timestamp: number;
  status: 'saved' | 'failed' | 'cancelled';
}

export interface DownloadProgress {
  percent: number;
  status: string;
  downloadedBytes: number;
  totalBytes: number;
}

export type Tab = 'Download' | 'History';

export interface PlatformItem {
  id: string;
  emoji: string;
  displayName: string;
  example: string;
}

export const PLATFORMS: PlatformItem[] = [
  { id: 'YouTube', emoji: '▶️', displayName: 'YouTube', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'TikTok', emoji: '🎵', displayName: 'TikTok', example: 'https://www.tiktok.com/@tiktok/video/7123456789012345678' },
  { id: 'FacebookReel', emoji: '🎬', displayName: 'FB Reel', example: 'https://www.facebook.com/reel/1234567890123456' },
  { id: 'FacebookProfile', emoji: '👤', displayName: 'FB Profile Reels', example: 'https://www.facebook.com/username/reels' },
  { id: 'Facebook', emoji: '👍', displayName: 'Facebook', example: 'https://www.facebook.com/watch/?v=1234567890123456' },
  { id: 'Instagram', emoji: '📸', displayName: 'Instagram', example: 'https://www.instagram.com/reel/ABC123xyz/' },
  { id: 'X', emoji: '🐦', displayName: 'X (Twitter)', example: 'https://x.com/i/status/1234567890123456789' },
  { id: 'Pinterest', emoji: '📌', displayName: 'Pinterest', example: 'https://www.pinterest.com/pin/123456789012345678/' },
  { id: 'Vimeo', emoji: '🎬', displayName: 'Vimeo', example: 'https://vimeo.com/123456789' },
  { id: 'Snapchat', emoji: '👻', displayName: 'Snapchat', example: 'https://www.snapchat.com/spotlight/ABC123' },
  { id: 'Reddit', emoji: '👽', displayName: 'Reddit', example: 'https://www.reddit.com/r/videos/comments/abc123/' },
  { id: 'Twitch', emoji: '🎮', displayName: 'Twitch', example: 'https://www.twitch.tv/videos/1234567890' },
  { id: 'Dailymotion', emoji: '📹', displayName: 'Dailymotion', example: 'https://www.dailymotion.com/video/x8abcde' },
];

export interface KhmerAudioFormat {
  id: string;
  extension: string;
  label: string;
  bitrate: string;
}

export const KHMER_AUDIO_FORMATS: KhmerAudioFormat[] = [
  { id: 'audio_mp3_320', extension: 'mp3', label: 'MP3 Audio', bitrate: '320 kbps · High Quality' },
  { id: 'audio_m4a', extension: 'm4a', label: 'M4A Audio', bitrate: '256 kbps · AAC' },
  { id: 'audio_wav', extension: 'wav', label: 'WAV Audio', bitrate: '1411 kbps · Lossless' },
];
