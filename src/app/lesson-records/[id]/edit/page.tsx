"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LessonRecord } from "@/types/lessonRecord";
import Link from "next/link";
import LessonRecordForm from "@/features/lessonRecords/LessonRecordForm";

export default function EditLessonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [record, setRecord] = useState<LessonRecord | null>(null);
  const [loading, setLoading] = useState(true);
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
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const recordDoc = await getDoc(doc(db, "lessonRecords", resolvedParams.id));
        if (recordDoc.exists()) {
          const recordData = { id: recordDoc.id, ...recordDoc.data() } as LessonRecord;
          setRecord(recordData);
        }
      } catch (error) {
        console.error("获取课程记录失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [user, resolvedParams.id]);

  const handleSuccess = () => {
    // 编辑成功后跳转到详情页
    window.location.href = `/lesson-records/${resolvedParams.id}`;
  };

  const handleCancel = () => {
    // 取消编辑，返回详情页
    window.location.href = `/lesson-records/${resolvedParams.id}`;
  };

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (!record) return <div style={{ color: '#a1a1aa' }}>{t('recordNotFound')}</div>;

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
            <Link href={`/lesson-records/${record.id}`}>
              <button style={{ 
                background: '#23232a', 
                color: '#60a5fa', 
                border: '1px solid #60a5fa', 
                borderRadius: 8, 
                padding: isMobile ? '6px 12px' : '8px 16px', 
                cursor: 'pointer',
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px"
              }}>
                ← 返回详情
              </button>
            </Link>
            <div>
              <h1 style={{ 
                color: "#fff", 
                fontSize: isMobile ? "clamp(18px, 4vw, 24px)" : "24px", 
                fontWeight: 700, 
                margin: 0 
              }}>
                编辑课程记录
              </h1>
              <p style={{ 
                color: "#a1a1aa", 
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px", 
                margin: "4px 0 0 0" 
              }}>
                {record.clientName} - {record.lessonDate} {record.lessonTime}
              </p>
            </div>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="form-card" style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          border: '1px solid #333',
          padding: isMobile ? '16px' : '24px'
        }}>
          <LessonRecordForm
            clientId={record.clientId}
            clientName={record.clientName}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            initialDate={record.lessonDate}
            initialTime={record.lessonTime}
            packageId={record.packageId}
            isEditing={true}
            initialData={record}
          />
        </div>
      </div>
    </main>
  );
} 