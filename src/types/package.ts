export interface Package {
  id: string;
  clientId: string;
  coachId?: string;
  startDate: string;
  validUntil: string;
  totalSessions: number;
  totalAmount: number; // 总金额
  remainingSessions: number;
  isExpired: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}