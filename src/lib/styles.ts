// 统一的应用样式常量
export const appStyles = {
  // 页面容器样式
  pageContainer: {
    minHeight: "100vh",
    background: "#18181b",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "20px",
    paddingBottom: "20px"
  },

  // 移动端页面容器样式
  mobilePageContainer: {
    minHeight: "100vh",
    background: "#18181b",
    padding: "0px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "0px",
    paddingBottom: "120px" // 增加底部间距以适应更高的导航栏
  },

  // 内容容器样式
  contentContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: 24,
    width: "100%"
  },

  // 移动端内容容器样式
  mobileContentContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    width: "100%"
  },

  // 标题区域样式
  titleSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative" as const
  },

  // 移动端标题区域样式
  mobileTitleSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative" as const
  },

  // 主标题样式
  mainTitle: {
    color: "#fff",
    fontSize: "36px",
    fontWeight: 700,
    textAlign: "center" as const,
    margin: 0
  },

  // 移动端主标题样式
  mobileMainTitle: {
    color: "#fff",
    fontSize: "36px",
    fontWeight: 700,
    textAlign: "center" as const,
    margin: 0
  },

  // 副标题样式
  subtitle: {
    color: "#a1a1aa",
    fontSize: "16px",
    textAlign: "center" as const,
    margin: 0
  },

  // 移动端副标题样式
  mobileSubtitle: {
    color: "#a1a1aa",
    fontSize: "clamp(12px, 3vw, 14px)",
    textAlign: "center" as const,
    margin: 0
  },

  // 主要按钮样式
  primaryButton: {
    background: "#60a5fa",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 移动端主要按钮样式
  mobilePrimaryButton: {
    background: "#60a5fa",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 次要按钮样式
  secondaryButton: {
    background: "#374151",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 移动端次要按钮样式
  mobileSecondaryButton: {
    background: "#374151",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 危险按钮样式
  dangerButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 移动端危险按钮样式
  mobileDangerButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // 表单输入框样式
  formInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#23232a",
    color: "#fff",
    fontSize: "14px"
  },

  // 表单标签样式
  formLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#a1a1aa",
    fontSize: "14px"
  },

  // 表单组样式
  formGroup: {
    marginBottom: "16px"
  },

  // 模态框样式
  modal: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px"
  },

  // 模态框内容样式
  modalContent: {
    background: "#23232a",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative" as const
  },

  // 卡片样式
  card: {
    background: "#23232a",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #333"
  },

  // 加载状态样式
  loading: {
    color: "#a1a1aa",
    textAlign: "center" as const,
    padding: "20px"
  }
};

// 获取响应式样式的辅助函数
export const getResponsiveStyles = (isMobile: boolean) => ({
  pageContainer: isMobile ? appStyles.mobilePageContainer : appStyles.pageContainer,
  contentContainer: isMobile ? appStyles.mobileContentContainer : appStyles.contentContainer,
  titleSection: isMobile ? appStyles.mobileTitleSection : appStyles.titleSection,
  mainTitle: isMobile ? appStyles.mobileMainTitle : appStyles.mainTitle,
  subtitle: isMobile ? appStyles.mobileSubtitle : appStyles.subtitle,
  primaryButton: isMobile ? appStyles.mobilePrimaryButton : appStyles.primaryButton,
  secondaryButton: isMobile ? appStyles.mobileSecondaryButton : appStyles.secondaryButton,
  dangerButton: isMobile ? appStyles.mobileDangerButton : appStyles.dangerButton
}); 