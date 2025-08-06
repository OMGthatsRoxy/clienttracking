"use client";

import React, { useState } from 'react';
import ScheduleItem from '@/components/ScheduleItem';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';

export default function ScheduleTestPage() {
  const [isMobile, setIsMobile] = useState(false);

  // 专门测试 9:30-10:30 的课程
  const testSchedule: ScheduleItemType = {
    id: 'test-930',
    date: '2024-01-15',
    time: '09:30',
    startTime: '09:30',
    endTime: '10:30',
    clientName: '测试客户',
    clientId: 'client-test',
    status: 'scheduled',
    hasBeenChanged: false,
    coachId: 'coach-1'
  };

  // 生成时间轴（5:00 到 23:00）
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
          课程块位置测试 - 9:30-10:30
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

        {/* 时间轴测试 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            时间轴测试（5:00 - 23:00）
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
            
            {/* 半点分割线 */}
            {timeSlots.map((time, index) => (
              <div
                key={`half-${time}`}
                style={{
                  position: 'absolute',
                  top: `${index * (isMobile ? 50 : 60) + (isMobile ? 25 : 30)}px`,
                  left: '60px',
                  right: 0,
                  height: '1px',
                  backgroundColor: '#333',
                  opacity: 0.3
                }}
              />
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
              {/* 9:30-10:30 课程块 */}
              <ScheduleItem
                schedule={testSchedule}
                isMobile={isMobile}
                onClick={() => {
                  alert('点击了 9:30-10:30 的课程块！');
                }}
              />
            </div>
          </div>
        </div>

        {/* 位置信息 */}
        <div style={{ 
          background: '#23232a', 
          borderRadius: 8, 
          padding: '20px' 
        }}>
          <h2 style={{ marginBottom: '16px', color: '#fff' }}>
            位置计算信息
          </h2>
          
          <div style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>📊 9:30-10:30 课程块计算：</h3>
            <ul style={{ marginBottom: '16px' }}>
              <li>开始时间：9:30 (9小时30分钟)</li>
              <li>结束时间：10:30 (10小时30分钟)</li>
              <li>相对于5:00的位置：9:30 - 5:00 = 4小时30分钟 = 270分钟</li>
              <li>课程时长：10:30 - 9:30 = 1小时 = 60分钟</li>
              <li>时间格高度：{isMobile ? '50px' : '60px'} (每小时)</li>
              <li>计算得到的 top 位置：{(270 / 60) * (isMobile ? 50 : 60)}px</li>
              <li>计算得到的高度：{(60 / 60) * (isMobile ? 50 : 60)}px</li>
            </ul>
            
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>🎯 预期效果：</h3>
            <ul>
              <li>课程块应该从 9:30 时间线开始</li>
              <li>课程块应该延伸到 10:30 时间线</li>
              <li>课程块应该精确跨越 1 小时的时间段</li>
              <li>时间格式：第一行显示 "0930–1030"</li>
              <li>时间格式：第二行显示 "9:30am – 10:30am"</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 