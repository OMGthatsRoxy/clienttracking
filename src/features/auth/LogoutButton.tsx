"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 退出登录成功后跳转到首页（登录页面）
      router.push('/');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };
  
  return (
    <button 
      onClick={handleLogout}
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