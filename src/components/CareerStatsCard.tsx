"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Client } from "@/types/client";
import type { Package } from "@/types/package";
import type { Coach } from "@/types/coach";
import type { ScheduleItem } from "@/types/schedule";
import type { Prospect } from "@/types/prospect";
import { useRouter } from "next/navigation";

export default function CareerStatsCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    if (!user) return;

    // 实时监听客户数据
    const clientsQuery = query(collection(db, "clients"), where("coachId", "==", user.uid));
    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    });

    // 实时监听配套数据
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

    // 实时监听潜在顾客数据
    const prospectsQuery = query(collection(db, "prospects"), where("coachId", "==", user.uid));
    const prospectsUnsubscribe = onSnapshot(prospectsQuery, (snapshot) => {
      const prospectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
      setProspects(prospectsData);
    });

    // 获取教练信息
    const fetchCoachInfo = async () => {
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

    fetchCoachInfo();

    return () => {
      clientsUnsubscribe();
      packagesUnsubscribe();
      schedulesUnsubscribe();
      prospectsUnsubscribe();
    };
  }, [user]);

  if (!user) return null;

  // 总客户人数
  const totalClients = clients.length;

  // 剩余客户配套
  const remainingPackages = packages.filter(pkg => !pkg.isExpired && pkg.remainingSessions > 0).length;

  // 潜在顾客（从prospects集合获取）
  const potentialClients = prospects.length;

  // 生涯执教时长（已完成课程的总数，包括取消但扣课时的课程）
  const careerDuration = schedules.filter(schedule => 
    schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction'
  ).length;

  // 总进账 - 计算所有配套的总金额
  const totalIncome = packages.reduce((total, pkg) => total + (pkg.totalAmount || 0), 0);

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
        <h2 style={{ color: "#fff", fontSize: "clamp(14px, 3vw, 20px)", fontWeight: 600, margin: 0 }}>{t('myCareer')}</h2>
      </div>
      {/* 第一行：总进账（占一整行） */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr", // 占一整行
        gap: 6,
        width: '100%',
        marginBottom: 6
      }}>
        <div style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          borderRadius: 8,
          padding: 12,
          textAlign: "center",
          color: "#fff",
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, marginBottom: 4 }}>${totalIncome.toFixed(2)}</div>
          <div style={{ fontSize: "clamp(11px, 2.5vw, 13px)", opacity: 0.9 }}>{t('totalIncome')}</div>
        </div>
      </div>

      {/* 第二行：其他统计卡片 */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", // 固定为两列
        gap: 6, // 减少网格间距
        width: '100%' // 确保网格占满容器宽度
      }}>
        {/* 总客户人数 */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击总客户人数卡片，准备跳转到 /clients');
            try {
              router.push('/clients');
            } catch (error) {
              console.error('router.push 失败，使用 window.location:', error);
              window.location.href = '/clients';
            }
          }}
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
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
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{totalClients}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('totalClients')}</div>
        </div>

        {/* 剩余客户配套 */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击剩余客户配套卡片，准备跳转到 /stats/remaining-packages');
            try {
              router.push('/stats/remaining-packages');
            } catch (error) {
              console.error('router.push 失败，使用 window.location:', error);
              window.location.href = '/stats/remaining-packages';
            }
          }}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{remainingPackages}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('remainingPackages')}</div>
        </div>

        {/* 潜在顾客 */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击潜在顾客卡片，准备跳转到 /prospects');
            try {
              router.push('/prospects');
            } catch (error) {
              console.error('router.push 失败，使用 window.location:', error);
              window.location.href = '/prospects';
            }
          }}
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
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
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{potentialClients}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('prospects')}</div>
        </div>

        {/* 生涯执教时长 */}
        <div style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          borderRadius: 8, // 减小圆角
          padding: 8, // 减少内边距
          textAlign: "center",
          color: "#fff",
          width: '100%', // 确保宽度一致
          boxSizing: 'border-box' // 确保padding不会影响总宽度
        }}>
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, marginBottom: 2 }}>{careerDuration}</div>
          <div style={{ fontSize: "clamp(9px, 2vw, 11px)", opacity: 0.9 }}>{t('careerCoachingDuration')}</div>
        </div>
      </div>
    </div>
  );
} 