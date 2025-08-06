// 通用样式定义
export const commonStyles = {
  // 容器样式
  container: {
    minHeight: "100vh",
    background: "#18181b",
    padding: "20px",
    color: "#fff",
    paddingBottom: "120px" // 为底部导航栏预留空间
  },

  // 卡片样式
  card: {
    background: "#23232a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    border: "1px solid #333",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
  },

  // 输入框样式
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#23232a',
    color: '#fff',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    outline: 'none'
  },

  // 标签样式
  label: {
    display: 'block',
    marginBottom: 4,
    color: '#a1a1aa',
    fontSize: 'clamp(12px, 2.5vw, 14px)'
  },

  // 按钮样式
  button: {
    background: "#60a5fa",
    color: "#18181b",
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "clamp(13px, 2.5vw, 14px)",
    transition: "all 0.2s ease"
  },

  // 危险按钮样式
  dangerButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "clamp(13px, 2.5vw, 14px)",
    transition: "all 0.2s ease"
  },

  // 禁用按钮样式
  disabledButton: {
    background: "#6b7280",
    color: "#9ca3af",
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "not-allowed",
    fontSize: "clamp(13px, 2.5vw, 14px)"
  },

  // 标题样式
  title: {
    fontSize: "clamp(18px, 4vw, 24px)",
    fontWeight: 600,
    marginBottom: 16,
    color: "#fff"
  },

  // 副标题样式
  subtitle: {
    fontSize: "clamp(14px, 2.5vw, 16px)",
    fontWeight: 500,
    marginBottom: 12,
    color: "#a1a1aa"
  },

  // 错误消息样式
  error: {
    color: "#ef4444",
    fontSize: "clamp(11px, 2.5vw, 12px)",
    marginTop: 8,
    textAlign: "center"
  },

  // 成功消息样式
  success: {
    color: "#10b981",
    fontSize: "clamp(11px, 2.5vw, 12px)",
    marginTop: 8,
    textAlign: "center"
  },

  // 加载样式
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  }
}; 