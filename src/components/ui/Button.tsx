import React from 'react';
import { cardStyles } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const baseStyle = {
    border: 'none',
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    ...style
  };

  const variantStyles = {
    primary: {
      background: '#60a5fa',
      color: '#18181b',
      '&:hover': {
        background: '#3b82f6'
      }
    },
    secondary: {
      background: '#23232a',
      color: '#60a5fa',
      border: '1px solid #60a5fa',
      '&:hover': {
        background: '#374151'
      }
    },
    danger: {
      background: '#ef4444',
      color: '#fff',
      '&:hover': {
        background: '#dc2626'
      }
    }
  };

  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '14px'
    },
    md: {
      padding: '12px 24px',
      fontSize: '16px'
    },
    lg: {
      padding: '16px 32px',
      fontSize: '18px'
    }
  };

  const finalStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
    opacity: disabled || loading ? 0.5 : 1
  };

  return (
    <button
      style={finalStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-spin"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  );
}; 