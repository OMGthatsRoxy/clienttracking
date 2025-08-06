"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useState, useEffect } from "react";
import { collection, query, where, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Client } from "@/types/client";
import type { Package } from "@/types/package";
import type { ScheduleItem } from "@/types/schedule";
import type { Coach } from "@/types/coach";
import ImageUpload from "@/features/upload/ImageUpload";
import Link from "next/link";
import LogoutButton from "@/features/auth/LogoutButton";
// import { useSearchParams } from "next/navigation";

// 获取今日日期（使用本地时区）
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  // const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    bio: '',
    specialties: [] as string[],
    experience: 0,
    certifications: [] as string[],
    education: '',
    location: '',
    languages: [] as string[],
    isPublic: false,
    avatar: ''
  });
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'exercises' | 'packages' | 'settings'>('profile');
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; category: string; color: string } | null>(null);
  
  // 动作管理相关状态
  const [customExercises, setCustomExercises] = useState<{ [key: string]: string[] }>({});
  const [firebaseCustomExercises, setFirebaseCustomExercises] = useState<Array<{id: string, name: string, category: string}>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  
  // 设置相关状态
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsMessageType, setSettingsMessageType] = useState<"success" | "error">("success");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // 删除确认弹窗相关状态
  const [deleteConfirmExercise, setDeleteConfirmExercise] = useState<any | null>(null);

  // 加载所有动作（包括预设和自定义）
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  // 预设动作数据 - 每个部位10个标准动作
  const presetExercises = {
    chest: [
      '卧推', '俯卧撑', '哑铃飞鸟', '上斜卧推', '下斜卧推',
      '器械夹胸', '绳索夹胸', '窄距俯卧撑', '宽距俯卧撑', '钻石俯卧撑'
    ],
    back: [
      '引体向上', '划船', '硬拉', '高位下拉', '坐姿划船',
      '单臂划船', 'T杠划船', '直臂下拉', '反向飞鸟', '面拉'
    ],
    shoulders: [
      '肩推', '侧平举', '前平举', '俯身飞鸟', '阿诺德推举',
      '直立划船', '面拉', '反向飞鸟', '耸肩', '器械肩推'
    ],
    arms: [
      '弯举', '三头下压', '锤式弯举', '窄距卧推', '绳索弯举',
      '仰卧臂屈伸', '牧师凳弯举', '绳索下压', '集中弯举', '双杠臂屈伸'
    ],
    glutes: [
      '深蹲', '臀桥', '硬拉', '箭步蹲', '保加利亚分腿蹲',
      '臀推', '侧踢', '后踢', '蚌式开合', '单腿臀桥'
    ],
    legs: [
      '深蹲', '硬拉', '腿举', '腿屈伸', '腿弯举',
      '箭步蹲', '保加利亚分腿蹲', '腿外展', '腿内收', '小腿提踵'
    ],
    fullbody: [
      '波比跳', '壶铃摆动', '土耳其起立', '深蹲推举', '箭步蹲推举',
      '俯卧撑深蹲', '平板支撑', '登山者', '开合跳', '高抬腿'
    ]
  };

  // 初始化预设动作到Firebase
  const initializePresetExercises = async () => {
    if (!user) return;
    
    try {
      const { addDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      
      // 检查是否已经初始化过
      const existingQuery = query(
        collection(db, "exercises"),
        where("coachId", "==", user.uid),
        where("isPreset", "==", true)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.empty) {
        console.log("开始初始化预设动作...");
        
        // 初始化预设动作
        const exercisesToAdd: Array<{
          coachId: string;
          name: string;
          category: string;
          isPreset: boolean;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        }> = [];
        
        Object.entries(presetExercises).forEach(([category, exercises]) => {
          console.log(`准备添加 ${category} 部位的 ${exercises.length} 个动作`);
          exercises.forEach(exerciseName => {
            exercisesToAdd.push({
              coachId: user.uid,
              name: exerciseName,
              category: category,
              isPreset: true,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        });
        
        // 批量添加预设动作
        for (const exercise of exercisesToAdd) {
          await addDoc(collection(db, "exercises"), exercise);
        }
        
        console.log("✅ 预设动作初始化完成");
        console.log(`📊 各部位动作数量统计：`);
        Object.entries(presetExercises).forEach(([category, exercises]) => {
          console.log(`   ${category}: ${exercises.length} 个动作`);
        });
        console.log(`📈 总计添加: ${exercisesToAdd.length} 个预设动作`);
      } else {
        console.log(`✅ 预设动作已存在，当前有 ${existingSnapshot.docs.length} 个预设动作`);
      }
    } catch (error) {
      console.error("❌ 初始化预设动作失败:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadAllExercises = async () => {
      setExercisesLoading(true);
      try {
        // 先初始化预设动作
        await initializePresetExercises();
        
        // 然后加载所有动作
        const { query, where, onSnapshot, collection } = await import("firebase/firestore");
        const exercisesQuery = query(
          collection(db, "exercises"),
          where("coachId", "==", user.uid),
          where("isActive", "==", true)
        );
        
        const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
          const exercises = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllExercises(exercises);
          setExercisesLoading(false);
        }, (error) => {
          console.error("获取动作失败:", error);
          setExercisesLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("加载动作失败:", error);
        setExercisesLoading(false);
      }
    };

    loadAllExercises();
  }, [user]);

  // 删除动作（统一处理预设和自定义动作）
  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (!user) return;

    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "exercises", exerciseId));
      console.log("动作删除成功:", exerciseName);
    } catch (error) {
      console.error("删除动作失败:", error);
      alert("删除动作失败");
    }
  };

  // 获取当前分类的动作
  const getCurrentCategoryExercises = () => {
    if (!selectedCategory) return [];
    
    const category = selectedCategory.category;
    const categoryExercises = allExercises.filter(ex => ex.category === category);
    
    // 根据搜索词过滤
    let filteredExercises = categoryExercises;
    if (searchTerm.trim()) {
      filteredExercises = categoryExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 按创建时间倒序排列（最新的在最上面）
    return filteredExercises.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 处理URL参数，设置初始标签页
  // useEffect(() => {
  //   const tab = searchParams.get('tab');
  //   if (tab === 'settings') {
  //     setActiveTab('settings');
  //   }
  // }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    
    const fetchCoachData = async () => {
      setLoading(true);
      try {
        // 获取教练信息
        const coachDoc = await getDoc(doc(db, "coaches", user.uid));
        if (coachDoc.exists()) {
          const coachData = { id: coachDoc.id, ...coachDoc.data() } as Coach;
          setCoach(coachData);
          setEditForm({
            displayName: coachData.displayName || '',
            phone: coachData.phone || '',
            bio: coachData.bio || '',
            specialties: coachData.specialties || [],
            experience: coachData.experience || 0,
            certifications: coachData.certifications || [],
            education: coachData.education || '',
            location: coachData.location || '',
            languages: coachData.languages || [],
            isPublic: coachData.isPublic || false,
            avatar: coachData.avatar || ''
          });
        } else {
          // 创建默认教练信息
          const defaultCoach: Coach = {
            id: user.uid,
            email: user.email || '',
            displayName: user.email?.split('@')[0] || '教练',
            phone: '',
            bio: '',
            specialties: [],
            experience: 0,
            certifications: [],
            education: '',
            location: '',
            languages: ['zh'],
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, "coaches", user.uid), defaultCoach);
          setCoach(defaultCoach);
          setEditForm({
            displayName: defaultCoach.displayName,
            phone: defaultCoach.phone || '',
            bio: defaultCoach.bio || '',
            specialties: defaultCoach.specialties,
            experience: defaultCoach.experience,
            certifications: defaultCoach.certifications,
            education: defaultCoach.education || '',
            location: defaultCoach.location || '',
            languages: defaultCoach.languages,
            isPublic: defaultCoach.isPublic,
            avatar: defaultCoach.avatar || ''
          });
        }
      } catch (error) {
        console.error("获取教练信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();

    // 实时监听客户数据
    const clientsQuery = query(collection(db, "clients"), where("coachId", "==", user.uid));
    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    });

    // 实时监听配套数据 - 只获取当前教练的配套
    const packagesQuery = query(collection(db, "packages"), where("coachId", "==", user.uid));
    const packagesUnsubscribe = onSnapshot(packagesQuery, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
    });

    // 实时监听日程表数据
    const schedulesQuery = query(collection(db, "schedules"), where("coachId", "==", user.uid));
    const schedulesUnsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScheduleItem));
      setSchedules(schedulesData);
    });

    // 加载自定义动作
    if (user) {
      const loadCustomExercises = async () => {
        try {
          const exercisesQuery = query(
            collection(db, "customExercises"),
            where("coachId", "==", user.uid),
            where("isActive", "==", true)
          );
          const snapshot = await getDocs(exercisesQuery);
          const exercises = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || '',
            category: doc.data().category || ''
          }));
          setFirebaseCustomExercises(exercises);
        } catch (error) {
          console.error("获取自定义动作失败:", error);
        }
      };
      loadCustomExercises();
    }

    // 清理监听器
    return () => {
      clientsUnsubscribe();
      packagesUnsubscribe();
      schedulesUnsubscribe();
    };
  }, [user]);





  if (!user) {
    return (
      <main style={{
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
      <main style={{
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

  // 计算统计数据
  const totalClients = clients.length;
  
  // 获取当前月份（使用本地时区，与getTodayDate保持一致）
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  const currentMonth = getCurrentMonth();
  
  // 本月活跃客户（本月有预约过课程并且扣课时的总人数）
  const monthlyActiveClients = new Set(
    schedules
      .filter(schedule => 
        schedule.date.startsWith(currentMonth) && 
        (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
      )
      .map(schedule => schedule.clientId)
  ).size;
  
  // 剩余客户配套数量
  const remainingPackages = packages.filter(pkg => !pkg.isExpired && pkg.remainingSessions > 0).length;
  
  const today = getTodayDate();
  
  // 今日课程数量（今日所有课程总数）- 兼容不同时区的日期格式
  const todaySchedules = schedules.filter(schedule => {
    // 直接比较日期字符串
    if (schedule.date === today) return true;
    
    // 如果直接比较失败，尝试解析日期进行比较
    try {
      const scheduleDate = new Date(schedule.date + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      return scheduleDate.getTime() === todayDate.getTime();
    } catch (error) {
      return false;
    }
  }).length;
  
  // 本月已完成课程（包括取消但扣课时的课程）
  const monthlyCompletedCourses = schedules.filter(schedule => 
    schedule.date.startsWith(currentMonth) && (schedule.status === 'completed' || schedule.status === 'cancelled_with_deduction')
  ).length;
  
  // 辅助函数：检查日期是否为今天
  const isToday = (dateStr: string) => {
    if (dateStr === today) return true;
    try {
      const scheduleDate = new Date(dateStr + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      return scheduleDate.getTime() === todayDate.getTime();
    } catch (error) {
      return false;
    }
  };
  
  // 本月新增配套数量 - 统计所有在本月创建的配套（不管新客户还是老客户）
  const monthlyNewPackages = packages.filter(pkg => {
    let isInCurrentMonth = false;
    let usedDate = '';
    
    // 优先使用createdAt字段
    if (pkg.createdAt) {
      const createdDate = pkg.createdAt.split('T')[0];
      isInCurrentMonth = createdDate.startsWith(currentMonth);
      usedDate = createdDate;
    } else {
      // 如果没有createdAt，使用startDate作为备选
      isInCurrentMonth = pkg.startDate.startsWith(currentMonth);
      usedDate = pkg.startDate;
    }
    
    return isInCurrentMonth;
  }).length;

  // 处理表单输入
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 处理数组字段（专长、证书、语言）
  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setEditForm(prev => ({ ...prev, [field]: items }));
  };

  // 预设专长选项
  const specialtyOptions = [
    t('strengthTraining'),
    t('cardio'),
    t('yoga'),
    t('pilates'),
    t('functionalTraining'),
    t('rehabilitationTraining'),
    t('other')
  ];

  // 处理专长选择
  const handleSpecialtyChange = (specialty: string) => {
    if (specialty === '其他') {
      setShowCustomInput(true);
      return;
    }

    setEditForm(prev => {
      const currentSpecialties = prev.specialties;
      if (currentSpecialties.includes(specialty)) {
        // 如果已选中，则移除
        return { ...prev, specialties: currentSpecialties.filter(s => s !== specialty) };
      } else {
        // 如果未选中，则添加
        return { ...prev, specialties: [...currentSpecialties, specialty] };
      }
    });
  };

  // 添加自定义专长
  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim()) {
      setEditForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, customSpecialty.trim()]
      }));
      setCustomSpecialty('');
      setShowCustomInput(false);
    }
  };

  // 移除专长
  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialtyToRemove)
    }));
  };

  // 保存教练信息
  const handleSave = async () => {
    if (!user || !coach) return;
    
    try {
      const updatedCoach = {
        ...coach,
        ...editForm,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "coaches", user.uid), updatedCoach);
      setCoach(updatedCoach);
      setIsEditing(false);
    } catch (error) {
      console.error("保存失败:", error);
    }
  };

  // 处理照片上传
  const handleImageUpload = (url: string) => {
    setEditForm(prev => ({ ...prev, avatar: url }));
  };

  // 处理照片删除
  const handleImageRemove = () => {
    setEditForm(prev => ({ ...prev, avatar: '' }));
  };

  // 取消编辑
  const handleCancel = () => {
    if (coach) {
      setEditForm({
        displayName: coach.displayName || '',
        phone: coach.phone || '',
        bio: coach.bio || '',
        specialties: coach.specialties || [],
        experience: coach.experience || 0,
        certifications: coach.certifications || [],
        education: coach.education || '',
        location: coach.location || '',
        languages: coach.languages || [],
        isPublic: coach.isPublic || false,
        avatar: coach.avatar || ''
      });
    }
    setIsEditing(false);
  };

  // 设置相关处理函数
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSettingsMessage(t('passwordMismatch'));
      setSettingsMessageType("error");
      return;
    }
    if (newPassword.length < 6) {
      setSettingsMessage(t('passwordTooShort'));
      setSettingsMessageType("error");
      return;
    }

    setSettingsLoading(true);
    try {
      await updatePassword(user, newPassword);
      setSettingsMessage(t('passwordChangeSuccess'));
      setSettingsMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setSettingsMessage(t('passwordChangeFailed') + (error.message || t('unknown')));
      setSettingsMessageType("error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setSettingsMessage("请输入密码");
      setSettingsMessageType("error");
      return;
    }

    setSettingsLoading(true);
    try {
      // 重新认证用户
      const credential = EmailAuthProvider.credential(user.email!, deletePassword);
      await reauthenticateWithCredential(user, credential);
      
      // 删除用户的所有数据
      const { writeBatch, doc, collection, query, where, getDocs } = await import("firebase/firestore");
      const batch = writeBatch(db);
      
      // 删除教练基本信息
      const coachRef = doc(db, "coaches", user.uid);
      batch.delete(coachRef);
      
      // 删除该教练的所有客户
      const clientsSnapshot = await getDocs(
        query(collection(db, "clients"), where("coachId", "==", user.uid))
      );
      clientsSnapshot.docs.forEach((clientDoc) => {
        batch.delete(clientDoc.ref);
      });
      
      // 删除该教练的所有潜在客户
      const prospectsSnapshot = await getDocs(
        query(collection(db, "prospects"), where("coachId", "==", user.uid))
      );
      prospectsSnapshot.docs.forEach((prospectDoc) => {
        batch.delete(prospectDoc.ref);
      });
      
      // 删除该教练的所有课程记录
      const lessonRecordsSnapshot = await getDocs(
        query(collection(db, "lessonRecords"), where("coachId", "==", user.uid))
      );
      lessonRecordsSnapshot.docs.forEach((recordDoc) => {
        batch.delete(recordDoc.ref);
      });
      
      // 删除该教练的所有套餐
      const packagesSnapshot = await getDocs(
        query(collection(db, "packages"), where("coachId", "==", user.uid))
      );
      packagesSnapshot.docs.forEach((packageDoc) => {
        batch.delete(packageDoc.ref);
      });
      
      // 删除该教练的所有排课
      const schedulesSnapshot = await getDocs(
        query(collection(db, "schedules"), where("coachId", "==", user.uid))
      );
      schedulesSnapshot.docs.forEach((scheduleDoc) => {
        batch.delete(scheduleDoc.ref);
      });
      
      // 删除该教练的所有自定义动作
      const exercisesSnapshot = await getDocs(
        query(collection(db, "exercises"), where("coachId", "==", user.uid))
      );
      exercisesSnapshot.docs.forEach((exerciseDoc) => {
        batch.delete(exerciseDoc.ref);
      });
      
      // 执行批量删除
      await batch.commit();
      
      // 删除 Firebase Auth 用户账户
      await deleteUser(user);
      
      setShowDeleteSuccess(true);
    } catch (error: any) {
      console.error("删除账户失败:", error);
      setSettingsMessage("删除账户失败: " + (error.message || "未知错误"));
      setSettingsMessageType("error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword("");
    setSettingsMessage("");
  };

  // 动作管理相关处理函数
  const handleAddExercise = async () => {
    if (!selectedCategory || !newExerciseName.trim() || !user) return;
    
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      const customExerciseData = {
        coachId: user.uid,
        name: newExerciseName.trim(),
        category: selectedCategory.category,
        isPreset: false, // 标记为自定义动作
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "exercises"), customExerciseData);
      
      setNewExerciseName("");
      setShowAddExerciseForm(false);
      
      console.log("✅ 自定义动作添加成功:", newExerciseName.trim());
      
    } catch (error) {
      console.error("❌ 添加动作失败:", error);
      alert("添加动作失败，请重试");
    }
  };

  const handleRemoveExercise = async (exerciseName: string) => {
    if (!selectedCategory || !user) return;
    
    try {
      // 找到要删除的动作
      const exerciseToDelete = allExercises.find(ex => 
        ex.name === exerciseName && ex.category === selectedCategory.category && !ex.isPreset
      );
      
      if (exerciseToDelete) {
        // 从Firebase删除
        const { deleteDoc, doc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "exercises", exerciseToDelete.id));
        
        console.log("✅ 自定义动作删除成功:", exerciseName);
      } else {
        console.log("❌ 未找到要删除的动作:", exerciseName);
      }
    } catch (error) {
      console.error("❌ 删除动作失败:", error);
      alert("删除动作失败，请重试");
    }
  };

  const handleRemovePresetExercise = (exerciseName: string) => {
    // 这里可以添加逻辑来标记预设动作为已删除
    alert(`已从预设动作中移除：${exerciseName}`);
  };

  // 动作分类定义
  const categories = [
    { name: t('chest'), category: 'chest', color: '#ef4444' },
    { name: t('back'), category: 'back', color: '#f59e0b' },
    { name: t('shoulders'), category: 'shoulders', color: '#10b981' },
    { name: t('arms'), category: 'arms', color: '#3b82f6' },
    { name: t('glutes'), category: 'glutes', color: '#8b5cf6' },
    { name: t('legs'), category: 'legs', color: '#ec4899' },
    { name: t('fullBody'), category: 'fullbody', color: '#06b6d4' }
  ];

  return (
    <main className="page-content" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      background: "#18181b",
              padding: isMobile ? "4px" : "16px", // 移动端减少padding
      paddingTop: isMobile ? 15 : 40, // 与登录页面一致的顶部间距
      paddingBottom: isMobile ? 100 : 20 // 移动端增加底部间距
    }}>
        {/* 标题卡片 */}
        <div style={{ 
          maxWidth: 1200,
          width: "100%",
          marginBottom: isMobile ? 12 : 24, 
          background: "#23232a",
          borderRadius: 12,
          padding: isMobile ? "12px 16px" : "16px 20px",
          border: "1px solid #333",
          textAlign: "center"
        }}>
          <h1 style={{ 
            fontSize: isMobile ? "clamp(20px, 5vw, 28px)" : "28px",
            fontWeight: 700, 
            color: "#fff",
            marginBottom: isMobile ? 2 : 4,
            marginTop: 0
          }}>{t('profile')}</h1>
          <p style={{ 
            color: "#a1a1aa",
            fontSize: isMobile ? "clamp(11px, 2.5vw, 13px)" : "14px",
            margin: 0
          }}>{t('profileDescription')}</p>
        </div>

        {/* 标签页 */}
        <div style={{ 
          display: 'flex', 
          marginBottom: isMobile ? 16 : 24, 
          borderBottom: '1px solid #333',
          width: '100%',
          maxWidth: 800,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? 4 : 0
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? '#60a5fa' : 'transparent',
              color: activeTab === 'profile' ? '#18181b' : '#a1a1aa',
              border: 'none',
              padding: isMobile ? '8px 12px' : '12px 20px',
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(14px, 3vw, 18px)" : "20px",
              fontWeight: activeTab === 'profile' ? 600 : 400,
              borderBottom: activeTab === 'profile' ? '2px solid #60a5fa' : 'none',
              borderRadius: activeTab === 'profile' ? '8px' : '0'
            }}
          >
            {t('personalInfo')}
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            style={{
              background: activeTab === 'exercises' ? '#60a5fa' : 'transparent',
              color: activeTab === 'exercises' ? '#18181b' : '#a1a1aa',
              border: 'none',
              padding: isMobile ? '8px 12px' : '12px 20px',
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(14px, 3vw, 18px)" : "20px",
              fontWeight: activeTab === 'exercises' ? 600 : 400,
              borderBottom: activeTab === 'exercises' ? '2px solid #60a5fa' : 'none',
              borderRadius: activeTab === 'exercises' ? '8px' : '0'
            }}
          >
            {t('exerciseLibrary')}
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            style={{
              background: activeTab === 'packages' ? '#60a5fa' : 'transparent',
              color: activeTab === 'packages' ? '#18181b' : '#a1a1aa',
              border: 'none',
              padding: isMobile ? '8px 12px' : '12px 20px',
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(14px, 3vw, 18px)" : "20px",
              fontWeight: activeTab === 'packages' ? 600 : 400,
              borderBottom: activeTab === 'packages' ? '2px solid #60a5fa' : 'none',
              borderRadius: activeTab === 'packages' ? '8px' : '0'
            }}
          >
            {t('packages')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              background: activeTab === 'settings' ? '#60a5fa' : 'transparent',
              color: activeTab === 'settings' ? '#18181b' : '#a1a1aa',
              border: 'none',
              padding: isMobile ? '8px 12px' : '12px 20px',
              cursor: 'pointer',
              fontSize: isMobile ? "clamp(14px, 3vw, 18px)" : "20px",
              fontWeight: activeTab === 'settings' ? 600 : 400,
              borderBottom: activeTab === 'settings' ? '2px solid #60a5fa' : 'none',
              borderRadius: activeTab === 'settings' ? '8px' : '0'
            }}
          >
            {t('settings')}
          </button>
        </div>

        {/* 个人信息标签页内容 */}
        {activeTab === 'profile' && (
        <div className="form-card" style={{ 
          maxWidth: 600, 
          width: '100%', 
          marginBottom: isMobile ? 16 : 24,
          padding: isMobile ? "12px" : "20px" // 移动端减少内边距
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: isMobile ? 12 : 16,
            flexWrap: isMobile ? "wrap" : "nowrap", // 移动端允许换行
            gap: isMobile ? 8 : 0 // 移动端添加间距
          }}>
            <h2 style={{ 
              color: "#fff", 
              fontSize: isMobile ? "clamp(16px, 3vw, 20px)" : "24px", 
              fontWeight: 600,
              margin: 0
            }}>{t('personalInfo')}</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: '#60a5fa',
                  color: '#18181b',
                  border: 'none',
                  borderRadius: 6,
                  padding: isMobile ? '4px 8px' : '6px 12px', // 移动端减少内边距
                  cursor: 'pointer',
                  fontSize: isMobile ? "clamp(12px, 2.5vw, 14px)" : "14px", // 移动端响应式字体
                  fontWeight: 600,
                  minWidth: 'auto',
                  width: 'auto'
                }}
              >
                {t('edit')}
              </button>
            )}
          </div>
          
          {!isEditing ? (
            // 显示模式
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                {coach?.avatar ? (
                  <img
                    src={coach.avatar}
                    alt="教练头像"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#18181b"
                  }}>
                    {(coach?.displayName || user.email)?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {coach?.displayName || user.email}
                  </h3>
                  <p style={{ color: "#a1a1aa", fontSize: 14 }}>
                    {coach?.experience ? `${coach.experience}${t('yearsExperience')}` : t('coachAccount')}
                  </p>
                  {coach?.displayName && (
                    <p style={{ color: "#71717a", fontSize: 12, marginTop: 2 }}>
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              
              {coach && (
                <div style={{ marginBottom: 16 }}>
                  {coach.bio && (
                    <p style={{ color: "#a1a1aa", marginBottom: 8 }}>{coach.bio}</p>
                  )}
                                     {coach.specialties.length > 0 && (
                     <div style={{ marginBottom: 8 }}>
                       <span style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600 }}>{t('specialties')}：</span>
                       <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                         {coach.specialties.join(', ')}
                       </span>
                     </div>
                   )}
                   {coach.location && (
                     <div style={{ marginBottom: 8 }}>
                       <span style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600 }}>{t('location')}：</span>
                       <span style={{ color: "#a1a1aa", fontSize: 14 }}>{coach.location}</span>
                     </div>
                   )}
                   {coach.isPublic && (
                     <div style={{ 
                       background: "#059669", 
                       color: "#fff", 
                       padding: "4px 8px", 
                       borderRadius: 4, 
                       fontSize: 12,
                       display: "inline-block"
                     }}>
                       {t('publicProfile')}
                     </div>
                   )}
                </div>
              )}
            </>
          ) : (
            // 编辑模式
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#a1a1aa', fontSize: 14 }}>
                  {t('uploadPhoto')}
                </label>
                <ImageUpload
                  currentImageUrl={editForm.avatar}
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('displayName')} *
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder={t('displayName')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('phone')}
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('phone')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('bio')}
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder={t('bioPlaceholder')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('specialties')}
                </label>
                <div style={{ marginBottom: 8 }}>
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      marginRight: 12, 
                      marginBottom: 8,
                      color: '#a1a1aa',
                      fontSize: 14
                    }}>
                      <input
                        type="checkbox"
                        checked={editForm.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyChange(specialty)}
                        style={{ marginRight: 4, width: 14, height: 14 }}
                      />
                      {specialty}
                    </label>
                  ))}
                </div>
                
                {showCustomInput && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="输入自定义专长"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #333',
                        borderRadius: 4,
                        background: '#18181b',
                        color: '#fff',
                        fontSize: 14
                      }}
                    />
                    <button
                      onClick={handleAddCustomSpecialty}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      添加
                    </button>
                  </div>
                )}
                
                {editForm.specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {editForm.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        style={{
                          background: '#60a5fa',
                          color: '#18181b',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {specialty}
                        <button
                          onClick={() => handleRemoveSpecialty(specialty)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#18181b',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: 0,
                            marginLeft: 4
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('experience')}
                </label>
                <input
                  type="number"
                  value={editForm.experience}
                  onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('certifications')}
                </label>
                <input
                  type="text"
                  value={editForm.certifications.join(', ')}
                  onChange={(e) => handleArrayChange('certifications', e.target.value)}
                  placeholder={t('certificationsPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('education')}
                </label>
                <input
                  type="text"
                  value={editForm.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  placeholder={t('education')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 14 }}>
                  {t('location')}
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={t('locationPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: 6,
                    background: '#18181b',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    style={{ margin: 0, width: 16, height: 16 }}
                  />
                  <span>{t('isPublic')}</span>
                </label>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSave}
                  style={{
                    background: '#60a5fa',
                    color: '#18181b',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {t('save')}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    background: '#23232a',
                    color: '#a1a1aa',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
            </div>
          )}
          
        {/* 动作库标签页内容 */}
        {activeTab === 'exercises' && (
          <div className="form-card" style={{ maxWidth: 800, width: '100%', marginBottom: isMobile ? 16 : 24, padding: isMobile ? "12px" : "20px" }}>
            {selectedCategory ? (
              // 显示选中分类的动作列表
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0 }}>
                    {selectedCategory.name} {t('exercises')}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: '#23232a',
                        color: '#a1a1aa',
                        border: '1px solid #333',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t('backToCategories')}
                    </button>
                  </div>
                </div>
                
                {/* 搜索和添加按钮区域 */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginBottom: 16,
                  flexWrap: 'wrap'
                }}>
                  {/* 添加动作按钮 */}
                  <button
                    onClick={() => setShowAddExerciseForm(true)}
                    style={{
                      background: '#60a5fa',
                      color: '#18181b',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#3b82f6')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#60a5fa')}
                  >
                    + {t('addExercise')}
                  </button>
                  
                  {/* 搜索输入框 */}
                  <input
                    type="text"
                    placeholder={t('searchExercises')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 200,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#23232a',
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                </div>
                
                {/* 添加动作表单 */}
                {showAddExerciseForm && (
                  <div style={{
                    background: '#23232a',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #333',
                    marginBottom: 16
                  }}>
                    <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>{t('addNewExercise')}</h3>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        type="text"
                        placeholder={t('enterExerciseName')}
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #333',
                          background: '#18181b',
                          color: '#fff',
                          fontSize: 14
                        }}
                      />
                      <button
                        onClick={handleAddExercise}
                        disabled={!newExerciseName.trim()}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          background: newExerciseName.trim() ? '#10b981' : '#333',
                          color: '#fff',
                          border: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: newExerciseName.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {t('add')}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddExerciseForm(false);
                          setNewExerciseName("");
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          background: '#6b7280',
                          color: '#fff',
                          border: 'none',
                          fontSize: 14,
                          cursor: 'pointer'
                        }}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 动作列表 */}
                <div style={{ 
                  background: '#18181b',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid #333'
                }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    {getCurrentCategoryExercises().map((exercise, index) => {
                      const isPreset = exercise.isPreset;
                      
                      return (
                        <div
                          key={exercise.id}
                          style={{
                            background: '#23232a',
                            border: '1px solid #333',
                            borderRadius: 6,
                            padding: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = selectedCategory.color;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              color: '#fff', 
                              fontSize: 16, 
                              fontWeight: 500 
                            }}>
                              {exercise.name}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setDeleteConfirmExercise(exercise);
                              setShowDeleteConfirm(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 16,
                              padding: 4,
                              borderRadius: 4
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 搜索结果为空时的提示 */}
                  {getCurrentCategoryExercises().length === 0 && searchTerm.trim() && (
                    <div style={{
                      textAlign: 'center',
                      color: '#a1a1aa',
                      padding: '20px',
                      fontSize: 14
                    }}>
                      {t('noMatchingExercises')}
                    </div>
                  )}
                  
                  {/* 加载状态 */}
                  {exercisesLoading && (
                    <div style={{
                      textAlign: 'center',
                      color: '#a1a1aa',
                      padding: '20px',
                      fontSize: 14
                    }}>
                      {t('loading')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 显示分类选择
              <div>
                <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
                  {t('selectExerciseCategory')}
                </h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: 12 
                }}>
                  {categories.map((category) => (
                    <button
                      key={category.category}
                      onClick={() => setSelectedCategory(category)}
                      style={{
                        background: '#23232a',
                        border: '1px solid #333',
                        borderRadius: 8,
                        padding: '16px',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 60
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = category.color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{
                        color: category.color,
                        fontSize: 18,
                        fontWeight: 600
                      }}>
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 配套标签页内容 */}
        {activeTab === 'packages' && (
          <div className="form-card" style={{ maxWidth: 800, width: '100%', marginBottom: isMobile ? 16 : 24, padding: isMobile ? "12px" : "20px" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0 }}>{t('packages')}</h2>
              <button
                onClick={() => alert('添加配套')}
                style={{
                  background: '#60a5fa',
                  color: '#18181b',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#3b82f6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#60a5fa')}
              >
                +{t('package')}
              </button>
            </div>
            {/* 这里可以放配套列表 */}
            <div style={{ color: '#a1a1aa', textAlign: 'center', padding: 24 }}>{t('noPackages')}</div>
          </div>
        )}

        {/* 设置标签页内容 */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 600, width: '100%', marginBottom: isMobile ? 16 : 24 }}>
            {/* 消息提示 */}
            {settingsMessage && (
              <div style={{
                background: settingsMessageType === 'success' ? '#10b981' : '#ef4444',
                color: '#fff',
                padding: '12px',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14
              }}>
                {settingsMessage}
              </div>
            )}

            {/* 账户信息 */}
            <div className="form-card" style={{ 
              maxWidth: 600, 
              width: '100%', 
              marginBottom: 12,
              padding: "12px"
            }}>
              <h2 style={{ 
                color: "#fff", 
                fontSize: "clamp(16px, 3vw, 24px)",
                fontWeight: 600, 
                marginBottom: 12
              }}>{t('accountInfo')}</h2>
              <div style={{ marginBottom: 12 }}>
                <p style={{ 
                  color: "#a1a1aa", 
                  marginBottom: 6,
                  fontSize: "clamp(12px, 2.5vw, 14px)"
                }}>{t('email')}</p>
                <p style={{ 
                  color: "#fff", 
                  fontSize: "clamp(14px, 3vw, 16px)"
                }}>{user.email}</p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ 
                  color: "#a1a1aa", 
                  marginBottom: 6,
                  fontSize: "clamp(12px, 2.5vw, 14px)"
                }}>{t('accountCreationTime')}</p>
                <p style={{ 
                  color: "#fff", 
                  fontSize: "clamp(14px, 3vw, 16px)"
                }}>
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : t('unknown')}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ 
                  color: "#a1a1aa", 
                  marginBottom: 6,
                  fontSize: "clamp(12px, 2.5vw, 14px)"
                }}>{t('lastLoginTime')}</p>
                <p style={{ 
                  color: "#fff", 
                  fontSize: "clamp(14px, 3vw, 16px)"
                }}>
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : t('unknown')}
                </p>
              </div>
            </div>

            {/* 语言设置 */}
            <div className="form-card" style={{ 
              maxWidth: 600, 
              width: '100%', 
              marginBottom: 12,
              padding: "12px"
            }}>
              <h2 style={{ 
                color: "#fff", 
                fontSize: "clamp(16px, 3vw, 24px)",
                fontWeight: 600, 
                marginBottom: 12
              }}>{t('languageSettings')}</h2>
              <div style={{ marginBottom: 12 }}>
                <p style={{ 
                  color: "#a1a1aa", 
                  marginBottom: 8,
                  fontSize: "clamp(12px, 2.5vw, 14px)"
                }}>{t('selectLanguage')}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setLanguage('zh')}
                    style={{
                      background: language === 'zh' ? '#60a5fa' : '#23232a',
                      color: language === 'zh' ? '#18181b' : '#a1a1aa',
                      border: '1px solid',
                      borderColor: language === 'zh' ? '#60a5fa' : '#333',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: "clamp(12px, 2.5vw, 14px)"
                    }}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      background: language === 'en' ? '#60a5fa' : '#23232a',
                      color: language === 'en' ? '#18181b' : '#a1a1aa',
                      border: '1px solid',
                      borderColor: language === 'en' ? '#60a5fa' : '#333',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: "clamp(12px, 2.5vw, 14px)"
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('ms')}
                    style={{
                      background: language === 'ms' ? '#60a5fa' : '#23232a',
                      color: language === 'ms' ? '#18181b' : '#a1a1aa',
                      border: '1px solid',
                      borderColor: language === 'ms' ? '#60a5fa' : '#333',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: "clamp(12px, 2.5vw, 14px)"
                    }}
                  >
                    Bahasa Melayu
                  </button>
                </div>
              </div>
            </div>

            {/* 密码修改 */}
            <div className="form-card" style={{ 
              maxWidth: 600, 
              width: '100%', 
              marginBottom: 12,
              padding: "12px"
            }}>
              <h2 style={{ 
                color: "#fff", 
                fontSize: "clamp(16px, 3vw, 24px)",
                fontWeight: 600, 
                marginBottom: 12
              }}>{t('changePassword')}</h2>
              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="password"
                    placeholder={t('newPassword')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#23232a',
                      color: '#fff',
                      fontSize: "clamp(12px, 2.5vw, 14px)"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#23232a',
                      color: '#fff',
                      fontSize: "clamp(12px, 2.5vw, 14px)"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#60a5fa',
                    color: '#18181b',
                    border: 'none',
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: 600,
                    cursor: settingsLoading ? 'not-allowed' : 'pointer',
                    opacity: settingsLoading ? 0.6 : 1
                  }}
                >
                  {settingsLoading ? t('loading') : t('changePassword')}
                </button>
              </form>
            </div>

            {/* 登出按钮 */}
            <div className="form-card" style={{ 
              maxWidth: 600, 
              width: '100%', 
              marginBottom: 12,
              padding: "12px"
            }}>
              <h2 style={{ 
                color: "#fff", 
                fontSize: "clamp(16px, 3vw, 24px)",
                fontWeight: 600, 
                marginBottom: 12
              }}>{t('logout')}</h2>
              <LogoutButton />
            </div>

            {/* 删除账户 */}
            <div className="form-card" style={{ 
              maxWidth: 600, 
              width: '100%', 
              marginBottom: 12,
              padding: "12px"
            }}>
              <h2 style={{ 
                color: "#ef4444", 
                fontSize: "clamp(16px, 3vw, 24px)",
                fontWeight: 600, 
                marginBottom: 12
              }}>{t('deleteAccount')}</h2>
              <p style={{ 
                color: "#a1a1aa", 
                marginBottom: 12,
                fontSize: "clamp(12px, 2.5vw, 14px)"
              }}>{t('deleteAccountWarning')}</p>
              <button
                onClick={handleDeleteAccount}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('deleteAccount')}
              </button>
            </div>

            {/* 删除确认弹窗 */}
            {showDeleteConfirm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
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
                  maxWidth: isMobile ? '100%' : 400,
                  width: '100%',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ 
                    color: '#ef4444', 
                    fontSize: 20, 
                    fontWeight: 600, 
                    marginBottom: 16 
                  }}>{t('confirmDeleteAccount')}</h3>
                  <p style={{ 
                    color: '#a1a1aa', 
                    marginBottom: 16,
                    fontSize: 14
                  }}>{t('confirmDeleteAccountMessage')}</p>
                  <input
                    type="password"
                    placeholder={t('enterPassword')}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#23232a',
                      color: '#fff',
                      fontSize: 14,
                      marginBottom: 16
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleConfirmDeleteAccount}
                      disabled={settingsLoading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: settingsLoading ? 'not-allowed' : 'pointer',
                        opacity: settingsLoading ? 0.6 : 1
                      }}
                    >
                      {settingsLoading ? t('loading') : t('confirmDelete')}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#23232a',
                        color: '#a1a1aa',
                        border: '1px solid #333',
                        fontSize: 14,
                        cursor: 'pointer'
                      }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 删除成功弹窗 */}
            {showDeleteSuccess && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
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
                  maxWidth: isMobile ? '100%' : 400,
                  width: '100%',
                  border: '1px solid #333',
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    color: '#10b981', 
                    fontSize: 20, 
                    fontWeight: 600, 
                    marginBottom: 16 
                  }}>{t('accountDeleted')}</h3>
                  <p style={{ 
                    color: '#a1a1aa', 
                    marginBottom: 16,
                    fontSize: 14
                  }}>{t('accountDeletedMessage')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 删除确认弹窗 */}
        {showDeleteConfirm && deleteConfirmExercise && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
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
              maxWidth: isMobile ? '100%' : 400,
              width: '100%',
              border: '1px solid #333'
            }}>
              <h3 style={{ 
                color: '#ef4444', 
                fontSize: 20, 
                fontWeight: 600, 
                marginBottom: 16 
              }}>{t('confirmDeleteExercise')}</h3>
              
              <p style={{ 
                color: '#a1a1aa', 
                marginBottom: 16,
                fontSize: 16
              }}>
                {t('confirmDeleteExerciseMessage').replace('{name}', deleteConfirmExercise.name)}
                {deleteConfirmExercise.isPreset && (
                  <span style={{ color: '#fbbf24', display: 'block', marginTop: 8 }}>
                    {t('presetExerciseDeleteWarning')}
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmExercise(null);
                  }}
                  style={{
                    background: '#23232a',
                    color: '#a1a1aa',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    handleDeleteExercise(deleteConfirmExercise.id, deleteConfirmExercise.name);
                    setShowDeleteConfirm(false);
                    setDeleteConfirmExercise(null);
                  }}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 模板表单弹窗 */}
        {/* 移除 1248-1280 行 showExerciseForm 弹窗 */}
        {/* 移除 1282-1314 行 showPackageForm 弹窗 */}
      </main>
  );
} 