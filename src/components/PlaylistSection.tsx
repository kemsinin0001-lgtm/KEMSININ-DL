import React from 'react';
import { Layers, Download, Check, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { VideoEntry, EntryStatus } from '../types';
import { Language, translations } from '../i18n';

interface PlaylistSectionProps {
  entries: VideoEntry[];
  selectedIndex: number | null;
  onSelectEntry: (index: number) => void;
  onDownloadAll: () => void;
  onDownloadSingle: (entry: VideoEntry) => void;
  batchDownloading: boolean;
  batchCurrent: number;
  batchTotal: number;
  entryStatuses: EntryStatus[];
  lang: Language;
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '';
  const mins = Math.floor(sec / 60);
  const remSecs = sec % 60;
  return `${mins}:${remSecs.toString().padStart(2, '0')}`;
}

export const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  entries,
  selectedIndex,
  onSelectEntry,
  onDownloadAll,
  onDownloadSingle,
  batchDownloading,
  batchCurrent,
  batchTotal,
  entryStatuses,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base md:text-lg text-slate-100">
            {t.playlist_videos_label(entries.length)}
          </h3>
        </div>

        {batchDownloading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>{t.status_batch_downloading(batchCurrent, batchTotal)}</span>
          </div>
        ) : (
          <button
            onClick={onDownloadAll}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg hover:opacity-95 active:scale-95 text-white text-xs md:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{t.action_download_all}</span>
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {t.hint_select_video}
      </p>

      {/* Playlist entries list */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {entries.map((entry, index) => {
          const isSelected = selectedIndex === index;
          const status = entryStatuses[index];

          return (
            <div
              key={entry.id || index}
              onClick={() => onSelectEntry(index)}
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 text-white'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500 text-white'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Video thumbnail */}
                <div className="relative w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100';
                      }}
                    />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-slate-600" />
                  )}
                  {entry.duration > 0 && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                      {formatDuration(entry.duration)}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs md:text-sm font-medium truncate text-slate-200" title={entry.title}>
                    {entry.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>#{index + 1}</span>
                    {status && (
                      <span
                        className={`font-semibold ${
                          status === 'Saved'
                            ? 'text-emerald-400'
                            : status === 'Downloading'
                            ? 'text-indigo-400 animate-pulse'
                            : status === 'Failed'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        • {status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action for this entry */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadSingle(entry);
                }}
                className="ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold shrink-0 border border-slate-700 transition-all flex items-center gap-1"
                title={t.action_download_single}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.action_download}</span>
              </button>
            </div>
          );
        })}
      </div>

      {selectedIndex !== null && entries[selectedIndex] && (
        <div className="pt-2">
          <button
            onClick={() => onDownloadSingle(entries[selectedIndex])}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.action_download_single}</span>
          </button>
        </div>
      )}
    </div>
  );
};
