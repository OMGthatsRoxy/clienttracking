"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";

import ClientForm from "@/features/clients/ClientForm";

export default function NewClientPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动设备
  useEffect(() => {
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

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;

  const handleSuccess = (name: string) => {
    setClientName(name);
    setShowSuccessModal(true);
    
    // 延迟跳转到客户列表页面
    setTimeout(() => {
      window.location.href = '/clients';
    }, 2000);
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
      `}</style>
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        padding: "20px"
      }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{t('newClient')}</h1>
          <p style={{ color: "#a1a1aa" }}>{t('newClient')}</p>
        </div>

        <ClientForm onSuccess={handleSuccess} />

        {/* 成功弹窗 */}
        {showSuccessModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '8px' : '16px'
          }}>
            <div className="form-card" style={{ 
              maxWidth: isMobile ? '100%' : 400, 
              width: '100%',
              padding: isMobile ? '16px' : '20px',
              textAlign: 'center'
            }}>
              {/* 成功图标 */}
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              
              <h3 style={{ 
                color: "#10b981", 
                fontSize: isMobile ? "clamp(16px, 3vw, 18px)" : "20px",
                fontWeight: 600, 
                marginBottom: 8,
                textAlign: 'center'
              }}>
                {t('clientAddedSuccess')}
              </h3>
              
              <p style={{ 
                color: '#a1a1aa', 
                marginBottom: 12,
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px",
                textAlign: 'center',
                lineHeight: 1.4
              }}>
                &quot;{clientName}&quot; {t('clientAddedMessage')}
              </p>
              
              {/* 加载动画 */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s infinite'
                }}></div>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s infinite 0.2s'
                }}></div>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s infinite 0.4s'
                }}></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 