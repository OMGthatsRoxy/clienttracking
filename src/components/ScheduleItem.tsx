"use client";

import React, { memo } from 'react';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { 
  getStatusColor, 
  formatTimeDisplay, 
  calculateSchedulePosition, 
  isHalfTimeSchedule 
} from '@/lib/scheduleUtils';

interface ScheduleItemProps {
  schedule: ScheduleItemType;
  isMobile?: boolean;
  isHalfTime?: boolean;
  hasLessonRecord?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, schedule: ScheduleItemType) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const ScheduleItem: React.FC<ScheduleItemProps> = memo(({ 
  schedule, 
  isMobile = false, 
  isHalfTime = false,
  hasLessonRecord = false,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false
}) => {
  // 如果有课程记录，使用绿色主题
  const colors = hasLessonRecord 
    ? { bg: '#10b981', color: '#ffffff' } 
    : getStatusColor(schedule.status);
  const timeDisplay = formatTimeDisplay(schedule);
  
  // 基础样式
  const baseStyle: React.CSSProperties = {
    backgroundColor: colors.bg,
    color: colors.color,
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'rotate(5deg)' : 'none',
    transition: 'opacity 0.2s, transform 0.2s',
    userSelect: 'none',
    boxSizing: 'border-box'
  };

  // 文本样式
  const textStyle: React.CSSProperties = {
    lineHeight: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    textAlign: 'center'
  };

  // 半点课程样式
  if (isHalfTime || isHalfTimeSchedule(schedule)) {
    const { top, height } = calculateSchedulePosition(schedule, isMobile);
    
    return (
      <div
        draggable={true}
        onDragStart={(e) => onDragStart?.(e, schedule)}
        onDragEnd={onDragEnd}
        style={{
          ...baseStyle,
          position: 'absolute',
          top: `${top}px`,
          left: '0px',
          right: '0px',
          height: `${height}px`,
          margin: '1px',
          fontSize: isMobile ? 'clamp(8px, 2vw, 10px)' : '12px',
          padding: '2px',
          pointerEvents: 'auto',
          zIndex: 5,
          minWidth: '60px'
        }}
        onClick={onClick}
        title={`${schedule.clientName} - ${timeDisplay}`}
      >
        <div style={{ 
          ...textStyle,
          fontSize: isMobile ? 'clamp(7px, 1.8vw, 9px)' : '10px', 
          marginBottom: '2px',
          fontWeight: 600,
          maxWidth: '100%'
        }}>
          {schedule.clientName}
        </div>
        <div style={{ 
          ...textStyle,
          fontSize: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '9px',
          opacity: 0.9,
          minWidth: 0,
          maxWidth: '100%'
        }}>
          {timeDisplay}
        </div>
      </div>
    );
  }
  
  // 整点课程样式
  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart?.(e, schedule)}
      onDragEnd={onDragEnd}
      style={{
        ...baseStyle,
        width: 'calc(100% + 4px)',
        height: 'calc(100% + 4px)',
        margin: '-2px',
        fontSize: isMobile ? 'clamp(8px, 2vw, 10px)' : '12px',
        padding: '6px',
        minHeight: 'calc(100% + 4px)',
        minWidth: 'calc(100% + 4px)',
        zIndex: 5
      }}
      onClick={onClick}
      title={`${schedule.clientName} - ${timeDisplay}`}
    >
      <div style={{ 
        ...textStyle,
        fontSize: isMobile ? 'clamp(7px, 1.8vw, 9px)' : '10px', 
        marginBottom: '2px',
        fontWeight: 600,
        maxWidth: '100%'
      }}>
        {schedule.clientName}
      </div>
      <div style={{ 
        ...textStyle,
        fontSize: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '9px',
        opacity: 0.9,
        minWidth: 0,
        maxWidth: '100%'
      }}>
        {timeDisplay}
      </div>
    </div>
  );
});

ScheduleItem.displayName = 'ScheduleItem';

export default ScheduleItem; 