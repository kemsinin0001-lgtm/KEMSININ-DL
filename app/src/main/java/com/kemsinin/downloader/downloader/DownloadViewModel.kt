package com.kemsinin.downloader.downloader

import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class UiState(
    val url: String = "",
    val analyzing: Boolean = false,
    val video: VideoInfo? = null,
    val selectedFormat: Int = 0,
    val downloading: Boolean = false,
    val downloadingTitle: String = "",
    val progress: DownloadProgress? = null,
    val error: String? = null,
    val savedMessage: String? = null,
    val lastSavedUri: String? = null,
    val lastSavedTitle: String? = null,
    val selectedPlatform: Platform? = null,
    val tiktokMsToken: String = "",
    val tiktokChainToken: String = "",
    val youtubeCookies: String = "",
    val facebookCookies: String = "",
    val tiktokHint: Boolean = false,
    val youtubeHint: Boolean = false,
    val facebookHint: Boolean = false,
    val downloads: List<DownloadItem> = emptyList(),
    val tab: Tab = Tab.Download,
    val legacyStorageGranted: Boolean = Build.VERSION.SDK_INT > 28,
    val batchDownloading: Boolean = false,
    val batchCurrent: Int = 0,
    val batchTotal: Int = 0,
    val batchTitle: String = "",
    val batchFailed: Int = 0,
    val entryStatuses: List<EntryStatus> = emptyList(),
    val selectedEntryIndex: Int? = null,
    val selectedKhmerAudioFormat: KhmerAudioFormat = KhmerAudioFormat.MP3,
)

class DownloadViewModel(app: Application) : AndroidViewModel(app) {

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    private var currentJobId: String? = null
    private val prefs = app.getSharedPreferences("kemsinin_prefs", Application.MODE_PRIVATE)

    init {
        DownloadCallback.listener = { jobId, percent, status, downloadedBytes, totalBytes ->
            if (jobId == currentJobId) {
                _state.update {
                    it.copy(
                        progress = DownloadProgress(
                            percent = (percent.toFloat() / 100f).coerceIn(0f, 1f),
                            status = status,
                            downloadedBytes = downloadedBytes,
                            totalBytes = totalBytes,
                        ),
                    )
                }
            }
        }
        loadHistory()
        _state.update {
            it.copy(
                tiktokMsToken = prefs.getString("tiktok_ms_token", "") ?: "",
                tiktokChainToken = prefs.getString("tiktok_chain_token", "") ?: "",
                youtubeCookies = prefs.getString("youtube_cookies", "") ?: "",
                facebookCookies = prefs.getString("facebook_cookies", "") ?: "",
            )
        }
    }

    fun onUrlChange(value: String) {
        _state.update { it.copy(url = value, selectedPlatform = null, tiktokHint = false, facebookHint = false) }
    }

    fun selectPlatform(platform: Platform) {
        _state.update {
            it.copy(
                selectedPlatform = if (it.selectedPlatform == platform) null else platform,
                url = platform.example,
                tiktokHint = false,
                facebookHint = false,
            )
        }
    }

    fun setTiktokTokens(msToken: String, chainToken: String) {
        _state.update {
            it.copy(
                tiktokMsToken = msToken.trim(),
                tiktokChainToken = chainToken.trim(),
                savedMessage = getApplication<Application>().getString(com.kemsinin.downloader.R.string.settings_saved_msg),
                tiktokHint = false,
            )
        }
        prefs.edit()
            .putString("tiktok_ms_token", _state.value.tiktokMsToken)
            .putString("tiktok_chain_token", _state.value.tiktokChainToken)
            .apply()
    }

    fun clearTiktokTokens() {
        _state.update { it.copy(tiktokMsToken = "", tiktokChainToken = "") }
        prefs.edit()
            .remove("tiktok_ms_token")
            .remove("tiktok_chain_token")
            .apply()
    }

    fun setYoutubeCookies(value: String) {
        _state.update {
            it.copy(
                youtubeCookies = value.trim(),
                savedMessage = getApplication<Application>().getString(com.kemsinin.downloader.R.string.settings_saved_msg),
                youtubeHint = false,
            )
        }
        prefs.edit()
            .putString("youtube_cookies", _state.value.youtubeCookies)
            .apply()
    }

    fun clearYoutubeCookies() {
        _state.update { it.copy(youtubeCookies = "") }
        prefs.edit()
            .remove("youtube_cookies")
            .apply()
    }

    fun setFacebookCookies(value: String) {
        _state.update {
            it.copy(
                facebookCookies = value.trim(),
                savedMessage = getApplication<Application>().getString(com.kemsinin.downloader.R.string.settings_saved_msg),
                facebookHint = false,
            )
        }
        prefs.edit()
            .putString("facebook_cookies", _state.value.facebookCookies)
            .apply()
    }

    fun clearFacebookCookies() {
        _state.update { it.copy(facebookCookies = "") }
        prefs.edit()
            .remove("facebook_cookies")
            .apply()
    }

    fun setTab(tab: Tab) {
        _state.update { it.copy(tab = tab) }
    }

    fun setLegacyPermission(granted: Boolean) {
        _state.update { it.copy(legacyStorageGranted = granted) }
    }

    fun analyze() {
        val url = _state.value.url.trim()
        if (url.isBlank() || _state.value.analyzing) return
        _state.update {
            it.copy(
                analyzing = true,
                error = null,
                video = null,
                lastSavedUri = null,
                tiktokHint = false,
                youtubeHint = false,
                downloadingTitle = "",
                entryStatuses = emptyList(),
                selectedEntryIndex = null,
                batchDownloading = false,
                batchCurrent = 0,
                batchTotal = 0,
                batchTitle = "",
                batchFailed = 0,
            )
        }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val info = DownloadEngine.getInfo(url, cookiesFilePath())
                _state.update { it.copy(analyzing = false, video = info, selectedFormat = 0, tiktokHint = false, facebookHint = false) }
            } catch (e: Exception) {
                val message = friendlyError(e)
                _state.update {
                    it.copy(
                        analyzing = false,
                        error = message,
                        tiktokHint = isTikTokUrl(url) &&
                            it.tiktokMsToken.isBlank() &&
                            it.tiktokChainToken.isBlank(),
                        youtubeHint = isYouTubeUrl(url) &&
                            isBotError(message) &&
                            it.youtubeCookies.isBlank(),
                        facebookHint = isFacebookUrl(url) &&
                            isBotError(message) &&
                            it.facebookCookies.isBlank(),
                    )
                }
            }
        }
    }

    /** Writes the user's TikTok/YouTube/Facebook cookies to a Netscape-format file yt-dlp can read. */
    private fun cookiesFilePath(): String? {
        val ms = _state.value.tiktokMsToken
        val chain = _state.value.tiktokChainToken
        val yt = _state.value.youtubeCookies
        val fb = _state.value.facebookCookies
        if (ms.isBlank() && chain.isBlank() && yt.isBlank() && fb.isBlank()) return null
        val dir = File(getApplication<Application>().cacheDir, "cookies").apply { mkdirs() }
        val file = File(dir, "cookies.txt")
        val sb = StringBuilder("# Netscape HTTP Cookie File\n")
        if (ms.isNotBlank()) {
            sb.append("#HttpOnly_.tiktok.com\tTRUE\t/\tTRUE\t0\tms_token\t").append(ms).append('\n')
        }
        if (chain.isNotBlank()) {
            sb.append("#HttpOnly_.tiktok.com\tTRUE\t/\tTRUE\t0\ttt_chain_token\t").append(chain).append('\n')
        }
        if (yt.isNotBlank()) {
            // The user pastes the Cookie header value: "k1=v1; k2=v2; ..."
            yt.split(';').forEach { pair ->
                val idx = pair.indexOf('=')
                if (idx > 0) {
                    val key = pair.substring(0, idx).trim()
                    val value = pair.substring(idx + 1).trim()
                    if (key.isNotEmpty()) {
                        sb.append(".youtube.com\tTRUE\t/\tTRUE\t0\t")
                            .append(key).append('\t').append(value).append('\n')
                    }
                }
            }
        }
        if (fb.isNotBlank()) {
            // Facebook cookies from browser header: "c_user=...; xs=...; datr=..."
            fb.split(';').forEach { pair ->
                val idx = pair.indexOf('=')
                if (idx > 0) {
                    val key = pair.substring(0, idx).trim()
                    val value = pair.substring(idx + 1).trim()
                    if (key.isNotEmpty()) {
                        sb.append(".facebook.com\tTRUE\t/\tTRUE\t0\t")
                            .append(key).append('\t').append(value).append('\n')
                    }
                }
            }
        }
        file.writeText(sb.toString())
        return file.absolutePath
    }

    fun selectFormat(index: Int) {
        _state.update { it.copy(selectedFormat = index) }
    }

    fun selectKhmerAudioFormat(format: KhmerAudioFormat) {
        _state.update { state ->
            val video = state.video
            val formatIndex = if (video != null) {
                val found = video.formats.indexOfFirst { it.ext.equals(format.extension, ignoreCase = true) }
                if (found != -1) found else state.selectedFormat
            } else state.selectedFormat
            state.copy(selectedKhmerAudioFormat = format, selectedFormat = formatIndex)
        }
    }

    /** Selects/deselects a playlist entry for the "Download Single File" button. */
    fun selectEntry(index: Int) {
        _state.update {
            it.copy(selectedEntryIndex = if (it.selectedEntryIndex == index) null else index)
        }
    }

    fun download() {
        val video = _state.value.video ?: return
        startDownload(_state.value.url.trim(), video.title)
    }

    /** Downloads a single video from a playlist, using the selected format. */
    fun downloadEntry(entry: VideoEntry) {
        if (entry.url.isBlank()) return
        startDownload(entry.url.trim(), entry.title)
    }

    /** Shared single-video download flow (whole video or one playlist entry). */
    private fun startDownload(url: String, title: String) {
        val s = _state.value
        val video = s.video ?: return
        val format = video.formats.getOrNull(s.selectedFormat) ?: return
        if (s.downloading || s.batchDownloading) return

        val jobId = UUID.randomUUID().toString()
        currentJobId = jobId
        _state.update {
            it.copy(
                downloading = true,
                downloadingTitle = title,
                progress = DownloadProgress(0f, "downloading", 0, 0),
                error = null,
            )
        }
        viewModelScope.launch(Dispatchers.IO) {
            val app = getApplication<Application>()
            try {
                val dir = File(app.cacheDir, "downloads").apply { mkdirs() }
                val path = DownloadEngine.download(jobId, url, format.selector, dir.absolutePath, cookiesFilePath())
                val file = File(path)
                MediaSaver.saveToDownloads(app, file, title)
                    .fold(
                        onSuccess = { uri ->
                            val item = DownloadItem(
                                id = jobId,
                                title = title,
                                platform = platformName(video.extractor),
                                fileName = uri.lastPathSegment ?: file.name,
                                uri = if (uri.scheme == "content") uri.toString() else uri.path ?: "",
                                sizeBytes = file.length(),
                                timestamp = System.currentTimeMillis(),
                                status = "saved",
                            )
                            addToHistory(item)
                            _state.update {
                                it.copy(
                                    downloading = false,
                                    downloadingTitle = "",
                                    progress = null,
                                    savedMessage = app.getString(com.kemsinin.downloader.R.string.msg_saved_to_downloads),
                                    lastSavedUri = if (uri.scheme == "content") uri.toString() else uri.path ?: "",
                                    lastSavedTitle = title,
                                )
                            }
                        },
                        onFailure = { e ->
                            _state.update {
                                it.copy(
                                    downloading = false,
                                    downloadingTitle = "",
                                    progress = null,
                                    error = "Save failed: ${e.message}",
                                )
                            }
                        },
                    )
            } catch (e: Exception) {
                val cancelled = DownloadCallback.isCancelled(jobId)
                DownloadCallback.clear(jobId)
                currentJobId = null
                val message = if (cancelled) "cancelled" else friendlyError(e)
                _state.update {
                    it.copy(
                        downloading = false,
                        downloadingTitle = "",
                        progress = null,
                        error = message,
                        tiktokHint = !cancelled &&
                            isTikTokUrl(url) &&
                            it.tiktokMsToken.isBlank() &&
                            it.tiktokChainToken.isBlank(),
                        youtubeHint = !cancelled &&
                            isYouTubeUrl(url) &&
                            isBotError(message) &&
                            it.youtubeCookies.isBlank(),
                    )
                }
            }
        }
    }

    /** Downloads every video in a playlist sequentially into Downloads. */
    fun downloadAll() {
        val s = _state.value
        val video = s.video ?: return
        val all = video.entries
        val entries = all.filter { it.url.isNotBlank() }
        if (entries.isEmpty() || s.downloading || s.batchDownloading) return
        val format = video.formats.getOrNull(s.selectedFormat) ?: return

        val statuses = MutableList(all.size) { EntryStatus.Queued }
        _state.update {
            it.copy(
                batchDownloading = true,
                batchCurrent = 0,
                batchTotal = entries.size,
                batchTitle = "",
                batchFailed = 0,
                entryStatuses = statuses.toList(),
                error = null,
                progress = null,
            )
        }
        viewModelScope.launch(Dispatchers.IO) {
            val app = getApplication<Application>()
            var saved = 0
            var failed = 0
            var done = 0
            var cancelled = false
            all.forEachIndexed { index, entry ->
                if (entry.url.isBlank() || cancelled) return@forEachIndexed
                val jobId = UUID.randomUUID().toString()
                currentJobId = jobId
                done++
                statuses[index] = EntryStatus.Downloading
                _state.update {
                    it.copy(
                        entryStatuses = statuses.toList(),
                        batchCurrent = done,
                        batchTitle = entry.title,
                        progress = DownloadProgress(0f, "downloading", 0, 0),
                    )
                }
                try {
                    val dir = File(app.cacheDir, "downloads").apply { mkdirs() }
                    val path = DownloadEngine.download(jobId, entry.url, format.selector, dir.absolutePath, cookiesFilePath())
                    val file = File(path)
                    MediaSaver.saveToDownloads(app, file, entry.title)
                        .fold(
                            onSuccess = { uri ->
                                addToHistory(
                                    DownloadItem(
                                        id = jobId,
                                        title = entry.title,
                                        platform = platformName(video.extractor),
                                        fileName = uri.lastPathSegment ?: file.name,
                                        uri = if (uri.scheme == "content") uri.toString() else uri.path ?: "",
                                        sizeBytes = file.length(),
                                        timestamp = System.currentTimeMillis(),
                                        status = "saved",
                                    ),
                                )
                                statuses[index] = EntryStatus.Saved
                                saved++
                            },
                            onFailure = {
                                statuses[index] = EntryStatus.Failed
                                failed++
                            },
                        )
                } catch (e: Exception) {
                    if (DownloadCallback.isCancelled(jobId)) {
                        statuses[index] = EntryStatus.Cancelled
                    } else {
                        statuses[index] = EntryStatus.Failed
                        failed++
                    }
                    DownloadCallback.clear(jobId)
                }
                _state.update { it.copy(entryStatuses = statuses.toList()) }
                if (DownloadCallback.isCancelled(jobId)) {
                    cancelled = true
                    DownloadCallback.clear(jobId)
                }
            }
            currentJobId = null
            val message = if (failed == 0) {
                app.getString(com.kemsinin.downloader.R.string.msg_batch_saved, saved, entries.size)
            } else {
                app.getString(com.kemsinin.downloader.R.string.msg_batch_saved_failed, saved, entries.size, failed)
            }
            _state.update {
                it.copy(
                    downloading = false,
                    batchDownloading = false,
                    batchCurrent = 0,
                    batchTotal = 0,
                    batchTitle = "",
                    batchFailed = failed,
                    progress = null,
                    savedMessage = message,
                )
            }
        }
    }

    fun cancelDownload() {
        currentJobId?.let { DownloadCallback.markCancelled(it) }
    }

    fun consumeSavedMessage() {
        _state.update { it.copy(savedMessage = null) }
    }

    fun removeHistory(id: String) {
        _state.update { it.copy(downloads = it.downloads.filterNot { d -> d.id == id }) }
        persistHistory()
    }

    fun clearHistory() {
        _state.update { it.copy(downloads = emptyList()) }
        persistHistory()
    }

    private fun addToHistory(item: DownloadItem) {
        _state.update { it.copy(downloads = listOf(item) + it.downloads.take(49)) }
        persistHistory()
    }

    private fun persistHistory() {
        val arr = JSONArray()
        _state.value.downloads.forEach { item ->
            arr.put(
                JSONObject()
                    .put("id", item.id)
                    .put("title", item.title)
                    .put("platform", item.platform)
                    .put("fileName", item.fileName)
                    .put("uri", item.uri)
                    .put("sizeBytes", item.sizeBytes)
                    .put("timestamp", item.timestamp)
                    .put("status", item.status),
            )
        }
        prefs.edit().putString("history", arr.toString()).apply()
    }

    private fun loadHistory() {
        val raw = prefs.getString("history", null) ?: return
        val items = mutableListOf<DownloadItem>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                items.add(
                    DownloadItem(
                        id = o.getString("id"),
                        title = o.getString("title"),
                        platform = o.getString("platform"),
                        fileName = o.getString("fileName"),
                        uri = o.getString("uri"),
                        sizeBytes = o.getLong("sizeBytes"),
                        timestamp = o.getLong("timestamp"),
                        status = o.getString("status"),
                    ),
                )
            }
        } catch (_: Exception) {
        }
        if (items.isNotEmpty()) {
            _state.update { it.copy(downloads = items) }
        }
    }

    private fun friendlyError(e: Exception): String {
        val msg = e.message ?: e.cause?.message ?: return "Unknown error"
        return msg.removePrefix("ERROR: ")
    }

    private fun isTikTokUrl(url: String): Boolean =
        url.lowercase().contains("tiktok")

    private fun isYouTubeUrl(url: String): Boolean {
        val low = url.lowercase()
        return low.contains("youtube") || low.contains("youtu.be")
    }

    private fun isFacebookUrl(url: String): Boolean {
        val low = url.lowercase()
        return low.contains("facebook.com") || low.contains("fb.watch") || low.contains("fb.com")
    }

    private fun isBotError(message: String): Boolean {
        val low = message.lowercase()
        return low.contains("sign in to confirm") ||
            low.contains("not a bot") ||
            low.contains("login required") ||
            low.contains("log in") ||
            low.contains("must log in")
    }

    companion object {
        fun platformName(extractor: String): String = when {
            extractor.contains("Youtube") -> "YouTube"
            extractor.contains("TikTok") -> "TikTok"
            extractor.contains("Facebook") || extractor.contains("facebook") -> "Facebook"
            extractor.contains("Instagram") -> "Instagram"
            extractor.contains("Twitter") || extractor.contains("X") -> "X (Twitter)"
            extractor.contains("Pinterest") -> "Pinterest"
            extractor.contains("Vimeo") -> "Vimeo"
            extractor.contains("Snapchat") -> "Snapchat"
            extractor.contains("Reddit") -> "Reddit"
            extractor.contains("Twitch") -> "Twitch"
            extractor.contains("Dailymotion") -> "Dailymotion"
            else -> extractor.ifBlank { "Social media" }
        }
    }
}
