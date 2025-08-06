"use client";

import { useEffect, useState } from 'react';

export default function LayoutTestPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
      setWindowHeight(window.innerHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 生成测试卡片
  const testCards = Array.from({ length: 10 }, (_, i) => (
    <div
      key={i}
      className="form-card"
      style={{
        maxWidth: 600,
        width: '100%',
        marginBottom: 16,
        background: `hsl(${i * 36}, 70%, 60%)`,
        color: '#fff',
        textAlign: 'center',
        padding: '40px 20px'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>测试卡片 {i + 1}</h3>
      <p style={{ margin: 0, opacity: 0.9 }}>
        这是第 {i + 1} 个测试卡片，用于验证底部间距是否正确。
        {i === 9 && '这是最后一个卡片，应该完全可见且不被导航栏遮挡。'}
      </p>
    </div>
  ));

  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      background: '#18181b',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 40
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        marginBottom: 30
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: 20,
          color: '#fff',
          fontSize: '24px'
        }}>
          布局测试页面
        </h1>
        
        <div style={{
          background: '#23232a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>设备信息</h2>
          <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
            <p><strong>设备类型:</strong> {isMobile ? '移动设备' : '桌面设备'}</p>
            <p><strong>窗口高度:</strong> {windowHeight}px</p>
            <p><strong>用户代理:</strong> {navigator.userAgent}</p>
          </div>
        </div>

        <div style={{
          background: '#23232a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>测试说明</h2>
          <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
            <p>1. 滚动到页面最底部</p>
            <p>2. 检查最后一个卡片是否完全可见</p>
            <p>3. 确认卡片圆角不被导航栏遮挡</p>
            <p>4. 验证页面内容有足够的底部间距</p>
          </div>
        </div>
      </div>

      {/* 测试卡片 */}
      {testCards}

      {/* 底部标记 */}
      <div style={{
        background: '#10b981',
        color: '#fff',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>✅ 页面底部</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>
          如果你能看到这个绿色区域，说明底部间距设置正确！
        </p>
      </div>
    </div>
  );
} 