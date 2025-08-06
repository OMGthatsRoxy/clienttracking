"use client";

import { useEffect, useState } from 'react';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export const MobileOptimizer: React.FC<MobileOptimizerProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        setIsMobile(isMobileDevice);
      }
    };

    // 检测是否为PWA独立模式
    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);
      }
    };

    // 监听PWA安装提示事件
    const handleBeforeInstallPrompt = (e: any) => {
      // 阻止默认的安装提示
      e.preventDefault();
      // 保存事件以便稍后触发
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // 监听PWA应用已安装事件
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    // 监听窗口大小变化
    const handleResize = () => {
      checkMobile();
    };

    checkMobile();
    checkStandalone();

    // 添加事件监听器（仅在客户端）
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, []);

  // 处理安装按钮点击
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 如果没有deferredPrompt，显示手动安装说明
      showManualInstallInstructions();
      return;
    }

    try {
      // 显示安装提示
      deferredPrompt.prompt();
      
      // 等待用户响应
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // 清除deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      showManualInstallInstructions();
    }
  };

  // 显示手动安装说明
  const showManualInstallInstructions = () => {
    if (typeof navigator === 'undefined') {
      alert('请使用手机浏览器访问此页面，然后添加到主屏幕');
      return;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    if (isIOS) {
      message = '在Safari浏览器中，点击底部的分享按钮，然后选择"添加到主屏幕"';
    } else if (isAndroid) {
      message = '在Chrome浏览器中，点击右上角菜单，然后选择"添加到主屏幕"';
    } else {
      message = '请使用手机浏览器访问此页面，然后添加到主屏幕';
    }
    
    alert(message);
  };

  // 移动端样式优化 - 更紧凑的布局
  const mobileStyles = {
    body: {
      fontSize: isMobile ? '13px' : '16px', // 减小移动端字体
      lineHeight: isMobile ? '1.3' : '1.5', // 减小行高
      padding: isMobile ? '0px' : '20px', // 移除移动端body padding
      maxWidth: '100vw',
      overflowX: 'hidden'
    },
    container: {
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isMobile ? '4px' : '20px', // 大幅减少移动端padding
      paddingBottom: isMobile ? '100px' : '20px', // 增加底部导航栏预留空间，确保最后一张卡片有足够间距
      height: isMobile ? '100vh' : 'auto', // 移动端固定高度
      overflow: isMobile ? 'auto' : 'visible', // 移动端仅在需要时滚动
      minHeight: isMobile ? '100vh' : 'auto', // 移动端最小高度为视口高度
      position: isMobile ? 'relative' as const : 'static' as const // 移动端相对定位
    }
  };

  return (
    <div style={mobileStyles.container}>
      {children}
      
      {/* 移动端安装提示 - 更紧凑的样式 */}
      {isMobile && !isStandalone && showInstallPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '70px', // 调整位置，避免与底部导航栏重叠
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#60a5fa',
          color: '#fff',
          padding: '8px 16px', // 减少内边距
          borderRadius: '20px',
          fontSize: '12px', // 减小字体
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px', // 减少间距
          maxWidth: '85vw' // 稍微减小最大宽度
        }}>
          <span>📱 添加到主屏幕</span>
          <button
            onClick={handleInstallClick}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '4px 8px', // 减少按钮内边距
              borderRadius: '4px',
              fontSize: '11px', // 减小按钮字体
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            安装
          </button>
          <button
            onClick={() => setShowInstallPrompt(false)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              padding: '3px 6px', // 减少关闭按钮内边距
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 手动安装提示（当自动安装不可用时）- 更紧凑的样式 */}
      {isMobile && !isStandalone && !showInstallPrompt && !deferredPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '70px', // 调整位置，避免与底部导航栏重叠
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#f59e0b',
          color: '#fff',
          padding: '8px 16px', // 减少内边距
          borderRadius: '20px',
          fontSize: '12px', // 减小字体
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px', // 减少间距
          maxWidth: '85vw' // 稍微减小最大宽度
        }}>
          <span>📱 手动添加到主屏幕</span>
          <button
            onClick={showManualInstallInstructions}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '4px 8px', // 减少按钮内边距
              borderRadius: '4px',
              fontSize: '11px', // 减小按钮字体
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            查看说明
          </button>
        </div>
      )}
    </div>
  );
}; 