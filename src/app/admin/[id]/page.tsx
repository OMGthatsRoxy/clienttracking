"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coach } from "@/types/coach";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  certifications?: string[];
  education?: string;
  location?: string;
  languages?: string[];
  isPublic?: boolean;
  avatar?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface UserStats {
  clientsCount: number;
  prospectsCount: number;
  lessonRecordsCount: number;
  packagesCount: number;
  schedulesCount: number;
}

export default function UserDetailPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    clientsCount: 0,
    prospectsCount: 0,
    lessonRecordsCount: 0,
    packagesCount: 0,
    schedulesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserData | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
        
        // 获取用户基本信息
        const coachDoc = await getDoc(doc(db, "coaches", userId));
        if (!coachDoc.exists()) {
          alert("用户不存在");
          router.push('/admin');
          return;
        }

        const coachData = coachDoc.data() as Coach;
        const userInfo: UserData = {
          uid: coachDoc.id,
          email: coachData.email || "未知邮箱",
          displayName: coachData.displayName || "未设置姓名",
          phone: coachData.phone || "未设置电话",
          bio: coachData.bio || "未设置简介",
          specialties: coachData.specialties || [],
          experience: coachData.experience || 0,
          certifications: coachData.certifications || [],
          education: coachData.education || "未设置教育背景",
          location: coachData.location || "未设置位置",
          languages: coachData.languages || [],
          isPublic: coachData.isPublic || false,
          avatar: coachData.avatar || "",
          createdAt: coachData.createdAt || "未知",
          lastLoginAt: coachData.lastLoginAt || "未知"
        };

        setUserData(userInfo);

        // 获取用户统计数据
        const [clientsSnapshot, prospectsSnapshot, lessonRecordsSnapshot, packagesSnapshot, schedulesSnapshot] = await Promise.all([
          getDocs(query(collection(db, "clients"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "prospects"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "lessonRecords"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "packages"), where("coachId", "==", userId))),
          getDocs(query(collection(db, "schedules"), where("coachId", "==", userId)))
        ]);

        setUserStats({
          clientsCount: clientsSnapshot.size,
          prospectsCount: prospectsSnapshot.size,
          lessonRecordsCount: lessonRecordsSnapshot.size,
          packagesCount: packagesSnapshot.size,
          schedulesCount: schedulesSnapshot.size
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

  // 删除用户及其所有数据
  const handleDeleteUser = async (userData: UserData) => {
    if (!userData.uid) return;
    
    try {
      setDeletingUserId(userData.uid);
      
      const batch = writeBatch(db);
      
      // 删除教练基本信息
      const coachRef = doc(db, "coaches", userData.uid);
      batch.delete(coachRef);
      
      // 删除该教练的所有客户
      const clientsSnapshot = await getDocs(
        query(collection(db, "clients"), where("coachId", "==", userData.uid))
      );
      clientsSnapshot.docs.forEach((clientDoc) => {
        batch.delete(clientDoc.ref);
      });
      
      // 删除该教练的所有潜在客户
      const prospectsSnapshot = await getDocs(
        query(collection(db, "prospects"), where("coachId", "==", userData.uid))
      );
      prospectsSnapshot.docs.forEach((prospectDoc) => {
        batch.delete(prospectDoc.ref);
      });
      
      // 删除该教练的所有课程记录
      const lessonRecordsSnapshot = await getDocs(
        query(collection(db, "lessonRecords"), where("coachId", "==", userData.uid))
      );
      lessonRecordsSnapshot.docs.forEach((recordDoc) => {
        batch.delete(recordDoc.ref);
      });
      
      // 删除该教练的所有套餐
      const packagesSnapshot = await getDocs(
        query(collection(db, "packages"), where("coachId", "==", userData.uid))
      );
      packagesSnapshot.docs.forEach((packageDoc) => {
        batch.delete(packageDoc.ref);
      });
      
      // 删除该教练的所有排课
      const schedulesSnapshot = await getDocs(
        query(collection(db, "schedules"), where("coachId", "==", userData.uid))
      );
      schedulesSnapshot.docs.forEach((scheduleDoc) => {
        batch.delete(scheduleDoc.ref);
      });
      
      // 执行批量删除
      await batch.commit();
      
      alert(`用户 ${userData.displayName} 及其所有数据已成功删除`);
      router.push('/admin');
      
    } catch (error) {
      console.error("删除用户失败:", error);
      alert("删除用户失败，请重试");
    } finally {
      setDeletingUserId(null);
    }
  };

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
    maxWidth: 800,
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

  if (!userData) {
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
        <Link 
          href="/admin"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#60a5fa",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ← 返回用户列表
        </Link>
      </div>

      {/* 用户基本信息 */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: isMobile ? "flex-start" : "center"
        }}>
          {/* 用户头像 */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: userData.avatar ? "transparent" : "#60a5fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 600,
            color: "#18181b",
            flexShrink: 0
          }}>
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt="用户头像"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            ) : (
              userData.displayName?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          {/* 用户基本信息 */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? "clamp(24px, 6vw, 32px)" : "32px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 8
            }}>
              {userData.displayName}
            </h1>
            <p style={{
              fontSize: 16,
              color: "#a1a1aa",
              marginBottom: 4
            }}>
              📧 {userData.email}
            </p>
            {userData.phone && (
              <p style={{
                fontSize: 16,
                color: "#a1a1aa",
                marginBottom: 4
              }}>
                📞 {userData.phone}
              </p>
            )}
            <div style={{
              display: "flex",
              gap: 8,
              marginTop: 8
            }}>
              <span style={{
                padding: "4px 8px",
                borderRadius: 4,
                background: userData.isPublic ? "#10b981" : "#6b7280",
                color: "#fff",
                fontSize: 12
              }}>
                {userData.isPublic ? "公开" : "私密"}
              </span>
            </div>
          </div>

          {/* 删除按钮 */}
          <button
            onClick={() => setDeleteConfirmUser(userData)}
            disabled={deletingUserId === userData.uid}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              fontSize: 14,
              cursor: deletingUserId === userData.uid ? "not-allowed" : "pointer",
              opacity: deletingUserId === userData.uid ? 0.6 : 1,
              flexShrink: 0
            }}
          >
            {deletingUserId === userData.uid ? "删除中..." : "删除用户"}
          </button>
        </div>
      </div>

      {/* 统计数据 */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 16
        }}>
          数据统计
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
          gap: 12
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#60a5fa" }}>
              {userStats.clientsCount}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>客户</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#10b981" }}>
              {userStats.prospectsCount}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>潜在客户</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#f59e0b" }}>
              {userStats.lessonRecordsCount}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>课程记录</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#8b5cf6" }}>
              {userStats.packagesCount}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>套餐</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#ec4899" }}>
              {userStats.schedulesCount}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>排课</div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 16
        }}>
          详细信息
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {userData.bio && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>简介</h3>
              <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.5 }}>{userData.bio}</p>
            </div>
          )}
          
          {userData.specialties && userData.specialties.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>专长</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {userData.specialties.map((specialty, index) => (
                  <span key={index} style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: "#60a5fa",
                    color: "#fff",
                    fontSize: 12
                  }}>
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {userData.experience && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>经验</h3>
              <p style={{ color: "#a1a1aa", fontSize: 14 }}>{userData.experience} 年</p>
            </div>
          )}

          {userData.location && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>位置</h3>
              <p style={{ color: "#a1a1aa", fontSize: 14 }}>{userData.location}</p>
            </div>
          )}

          {userData.education && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>教育背景</h3>
              <p style={{ color: "#a1a1aa", fontSize: 14 }}>{userData.education}</p>
            </div>
          )}

          {userData.certifications && userData.certifications.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>认证</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {userData.certifications.map((cert, index) => (
                  <span key={index} style={{
                    padding: "4px 8px",
                    borderRadius: 4,
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

          {userData.languages && userData.languages.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>语言</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {userData.languages.map((lang, index) => (
                  <span key={index} style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: "#f59e0b",
                    color: "#fff",
                    fontSize: 12
                  }}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 时间信息 */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 16
        }}>
          时间信息
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>注册时间</h3>
            <p style={{ color: "#a1a1aa", fontSize: 14 }}>{userData.createdAt}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>最后登录</h3>
            <p style={{ color: "#a1a1aa", fontSize: 14 }}>{userData.lastLoginAt}</p>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirmUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '8px' : '16px'
        }}>
          <div style={{
            background: '#18181b',
            borderRadius: 12,
            padding: isMobile ? '16px' : '24px',
            maxWidth: isMobile ? '100%' : 400,
            width: '100%',
            border: '1px solid #333'
          }}>
            <h3 style={{ 
              color: '#ef4444', 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 16 
            }}>确认删除用户</h3>
            <p style={{ 
              color: '#a1a1aa', 
              marginBottom: 16,
              fontSize: 14
            }}>
              确定要删除用户 <strong style={{ color: '#fff' }}>{deleteConfirmUser.displayName}</strong> 吗？
            </p>
            <p style={{ 
              color: '#f59e0b', 
              marginBottom: 16,
              fontSize: 12
            }}>
              ⚠️ 此操作将永久删除该用户的所有数据，包括：
              <br />• 用户基本信息
              <br />• 所有客户数据 ({userStats.clientsCount} 个)
              <br />• 所有课程记录 ({userStats.lessonRecordsCount} 个)
              <br />• 所有套餐信息 ({userStats.packagesCount} 个)
              <br />• 所有排课数据 ({userStats.schedulesCount} 个)
              <br />• 其他相关数据
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: '#23232a',
                  color: '#a1a1aa',
                  border: '1px solid #333',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                disabled={deletingUserId === deleteConfirmUser.uid}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  cursor: deletingUserId === deleteConfirmUser.uid ? 'not-allowed' : 'pointer',
                  opacity: deletingUserId === deleteConfirmUser.uid ? 0.6 : 1
                }}
              >
                {deletingUserId === deleteConfirmUser.uid ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
