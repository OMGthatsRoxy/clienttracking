"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181b',
          color: '#fff',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px'
        }}>
          <h2 style={{ color: '#ef4444', margin: 0 }}>出错了！</h2>
          <p style={{ color: '#a1a1aa', textAlign: 'center', margin: 0 }}>
            应用程序遇到了一个错误。请刷新页面重试。
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#60a5fa',
              color: '#18181b',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '16px', color: '#a1a1aa' }}>
              <summary>错误详情</summary>
              <pre style={{ 
                background: '#23232a', 
                padding: '12px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 