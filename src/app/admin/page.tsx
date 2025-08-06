"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coach } from "@/types/coach";
import { useRouter } from "next/navigation";

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
          <div key={userData.uid} style={cardStyle}>
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
              alignItems: isMobile ? "flex-start" : "center"
            }}>
              {/* 用户头像 */}
              <div style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: userData.avatar ? "transparent" : "#60a5fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
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
                  gap: isMobile ? 4 : 12,
                  alignItems: isMobile ? "flex-start" : "center",
                  marginBottom: 8
                }}>
                  <h3 style={{
                    fontSize: 18,
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
                  {userData.phone && (
                    <span style={{
                      fontSize: 14,
                      color: "#a1a1aa"
                    }}>
                      📞 {userData.phone}
                    </span>
                  )}
                </div>

                {/* 详细信息 */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 8,
                  fontSize: 14,
                  color: "#a1a1aa"
                }}>
                  {userData.bio && (
                    <div>
                      <strong>简介:</strong> {userData.bio}
                    </div>
                  )}
                  {userData.specialties && userData.specialties.length > 0 && (
                    <div>
                      <strong>专长:</strong> {userData.specialties.join(", ")}
                    </div>
                  )}
                  {userData.experience && (
                    <div>
                      <strong>经验:</strong> {userData.experience} 年
                    </div>
                  )}
                  {userData.location && (
                    <div>
                      <strong>位置:</strong> {userData.location}
                    </div>
                  )}
                  {userData.education && (
                    <div>
                      <strong>教育:</strong> {userData.education}
                    </div>
                  )}
                  {userData.certifications && userData.certifications.length > 0 && (
                    <div>
                      <strong>认证:</strong> {userData.certifications.join(", ")}
                    </div>
                  )}
                  {userData.languages && userData.languages.length > 0 && (
                    <div>
                      <strong>语言:</strong> {userData.languages.join(", ")}
                    </div>
                  )}
                </div>

                {/* 状态信息 */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
                  fontSize: 12
                }}>
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: userData.isPublic ? "#10b981" : "#6b7280",
                    color: "#fff"
                  }}>
                    {userData.isPublic ? "公开" : "私密"}
                  </span>
                  <span style={{ color: "#a1a1aa" }}>
                    注册: {userData.createdAt}
                  </span>
                  <span style={{ color: "#a1a1aa" }}>
                    最后登录: {userData.lastLoginAt}
                  </span>
                </div>
              </div>
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
    </div>
  );
}
