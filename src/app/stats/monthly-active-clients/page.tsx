"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { ScheduleItem } from "@/types/schedule";
import type { Client } from "@/types/client";
import Link from "next/link";

// 获取当前月份
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function MonthlyActiveClientsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
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

    // 实时监听日程表数据
    const schedulesQuery = query(collection(db, "schedules"), where("coachId", "==", user.uid));
    const schedulesUnsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScheduleItem));
      setSchedules(schedulesData);
    });

    // 实时监听客户数据
    const clientsQuery = query(collection(db, "clients"), where("coachId", "==", user.uid));
    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      schedulesUnsubscribe();
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

  // 本月活跃客户（本月有预约过课程并且扣课时的客户）
  const monthlyActiveClients = new Set(
    schedules
      .filter(schedule => 
        schedule.date.startsWith(currentMonth) && 
        (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
      )
      .map(schedule => schedule.clientId)
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

  // 获取客户本月课程统计
  const getClientStats = (clientId: string) => {
    const clientSchedules = schedules.filter(schedule => 
      schedule.clientId === clientId &&
      schedule.date.startsWith(currentMonth) && 
      (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
    );
    
    return {
      totalCourses: clientSchedules.length,
      completedCourses: clientSchedules.filter(s => s.status === 'completed').length,
      cancelledCourses: clientSchedules.filter(s => s.status === 'cancelled_with_deduction').length
    };
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

  const activeClientsArray = Array.from(monthlyActiveClients);

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
            {t('monthlyActiveClients')}
          </h1>
        </div>
        
        {/* 总客户数显示 */}
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: 8,
          padding: isMobile ? "8px 12px" : "12px 16px",
          textAlign: "center",
          color: "#fff",
          marginBottom: 12
        }}>
          <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, marginBottom: 4 }}>
            {activeClientsArray.length}
          </div>
          <div style={{ fontSize: "clamp(10px, 2vw, 12px)", opacity: 0.9 }}>
            {currentMonth} {t('monthlyActiveClients')}
          </div>
          <div style={{ fontSize: "clamp(8px, 1.5vw, 10px)", opacity: 0.8, marginTop: 4 }}>
            {t('clientsWithBookedAndDeductedCourses')}
          </div>
        </div>
      </div>

      {/* 客户详情 */}
      <div style={cardStyle}>
        <h2 style={{ 
          color: "#fff", 
          fontSize: "clamp(14px, 2.5vw, 16px)", 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          {t('clientDetails')}
        </h2>
        
        {activeClientsArray.length === 0 ? (
          <div style={{ 
            color: '#a1a1aa', 
            textAlign: 'center', 
            padding: '40px',
            fontSize: '16px'
          }}>
            {t('noActiveClientsThisMonth')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: isMobile ? 6 : 8 
          }}>
            {activeClientsArray
              .sort((a, b) => {
                const clientNameA = getClientName(a);
                const clientNameB = getClientName(b);
                return clientNameA.localeCompare(clientNameB, 'zh-CN'); // 按客户名称排序
              })
              .map((clientId) => {
                const client = getClientInfo(clientId);
                const clientName = getClientName(clientId);
                const stats = getClientStats(clientId);
                return (
                  <div key={clientId} style={{
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
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '9px' : '10px',
                        fontWeight: 600,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {t('active')}
                      </div>
                    </div>
                    
                    {/* 课程统计 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: isMobile ? 4 : 6
                    }}>
                      {/* 总课程数 */}
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
                          {stats.totalCourses}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('totalCourses')}
                        </div>
                      </div>
                      
                      {/* 已完成课程 */}
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
                          {stats.completedCourses}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('completed')}
                        </div>
                      </div>
                      
                      {/* 取消课程 */}
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
                          {stats.cancelledCourses}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          {t('cancelled')}
                        </div>
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