import React from 'react';
import { Download, XCircle, Loader2 } from 'lucide-react';
import { DownloadProgress } from '../types';
import { Language, translations } from '../i18n';

interface ProgressCardProps {
  title: string;
  progress: DownloadProgress | null;
  onCancel: () => void;
  lang: Language;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  onCancel,
  lang,
}) => {
  const t = translations[lang];
  const percent = progress?.percent || 0;
  const percentInt = Math.round(percent);

  return (
    <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 md:p-5 shadow-xl shadow-indigo-950/30 backdrop-blur-md space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>
              {progress?.status === 'processing'
                ? t.status_finalizing
                : progress?.status === 'downloading'
                ? 'Downloading media…'
                : t.status_starting}
            </span>
          </div>
          <h4 className="text-sm md:text-base font-bold text-slate-100 truncate" title={title}>
            {title || 'Downloading media…'}
          </h4>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shrink-0 active:scale-95"
          title={t.action_cancel}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{t.action_cancel}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full gradient-bg transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.max(4, Math.min(100, percentInt))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-medium">
          <span>
            {progress?.downloadedBytes && progress?.totalBytes
              ? `${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}`
              : `${percentInt}%`}
          </span>
          <span className="text-cyan-400 font-bold">{percentInt}%</span>
        </div>
      </div>
    </div>
  );
};
