"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Package } from "@/types/package";
import type { Client } from "@/types/client";
import Link from "next/link";

export default function RemainingPackagesPage() {
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

  // 筛选有效且还有剩余课程的配套
  const remainingPackages = packages.filter(pkg => 
    !pkg.isExpired && pkg.remainingSessions > 0
  );

  // 获取客户名称的辅助函数
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || t('unknownClient');
  };

  // 获取客户信息的辅助函数
  const getClientInfo = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client || null;
  };

  // 计算剩余课程百分比
  const getRemainingPercentage = (pkg: Package) => {
    if (pkg.totalSessions === 0) return 0;
    return Math.round((pkg.remainingSessions / pkg.totalSessions) * 100);
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
            {t('remainingClientPackages')}
          </h1>
        </div>
        
        {/* 总配套数显示 */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: 8,
          padding: isMobile ? "8px 12px" : "12px 16px",
          textAlign: "center",
          color: "#fff",
          marginBottom: 12
        }}>
          <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, marginBottom: 4 }}>
            {remainingPackages.length}
          </div>
          <div style={{ fontSize: "clamp(10px, 2vw, 12px)", opacity: 0.9 }}>
            {t('validPackagesWithRemainingSessions')}
          </div>
          <div style={{ fontSize: "clamp(8px, 1.5vw, 10px)", opacity: 0.8, marginTop: 4 }}>
            {t('totalRemainingSessions')}：{remainingPackages.reduce((total, pkg) => total + pkg.remainingSessions, 0)} {t('sessions')}
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
        
        {remainingPackages.length === 0 ? (
          <div style={{ 
            color: '#a1a1aa', 
            textAlign: 'center', 
            padding: '40px',
            fontSize: '16px'
          }}>
            {t('noRemainingPackages')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: isMobile ? 6 : 8 
          }}>
            {remainingPackages
              .sort((a, b) => {
                const clientNameA = getClientName(a.clientId);
                const clientNameB = getClientName(b.clientId);
                return clientNameA.localeCompare(clientNameB, 'zh-CN'); // 按客户名称排序
              })
              .map((pkg) => {
                const client = getClientInfo(pkg.clientId);
                const clientName = getClientName(pkg.clientId);
                const remainingPercentage = getRemainingPercentage(pkg);
                return (
                  <div key={pkg.id} style={{
                    background: '#18181b',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: isMobile ? 8 : 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 4 : 6
                  }}>
                    {/* 客户名称和基本信息 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        flex: 1, 
                        minWidth: 0,
                        marginRight: 8
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
                        {client && (
                          <div style={{ 
                            color: '#a1a1aa', 
                            fontSize: isMobile ? '9px' : '10px',
                            lineHeight: '1.2',
                            marginTop: 2
                          }}>
                            📞 {client.phone || t('noPhone')}
                          </div>
                        )}
                      </div>
                      <div style={{
                        background: '#10b981',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '9px' : '10px',
                        fontWeight: 600,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {t('valid')}
                      </div>
                    </div>
                    
                    {/* 配套信息 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: isMobile ? 4 : 6
                    }}>
                      {/* 总课时 */}
                      <div style={{ 
                        flex: 1,
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          color: '#3b82f6', 
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          lineHeight: '1.2'
                        }}>
                          {pkg.totalSessions}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('totalSessions')}
                        </div>
                      </div>
                      
                      {/* 剩余课时 */}
                      <div style={{ 
                        flex: 1,
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          color: '#f59e0b', 
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          lineHeight: '1.2'
                        }}>
                          {pkg.remainingSessions}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('remainingSessions')}
                        </div>
                      </div>
                      
                      {/* 配套金额 */}
                      <div style={{ 
                        flex: 1,
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          color: '#10b981', 
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          lineHeight: '1.2'
                        }}>
                          ${pkg.totalAmount?.toFixed(2) || '0.00'}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('packageAmount')}
                        </div>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div style={{ 
                      marginTop: isMobile ? 2 : 4
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 2
                      }}>
                        <span style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px'
                        }}>
                          {t('usageProgress')}
                        </span>
                        <span style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px'
                        }}>
                          {remainingPercentage}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: isMobile ? 4 : 6,
                        background: '#333',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${remainingPercentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          borderRadius: 3,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    
                    {/* 配套信息 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: isMobile ? 2 : 4
                    }}>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: isMobile ? '8px' : '9px'
                      }}>
                        📅 {pkg.startDate}
                      </div>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: isMobile ? '8px' : '9px'
                      }}>
                        ID: {pkg.id.slice(-6)}
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