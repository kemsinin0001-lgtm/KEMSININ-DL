package com.kemsinin.downloader.downloader

import android.os.Handler
import android.os.Looper
import java.util.concurrent.ConcurrentHashMap

/**
 * Bridge between the embedded Python (yt-dlp) engine and Kotlin.
 * Python calls the @JvmStatic methods below to report download progress
 * and to check whether the user cancelled the download.
 */
object DownloadCallback {

    @Volatile
    var listener: ((String, Double, String, Long, Long) -> Unit)? = null

    private val cancelled = ConcurrentHashMap<String, Boolean>()
    private val mainHandler by lazy { Handler(Looper.getMainLooper()) }

    @JvmStatic
    fun onProgress(
        jobId: String,
        percent: Double,
        status: String,
        downloadedBytes: Long,
        totalBytes: Long,
    ) {
        val l = listener
        if (l != null) {
            mainHandler.post { l(jobId, percent, status, downloadedBytes, totalBytes) }
        }
    }

    @JvmStatic
    fun isCancelled(jobId: String): Boolean = cancelled[jobId] == true

    fun markCancelled(jobId: String) {
        cancelled[jobId] = true
    }

    fun clear(jobId: String) {
        cancelled.remove(jobId)
    }
}
