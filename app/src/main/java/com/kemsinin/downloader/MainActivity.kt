package com.kemsinin.downloader

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.kemsinin.downloader.downloader.DownloadEngine
import com.kemsinin.downloader.downloader.DownloadViewModel
import com.kemsinin.downloader.ui.DownloaderApp
import com.kemsinin.downloader.ui.theme.KemsininTheme

class MainActivity : ComponentActivity() {

    private val viewModel: DownloadViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        // Python must be started on the main thread, before any Python call.
        DownloadEngine.ensureStarted(this)
        setContent {
            KemsininTheme {
                DownloaderApp(viewModel)
            }
        }
    }
}
