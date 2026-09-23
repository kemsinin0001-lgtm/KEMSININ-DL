import React from 'react';
import {
  Search,
  ClipboardPaste,
  X,
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { PLATFORMS, PlatformItem, VideoInfo, VideoFormat, VideoEntry, DownloadProgress, EntryStatus } from '../types';
import { Language, translations } from '../i18n';
import { VideoCard } from './VideoCard';
import { FormatSelectionCard } from './FormatSelectionCard';
import { PlaylistSection } from './PlaylistSection';
import { ProgressCard } from './ProgressCard';
import { CookieHintBanner } from './CookieHintBanner';

interface DownloadTabProps {
  url: string;
  onUrlChange: (value: string) => void;
  selectedPlatform: PlatformItem | null;
  onSelectPlatform: (platform: PlatformItem) => void;
  analyzing: boolean;
  onAnalyze: () => void;
  error: string | null;
  tiktokHint: boolean;
  youtubeHint: boolean;
  facebookHint: boolean;
  video: VideoInfo | null;
  selectedFormat: number;
  onSelectFormat: (index: number) => void;
  downloading: boolean;
  downloadingTitle: string;
  progress: DownloadProgress | null;
  onDownload: () => void;
  onCancelDownload: () => void;
  lastSavedUri: string | null;
  onOpenFile: (uri: string) => void;
  onOpenSettings: () => void;
  batchDownloading: boolean;
  batchCurrent: number;
  batchTotal: number;
  entryStatuses: EntryStatus[];
  selectedEntryIndex: number | null;
  onSelectEntry: (index: number) => void;
  onDownloadAll: () => void;
  onDownloadEntry: (entry: VideoEntry) => void;
  lang: Language;
}

export const DownloadTab: React.FC<DownloadTabProps> = ({
  url,
  onUrlChange,
  selectedPlatform,
  onSelectPlatform,
  analyzing,
  onAnalyze,
  error,
  tiktokHint,
  youtubeHint,
  facebookHint,
  video,
  selectedFormat,
  onSelectFormat,
  downloading,
  downloadingTitle,
  progress,
  onDownload,
  onCancelDownload,
  lastSavedUri,
  onOpenFile,
  onOpenSettings,
  batchDownloading,
  batchCurrent,
  batchTotal,
  entryStatuses,
  selectedEntryIndex,
  onSelectEntry,
  onDownloadAll,
  onDownloadEntry,
  lang,
}) => {
  const t = translations[lang];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text.trim());
      }
    } catch {
      // Fallback: prompt or ignore if permission denied
    }
  };

  return (
    <div className="space-y-5">
      {/* URL Input Box */}
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-semibold text-slate-300">
          {t.url_label}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim() && !analyzing && !downloading) {
                onAnalyze();
              }
            }}
            placeholder={t.url_placeholder}
            className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm md:text-base transition-all shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {url && (
              <button
                onClick={() => onUrlChange('')}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                title={t.action_clear}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handlePaste}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-cyan-300 border border-slate-700 transition-all cursor-pointer"
              title={t.action_paste}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.action_paste}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supported Platforms Filter Chips */}
      <div className="space-y-2">
        <div className="text-xs md:text-sm font-semibold text-slate-300">
          {t.platforms_label}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PLATFORMS.map((platform) => {
            const isSelected = selectedPlatform?.id === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => onSelectPlatform(platform)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{platform.emoji}</span>
                <span>{platform.displayName}</span>
              </button>
            );
          })}
        </div>

        {selectedPlatform && (
          <p className="text-xs text-indigo-300/90 font-medium">
            {t.hint_platform_selected}
          </p>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={onAnalyze}
        disabled={!url.trim() || analyzing || downloading}
        className="w-full h-12 md:h-14 rounded-2xl gradient-bg hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-base md:text-lg shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.action_analyzing}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-cyan-200" />
            <span>{t.action_analyze}</span>
          </>
        )}
      </button>

      {/* Cookie / Bot-check Hint Banners */}
      {tiktokHint && (
        <CookieHintBanner
          title={t.tiktok_hint_title}
          message={t.tiktok_hint_msg}
          error={error || undefined}
          onOpenSettings={onOpenSettings}
          lang={lang}
        />
      )}

      {youtubeHint && (
        <CookieHintBanner
          title={t.youtube_hint_title}
          message={t.youtube_hint_msg}
          error={error || undefined}
          onOpenSettings={onOpenSettings}
          lang={lang}
        />
      )}

      {facebookHint && (
        <CookieHintBanner
          title={t.facebook_hint_title}
          message={t.facebook_hint_msg}
          error={error || undefined}
          onOpenSettings={onOpenSettings}
          lang={lang}
        />
      )}

      {/* General Error Banner */}
      {!tiktokHint && !youtubeHint && !facebookHint && error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-200 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Error</h4>
              <p className="text-xs text-rose-300/90 leading-relaxed mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={onAnalyze}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-all shrink-0 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.action_retry}</span>
          </button>
        </div>
      )}

      {/* Extracted Video Information & Download Actions */}
      {video && (
        <div className="space-y-4 pt-2">
          {/* Main Video Header Card */}
          <VideoCard video={video} lang={lang} />

          {/* Playlist or Single Video Mode */}
          {video.isPlaylist ? (
            <PlaylistSection
              entries={video.entries}
              selectedIndex={selectedEntryIndex}
              onSelectEntry={onSelectEntry}
              onDownloadAll={onDownloadAll}
              onDownloadSingle={onDownloadEntry}
              batchDownloading={batchDownloading}
              batchCurrent={batchCurrent}
              batchTotal={batchTotal}
              entryStatuses={entryStatuses}
              lang={lang}
            />
          ) : (
            <div className="space-y-4">
              <FormatSelectionCard
                formats={video.formats}
                selectedIndex={selectedFormat}
                onFormatSelected={onSelectFormat}
                lang={lang}
              />

              {/* Downloading state or Download Trigger Button */}
              {downloading ? (
                <ProgressCard
                  title={downloadingTitle || video.title}
                  progress={progress}
                  onCancel={onCancelDownload}
                  lang={lang}
                />
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={onDownload}
                    className="w-full h-13 md:h-14 rounded-2xl gradient-bg hover:opacity-95 active:scale-[0.99] text-white font-bold text-base md:text-lg shadow-xl shadow-indigo-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t.action_download}</span>
                  </button>

                  {lastSavedUri && (
                    <button
                      onClick={() => onOpenFile(lastSavedUri)}
                      className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{t.action_open}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
