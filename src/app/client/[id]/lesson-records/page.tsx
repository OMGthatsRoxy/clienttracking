"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/types/client";
import Link from "next/link";
import LessonRecordList from "@/features/lessonRecords/LessonRecordList";

export default function ClientLessonRecordsPage({ 
  params 
}: { 
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // 用于触发列表刷新
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // 成功提示
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
    
    const fetchClient = async () => {
      setLoading(true);
      try {
        const clientDoc = await getDoc(doc(db, "clients", resolvedParams.id));
        if (clientDoc.exists()) {
          const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
          setClient(clientData);
        }
      } catch (error) {
        console.error("获取客户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [user, resolvedParams.id]);

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (!client) return <div style={{ color: '#a1a1aa' }}>{t('clientNotFound')}</div>;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(100%);
          }
          to { 
            opacity: 1; 
            transform: translateX(0);
          }
        }
      `}</style>
      <main className="page-content" style={{
        minHeight: "100vh",
        padding: isMobile ? "12px" : "24px",
        paddingBottom: "100px",
        background: "#18181b"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* 头部导航 */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: isMobile ? 16 : 32,
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 8 : 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
              <div>
                <h1 style={{ 
                  color: "#fff", 
                  fontSize: isMobile ? "clamp(20px, 5vw, 28px)" : "28px", 
                  fontWeight: 700, 
                  margin: 0 
                }}>
                  {client.name} - 课程完整记录
                </h1>
                <p style={{ 
                  color: "#a1a1aa", 
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px", 
                  margin: "4px 0 0 0" 
                }}>
                  查看和管理所有课程记录
                </p>
              </div>
            </div>
            <Link href={`/client/${client.id}/lesson-records/new`}>
              <button 
                style={{ 
                  background: '#059669', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: isMobile ? '6px 12px' : '8px 16px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px"
                }}
              >
                新建课程记录
              </button>
            </Link>
          </div>



          {/* 成功提示 */}
          {showSuccessMessage && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#059669',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 1001,
              animation: 'slideInRight 0.3s ease-out'
            }}>
              ✅ 课程记录保存成功！
            </div>
          )}

          {/* 课程记录列表 */}
          <div className="form-card">
            <LessonRecordList 
              key={refreshKey} 
              clientId={client.id} 
              clientName={client.name} 
            />
          </div>
        </div>
      </main>
    </>
  );
} 