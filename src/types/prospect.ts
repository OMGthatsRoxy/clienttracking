export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  source?: string; // 来源：如推荐、广告、网站等
  coachId: string;
  createdAt: string;
  updatedAt: string;
} 