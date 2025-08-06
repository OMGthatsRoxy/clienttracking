"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/types/client";
import Link from "next/link";
import LessonRecordForm from "@/features/lessonRecords/LessonRecordForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function NewLessonRecordPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; time?: string; clientName?: string; packageId?: string }>;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // 解包params和searchParams Promise
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  
  useEffect(() => {
    if (!user || !resolvedParams.id) return;
    
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const clientDoc = await getDoc(doc(db, "clients", resolvedParams.id));
        if (clientDoc.exists()) {
          const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
          setClient(clientData);
        } else {
          setError("客户不存在");
        }
      } catch (error) {
        console.error("获取客户信息失败:", error);
        setError("获取客户信息失败");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [user, resolvedParams.id]);

  if (!user) {
    return (
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b"
      }}>
        <div style={{ color: '#a1a1aa' }}>请先登录</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b"
      }}>
        <div style={{ color: '#a1a1aa' }}>加载中...</div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b"
      }}>
        <div style={{ color: '#dc2626', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>{error || "客户不存在"}</div>
          <Link href="/clients">
            <button style={{
              background: '#23232a',
              color: '#60a5fa',
              border: '1px solid #60a5fa',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer'
            }}>
              返回客户列表
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content" style={{
      minHeight: "100vh",
      padding: isMobile ? "12px" : "24px",
      paddingBottom: "100px",
      background: "#18181b"
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
            <Link href={`/client/${client.id}/lesson-records`}>
              <button style={{ 
                background: '#23232a', 
                color: '#60a5fa', 
                border: '1px solid #60a5fa', 
                borderRadius: 8, 
                padding: isMobile ? '6px 12px' : '8px 16px', 
                cursor: 'pointer',
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px"
              }}>
                ← 返回
              </button>
            </Link>
            <div>
              <h1 style={{ 
                color: "#fff", 
                fontSize: isMobile ? "clamp(18px, 4vw, 24px)" : "24px", 
                fontWeight: 700, 
                margin: 0 
              }}>
                新建课程记录 - {client.name}
              </h1>
              <p style={{ 
                color: "#a1a1aa", 
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px", 
                margin: "4px 0 0 0" 
              }}>
                为 {client.name} 创建新的课程记录
              </p>
            </div>
          </div>
        </div>

        {/* 课程记录表单 */}
        <div className="form-card" style={{ 
          background: '#23232a', 
          borderRadius: 12, 
          padding: isMobile ? '16px' : '24px', 
          border: '1px solid #333' 
        }}>
          <ErrorBoundary>
            <LessonRecordForm 
              clientId={client.id} 
              clientName={client.name}
              onSuccess={(recordId?: string) => {
                // 如果有配套ID，说明是从课程排程页面来的，保存后返回课程排程页面
                if (resolvedSearchParams.packageId) {
                  window.location.href = '/schedule';
                } else {
                  // 否则跳转到课程记录详情页面
                  if (recordId) {
                    window.location.href = `/lesson-records/${recordId}`;
                  } else {
                    window.location.href = `/client/${client.id}/lesson-records`;
                  }
                }
              }} 
              onCancel={() => {
                // 如果有配套ID，取消时返回课程排程页面
                if (resolvedSearchParams.packageId) {
                  window.location.href = '/schedule';
                } else {
                  // 否则跳转回课程记录列表页面
                  window.location.href = `/client/${client.id}/lesson-records`;
                }
              }}
              initialDate={resolvedSearchParams.date}
              initialTime={resolvedSearchParams.time}
              packageId={resolvedSearchParams.packageId}
            />
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
} 