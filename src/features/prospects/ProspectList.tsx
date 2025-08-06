"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { Prospect } from "@/types/prospect";

export default function ProspectList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const prospectsPerPage = 10;

  useEffect(() => {
    if (!user) return;

    const prospectsQuery = query(collection(db, "prospects"), where("coachId", "==", user.uid));
    const unsubscribe = onSnapshot(prospectsQuery, (snapshot) => {
      const prospectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
      setProspects(prospectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (prospectId: string) => {
    if (confirm(t('confirmDeleteProspect'))) {
      try {
        await deleteDoc(doc(db, "prospects", prospectId));
      } catch (error) {
        console.error("删除潜在顾客失败:", error);
      }
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case '推荐': return '#3b82f6';
      case '广告': return '#f59e0b';
      case '网站': return '#10b981';
      case '客户删除转移': return '#ef4444';
      case '其他': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getSourceText = (source: string) => {
    if (!source) return '未知来源';
    return source;
  };

  if (loading) {
    return <div style={{ color: '#a1a1aa', textAlign: 'center', padding: '20px' }}>{t('loading')}</div>;
  }

  // 搜索和排序逻辑
  const filteredAndSortedProspects = prospects
    .filter(prospect => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        prospect.name?.toLowerCase().includes(searchLower) ||
        prospect.phone?.toLowerCase().includes(searchLower) ||
        prospect.email?.toLowerCase().includes(searchLower)
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 600, margin: 0 }}>{t('prospectList')}</h2>
        <p style={{ color: '#a1a1aa', marginTop: 8 }}>{t('totalProspects')}: {prospects.length}</p>
      </div>

            {/* 搜索和排序栏 */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        alignItems: 'center'
      }}>
        {/* 搜索栏 */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder={t('searchProspectPlaceholder')}
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
        <div style={{ minWidth: '200px' }}>
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
            {t('searchProspectResults').replace('{term}', searchTerm).replace('{count}', filteredAndSortedProspects.length.toString())}
          </span>
        </div>
      )}

      {filteredAndSortedProspects.length === 0 ? (
        <div className="form-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: '#a1a1aa', fontSize: 16 }}>{t('noProspects')}</p>
        </div>
      ) : (
        <>
                          <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          padding: 0 
        }}>
          {filteredAndSortedProspects
            .slice((currentPage - 1) * prospectsPerPage, currentPage * prospectsPerPage)
            .map((prospect) => (
              <div key={prospect.id} className="form-card list-item" style={{ 
                marginBottom: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #333',
                padding: '12px',
                minHeight: '70px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderRadius: 8
              }}
              onClick={() => window.location.href = `/prospect/${prospect.id}`}
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
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: "clamp(14px, 3vw, 16px)",
                  marginBottom: 6,
                  color: '#fff' 
                }}>{prospect.name}</div>
                <div style={{ 
                  color: '#a1a1aa', 
                  fontSize: "clamp(11px, 2.5vw, 12px)"
                }}>
                  <span style={{ marginRight: 4 }}>📞</span>
                  {prospect.phone}
                </div>
                {prospect.email && (
                  <div style={{ 
                    color: '#a1a1aa', 
                    fontSize: "clamp(11px, 2.5vw, 12px)",
                    marginTop: 2 
                  }}>
                    <span style={{ marginRight: 4 }}>✉️</span>
                    {prospect.email}
                  </div>
                )}
                <div style={{ 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{
                    background: getSourceColor(prospect.source || ''),
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 500
                  }}>
                    {getSourceText(prospect.source || '')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(prospect.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 4
                    }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
        </div>
          
          {/* 分页导航 */}
          {filteredAndSortedProspects.length > prospectsPerPage && (
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
                {t('pageInfo').replace('{current}', currentPage.toString()).replace('{total}', Math.ceil(filteredAndSortedProspects.length / prospectsPerPage).toString())}
                <br />
                <span style={{ fontSize: '12px' }}>
                  {t('showingProspects').replace('{start}', (((currentPage - 1) * prospectsPerPage) + 1).toString()).replace('{end}', Math.min(currentPage * prospectsPerPage, filteredAndSortedProspects.length).toString()).replace('{total}', filteredAndSortedProspects.length.toString())}
                </span>
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAndSortedProspects.length / prospectsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredAndSortedProspects.length / prospectsPerPage)}
                style={{
                  background: currentPage === Math.ceil(filteredAndSortedProspects.length / prospectsPerPage) ? '#333' : '#60a5fa',
                  color: currentPage === Math.ceil(filteredAndSortedProspects.length / prospectsPerPage) ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: currentPage === Math.ceil(filteredAndSortedProspects.length / prospectsPerPage) ? 'not-allowed' : 'pointer',
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
  );
} 