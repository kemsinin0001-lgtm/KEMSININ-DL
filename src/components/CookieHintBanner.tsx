import React from 'react';
import { AlertCircle, KeyRound, ExternalLink } from 'lucide-react';
import { Language, translations } from '../i18n';

interface CookieHintBannerProps {
  title: string;
  message: string;
  error?: string;
  onOpenSettings: () => void;
  lang: Language;
}

export const CookieHintBanner: React.FC<CookieHintBannerProps> = ({
  title,
  message,
  error,
  onOpenSettings,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 md:p-5 shadow-lg backdrop-blur-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm md:text-base font-bold text-amber-200">
            {title}
          </h4>
          <p className="text-xs md:text-sm text-amber-300/80 leading-relaxed">
            {message}
          </p>
          {error && (
            <p className="text-[11px] font-mono text-amber-400/70 pt-1 break-words">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span>{t.tiktok_hint_open_settings}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
