"use client";

import React, { useState, useCallback } from 'react';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import type { Client } from '@/types/client';
import type { Package } from '@/types/package';
import type { LessonRecord } from '@/types/lessonRecord';
import { formatDate, getEndTime } from '@/lib/scheduleUtils';
import LessonRecordModal from './LessonRecordModal';
import NewLessonRecordModal from './NewLessonRecordModal';
import Modal from './ui/Modal';

interface ScheduleModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  setClientName: (name: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedPackageId: string;
  setSelectedPackageId: (id: string) => void;
  clients: Client[];
  packages: Package[];
  schedules: ScheduleItemType[];
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isMobile: boolean;
  t: (key: string) => string;
  language: string;
}

// 客户选择下拉组件
const ClientDropdown: React.FC<{
  clients: Client[];
  filteredClients: Client[];
  showDropdown: boolean;
  onSelect: (client: Client) => void;
  isMobile: boolean;
}> = ({ clients, filteredClients, showDropdown, onSelect, isMobile }) => {
  if (!showDropdown || filteredClients.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: '#23232a',
      borderRadius: '8px',
      border: '1px solid #333',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      zIndex: 1000,
      maxHeight: '150px',
      overflowY: 'auto',
      marginTop: '4px'
    }}>
      {filteredClients.map(client => (
        <div
          key={client.id}
          style={{
            padding: isMobile ? '8px 12px' : '10px 16px',
            cursor: 'pointer',
            color: '#f4f4f5',
            fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px",
            borderBottom: '1px solid #333',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => onSelect(client)}
        >
          {client.name} - {client.phone}
        </div>
      ))}
    </div>
  );
};

// 预约课程Modal
const BookingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  setClientName: (name: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedPackageId: string;
  setSelectedPackageId: (id: string) => void;
  clients: Client[];
  packages: Package[];
  schedules: ScheduleItemType[];
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isMobile: boolean;
  t: (key: string) => string;
  language: string;
}> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime, 
  clientName, 
  setClientName, 
  selectedClientId, 
  setSelectedClientId, 
  selectedPackageId, 
  setSelectedPackageId, 
  clients, 
  packages, 
  schedules,
  onConfirm, 
  onCancel, 
  onComplete,
  onDelete,
  onEdit,
  isMobile, 
  t, 
  language 
}) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  const handleClientNameChange = useCallback((value: string) => {
    setClientName(value);
    setSelectedClientId("");
    
    if (value.trim()) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientDropdown(true);
    } else {
      setFilteredClients(clients);
      setShowClientDropdown(true);
    }
  }, [clients, setClientName, setSelectedClientId]);

  const selectClientFromDropdown = useCallback((client: Client) => {
    setClientName(client.name);
    setSelectedClientId(client.id);
    setSelectedPackageId("");
    setShowClientDropdown(false);
  }, [setClientName, setSelectedClientId, setSelectedPackageId]);

  const getClientPackages = useCallback((clientId: string) => {
    return packages.filter(pkg => 
      pkg.clientId === clientId && 
      pkg.remainingSessions > 0 && 
      !pkg.isExpired
    );
  }, [packages]);

  if (!isOpen) return null;

  const dateInfo = formatDate(selectedDate, language);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isMobile={isMobile}
      maxWidth="400px"
      showCloseButton={false}
    >
      <div className="form-card" style={{ 
        padding: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}>
        <h3 style={{ 
          color: "#fff", 
          marginBottom: 16,
          fontSize: isMobile ? "clamp(16px, 3vw, 18px)" : "20px"
        }}>
          {t('bookCourse')} - {dateInfo.display} {selectedTime} ({t('oneHour')})
        </h3>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            color: '#a1a1aa',
            fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
          }} htmlFor="clientSelect">
            {t('clientName')} ({t('selectOrEnter')})
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="clientSelect"
                type="text"
                value={clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                placeholder={t('enterClientName')}
                autoFocus
                style={{
                  flex: 1,
                  padding: isMobile ? '0.5rem 0.8rem' : '0.7rem 1rem',
                  border: 'none',
                  borderRadius: 8,
                  background: '#18181b',
                  color: '#f4f4f5',
                  outline: '1.5px solid #333',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (showClientDropdown) {
                    setShowClientDropdown(false);
                  } else {
                    setFilteredClients(clients);
                    setShowClientDropdown(true);
                  }
                }}
                style={{
                  padding: isMobile ? '0.5rem 0.8rem' : '0.7rem 1rem',
                  background: '#60a5fa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px'
                }}
                title="选择客户"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </div>
            <ClientDropdown
              clients={clients}
              filteredClients={filteredClients}
              showDropdown={showClientDropdown}
              onSelect={selectClientFromDropdown}
              isMobile={isMobile}
            />
          </div>
        </div>

        {selectedClientId && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              color: '#a1a1aa',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }} htmlFor="packageSelect">
              {t('selectPackage')} ({t('optional')})
            </label>
            <select
              id="packageSelect"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.5rem 0.8rem' : '0.7rem 1rem',
                marginBottom: isMobile ? '0.8rem' : '1rem',
                border: 'none',
                borderRadius: 8,
                background: '#18181b',
                color: '#f4f4f5',
                outline: '1.5px solid #333',
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
              }}
            >
              <option value="">{t('doNotUsePackage')}</option>
              {getClientPackages(selectedClientId).map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {t('remaining')} {pkg.remainingSessions} {t('sessions')} - {pkg.notes || t('noRemarks')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: isMobile ? 8 : 12,
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              color: '#a1a1aa',
              backgroundColor: '#23232a',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              backgroundColor: '#60a5fa',
              color: '#18181b',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}
          >
            {t('confirmBooking')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// 课程管理Modal
const ManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
  schedule: ScheduleItemType | undefined;
  clients: Client[];
  lessonRecords: LessonRecord[];
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCreateRecord: () => void;
  onViewRecord: () => void;
  isMobile: boolean;
  t: (key: string) => string;
  language: string;
}> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime, 
  schedule, 
  clients, 
  lessonRecords,
  onCancel, 
  onComplete, 
  onDelete, 
  onEdit, 
  onCreateRecord,
  onViewRecord,
  isMobile, 
  t, 
  language 
}) => {
  const [showLessonRecordModal, setShowLessonRecordModal] = useState(false);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  if (!isOpen || !schedule) return null;

  const dateInfo = formatDate(selectedDate, language);
  const client = clients.find(c => c.id === schedule.clientId);
  
  // 检查是否有课程记录并获取记录ID
  const record = lessonRecords.find(record => 
    record.clientId === schedule.clientId &&
    record.lessonDate === schedule.date &&
    record.lessonTime === (schedule.startTime || schedule.time)
  );
  const hasRecord = !!record;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isMobile={isMobile}
        maxWidth="400px"
        showCloseButton={false}
      >
        <div className="form-card" style={{ 
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none'
        }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h3 style={{ 
            color: "#fff", 
            fontSize: isMobile ? "clamp(16px, 3vw, 18px)" : "20px",
            margin: 0
          }}>
            {t('courseDetails')} - {dateInfo.display} {selectedTime}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onDelete}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="删除课程"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div style={{
          background: '#23232a',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={{ 
              color: '#fff', 
              fontSize: isMobile ? "clamp(14px, 3vw, 16px)" : "18px",
              fontWeight: 600
            }}>
              {schedule.clientName}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span style={{ 
              color: '#a1a1aa', 
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}>
              {client?.phone || ''}
            </span>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 12
        }}>
          {schedule.status === 'cancelled' || schedule.status === 'cancelled_with_deduction' ? (
            <>
              <button
                onClick={onDelete}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '16px 16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
                }}
              >
                {t('deleteCourse')}
              </button>
            </>
          ) : hasRecord ? (
            // 有课程记录时，显示课程已完成和查看记录按钮
            <>
              <button
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '16px 16px',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
                }}
              >
                {t('courseCompleted')}
              </button>
                          <button
              onClick={() => {
                if (record?.id) {
                  setSelectedRecordId(record.id);
                  setShowLessonRecordModal(true);
                }
              }}
              style={{
                width: '100%',
                padding: isMobile ? '14px 12px' : '16px 16px',
                backgroundColor: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
              }}
            >
              {t('viewRecord')}
            </button>
            </>
          ) : (
            // 没有课程记录时，显示取消课程和新建记录按钮
            <>
              <button
                onClick={onCancel}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '16px 16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
                }}
              >
                {t('cancelCourse')}
              </button>
              <button
                onClick={() => setShowNewRecordModal(true)}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '16px 16px',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
                }}
              >
                {t('createNewRecord')}
              </button>
            </>
          )}
        </div>



        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              color: '#a1a1aa',
              backgroundColor: '#23232a',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </Modal>
    
    {/* 新建课程记录Modal */}
    <NewLessonRecordModal
      isOpen={showNewRecordModal}
      onClose={() => setShowNewRecordModal(false)}
      clientId={schedule.clientId}
      clientName={schedule.clientName}
      initialDate={schedule.date}
      initialTime={schedule.startTime || schedule.time}
      packageId={schedule.packageId}
      isMobile={isMobile}
      onSuccess={(recordId) => {
        setShowNewRecordModal(false);
        if (onCreateRecord) {
          onCreateRecord();
        }
      }}
    />
    
    {/* 查看课程记录Modal */}
    <LessonRecordModal
      isOpen={showLessonRecordModal}
      onClose={() => setShowLessonRecordModal(false)}
      recordId={selectedRecordId}
      isMobile={isMobile}
    />
    </>
  );
};

// 确认Modal
const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
  confirmColor?: string;
  isMobile: boolean;
}> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  confirmText, 
  cancelText, 
  confirmColor = '#dc2626', 
  isMobile 
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isMobile={isMobile}
      maxWidth="400px"
      showCloseButton={false}
    >
      <div className="form-card" style={{ 
        padding: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}>
        <h3 style={{ 
          color: "#fff", 
          marginBottom: 16,
          fontSize: isMobile ? "clamp(16px, 3vw, 18px)" : "20px"
        }}>{title}</h3>
        <p style={{ 
          color: '#a1a1aa', 
          marginBottom: 16,
          fontSize: isMobile ? "clamp(12px, 3vw, 14px)" : "16px"
        }}>{message}</p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: isMobile ? 8 : 12,
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: isMobile ? '10px 12px' : '12px 16px',
              backgroundColor: '#23232a',
              color: '#a1a1aa',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: isMobile ? '10px 12px' : '12px 16px',
              backgroundColor: confirmColor,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "16px"
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { BookingModal, ManagementModal, ConfirmModal, LessonRecordModal, NewLessonRecordModal }; 