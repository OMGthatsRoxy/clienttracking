"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import ProspectList from "@/features/prospects/ProspectList";
import ProspectForm from "@/features/prospects/ProspectForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// 模态框组件
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: '#23232a',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            fontSize: '24px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default function ProspectsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 统一的卡片样式
  const cardStyle = {
    maxWidth: 1000,
    width: '100%',
    marginBottom: 12,
    background: '#23232a',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #333'
  };

  // 卡片容器样式 - 与登录页面一致
  const containerStyle = {
    minHeight: "100vh",
    background: "#18181b",
    paddingLeft: isMobile ? "8px" : "16px",
    paddingRight: isMobile ? "8px" : "16px",
    paddingBottom: isMobile ? "8px" : "16px",
    paddingTop: isMobile ? "15px" : "40px", // 与登录页面一致
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12
  };

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 🧱 卡片1: 标题卡片 */}
      <div style={cardStyle}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center"
        }}>
          <h1 style={{
            fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            textAlign: "center",
            flex: 1
          }}>
            {t('prospects')}
          </h1>
          
          {/* 添加按钮 */}
          <button 
            onClick={() => setShowModal(true)}
            style={{
              background: "#60a5fa",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: isMobile ? "8px 16px" : "12px 24px",
              fontSize: isMobile ? "clamp(12px, 2.5vw, 16px)" : "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#60a5fa';
            }}
          >
            + {t('prospect')}
          </button>
        </div>
      </div>

      {/* 🧱 卡片2: 潜在客户列表卡片 */}
      <div style={cardStyle}>
        <ErrorBoundary>
          <ProspectList />
        </ErrorBoundary>
      </div>

      {/* 底部间距 - 为导航栏留空间 */}
      <div style={{ height: isMobile ? 120 : 20 }} />

      {/* 添加潜在客户表单模态框 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ErrorBoundary>
          <ProspectForm onSuccess={() => setShowModal(false)} />
        </ErrorBoundary>
      </Modal>
    </div>
  );
}
