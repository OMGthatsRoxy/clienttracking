"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";

export default function LogoutButton() {
  const { t } = useLanguage();
  
  return (
    <button 
      onClick={() => signOut(auth)}
      style={{
        background: '#23232a',
        color: '#60a5fa',
        border: '1px solid #60a5fa',
        borderRadius: 6,
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600
      }}
    >
      {t('logout')}
    </button>
  );
}