"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Language } from "@/types/language";

export default function LoginForm() {
  const { t, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('zh');
  const [error, setError] = useState("");

  // 当选择的语言改变时，立即更新界面语言
  const handleLanguageChange = (newLanguage: Language) => {
    setSelectedLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ width: "100%" }}>
      <h2 style={{ 
        fontSize: "clamp(16px, 3vw, 20px)", // 响应式字体
        marginBottom: 12, // 减少底部间距
        textAlign: "center"
      }}>{t('login')}</h2>
      
      {/* 语言选择 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: "block",
          fontSize: "clamp(12px, 2.5vw, 13px)",
          color: "#a1a1aa",
          marginBottom: 4
        }}>
          {t('selectLanguage')}
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #333",
            background: "#23232a",
            color: "#fff",
            fontSize: "clamp(13px, 2.5vw, 14px)"
          }}
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}> {/* 减少底部间距 */}
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px", // 减少内边距
            borderRadius: 6, // 减小圆角
            border: "1px solid #333",
            background: "#23232a",
            color: "#fff",
            fontSize: "clamp(13px, 2.5vw, 14px)", // 响应式字体
            marginBottom: 8 // 减少底部间距
          }}
        />
      </div>
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px", // 减少内边距
            borderRadius: 6, // 减小圆角
            border: "1px solid #333",
            background: "#23232a",
            color: "#fff",
            fontSize: "clamp(13px, 2.5vw, 14px)" // 响应式字体
          }}
        />
      </div>
      <button 
        type="submit"
        style={{
          width: "100%",
          padding: "8px 12px", // 减少内边距
          borderRadius: 6, // 减小圆角
          background: "#60a5fa",
          color: "#18181b",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "clamp(13px, 2.5vw, 14px)" // 响应式字体
        }}
      >
        {t('login')}
      </button>
      {error && (
        <p style={{ 
          color: "red", 
          fontSize: "clamp(11px, 2.5vw, 12px)", // 响应式字体
          marginTop: 8, // 减少顶部间距
          textAlign: "center"
        }}>
          {error}
        </p>
      )}
    </form>
  );
}