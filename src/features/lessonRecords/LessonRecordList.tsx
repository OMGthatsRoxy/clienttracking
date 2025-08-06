"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { LessonRecord } from "@/types/lessonRecord";
import Link from "next/link";

interface LessonRecordListProps {
  clientId: string;
  clientName: string;
}

export default function LessonRecordList({ clientId }: LessonRecordListProps) {
  const { t } = useLanguage();
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "lessonRecords"),
          where("clientId", "==", clientId)
        );
        const querySnapshot = await getDocs(q);
        const recordsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LessonRecord[];
        // 在客户端按日期排序
        const sortedRecords = recordsData.sort((a, b) => 
          new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime()
        );
        setRecords(sortedRecords);
      } catch (error) {
        console.error("获取课程记录失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        color: '#a1a1aa' 
      }}>
        {t('loading')}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#a1a1aa' 
      }}>
        <p>{t('noLessonRecords')}</p>
        <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          点击上方"新建课程记录"按钮开始记录
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {records.map((record) => (
        <Link 
          key={record.id} 
          href={`/lesson-records/${record.id}`}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            padding: '16px',
            background: '#23232a',
            borderRadius: 8,
            border: '1px solid #333',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
              background: '#2a2a32',
              borderColor: '#60a5fa'
            }
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>
                {formatDate(record.lessonDate)}
              </h3>
              <span style={{ color: '#60a5fa', fontSize: 14 }}>
                {formatTime(record.lessonTime)} ({record.duration}分钟)
              </span>
            </div>
            
            {record.trainingMode && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                margin: '8px 0' 
              }}>
                <span style={{ 
                  color: '#60a5fa', 
                  fontSize: 12, 
                  padding: '2px 6px', 
                  background: '#1e3a8a', 
                  borderRadius: 4 
                }}>
                  训练模式
                </span>
                <span style={{ color: '#a1a1aa', fontSize: 12 }}>
                  {record.trainingMode === 'progressive' ? '渐进负荷' :
                   record.trainingMode === 'pyramid' ? '金字塔训练' :
                   record.trainingMode === 'superset' ? '超级组' :
                   record.trainingMode === 'circuit' ? '循环训练' :
                   record.trainingMode === 'drop' ? '递减组' : record.trainingMode}
                </span>
              </div>
            )}
            
            {record.exerciseActions && record.exerciseActions.length > 0 && (
              <div style={{ margin: '8px 0' }}>
                <p style={{ color: '#a1a1aa', fontSize: 12, margin: '0 0 4px 0' }}>
                  训练动作 ({record.exerciseActions.length}个):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {record.exerciseActions.slice(0, 3).map((action, index) => (
                    <span key={action.id} style={{ 
                      color: '#fff', 
                      fontSize: 11, 
                      padding: '2px 6px', 
                      background: '#333', 
                      borderRadius: 4 
                    }}>
                      {action.exercise}
                    </span>
                  ))}
                  {record.exerciseActions.length > 3 && (
                    <span style={{ 
                      color: '#71717a', 
                      fontSize: 11, 
                      padding: '2px 6px' 
                    }}>
                      +{record.exerciseActions.length - 3}个
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {record.content && (
              <p style={{ 
                color: '#a1a1aa', 
                fontSize: 14, 
                margin: '8px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}>
                {record.content}
              </p>
            )}
            
            {record.performance && (
              <p style={{ 
                color: '#a1a1aa', 
                fontSize: 14, 
                margin: '8px 0',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}>
                表现: {record.performance}
              </p>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid #333'
            }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>
                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
              </span>
              <span style={{ color: '#60a5fa', fontSize: 12 }}>
                点击查看详情 →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 