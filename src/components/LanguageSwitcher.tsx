"use client";

import { useLanguage } from "@/features/language/LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'zh', name: '中', flag: '🇨🇳' },
    { code: 'en', name: 'EN', flag: '🇺🇸' },
    { code: 'ms', name: 'BM', flag: '🇲🇾' },
  ] as const;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 1000,
      background: '#23232a',
      border: '1px solid #333',
      borderRadius: 8,
      padding: 8,
      display: 'flex',
      gap: 4
    }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          style={{
            background: language === lang.code ? '#60a5fa' : 'transparent',
            color: language === lang.code ? '#18181b' : '#a1a1aa',
            border: '1px solid',
            borderColor: language === lang.code ? '#60a5fa' : '#333',
            borderRadius: 6,
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s'
          }}
          title={lang.name}
        >
          <span style={{ fontSize: 14 }}>{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
} 