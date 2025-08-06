export interface ScheduleItem {
  id?: string;
  date: string;
  time: string; // 保持兼容性，存储开始时间
  startTime: string; // 课程开始时间 (如 "09:00" 或 "09:30")
  endTime: string; // 课程结束时间 (如 "10:00" 或 "10:30")
  clientName: string;
  clientId: string;
  packageId?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'cancelled_with_deduction';
  originalStatus?: 'scheduled' | 'completed' | 'cancelled' | 'cancelled_with_deduction';
  hasBeenChanged: boolean;
  coachId: string;
  createdAt?: string;
  updatedAt?: string;
}