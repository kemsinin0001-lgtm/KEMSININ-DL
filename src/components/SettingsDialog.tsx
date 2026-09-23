import React, { useState } from 'react';
import { X, HelpCircle, Key, Check, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, translations } from '../i18n';

interface SettingsDialogProps {
  initialMsToken: string;
  initialChainToken: string;
  initialYoutubeCookies: string;
  initialFacebookCookies: string;
  onSave: (msToken: string, chainToken: string, ytCookies: string, fbCookies: string) => void;
  onClearTikTok: () => void;
  onClearYoutube: () => void;
  onClearFacebook: () => void;
  onClose: () => void;
  lang: Language;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  initialMsToken,
  initialChainToken,
  initialYoutubeCookies,
  initialFacebookCookies,
  onSave,
  onClearTikTok,
  onClearYoutube,
  onClearFacebook,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  const [msToken, setMsToken] = useState(initialMsToken);
  const [chainToken, setChainToken] = useState(initialChainToken);
  const [youtubeCookies, setYoutubeCookies] = useState(initialYoutubeCookies);
  const [facebookCookies, setFacebookCookies] = useState(initialFacebookCookies);

  const [showTikTokGuide, setShowTikTokGuide] = useState(false);
  const [showYoutubeGuide, setShowYoutubeGuide] = useState(false);
  const [showFacebookGuide, setShowFacebookGuide] = useState(false);

  const handleSave = () => {
    onSave(msToken, chainToken, youtubeCookies, facebookCookies);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl gradient-bg text-white shadow-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-lg text-white">
                {t.settings_title}
              </h3>
              <p className="text-xs text-slate-400">
                Unlock bot-protected videos from TikTok, YouTube &amp; Facebook
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title={t.settings_cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-200">
          {/* TikTok Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                <span className="text-base">🎵</span>
                <span>TikTok Tokens</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTikTokGuide(!showTikTokGuide)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t.settings_how_to}</span>
                {showTikTokGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t.settings_tiktok_desc.split('\n')[0]}
            </p>

            {/* Expandable How-to */}
            {showTikTokGuide && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs space-y-1.5 text-slate-300">
                <div className="font-bold text-indigo-300 mb-1">{t.settings_howto_title}:</div>
                <div className="pl-2 border-l-2 border-indigo-500/40 space-y-1">
                  <div>1. {t.settings_howto_step1}</div>
                  <div>2. {t.settings_howto_step2}</div>
                  <div>3. {t.settings_howto_step3}</div>
                  <div>4. {t.settings_howto_step4}</div>
                  <div>5. {t.settings_howto_step5}</div>
                  <div>6. {t.settings_howto_step6}</div>
                  <div>7. {t.settings_howto_step7}</div>
                </div>
                <div className="text-[11px] text-amber-300/90 pt-1 font-medium">
                  {t.settings_howto_note}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.settings_ms_token_label}
                </label>
                <input
                  type="text"
                  value={msToken}
                  onChange={(e) => setMsToken(e.target.value)}
                  placeholder={t.settings_token_placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.settings_chain_token_label}
                </label>
                <input
                  type="text"
                  value={chainToken}
                  onChange={(e) => setChainToken(e.target.value)}
                  placeholder={t.settings_token_placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {(msToken || chainToken) && (
                <button
                  type="button"
                  onClick={() => {
                    setMsToken('');
                    setChainToken('');
                    onClearTikTok();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 pt-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.settings_clear}</span>
                </button>
              )}
            </div>
          </div>

          {/* YouTube Cookies Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                <span className="text-base">▶️</span>
                <span>YouTube Cookies</span>
              </div>
              <button
                type="button"
                onClick={() => setShowYoutubeGuide(!showYoutubeGuide)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
                {showYoutubeGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t.settings_youtube_desc.split('\n')[0]}
            </p>

            {showYoutubeGuide && (
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs space-y-1 text-slate-300">
                <p className="leading-relaxed">
                  Open youtube.com in Chrome → F12 → Network → refresh the page → click any request → copy the Cookie header value and paste below.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.settings_youtube_cookies_label}
              </label>
              <textarea
                rows={2}
                value={youtubeCookies}
                onChange={(e) => setYoutubeCookies(e.target.value)}
                placeholder="SID=...; HSID=...; SSID=..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {youtubeCookies && (
              <button
                type="button"
                onClick={() => {
                  setYoutubeCookies('');
                  onClearYoutube();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.settings_clear_youtube}</span>
              </button>
            )}
          </div>

          {/* Facebook Cookies Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                <span className="text-base">👍</span>
                <span>Facebook Cookies</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFacebookGuide(!showFacebookGuide)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
                {showFacebookGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t.settings_facebook_desc.split('\n')[0]}
            </p>

            {showFacebookGuide && (
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs space-y-1 text-slate-300">
                <p className="leading-relaxed">
                  Open facebook.com in Chrome → F12 → Application → Cookies → https://www.facebook.com or copy Cookie header from Network tab.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.settings_facebook_cookies_label}
              </label>
              <textarea
                rows={2}
                value={facebookCookies}
                onChange={(e) => setFacebookCookies(e.target.value)}
                placeholder="c_user=...; xs=...; datr=..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {facebookCookies && (
              <button
                type="button"
                onClick={() => {
                  setFacebookCookies('');
                  onClearFacebook();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.settings_clear_facebook}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
          >
            {t.settings_cancel}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl gradient-bg hover:opacity-95 text-white text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t.settings_save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
