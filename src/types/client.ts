export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  notes?: string;
  coachId: string;
  createdAt: string;
  updatedAt: string;
}