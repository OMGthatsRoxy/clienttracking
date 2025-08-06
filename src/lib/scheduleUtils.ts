// 课程排课工具函数
import type { ScheduleItem } from '@/types/schedule';

// 时间相关常量
export const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const hour = i + 5;
  return hour < 10 ? `0${hour}:00` : `${hour}:00`;
});

export const TIME_SLOT_HEIGHT = {
  mobile: 50,
  desktop: 60
};

// 状态颜色配置
export const STATUS_COLORS = {
  completed: { bg: '#059669', color: '#fff' },
  cancelled: { bg: '#dc2626', color: '#fff' },
  cancelled_with_deduction: { bg: '#eab308', color: '#18181b' },
  scheduled: { bg: '#ffffff', color: '#18181b' }
} as const;

// 格式化日期显示
export const formatDate = (dateString: string, language: string = 'zh') => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  const dayNames = {
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ms: ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab']
  };
  
  const dayName = dayNames[language as keyof typeof dayNames][date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return {
    display: `${month}/${day}`,
    dayName: dayName,
    isToday
  };
};

// 根据视图模式生成日期
export const getDatesByViewMode = (offset: number, mode: 'day' | 'threeDay' | 'week' | 'month') => {
  const today = new Date();
  
  if (mode === 'day') {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    return [targetDate.toISOString().split('T')[0]];
  } else if (mode === 'threeDay') {
    const centerDate = new Date(today);
    centerDate.setDate(today.getDate() + offset);
    
    return Array.from({ length: 3 }, (_, i) => {
      const date = new Date(centerDate);
      date.setDate(centerDate.getDate() + (i - 1));
      return date.toISOString().split('T')[0];
    });
  } else if (mode === 'week') {
    const weekStart = new Date(today);
    const currentDay = weekStart.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setDate(weekStart.getDate() + (offset * 7));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  } else if (mode === 'month') {
    const monthStart = new Date(today);
    monthStart.setDate(1);
    monthStart.setMonth(today.getMonth() + offset);

    // 获取月份第一天是星期几（0=周日，1=周一，...）
    const firstDayOfWeek = monthStart.getDay();
    // 调整为周一为第一天（0=周一，1=周二，...，6=周日）
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // 获取月份的总天数
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    
    const monthDates: string[] = [];
    
    // 添加上个月末尾的日期（填充第一周）
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(monthStart.getDate() - (i + 1));
      monthDates.push(date.toISOString().split('T')[0]);
    }
    
    // 添加当前月份的所有日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(monthStart);
      date.setDate(i);
      monthDates.push(date.toISOString().split('T')[0]);
    }
    
    // 添加下个月开头的日期（填充最后一周，确保总共42天）
    const remainingDays = 42 - monthDates.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(monthStart);
      date.setDate(daysInMonth + i);
      monthDates.push(date.toISOString().split('T')[0]);
    }
    
    return monthDates;
  }
  return [];
};

// 获取结束时间
export const getEndTime = (startTime: string) => {
  const [hour, minute] = startTime.split(':').map(Number);
  if (minute === 30) {
    return `${(hour + 1).toString().padStart(2, '0')}:30`;
  } else {
    return `${(hour + 1).toString().padStart(2, '0')}:00`;
  }
};

// 格式化时间显示
export const formatTimeDisplay = (schedule: ScheduleItem) => {
  const startTime = schedule.startTime || schedule.time;
  const endTime = schedule.endTime || getEndTime(startTime);
  
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
};

// 检查是否有课程跨越时间段
export const getOverlappingSchedule = (schedules: ScheduleItem[], date: string, time: string) => {
  return schedules.find(item => {
    if (item.date !== date) return false;
    
    const itemStart = item.startTime || item.time;
    const itemEnd = item.endTime || getEndTime(itemStart);
    
    return itemStart <= time && itemEnd > time;
  });
};

// 检查时间段是否有课程
export const hasSchedule = (schedules: ScheduleItem[], date: string, time: string) => {
  return schedules.some(item => {
    if (item.date !== date) return false;
    
    const itemStart = item.startTime || item.time;
    const itemEnd = item.endTime || getEndTime(itemStart);
    
    return itemStart <= time && itemEnd > time;
  });
};

// 获取状态颜色
export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.scheduled;
};

// 计算课程位置（用于半点课程）
export const calculateSchedulePosition = (schedule: ScheduleItem, isMobile: boolean) => {
  const startTime = schedule.startTime || schedule.time;
  const endTime = schedule.endTime || getEndTime(startTime);
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = (startHour - 5) * 60 + startMinute;
  const endMinutes = (endHour - 5) * 60 + endMinute;
  
  const timeSlotHeight = isMobile ? TIME_SLOT_HEIGHT.mobile : TIME_SLOT_HEIGHT.desktop;
  
  const top = (startMinutes / 60) * timeSlotHeight;
  const height = ((endMinutes - startMinutes) / 60) * timeSlotHeight;
  
  return { top, height };
};

// 检查是否是半点课程
export const isHalfTimeSchedule = (schedule: ScheduleItem) => {
  const startTime = schedule.startTime || schedule.time;
  const [hour, minute] = startTime.split(':').map(Number);
  return minute === 30;
};

// 获取当前月份课程统计
export const getCurrentMonthStats = (schedules: ScheduleItem[]) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const currentMonthSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    const scheduleYear = scheduleDate.getFullYear();
    const scheduleMonth = scheduleDate.getMonth() + 1;
    
    return scheduleYear === currentYear && scheduleMonth === currentMonth;
  });
  
  return {
    total: currentMonthSchedules.length,
    completed: currentMonthSchedules.filter(s => s.status === 'completed').length,
    cancelled: currentMonthSchedules.filter(s => s.status === 'cancelled').length,
    cancelledWithDeduction: currentMonthSchedules.filter(s => s.status === 'cancelled_with_deduction').length
  };
};

// 验证时间冲突
export const validateTimeConflict = (schedules: ScheduleItem[], date: string, startTime: string, excludeId?: string) => {
  const endTime = getEndTime(startTime);
  
  return schedules.some(schedule => {
    if (schedule.id === excludeId) return false;
    if (schedule.date !== date) return false;
    
    const scheduleStart = schedule.startTime || schedule.time;
    const scheduleEnd = schedule.endTime || getEndTime(scheduleStart);
    
    // 检查时间重叠
    return (startTime < scheduleEnd && endTime > scheduleStart);
  });
}; 