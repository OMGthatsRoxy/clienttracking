"use client";

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isMobile?: boolean;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  children, 
  isMobile = false,
  maxWidth = '400px',
  showCloseButton = true
}: ModalProps) {
  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      
      // 禁用背景滚动
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // 清理函数：恢复滚动
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // 阻止模态框内容滚动传播到背景
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 点击背景关闭模态框
  const handleBackdropClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '8px' : '16px',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          background: '#18181b',
          borderRadius: 12,
          padding: isMobile ? '16px' : '24px',
          maxWidth: isMobile ? '100%' : maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #333',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
        onClick={handleModalClick}
      >
        {/* 关闭按钮 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#a1a1aa';
            }}
          >
            ×
          </button>
        )}
        
        {children}
      </div>
    </div>
  );
}
