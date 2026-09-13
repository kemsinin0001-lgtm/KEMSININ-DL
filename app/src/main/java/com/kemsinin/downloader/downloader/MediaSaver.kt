package com.kemsinin.downloader.downloader

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File

/**
 * Moves a finished download into the public Downloads folder so it is
 * visible to the user and other apps (gallery, file managers, …).
 *
 *  * API 29+: MediaStore.Downloads
 *  * API 26-28: public Downloads directory + media scan
 */
object MediaSaver {

    private val AUDIO_EXTS = setOf("m4a", "mp3", "aac", "opus", "ogg", "wav", "flac")

    fun saveToDownloads(context: Context, source: File, title: String): Result<Uri> = try {
        val cleanTitle = title.replace(Regex("[\\\\/:*?\"<>|]"), "_").trim().ifBlank { "video" }
        val ext = source.extension.ifBlank { "mp4" }
        val displayName = "$cleanTitle.$ext"
        val mime = if (ext.lowercase() in AUDIO_EXTS) "audio/*" else "video/*"
        val uri = if (Build.VERSION.SDK_INT >= 29) {
            saveModern(context, source, displayName, mime)
        } else {
            saveLegacy(context, source, displayName, mime)
        }
        Result.success(uri)
    } catch (e: Exception) {
        Result.failure(e)
    }

    private fun saveModern(context: Context, source: File, displayName: String, mime: String): Uri {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, displayName)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("Could not create MediaStore entry")
        try {
            resolver.openOutputStream(uri)?.use { out ->
                source.inputStream().use { it.copyTo(out) }
            } ?: throw IllegalStateException("Could not open output stream")
        } catch (e: Exception) {
            resolver.delete(uri, null, null)
            throw e
        }
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        return uri
    }

    private fun saveLegacy(context: Context, source: File, displayName: String, mime: String): Uri {
        val dir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "KEMSININ",
        )
        dir.mkdirs()
        val dest = File(dir, displayName)
        source.copyTo(dest, overwrite = true)
        MediaScannerConnection.scanFile(context, arrayOf(dest.absolutePath), arrayOf(mime)) { _, _ -> }
        val projection = arrayOf(MediaStore.Files.FileColumns._ID)
        val filesUri = MediaStore.Files.getContentUri("external")
        context.contentResolver.query(
            filesUri,
            projection,
            "${MediaStore.Files.FileColumns.DATA}=?",
            arrayOf(dest.absolutePath),
            null,
        )?.use { cursor ->
            if (cursor.moveToFirst()) {
                return Uri.withAppendedPath(filesUri, cursor.getLong(0).toString())
            }
        }
        // Fallback: expose the absolute path; the caller wraps it in a FileProvider.
        return Uri.fromFile(dest)
    }
}
