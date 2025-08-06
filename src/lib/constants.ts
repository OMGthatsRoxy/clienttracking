// 应用常量
export const APP_CONSTANTS = {
  COLLECTIONS: {
    CLIENTS: 'clients',
    PACKAGES: 'packages',
    SCHEDULES: 'schedules',
    COACHES: 'coaches',
    PROSPECTS: 'prospects'
  },
  STATUS: {
    CLIENT: {
      ACTIVE: 'active',
      INACTIVE: 'inactive'
    },
    PACKAGE: {
      ACTIVE: 'active',
      EXPIRED: 'expired',
      COMPLETED: 'completed'
    },
    SCHEDULE: {
      SCHEDULED: 'scheduled',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      CANCELLED_WITH_DEDUCTION: 'cancelled_with_deduction'
    },
    PROSPECT: {
      NEW: 'new',
      CONTACTED: 'contacted',
      INTERESTED: 'interested',
      CONVERTED: 'converted',
      LOST: 'lost'
    }
  },
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
  },
  TIME_SLOTS: Array.from({ length: 20 }, (_, i) => {
    const hour = i + 5;
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  }),
  PACKAGE_TYPES: [
    '个人训练',
    '小团课',
    '大团课',
    '私教课',
    '体能训练',
    '瑜伽',
    '普拉提',
    '其他'
  ],
  SOURCE_OPTIONS: [
    { value: '', label: '请选择来源' },
    { value: '朋友推荐', label: '朋友推荐' },
    { value: '社交媒体', label: '社交媒体' },
    { value: '广告', label: '广告' },
    { value: '网站', label: '网站' },
    { value: '其他', label: '其他' }
  ]
};

// 样式常量
export const STYLE_CONSTANTS = {
  COLORS: {
    PRIMARY: '#60a5fa',
    SECONDARY: '#23232a',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#3b82f6',
    BACKGROUND: '#18181b',
    SURFACE: '#23232a',
    TEXT_PRIMARY: '#fff',
    TEXT_SECONDARY: '#a1a1aa',
    TEXT_MUTED: '#71717a',
    BORDER: '#333'
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px'
  },
  BORDER_RADIUS: {
    SM: '4px',
    MD: '8px',
    LG: '12px',
    XL: '16px'
  },
  FONT_SIZES: {
    XS: '12px',
    SM: '14px',
    MD: '16px',
    LG: '18px',
    XL: '24px',
    XXL: '32px'
  }
};

// 验证规则
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  NAME: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// 错误消息
export const ERROR_MESSAGES = {
  REQUIRED: '此字段为必填项',
  INVALID_EMAIL: '请输入有效的邮箱地址',
  INVALID_PHONE: '请输入有效的电话号码',
  INVALID_NAME: '姓名只能包含中文、英文和空格',
  PASSWORD_TOO_WEAK: '密码必须包含至少8个字符，包括大小写字母和数字',
  FILE_TOO_LARGE: '文件大小不能超过5MB',
  UNSUPPORTED_FILE_TYPE: '不支持的文件类型',
  NETWORK_ERROR: '网络连接错误，请检查网络后重试',
  PERMISSION_DENIED: '权限不足，请检查您的账户权限',
  NOT_FOUND: '数据未找到',
  ALREADY_EXISTS: '数据已存在'
}; 