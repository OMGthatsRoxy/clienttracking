"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import Link from "next/link";
import type { ScheduleItem } from "@/types/schedule";
import type { LessonRecord } from "@/types/lessonRecord";
import type { Package } from "@/types/package";

export default function BatchUpdatePage() {
  const { user } = useAuth();
  const { t: _t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    totalSchedules: 0,
    totalLessonRecords: 0,
    totalPackages: 0,
    updatedSchedules: 0,
    updatedPackages: 0,
    skippedSchedules: 0,
    errors: 0
  });
  
  // 检测移动设备
  useEffect(() => {
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

  // 批量更新所有课程状态
  const batchUpdateScheduleStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    setProgress("开始批量更新...");
    
    try {
      // 1. 获取所有课程记录
      setProgress("正在获取课程记录...");
      const lessonRecordsQuery = query(
        collection(db, "lessonRecords"),
        where("coachId", "==", user.uid)
      );
      const lessonRecordsSnapshot = await getDocs(lessonRecordsQuery);
      const lessonRecords = lessonRecordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LessonRecord[];
      
      setStats(prev => ({ ...prev, totalLessonRecords: lessonRecords.length }));
      setProgress(`找到 ${lessonRecords.length} 条课程记录`);
      
      // 2. 获取所有课程排程
      setProgress("正在获取课程排程...");
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("coachId", "==", user.uid)
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleItem[];
      
      setStats(prev => ({ ...prev, totalSchedules: schedules.length }));
      setProgress(`找到 ${schedules.length} 条课程排程`);
      
      // 3. 获取所有配套
      setProgress("正在获取配套信息...");
      const packagesQuery = query(
        collection(db, "packages"),
        where("coachId", "==", user.uid)
      );
      const packagesSnapshot = await getDocs(packagesQuery);
      const packages = packagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Package[];
      
      setStats(prev => ({ ...prev, totalPackages: packages.length }));
      setProgress(`找到 ${packages.length} 个配套`);
      
      // 4. 创建课程记录映射
      const lessonRecordMap = new Map<string, LessonRecord>();
      lessonRecords.forEach(record => {
        const key = `${record.clientId}-${record.lessonDate}-${record.lessonTime}`;
        lessonRecordMap.set(key, record);
      });
      
      // 5. 批量更新课程状态和配套剩余次数
      setProgress("正在批量更新课程状态和配套剩余次数...");
      const batch = writeBatch(db);
      let updatedCount = 0;
      let updatedPackagesCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // 统计每个配套的课程记录数量
      const packageLessonCount = new Map<string, number>();
      
      for (const record of lessonRecords) {
        const packageId = record.packageId;
        if (packageId) {
          packageLessonCount.set(packageId, (packageLessonCount.get(packageId) || 0) + 1);
        }
      }
      
      // 更新课程状态
      for (const schedule of schedules) {
        try {
          const scheduleTime = schedule.startTime || schedule.time;
          const key = `${schedule.clientId}-${schedule.date}-${scheduleTime}`;
          const hasLessonRecord = lessonRecordMap.has(key);
          
          if (hasLessonRecord && schedule.status !== 'completed') {
            // 有课程记录但状态不是已完成，需要更新
            const scheduleRef = doc(db, "schedules", schedule.id!);
            batch.update(scheduleRef, {
              status: 'completed',
              updatedAt: new Date().toISOString()
            });
            updatedCount++;
          } else if (!hasLessonRecord && schedule.status === 'completed') {
            // 没有课程记录但状态是已完成，需要改回scheduled
            const scheduleRef = doc(db, "schedules", schedule.id!);
            batch.update(scheduleRef, {
              status: 'scheduled',
              updatedAt: new Date().toISOString()
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`更新课程 ${schedule.id} 失败:`, error);
          errorCount++;
        }
      }
      
      // 更新配套剩余次数
      for (const pkg of packages) {
        try {
          const lessonCount = packageLessonCount.get(pkg.id!) || 0;
          const expectedRemaining = Math.max(0, (pkg.totalSessions || 0) - lessonCount);
          
          if (pkg.remainingSessions !== expectedRemaining) {
            const packageRef = doc(db, "packages", pkg.id!);
            batch.update(packageRef, {
              remainingSessions: expectedRemaining,
              updatedAt: new Date().toISOString()
            });
            updatedPackagesCount++;
          }
        } catch (error) {
          console.error(`更新配套 ${pkg.id} 失败:`, error);
          errorCount++;
        }
      }
      
      // 5. 提交批量更新
      setProgress("正在提交批量更新...");
      await batch.commit();
      
      setStats(prev => ({ 
        ...prev, 
        updatedSchedules: updatedCount,
        updatedPackages: updatedPackagesCount,
        skippedSchedules: skippedCount,
        errors: errorCount
      }));
      
      setProgress(`批量更新完成！更新了 ${updatedCount} 条课程记录，${updatedPackagesCount} 个配套，跳过了 ${skippedCount} 条记录，错误 ${errorCount} 条`);
      
    } catch (error) {
      console.error("批量更新失败:", error);
      setProgress(`批量更新失败: ${error}`);
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
    } finally {
      setLoading(false);
    }
  };

  // 重新计算统计数据
  const recalculateStats = async () => {
    if (!user) return;
    
    setLoading(true);
    setProgress("正在重新计算统计数据...");
    
    try {
      // 获取更新后的数据
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("coachId", "==", user.uid)
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleItem[];
      
      // 计算统计数据
      const completedSchedules = schedules.filter(s => s.status === 'completed');
      const cancelledWithDeduction = schedules.filter(s => s.status === 'cancelled_with_deduction');
      const totalCompleted = completedSchedules.length + cancelledWithDeduction.length;
      
      setProgress(`重新计算完成！总课程: ${schedules.length}, 已完成: ${completedSchedules.length}, 取消扣课时: ${cancelledWithDeduction.length}, 总计: ${totalCompleted}`);
      
    } catch (error) {
      console.error("重新计算统计数据失败:", error);
      setProgress(`重新计算失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新现有课程记录的packageId
  const updateLessonRecordPackageIds = async () => {
    if (!user) return;
    
    setLoading(true);
    setProgress("正在更新课程记录的配套ID...");
    
    try {
      // 获取所有课程记录
      const lessonRecordsQuery = query(
        collection(db, "lessonRecords"),
        where("coachId", "==", user.uid)
      );
      const lessonRecordsSnapshot = await getDocs(lessonRecordsQuery);
      const lessonRecords = lessonRecordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LessonRecord[];
      
      // 获取所有课程排程
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("coachId", "==", user.uid)
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleItem[];
      
      // 创建课程排程映射
      const scheduleMap = new Map<string, ScheduleItem>();
      schedules.forEach(schedule => {
        const scheduleTime = schedule.startTime || schedule.time;
        const key = `${schedule.clientId}-${schedule.date}-${scheduleTime}`;
        scheduleMap.set(key, schedule);
      });
      
      // 批量更新课程记录
      const batch = writeBatch(db);
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const record of lessonRecords) {
        const key = `${record.clientId}-${record.lessonDate}-${record.lessonTime}`;
        const schedule = scheduleMap.get(key);
        
        if (schedule && schedule.packageId && !record.packageId) {
          // 找到对应的课程排程，且有配套ID，但课程记录没有配套ID
          const recordRef = doc(db, "lessonRecords", record.id!);
          batch.update(recordRef, {
            packageId: schedule.packageId,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      }
      
      // 提交批量更新
      await batch.commit();
      
      setProgress(`更新完成！更新了 ${updatedCount} 条课程记录，跳过了 ${skippedCount} 条记录`);
      
    } catch (error) {
      console.error("更新课程记录配套ID失败:", error);
      setProgress(`更新失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 20, color: '#fff' }}>
        请先登录
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#18181b",
      padding: isMobile ? "12px" : "20px",
      paddingBottom: "100px",
      color: "#fff"
    }}>
      <h1 style={{ 
        marginBottom: isMobile ? 16 : 20,
        fontSize: isMobile ? "clamp(20px, 5vw, 24px)" : "24px"
      }}>批量更新课程状态</h1>
      
      <div style={{
        background: '#23232a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: 20,
        border: '1px solid #333'
      }}>
        <h2 style={{ marginBottom: 16 }}>操作说明</h2>
        <ul style={{ lineHeight: 1.6, marginBottom: 20 }}>
          <li>此功能将根据课程记录自动更新所有课程的状态</li>
          <li>有课程记录的课程状态将更新为&quot;已完成&quot;</li>
          <li>没有课程记录的已完成课程将改回&quot;已排程&quot;</li>
          <li>自动计算并更新所有配套的剩余次数</li>
          <li>所有统计卡片将自动更新</li>
        </ul>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={batchUpdateScheduleStatus}
            disabled={loading}
            style={{
              background: loading ? '#666' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {loading ? '更新中...' : '开始批量更新'}
          </button>
          
          <button
            onClick={updateLessonRecordPackageIds}
            disabled={loading}
            style={{
              background: loading ? '#666' : '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            更新课程记录配套ID
          </button>
          
          <button
            onClick={recalculateStats}
            disabled={loading}
            style={{
              background: loading ? '#666' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            重新计算统计
          </button>
        </div>
      </div>
      
      {progress && (
        <div style={{
          background: '#23232a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: 20,
          border: '1px solid #333'
        }}>
          <h3 style={{ marginBottom: 12 }}>进度</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{progress}</p>
        </div>
      )}
      
      <div style={{
        background: '#23232a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #333'
      }}>
        <h3 style={{ marginBottom: 16 }}>统计信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {stats.totalSchedules}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>总课程排程</div>
          </div>
          
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              {stats.totalLessonRecords}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>总课程记录</div>
          </div>
          
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {stats.updatedSchedules}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>已更新课程</div>
          </div>
          
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>
              {stats.updatedPackages}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>已更新配套</div>
          </div>
          
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#6b7280' }}>
              {stats.skippedSchedules}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>跳过课程</div>
          </div>
          
          <div style={{
            background: '#374151',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
              {stats.errors}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>错误数量</div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <Link 
          href="/"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '16px'
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
} 