"use client";

import React, { useState } from 'react';
import ScheduleItem from '@/components/ScheduleItem';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';

export default function ScheduleSimpleTestPage() {
  const [isMobile, setIsMobile] = useState(false);

  // 简单的测试数据 - 固定日期
  const testSchedules: ScheduleItemType[] = [
    {
      id: 'test-1',
      date: '2024-07-29', // 周一
      time: '09:30',
      startTime: '09:30',
      endTime: '10:30',
      clientName: '周一客户',
      clientId: 'test-client-1',
      status: 'scheduled',
      hasBeenChanged: false,
      coachId: 'test-coach'
    },
    {
      id: 'test-2',
      date: '2024-07-30', // 周二
      time: '11:00',
      startTime: '11:00',
      endTime: '12:00',
      clientName: '周二客户',
      clientId: 'test-client-2',
      status: 'completed',
      hasBeenChanged: false,
      coachId: 'test-coach'
    },
    {
      id: 'test-3',
      date: '2024-07-31', // 周三
      time: '14:30',
      startTime: '14:30',
      endTime: '15:30',
      clientName: '周三客户',
      clientId: 'test-client-3',
      status: 'cancelled',
      hasBeenChanged: false,
      coachId: 'test-coach'
    }
  ];

  // 固定的日期数组
  const currentDates = ['2024-07-29', '2024-07-30', '2024-07-31', '2024-08-01', '2024-08-02', '2024-08-03', '2024-08-04'];

  // 生成时间轴
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 5;
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayName = dayNames[date.getDay()];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return {
      display: `${month}/${day}`,
      dayName: dayName,
      isToday: false
    };
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#18181b",
      padding: "20px",
      color: "#fff"
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ 
                      fontSize: "36px", 
          fontWeight: 700, 
          marginBottom: "16px",
          textAlign: "center"
        }}>
          简单列定位测试
        </h1>
        
        <div style={{ 
          marginBottom: "24px", 
          textAlign: "center" 
        }}>
          <button
            onClick={() => setIsMobile(!isMobile)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#60a5fa',
              color: '#18181b',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            切换为 {isMobile ? '桌面' : '移动端'} 模式
          </button>
        </div>

        {/* 日程网格 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            固定日期测试
          </h2>
          
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? `60px repeat(${currentDates.length}, 1fr)` : `80px repeat(${currentDates.length}, 1fr)`,
              minWidth: isMobile ? '600px' : '800px'
            }}>
              {/* 时间列标题 */}
              <div style={{ 
                height: isMobile ? 50 : 60,
                backgroundColor: '#23232a', 
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a1a1aa',
                fontWeight: 600,
                fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
              }}>
                时间
              </div>
              
              {/* 日期列标题 */}
              {currentDates.map((date: string) => {
                const dateInfo = formatDate(date);
                return (
                  <div key={date} style={{ 
                    height: isMobile ? 50 : 60,
                    backgroundColor: '#23232a',
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a1a1aa',
                    fontWeight: 600
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "12px"
                    }}>{dateInfo.dayName}</div>
                    <div style={{ 
                      fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
                    }}>{dateInfo.display}</div>
                  </div>
                );
              })}

              {/* 时间格子 */}
              {timeSlots.map((time) => (
                <div key={time} style={{ display: 'contents' }}>
                  {/* 时间标签 */}
                  <div style={{
                    height: isMobile ? 50 : 60,
                    backgroundColor: '#23232a',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a1a1aa',
                    fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "12px",
                    fontWeight: 500
                  }}>
                    {time}
                  </div>
                  
                  {/* 每天的日程格子 */}
                  {currentDates.map((date: string) => (
                    <div
                      key={`${date}-${time}`}
                      style={{
                        height: isMobile ? 50 : 60,
                        border: '1px solid #333',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: isMobile ? '4px' : '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        color: '#666', 
                        fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "12px"
                      }}>+</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* 课程项目层 */}
            {currentDates.map((date: string, dateIndex: number) => {
              const dateSchedules = testSchedules.filter(schedule => schedule.date === date);
              
              // 计算正确的左侧位置
              // 使用 CSS Grid 的实际列位置计算
              const timeColumnWidth = isMobile ? 60 : 80;
              const totalWidth = isMobile ? 600 : 800; // 最小宽度
              const remainingWidth = totalWidth - timeColumnWidth;
              const dateColumnWidth = remainingWidth / currentDates.length;
              const leftPosition = timeColumnWidth + (dateIndex * dateColumnWidth);
              
              console.log(`简单测试 - 日期 ${date} (索引 ${dateIndex}):`, {
                dateSchedules: dateSchedules.length,
                timeColumnWidth,
                dateColumnWidth,
                leftPosition: `${leftPosition}px`,
                schedules: dateSchedules.map(s => ({ 
                  id: s.id, 
                  clientName: s.clientName, 
                  startTime: s.startTime, 
                  endTime: s.endTime 
                }))
              });
              
              return (
                <div
                  key={`schedules-${date}`}
                  style={{
                    position: 'absolute',
                    top: isMobile ? 50 : 60,
                    left: `${leftPosition}px`,
                    width: `${dateColumnWidth}px`,
                    height: `${timeSlots.length * (isMobile ? 50 : 60)}px`,
                    pointerEvents: 'none', // 让点击穿透到下面的格子
                    zIndex: 5, // 降低z-index，确保在格子之上但在其他元素之下
                    border: '3px solid red',
                    backgroundColor: 'rgba(255, 0, 0, 0.05)', // 降低透明度
                    boxSizing: 'border-box'
                  }}
                >
                  {/* 课程卡片容器 */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto' // 恢复课程卡片的点击
                  }}>
                    {dateSchedules.map((schedule) => (
                      <ScheduleItem
                        key={schedule.id}
                        schedule={schedule}
                        isMobile={isMobile}
                        onClick={() => {
                          alert(`点击了 ${schedule.clientName} 的课程！`);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 说明 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px' 
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            测试说明
          </h2>
          
          <div style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>🎯 测试目标：</h3>
            <ul style={{ marginBottom: '16px' }}>
              <li>使用固定日期验证课程列定位</li>
              <li>周一：周一客户 9:30-10:30</li>
              <li>周二：周二客户 11:00-12:00</li>
              <li>周三：周三客户 14:30-15:30</li>
            </ul>
            
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>🔍 观察要点：</h3>
            <ul>
              <li>红色边框应该显示每个日期列的位置</li>
              <li>课程块应该出现在对应的红色边框内</li>
              <li>每个课程应该显示在正确的日期列中</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 