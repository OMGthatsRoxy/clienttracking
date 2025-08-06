"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import React, { useRef, useLayoutEffect, useState, useEffect, useCallback, useMemo } from "react";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/types/client";
import type { Package } from "@/types/package";
import type { LessonRecord } from "@/types/lessonRecord";
import ScheduleItem from "@/components/ScheduleItem";
import type { ScheduleItem as ScheduleItemType } from "@/types/schedule";
import { 
  TIME_SLOTS, 
  TIME_SLOT_HEIGHT, 
  formatDate, 
  getDatesByViewMode, 
  getEndTime, 
  getOverlappingSchedule, 
  hasSchedule, 
  getCurrentMonthStats,
  validateTimeConflict,
  getStatusColor
} from "@/lib/scheduleUtils";
import { BookingModal, ManagementModal, ConfirmModal } from "@/components/ScheduleModals";

// 自定义Hook：移动设备检测
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, setIsMobile };
};

// 自定义Hook：页面可见性检测和自动刷新
const usePageVisibilityRefresh = (callback: () => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时，延迟执行刷新
        setTimeout(() => {
          callback();
        }, 100);
      }
    };

    const handleFocus = () => {
      // 页面获得焦点时，延迟执行刷新
      setTimeout(() => {
        callback();
      }, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [callback]);
};

// 自定义Hook：数据获取
const useScheduleData = (user: any) => {
  const [schedules, setSchedules] = useState<ScheduleItemType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [lessonRecords, setLessonRecords] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新数据的函数
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // 获取客户数据
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "clients"), where("coachId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      } catch (error) {
        console.error("获取客户数据失败:", error);
      }
    };
    fetchClients();
  }, [user, refreshKey]);

  // 获取配套数据
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "packages"), where("coachId", "==", user.uid));
    const packagesUnsubscribe = onSnapshot(q, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Package));
      setPackages(packagesData);
    }, (error) => {
      console.error("获取配套数据失败:", error);
    });

    return () => packagesUnsubscribe();
  }, [user, refreshKey]);

  // 获取课程记录数据
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "lessonRecords"), where("coachId", "==", user.uid));
    const lessonRecordsUnsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LessonRecord));
      setLessonRecords(recordsData);
    });

    return () => lessonRecordsUnsubscribe();
  }, [user, refreshKey]);

  // 获取日程表数据
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, "schedules"), where("coachId", "==", user.uid));
    const schedulesUnsubscribe = onSnapshot(q, (snapshot) => {
      const scheduleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScheduleItemType));
      
      setSchedules(scheduleData);
      setLoading(false);
    }, (error) => {
      console.error("获取日程表失败:", error);
      setLoading(false);
    });

    return () => schedulesUnsubscribe();
  }, [user, refreshKey]);

  return { schedules, clients, packages, lessonRecords, loading, refreshData };
};

export default function SchedulePage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isMobile, setIsMobile } = useMobileDetection();
  const { schedules, clients, packages, lessonRecords, loading, refreshData } = useScheduleData(user);
  // const searchParams = useSearchParams();

  // 从URL参数获取视图模式
  const getInitialViewMode = (): 'day' | 'threeDay' | 'week' | 'month' => {
    // const viewModeParam = searchParams.get('viewMode');
    // console.log('URL参数 viewMode:', viewModeParam);
    // if (viewModeParam === 'day' || viewModeParam === 'threeDay' || viewModeParam === 'week' || viewModeParam === 'month') {
    //   console.log('设置视图模式为:', viewModeParam);
    //   return viewModeParam;
    // }
    // 使用默认视图模式: threeDay
    return 'threeDay';
  };

  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'threeDay' | 'week' | 'month'>(getInitialViewMode());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [draggedSchedule, setDraggedSchedule] = useState<ScheduleItemType | null>(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<{date: string, time: string, isHalfTime?: boolean} | null>(null);
  const [pendingChange, setPendingChange] = useState<{type: 'complete' | 'cancel', deductSession?: boolean} | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editClientName, setEditClientName] = useState("");
  const [editSelectedClientId, setEditSelectedClientId] = useState("");
  const [editShowClientDropdown, setEditShowClientDropdown] = useState(false);
  const [editFilteredClients, setEditFilteredClients] = useState<Client[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 检查是否有课程记录
  const hasLessonRecord = useCallback((schedule: ScheduleItemType) => {
    return lessonRecords.some(record => 
      record.clientId === schedule.clientId &&
      record.lessonDate === schedule.date &&
      record.lessonTime === (schedule.startTime || schedule.time)
    );
  }, [lessonRecords]);

  // 获取课程记录ID
  const getLessonRecordId = useCallback((schedule: ScheduleItemType) => {
    const record = lessonRecords.find(record => 
      record.clientId === schedule.clientId &&
      record.lessonDate === schedule.date &&
      record.lessonTime === (schedule.startTime || schedule.time)
    );
    return record?.id;
  }, [lessonRecords]);

  // 网格引用
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(800);

  // 计算当前日期
  const currentDates = useMemo(() => 
    getDatesByViewMode(currentWeekOffset, viewMode), 
    [currentWeekOffset, viewMode]
  );

  // 计算当前月份统计
  const monthStats = useMemo(() => 
    getCurrentMonthStats(schedules), 
    [schedules]
  );

  // 计算当前视图课程
  const currentViewSchedules = useMemo(() => 
    schedules.filter(schedule => currentDates.includes(schedule.date)), 
    [schedules, currentDates]
  );

  // 页面可见性检测和自动刷新
  usePageVisibilityRefresh(() => {
    console.log('页面变为可见，刷新数据...');
    refreshData();
    
    // 重新计算网格尺寸
    setTimeout(() => {
      if (gridRef.current) {
        setGridWidth(gridRef.current.offsetWidth);
        setWindowWidth(window.innerWidth);
        detectScreenSize();
      }
    }, 200);
  });

  // 组件挂载时的初始化刷新
  useEffect(() => {
    console.log('组件挂载，执行初始化刷新...');
    // 延迟执行以确保DOM完全渲染
    const timer = setTimeout(() => {
      refreshData();
      if (gridRef.current) {
        setGridWidth(gridRef.current.offsetWidth);
        setWindowWidth(window.innerWidth);
        detectScreenSize();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []); // 只在组件挂载时执行一次

  // 监听URL参数变化，更新视图模式
  // useEffect(() => {
  //   const viewModeParam = searchParams.get('viewMode');
  //   console.log('URL参数变化检测 - viewMode:', viewModeParam);
  //   if (viewModeParam === 'day' || viewModeParam === 'threeDay' || viewModeParam === 'week' || viewModeParam === 'month') {
  //     console.log('更新视图模式为:', viewModeParam);
  //     setViewMode(viewModeParam);
  //   }
  // }, [searchParams]);

  // 网格尺寸监听
  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const handleResize = () => {
      setGridWidth(gridRef.current!.offsetWidth);
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    const observer = new window.ResizeObserver(handleResize);
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [viewMode]); // 添加viewMode依赖，当视图模式变化时重新计算

  // 页面加载完成后的初始化
  useEffect(() => {
    if (!loading && schedules.length > 0) {
      // 延迟执行，确保DOM完全渲染
      const timer = setTimeout(() => {
        detectScreenSize();
        if (gridRef.current) {
          setGridWidth(gridRef.current.offsetWidth);
          setWindowWidth(window.innerWidth);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [loading, schedules, viewMode]);

  // 智能屏幕检测函数
  const detectScreenSize = useCallback((mode?: 'day' | 'threeDay' | 'week' | 'month') => {
    const currentViewMode = mode || viewMode;
    const windowWidth = window.innerWidth;
    
    // 根据不同视图模式调整移动端检测逻辑
    let isMobileDevice = windowWidth < 768;
    
    // 月视图需要更多空间，调整移动端阈值
    if (currentViewMode === 'month') {
      isMobileDevice = windowWidth < 1024; // 月视图在1024px以下视为移动端
    }
    
    // 日视图可以更宽松
    if (currentViewMode === 'day') {
      isMobileDevice = windowWidth < 640; // 日视图在640px以下视为移动端
    }
    
    setWindowWidth(windowWidth);
    setIsMobile(isMobileDevice);
    
    // 重新计算网格尺寸
    if (gridRef.current) {
      setGridWidth(gridRef.current.offsetWidth);
    }
    
    console.log(`屏幕检测完成 (${currentViewMode}视图):`, {
      windowWidth,
      isMobile: isMobileDevice,
      gridWidth: gridRef.current?.offsetWidth,
      viewMode: currentViewMode
    });
  }, [viewMode]);

  // 窗口大小变化监听
  useEffect(() => {
    const handleWindowResize = () => {
      detectScreenSize();
    };
    
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [viewMode]); // 改为依赖viewMode而不是detectScreenSize

  // 视图切换时重新检测屏幕大小和网格尺寸
  const handleViewModeChange = useCallback((newViewMode: 'day' | 'threeDay' | 'week' | 'month') => {
    setViewMode(newViewMode);
    
    // 延迟执行以确保DOM更新完成
    setTimeout(() => {
      detectScreenSize(newViewMode);
    }, 100);
  }, [viewMode]); // 改为依赖viewMode

  // 事件处理函数
  const handleTimeSlotClick = useCallback((date: string, time: string, clickPosition: 'top' | 'bottom') => {
    setSelectedDate(date);
    
    if (clickPosition === 'top') {
      setSelectedTime(time);
    } else {
      const [hour] = time.split(':');
      const halfTime = `${hour}:30`;
      setSelectedTime(halfTime);
    }
    
    setIsModalOpen(true);
  }, []);

  const handleClientSelect = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedPackageId("");
    if (clientId) {
      const selectedClient = clients.find(client => client.id === clientId);
      if (selectedClient) {
        setClientName(selectedClient.name);
      }
    } else {
      setClientName("");
    }
    setShowClientDropdown(false);
  }, [clients]);

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
  }, [clients]);

  const selectClientFromDropdown = useCallback((client: Client) => {
    setClientName(client.name);
    setSelectedClientId(client.id);
    setSelectedPackageId("");
    setShowClientDropdown(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!clientName.trim() || !user) return;

    // 验证时间冲突
    if (validateTimeConflict(schedules, selectedDate, selectedTime)) {
      alert('该时间段已被占用，请选择其他时间');
      return;
    }

      try {
        const now = new Date().toISOString();
      const endTime = getEndTime(selectedTime);

        const scheduleData = {
          date: selectedDate,
        time: selectedTime,
          startTime: selectedTime,
          endTime: endTime,
          clientName: clientName.trim(),
          clientId: selectedClientId,
          packageId: selectedPackageId || undefined,
          status: 'scheduled' as const,
          originalStatus: 'scheduled' as const,
          hasBeenChanged: false,
          coachId: user.uid,
          createdAt: now,
          updatedAt: now
        };

      await addDoc(collection(db, "schedules"), scheduleData);
        
        setClientName("");
        setSelectedClientId("");
        setSelectedPackageId("");
        setIsModalOpen(false);
      } catch (error) {
        console.error("保存课程失败:", error);
        alert("保存课程失败，请重试");
      }
  }, [clientName, user, selectedDate, selectedTime, selectedClientId, selectedPackageId, schedules]);

  // 获取当前选中的课程
  const getSelectedSchedule = useCallback(() => {
    return schedules.find(item => 
      item.date === selectedDate && 
      (item.startTime === selectedTime || item.time === selectedTime)
    );
  }, [schedules, selectedDate, selectedTime]);

  // 获取客户姓名
  const getClientNameForTime = useCallback((date: string, time: string) => {
    const schedule = schedules.find(item => 
      item.date === date && 
      (item.startTime === time || item.time === time)
    );
    return schedule?.clientName || '';
  }, [schedules]);

  // 获取客户电话号码
  const getClientPhoneForTime = useCallback((date: string, time: string) => {
    const schedule = schedules.find(item => 
      item.date === date && 
      (item.startTime === time || item.time === time)
    );
    if (!schedule?.clientId) return '';
    
    const client = clients.find(c => c.id === schedule.clientId);
    return client?.phone || '';
  }, [schedules, clients]);

  // 获取客户的有效配套
  const getClientPackages = useCallback((clientId: string) => {
    return packages.filter(pkg => 
      pkg.clientId === clientId && 
      pkg.remainingSessions > 0 && 
      !pkg.isExpired
    );
  }, [packages]);

  // 拖拽事件处理
  const handleDragStart = useCallback((e: React.DragEvent, schedule: ScheduleItemType) => {
    setDraggedSchedule(schedule);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', schedule.id || '');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const isHalfTime = mouseY > rect.height / 2;
    
    setDragOverTimeSlot({ date, time, isHalfTime });
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTimeSlot(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: string, targetTime: string) => {
    e.preventDefault();
    
    if (!draggedSchedule || !draggedSchedule.id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const isHalfTime = clickY > rect.height / 2;
    
    let actualTargetTime = targetTime;
    if (isHalfTime) {
      const [hour, minute] = targetTime.split(':').map(Number);
      if (minute === 0) {
        actualTargetTime = `${hour.toString().padStart(2, '0')}:30`;
      } else {
        actualTargetTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      }
    }
    
    // 检查时间冲突
    if (validateTimeConflict(schedules, targetDate, actualTargetTime, draggedSchedule.id)) {
      alert('目标时间槽已被占用，无法移动课程');
      setDraggedSchedule(null);
      setDragOverTimeSlot(null);
      return;
    }
    
    try {
      const scheduleRef = doc(db, "schedules", draggedSchedule.id);
      await updateDoc(scheduleRef, {
        date: targetDate,
        time: actualTargetTime,
        startTime: actualTargetTime,
        endTime: getEndTime(actualTargetTime),
        updatedAt: new Date().toISOString()
      });
      
      // 如果课程已完成且有课程记录，同时更新课程记录的时间
      if (draggedSchedule.status === 'completed') {
        const relatedRecord = lessonRecords.find(record => 
          record.clientId === draggedSchedule.clientId &&
          record.lessonDate === draggedSchedule.date &&
          record.lessonTime === (draggedSchedule.startTime || draggedSchedule.time)
        );
        
        if (relatedRecord && relatedRecord.id) {
          const recordRef = doc(db, "lessonRecords", relatedRecord.id);
          await updateDoc(recordRef, {
            lessonDate: targetDate,
            lessonTime: actualTargetTime,
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      setDraggedSchedule(null);
      setDragOverTimeSlot(null);
    } catch (error) {
      console.error("Error moving schedule:", error);
      alert('移动课程失败，请重试');
    }
  }, [draggedSchedule, schedules, lessonRecords]);

  const handleDragEnd = useCallback(() => {
    setDraggedSchedule(null);
    setDragOverTimeSlot(null);
  }, []);

  // 课程管理相关处理函数
  const handleCancelCourse = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(async (deductSession: boolean) => {
    const schedule = getSelectedSchedule();
    if (!schedule || !schedule.id) return;

    try {
      if (deductSession && schedule.packageId) {
        // 扣减课时
        const packageRef = doc(db, "packages", schedule.packageId);
        
        // 直接从Firestore获取最新的配套数据
        const packageDoc = await getDoc(packageRef);
        if (packageDoc.exists()) {
          const packageData = packageDoc.data();
          if (packageData.remainingSessions > 0) {
            await updateDoc(packageRef, {
              remainingSessions: packageData.remainingSessions - 1
            });
          }
        }
      }

      // 确定取消状态
      const cancelStatus = deductSession ? 'cancelled_with_deduction' : 'cancelled';

      // 更新课程状态到Firestore
      const scheduleRef = doc(db, "schedules", schedule.id);
      await updateDoc(scheduleRef, {
        status: cancelStatus,
        updatedAt: new Date().toISOString()
      });
      
      setShowCancelConfirm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("更新课程状态失败:", error);
      alert("更新课程状态失败，请重试");
    }
  }, [getSelectedSchedule]);

  const handleCompleteCourse = useCallback(async () => {
    const schedule = getSelectedSchedule();
    if (!schedule || !schedule.id) return;

    try {
      const scheduleRef = doc(db, "schedules", schedule.id);
      
      // 课程完成时自动扣减课时
      if (schedule.packageId) {
        const packageRef = doc(db, "packages", schedule.packageId);
        
        // 直接从Firestore获取最新的配套数据
        const packageDoc = await getDoc(packageRef);
        if (packageDoc.exists()) {
          const packageData = packageDoc.data();
          if (packageData.remainingSessions > 0) {
            await updateDoc(packageRef, {
              remainingSessions: packageData.remainingSessions - 1
            });
          }
        }
      }

      await updateDoc(scheduleRef, {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("更新课程状态失败，请重试");
    }
  }, [getSelectedSchedule]);

  const handleDeleteCourse = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const schedule = getSelectedSchedule();
    if (!schedule || !schedule.id) return;

    try {
      // 从Firestore中删除课程
      const scheduleRef = doc(db, "schedules", schedule.id);
      await deleteDoc(scheduleRef);

      setShowDeleteConfirm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert('删除课程失败，请重试');
    }
  }, [getSelectedSchedule]);

  const handleEditClick = useCallback(() => {
    const schedule = getSelectedSchedule();
    if (schedule) {
      setEditClientName(schedule.clientName || "");
      setEditSelectedClientId(schedule.clientId || "");
      setIsEditMode(true);
    }
  }, [getSelectedSchedule]);

  const handleEditConfirm = useCallback(async () => {
    if (!editSelectedClientId) {
      alert('请选择一个客户');
      return;
    }

    const schedule = getSelectedSchedule();
    if (!schedule || !schedule.id) return;

    try {
      const selectedClient = clients.find(c => c.id === editSelectedClientId);
      if (!selectedClient) return;

      const scheduleRef = doc(db, "schedules", schedule.id);
      await updateDoc(scheduleRef, {
        clientId: editSelectedClientId,
        clientName: selectedClient.name,
        updatedAt: new Date().toISOString()
      });

      setIsEditMode(false);
      setEditClientName("");
      setEditSelectedClientId("");
      setEditShowClientDropdown(false);
    } catch (error) {
      console.error("Error updating client:", error);
      alert('更新客户失败，请重试');
    }
  }, [editSelectedClientId, getSelectedSchedule, clients]);

  const handleEditCancel = useCallback(() => {
    setIsEditMode(false);
    setEditClientName("");
    setEditSelectedClientId("");
    setEditShowClientDropdown(false);
  }, []);

  const handleCourseRecord = useCallback(() => {
    // 课程记录创建成功后的回调
    // 这里可以添加刷新数据的逻辑
    console.log('课程记录创建成功');
    // 可以在这里添加提示信息或其他逻辑
  }, []);

  const handleViewRecord = useCallback(() => {
    const selectedSchedule = getSelectedSchedule();
    if (selectedSchedule) {
      const recordId = getLessonRecordId(selectedSchedule);
      if (recordId) {
        // 直接在当前页面打开课程记录详情模态框
        // 这里可以通过状态管理或回调函数来处理
        // 暂时保持原有功能，后续可以通过模态框实现
        const recordDetailUrl = `/lesson-records/${recordId}`;
        window.open(recordDetailUrl, '_blank');
      }
    }
  }, [getSelectedSchedule, getLessonRecordId]);

  // 加载状态
  if (!user) {
    return (
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b"
      }}>
        <div style={{ color: '#a1a1aa' }}>请先登录</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-content" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b"
      }}>
        <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>
      </main>
    );
  }

  return (
    <main className="page-content" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      background: "#18181b",
      padding: isMobile ? "4px" : "16px",
      paddingTop: isMobile ? 15 : 40,
      paddingBottom: isMobile ? 120 : 80 // 桌面端减少底部内边距，适应降低的导航栏高度
    }}>
              {/* 标题卡片 */}
        <div style={{
          maxWidth: 1200,
          width: "100%",
          marginBottom: isMobile ? 16 : 32,
          background: "#23232a",
          borderRadius: 12,
          padding: isMobile ? "16px" : "20px",
          border: "1px solid #333",
          textAlign: "center"
        }}>
          <h1 style={{ 
            fontSize: isMobile ? "clamp(24px, 6vw, 36px)" : "36px",
            fontWeight: 700, 
            color: "#fff",
            marginBottom: isMobile ? 4 : 8
          }}>{t('sessionSchedule')}</h1>
          <p style={{ 
            color: "#a1a1aa",
            fontSize: isMobile ? "clamp(12px, 3vw, 14px)" : "16px"
          }}>{t('sessionScheduling')}</p>
          
          {/* 统计信息 */}
          <div style={{ 
            marginTop: 8, 
            padding: "8px 12px", 
            background: "#18181b", 
            borderRadius: 6,
            fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
          }}>
            <div style={{ color: "#a1a1aa", marginBottom: 4 }}>
              {t('monthlyCompletedCourses')}: {monthStats.completed}
            </div>
          </div>
        </div>

      {/* 日程表主体 */}
      <div className="form-card" style={{ 
        maxWidth: viewMode === 'day' ? 500 : viewMode === 'threeDay' ? 600 : 1200, 
        width: '100%',
        padding: isMobile ? "12px" : "20px",
        marginBottom: isMobile ? 20 : 40
      }}>
        {/* 视图模式选择器 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: isMobile ? 16 : 24,
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: isMobile ? 12 : 0
        }}>
          <h2 style={{ 
            color: "#fff", 
            fontSize: isMobile ? "clamp(16px, 3vw, 20px)" : "24px", 
            fontWeight: 600,
            margin: 0
          }}>
            {viewMode === 'day' ? t('dayView') : viewMode === 'threeDay' ? t('threeDayView') : viewMode === 'week' ? t('weeklySchedule') : t('monthView')}
          </h2>
          
          {/* 视图模式按钮 */}
          <div style={{ 
            display: "flex", 
            gap: isMobile ? 4 : 8,
            marginBottom: isMobile ? 12 : 0
          }}>
            {(['day', 'threeDay', 'week', 'month'] as const).map(mode => (
            <button 
                key={mode}
                onClick={() => handleViewModeChange(mode)}
              style={{ 
                  background: viewMode === mode ? '#60a5fa' : '#23232a', 
                  color: viewMode === mode ? '#18181b' : '#a1a1aa', 
                  border: viewMode === mode ? 'none' : '1px solid #333', 
                borderRadius: 6, 
                padding: isMobile ? '4px 8px' : '6px 12px',
                cursor: 'pointer', 
                fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px",
                  fontWeight: viewMode === mode ? 600 : 400
              }}
            >
                {mode === 'day' ? t('oneDay') : mode === 'threeDay' ? t('threeDays') : mode === 'week' ? t('week') : t('month')}
            </button>
            ))}
          </div>
        </div>

        {/* 导航按钮 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          marginBottom: isMobile ? 16 : 24,
          gap: isMobile ? 6 : 12
        }}>
          <button 
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            style={{ 
              background: '#23232a', 
              color: '#60a5fa', 
              border: '1px solid #60a5fa', 
              borderRadius: 6, 
              padding: isMobile ? '4px 8px' : '6px 12px',
              cursor: 'pointer', 
              fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
            }}
          >
            {viewMode === 'day' ? t('previousDay') : viewMode === 'threeDay' ? t('previousThreeDays') : viewMode === 'week' ? t('previousWeek') : t('previousMonth')}
          </button>
          <button 
            onClick={() => setCurrentWeekOffset(0)}
            style={{ 
              background: '#60a5fa', 
              color: '#18181b', 
              border: 'none', 
              borderRadius: 6, 
              padding: isMobile ? '4px 8px' : '6px 12px',
              cursor: 'pointer', 
              fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
            }}
          >
            {viewMode === 'day' ? t('today') : viewMode === 'threeDay' ? t('today') : viewMode === 'week' ? t('thisWeek') : t('thisMonth')}
          </button>
          <button 
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            style={{ 
              background: '#23232a', 
              color: '#60a5fa', 
              border: '1px solid #60a5fa', 
              borderRadius: 6, 
              padding: isMobile ? '4px 8px' : '6px 12px',
              cursor: 'pointer', 
              fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px"
            }}
          >
            {viewMode === 'day' ? t('nextDay') : viewMode === 'threeDay' ? t('nextThreeDays') : viewMode === 'week' ? t('nextWeek') : t('nextMonth')}
          </button>
        </div>

        {/* 日程表网格 */}
        <div ref={gridRef} style={{ overflowX: 'hidden', overflowY: 'auto', position: 'relative' }}>
          {viewMode === 'month' ? (
            // 月视图 - 日历网格布局
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              width: '100%',
              maxWidth: '100%',
              gap: '1px',
              backgroundColor: '#333',
              minWidth: 0
            }}>
              {/* 星期标题 */}
              {[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')].map(day => (
                <div key={day} style={{ 
                  height: isMobile ? 'clamp(30px, 8vw, 40px)' : 'clamp(40px, 6vw, 50px)',
                  backgroundColor: '#23232a', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  fontWeight: 600,
                  fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "clamp(10px, 1.2vw, 14px)"
                }}>
                  {day}
                </div>
              ))}
              
              {/* 日期格子 */}
              {currentDates.map((date: string) => {
                const dateInfo = formatDate(date, language);
                const daySchedules = schedules
                  .filter(schedule => schedule.date === date)
                  .sort((a, b) => {
                    const timeA = a.startTime || a.time;
                    const timeB = b.startTime || b.time;
                    return timeA.localeCompare(timeB);
                  });
                const isCurrentMonth = new Date(date).getMonth() === new Date().getMonth();
                
                return (
                  <div
                    key={date}
                    style={{
                      height: 'auto',
                      minHeight: isMobile ? '80px' : '120px',
                      backgroundColor: isCurrentMonth ? '#18181b' : '#23232a',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      padding: isMobile ? '2px' : '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative' as const,
                      opacity: isCurrentMonth ? 1 : 0.6,
                      minWidth: 0,
                      overflow: 'hidden'
                    }}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime('09:00');
                      setIsModalOpen(true);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isCurrentMonth ? '#23232a' : '#333';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isCurrentMonth ? '#18181b' : '#23232a';
                    }}
                  >
                    {/* 日期显示 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isMobile ? '2px' : '4px',
                      flexShrink: 0,
                      minWidth: 0
                    }}>
                      <span style={{
                        color: dateInfo.isToday ? '#60a5fa' : '#a1a1aa',
                        fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "clamp(10px, 1.2vw, 14px)",
                        fontWeight: dateInfo.isToday ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0
                      }}>
                        {dateInfo.display}
                      </span>
                      {daySchedules.length > 0 && (
                        <span style={{
                          backgroundColor: '#60a5fa',
                          color: '#18181b',
                          fontSize: isMobile ? "clamp(6px, 1.5vw, 8px)" : "clamp(8px, 1vw, 10px)",
                          padding: isMobile ? '1px 2px' : '2px 4px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          {daySchedules.length}
                        </span>
                      )}
                    </div>
                    
                    {/* 课程列表 */}
                    <div style={{ 
                      flex: 1, 
                      overflow: 'visible',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? '1px' : '2px',
                      minWidth: 0
                    }}>
                      {daySchedules.map((schedule, index) => {
                        // 检查是否有课程记录
                        const hasRecord = hasLessonRecord(schedule);
                        // 如果有课程记录，使用绿色主题，否则使用状态颜色
                        const colors = hasRecord 
                          ? { bg: '#10b981', color: '#ffffff' } 
                          : getStatusColor(schedule.status);
                        
                        return (
                          <div
                            key={schedule.id}
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.color,
                              fontSize: isMobile ? "clamp(6px, 1.5vw, 8px)" : "clamp(8px, 1vw, 10px)",
                              padding: isMobile ? '1px 2px' : '2px 4px',
                              marginBottom: 0,
                              borderRadius: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer',
                              lineHeight: '1.2',
                              flexShrink: 0,
                            minWidth: 0
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(date);
                            setSelectedTime(schedule.startTime || schedule.time);
                            setIsModalOpen(true);
                          }}
                        >
                          {schedule.startTime || schedule.time} {schedule.clientName}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 其他视图 - 时间网格布局
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `${isMobile ? 60 : 80}px repeat(${currentDates.length}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0
            }}>
            {/* 时间列标题 */}
            <div style={{ 
              height: isMobile ? 50 : 60,
              backgroundColor: '#23232a', 
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a1a1aa',
              fontWeight: 600,
              fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px",
              minWidth: 0,
              overflow: 'hidden'
            }}>
              {t('time')}
            </div>
            
            {/* 日期列标题 */}
            {currentDates.map((date: string) => {
              const dateInfo = formatDate(date, language);
              return (
                <div key={date} style={{ 
                  height: isMobile ? 50 : 60,
                  backgroundColor: dateInfo.isToday ? '#60a5fa' : '#23232a',
                  border: '1px solid #333',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: dateInfo.isToday ? '#18181b' : '#a1a1aa',
                  fontWeight: 600,
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "12px",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{dateInfo.dayName}</div>
                  <div style={{ 
                    fontSize: isMobile ? "clamp(10px, 2.5vw, 12px)" : "14px",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{dateInfo.display}</div>
                </div>
              );
            })}

            {/* 时间格子 */}
            {TIME_SLOTS.map((time) => (
              <div key={time} style={{ display: 'contents' }}>
                {/* 时间标签 */}
                <div style={{
                  height: isMobile ? 50 : 60,
                  backgroundColor: '#23232a',
                  border: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  fontSize: isMobile ? "clamp(8px, 2vw, 10px)" : "12px",
                  fontWeight: 500,
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  {time}
                </div>
                
                {/* 每天的日程格子 */}
                {currentDates.map((date: string) => {
                  const hasScheduleInSlot = hasSchedule(schedules, date, time);
                  const schedule = schedules.find(item => 
                    item.date === date && 
                    (item.startTime === time || item.time === time)
                  );
                  
                  return (
                    <div
                      key={`${date}-${time}`}
                      style={{
                        height: isMobile ? 50 : 60,
                        border: '1px solid #333',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative' as const,
                        backgroundColor: 'transparent',
                        minWidth: 0,
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (!draggedSchedule && !schedule) {
                          e.currentTarget.style.backgroundColor = '#23232a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!draggedSchedule && !schedule) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOver(e, date, time);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(e, date, time);
                      }}
                      onClick={(e) => {
                        if (!draggedSchedule) {
                          if (schedule) {
                            setSelectedDate(date);
                            setSelectedTime(schedule.startTime || schedule.time);
                            setIsModalOpen(true);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickY = e.clientY - rect.top;
                            const clickPosition = clickY < rect.height / 2 ? 'top' : 'bottom';
                            handleTimeSlotClick(date, time, clickPosition);
                          }
                        }
                      }}
                    >
                      {/* 拖拽悬停高亮指示器 */}
                      {dragOverTimeSlot?.date === date && dragOverTimeSlot?.time === time && (
                      <div style={{
                        position: 'absolute',
                          top: dragOverTimeSlot.isHalfTime ? '50%' : '0',
                          left: 0,
                          right: 0,
                          height: '50%',
                          backgroundColor: '#60a5fa',
                          opacity: 0.3,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }} />
                      )}
                      
                      {/* 课程卡片 */}
                      {schedule && (
                        <ScheduleItem
                          key={`${date}-${schedule.id}`}
                          schedule={schedule}
                          isMobile={isMobile}
                          hasLessonRecord={hasLessonRecord(schedule)}
                          onClick={(e) => {
                            e?.stopPropagation();
                            setSelectedDate(date);
                            setSelectedTime(schedule.startTime || schedule.time);
                            setIsModalOpen(true);
                          }}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedSchedule?.id === schedule.id}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
                          ))}
            </div>
          )}
          
          {/* 半点课程覆盖层 */}
          {viewMode !== 'month' && currentDates.map((date: string, dateIndex: number) => {
            const dateSchedules = schedules.filter(schedule => schedule.date === date);
            const halfTimeSchedules = dateSchedules.filter(schedule => {
              const startTime = schedule.startTime || schedule.time;
              const [hour, minute] = startTime.split(':').map(Number);
              return minute === 30;
            });
            
            const timeColumnWidth = isMobile ? 60 : 80;
            const gridContainer = gridRef.current;
            const gridWidth = gridContainer ? gridContainer.offsetWidth : 0;
            const dateColumnWidth = gridWidth > 0 ? (gridWidth - timeColumnWidth) / currentDates.length : 0;
            const leftPosition = timeColumnWidth + dateIndex * dateColumnWidth;
            
            return (
              <div
                key={`half-time-schedules-${date}-${windowWidth}`}
                style={{
                  position: 'absolute',
                  top: isMobile ? 50 : 60,
                  left: leftPosition,
                  width: dateColumnWidth,
                  height: `${TIME_SLOTS.length * (isMobile ? 50 : 60)}px`,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                {halfTimeSchedules.map((schedule, index) => (
                  <ScheduleItem
                    key={`${date}-${schedule.id}-${index}`}
                    schedule={schedule}
                    isMobile={isMobile}
                    isHalfTime={true}
                    hasLessonRecord={hasLessonRecord(schedule)}
                    onClick={(e) => {
                      e?.stopPropagation();
                      setSelectedDate(date);
                      setSelectedTime(schedule.startTime || schedule.time);
                      setIsModalOpen(true);
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedSchedule?.id === schedule.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 预约课程Modal */}
      <BookingModal
        isOpen={isModalOpen && !getSelectedSchedule()}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        clientName={clientName}
        setClientName={setClientName}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        selectedPackageId={selectedPackageId}
        setSelectedPackageId={setSelectedPackageId}
        clients={clients}
        packages={packages}
        schedules={schedules}
        onConfirm={handleConfirm}
        onCancel={() => {
                      setIsModalOpen(false);
                      setClientName("");
                      setSelectedClientId("");
                      setSelectedPackageId("");
                    }}
        onComplete={handleCompleteCourse}
        onDelete={handleDeleteCourse}
        onEdit={handleEditClick}
        isMobile={isMobile}
        t={(key: string) => t(key as any)}
        language={language}
      />

      {/* 课程管理Modal */}
      <ManagementModal
        isOpen={isModalOpen && !!getSelectedSchedule()}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        schedule={getSelectedSchedule()}
        clients={clients}
        lessonRecords={lessonRecords}
        onCancel={handleCancelCourse}
        onComplete={handleCompleteCourse}
        onDelete={handleDeleteCourse}
        onEdit={handleEditClick}
        onCreateRecord={handleCourseRecord}
        onViewRecord={handleViewRecord}
        isMobile={isMobile}
        t={(key: string) => t(key as any)}
        language={language}
      />

      {/* 取消课程确认Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="确认取消课程"
        message="是否要扣减客户课时？选择'是'将扣减1次课时，选择'否'将保持课时不变。"
        onConfirm={() => handleCancelConfirm(true)}
        confirmText="是（扣课时）"
        cancelText="否（不扣课时）"
        confirmColor="#dc2626"
        isMobile={isMobile}
      />

      {/* 删除课程确认Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除课程"
        message="确定要删除此课程吗？此操作将无法撤销。"
        onConfirm={handleDeleteConfirm}
        confirmText="确认删除"
        cancelText="取消"
        confirmColor="#dc2626"
        isMobile={isMobile}
      />
    </main>
  );
} 