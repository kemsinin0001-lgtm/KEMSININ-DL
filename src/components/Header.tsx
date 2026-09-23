import React from 'react';
import { Settings, Globe, Sparkles } from 'lucide-react';
import { Language, translations } from '../i18n';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, onToggleLang, onOpenSettings }) => {
  const t = translations[lang];

  return (
    <header className="relative overflow-hidden rounded-2xl md:rounded-3xl gradient-bg p-5 md:p-7 shadow-xl shadow-indigo-950/40 text-white">
      {/* Decorative ambient background */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-1/3 -top-12 w-32 h-32 bg-cyan-300/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-white/95 uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>KEMSININ ENGINE v1.3</span>
          </div>
          <h1 className="font-grotesk text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {t.header_title}
          </h1>
          <p className="text-sm md:text-base text-white/85 font-medium max-w-lg">
            {t.header_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs md:text-sm font-semibold text-white backdrop-blur-md border border-white/20 shadow-sm"
            title="Switch Language / ប្តូរភាសា"
          >
            <Globe className="w-4 h-4 text-cyan-200" />
            <span>{lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white backdrop-blur-md border border-white/20 shadow-sm"
            title={t.settings_title}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
