"use client";
import { useState } from "react";
import { useLanguage } from "@/features/language/LanguageProvider";
import LessonRecordForm from "@/features/lessonRecords/LessonRecordForm";
import Modal from "./ui/Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      isMobile={isMobile}
      maxWidth="800px"
      showCloseButton={true}
    >
      <div style={{
        padding: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}>

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
    </Modal>
  );
} 