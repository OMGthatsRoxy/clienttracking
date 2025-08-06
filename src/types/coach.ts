export interface Coach {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties: string[];
  experience: number;
  certifications: string[];
  education?: string;
  location?: string;
  languages: string[];
  isPublic: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 训练动作模板
export interface ExerciseTemplate {
  id: string;
  coachId: string;
  name: string;
  category: 'upper_body' | 'lower_body' | 'core' | 'full_body' | 'cardio' | 'flexibility';
  target: 'strength' | 'endurance' | 'flexibility' | 'coordination' | 'balance';
  description: string;
  sets: number;
  reps: string; // 例如: "8-12", "30秒", "至力竭"
  weightRange?: string; // 例如: "20-30kg", "自重"
  restTime: string; // 例如: "60秒", "90秒"
  notes?: string;
  isPublic: boolean; // 是否公开分享
  createdAt: string;
  updatedAt: string;
}

// 配套模板
export interface PackageTemplate {
  id: string;
  coachId: string;
  name: string;
  description: string;
  totalSessions: number;
  price: number;
  validityDays: number; // 有效期天数
  category: 'weight_loss' | 'muscle_gain' | 'rehabilitation' | 'fitness' | 'sports' | 'custom';
  features: string[]; // 配套特色
  notes?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// 课程模板（包含配套和训练动作）
export interface LessonTemplate {
  id: string;
  coachId: string;
  name: string;
  packageTemplateId?: string;
  exercises: {
    exerciseTemplateId: string;
    order: number;
    customSets?: number;
    customReps?: string;
    customWeight?: string;
    customNotes?: string;
  }[];
  duration: number; // 课程时长（分钟）
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
} 