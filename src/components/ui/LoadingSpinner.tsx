import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#60a5fa',
  text
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    }}>
      <svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        style={{
          animation: 'spin 1s linear infinite'
        }}
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      {text && (
        <p style={{
          color: '#a1a1aa',
          margin: 0,
          fontSize: '14px'
        }}>
          {text}
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#18181b'
  }}>
    <LoadingSpinner size="lg" text={text} />
  </div>
); 