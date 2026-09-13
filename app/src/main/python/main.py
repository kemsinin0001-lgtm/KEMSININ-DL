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
}

_BOT_ERROR_HINTS = (
    "sign in to confirm you're not a bot",
    "not a bot",
    "sign in to confirm your age",
    "login required",
    "log in",
)


def _is_bot_error(message):
    """True when a YouTube-style sign-in / bot-check error is raised."""
    low = (message or "").lower()
    return any(h in low for h in _BOT_ERROR_HINTS)


def _extract(url, opts, download):
    """Extract info, retrying once with the Android player client when YouTube
    answers with its "Sign in to confirm you're not a bot" check. The Android
    app client is usually served without the sign-in wall."""
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=download)
    except Exception as e:
        message = str(e) or ""
        if not _is_bot_error(message):
            raise
        print("[KEMSININ] YouTube bot-check hit; retrying with the Android player client")
        retry = dict(opts)
        retry["extractor_args"] = {"youtube": {"player_client": ["android", "web"]}}
        with yt_dlp.YoutubeDL(retry) as ydl:
            return ydl.extract_info(url, download=download)


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


def _pick_formats(info):
    """Curate a small list of practical formats."""
    formats = info.get("formats") or []
    candidates = []

    combined = [f for f in formats if _has_video(f) and _has_audio(f)]
    if combined:
        best = max(combined, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))
        candidates.append({
            "id": best.get("format_id") or "best",
            "label": "Best MP4 (video + audio)",
            "kind": "video",
            "ext": best.get("ext") or "mp4",
            "height": best.get("height") or 0,
            "abr": 0,
            "selector": "b[ext=mp4]/b",
        })

    video_only = [f for f in formats if _has_video(f) and not _has_audio(f)]
    if video_only:
        best = max(video_only, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))
        candidates.append({
            "id": best.get("format_id") or "bestvideo",
            "label": "Video only (highest quality)",
            "kind": "video",
            "ext": best.get("ext") or "mp4",
            "height": best.get("height") or 0,
            "abr": 0,
            "selector": "bestvideo[ext=mp4]/bestvideo",
        })

    audio_only = [f for f in formats if not _has_video(f) and _has_audio(f)]
    best_abr = max([f.get("abr") or 0 for f in audio_only], default=192)

    # Khmer Audio Segment Format Options: MP3, M4A, WAV
    candidates.append({
        "id": "khmer_mp3",
        "label": "Khmer Audio Segment (MP3 · 320kbps)",
        "kind": "audio",
        "ext": "mp3",
        "height": 0,
        "abr": max(best_abr, 320),
        "selector": "bestaudio/best",
    })
    candidates.append({
        "id": "khmer_m4a",
        "label": "Khmer Audio Segment (M4A · High Quality)",
        "kind": "audio",
        "ext": "m4a",
        "height": 0,
        "abr": max(best_abr, 256),
        "selector": "bestaudio[ext=m4a]/bestaudio",
    })
    candidates.append({
        "id": "khmer_wav",
        "label": "Khmer Audio Segment (WAV · Lossless Audio)",
        "kind": "audio",
        "ext": "wav",
        "height": 0,
        "abr": 1411,
        "selector": "bestaudio/best",
    })

    if not candidates:
        candidates.append({
            "id": "default",
            "label": "Default (best available)",
            "kind": "video",
            "ext": "mp4",
            "height": 0,
            "abr": 0,
            "selector": "b",
        })
    return candidates


def _generic_formats():
    """Format options for playlists, where per-video format tables differ."""
    return [
        {
            "id": "best",
            "label": "Best MP4 (video + audio)",
            "kind": "video",
            "ext": "mp4",
            "height": 0,
            "abr": 0,
            "selector": "b[ext=mp4]/b",
        },
        {
            "id": "khmer_mp3",
            "label": "Khmer Audio Segment (MP3 · 320kbps)",
            "kind": "audio",
            "ext": "mp3",
            "height": 0,
            "abr": 320,
            "selector": "bestaudio/best",
        },
        {
            "id": "khmer_m4a",
            "label": "Khmer Audio Segment (M4A · High Quality)",
            "kind": "audio",
            "ext": "m4a",
            "height": 0,
            "abr": 256,
            "selector": "bestaudio[ext=m4a]/bestaudio",
        },
        {
            "id": "khmer_wav",
            "label": "Khmer Audio Segment (WAV · Lossless Audio)",
            "kind": "audio",
            "ext": "wav",
            "height": 0,
            "abr": 1411,
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
    entry_list = [e for e in entries if e]
    return {
        "is_playlist": True,
        "title": info.get("title") or "Playlist",
        "thumbnail": info.get("thumbnail") or (
            entry_list[0].get("thumbnail") or "" if entry_list else ""
        ),
        "uploader": info.get("uploader") or info.get("channel") or "",
        "duration": 0,
        "extractor": info.get("extractor_key") or info.get("extractor") or "",
        "formats": _generic_formats(),
        "entries": [
            {
                "id": e.get("id") or "",
                "title": e.get("title") or "Untitled",
                "url": e.get("webpage_url") or e.get("url") or "",
                "thumbnail": e.get("thumbnail") or "",
                "duration": e.get("duration") or 0,
            }
            for e in entry_list
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
