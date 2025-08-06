"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coach } from "@/types/coach";
import type { Client } from "@/types/client";
import type { Prospect } from "@/types/prospect";
import type { LessonRecord } from "@/types/lessonRecord";
import type { Package } from "@/types/package";
import type { ScheduleItem } from "@/types/schedule";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface UserStats {
  totalClients: number;
  totalProspects: number;
  totalLessonRecords: number;
  totalPackages: number;
  totalSchedules: number;
  totalIncome: number;
  activeClients: number;
  completedLessons: number;
}

export default function UserDetailPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [coach, setCoach] = useState<Coach | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalClients: 0,
    totalProspects: 0,
    totalLessonRecords: 0,
    totalPackages: 0,
    totalSchedules: 0,
    totalIncome: 0,
    activeClients: 0,
    completedLessons: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检查是否为管理员
    if (!user) {
      router.push('/');
      return;
    }

    const isAdmin = user.email === "admin@example.com" || user.email?.includes("admin");
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 获取教练基本信息
        const coachDoc = await getDoc(doc(db, "coaches", userId));
        if (!coachDoc.exists()) {
          alert("用户不存在");
          router.push('/admin');
          return;
        }
        
        const coachData = { id: coachDoc.id, ...coachDoc.data() } as Coach;
        setCoach(coachData);

        // 获取统计数据
        const [
          clientsSnapshot,
          prospectsSnapshot,
          lessonRecordsSnapshot,
          packagesSnapshot,
          schedulesSnapshot
        ] = await Promise.all([
          getDocs(query(collection(db, "clients"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "prospects"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "lessonRecords"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "packages"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "schedules"), where("coachId", "==", userId)))
        ]);

        // 计算统计数据
        const clients = clientsSnapshot.docs.map(doc => doc.data() as Client);
        const lessonRecords = lessonRecordsSnapshot.docs.map(doc => doc.data() as LessonRecord);
        const packages = packagesSnapshot.docs.map(doc => doc.data() as Package);

        const totalIncome = packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0);
        const activeClients = clients.filter(c => c.status === 'active').length;
        const completedLessons = lessonRecords.filter(r => r.status === 'completed').length;

        setStats({
          totalClients: clientsSnapshot.size,
          totalProspects: prospectsSnapshot.size,
          totalLessonRecords: lessonRecordsSnapshot.size,
          totalPackages: packagesSnapshot.size,
          totalSchedules: schedulesSnapshot.size,
          totalIncome,
          activeClients,
          completedLessons
        });

      } catch (error) {
        console.error("获取用户数据失败:", error);
        alert("获取用户数据失败");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [user, router, userId]);

  const containerStyle = {
    minHeight: "100vh",
    background: "#18181b",
    paddingLeft: isMobile ? "8px" : "16px",
    paddingRight: isMobile ? "8px" : "16px",
    paddingBottom: isMobile ? "120px" : "100px",
    paddingTop: isMobile ? "8px" : "16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    maxWidth: "100%",
    width: "100%",
    overflowY: "auto" as const,
    overflowX: "hidden" as const
  };

  const cardStyle = {
    maxWidth: 1200,
    width: "100%",
    marginBottom: isMobile ? 8 : 12,
    background: "#23232a",
    borderRadius: "12px",
    padding: isMobile ? "12px" : "16px",
    border: "1px solid #333"
  };

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#a1a1aa", textAlign: "center" }}>请先登录</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#a1a1aa", textAlign: "center" }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#a1a1aa", textAlign: "center" }}>用户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 返回按钮 */}
      <div style={cardStyle}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <button style={{
            background: "#23232a",
            color: "#60a5fa",
            border: "1px solid #60a5fa",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ← 返回用户列表
          </button>
        </Link>
      </div>

      {/* 用户基本信息 */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: isMobile ? "center" : "flex-start"
        }}>
          {/* 用户头像 */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: coach.avatar ? "transparent" : "#60a5fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 600,
            color: "#18181b",
            flexShrink: 0
          }}>
            {coach.avatar ? (
              <img
                src={coach.avatar}
                alt="用户头像"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            ) : (
              coach.displayName?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          {/* 用户信息 */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? "clamp(24px, 6vw, 32px)" : "32px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 8
            }}>
              {coach.displayName || "未设置姓名"}
            </h1>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              fontSize: 14,
              color: "#a1a1aa"
            }}>
              <div>
                <strong>邮箱:</strong> {coach.email || "未设置"}
              </div>
              {coach.phone && (
                <div>
                  <strong>电话:</strong> {coach.phone}
                </div>
              )}
              {coach.location && (
                <div>
                  <strong>位置:</strong> {coach.location}
                </div>
              )}
              {coach.experience && (
                <div>
                  <strong>经验:</strong> {coach.experience} 年
                </div>
              )}
              {coach.education && (
                <div>
                  <strong>教育:</strong> {coach.education}
                </div>
              )}
            </div>

            {coach.bio && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#fff" }}>简介:</strong>
                <p style={{ color: "#a1a1aa", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  {coach.bio}
                </p>
              </div>
            )}

            {coach.specialties && coach.specialties.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#fff" }}>专长:</strong>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6, 
                  marginTop: 4 
                }}>
                  {coach.specialties.map((specialty, index) => (
                    <span key={index} style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#60a5fa",
                      color: "#18181b",
                      fontSize: 12
                    }}>
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {coach.certifications && coach.certifications.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#fff" }}>认证:</strong>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6, 
                  marginTop: 4 
                }}>
                  {coach.certifications.map((cert, index) => (
                    <span key={index} style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#10b981",
                      color: "#fff",
                      fontSize: 12
                    }}>
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {coach.languages && coach.languages.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#fff" }}>语言:</strong>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6, 
                  marginTop: 4 
                }}>
                  {coach.languages.map((lang, index) => (
                    <span key={index} style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#8b5cf6",
                      color: "#fff",
                      fontSize: 12
                    }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <span style={{
                padding: "4px 8px",
                borderRadius: 4,
                background: coach.isPublic ? "#10b981" : "#6b7280",
                color: "#fff",
                fontSize: 12
              }}>
                {coach.isPublic ? "公开资料" : "私密资料"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 16,
          textAlign: "center"
        }}>
          数据统计
        </h2>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 16
        }}>
          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#60a5fa" }}>
              {stats.totalClients}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              总客户数
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
              {stats.activeClients}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              活跃客户
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>
              {stats.totalLessonRecords}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              课程记录
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#8b5cf6" }}>
              {stats.completedLessons}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              已完成课程
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#ec4899" }}>
              {stats.totalProspects}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              潜在客户
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#06b6d4" }}>
              {stats.totalPackages}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              套餐数量
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>
              {stats.totalSchedules}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              排课数量
            </div>
          </div>

          <div style={{
            textAlign: "center",
            padding: "16px",
            background: "#18181b",
            borderRadius: 8,
            border: "1px solid #333"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
              ¥{stats.totalIncome.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              总收入
            </div>
          </div>
        </div>
      </div>

      {/* 注册信息 */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 16
        }}>
          账户信息
        </h2>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 12,
          fontSize: 14,
          color: "#a1a1aa"
        }}>
          <div>
            <strong>用户ID:</strong> {coach.id}
          </div>
          <div>
            <strong>注册时间:</strong> {coach.createdAt || "未知"}
          </div>
          <div>
            <strong>最后登录:</strong> {coach.lastLoginAt || "未知"}
          </div>
          <div>
            <strong>最后更新:</strong> {coach.updatedAt || "未知"}
          </div>
        </div>
      </div>
    </div>
  );
}
