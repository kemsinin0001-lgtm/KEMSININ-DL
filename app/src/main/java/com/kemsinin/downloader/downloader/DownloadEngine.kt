package com.kemsinin.downloader.downloader

import android.content.Context
import com.chaquo.python.PyObject
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

/** Thin wrapper around the embedded Python (yt-dlp) engine. */
object DownloadEngine {

    /** Must be called on the main thread, before any other call. */
    fun ensureStarted(context: Context) {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(context.applicationContext))
        }
    }

    fun getInfo(url: String, cookiesFile: String? = null): VideoInfo {
        val result = Python.getInstance()
            .getModule("main")
            .callAttr("get_info", url, cookiesFile.orEmpty())
        return parseVideoInfo(result)
    }

    fun download(jobId: String, url: String, selector: String, outDir: String, cookiesFile: String? = null): String {
        return Python.getInstance()
            .getModule("main")
            .callAttr("download", jobId, url, selector, outDir, cookiesFile.orEmpty())
            .toString()
    }

    // Chaquopy's toJava(Class) does NOT auto-convert containers (dicts/lists),
    // so we unwrap the Python views by hand with PyObject.asMap()/asList().
    private fun parseVideoInfo(result: PyObject): VideoInfo {
        val map = result.asMap().entries.associate { it.key.toString() to it.value }

        fun str(key: String): String = map[key]?.toString() ?: ""
        fun long(key: String): Long = map[key]?.toDouble()?.toLong() ?: 0L

        val formats = map["formats"]?.asList().orEmpty().mapNotNull { raw ->
            val fm = raw.asMap().entries.associate { it.key.toString() to it.value }
            VideoFormat(
                id = fm["id"]?.toString() ?: "",
                label = fm["label"]?.toString() ?: "",
                kind = fm["kind"]?.toString() ?: "video",
                ext = fm["ext"]?.toString() ?: "mp4",
                height = fm["height"]?.toDouble()?.toInt() ?: 0,
                abr = fm["abr"]?.toDouble()?.toInt() ?: 0,
                selector = fm["selector"]?.toString() ?: "b",
            )
        }
        val entries = map["entries"]?.asList().orEmpty().mapNotNull { raw ->
            val em = raw.asMap().entries.associate { it.key.toString() to it.value }
            VideoEntry(
                id = em["id"]?.toString() ?: "",
                title = em["title"]?.toString() ?: "",
                url = em["url"]?.toString() ?: "",
                thumbnail = em["thumbnail"]?.toString() ?: "",
                duration = em["duration"]?.toDouble()?.toLong() ?: 0L,
            )
        }
        return VideoInfo(
            title = str("title"),
            thumbnail = str("thumbnail"),
            uploader = str("uploader"),
            duration = long("duration"),
            extractor = str("extractor"),
            formats = formats,
            isPlaylist = map["is_playlist"]?.toBoolean() ?: false,
            entries = entries,
        )
    }
}
