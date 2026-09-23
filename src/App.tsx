import React, { useState, useEffect, useRef } from 'react';
import { Download as DownloadIcon, History as HistoryIcon, CheckCircle2, X } from 'lucide-react';
import {
  Tab,
  PlatformItem,
  VideoInfo,
  DownloadItem,
  DownloadProgress,
  EntryStatus,
  VideoEntry,
} from './types';
import { Language, translations } from './i18n';
import { Header } from './components/Header';
import { DownloadTab } from './components/DownloadTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsDialog } from './components/SettingsDialog';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [tab, setTab] = useState<Tab>('Download');
  const [url, setUrl] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformItem | null>(null);

  // Analyzing state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Cookie hints
  const [tiktokHint, setTiktokHint] = useState<boolean>(false);
  const [youtubeHint, setYoutubeHint] = useState<boolean>(false);
  const [facebookHint, setFacebookHint] = useState<boolean>(false);

  // Saved tokens & cookies (stored in localStorage)
  const [tiktokMsToken, setTiktokMsToken] = useState<string>(() => localStorage.getItem('kemsinin_tiktok_ms') || '');
  const [tiktokChainToken, setTiktokChainToken] = useState<string>(() => localStorage.getItem('kemsinin_tiktok_chain') || '');
  const [youtubeCookies, setYoutubeCookies] = useState<string>(() => localStorage.getItem('kemsinin_youtube_cookies') || '');
  const [facebookCookies, setFacebookCookies] = useState<string>(() => localStorage.getItem('kemsinin_facebook_cookies') || '');

  // Downloading state
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadingTitle, setDownloadingTitle] = useState<string>('');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [lastSavedUri, setLastSavedUri] = useState<string | null>(null);

  // Playlist / Batch downloading
  const [batchDownloading, setBatchDownloading] = useState<boolean>(false);
  const [batchCurrent, setBatchCurrent] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [entryStatuses, setEntryStatuses] = useState<EntryStatus[]>([]);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);

  // History state
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const raw = localStorage.getItem('kemsinin_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // UI modals & toast
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Save history
  useEffect(() => {
    localStorage.setItem('kemsinin_history', JSON.stringify(downloads));
  }, [downloads]);

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setSelectedPlatform(null);
    setTiktokHint(false);
    setYoutubeHint(false);
    setFacebookHint(false);
    setError(null);
  };

  const handleSelectPlatform = (platform: PlatformItem) => {
    if (selectedPlatform?.id === platform.id) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(platform);
      setUrl(platform.example);
      setTiktokHint(false);
      setYoutubeHint(false);
      setFacebookHint(false);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl || analyzing) return;

    setAnalyzing(true);
    setError(null);
    setVideo(null);
    setLastSavedUri(null);
    setTiktokHint(false);
    setYoutubeHint(false);
    setFacebookHint(false);
    setBatchDownloading(false);
    setSelectedEntryIndex(null);

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanUrl,
          tiktokMsToken,
          tiktokChainToken,
          youtubeCookies,
          facebookCookies,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data.isBotError) {
          const lowUrl = cleanUrl.toLowerCase();
          if (lowUrl.includes('tiktok') && !tiktokMsToken) {
            setTiktokHint(true);
          } else if ((lowUrl.includes('youtube') || lowUrl.includes('youtu.be')) && !youtubeCookies) {
            setYoutubeHint(true);
          } else if (lowUrl.includes('facebook') && !facebookCookies) {
            setFacebookHint(true);
          }
        }
        setError(data.error || t.msg_analyze_error);
        return;
      }

      setVideo(data);
      setSelectedFormat(0);
      if (data.isPlaylist && Array.isArray(data.entries)) {
        setEntryStatuses(data.entries.map(() => 'Queued'));
      }
    } catch (err: any) {
      setError(err?.message || t.msg_analyze_error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Poll progress for downloading job
  const pollJobProgress = (jobId: string, itemTitle: string, platformName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      let interval: any = null;

      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/download/progress/${jobId}`);
          if (!res.ok) {
            clearInterval(interval);
            return reject(new Error('Job not found'));
          }

          const data: DownloadProgress & { fileName?: string; error?: string } = await res.json();

          setProgress({
            percent: data.percent,
            status: data.status,
            downloadedBytes: data.downloadedBytes,
            totalBytes: data.totalBytes,
          });

          if (data.status === 'finished') {
            clearInterval(interval);
            const downloadUrl = `/api/download/file/${jobId}`;

            // Add to history
            const historyItem: DownloadItem = {
              id: jobId,
              title: itemTitle,
              platform: platformName,
              fileName: data.fileName || `${itemTitle}.mp4`,
              uri: downloadUrl,
              sizeBytes: data.downloadedBytes || 15000000,
              timestamp: Date.now(),
              status: 'saved',
            };

            setDownloads((prev) => [historyItem, ...prev.filter((d) => d.id !== jobId)].slice(0, 50));

            // Trigger direct browser download
            triggerBrowserDownload(downloadUrl, data.fileName || `${itemTitle}.mp4`);

            resolve(downloadUrl);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            reject(new Error(data.error || 'Download failed'));
          } else if (data.status === 'cancelled') {
            clearInterval(interval);
            reject(new Error('Cancelled'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 500);

      pollIntervalRef.current = interval;
    });
  };

  const triggerBrowserDownload = (fileUri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = fileUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartDownload = async (targetUrl: string, targetTitle: string) => {
    if (!video || downloading || batchDownloading) return;

    const fmt = video.formats[selectedFormat] || video.formats[0];
    if (!fmt) return;

    setDownloading(true);
    setDownloadingTitle(targetTitle);
    setProgress({ percent: 0, status: 'starting', downloadedBytes: 0, totalBytes: 0 });
    setError(null);

    try {
      const resp = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          title: targetTitle,
          selector: fmt.selector,
          formatExt: fmt.ext,
          kind: fmt.kind,
          tiktokMsToken,
          tiktokChainToken,
          youtubeCookies,
          facebookCookies,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to start download');
      }

      const { jobId } = await resp.json();
      setCurrentJobId(jobId);

      const downloadUri = await pollJobProgress(jobId, targetTitle, video.extractor);
      setLastSavedUri(downloadUri);
      showToast(t.msg_saved_to_downloads);
    } catch (err: any) {
      if (err.message === 'Cancelled') {
        showToast(t.msg_download_cancelled);
      } else {
        setError(t.msg_download_failed(err?.message || 'Unknown error'));
      }
    } finally {
      setDownloading(false);
      setDownloadingTitle('');
      setProgress(null);
      setCurrentJobId(null);
    }
  };

  const handleCancelDownload = async () => {
    if (!currentJobId) return;
    try {
      await fetch(`/api/download/cancel/${currentJobId}`, { method: 'POST' });
    } catch {}
    setDownloading(false);
    setDownloadingTitle('');
    setProgress(null);
    setCurrentJobId(null);
  };

  // Batch download for playlists
  const handleDownloadAll = async () => {
    if (!video || !video.entries.length || downloading || batchDownloading) return;

    const fmt = video.formats[selectedFormat] || video.formats[0];
    if (!fmt) return;

    const all = video.entries.filter((e) => Boolean(e.url));
    if (all.length === 0) return;

    setBatchDownloading(true);
    setBatchCurrent(0);
    setBatchTotal(all.length);
    const statuses: EntryStatus[] = video.entries.map(() => 'Queued');
    setEntryStatuses([...statuses]);

    let savedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < all.length; i++) {
      const entry = all[i];
      const entryIdx = video.entries.indexOf(entry);

      statuses[entryIdx] = 'Downloading';
      setEntryStatuses([...statuses]);
      setBatchCurrent(i + 1);

      try {
        const resp = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: entry.url,
            title: entry.title,
            selector: fmt.selector,
            formatExt: fmt.ext,
            kind: fmt.kind,
            tiktokMsToken,
            tiktokChainToken,
            youtubeCookies,
            facebookCookies,
          }),
        });

        if (!resp.ok) throw new Error('Download failed');
        const { jobId } = await resp.json();

        await pollJobProgress(jobId, entry.title, video.extractor);
        statuses[entryIdx] = 'Saved';
        savedCount++;
      } catch {
        statuses[entryIdx] = 'Failed';
        failedCount++;
      }
      setEntryStatuses([...statuses]);
    }

    setBatchDownloading(false);
    setBatchCurrent(0);
    setBatchTotal(0);

    if (failedCount === 0) {
      showToast(t.msg_batch_saved(savedCount, all.length));
    } else {
      showToast(t.msg_batch_saved_failed(savedCount, all.length, failedCount));
    }
  };

  const handleSaveTokens = (ms: string, chain: string, yt: string, fb: string) => {
    setTiktokMsToken(ms);
    setTiktokChainToken(chain);
    setYoutubeCookies(yt);
    setFacebookCookies(fb);

    localStorage.setItem('kemsinin_tiktok_ms', ms);
    localStorage.setItem('kemsinin_tiktok_chain', chain);
    localStorage.setItem('kemsinin_youtube_cookies', yt);
    localStorage.setItem('kemsinin_facebook_cookies', fb);

    setTiktokHint(false);
    setYoutubeHint(false);
    setFacebookHint(false);
    setShowSettings(false);
    showToast(t.settings_saved_msg);
  };

  const handleClearTikTok = () => {
    setTiktokMsToken('');
    setTiktokChainToken('');
    localStorage.removeItem('kemsinin_tiktok_ms');
    localStorage.removeItem('kemsinin_tiktok_chain');
  };

  const handleClearYoutube = () => {
    setYoutubeCookies('');
    localStorage.removeItem('kemsinin_youtube_cookies');
  };

  const handleClearFacebook = () => {
    setFacebookCookies('');
    localStorage.removeItem('kemsinin_facebook_cookies');
  };

  const handleOpenFile = (uri: string) => {
    window.open(uri, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col items-center pb-24">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-sm font-semibold shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-xl px-4 py-4 md:py-6 space-y-5">
        {/* Header */}
        <Header
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'en' ? 'km' : 'en'))}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Tab Content */}
        {tab === 'Download' ? (
          <DownloadTab
            url={url}
            onUrlChange={handleUrlChange}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={handleSelectPlatform}
            analyzing={analyzing}
            onAnalyze={handleAnalyze}
            error={error}
            tiktokHint={tiktokHint}
            youtubeHint={youtubeHint}
            facebookHint={facebookHint}
            video={video}
            selectedFormat={selectedFormat}
            onSelectFormat={(idx) => setSelectedFormat(idx)}
            downloading={downloading}
            downloadingTitle={downloadingTitle}
            progress={progress}
            onDownload={() => video && handleStartDownload(url, video.title)}
            onCancelDownload={handleCancelDownload}
            lastSavedUri={lastSavedUri}
            onOpenFile={handleOpenFile}
            onOpenSettings={() => setShowSettings(true)}
            batchDownloading={batchDownloading}
            batchCurrent={batchCurrent}
            batchTotal={batchTotal}
            entryStatuses={entryStatuses}
            selectedEntryIndex={selectedEntryIndex}
            onSelectEntry={(idx) =>
              setSelectedEntryIndex((cur) => (cur === idx ? null : idx))
            }
            onDownloadAll={handleDownloadAll}
            onDownloadEntry={(entry) => handleStartDownload(entry.url, entry.title)}
            lang={lang}
          />
        ) : (
          <HistoryTab
            downloads={downloads}
            onOpen={(item) => handleOpenFile(item.uri)}
            onDelete={(id) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
            onClearAll={() => setDownloads([])}
            lang={lang}
          />
        )}
      </div>

      {/* Bottom Navigation Bar (Matching Compose Material 3 NavigationBar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-around">
          <button
            onClick={() => setTab('Download')}
            className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all ${
              tab === 'Download'
                ? 'text-indigo-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                tab === 'Download' ? 'bg-indigo-500/20 text-indigo-400' : ''
              }`}
            >
              <DownloadIcon className="w-5 h-5" />
            </div>
            <span className="text-xs">{t.tab_download}</span>
          </button>

          <button
            onClick={() => setTab('History')}
            className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all ${
              tab === 'History'
                ? 'text-indigo-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                tab === 'History' ? 'bg-indigo-500/20 text-indigo-400' : ''
              }`}
            >
              <HistoryIcon className="w-5 h-5" />
            </div>
            <span className="text-xs">{t.tab_history}</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsDialog
          initialMsToken={tiktokMsToken}
          initialChainToken={tiktokChainToken}
          initialYoutubeCookies={youtubeCookies}
          initialFacebookCookies={facebookCookies}
          onSave={handleSaveTokens}
          onClearTikTok={handleClearTikTok}
          onClearYoutube={handleClearYoutube}
          onClearFacebook={handleClearFacebook}
          onClose={() => setShowSettings(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
