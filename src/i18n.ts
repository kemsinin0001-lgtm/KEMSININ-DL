export type Language = 'en' | 'km';

export interface Translations {
  app_name: string;
  tab_download: string;
  tab_history: string;
  header_title: string;
  header_subtitle: string;
  url_label: string;
  url_placeholder: string;
  action_paste: string;
  action_clear: string;
  platforms_label: string;
  hint_platform_selected: string;
  action_analyze: string;
  action_analyzing: string;
  action_download: string;
  action_cancel: string;
  action_open: string;
  action_retry: string;
  action_download_all: string;
  action_download_single: string;
  hint_select_video: string;
  label_formats: string;
  tab_format_video: string;
  tab_format_audio: string;
  label_video_resolution: string;
  label_audio_quality: string;
  status_finalizing: string;
  status_starting: string;
  status_batch_downloading: (curr: number, total: number) => string;
  playlist_videos_label: (count: number) => string;
  history_title: string;
  history_empty: string;
  history_clear_all: string;
  history_clear_confirm: string;
  history_clear_confirm_msg: string;
  action_yes: string;
  action_no: string;
  status_saved: string;
  status_failed: string;
  status_cancelled: string;
  action_delete: string;
  msg_analyze_error: string;
  msg_saved_to_downloads: string;
  msg_download_failed: (err: string) => string;
  msg_download_cancelled: string;
  msg_batch_saved: (saved: number, total: number) => string;
  msg_batch_saved_failed: (saved: number, total: number, failed: number) => string;
  msg_no_url: string;
  msg_file_not_found: string;
  msg_open_error: string;
  settings_title: string;
  settings_tiktok_desc: string;
  settings_how_to: string;
  settings_howto_title: string;
  settings_howto_step1: string;
  settings_howto_step2: string;
  settings_howto_step3: string;
  settings_howto_step4: string;
  settings_howto_step5: string;
  settings_howto_step6: string;
  settings_howto_step7: string;
  settings_howto_note: string;
  settings_ok: string;
  settings_ms_token_label: string;
  settings_chain_token_label: string;
  settings_token_placeholder: string;
  settings_save: string;
  settings_cancel: string;
  settings_clear: string;
  settings_clear_youtube: string;
  settings_clear_facebook: string;
  settings_saved_msg: string;
  settings_youtube_cookies_label: string;
  settings_youtube_desc: string;
  settings_facebook_cookies_label: string;
  settings_facebook_desc: string;
  tiktok_hint_title: string;
  tiktok_hint_msg: string;
  tiktok_hint_open_settings: string;
  youtube_hint_title: string;
  youtube_hint_msg: string;
  facebook_hint_title: string;
  facebook_hint_msg: string;
  by: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    app_name: "KEMSININ Downloader",
    tab_download: "Download",
    tab_history: "History",
    header_title: "KEMSININ DOWNLOADER",
    header_subtitle: "Download videos & audio from any social media",
    url_label: "Video URL",
    url_placeholder: "Paste a link from YouTube, TikTok, Facebook…",
    action_paste: "Paste",
    action_clear: "Clear",
    platforms_label: "Supported platforms",
    hint_platform_selected: "Example link pasted. Replace it with your own video link and tap Analyze.",
    action_analyze: "Analyze",
    action_analyzing: "Analyzing…",
    action_download: "Download",
    action_cancel: "Cancel",
    action_open: "Open / Save",
    action_retry: "Try again",
    action_download_all: "Download All",
    action_download_single: "Download Single File",
    hint_select_video: "Select a video above to download just that one",
    label_formats: "Choose quality",
    tab_format_video: "🎬 Video (MP4)",
    tab_format_audio: "🎵 Audio (MP3)",
    label_video_resolution: "Choose Video Resolution (MP4)",
    label_audio_quality: "Choose Audio Format (MP3)",
    status_finalizing: "Saving to Downloads…",
    status_starting: "Starting…",
    status_batch_downloading: (curr, total) => `Downloading ${curr} of ${total}`,
    playlist_videos_label: (count) => `Videos (${count})`,
    history_title: "My downloads",
    history_empty: "No downloads yet.\nYour saved videos will appear here.",
    history_clear_all: "Clear history",
    history_clear_confirm: "Delete all history?",
    history_clear_confirm_msg: "This only clears the list, it does not delete the files.",
    action_yes: "Yes",
    action_no: "No",
    status_saved: "Saved",
    status_failed: "Failed",
    status_cancelled: "Cancelled",
    action_delete: "Delete from history",
    msg_analyze_error: "Could not analyze this link. Check the URL and try again.",
    msg_saved_to_downloads: "Saved to Downloads",
    msg_download_failed: (err) => `Download failed: ${err}`,
    msg_download_cancelled: "Download cancelled",
    msg_batch_saved: (saved, total) => `Saved ${saved} of ${total} videos`,
    msg_batch_saved_failed: (saved, total, failed) => `Saved ${saved} of ${total} videos · ${failed} failed`,
    msg_no_url: "Please paste a video link first",
    msg_file_not_found: "File not found",
    msg_open_error: "Cannot open this file",
    settings_title: "Settings & Cookies",
    settings_tiktok_desc: "TikTok shows a bot-check to downloaders. Paste the ms_token cookie from your browser to unlock TikTok downloads.",
    settings_how_to: "How to get ms_token",
    settings_howto_title: "How to get ms_token",
    settings_howto_step1: "Open tiktok.com in Chrome on your computer and log in to your TikTok account.",
    settings_howto_step2: "Press F12 (Windows) or Cmd+Option+I (Mac) to open DevTools.",
    settings_howto_step3: "Tap the 'Application' tab at the top of DevTools.",
    settings_howto_step4: "In the left panel, open: Storage → Cookies → https://www.tiktok.com",
    settings_howto_step5: "Find the cookie named ms_token.",
    settings_howto_step6: "Double-click its Value column and copy the whole value.",
    settings_howto_step7: "Paste it into the ms_token field above and tap Save.",
    settings_howto_note: "Tip: if TikTok still shows a login request, also copy tt_chain_token the same way.",
    settings_ok: "OK",
    settings_ms_token_label: "TikTok ms_token",
    settings_chain_token_label: "tt_chain_token (optional)",
    settings_token_placeholder: "Paste cookie value here",
    settings_save: "Save Cookies",
    settings_cancel: "Cancel",
    settings_clear: "Clear TikTok cookies",
    settings_clear_youtube: "Clear YouTube cookies",
    settings_clear_facebook: "Clear Facebook cookies",
    settings_saved_msg: "Cookies saved successfully",
    settings_youtube_cookies_label: "YouTube cookies (Cookie header)",
    settings_youtube_desc: "YouTube sometimes blocks downloads with a bot-check. Paste the Cookie header from a browser where you are signed in to YouTube.",
    settings_facebook_cookies_label: "Facebook cookies (c_user, xs, etc.)",
    settings_facebook_desc: "Some Facebook Reels and Profiles require login cookies. Paste your Facebook Cookie header or tokens from your browser here.",
    tiktok_hint_title: "TikTok needs a cookie to download",
    tiktok_hint_msg: "TikTok blocks downloads without a login cookie. Add your ms_token in Settings to unlock TikTok downloads.",
    tiktok_hint_open_settings: "Open Settings",
    youtube_hint_title: "YouTube needs a cookie to download",
    youtube_hint_msg: "YouTube blocked this download as a bot-check. Add your YouTube cookies in Settings to fix it.",
    facebook_hint_title: "Facebook needs login cookies",
    facebook_hint_msg: "This Facebook video or profile reel is restricted or requires login. Add your Facebook cookies in Settings to download.",
    by: "by",
  },
  km: {
    app_name: "KEMSININ Downloader",
    tab_download: "ទាញយក",
    tab_history: "ប្រវត្តិ",
    header_title: "KEMSININ DOWNLOADER",
    header_subtitle: "ទាញយកវីដេអូ និងសំឡេងពីបណ្តាញសង្គមទាំងអស់",
    url_label: "Link វីដេអូ",
    url_placeholder: "បិទភ្ជាប់ link ពី YouTube, TikTok, Facebook…",
    action_paste: "បិទភ្ជាប់",
    action_clear: "លុប",
    platforms_label: "បណ្តាញសង្គមដែលគាំទ្រ",
    hint_platform_selected: "បានបិទភ្ជាប់ link ឧទាហរណ៍។ សូមប្តូរទៅ link វីដេអូផ្ទាល់ខ្លួនរបស់អ្នក រួចប៉ះ វិភាគ។",
    action_analyze: "វិភាគ",
    action_analyzing: "កំពុងវិភាគ…",
    action_download: "ទាញយក",
    action_cancel: "បោះបង់",
    action_open: "បើក / រក្សាទុក",
    action_retry: "ព្យាយាមម្តងទៀត",
    action_download_all: "ទាញយកទាំងអស់",
    action_download_single: "ទាញយកតែមួយ",
    hint_select_video: "ជ្រើសរើសវីដេអូខាងលើ ដើម្បីទាញយកតែមួយ",
    label_formats: "ជ្រើសរើសគុណភាព",
    tab_format_video: "🎬 វីដេអូ (MP4)",
    tab_format_audio: "🎵 សំឡេង (MP3)",
    label_video_resolution: "ជ្រើសរើសទំហំវីដេអូ (Resolution)",
    label_audio_quality: "ជ្រើសរើសគុណភាពសំឡេង (Audio Format)",
    status_finalizing: "កំពុងរក្សាទុកទៅ Downloads…",
    status_starting: "កំពុងចាប់ផ្តើម…",
    status_batch_downloading: (curr, total) => `កំពុងទាញយក ${curr}/${total}`,
    playlist_videos_label: (count) => `វីដេអូ (${count})`,
    history_title: "ការទាញយករបស់ខ្ញុំ",
    history_empty: "មិនទាន់មានការទាញយកទេ។\nវីដេអូដែលបានរក្សាទុកនឹងបង្ហាញនៅទីនេះ។",
    history_clear_all: "សម្អាតប្រវត្តិ",
    history_clear_confirm: "សម្អាតប្រវត្តិទាំងអស់?",
    history_clear_confirm_msg: "នេះគ្រាន់តែសម្អាតបញ្ជី មិនលុបឯកសារទេ។",
    action_yes: "បាទ",
    action_no: "ទេ",
    status_saved: "បានរក្សាទុក",
    status_failed: "បរាជ័យ",
    status_cancelled: "បានបោះបង់",
    action_delete: "លុបពីប្រវត្តិ",
    msg_analyze_error: "មិនអាចវិភាគ link នេះបានទេ។ សូមពិនិត្យ URL ហើយព្យាយាមម្តងទៀត។",
    msg_saved_to_downloads: "បានរក្សាទុកទៅ Downloads",
    msg_download_failed: (err) => `ការទាញយកបរាជ័យ៖ ${err}`,
    msg_download_cancelled: "បានបោះបង់ការទាញយក",
    msg_batch_saved: (saved, total) => `បានរក្សាទុក ${saved} ក្នុងចំណោម ${total} វីដេអូ`,
    msg_batch_saved_failed: (saved, total, failed) => `បានរក្សាទុក ${saved} ក្នុងចំណោម ${total} វីដេអូ · ${failed} បរាជ័យ`,
    msg_no_url: "សូមបិទភ្ជាប់ link វីដេអូជាមុនសិន",
    msg_file_not_found: "រកមិនឃើញឯកសារ",
    msg_open_error: "មិនអាចបើកឯកសារនេះបានទេ",
    settings_title: "ការកំណត់ & Cookies",
    settings_tiktok_desc: "TikTok បង្ហាញ bot-check ដល់អ្នកទាញយក។ សូមបិទភ្ជាប់ cookie ms_token ពី browser របស់អ្នក ដើម្បីអាចទាញយកពី TikTok បាន។",
    settings_how_to: "របៀបយក ms_token",
    settings_howto_title: "របៀបយក ms_token",
    settings_howto_step1: "បើក tiktok.com ក្នុង Chrome លើកុំព្យូទ័រ រួចចូលគណនី TikTok របស់អ្នក។",
    settings_howto_step2: "ចុច F12 (Windows) ឬ Cmd+Option+I (Mac) ដើម្បីបើក DevTools។",
    settings_howto_step3: "ប៉ះផ្ទាំង 'Application' នៅខាងលើ DevTools។",
    settings_howto_step4: "ក្នុងបញ្ជីខាងឆ្វេង បើក៖ Storage → Cookies → https://www.tiktok.com",
    settings_howto_step5: "រក cookie ឈ្មោះ ms_token។",
    settings_howto_step6: "ចុចពីរដងលើជួរឈរ Value រួចចម្លងតម្លៃទាំងមូល (វែងណាស់)។",
    settings_howto_step7: "បិទភ្ជាប់ក្នុងវាល ms_token ខាងលើ រួចប៉ះ រក្សាទុក។",
    settings_howto_note: "គន្លឹះ៖ បើ TikTok នៅតែសុំចូលគណនី សូមចម្លង tt_chain_token តាមរបៀបដដែលផងដែរ។",
    settings_ok: "យល់ព្រម",
    settings_ms_token_label: "ms_token",
    settings_chain_token_label: "tt_chain_token (ស្រេចចិត្ត)",
    settings_token_placeholder: "បិទភ្ជាប់តម្លៃ cookie នៅទីនេះ",
    settings_save: "រក្សាទុក Cookies",
    settings_cancel: "បោះបង់",
    settings_clear: "លុប TikTok cookies",
    settings_clear_youtube: "លុប YouTube cookies",
    settings_clear_facebook: "លុប Facebook cookies",
    settings_saved_msg: "បានរក្សាទុក cookies",
    settings_youtube_cookies_label: "YouTube cookies (Cookie header)",
    settings_youtube_desc: "YouTube ពេលខ្លះរារាំងការទាញយកដោយ bot-check។ សូមបិទភ្ជាប់ Cookie header ពី browser ដែលអ្នកបានចូល YouTube។",
    settings_facebook_cookies_label: "Facebook cookies (c_user, xs...)",
    settings_facebook_desc: "វីដេអូ Reel ឬ Profile ហ្វេសប៊ុកមួយចំនួនតម្រូវឱ្យចូលគណនី។ សូមចម្លង Cookie header របស់ Facebook ពី browser មកបិទភ្ជាប់នៅទីនេះ។",
    tiktok_hint_title: "TikTok ត្រូវការ cookie ដើម្បីទាញយក",
    tiktok_hint_msg: "TikTok រារាំងការទាញយកដោយគ្មាន cookie ចូលគណនី។ សូមបន្ថែម ms_token របស់អ្នកក្នុង ការកំណត់ ដើម្បីអាចទាញយកពី TikTok បាន។",
    tiktok_hint_open_settings: "បើក ការកំណត់",
    youtube_hint_title: "YouTube ត្រូវការ cookie ដើម្បីទាញយក",
    youtube_hint_msg: "YouTube បានរារាំងការទាញយកនេះ (bot-check)។ សូមបន្ថែម YouTube cookies ក្នុង ការកំណត់ ដើម្បីដោះស្រាយ។",
    facebook_hint_title: "Facebook ត្រូវការ login cookie",
    facebook_hint_msg: "Facebook បានរារាំង ឬតម្រូវឱ្យ Login ទើបអាចទាញយក Reel ឬ Profile នេះបាន។ សូមបន្ថែម Facebook cookies ក្នុង ការកំណត់។",
    by: "ដោយ",
  },
};
