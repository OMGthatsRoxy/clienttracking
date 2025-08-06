export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  muscleGroups: string[];
  instructions?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 自定义动作类型
export interface CustomExercise {
  id: string;
  coachId: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'glutes' | 'legs' | 'fullbody';
  description?: string;
  notes?: string;
  isActive: boolean; // 是否启用
  createdAt: string;
  updatedAt: string;
}

// 动作分类选项
export const EXERCISE_CATEGORIES = [
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'shoulders', label: '肩膀' },
  { value: 'arms', label: '手臂' },
  { value: 'glutes', label: '臀' },
  { value: 'legs', label: '腿' },
  { value: 'fullbody', label: '全身' }
] as const;

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number]['value']; 