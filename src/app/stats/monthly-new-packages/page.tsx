"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Package } from "@/types/package";
import type { Client } from "@/types/client";
import Link from "next/link";

// 获取当前月份
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function MonthlyNewPackagesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 检测移动设备
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 640;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 实时监听配套数据
    const packagesQuery = query(collection(db, "packages"), where("coachId", "==", user.uid));
    const packagesUnsubscribe = onSnapshot(packagesQuery, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
    });

    // 实时监听客户数据
    const clientsQuery = query(collection(db, "clients"), where("coachId", "==", user.uid));
    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      packagesUnsubscribe();
      clientsUnsubscribe();
    };
  }, [user]);

  if (!user) {
    return (
      <div style={{ color: '#a1a1aa', textAlign: 'center', padding: '20px' }}>
        {t('pleaseLoginFirst')}
      </div>
    );
  }

  const currentMonth = getCurrentMonth();

  // 本月新增配套
  const monthlyNewPackages = packages.filter(pkg => {
    let isInCurrentMonth = false;
    
    if (pkg.createdAt) {
      try {
        const createdDate = pkg.createdAt.includes('T') ? pkg.createdAt.split('T')[0] : pkg.createdAt;
        isInCurrentMonth = createdDate.startsWith(currentMonth);
      } catch (error) {
        isInCurrentMonth = false;
      }
    }
    
    if (!isInCurrentMonth) {
      isInCurrentMonth = pkg.startDate.startsWith(currentMonth);
    }
    
    if (!isInCurrentMonth && pkg.coachId === user.uid) {
      isInCurrentMonth = true;
    }
    
    return isInCurrentMonth;
  });

  // 获取客户名称的辅助函数
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || t('unknownClient');
  };

  // 容器样式
  const containerStyle = {
    minHeight: "100vh",
    background: "#18181b",
    padding: isMobile ? "6px" : "16px",
    paddingTop: isMobile ? "12px" : "40px",
    paddingBottom: isMobile ? "100px" : "20px"
  };

  // 卡片样式
  const cardStyle = {
    maxWidth: 1200,
    width: "100%",
    marginBottom: 12,
    background: "#23232a",
    borderRadius: 8,
    padding: isMobile ? "10px" : "16px",
    border: "1px solid #333"
  };

  return (
    <div style={containerStyle}>
      {/* 标题卡片 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ 
            background: '#60a5fa', 
            color: '#18181b', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            ← {t('backToHome')}
          </Link>
          <h1 style={{ 
            fontSize: "clamp(16px, 3vw, 20px)",
            fontWeight: 700, 
            color: "#fff",
            margin: 0
          }}>
            {t('monthlyNewPackages')}
          </h1>
        </div>
        
        {/* 总配套数显示 */}
        <div style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          borderRadius: 8,
          padding: isMobile ? "8px 12px" : "12px 16px",
          textAlign: "center",
          color: "#fff",
          marginBottom: 12
        }}>
          <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, marginBottom: 4 }}>
            {monthlyNewPackages.length}
          </div>
          <div style={{ fontSize: "clamp(10px, 2vw, 12px)", opacity: 0.9 }}>
            {currentMonth} {t('monthlyNewPackages')}
          </div>
          <div style={{ fontSize: "clamp(8px, 1.5vw, 10px)", opacity: 0.8, marginTop: 4 }}>
            {t('totalNewPackagesThisMonth')}
          </div>
        </div>
      </div>

      {/* 配套详情 */}
      <div style={cardStyle}>
        <h2 style={{ 
          color: "#fff", 
          fontSize: "clamp(14px, 2.5vw, 16px)", 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          {t('packageDetails')}
        </h2>
        
        {monthlyNewPackages.length === 0 ? (
          <div style={{ 
            color: '#a1a1aa', 
            textAlign: 'center', 
            padding: '40px',
            fontSize: '16px'
          }}>
            {t('noNewPackagesThisMonth')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: isMobile ? 6 : 8 
          }}>
            {monthlyNewPackages
              .sort((a, b) => {
                const clientNameA = getClientName(a.clientId);
                const clientNameB = getClientName(b.clientId);
                return clientNameA.localeCompare(clientNameB, 'zh-CN'); // 按客户名称排序
              })
              .map((pkg) => {
                const clientName = getClientName(pkg.clientId);
                return (
                  <div key={pkg.id} style={{
                    background: '#18181b',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: isMobile ? 8 : 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: isMobile ? 6 : 8
                  }}>
                    {/* 左边：客户名称 */}
                    <div style={{ 
                      flex: '0 0 auto',
                      minWidth: isMobile ? '60px' : '80px',
                      maxWidth: isMobile ? '80px' : '120px'
                    }}>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: isMobile ? '12px' : '13px', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.2'
                      }}>
                        {clientName}
                      </div>
                    </div>
                    
                    {/* 中间：课时信息 */}
                    <div style={{ 
                      flex: 1,
                      textAlign: 'center',
                      minWidth: 0
                    }}>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: isMobile ? '11px' : '12px',
                        lineHeight: '1.2'
                      }}>
                        <span style={{ color: '#3b82f6' }}>{pkg.totalSessions}</span> {t('sessions')}
                      </div>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: isMobile ? '10px' : '11px',
                        lineHeight: '1.2'
                      }}>
                        {t('remaining')} <span style={{ color: '#f59e0b' }}>{pkg.remainingSessions}</span> {t('sessions')}
                      </div>
                    </div>
                    
                    {/* 右边：配套金额 */}
                    <div style={{ 
                      flex: '0 0 auto',
                      minWidth: isMobile ? '60px' : '80px',
                      textAlign: 'right'
                    }}>
                      <div style={{ 
                        color: '#8b5cf6', 
                        fontSize: isMobile ? '12px' : '14px', 
                        fontWeight: 700
                      }}>
                        ${(pkg.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      
      {/* 底部间距 - 确保最后一个卡片完整显示 */}
      <div style={{ height: isMobile ? 120 : 60 }} />
    </div>
  );
} 