"use client";

import React, { useState } from 'react';
import ScheduleItem from '@/components/ScheduleItem';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';

export default function ScheduleDemoPage() {
  const [isMobile, setIsMobile] = useState(false);

  // 创建测试数据 - 9:30 到 10:30 的课程
  const testSchedule: ScheduleItemType = {
    id: 'demo-1',
    date: '2024-01-15',
    time: '09:30',
    startTime: '09:30',
    endTime: '10:30',
    clientName: '张三',
    clientId: 'client-1',
    status: 'scheduled',
    hasBeenChanged: false,
    coachId: 'coach-1'
  };

  // 创建更多测试数据
  const testSchedules: ScheduleItemType[] = [
    testSchedule, // 9:30-10:30 的课程
    {
      id: 'demo-2',
      date: '2024-01-15',
      time: '11:00',
      startTime: '11:00',
      endTime: '12:00',
      clientName: '李四',
      clientId: 'client-2',
      status: 'completed',
      hasBeenChanged: false,
      coachId: 'coach-1'
    },
    {
      id: 'demo-3',
      date: '2024-01-15',
      time: '14:30',
      startTime: '14:30',
      endTime: '15:30',
      clientName: '王五',
      clientId: 'client-3',
      status: 'cancelled',
      hasBeenChanged: false,
      coachId: 'coach-1'
    }
  ];

  // 生成时间轴
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 5;
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  });

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
          课程显示组件演示
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

        {/* 时间轴演示 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            时间轴演示（5:00 - 23:00）
          </h2>
          
          <div style={{
            position: 'relative',
            height: `${timeSlots.length * (isMobile ? 50 : 60)}px`,
            background: '#18181b',
            borderRadius: 6,
            border: '1px solid #333'
          }}>
            {/* 时间标签 */}
            {timeSlots.map((time, index) => (
              <div
                key={time}
                style={{
                  position: 'absolute',
                  top: `${index * (isMobile ? 50 : 60)}px`,
                  left: 0,
                  width: '60px',
                  height: isMobile ? 50 : 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 500,
                  borderBottom: '1px solid #333',
                  backgroundColor: '#23232a'
                }}
              >
                {time}
              </div>
            ))}
            
            {/* 课程显示区域 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '60px',
              right: 0,
              height: '100%',
              background: '#18181b'
            }}>
              {/* 半点分割线 */}
              {timeSlots.map((time, index) => (
                <div
                  key={`half-${time}`}
                  style={{
                    position: 'absolute',
                    top: `${index * (isMobile ? 50 : 60) + (isMobile ? 25 : 30)}px`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#333',
                    opacity: 0.3
                  }}
                />
              ))}
              
              {/* 课程项目 */}
              {testSchedules.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  isMobile={isMobile}
                  onClick={() => {
                    alert(`点击了课程: ${schedule.clientName} (${schedule.startTime}-${schedule.endTime})`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 组件说明 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px' 
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            组件特性说明
          </h2>
          
          <div style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>✅ 已实现功能：</h3>
            <ul style={{ marginBottom: '16px' }}>
              <li>精确时间定位：课程块准确显示在对应的时间位置</li>
              <li>时间格式显示：第一行显示 "930–1030"，第二行显示 "9:30 – 10:30am"</li>
              <li>状态颜色区分：不同状态显示不同颜色（蓝色=已预约，绿色=已完成，红色=已取消，黄色=取消扣课时）</li>
              <li>响应式设计：支持移动端和桌面端不同尺寸</li>
              <li>Google Calendar 风格：浅蓝色背景，白色文字，圆角设计</li>
              <li>可点击交互：支持点击事件处理</li>
              <li>悬停效果：鼠标悬停时有视觉反馈</li>
            </ul>
            
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>📋 测试数据：</h3>
            <ul>
              <li>蓝色课程：张三 9:30-10:30（已预约）</li>
              <li>绿色课程：李四 11:00-12:00（已完成）</li>
              <li>红色课程：王五 14:30-15:30（已取消）</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 