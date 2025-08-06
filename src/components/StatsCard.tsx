"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Client } from "@/types/client";
import type { Package } from "@/types/package";
import type { ScheduleItem } from "@/types/schedule";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 获取今日日期（使用本地时区）
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当前月份（使用本地时区，与getTodayDate保持一致）
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function StatsCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (!user) return;

    // 实时监听客户数据
    const clientsQuery = query(collection(db, "clients"), where("coachId", "==", user.uid));
    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    });

    // 实时监听配套数据 - 只获取当前教练的配套
    const packagesQuery = query(collection(db, "packages"), where("coachId", "==", user.uid));
    const packagesUnsubscribe = onSnapshot(packagesQuery, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
    });

    // 实时监听日程表数据
    const schedulesQuery = query(collection(db, "schedules"), where("coachId", "==", user.uid));
    const schedulesUnsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScheduleItem));
      setSchedules(schedulesData);
    });

    return () => {
      clientsUnsubscribe();
      packagesUnsubscribe();
      schedulesUnsubscribe();
    };
  }, [user]);

  if (!user) return null;

  const currentMonth = getCurrentMonth();
  const today = getTodayDate();

  // 本月活跃客户（本月有预约过课程并且扣课时的总人数）
  const monthlyActiveClients = new Set(
    schedules
      .filter(schedule => 
        schedule.date.startsWith(currentMonth) && 
        (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
      )
      .map(schedule => schedule.clientId)
  ).size;

  // 剩余客户配套数量
  const remainingPackages = packages.filter(pkg => !pkg.isExpired && pkg.remainingSessions > 0).length;

  // 今日课程数量（今日所有课程总数）
  const todaySchedules = schedules.filter(schedule => {
    if (schedule.date === today) return true;
    try {
      const scheduleDate = new Date(schedule.date + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      return scheduleDate.getTime() === todayDate.getTime();
    } catch (error) {
      return false;
    }
  }).length;

  // 本月已完成课程（包括取消但扣课时的课程）
  const monthlyCompletedCourses = schedules.filter(schedule => 
    schedule.date.startsWith(currentMonth) && (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
  ).length;

  // 本月新增配套数量 - 改进的计算逻辑
  const monthlyNewPackages = packages.filter(pkg => {
    let isInCurrentMonth = false;
    
    // 优先使用createdAt字段
    if (pkg.createdAt) {
      try {
        // 处理不同的日期格式
        let createdDate;
        if (pkg.createdAt.includes('T')) {
          createdDate = pkg.createdAt.split('T')[0];
        } else {
          createdDate = pkg.createdAt;
        }
        isInCurrentMonth = createdDate.startsWith(currentMonth);
      } catch (error) {
        console.error('解析createdAt日期失败:', pkg.createdAt, error);
      }
    }
    
    // 如果没有createdAt或解析失败，使用startDate作为备选
    if (!isInCurrentMonth) {
      isInCurrentMonth = pkg.startDate.startsWith(currentMonth);
    }
    
    // 如果还是没有匹配，检查是否是当前教练的配套（兼容旧数据）
    if (!isInCurrentMonth && pkg.coachId === user.uid) {
      // 对于没有createdAt的配套，假设是最近创建的
      isInCurrentMonth = true;
    }
    
    return isInCurrentMonth;
  }).length;

  // 本月进账 - 计算本月新增配套的总金额
  const monthlyIncome = packages.filter(pkg => {
    let isInCurrentMonth = false;
    
    // 优先使用createdAt字段
    if (pkg.createdAt) {
      try {
        const createdDate = pkg.createdAt.includes('T') ? pkg.createdAt.split('T')[0] : pkg.createdAt;
        isInCurrentMonth = createdDate.startsWith(currentMonth);
      } catch (error) {
        isInCurrentMonth = false;
      }
    }
    
    // 如果没有createdAt或解析失败，使用startDate作为备选
    if (!isInCurrentMonth) {
      isInCurrentMonth = pkg.startDate.startsWith(currentMonth);
    }
    
    // 如果还是没有匹配，检查是否是当前教练的配套（兼容旧数据）
    if (!isInCurrentMonth && pkg.coachId === user.uid) {
      isInCurrentMonth = true;
    }
    
    return isInCurrentMonth;
  }).reduce((total, pkg) => total + (pkg.totalAmount || 0), 0);

  // 调试信息：本月新增配套
  console.log('本月新增配套统计:', {
    currentMonth,
    totalPackages: packages.length,
    monthlyNewPackages,
    packagesWithCreatedAt: packages.filter(p => p.createdAt).length,
    packagesWithoutCreatedAt: packages.filter(p => !p.createdAt).length,
    packagesWithCoachId: packages.filter(p => p.coachId).length,
    // 显示所有配套的详细信息
    allPackages: packages.map(p => ({
      id: p.id,
      clientId: p.clientId,
      coachId: p.coachId,
      startDate: p.startDate,
      createdAt: p.createdAt,
      createdDate: p.createdAt ? p.createdAt.split('T')[0] : null,
      isInCurrentMonth: (() => {
        if (p.createdAt) {
          try {
            const createdDate = p.createdAt.includes('T') ? p.createdAt.split('T')[0] : p.createdAt;
            return createdDate.startsWith(currentMonth);
          } catch (error) {
            return false;
          }
        }
        if (p.startDate.startsWith(currentMonth)) {
          return true;
        }
        if (p.coachId === user.uid) {
          return true; // 兼容旧数据
        }
        return false;
      })()
    })),
    // 本月新增的配套详情
    monthlyNewPackagesDetails: packages.filter(pkg => {
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
    }).map(pkg => ({
      id: pkg.id,
      clientId: pkg.clientId,
      coachId: pkg.coachId,
      createdAt: pkg.createdAt?.split('T')[0],
      startDate: pkg.startDate,
      usedStartDate: !pkg.createdAt,
      usedCoachId: !pkg.createdAt && pkg.coachId === user.uid
    }))
  });

  return (
    <div className="form-card stats-card" style={{ 
      maxWidth: 1200, 
      width: '100%', 
      marginBottom: 12,
      background: '#23232a',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #333',
      boxSizing: 'border-box' // 确保padding不会影响总宽度
    }}>
      <div style={{ marginBottom: 8 }}> {/* 减少底部间距 */}
        <h2 style={{ color: "#fff", fontSize: "clamp(14px, 3vw, 20px)", fontWeight: 600, margin: 0 }}>{t('monthlyPerformance')}</h2>
        

      </div>
      {/* 第一行：本月进账（占一整行） */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr", // 占一整行
        gap: 6,
        width: '100%',
        marginBottom: 6
      }}>
        <Link href="/stats/monthly-income" style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: 8,
          padding: 12,
          textAlign: "center",
          color: "#fff",
          width: '100%',
          boxSizing: 'border-box',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, marginBottom: 4 }}>${monthlyIncome.toFixed(2)}</div>
          <div style={{ fontSize: "clamp(11px, 2.5vw, 13px)", opacity: 0.9 }}>{t('monthlyIncome')}</div>
        </Link>
      </div>

      {/* 第二行：其他统计卡片 */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", // 固定为两列
        gap: 6, // 减少网格间距
        width: '100%' // 确保网格占满容器宽度
      }}>
        {/* 今日课程 */}
        <div 
          onClick={() => router.push('/schedule?viewMode=day')}
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: 8, // 减小圆角
            padding: 8, // 减少内边距
            textAlign: "center",
            color: "#fff",
            width: '100%', // 确保宽度一致
            boxSizing: 'border-box', // 确保padding不会影响总宽度
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{todaySchedules}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('todayCourses')}</div>
        </div>

        {/* 本月已完成课程 */}
        <Link href="/stats/monthly-completed-courses" style={{
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          borderRadius: 8, // 减小圆角
          padding: 8, // 减少内边距
          textAlign: "center",
          color: "#fff",
          width: '100%', // 确保宽度一致
          boxSizing: 'border-box', // 确保padding不会影响总宽度
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{monthlyCompletedCourses}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('monthlyCompletedCourses')}</div>
        </Link>

        {/* 本月新增配套 */}
        <Link href="/stats/monthly-new-packages" style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          borderRadius: 8, // 减小圆角
          padding: 8, // 减少内边距
          textAlign: "center",
          color: "#fff",
          width: '100%', // 确保宽度一致
          boxSizing: 'border-box', // 确保padding不会影响总宽度
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{monthlyNewPackages}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('monthlyNewPackages')}</div>
        </Link>

        {/* 本月活跃客户 */}
        <Link href="/stats/monthly-active-clients" style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: 8, // 减小圆角
          padding: 8, // 减少内边距
          textAlign: "center",
          color: "#fff",
          width: '100%', // 确保宽度一致
          boxSizing: 'border-box', // 确保padding不会影响总宽度
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{monthlyActiveClients}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('monthlyActiveClients')}</div>
        </Link>
      </div>
    </div>
  );
} 