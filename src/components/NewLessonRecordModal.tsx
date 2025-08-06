"use client";
import { useState } from "react";
import { useLanguage } from "@/features/language/LanguageProvider";
import LessonRecordForm from "@/features/lessonRecords/LessonRecordForm";

interface NewLessonRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  initialDate?: string;
  initialTime?: string;
  packageId?: string;
  isMobile: boolean;
  onSuccess: (recordId?: string) => void;
}

export default function NewLessonRecordModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  initialDate,
  initialTime,
  packageId,
  isMobile,
  onSuccess
}: NewLessonRecordModalProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = (recordId?: string) => {
    onSuccess(recordId);
    onClose();
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
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
      padding: isMobile ? '8px' : '16px'
    }}>
      <div style={{
        background: '#18181b',
        borderRadius: 12,
        padding: isMobile ? '16px' : '24px',
        maxWidth: isMobile ? '100%' : 800,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #333',
        position: 'relative'
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            fontSize: 24,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            padding: 4,
            borderRadius: 4,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isSubmitting ? 0.5 : 1
          }}
        >
          ×
        </button>

        {/* 标题 */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: isMobile ? 18 : 20, fontWeight: 600, margin: 0 }}>
            {t('newCourseRecord')} - {clientName}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14, margin: '4px 0 0 0' }}>
            {t('createNewCourseRecordFor')} {clientName}
          </p>
        </div>

        {/* 表单内容 */}
        <LessonRecordForm
          clientId={clientId}
          clientName={clientName}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialDate={initialDate}
          initialTime={initialTime}
          packageId={packageId}
        />
      </div>
    </div>
  );
} 