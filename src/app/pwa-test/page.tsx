"use client";

import { useEffect, useState } from 'react';

export default function PWATestPage() {
  const [pwaInfo, setPwaInfo] = useState({
    isStandalone: false,
    isMobile: false,
    hasServiceWorker: false,
    hasBeforeInstallPrompt: false,
    userAgent: ''
  });

  useEffect(() => {
    // 检测PWA相关信息
    const checkPWAInfo = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      setPwaInfo({
        isStandalone,
        isMobile,
        hasServiceWorker,
        hasBeforeInstallPrompt: false,
        userAgent: navigator.userAgent
      });
    };

    // 监听beforeinstallprompt事件
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired');
      setPwaInfo(prev => ({ ...prev, hasBeforeInstallPrompt: true }));
    };

    checkPWAInfo();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleManualInstall = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    if (isIOS) {
      message = '在Safari浏览器中：\n1. 点击底部的分享按钮（方框+箭头）\n2. 选择"添加到主屏幕"\n3. 点击"添加"';
    } else if (isAndroid) {
      message = '在Chrome浏览器中：\n1. 点击右上角菜单按钮（三个点）\n2. 选择"添加到主屏幕"\n3. 点击"添加"';
    } else {
      message = '请使用手机浏览器访问此页面，然后按照浏览器提示添加到主屏幕';
    }
    
    alert(message);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#18181b',
      color: '#fff',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>PWA 测试页面</h1>
      
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#23232a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginTop: 0 }}>PWA 状态检测</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>独立模式 (Standalone):</strong> 
          <span style={{ color: pwaInfo.isStandalone ? '#10b981' : '#ef4444', marginLeft: '10px' }}>
            {pwaInfo.isStandalone ? '✅ 是' : '❌ 否'}
          </span>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>移动设备:</strong> 
          <span style={{ color: pwaInfo.isMobile ? '#10b981' : '#ef4444', marginLeft: '10px' }}>
            {pwaInfo.isMobile ? '✅ 是' : '❌ 否'}
          </span>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Service Worker 支持:</strong> 
          <span style={{ color: pwaInfo.hasServiceWorker ? '#10b981' : '#ef4444', marginLeft: '10px' }}>
            {pwaInfo.hasServiceWorker ? '✅ 是' : '❌ 否'}
          </span>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>安装提示可用:</strong> 
          <span style={{ color: pwaInfo.hasBeforeInstallPrompt ? '#10b981' : '#f59e0b', marginLeft: '10px' }}>
            {pwaInfo.hasBeforeInstallPrompt ? '✅ 是' : '⚠️ 否'}
          </span>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>用户代理:</strong>
          <div style={{ 
            fontSize: '12px', 
            color: '#a1a1aa', 
            marginTop: '5px',
            wordBreak: 'break-all'
          }}>
            {pwaInfo.userAgent}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#23232a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginTop: 0 }}>安装说明</h2>
        
        {!pwaInfo.isStandalone ? (
          <div>
            <p style={{ marginBottom: '15px' }}>
              如果自动安装提示没有出现，请使用手动安装方法：
            </p>
            
            <button
              onClick={handleManualInstall}
              style={{
                background: '#60a5fa',
                color: '#18181b',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              查看手动安装说明
            </button>
          </div>
        ) : (
          <div style={{ color: '#10b981', textAlign: 'center' }}>
            <h3>✅ 应用已安装</h3>
            <p>您正在以PWA模式运行此应用！</p>
          </div>
        )}
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#23232a',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2 style={{ marginTop: 0 }}>故障排除</h2>
        
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong>没有安装提示:</strong> 确保使用HTTPS或localhost，并且满足PWA安装条件
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>安装失败:</strong> 清除浏览器缓存，重新访问页面
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>图标不显示:</strong> 确保icon文件存在且路径正确
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>离线功能不工作:</strong> 检查Service Worker是否正确注册
          </li>
        </ul>
      </div>
    </div>
  );
} 