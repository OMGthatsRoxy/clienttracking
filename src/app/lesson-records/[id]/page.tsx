"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LessonRecord } from "@/types/lessonRecord";
import Link from "next/link";

export default function LessonRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (!record) return <div style={{ color: '#a1a1aa' }}>{t('recordNotFound')}</div>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 训练模式映射
  const trainingModeMap: { [key: string]: string } = {
    progressive: '渐进负荷',
    pyramid: '金字塔训练',
    superset: '超级组',
    circuit: '循环训练',
    drop: '递减组'
  };

  // 动作分类映射
  const categoryMap: { [key: string]: string } = {
    chest: '胸',
    back: '背',
    shoulders: '肩膀',
    arms: '手臂',
    glutes: '臀',
    legs: '腿',
    fullbody: '全身'
  };

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
            <div>
              <h1 style={{ 
                color: "#fff", 
                fontSize: isMobile ? "clamp(18px, 4vw, 24px)" : "24px", 
                fontWeight: 700, 
                margin: 0 
              }}>
                {record.clientName} - 课程记录
              </h1>
              <p style={{ 
                color: "#a1a1aa", 
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px", 
                margin: "4px 0 0 0" 
              }}>
                {formatDate(record.lessonDate)} {record.lessonTime}
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: isMobile ? 8 : 12 }}>
            <Link href={`/lesson-records/${record.id}/edit`}>
              <button style={{ 
                background: '#059669', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: isMobile ? '6px 12px' : '8px 16px', 
                cursor: 'pointer',
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px",
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 4 : 6
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                编辑
              </button>
            </Link>
          </div>
        </div>

        {/* 课程记录详情卡片 */}
        <div className="form-card" style={{ marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, marginBottom: 16 }}>课程详情</h2>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: '6px 10px', background: '#23232a', borderRadius: 8, border: '1px solid #333', minWidth: 'fit-content' }}>
              <p style={{ color: "#a1a1aa", marginBottom: 1, fontSize: 10 }}>课程日期</p>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{formatDate(record.lessonDate)}</p>
            </div>
            
            <div style={{ padding: '6px 10px', background: '#23232a', borderRadius: 8, border: '1px solid #333', minWidth: 'fit-content' }}>
              <p style={{ color: "#a1a1aa", marginBottom: 1, fontSize: 10 }}>课程时间</p>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{record.lessonTime}</p>
            </div>
            
            {record.trainingMode && (
              <div style={{ padding: '6px 10px', background: '#23232a', borderRadius: 8, border: '1px solid #333', minWidth: 'fit-content' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 1, fontSize: 10 }}>训练模式</p>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>
                  {trainingModeMap[record.trainingMode] || record.trainingMode}
                </p>
              </div>
            )}
          </div>



          {/* 动作训练数据 */}
          {record.exerciseActions && record.exerciseActions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>训练动作</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {record.exerciseActions.map((action, index) => (
                  <div key={action.id} style={{ 
                    padding: '8px 12px', 
                    background: '#23232a', 
                    borderRadius: 8, 
                    border: '1px solid #333'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        动作 {index + 1}
                      </h4>
                      <span style={{ 
                        color: '#60a5fa', 
                        fontSize: 11, 
                        padding: '3px 6px', 
                        background: '#1e3a8a', 
                        borderRadius: 4 
                      }}>
                        {categoryMap[action.category] || action.category}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
                        {action.exercise}
                      </p>
                    </div>

                    {/* 重量数据 */}
                    {action.weights && action.weights.some(weight => weight.trim() !== '') && (
                      <div>
                        <p style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}>重量 (kg)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                          {action.weights.map((weight, weightIndex) => (
                            <div key={weightIndex} style={{ 
                              padding: '4px 6px', 
                              background: '#18181b', 
                              borderRadius: 4, 
                              border: '1px solid #333',
                              textAlign: 'center'
                            }}>
                              <p style={{ color: '#71717a', fontSize: 9, margin: '0 0 1px 0' }}>
                                第{weightIndex + 1}组
                              </p>
                              <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0 }}>
                                {weight || '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.content && (
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>课程内容</h3>
              <div style={{ 
                padding: '8px 12px', 
                background: '#23232a', 
                borderRadius: 8, 
                border: '1px solid #333',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap'
              }}>
                {record.content}
              </div>
            </div>
          )}

          {record.notes && (
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>教练记录</h3>
              <div style={{ 
                padding: '8px 12px', 
                background: '#23232a', 
                borderRadius: 8, 
                border: '1px solid #333',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap'
              }}>
                {record.notes}
              </div>
            </div>
          )}

          {record.performance && (
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>学员表现</h3>
              <div style={{ 
                padding: '8px 12px', 
                background: '#23232a', 
                borderRadius: 8, 
                border: '1px solid #333',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap'
              }}>
                {record.performance}
              </div>
            </div>
          )}

          {record.nextGoals && (
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>下次目标</h3>
              <div style={{ 
                padding: '8px 12px', 
                background: '#23232a', 
                borderRadius: 8, 
                border: '1px solid #333',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap'
              }}>
                {record.nextGoals}
              </div>
            </div>
          )}

          <div style={{ 
            padding: '8px 12px', 
            background: '#23232a', 
            borderRadius: 8, 
            border: '1px solid #333',
            marginTop: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>
                创建时间: {new Date(record.createdAt).toLocaleString('zh-CN')}
              </span>
              <span style={{ color: '#71717a', fontSize: 12 }}>
                更新时间: {new Date(record.updatedAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 