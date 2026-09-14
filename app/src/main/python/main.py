"""KEMSININ Downloader — Python engine built on yt-dlp.

This module is embedded in the Android app via Chaquopy. It exposes two
functions used from Kotlin:

  * get_info(url) -> dict with title, thumbnail, uploader, duration,
    extractor, a curated list of downloadable formats, and (for playlist
    URLs) is_playlist=True plus a list of video entries.
  * download(job_id, url, selector, out_dir) -> absolute path of the
    downloaded file, streaming progress back to Kotlin through the
    DownloadCallback Java class.
"""

import os

import yt_dlp
from com.kemsinin.downloader.downloader import DownloadCallback

# Playlists are processed by default (noplaylist unset). download() forces
# noplaylist so a single entry URL never expands back into its playlist.
_BASE_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "socket_timeout": 30,
    "retries": 3,
    "fragment_retries": 3,
    "http_headers": {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    },
}

_BOT_ERROR_HINTS = (
    "sign in to confirm you're not a bot",
    "not a bot",
    "sign in to confirm your age",
    "login required",
    "log in",
    "must log in",
    "login to facebook",
)


def _is_bot_error(message):
    """True when a sign-in or bot-check error is raised."""
    low = (message or "").lower()
    return any(h in low for h in _BOT_ERROR_HINTS)


def _is_facebook_url(url):
    """Detect if URL is from Facebook (video, reel, or profile)."""
    low = (url or "").lower()
    return "facebook.com" in low or "fb.watch" in low or "fb.com" in low


def _is_facebook_profile_or_reels(url):
    """True when the URL is a Facebook profile/page reels/videos collection."""
    low = (url or "").lower()
    if not _is_facebook_url(low):
        return False
    # If it's a specific reel or video watch URL, it's a single video
    if "/reel/" in low or "/videos/" in low and any(c.isdigit() for c in low):
        # Could still be /user/videos/ tab if no ID
        parts = [p for p in low.split("?")[0].split("/") if p]
        if parts and parts[-1] in ("reels", "videos"):
            return True
        return False
    if "/watch" in low or "fb.watch" in low:
        return False
    # General profile URL or /reels /videos path
    return any(keyword in low for keyword in ("/reels", "/videos", "profile.php")) or ("facebook.com/" in low and "/" in low.split("facebook.com/")[1])


def _extract(url, opts, download):
    """Extract info, with specialized platform fallbacks (YouTube client retry & Facebook)."""
    run_opts = dict(opts)
    if _is_facebook_url(url):
        # Ensure Facebook reels and profiles extract cleanly
        run_opts["extract_flat"] = "in_playlist"
        # Bound playlist/profile extraction to first 50 videos so it won't hang indefinitely
        run_opts["playlistend"] = 50

    try:
        with yt_dlp.YoutubeDL(run_opts) as ydl:
            return ydl.extract_info(url, download=download)
    except Exception as e:
        message = str(e) or ""
        if not _is_bot_error(message):
            raise
        if "youtube" in url.lower() or "youtu.be" in url.lower():
            print("[KEMSININ] YouTube bot-check hit; retrying with the Android player client")
            retry = dict(run_opts)
            retry["extractor_args"] = {"youtube": {"player_client": ["android", "web"]}}
            with yt_dlp.YoutubeDL(retry) as ydl:
                return ydl.extract_info(url, download=download)
        raise


def _entry(info):
    if info is None:
        raise RuntimeError("No video information found")
    if "entries" in info and info.get("entries"):
        return info["entries"][0]
    return info


def _has_video(f):
    return bool(f.get("vcodec") and f.get("vcodec") != "none")


def _has_audio(f):
    return bool(f.get("acodec") and f.get("acodec") != "none")


def _format_filesize(bytes_val):
    if not bytes_val or bytes_val <= 0:
        return ""
    mb = bytes_val / (1024.0 * 1024.0)
    if mb >= 1000:
        return "%.1f GB" % (mb / 1024.0)
    return "%.1f MB" % mb


def _pick_formats(info):
    """Curate a clean list of video resolutions (1080p, 720p, 480p, 360p, Best) and audio formats (MP3, M4A, WAV)."""
    formats = info.get("formats") or []
    candidates = []

    # 1. Best Quality (MP4 Video + Audio)
    combined = [f for f in formats if _has_video(f) and _has_audio(f)]
    all_videos = [f for f in formats if _has_video(f)]
    max_height = max([f.get("height") or 0 for f in all_videos], default=0)

    # Standard Target Resolutions: 1080, 720, 480, 360
    target_res = [
        (1080, "1080p FHD", "b[height<=1080][ext=mp4]/bestvideo[height<=1080]+bestaudio/b[height<=1080]/b"),
        (720, "720p HD", "b[height<=720][ext=mp4]/bestvideo[height<=720]+bestaudio/b[height<=720]/b"),
        (480, "480p SD", "b[height<=480][ext=mp4]/bestvideo[height<=480]+bestaudio/b[height<=480]/b"),
        (360, "360p (Data Saver)", "b[height<=360][ext=mp4]/bestvideo[height<=360]+bestaudio/b[height<=360]/b"),
    ]

    # Best Available MP4
    best_combined = max(combined, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0)) if combined else None
    best_sz = (best_combined.get("filesize") or best_combined.get("filesize_approx")) if best_combined else 0
    candidates.append({
        "id": "best_mp4",
        "label": "Best Quality MP4 (គុណភាពខ្ពស់បំផុត)",
        "kind": "video",
        "ext": "mp4",
        "height": max_height or (best_combined.get("height") or 0 if best_combined else 0),
        "abr": 0,
        "filesize_text": _format_filesize(best_sz),
        "selector": "b[ext=mp4]/bestvideo[ext=mp4]+bestaudio/b",
    })

    # Add available resolution tiers if the video supports them
    for h, label, selector in target_res:
        # Check if video has stream matching or higher than this resolution, or if max_height is close
        matching = [f for f in all_videos if (f.get("height") or 0) == h]
        sz = 0
        if matching:
            m = matching[0]
            sz = m.get("filesize") or m.get("filesize_approx") or 0
        elif max_height >= h:
            pass  # downscale/fallback available in yt-dlp
        else:
            continue  # don't advertise 1080p for a 360p video

        candidates.append({
            "id": "mp4_%dp" % h,
            "label": "%s (MP4)" % label,
            "kind": "video",
            "ext": "mp4",
            "height": h,
            "abr": 0,
            "filesize_text": _format_filesize(sz),
            "selector": selector,
        })

    # Audio Formats (MP3, M4A, WAV)
    audio_only = [f for f in formats if not _has_video(f) and _has_audio(f)]
    best_abr = max([f.get("abr") or 0 for f in audio_only], default=192)
    audio_sz = 0
    if audio_only:
        a = audio_only[0]
        audio_sz = a.get("filesize") or a.get("filesize_approx") or 0

    candidates.append({
        "id": "audio_mp3_320",
        "label": "MP3 Audio (320 kbps · High Quality)",
        "kind": "audio",
        "ext": "mp3",
        "height": 0,
        "abr": 320,
        "filesize_text": _format_filesize(audio_sz) or "~5 MB",
        "selector": "bestaudio/best",
    })
    candidates.append({
        "id": "audio_mp3_192",
        "label": "MP3 Audio (192 kbps · Standard)",
        "kind": "audio",
        "ext": "mp3",
        "height": 0,
        "abr": 192,
        "filesize_text": _format_filesize(int(audio_sz * 0.6)) if audio_sz else "~3 MB",
        "selector": "bestaudio/best",
    })
    candidates.append({
        "id": "audio_m4a",
        "label": "M4A Audio (256 kbps · AAC)",
        "kind": "audio",
        "ext": "m4a",
        "height": 0,
        "abr": 256,
        "filesize_text": _format_filesize(audio_sz) or "~4 MB",
        "selector": "bestaudio[ext=m4a]/bestaudio/best",
    })
    candidates.append({
        "id": "audio_wav",
        "label": "WAV Audio (Lossless · 1411 kbps)",
        "kind": "audio",
        "ext": "wav",
        "height": 0,
        "abr": 1411,
        "filesize_text": "~30 MB",
        "selector": "bestaudio/best",
    })

    return candidates


def _generic_formats():
    """Format options for profiles and playlists (all resolutions & audio)."""
    return [
        {
            "id": "best_mp4",
            "label": "Best Quality MP4 (គុណភាពខ្ពស់បំផុត)",
            "kind": "video",
            "ext": "mp4",
            "height": 1080,
            "abr": 0,
            "filesize_text": "",
            "selector": "b[ext=mp4]/bestvideo[ext=mp4]+bestaudio/b",
        },
        {
            "id": "mp4_1080p",
            "label": "1080p FHD (MP4)",
            "kind": "video",
            "ext": "mp4",
            "height": 1080,
            "abr": 0,
            "filesize_text": "",
            "selector": "b[height<=1080][ext=mp4]/bestvideo[height<=1080]+bestaudio/b[height<=1080]/b",
        },
        {
            "id": "mp4_720p",
            "label": "720p HD (MP4)",
            "kind": "video",
            "ext": "mp4",
            "height": 720,
            "abr": 0,
            "filesize_text": "",
            "selector": "b[height<=720][ext=mp4]/bestvideo[height<=720]+bestaudio/b[height<=720]/b",
        },
        {
            "id": "mp4_480p",
            "label": "480p SD (MP4)",
            "kind": "video",
            "ext": "mp4",
            "height": 480,
            "abr": 0,
            "filesize_text": "",
            "selector": "b[height<=480][ext=mp4]/bestvideo[height<=480]+bestaudio/b[height<=480]/b",
        },
        {
            "id": "mp4_360p",
            "label": "360p Data Saver (MP4)",
            "kind": "video",
            "ext": "mp4",
            "height": 360,
            "abr": 0,
            "filesize_text": "",
            "selector": "b[height<=360][ext=mp4]/bestvideo[height<=360]+bestaudio/b[height<=360]/b",
        },
        {
            "id": "audio_mp3_320",
            "label": "MP3 Audio (320 kbps · High Quality)",
            "kind": "audio",
            "ext": "mp3",
            "height": 0,
            "abr": 320,
            "filesize_text": "~5 MB",
            "selector": "bestaudio/best",
        },
        {
            "id": "audio_mp3_192",
            "label": "MP3 Audio (192 kbps · Standard)",
            "kind": "audio",
            "ext": "mp3",
            "height": 0,
            "abr": 192,
            "filesize_text": "~3 MB",
            "selector": "bestaudio/best",
        },
        {
            "id": "audio_m4a",
            "label": "M4A Audio (256 kbps · AAC)",
            "kind": "audio",
            "ext": "m4a",
            "height": 0,
            "abr": 256,
            "filesize_text": "~4 MB",
            "selector": "bestaudio[ext=m4a]/bestaudio/best",
        },
        {
            "id": "audio_wav",
            "label": "WAV Audio (Lossless · 1411 kbps)",
            "kind": "audio",
            "ext": "wav",
            "height": 0,
            "abr": 1411,
            "filesize_text": "~30 MB",
            "selector": "bestaudio/best",
        },
    ]


def _apply_cookies(opts, cookies_file):
    """Attach a Netscape cookies file (e.g. from the user's TikTok settings).

    Some sites (TikTok in particular) serve a bot-check page to clients that
    don't send the cookies a logged-in browser would have. Passing the file lets
    yt-dlp include those cookies; it only ever sends them to the matching domain.
    """
    if cookies_file:
        opts["cookies"] = cookies_file
        print("[KEMSININ] using cookies file: %s" % cookies_file)
    return opts


def _video_result(info):
    return {
        "is_playlist": False,
        "title": info.get("title") or "Untitled",
        "thumbnail": info.get("thumbnail") or "",
        "uploader": info.get("uploader") or info.get("channel") or "",
        "duration": info.get("duration") or 0,
        "extractor": info.get("extractor_key") or info.get("extractor") or "",
        "formats": _pick_formats(info),
        "entries": [],
    }


def _playlist_result(info, entries):
    # entries may be a generator or list
    entry_list = []
    for e in entries:
        if not e:
            continue
        entry_list.append(e)
        if len(entry_list) >= 50:  # Cap at 50 to ensure responsiveness on mobile
            break

    return {
        "is_playlist": True,
        "title": info.get("title") or "Facebook / Social Collection",
        "thumbnail": info.get("thumbnail") or (
            entry_list[0].get("thumbnail") or "" if entry_list else ""
        ),
        "uploader": info.get("uploader") or info.get("channel") or "",
        "duration": 0,
        "extractor": info.get("extractor_key") or info.get("extractor") or "Facebook",
        "formats": _generic_formats(),
        "entries": [
            {
                "id": e.get("id") or "",
                "title": e.get("title") or ("Facebook Reel #" + str(i + 1)),
                "url": e.get("webpage_url") or e.get("url") or (
                    "https://www.facebook.com/reel/" + str(e.get("id")) if e.get("id") else ""
                ),
                "thumbnail": e.get("thumbnail") or "",
                "duration": e.get("duration") or 0,
            }
            for i, e in enumerate(entry_list)
        ],
    }


def get_info(url, cookies_file=""):
    """Extract metadata about a video or playlist without downloading.

    Playlist URLs return is_playlist=True plus one lightweight entry per
    video (id, title, url, thumbnail, duration). Single videos return
    is_playlist=False plus the curated format table.

    Playlist extraction skips entries that fail individually (age-restricted,
    private or deleted videos) so the rest of the playlist still loads.
    """
    opts = _apply_cookies(dict(_BASE_OPTS), cookies_file)
    opts["skip_download"] = True

    def extract(ignore_errors):
        run_opts = dict(opts)
        run_opts["ignoreerrors"] = ignore_errors
        try:
            return _extract(url, run_opts, download=False)
        except Exception:
            if ignore_errors:
                return None
            raise

    info = extract(True)
    if info is None:
        # A single video (or a playlist whose every entry failed): re-extract
        # without ignoreerrors so the real error message reaches the user.
        info = extract(False)
    if info is None:
        raise RuntimeError("No video information found")
    entries = info.get("entries")
    if entries is not None:
        return _playlist_result(info, entries)
    return _video_result(info)


def download(job_id, url, selector, out_dir, cookies_file=""):
    """Download a video into out_dir and return the resulting file path."""
    def hook(d):
        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes") or 0
            percent = (downloaded / total) * 100.0 if total else 0.0
            DownloadCallback.onProgress(job_id, percent, status, int(downloaded), int(total))
        elif status == "finished":
            DownloadCallback.onProgress(job_id, 100.0, "processing", 0, 0)
        if DownloadCallback.isCancelled(job_id):
            raise yt_dlp.utils.DownloadCancelled("Download cancelled by user")

    opts = _apply_cookies(dict(_BASE_OPTS), cookies_file)
    opts["noplaylist"] = True  # each call handles exactly one video
    opts["format"] = selector
    opts["outtmpl"] = os.path.join(out_dir, "%(title).100B [%(id)s].%(ext)s")
    opts["progress_hooks"] = [hook]

    def do_extract(use_android_client):
        run_opts = dict(opts)
        if use_android_client:
            run_opts["extractor_args"] = {"youtube": {"player_client": ["android", "web"]}}
        with yt_dlp.YoutubeDL(run_opts) as ydl:
            info = _entry(ydl.extract_info(url, download=True))
            path = None
            requested = info.get("requested_downloads")
            if isinstance(requested, list) and requested:
                fp = requested[0].get("filepath") or requested[0].get("_filename")
                if fp:
                    path = fp
            if not path:
                path = ydl.prepare_filename(info)
            return path

    try:
        path = do_extract(False)
    except Exception as e:
        if not _is_bot_error(str(e) or ""):
            raise
        print("[KEMSININ] YouTube bot-check hit; retrying with the Android player client")
        path = do_extract(True)

    if not path or not os.path.exists(path):
        files = [os.path.join(out_dir, f) for f in os.listdir(out_dir)]
        files = [f for f in files if os.path.isfile(f)]
        if files:
            path = max(files, key=os.path.getmtime)
    if not path or not os.path.exists(path):
        raise RuntimeError("Download finished but the file was not found")
    return path
