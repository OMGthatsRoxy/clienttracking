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

export default function MonthlyCompletedCoursesPage() {
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

  // 本月已完成课程（包括取消但扣课时的课程）
  const monthlyCompletedCourses = schedules.filter(schedule => 
    schedule.date.startsWith(currentMonth) && 
    (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
  );

  // 获取客户名称的辅助函数
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || t('unknownClient');
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'cancelled_with_deduction':
        return t('cancelledWithDeduction');
      default:
        return t('unknownStatus');
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'cancelled_with_deduction':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
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
            {t('monthlyCompletedCourses')}
          </h1>
        </div>
        
        {/* 总课程数显示 */}
        <div style={{
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          borderRadius: 8,
          padding: isMobile ? "8px 12px" : "12px 16px",
          textAlign: "center",
          color: "#fff",
          marginBottom: 12
        }}>
          <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, marginBottom: 4 }}>
            {monthlyCompletedCourses.length}
          </div>
          <div style={{ fontSize: "clamp(10px, 2vw, 12px)", opacity: 0.9 }}>
            {currentMonth} {t('monthlyCompletedCourses')}
          </div>
          <div style={{ fontSize: "clamp(8px, 1.5vw, 10px)", opacity: 0.8, marginTop: 4 }}>
            {t('includesCompletedAndCancelledCourses')}
          </div>
        </div>
      </div>

      {/* 课程详情 */}
      <div style={cardStyle}>
        <h2 style={{ 
          color: "#fff", 
          fontSize: "clamp(14px, 2.5vw, 16px)", 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          {t('courseDetails')}
        </h2>
        
        {monthlyCompletedCourses.length === 0 ? (
          <div style={{ 
            color: '#a1a1aa', 
            textAlign: 'center', 
            padding: '40px',
            fontSize: '16px'
          }}>
            {t('noCompletedCoursesThisMonth')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: isMobile ? 6 : 8 
          }}>
            {monthlyCompletedCourses
              .sort((a, b) => {
                const clientNameA = getClientName(a.clientId);
                const clientNameB = getClientName(b.clientId);
                return clientNameA.localeCompare(clientNameB, 'zh-CN'); // 按客户名称排序
              })
              .map((schedule) => {
                const clientName = getClientName(schedule.clientId);
                return (
                  <div key={schedule.id} style={{
                    background: '#18181b',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: isMobile ? 8 : 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 4 : 6
                  }}>
                    {/* 客户名称和状态 */}
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
                      </div>
                      <div style={{
                        background: getStatusColor(schedule.status),
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '9px' : '10px',
                        fontWeight: 600,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {getStatusText(schedule.status)}
                      </div>
                    </div>
                    
                    {/* 课程信息 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: isMobile ? 4 : 6
                    }}>
                      {/* 日期和时间 */}
                      <div style={{ 
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '10px' : '11px',
                          lineHeight: '1.2'
                        }}>
                          📅 {schedule.date}
                        </div>
                        <div style={{ 
                          color: '#a1a1aa', 
                          fontSize: isMobile ? '9px' : '10px',
                          lineHeight: '1.2'
                        }}>
                          🕐 {schedule.startTime || schedule.time} - {schedule.endTime}
                        </div>
                      </div>
                      
                      {/* 课程ID */}
                      <div style={{ 
                        flex: '0 0 auto',
                        minWidth: isMobile ? '50px' : '60px',
                        textAlign: 'right'
                      }}>
                        <div style={{ 
                          color: '#71717a', 
                          fontSize: isMobile ? '8px' : '9px',
                          lineHeight: '1.2'
                        }}>
                          ID: {schedule.id?.slice(-6) || 'N/A'}
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