import React, { useState } from 'react';
import { Film, Music, Check, Sparkles } from 'lucide-react';
import { VideoFormat, KHMER_AUDIO_FORMATS } from '../types';
import { Language, translations } from '../i18n';

interface FormatSelectionCardProps {
  formats: VideoFormat[];
  selectedIndex: number;
  onFormatSelected: (index: number) => void;
  lang: Language;
}

export const FormatSelectionCard: React.FC<FormatSelectionCardProps> = ({
  formats,
  selectedIndex,
  onFormatSelected,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const videoFormats = formats.map((f, i) => ({ ...f, origIndex: i })).filter((f) => f.kind === 'video');
  const audioFormats = formats.map((f, i) => ({ ...f, origIndex: i })).filter((f) => f.kind === 'audio');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base md:text-lg text-slate-100 flex items-center gap-2">
          <span>{t.label_formats}</span>
        </h3>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('video');
              if (videoFormats.length > 0 && formats[selectedIndex]?.kind !== 'video') {
                onFormatSelected(videoFormats[0].origIndex);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{t.tab_format_video}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audio');
              if (audioFormats.length > 0 && formats[selectedIndex]?.kind !== 'audio') {
                onFormatSelected(audioFormats[0].origIndex);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{t.tab_format_audio}</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-medium">
        {activeTab === 'video' ? t.label_video_resolution : t.label_audio_quality}
      </div>

      {/* Formats list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {activeTab === 'video' ? (
          videoFormats.length > 0 ? (
            videoFormats.map((fmt) => {
              const isSelected = selectedIndex === fmt.origIndex;
              return (
                <div
                  key={fmt.id + fmt.origIndex}
                  onClick={() => onFormatSelected(fmt.origIndex)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{fmt.label}</span>
                        {fmt.id === 'best_mp4' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Best
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {fmt.height > 0 ? `${fmt.height}p` : 'Auto'} · MP4
                      </div>
                    </div>
                  </div>

                  {fmt.filesizeText && (
                    <div className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700/50">
                      {fmt.filesizeText}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-500 py-3 text-center">No video formats detected</div>
          )
        ) : (
          /* Audio Formats (Khmer Audio Options: MP3 320k, 192k, M4A 256k, WAV 1411k Lossless) */
          audioFormats.length > 0 ? (
            audioFormats.map((fmt) => {
              const isSelected = selectedIndex === fmt.origIndex;
              return (
                <div
                  key={fmt.id + fmt.origIndex}
                  onClick={() => onFormatSelected(fmt.origIndex)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{fmt.label}</span>
                        {fmt.abr >= 320 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            HQ
                          </span>
                        )}
                        {fmt.ext === 'wav' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Lossless
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {fmt.abr > 0 ? `${fmt.abr} kbps` : ''} · {fmt.ext.toUpperCase()} Audio
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700/50">
                    {fmt.filesizeText || '~5 MB'}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-500 py-3 text-center">No audio formats detected</div>
          )
        )}
      </div>
    </div>
  );
};
