// 日期工具函数
export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getLocalISOString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

// 样式工具函数
export const cardStyles = {
  formCard: {
    background: '#23232a',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #333',
    color: '#fff'
  },
  button: {
    primary: {
      background: '#60a5fa',
      color: '#18181b',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    secondary: {
      background: '#23232a',
      color: '#60a5fa',
      border: '1px solid #60a5fa',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    border: 'none',
    borderRadius: '8px',
    background: '#18181b',
    color: '#f4f4f5',
    outline: '1.5px solid #333',
    transition: 'outline 0.2s'
  }
};

// 数据验证工具函数
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 8;
};

// 错误处理工具函数
export const handleFirebaseError = (error: any): string => {
  console.error('Firebase Error:', error);
  
  if (error.code === 'permission-denied') {
    return '权限不足，请检查您的账户权限';
  }
  
  if (error.code === 'not-found') {
    return '数据未找到';
  }
  
  if (error.code === 'already-exists') {
    return '数据已存在';
  }
  
  return error.message || '操作失败，请重试';
};

// 状态管理工具函数
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'new': '#3b82f6',
    'contacted': '#f59e0b',
    'interested': '#10b981',
    'converted': '#8b5cf6',
    'lost': '#ef4444',
    'scheduled': '#3b82f6',
    'completed': '#10b981',
    'cancelled': '#ef4444',
    'cancelled_with_deduction': '#f59e0b'
  };
  
  return statusColors[status] || '#6b7280';
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'new': '新客户',
    'contacted': '已联系',
    'interested': '感兴趣',
    'converted': '已转化',
    'lost': '已流失',
    'scheduled': '已预约',
    'completed': '已完成',
    'cancelled': '已取消',
    'cancelled_with_deduction': '已取消(扣课时)'
  };
  
  return statusTexts[status] || status;
}; 