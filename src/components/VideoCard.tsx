import React from 'react';
import { PlayCircle, Clock, User, Film } from 'lucide-react';
import { VideoInfo } from '../types';
import { Language, translations } from '../i18n';

interface VideoCardProps {
  video: VideoInfo;
  lang: Language;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, lang }) => {
  const t = translations[lang];
  const durationText = formatDuration(video.duration);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail with overlay */}
        <div className="relative w-full sm:w-48 h-36 bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-slate-800/80 flex items-center justify-center">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback placeholder if image fails to load
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
              <Film className="w-10 h-10 mb-1" />
              <span className="text-xs">No preview</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {durationText && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1 border border-white/10">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{durationText}</span>
            </div>
          )}

          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white text-[11px] font-bold tracking-wide uppercase shadow-md">
            {video.extractor}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-2 leading-snug" title={video.title}>
              {video.title}
            </h3>

            {video.uploader && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 mt-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-300 truncate">
                  {t.by} {video.uploader}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
              <PlayCircle className="w-3.5 h-3.5" />
              {video.isPlaylist ? `${video.entries.length} items` : `${video.formats.length} formats available`}
            </span>
            <span>•</span>
            <span className="text-slate-400">{video.extractor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
