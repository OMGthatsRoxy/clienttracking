"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coach } from "@/types/coach";
import { useRouter } from "next/navigation";
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

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"email" | "displayName" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserData | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否为管理员（这里简单检查邮箱，实际项目中应该有更严格的权限控制）
    if (!user) {
      router.push('/');
      return;
    }

    // 简单的管理员检查 - 你可以根据需要修改
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

    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // 获取所有教练数据
        const coachesSnapshot = await getDocs(collection(db, "coaches"));
        const usersData: UserData[] = [];

        for (const coachDoc of coachesSnapshot.docs) {
          const coachData = coachDoc.data() as Coach;
          usersData.push({
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
          });
        }

        setUsers(usersData);
      } catch (error) {
        console.error("获取用户数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [user, router]);

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
      
      // 从本地状态中移除用户
      setUsers(users.filter(u => u.uid !== userData.uid));
      setDeleteConfirmUser(null);
      
      alert(`用户 ${userData.displayName} 及其所有数据已成功删除`);
      
    } catch (error) {
      console.error("删除用户失败:", error);
      alert("删除用户失败，请重试");
    } finally {
      setDeletingUserId(null);
    }
  };

  // 过滤和排序用户
  const filteredAndSortedUsers = users
    .filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "lastLoginAt") {
        aValue = new Date(aValue || "").getTime();
        bValue = new Date(bValue || "").getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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

  return (
    <div style={containerStyle}>
      {/* 标题卡片 */}
      <div style={cardStyle}>
        <h1 style={{
          fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
          textAlign: "center",
          lineHeight: 1.2
        }}>
          后台管理
        </h1>
        <p style={{ 
          color: "#a1a1aa",
          fontSize: "clamp(12px, 3vw, 16px)",
          lineHeight: 1.3,
          margin: 0,
          textAlign: "center"
        }}>
          用户管理 - 共 {users.length} 个注册用户
        </p>
      </div>

      {/* 搜索和排序控制 */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          alignItems: isMobile ? "stretch" : "center"
        }}>
          {/* 搜索框 */}
          <input
            type="text"
            placeholder="搜索用户（邮箱、姓名、电话）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "#23232a",
              color: "#fff",
              fontSize: 14
            }}
          />

          {/* 排序选择 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "#23232a",
              color: "#fff",
              fontSize: 14,
              minWidth: isMobile ? "auto" : 120
            }}
          >
            <option value="createdAt">注册时间</option>
            <option value="email">邮箱</option>
            <option value="displayName">姓名</option>
          </select>

          {/* 排序方向 */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #60a5fa",
              background: "#23232a",
              color: "#60a5fa",
              fontSize: 14,
              cursor: "pointer",
              minWidth: isMobile ? "auto" : 80
            }}
          >
            {sortOrder === "asc" ? "↑ 升序" : "↓ 降序"}
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div style={cardStyle}>
          <p style={{ color: "#a1a1aa", textAlign: "center" }}>加载中...</p>
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: "#a1a1aa", textAlign: "center" }}>
            {searchTerm ? "没有找到匹配的用户" : "暂无注册用户"}
          </p>
        </div>
              ) : (
          filteredAndSortedUsers.map((userData, index) => (
           <div 
             key={userData.uid} 
             style={{
               ...cardStyle,
               cursor: "pointer",
               transition: "all 0.2s ease"
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.transform = "translateY(-2px)";
               e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.transform = "translateY(0)";
               e.currentTarget.style.boxShadow = "none";
             }}
           >
             <div style={{
               display: "flex",
               alignItems: "center",
               gap: 12,
               padding: "8px 0"
             }}>
               {/* 可点击的用户信息区域 */}
               <Link 
                 href={`/admin/${userData.uid}`}
                 style={{ 
                   display: "flex", 
                   alignItems: "center", 
                   gap: 12, 
                   flex: 1,
                   textDecoration: "none",
                   color: "inherit"
                 }}
               >
                 {/* 用户头像 */}
                 <div style={{
                   width: 40,
                   height: 40,
                   borderRadius: "50%",
                   background: userData.avatar ? "transparent" : "#60a5fa",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   fontSize: 16,
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

                 {/* 用户信息 */}
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{
                     display: "flex",
                     flexDirection: isMobile ? "column" : "row",
                     gap: isMobile ? 2 : 8,
                     alignItems: isMobile ? "flex-start" : "center"
                   }}>
                     <h3 style={{
                       fontSize: 16,
                       fontWeight: 600,
                       color: "#fff",
                       margin: 0
                     }}>
                       {userData.displayName}
                     </h3>
                     <span style={{
                       fontSize: 14,
                       color: "#a1a1aa"
                     }}>
                       {userData.email}
                     </span>
                   </div>
                 </div>
               </Link>

               {/* 删除按钮 - 独立于 Link 之外 */}
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   setDeleteConfirmUser(userData);
                 }}
                 disabled={deletingUserId === userData.uid}
                 style={{
                   padding: "4px 8px",
                   borderRadius: 4,
                   background: "#ef4444",
                   color: "#fff",
                   border: "none",
                   fontSize: 12,
                   cursor: deletingUserId === userData.uid ? "not-allowed" : "pointer",
                   opacity: deletingUserId === userData.uid ? 0.6 : 1,
                   flexShrink: 0
                 }}
               >
                 {deletingUserId === userData.uid ? "删除中..." : "删除"}
               </button>
             </div>
          </div>
          ))
        )}

      {/* 统计信息 */}
      <div style={cardStyle}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 12,
          textAlign: "center"
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#60a5fa" }}>
              {users.length}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>总用户数</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#10b981" }}>
              {users.filter(u => u.isPublic).length}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>公开资料</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#f59e0b" }}>
              {users.filter(u => u.experience && u.experience > 5).length}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>资深教练</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#8b5cf6" }}>
              {users.filter(u => u.certifications && u.certifications.length > 0).length}
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>有认证</div>
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
               <br />• 所有客户数据
               <br />• 所有课程记录
               <br />• 所有套餐信息
               <br />• 所有排课数据
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
