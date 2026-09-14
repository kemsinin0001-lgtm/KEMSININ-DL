package com.kemsinin.downloader.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.kemsinin.downloader.R
import com.kemsinin.downloader.downloader.DownloadItem
import com.kemsinin.downloader.downloader.DownloadViewModel
import com.kemsinin.downloader.downloader.EntryStatus
import com.kemsinin.downloader.downloader.KhmerAudioFormat
import com.kemsinin.downloader.downloader.Platform
import com.kemsinin.downloader.downloader.Tab
import com.kemsinin.downloader.downloader.UiState
import com.kemsinin.downloader.downloader.VideoEntry
import com.kemsinin.downloader.downloader.VideoFormat
import com.kemsinin.downloader.downloader.VideoInfo
import com.kemsinin.downloader.downloader.DownloadViewModel.Companion.platformName
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ---------------------------------------------------------------------------
// App scaffold
// ---------------------------------------------------------------------------

@Composable
fun DownloaderApp(viewModel: DownloadViewModel) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(state.savedMessage) {
        state.savedMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.consumeSavedMessage()
        }
    }

    var pendingDownloadAction by remember { mutableStateOf<(() -> Unit)?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        viewModel.setLegacyPermission(granted)
        if (granted) {
            pendingDownloadAction?.invoke()
        } else {
            scope.launch { snackbarHostState.showSnackbar(context.getString(R.string.msg_storage_permission)) }
        }
        pendingDownloadAction = null
    }

    // Runs the action, requesting WRITE_EXTERNAL_STORAGE first on API 26-28 if needed.
    val runWithStoragePermission: (() -> Unit) -> Unit = { action ->
        val needsPermission = Build.VERSION.SDK_INT <= 28 &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
            ) != PackageManager.PERMISSION_GRANTED
        if (needsPermission && !state.legacyStorageGranted) {
            pendingDownloadAction = action
            permissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        } else {
            action()
        }
    }

    val onDownloadClick: () -> Unit = { runWithStoragePermission { viewModel.download() } }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = state.tab == Tab.Download,
                    onClick = { viewModel.setTab(Tab.Download) },
                    icon = { Icon(Icons.Filled.FileDownload, contentDescription = null) },
                    label = { Text(stringResource(R.string.tab_download)) },
                )
                NavigationBarItem(
                    selected = state.tab == Tab.History,
                    onClick = { viewModel.setTab(Tab.History) },
                    icon = { Icon(Icons.Filled.History, contentDescription = null) },
                    label = { Text(stringResource(R.string.tab_history)) },
                )
            }
        },
    ) { innerPadding ->
        Box(
            Modifier
                .padding(innerPadding)
                .fillMaxSize(),
        ) {
            when (state.tab) {
                Tab.Download -> DownloadTab(state, viewModel, snackbarHostState, onDownloadClick, runWithStoragePermission)
                Tab.History -> HistoryScreen(state, viewModel, snackbarHostState)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Download tab
// ---------------------------------------------------------------------------

@Composable
private fun DownloadTab(
    state: UiState,
    viewModel: DownloadViewModel,
    snackbar: SnackbarHostState,
    onDownloadClick: () -> Unit,
    runWithStoragePermission: (() -> Unit) -> Unit,
) {
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current

    var showSettings by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Header(onSettings = { showSettings = true })
        Spacer(Modifier.height(16.dp))

        // URL input
        OutlinedTextField(
            value = state.url,
            onValueChange = viewModel::onUrlChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            placeholder = {
                Text(stringResource(R.string.url_placeholder), maxLines = 1, overflow = TextOverflow.Ellipsis)
            },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            trailingIcon = {
                Row {
                    if (state.url.isNotEmpty()) {
                        IconButton(onClick = { viewModel.onUrlChange("") }) {
                            Icon(Icons.Filled.Clear, contentDescription = stringResource(R.string.action_clear))
                        }
                    }
                    IconButton(onClick = {
                        clipboard.getText()?.text?.let { viewModel.onUrlChange(it) }
                    }) {
                        Icon(Icons.Filled.ContentPaste, contentDescription = stringResource(R.string.action_paste))
                    }
                }
            },
        )
        Spacer(Modifier.height(16.dp))

        // Supported platforms
        Text(
            text = stringResource(R.string.platforms_label),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(Platform.entries) { platform ->
                FilterChip(
                    selected = state.selectedPlatform == platform,
                    onClick = { viewModel.selectPlatform(platform) },
                    label = { Text("${platform.emoji} ${platform.displayName}") },
                )
            }
        }
        state.selectedPlatform?.let {
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.hint_platform_selected),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(20.dp))

        // Analyze
        Button(
            onClick = viewModel::analyze,
            enabled = state.url.isNotBlank() && !state.analyzing && !state.downloading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(16.dp),
        ) {
            if (state.analyzing) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
                Spacer(Modifier.width(10.dp))
                Text(stringResource(R.string.action_analyzing), style = MaterialTheme.typography.titleMedium)
            } else {
                Text(stringResource(R.string.action_analyze), style = MaterialTheme.typography.titleMedium)
            }
        }

        if (state.tiktokHint) {
            Spacer(Modifier.height(12.dp))
            CookieHintBanner(
                title = stringResource(R.string.tiktok_hint_title),
                message = stringResource(R.string.tiktok_hint_msg),
                error = state.error.orEmpty(),
                onOpenSettings = { showSettings = true },
            )
        } else if (state.youtubeHint) {
            Spacer(Modifier.height(12.dp))
            CookieHintBanner(
                title = stringResource(R.string.youtube_hint_title),
                message = stringResource(R.string.youtube_hint_msg),
                error = state.error.orEmpty(),
                onOpenSettings = { showSettings = true },
            )
        } else if (state.facebookHint) {
            Spacer(Modifier.height(12.dp))
            CookieHintBanner(
                title = stringResource(R.string.facebook_hint_title),
                message = stringResource(R.string.facebook_hint_msg),
                error = state.error.orEmpty(),
                onOpenSettings = { showSettings = true },
            )
        } else {
            state.error?.let { message ->
                Spacer(Modifier.height(12.dp))
                ErrorBanner(message, onRetry = { viewModel.analyze() })
            }
        }

        state.video?.let { video ->
            Spacer(Modifier.height(20.dp))
            VideoCard(video)
            if (video.isPlaylist) {
                Spacer(Modifier.height(16.dp))
                PlaylistSection(
                    state = state,
                    viewModel = viewModel,
                    onDownloadEntry = { entry ->
                        runWithStoragePermission { viewModel.downloadEntry(entry) }
                    },
                )
            } else {
                Spacer(Modifier.height(16.dp))
                FormatSelectionCard(
                    formats = video.formats,
                    selectedIndex = state.selectedFormat,
                    onFormatSelected = { index -> viewModel.selectFormat(index) },
                )
                Spacer(Modifier.height(16.dp))

                if (state.downloading) {
                    ProgressCard(state, onCancel = viewModel::cancelDownload)
                } else {
                    Button(
                        onClick = onDownloadClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Icon(Icons.Filled.FileDownload, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.action_download), style = MaterialTheme.typography.titleMedium)
                    }
                    state.lastSavedUri?.let { uri ->
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = { openDownloadedFile(context, uri, snackbar) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                        ) {
                            Icon(Icons.Filled.OpenInNew, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text(stringResource(R.string.action_open))
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }

    if (showSettings) {
        SettingsDialog(
            msToken = state.tiktokMsToken,
            chainToken = state.tiktokChainToken,
            youtubeCookies = state.youtubeCookies,
            facebookCookies = state.facebookCookies,
            onSave = { ms, chain, yt, fb ->
                viewModel.setTiktokTokens(ms, chain)
                viewModel.setYoutubeCookies(yt)
                viewModel.setFacebookCookies(fb)
                showSettings = false
            },
            onClearTikTok = {
                viewModel.clearTiktokTokens()
                showSettings = false
            },
            onClearYoutube = {
                viewModel.clearYoutubeCookies()
                showSettings = false
            },
            onClearFacebook = {
                viewModel.clearFacebookCookies()
                showSettings = false
            },
            onDismiss = { showSettings = false },
        )
    }
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

@Composable
private fun Header(onSettings: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(listOf(Color(0xFF6D28D9), Color(0xFF8B5CF6), Color(0xFF22D3EE))),
            )
            .padding(20.dp),
    ) {
        Column {
            Text(
                text = stringResource(R.string.header_title),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.header_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.85f),
            )
        }
        IconButton(
            onClick = onSettings,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(44.dp),
        ) {
            Icon(
                Icons.Filled.Settings,
                contentDescription = stringResource(R.string.settings_title),
                tint = Color.White,
            )
        }
    }
}

@Composable
private fun SettingsDialog(
    msToken: String,
    chainToken: String,
    youtubeCookies: String,
    facebookCookies: String,
    onSave: (String, String, String, String) -> Unit,
    onClearTikTok: () -> Unit,
    onClearYoutube: () -> Unit,
    onClearFacebook: () -> Unit,
    onDismiss: () -> Unit,
) {
    var ms by remember { mutableStateOf(msToken) }
    var chain by remember { mutableStateOf(chainToken) }
    var yt by remember { mutableStateOf(youtubeCookies) }
    var fb by remember { mutableStateOf(facebookCookies) }
    var showHowTo by remember { mutableStateOf(false) }
    if (showHowTo) {
        HowToDialog(onDismiss = { showHowTo = false })
    } else {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.settings_title)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                Text(
                    text = stringResource(R.string.settings_tiktok_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                TextButton(onClick = { showHowTo = true }) {
                    Icon(
                        Icons.Filled.OpenInNew,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(stringResource(R.string.settings_how_to))
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = ms,
                    onValueChange = { ms = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    label = { Text(stringResource(R.string.settings_ms_token_label)) },
                    placeholder = { Text(stringResource(R.string.settings_token_placeholder)) },
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = chain,
                    onValueChange = { chain = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    label = { Text(stringResource(R.string.settings_chain_token_label)) },
                    placeholder = { Text(stringResource(R.string.settings_token_placeholder)) },
                )
                Spacer(Modifier.height(12.dp))
                TextButton(onClick = onClearTikTok) {
                    Text(stringResource(R.string.settings_clear), color = MaterialTheme.colorScheme.error)
                }

                Spacer(Modifier.height(18.dp))
                Text(
                    text = stringResource(R.string.settings_youtube_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = yt,
                    onValueChange = { yt = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    label = { Text(stringResource(R.string.settings_youtube_cookies_label)) },
                    placeholder = { Text(stringResource(R.string.settings_token_placeholder)) },
                )
                Spacer(Modifier.height(12.dp))
                TextButton(onClick = onClearYoutube) {
                    Text(stringResource(R.string.settings_clear_youtube), color = MaterialTheme.colorScheme.error)
                }

                Spacer(Modifier.height(18.dp))
                Text(
                    text = stringResource(R.string.settings_facebook_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = fb,
                    onValueChange = { fb = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    label = { Text(stringResource(R.string.settings_facebook_cookies_label)) },
                    placeholder = { Text(stringResource(R.string.settings_token_placeholder)) },
                )
                Spacer(Modifier.height(12.dp))
                TextButton(onClick = onClearFacebook) {
                    Text(stringResource(R.string.settings_clear_facebook), color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(ms, chain, yt, fb) }) {
                Text(stringResource(R.string.settings_save))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.settings_cancel))
            }
        },
    )
    }
}

@Composable
private fun HowToDialog(onDismiss: () -> Unit) {
    val steps = listOf(
        R.string.settings_howto_step1,
        R.string.settings_howto_step2,
        R.string.settings_howto_step3,
        R.string.settings_howto_step4,
        R.string.settings_howto_step5,
        R.string.settings_howto_step6,
        R.string.settings_howto_step7,
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.settings_howto_title)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                steps.forEachIndexed { index, res ->
                    Row(Modifier.padding(bottom = 10.dp), verticalAlignment = Alignment.Top) {
                        Text(
                            text = "${index + 1}.",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.width(28.dp),
                        )
                        Text(
                            text = stringResource(res),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.settings_howto_note),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.settings_ok))
            }
        },
    )
}

@Composable
private fun CookieHintBanner(
    title: String,
    message: String,
    error: String,
    onOpenSettings: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer,
        ),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.Filled.Settings,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            if (error.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                )
            }
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onOpenSettings,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(Icons.Filled.Settings, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(stringResource(R.string.tiktok_hint_open_settings))
            }
        }
    }
}

@Composable
private fun ErrorBanner(message: String, onRetry: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer,
        ),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.Filled.ErrorOutline,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(Modifier.height(6.dp))
            TextButton(onClick = onRetry) {
                Text(stringResource(R.string.action_retry), color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun VideoCard(video: VideoInfo) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(Modifier.padding(12.dp)) {
            Box(
                Modifier
                    .size(width = 128.dp, height = 76.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                if (video.thumbnail.isNotBlank()) {
                    AsyncImage(
                        model = video.thumbnail,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    Icon(
                        Icons.Filled.PlayCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(32.dp),
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = video.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (video.uploader.isNotBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "${stringResource(R.string.by)} ${video.uploader}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer,
                    ) {
                        Text(
                            text = platformName(video.extractor),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        )
                    }
                    if (video.duration > 0) {
                        Spacer(Modifier.width(8.dp))
                        Icon(
                            Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(14.dp),
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = formatDuration(video.duration),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FormatRow(format: VideoFormat, selected: Boolean, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        border = if (selected) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
            } else {
                MaterialTheme.colorScheme.surface
            },
        ),
    ) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            RadioButton(selected = selected, onClick = null)
            Spacer(Modifier.width(6.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = format.label,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = format.qualityText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                if (format.kind == "audio") Icons.Filled.MusicNote else Icons.Filled.PlayCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondary,
            )
        }
    }
}

@Composable
private fun FormatSelectionCard(
    formats: List<VideoFormat>,
    selectedIndex: Int,
    onFormatSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    // Determine active tab: 0 for Video (MP4), 1 for Audio (MP3)
    val currentlySelected = formats.getOrNull(selectedIndex)
    var selectedCategory by remember(formats) {
        mutableStateOf(if (currentlySelected?.kind == "audio") 1 else 0)
    }

    val videoFormats = formats.mapIndexed { idx, fmt -> idx to fmt }.filter { it.second.kind != "audio" }
    val audioFormats = formats.mapIndexed { idx, fmt -> idx to fmt }.filter { it.second.kind == "audio" }

    Card(
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp)) {
            // Category Selector: Video (MP4) vs Audio (MP3)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = selectedCategory == 0,
                    onClick = {
                        selectedCategory = 0
                        // If current selection is not video, auto-select first video option
                        if (currentlySelected?.kind == "audio" && videoFormats.isNotEmpty()) {
                            onFormatSelected(videoFormats.first().first)
                        }
                    },
                    label = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Icon(
                                Icons.Filled.PlayCircle,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = stringResource(R.string.tab_format_video),
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    },
                    modifier = Modifier.weight(1f),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                    ),
                )
                FilterChip(
                    selected = selectedCategory == 1,
                    onClick = {
                        selectedCategory = 1
                        // If current selection is not audio, auto-select first audio option
                        if (currentlySelected?.kind != "audio" && audioFormats.isNotEmpty()) {
                            onFormatSelected(audioFormats.first().first)
                        }
                    },
                    label = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Icon(
                                Icons.Filled.MusicNote,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = stringResource(R.string.tab_format_audio),
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    },
                    modifier = Modifier.weight(1f),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                    ),
                )
            }

            Spacer(Modifier.height(12.dp))

            Text(
                text = if (selectedCategory == 0) {
                    stringResource(R.string.label_video_resolution)
                } else {
                    stringResource(R.string.label_audio_quality)
                },
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
            )

            Spacer(Modifier.height(8.dp))

            val displayedFormats = if (selectedCategory == 0) videoFormats else audioFormats
            if (displayedFormats.isEmpty()) {
                // Fallback: show all formats if filtering returned none
                formats.forEachIndexed { index, format ->
                    FormatRow(
                        format = format,
                        selected = index == selectedIndex,
                        onClick = { onFormatSelected(index) },
                    )
                    Spacer(Modifier.height(6.dp))
                }
            } else {
                displayedFormats.forEach { (originalIndex, format) ->
                    FormatRow(
                        format = format,
                        selected = originalIndex == selectedIndex,
                        onClick = { onFormatSelected(originalIndex) },
                    )
                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }
}

@Composable
private fun ProgressCard(state: UiState, onCancel: () -> Unit) {
    val progress = state.progress
    val finalizing = progress?.status == "processing"
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp)) {
            if (state.downloadingTitle.isNotBlank()) {
                Text(
                    text = state.downloadingTitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(6.dp))
            }
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = if (finalizing) {
                        stringResource(R.string.status_finalizing)
                    } else {
                        "${((progress?.percent ?: 0f) * 100).toInt()}%"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                if (!finalizing) {
                    Text(
                        text = "${formatBytes(progress?.downloadedBytes ?: 0)} / ${formatBytes(progress?.totalBytes ?: 0)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { if (finalizing) 1f else progress?.percent ?: 0f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
            ) {
                Text(stringResource(R.string.action_cancel), color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun PlaylistSection(
    state: UiState,
    viewModel: DownloadViewModel,
    onDownloadEntry: (VideoEntry) -> Unit,
) {
    val video = state.video ?: return
    // The box: quality selector (profile) on top, then the video list.
    Card(
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(14.dp)) {
            FormatSelectionCard(
                formats = video.formats,
                selectedIndex = state.selectedFormat,
                onFormatSelected = { index -> viewModel.selectFormat(index) },
            )
            Spacer(Modifier.height(10.dp))
            HorizontalDivider()
            Spacer(Modifier.height(10.dp))
            // Profile of the selected video: thumbnail, title, duration, quality.
            state.selectedEntryIndex?.let { index ->
                video.entries.getOrNull(index)?.let { selected ->
                    EntryProfileCard(
                        entry = selected,
                        format = video.formats.getOrNull(state.selectedFormat),
                    )
                    Spacer(Modifier.height(10.dp))
                }
            }
            Text(
                text = stringResource(R.string.playlist_videos_label, video.entries.size),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(8.dp))
            // Bounded height so the list scrolls on its own inside the page's scroll column.
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 440.dp),
            ) {
                itemsIndexed(video.entries) { index, entry ->
                    PlaylistEntryRow(
                        entry = entry,
                        enabled = !state.downloading && !state.batchDownloading,
                        selected = state.selectedEntryIndex == index,
                        status = state.entryStatuses.getOrNull(index),
                        onSelect = { viewModel.selectEntry(index) },
                        onDownload = { onDownloadEntry(entry) },
                    )
                }
            }
        }
    }
    Spacer(Modifier.height(14.dp))
    when {
        state.batchDownloading -> BatchProgressCard(state, onCancel = viewModel::cancelDownload)
        state.downloading -> ProgressCard(state, onCancel = viewModel::cancelDownload)
        else -> {
            val selectedEntry = state.selectedEntryIndex?.let { video.entries.getOrNull(it) }
            Button(
                onClick = { selectedEntry?.let(onDownloadEntry) },
                enabled = selectedEntry != null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Icon(Icons.Filled.FileDownload, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.action_download_single), style = MaterialTheme.typography.titleMedium)
            }
            if (selectedEntry == null) {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.hint_select_video),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = selectedEntry.title,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(
                onClick = viewModel::downloadAll,
                enabled = video.entries.isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Icon(Icons.Filled.PlayCircle, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.action_download_all), style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@Composable
private fun EntryProfileCard(entry: VideoEntry, format: VideoFormat?) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f),
        ),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(width = 96.dp, height = 56.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                if (entry.thumbnail.isNotBlank()) {
                    AsyncImage(
                        model = entry.thumbnail,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    Icon(
                        Icons.Filled.PlayCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(24.dp),
                    )
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = entry.title,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (entry.duration > 0) {
                        Text(
                            text = formatDuration(entry.duration),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    format?.let {
                        Spacer(Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.secondaryContainer,
                        ) {
                            Text(
                                text = it.label,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaylistEntryRow(
    entry: VideoEntry,
    enabled: Boolean,
    selected: Boolean,
    status: EntryStatus?,
    onSelect: () -> Unit,
    onDownload: () -> Unit,
) {
    Card(
        onClick = onSelect,
        enabled = enabled,
        shape = RoundedCornerShape(14.dp),
        border = if (selected) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
            } else {
                MaterialTheme.colorScheme.surface
            },
        ),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(width = 96.dp, height = 56.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                if (entry.thumbnail.isNotBlank()) {
                    AsyncImage(
                        model = entry.thumbnail,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    Icon(
                        Icons.Filled.PlayCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(24.dp),
                    )
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = entry.title,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (entry.duration > 0) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = formatDuration(entry.duration),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.width(6.dp))
            when {
                status != null -> EntryStatusIcon(status)
                selected -> Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp),
                )
                enabled -> IconButton(
                    onClick = onDownload,
                    enabled = enabled,
                    modifier = Modifier.size(36.dp),
                ) {
                    Icon(
                        Icons.Filled.FileDownload,
                        contentDescription = stringResource(R.string.action_download),
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun EntryStatusIcon(status: EntryStatus) {
    when (status) {
        EntryStatus.Queued -> Icon(
            Icons.Filled.Schedule,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(18.dp),
        )
        EntryStatus.Downloading -> CircularProgressIndicator(
            modifier = Modifier.size(18.dp),
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 2.dp,
        )
        EntryStatus.Saved -> Icon(
            Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = Color(0xFF4CAF50),
            modifier = Modifier.size(20.dp),
        )
        EntryStatus.Failed -> Icon(
            Icons.Filled.ErrorOutline,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(20.dp),
        )
        EntryStatus.Cancelled -> Icon(
            Icons.Filled.Close,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(18.dp),
        )
    }
}

@Composable
private fun BatchProgressCard(state: UiState, onCancel: () -> Unit) {
    val progress = state.progress
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.status_batch_downloading, state.batchCurrent, state.batchTotal),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = state.batchTitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { progress?.percent ?: 0f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = "${formatBytes(progress?.downloadedBytes ?: 0)} / ${formatBytes(progress?.totalBytes ?: 0)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
            ) {
                Text(stringResource(R.string.action_cancel), color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

internal fun openDownloadedFile(context: android.content.Context, uriString: String, snackbar: SnackbarHostState) {
    fun notify(msg: String) {
        MainScope().launch { snackbar.showSnackbar(msg) }
    }
    try {
        val uri: Uri
        val mime: String
        if (uriString.startsWith("content://")) {
            uri = Uri.parse(uriString)
            mime = context.contentResolver.getType(uri) ?: "video/*"
        } else {
            val file = File(uriString)
            if (!file.exists()) {
                notify(context.getString(R.string.msg_file_not_found))
                return
            }
            uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            val ext = file.extension.lowercase()
            mime = if (ext in AUDIO_EXTS) "audio/*" else "video/*"
        }
        context.startActivity(
            Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
        )
    } catch (_: Exception) {
        notify(context.getString(R.string.msg_open_error))
    }
}

internal val AUDIO_EXTS = setOf("m4a", "mp3", "aac", "opus", "ogg", "wav", "flac")

internal fun formatDuration(seconds: Long): String {
    val h = seconds / 3600
    val m = (seconds % 3600) / 60
    val s = seconds % 60
    return if (h > 0) "%d:%02d:%02d".format(Locale.getDefault(), h, m, s)
    else "%02d:%02d".format(Locale.getDefault(), m, s)
}

internal fun formatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val kb = 1024.0
    val mb = kb * 1024
    val gb = mb * 1024
    return when {
        bytes >= gb -> "%.2f GB".format(Locale.getDefault(), bytes / gb)
        bytes >= mb -> "%.1f MB".format(Locale.getDefault(), bytes / mb)
        bytes >= kb -> "%.0f KB".format(Locale.getDefault(), bytes / kb)
        else -> "$bytes B"
    }
}

internal fun formatDate(timestamp: Long): String =
    SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault()).format(Date(timestamp))

internal fun isAudioFile(item: DownloadItem): Boolean {
    val ext = item.fileName.substringAfterLast('.', "").lowercase()
    return ext in AUDIO_EXTS
}
