export interface LessonRecord {
  id?: string;
  clientId: string;
  clientName: string;
  coachId: string;
  lessonDate: string; // 课程日期，格式：YYYY-MM-DD
  lessonTime: string; // 课程时间，格式：HH:MM
  duration: number; // 课程时长（分钟）
  content: string; // 课程内容（保留字段）
  notes: string; // 教练记录
  performance: string; // 学员表现
  nextGoals: string; // 下次目标
  packageId?: string; // 关联的配套ID
  trainingMode?: string; // 训练模式
  exerciseActions?: Array<{
    id: string;
    category: string;
    exercise: string;
    weights: string[];
  }>; // 动作训练数据
  attachments?: string[]; // 附件（图片等）
  createdAt: string;
  updatedAt: string;
} 