"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/types/client";
import Link from "next/link";
import ClientForm from "@/features/clients/ClientForm";

export default function ClientsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteOptions, setDeleteOptions] = useState({
    deletePackages: true,
    deleteLessonRecords: true,
    deleteSchedules: true
  });
  const clientsPerPage = 10;

  useEffect(() => {
    // 检测是否为移动设备
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

  // 卡片容器样式 - 与登录页面一致
  const containerStyle = {
    minHeight: "100vh",
    background: "#18181b",
    paddingLeft: isMobile ? "8px" : "16px",
    paddingRight: isMobile ? "8px" : "16px",
    paddingBottom: isMobile ? "8px" : "16px",
    paddingTop: isMobile ? "15px" : "40px", // 与登录页面一致
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12
  };

  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      setLoading(true);
      const q = query(collection(db, "clients"), where("coachId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      setLoading(false);
    };
    fetchClients();
  }, [user]);

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;

  // 搜索和排序逻辑
  const filteredAndSortedClients = clients
    .filter(client => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'createdAt':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'createdAtAsc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  const handleClientSuccess = (name: string) => {
    setClientName(name);
    setShowNewClientForm(false);
    
    // 延迟刷新客户列表并重置到第一页
    setTimeout(() => {
      setCurrentPage(1);
      window.location.reload();
    }, 2000);
  };

  // 删除客户处理函数
  const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete || !clientToDelete.id) return;
    
    try {
      const processedCounts = {
        packages: 0,
        lessonRecords: 0,
        schedules: 0
      };
      
      // 1. 处理配套（根据用户选择）
      if (deleteOptions.deletePackages) {
        const packagesQuery = query(collection(db, "packages"), where("clientId", "==", clientToDelete.id));
        const packagesSnapshot = await getDocs(packagesQuery);
        
        // 标记所有配套为已完成（isExpired = true, remainingSessions = 0）
        const packageUpdatePromises = packagesSnapshot.docs.map(doc => 
          updateDoc(doc.ref, {
            isExpired: true,
            remainingSessions: 0,
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(packageUpdatePromises);
        processedCounts.packages = packagesSnapshot.docs.length;
      }
      
      // 2. 将客户信息保存到潜在客户列表
      const prospectData = {
        name: clientToDelete.name,
        phone: clientToDelete.phone || '',
        email: clientToDelete.email || '',
        gender: clientToDelete.gender || '',
        age: clientToDelete.age,
        height: clientToDelete.height,
        weight: clientToDelete.weight,
        goal: clientToDelete.goal || '',
        notes: `从客户列表转移 - 原客户ID: ${clientToDelete.id}\n${clientToDelete.notes || ''}`,
        status: 'lost' as const, // 标记为流失状态
        source: '客户删除转移',
        coachId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "prospects"), prospectData);
      
      // 3. 删除课程记录（根据用户选择）
      if (deleteOptions.deleteLessonRecords) {
        const lessonRecordsQuery = query(collection(db, "lessonRecords"), where("clientId", "==", clientToDelete.id));
        const lessonRecordsSnapshot = await getDocs(lessonRecordsQuery);
        const lessonRecordsDeletePromises = lessonRecordsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(lessonRecordsDeletePromises);
        processedCounts.lessonRecords = lessonRecordsSnapshot.docs.length;
      }
      
      // 4. 删除日程安排（根据用户选择）
      if (deleteOptions.deleteSchedules) {
        const schedulesQuery = query(collection(db, "schedules"), where("clientId", "==", clientToDelete.id));
        const schedulesSnapshot = await getDocs(schedulesQuery);
        const schedulesDeletePromises = schedulesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(schedulesDeletePromises);
        processedCounts.schedules = schedulesSnapshot.docs.length;
      }
      
      // 5. 最后删除客户
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      
      setShowDeleteConfirm(false);
      setClientToDelete(null);
      // 重置删除选项
      setDeleteOptions({
        deletePackages: true,
        deleteLessonRecords: true,
        deleteSchedules: true
      });
      
      console.log(`客户删除完成:`, processedCounts);
      
      // 构建成功消息
      let successMessage = `客户 "${clientToDelete.name}" 已成功删除\n\n处理内容:\n`;
      if (deleteOptions.deletePackages) {
        successMessage += `• ${processedCounts.packages} 个配套已标记为完成\n`;
      }
      if (deleteOptions.deleteLessonRecords) {
        successMessage += `• ${processedCounts.lessonRecords} 条课程记录已删除\n`;
      }
      if (deleteOptions.deleteSchedules) {
        successMessage += `• ${processedCounts.schedules} 个日程安排已删除\n`;
      }
      successMessage += `• 客户信息已保存到潜在客户列表（状态：流失）`;
      
      alert(successMessage);
      
      // 刷新客户列表
      window.location.reload();
    } catch (error) {
      console.error("删除客户失败:", error);
      alert("删除客户失败，请重试");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setClientToDelete(null);
    // 重置删除选项
    setDeleteOptions({
      deletePackages: true,
      deleteLessonRecords: true,
      deleteSchedules: true
    });
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
      `}</style>
      <div style={containerStyle}>
      {/* 🧱 卡片1: 标题卡片 */}
      <div style={cardStyle}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center"
        }}>
          <h1 style={{
            fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            textAlign: "center",
            flex: 1
          }}>
            {t('clients')}
          </h1>
          
          {/* 添加按钮 */}
          <button 
            onClick={() => setShowNewClientForm(true)}
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
            + {t('client')}
          </button>
        </div>
      </div>

      {/* 🧱 卡片2: 客户列表卡片 */}
      <div style={cardStyle}>
        {/* 搜索和排序栏 */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          marginBottom: 16,
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          {/* 搜索栏 */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={t('searchClientPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // 重置到第一页
              }}
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
          
          {/* 排序下拉菜单 */}
          <div style={{ minWidth: isMobile ? '100%' : '200px' }}>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1); // 重置到第一页
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #333',
                background: '#23232a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="name">{t('sortByNameAZ')}</option>
              <option value="createdAt">{t('sortByCreatedTimeNewest')}</option>
              <option value="createdAtAsc">{t('sortByCreatedTimeOldest')}</option>
            </select>
          </div>
        </div>

        {/* 搜索结果统计 */}
        {searchTerm && (
          <div style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: '#1f2937',
            borderRadius: '6px',
            border: '1px solid #374151'
          }}>
            <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
              {t('searchResults').replace('{term}', searchTerm).replace('{count}', filteredAndSortedClients.length.toString())}
            </span>
          </div>
        )}

        {filteredAndSortedClients.length === 0 ? (
          <div style={{ 
            color: '#a1a1aa', 
            textAlign: 'center', 
            padding: '24px',
            fontSize: "clamp(14px, 3vw, 16px)"
          }}>
            {searchTerm ? t('noMatchingClients') : t('noClients')}
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              padding: 0 
            }}>
                          {filteredAndSortedClients
              .slice((currentPage - 1) * clientsPerPage, currentPage * clientsPerPage)
              .map(client => (
                <div key={client.id} className="form-card list-item" style={{ 
                  marginBottom: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #333',
                  padding: '12px',
                  minHeight: '70px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRadius: 8,
                  position: 'relative'
                }}
                onClick={() => window.location.href = `/client/${client.id}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => handleDeleteClick(e, client)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '16px',
                      cursor: 'pointer',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'background-color 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    title={t('deleteClient')}
                  >
                    ×
                  </button>
                  
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: "clamp(14px, 3vw, 16px)",
                    marginBottom: 6,
                    color: '#fff',
                    paddingRight: '24px' // 为删除按钮留出空间
                  }}>{client.name}</div>
                  <div style={{ 
                    color: '#a1a1aa', 
                    fontSize: "clamp(11px, 2.5vw, 12px)"
                  }}>
                    <span style={{ marginRight: 4 }}>📞</span>
                    {client.phone}
                  </div>
                  {client.email && (
                    <div style={{ 
                      color: '#a1a1aa', 
                      fontSize: "clamp(11px, 2.5vw, 12px)",
                      marginTop: 2 
                    }}>
                      <span style={{ marginRight: 4 }}>✉️</span>
                      {client.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 分页导航 */}
            {filteredAndSortedClients.length > clientsPerPage && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #333'
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? '#333' : '#60a5fa',
                    color: currentPage === 1 ? '#666' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {t('previousPage')}
                </button>
                
                <span style={{
                  color: '#a1a1aa',
                  fontSize: '14px',
                  padding: '0 12px'
                }}>
                                  {t('pageInfo').replace('{current}', currentPage.toString()).replace('{total}', Math.ceil(filteredAndSortedClients.length / clientsPerPage).toString())}
                <br />
                <span style={{ fontSize: '12px' }}>
                  {t('showingClients').replace('{start}', (((currentPage - 1) * clientsPerPage) + 1).toString()).replace('{end}', Math.min(currentPage * clientsPerPage, filteredAndSortedClients.length).toString()).replace('{total}', filteredAndSortedClients.length.toString())}
                </span>
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAndSortedClients.length / clientsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredAndSortedClients.length / clientsPerPage)}
                  style={{
                    background: currentPage === Math.ceil(filteredAndSortedClients.length / clientsPerPage) ? '#333' : '#60a5fa',
                    color: currentPage === Math.ceil(filteredAndSortedClients.length / clientsPerPage) ? '#666' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: currentPage === Math.ceil(filteredAndSortedClients.length / clientsPerPage) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {t('nextPage')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部间距 - 为导航栏留空间 */}
      <div style={{ height: isMobile ? 120 : 20 }} />

      {/* 添加客户表单模态框 */}
      {showNewClientForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }} onClick={() => setShowNewClientForm(false)}>
          <div style={{
            background: '#23232a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowNewClientForm(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '24px',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>
            <ClientForm onSuccess={handleClientSuccess} />
          </div>
        </div>
      )}



      {/* 删除确认对话框 */}
      {showDeleteConfirm && clientToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '8px' : '16px'
        }}>
          <div className="form-card" style={{ 
            maxWidth: isMobile ? '100%' : 400, 
            width: '100%',
            padding: isMobile ? '16px' : '20px',
            textAlign: 'center'
          }}>
            {/* 警告图标 */}
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            
            <h3 style={{ 
              color: "#ef4444", 
              fontSize: isMobile ? "clamp(16px, 3vw, 18px)" : "20px",
              fontWeight: 600, 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {t('confirmDeleteClient')}
            </h3>
            
            <p style={{ 
              color: '#a1a1aa', 
              marginBottom: 12,
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px",
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              {t('confirmDeleteClientMessage').replace('{name}', clientToDelete.name)}<br />
              <span style={{ color: '#ef4444', fontSize: '14px' }}>
                {t('selectOperationsToPerform')}：
              </span>
            </p>
            
            {/* 删除选项 */}
            <div style={{ 
              marginBottom: 16,
              textAlign: 'left',
              background: '#1f2937',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #374151'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 8,
                cursor: 'pointer'
              }}
              onClick={() => setDeleteOptions(prev => ({ ...prev, deletePackages: !prev.deletePackages }))}
              >
                <input
                  type="checkbox"
                  checked={deleteOptions.deletePackages}
                  onChange={() => setDeleteOptions(prev => ({ ...prev, deletePackages: !prev.deletePackages }))}
                  style={{
                    marginRight: 8,
                    width: 16,
                    height: 16,
                    accentColor: '#ef4444'
                  }}
                />
                <span style={{ 
                  color: '#ef4444', 
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {t('markAllPackagesCompleted')}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 8,
                cursor: 'pointer'
              }}
              onClick={() => setDeleteOptions(prev => ({ ...prev, deleteLessonRecords: !prev.deleteLessonRecords }))}
              >
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteLessonRecords}
                  onChange={() => setDeleteOptions(prev => ({ ...prev, deleteLessonRecords: !prev.deleteLessonRecords }))}
                  style={{
                    marginRight: 8,
                    width: 16,
                    height: 16,
                    accentColor: '#ef4444'
                  }}
                />
                <span style={{ 
                  color: '#ef4444', 
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {t('deleteLessonRecords')}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setDeleteOptions(prev => ({ ...prev, deleteSchedules: !prev.deleteSchedules }))}
              >
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteSchedules}
                  onChange={() => setDeleteOptions(prev => ({ ...prev, deleteSchedules: !prev.deleteSchedules }))}
                  style={{
                    marginRight: 8,
                    width: 16,
                    height: 16,
                    accentColor: '#ef4444'
                  }}
                />
                <span style={{ 
                  color: '#ef4444', 
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {t('deleteSchedules')}
                </span>
              </div>
            </div>
            
            <p style={{ 
              color: '#a1a1aa', 
              marginBottom: 16,
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              <span style={{ color: '#f59e0b' }}>
                {t('clientInfoAutoSaveNote')}
              </span>
            </p>
            
            {/* 按钮组 */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  background: '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#374151';
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                }}
              >
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
