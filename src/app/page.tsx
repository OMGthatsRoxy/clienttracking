"use client";

import LoginForm from "@/features/auth/LoginForm";
import RegisterForm from "@/features/auth/RegisterForm";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coach } from "@/types/coach";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import CareerStatsCard from "@/components/CareerStatsCard";

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchCoachInfo = async () => {
      if (!user) return;
      
      try {
        const coachDoc = await getDoc(doc(db, "coaches", user.uid));
        if (coachDoc.exists()) {
          const coachData = { id: coachDoc.id, ...coachDoc.data() } as Coach;
          setCoach(coachData);
        }
      } catch (error) {
        console.error("获取教练信息失败:", error);
      }
    };

    const checkMobile = () => {
      // 基于屏幕宽度检测移动端，而不是用户代理
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    // 重置滚动位置
    window.scrollTo(0, 0);
    
    // 监听滚动事件，用于调试
    const handleScroll = () => {
      // 滚动位置记录
    };
    
    fetchCoachInfo();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user]);

  // 统一的卡片样式
  const cardStyle = {
    maxWidth: 1200,
    width: '100%',
    marginBottom: isMobile ? 8 : 12, // 移动端减少卡片间距
    background: '#23232a',
    borderRadius: '12px',
    padding: isMobile ? '12px' : '16px', // 移动端减少内边距
    border: '1px solid #333'
  };

  // 卡片容器样式
  const containerStyle = {
    minHeight: "100vh", // 使用视口高度，但不强制最小高度
    background: "#18181b",
    paddingLeft: isMobile ? "8px" : "16px",
    paddingRight: isMobile ? "8px" : "16px",
    paddingBottom: isMobile ? "120px" : "100px", // 为底部导航栏留空间
    paddingTop: isMobile ? "8px" : "16px", // 减少顶部间距，直接从卡片开始
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    maxWidth: "100%",
    width: "100%",
    overflowY: "auto" as const, // 仅在需要时显示滚动条
    overflowX: "hidden" as const // 防止水平滚动
  };

  return (
    <div style={containerStyle}>


      {/* 🧱 卡片1: 标题卡片 */}
      <div style={cardStyle}>
        <h1 style={{
          fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
          textAlign: "center",
          lineHeight: 1.2
        }}>
          <div>{t('titleLine1')}</div>
          <div style={{ fontSize: "0.9em", marginTop: "2px" }}>{t('titleLine2')}</div>
          <div>{t('titleLine3')}</div>
        </h1>
        <p style={{ 
          color: "#a1a1aa",
          fontSize: "clamp(12px, 3vw, 16px)",
          lineHeight: 1.3,
          margin: 0,
          textAlign: "center"
        }}>
          {t('loginDescription')}
        </p>
      </div>

      {user ? (
        <>
          {/* 🧱 卡片2: 欢迎卡片 */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              {coach?.avatar ? (
                <img
                  src={coach.avatar}
                  alt="教练头像"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#60a5fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#18181b"
                }}>
                  {(coach?.displayName || user.email)?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ 
                  fontSize: isMobile ? "clamp(20px, 5vw, 36px)" : "36px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#fff"
                }}>
                  {t('welcome')}，{coach?.displayName || user.email}
                </p>
              </div>
            </div>
          </div>
          
          {/* 🧱 卡片3: 本月成绩统计卡片 */}
          <StatsCard />
          
          {/* 🧱 卡片4: 我的职业生涯统计卡片 */}
          <CareerStatsCard />
        </>
      ) : (
        <>
          {/* �� 卡片2: 登录表单 */}
          <div style={cardStyle}>
            <LoginForm />
          </div>
          
          {/* 🧱 卡片3: 注册表单 */}
          <div style={cardStyle}>
            <RegisterForm />
          </div>
        </>
      )}

      {/* 底部间距 - 为导航栏留空间 */}
      <div style={{ height: isMobile ? 120 : 60 }} />
    </div>
  );
}
