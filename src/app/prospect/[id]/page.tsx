"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Prospect } from "@/types/prospect";
import Link from "next/link";

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Prospect>>({});
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // 解包params Promise
  const resolvedParams = use(params);

  useEffect(() => {
    if (!user || !resolvedParams.id) return;
    const fetchProspect = async () => {
      setLoading(true);
      try {
        const prospectDoc = await getDoc(doc(db, "prospects", resolvedParams.id));
        if (prospectDoc.exists()) {
          const prospectData = { id: prospectDoc.id, ...prospectDoc.data() } as Prospect;
          setProspect(prospectData);
        }
      } catch (error) {
        console.error("获取潜在客户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProspect();
  }, [user, resolvedParams.id]);

  // 下拉菜单选项数据
  const genderOptions = [
    { value: "", label: "selectGender" },
    { value: "male", label: "male" },
    { value: "female", label: "female" },
    { value: "other", label: "other" }
  ];

  const ageOptions = [
    { value: "", label: "selectAge" },
    ...Array.from({ length: 83 }, (_, i) => ({ 
      value: (i + 18).toString(), 
      label: (i + 18).toString() 
    }))
  ];

  const goalOptions = [
    { value: "", label: "selectGoal" },
    { value: "weightLoss", label: "weightLoss" },
    { value: "muscleGain", label: "muscleGain" },
    { value: "endurance", label: "endurance" },
    { value: "flexibility", label: "flexibility" },
    { value: "generalFitness", label: "generalFitness" }
  ];

  const sourceOptions = [
    { value: "", label: "selectSource" },
    { value: "朋友推荐", label: "friendRecommendation" },
    { value: "社交媒体", label: "socialMedia" },
    { value: "广告", label: "advertisement" },
    { value: "网站", label: "website" },
    { value: "其他", label: "other" }
  ];

  const statusOptions = [
    { value: "new", label: "newProspect" },
    { value: "contacted", label: "contacted" },
    { value: "interested", label: "interested" },
    { value: "converted", label: "converted" },
    { value: "lost", label: "lost" }
  ];

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (!prospect) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;

  const handleEdit = () => {
    setEditForm({
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email,
      gender: prospect.gender,
      age: prospect.age,
      goal: prospect.goal,
      source: prospect.source,
      status: prospect.status,
      notes: prospect.notes
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!prospect) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "prospects", prospect.id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      setProspect({ ...prospect, ...editForm });
      setIsEditing(false);
      setEditForm({});
    } catch (error) {
      console.error("更新潜在客户信息失败:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleConvertToClient = async () => {
    if (!prospect || !user) return;
    
    if (!confirm(`确定要将潜在客户 "${prospect.name}" 转化为客户吗？\n\n转化后将：\n• 在客户列表中添加该客户\n• 从潜在客户列表中删除该客户\n• 保留所有基本信息`)) {
      return;
    }
    
    setConverting(true);
    try {
      // 1. 创建新客户
      const clientData = {
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        gender: prospect.gender,
        age: prospect.age,
        height: prospect.height,
        weight: prospect.weight,
        goal: prospect.goal,
        notes: `从潜在客户转化 - 原潜在客户ID: ${prospect.id}\n来源: ${prospect.source || '未知'}\n${prospect.notes || ''}`,
        coachId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "clients"), clientData);
      
      // 2. 删除潜在客户
      await deleteDoc(doc(db, "prospects", prospect.id));
      
      alert(`潜在客户 "${prospect.name}" 已成功转化为客户！`);
      
      // 3. 跳转到客户列表
      window.location.href = '/clients';
    } catch (error) {
      console.error("转化客户失败:", error);
      alert("转化客户失败，请重试");
    } finally {
      setConverting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'contacted': return '#f59e0b';
      case 'interested': return '#10b981';
      case 'converted': return '#8b5cf6';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return t('newProspect');
      case 'contacted': return t('contacted');
      case 'interested': return t('interested');
      case 'converted': return t('converted');
      case 'lost': return t('lost');
      default: return status;
    }
  };

  // 统一的卡片样式
  const cardStyle = {
    maxWidth: 1000,
    width: '100%',
    marginBottom: 12,
    background: '#23232a',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #333'
  };

  // 卡片容器样式
  const containerStyle = {
    minHeight: "100vh",
    background: "#18181b",
    paddingLeft: isMobile ? "8px" : "16px",
    paddingRight: isMobile ? "8px" : "16px",
    paddingBottom: isMobile ? "100px" : "16px",
    paddingTop: isMobile ? "15px" : "40px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12
  };

  return (
    <div style={containerStyle}>
      {/* 🧱 卡片1: 标题和导航 */}
      <div style={cardStyle}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: isMobile ? 12 : 16,
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: isMobile ? 8 : 16
        }}>
          <div>
            <Link href="/prospects" style={{ 
              color: '#60a5fa', 
              textDecoration: 'none', 
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              ← 返回潜在客户列表
            </Link>
            <h1 style={{
              fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
              fontWeight: 700,
              color: "#fff",
              margin: "8px 0 0 0"
            }}>
              {isEditing ? '编辑潜在客户' : prospect.name}
            </h1>
          </div>
          
          {!isEditing && (
            <button 
              onClick={handleEdit}
              style={{
                background: "#60a5fa",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: isMobile ? "8px 16px" : "12px 24px",
                fontSize: isMobile ? "clamp(12px, 2.5vw, 16px)" : "16px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#60a5fa';
              }}
            >
              编辑
            </button>
          )}
        </div>

        {/* 状态标签 */}
        <div style={{ marginBottom: 16 }}>
          <span style={{
            background: getStatusColor(prospect.status),
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500
          }}>
            {getStatusText(prospect.status)}
          </span>
        </div>
      </div>

      {/* 🧱 卡片2: 基本信息 */}
      <div style={cardStyle}>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 600, marginBottom: 16 }}>基本信息</h2>
        
        {isEditing ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>姓名</label>
              <input
                name="name"
                value={editForm.name || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>电话</label>
              <input
                name="phone"
                value={editForm.phone || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>邮箱</label>
              <input
                name="email"
                value={editForm.email || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>性别</label>
                <select
                  name="gender"
                  value={editForm.gender || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#23232a',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value ? t(option.label as any) : t('selectGender')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>年龄</label>
                <select
                  name="age"
                  value={editForm.age || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#23232a',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {ageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value ? option.label : t('selectAge')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>健身目标</label>
              <select
                name="goal"
                value={editForm.goal || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {goalOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value ? t(option.label as any) : t('selectGoal')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>来源</label>
              <select
                name="source"
                value={editForm.source || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {sourceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value ? t(option.label as any) : t('selectSource')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>状态</label>
              <select
                name="status"
                value={editForm.status || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.label as any)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "#a1a1aa" }}>备注</label>
              <textarea
                name="notes"
                value={editForm.notes || ''}
                onChange={handleInputChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancelEdit}
                style={{
                  flex: 1,
                  background: "#6b7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>姓名</span>
                <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>{prospect.name}</div>
              </div>
              <div>
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>电话</span>
                <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>{prospect.phone}</div>
              </div>
            </div>
            
            <div>
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>邮箱</span>
              <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>{prospect.email || '未填写'}</div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>性别</span>
                <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>
                  {prospect.gender ? (prospect.gender === 'male' ? t('male') : prospect.gender === 'female' ? t('female') : t('other')) : '未填写'}
                </div>
              </div>
              <div>
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>年龄</span>
                <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>{prospect.age ? `${prospect.age} 岁` : '未填写'}</div>
              </div>
            </div>
            
            <div>
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>健身目标</span>
              <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>
                {prospect.goal ? (prospect.goal === 'weightLoss' ? t('weightLoss') : prospect.goal === 'muscleGain' ? t('muscleGain') : prospect.goal === 'endurance' ? t('endurance') : prospect.goal === 'flexibility' ? t('flexibility') : t('generalFitness')) : '未填写'}
              </div>
            </div>
            
            <div>
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>来源</span>
              <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>
                {prospect.source ? (prospect.source === '朋友推荐' ? t('friendRecommendation') : prospect.source === '社交媒体' ? t('socialMedia') : prospect.source === '广告' ? t('advertisement') : t('website')) : '未填写'}
              </div>
            </div>
            
            {prospect.notes && (
              <div>
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>备注</span>
                <div style={{ color: "#fff", fontSize: "16px", marginTop: 4 }}>{prospect.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🧱 卡片3: 转化为客户按钮 */}
      {!isEditing && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleConvertToClient}
              disabled={converting}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "16px 32px",
                fontSize: "18px",
                fontWeight: 600,
                cursor: converting ? "not-allowed" : "pointer",
                opacity: converting ? 0.6 : 1,
                transition: "all 0.2s ease",
                width: "100%",
                maxWidth: "300px"
              }}
              onMouseEnter={(e) => {
                if (!converting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {converting ? '转化中...' : '转化为客户'}
            </button>
            <p style={{ 
              color: '#a1a1aa', 
              fontSize: '14px', 
              marginTop: '12px',
              lineHeight: 1.4
            }}>
              点击后将把该潜在客户添加到客户列表，并从潜在客户列表中删除
            </p>
          </div>
        </div>
      )}

      {/* 底部间距 */}
      <div style={{ height: 20 }} />
    </div>
  );
} 