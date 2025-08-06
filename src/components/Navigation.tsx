"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/features/auth/LogoutButton";
import { useEffect, useState } from "react";

// 图标组件
const Icon = ({ name, isActive }: { name: string; isActive: boolean }) => {
  const color = isActive ? "#60a5fa" : "#a1a1aa";
  
  switch (name) {
    case "home":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      );
    case "profile":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      );
    case "schedule":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    case "clients":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    case "prospects":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      );
    case "settings":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      );
    case "templates":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      );
    default:
      return null;
  }
};

export default function Navigation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (!user) return null;

  const navItems = [
    { href: "/", label: t('home'), icon: "home" },
    { href: "/profile", label: t('profile'), icon: "profile" },
    { href: "/schedule", label: t('schedule'), icon: "schedule" },
    { href: "/clients", label: t('clients'), icon: "clients" },
    { href: "/prospects", label: t('prospects'), icon: "prospects" },
  ];

  // 检查是否为管理员
  const isAdmin = user.email === "admin@example.com" || user.email?.includes("admin");

  const mobileNavItems = [
    { href: "/", label: t('home'), icon: "home" },
    { href: "/clients", label: t('clients'), icon: "clients" },
    { href: "/schedule", label: t('schedule'), icon: "schedule" },
    { href: "/prospects", label: t('prospects'), icon: "prospects" },
    { href: "/profile", label: t('profile'), icon: "profile" },
    // 管理员专用入口
    ...(isAdmin ? [{ href: "/admin", label: "管理", icon: "settings" }] : []),
  ];

  const settingsItems = [
    { href: "/settings/custom-exercises", label: t('customExercises'), icon: "templates" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* 桌面端导航栏 - 顶部（已移除登出按钮） */}

      {/* 手机端导航栏 - 底部 - 市场常规高度 */}
      <nav className="mobile-nav" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#23232a",
        borderTop: "1px solid #333",
        zIndex: 1000,
        padding: isMobile ? "12px 0 16px 0" : "8px 0 12px 0", // 桌面端减少内边距
        minHeight: isMobile ? "80px" : "60px" // 桌面端降低最小高度
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          width: "100%",
          alignItems: "center",
          height: "100%"
        }}>
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <button style={{
                background: "transparent",
                border: "none",
                color: isActive(item.href) ? "#60a5fa" : "#a1a1aa",
                cursor: "pointer",
                padding: isMobile ? "10px 14px" : "6px 10px", // 桌面端减少按钮内边距
                borderRadius: 8,
                fontSize: isMobile ? 14 : 12, // 桌面端减小字体大小
                fontWeight: isActive(item.href) ? 600 : 400,
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? 4 : 2, // 桌面端减少图标和文字间距
                minWidth: isMobile ? 60 : 50, // 桌面端减少最小宽度
                height: "100%",
                justifyContent: "center"
              }}>
                <Icon name={item.icon} isActive={isActive(item.href)} />
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>

      {/* 手机端内容边距 */}
      <div className="mobile-spacer" style={{ height: 0 }} />
      
      {/* 手机端底部边距 - 为底部导航栏预留空间 */}
      <div className="mobile-bottom-spacer" style={{ 
        height: isMobile ? 110 : 80, // 桌面端减少底部间距
        display: 'block'
      }} />
    </>
  );
} 