import React, { useState } from 'react';
import { Trash2, ExternalLink, Music, PlayCircle, DownloadCloud, AlertTriangle, X } from 'lucide-react';
import { DownloadItem } from '../types';
import { Language, translations } from '../i18n';

interface HistoryTabProps {
  downloads: DownloadItem[];
  onOpen: (item: DownloadItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  lang: Language;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function isAudio(item: DownloadItem): boolean {
  const name = (item.fileName || item.uri || '').toLowerCase();
  return name.endsWith('.mp3') || name.endsWith('.m4a') || name.endsWith('.wav');
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  downloads,
  onOpen,
  onDelete,
  onClearAll,
  lang,
}) => {
  const t = translations[lang];
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Title and Clear Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold font-grotesk text-slate-100">
          {t.history_title}
        </h2>

        {downloads.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
            title={t.history_clear_all}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.history_clear_all}</span>
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {t.history_clear_confirm}
              </h3>
            </div>

            <p className="text-sm text-slate-400">
              {t.history_clear_confirm_msg}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                {t.action_no}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  onClearAll();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
              >
                {t.action_yes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List or Empty State */}
      {downloads.length === 0 ? (
        <div className="min-h-[320px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/50 text-slate-500">
            <DownloadCloud className="w-12 h-12 stroke-[1.5]" />
          </div>
          <div className="max-w-xs space-y-1">
            <p className="text-sm md:text-base font-medium text-slate-300 whitespace-pre-line">
              {t.history_empty}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {downloads.map((item) => {
            const audio = isAudio(item);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 md:p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Media Type Icon */}
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    {audio ? <Music className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm md:text-base font-semibold text-slate-100 truncate group-hover:text-indigo-200 transition-colors" title={item.title}>
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-medium text-indigo-400">{item.platform}</span>
                      <span>•</span>
                      <span>{formatDate(item.timestamp)}</span>
                      <span>•</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        {t.status_saved}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => onOpen(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-cyan-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all shadow-sm"
                    title={t.action_open}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all"
                    title={t.action_delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
