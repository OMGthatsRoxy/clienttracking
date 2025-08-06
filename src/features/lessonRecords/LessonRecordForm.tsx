"use client";
import { useState, useEffect } from "react";
import { addDoc, collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { LessonRecord } from "@/types/lessonRecord";
import type { ExerciseTemplate, PackageTemplate } from "@/types/coach";
import type { Package } from "@/types/package";
import ExerciseSelector from "@/features/exercises/ExerciseSelector";

interface LessonRecordFormProps {
  clientId: string;
  clientName: string;
  onSuccess: (recordId?: string) => void;
  onCancel: () => void;
  initialDate?: string;
  initialTime?: string;
  packageId?: string; // 添加配套ID参数
  isEditing?: boolean; // 是否为编辑模式
  initialData?: LessonRecord; // 编辑时的初始数据
}

export default function LessonRecordForm({
  clientId,
  clientName,
  onSuccess,
  onCancel,
  initialDate,
  initialTime,
  packageId,
  isEditing = false,
  initialData
}: LessonRecordFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    lessonDate: initialData?.lessonDate || initialDate || new Date().toISOString().split('T')[0],
    lessonTime: initialData?.lessonTime || initialTime || "09:00",
    duration: initialData?.duration || 60,
    content: initialData?.content || "",
    notes: initialData?.notes || "",
    performance: initialData?.performance || "",
    nextGoals: initialData?.nextGoals || "",
    trainingMode: initialData?.trainingMode || ""
  });


  const [saving, setSaving] = useState(false);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // 新增状态
  const [exerciseActions, setExerciseActions] = useState<Array<{
    id: string;
    category: string;
    exercise: string;
    weights: string[];
  }>>(initialData?.exerciseActions && initialData.exerciseActions.length > 0 
    ? initialData.exerciseActions 
    : [{
        id: '1',
        category: '',
        exercise: '',
        weights: ['']  // 一开始只显示第一组
      }]
  );

  // 预设动作数据
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

  const categoryOptions = [
    { value: 'chest', label: t('chest') },
    { value: 'back', label: t('back') },
    { value: 'shoulders', label: t('shoulders') },
    { value: 'arms', label: t('arms') },
    { value: 'glutes', label: t('glutes') },
    { value: 'legs', label: t('legs') },
    { value: 'fullbody', label: t('fullBody') }
  ];

  // 加载模板数据
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  // 更新配套剩余次数
  const updatePackageRemainingSessions = async (packageId: string) => {
    try {
      const packageRef = doc(db, "packages", packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (packageDoc.exists()) {
        const packageData = packageDoc.data() as Package;
        const newRemainingSessions = Math.max(0, packageData.remainingSessions - 1);
        
        await updateDoc(packageRef, {
          remainingSessions: newRemainingSessions,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`配套 ${packageId} 剩余次数已更新: ${packageData.remainingSessions} -> ${newRemainingSessions}`);
      }
    } catch (error) {
      console.error("更新配套剩余次数失败:", error);
    }
  };

  // 更新课程状态为已完成
  const updateScheduleStatus = async (lessonDate: string, lessonTime: string, clientId: string) => {
    try {
      // 查询对应的课程 - 使用与hasLessonRecord相同的匹配逻辑
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("coachId", "==", user?.uid),
        where("clientId", "==", clientId),
        where("date", "==", lessonDate)
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      
      // 在内存中过滤，匹配时间字段（startTime || time）
      const matchingSchedule = schedulesSnapshot.docs.find(doc => {
        const scheduleData = doc.data();
        const scheduleTime = scheduleData.startTime || scheduleData.time;
        return scheduleTime === lessonTime;
      });
      
      if (matchingSchedule) {
        const scheduleRef = doc(db, "schedules", matchingSchedule.id);
        
        await updateDoc(scheduleRef, {
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
        
        console.log(`课程状态已更新为已完成: ${matchingSchedule.id}`);
      } else {
        console.log("未找到对应的课程记录");
      }
    } catch (error) {
      console.error("更新课程状态失败:", error);
    }
  };

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      // 加载训练动作模板
      const exerciseQuery = query(
        collection(db, "exerciseTemplates"),
        where("coachId", "==", user.uid)
      );
      const exerciseSnapshot = await getDocs(exerciseQuery);
      const exercises = exerciseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExerciseTemplate[];
      setExerciseTemplates(exercises);

      // 加载配套模板
      const packageQuery = query(
        collection(db, "packageTemplates"),
        where("coachId", "==", user.uid)
      );
      const packageSnapshot = await getDocs(packageQuery);
      const packages = packageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PackageTemplate[];
      setPackageTemplates(packages);
    } catch (error) {
      console.error("加载模板失败:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  // 添加动作
  const addExerciseAction = () => {
    const newAction = {
      id: (exerciseActions.length + 1).toString(),
      category: '',
      exercise: '',
      weights: ['']  // 新动作也只显示第一组
    };
    setExerciseActions(prev => [...prev, newAction]);
  };

  // 删除动作
  const removeExerciseAction = (id: string) => {
    setExerciseActions(prev => prev.filter(action => action.id !== id));
  };

  // 更新动作
  const updateExerciseAction = (id: string, field: string, value: string | string[]) => {
    setExerciseActions(prev => prev.map(action => {
      if (action.id === id) {
        if (field === 'weights') {
          return { ...action, weights: value as string[] };
        } else {
          return { ...action, [field]: value };
        }
      }
      return action;
    }));
  };

  // 更新重量
  const updateWeight = (actionId: string, setIndex: number, value: string) => {
    setExerciseActions(prev => prev.map(action => {
      if (action.id === actionId) {
        const newWeights = [...action.weights];
        newWeights[setIndex] = value;
        return { ...action, weights: newWeights };
      }
      return action;
    }));
  };

  const applyTemplate = () => {
    let content = "";
    
    // 应用配套模板
    if (selectedPackage) {
      const packageTemplate = packageTemplates.find(p => p.id === selectedPackage);
      if (packageTemplate) {
        content += `配套: ${packageTemplate.name}\n`;
        content += `描述: ${packageTemplate.description}\n`;
        if (packageTemplate.features && packageTemplate.features.length > 0) {
          content += `特色: ${packageTemplate.features.join(', ')}\n`;
        }
        content += "\n";
      }
    }
    
    // 应用训练动作模板
    if (selectedExercises.length > 0) {
      content += "训练动作:\n";
      selectedExercises.forEach((exerciseId, index) => {
        const exercise = exerciseTemplates.find(e => e.id === exerciseId);
        if (exercise) {
          content += `${index + 1}. ${exercise.name}\n`;
          content += `   描述: ${exercise.description}\n`;
          content += `   组数: ${exercise.sets} | 次数: ${exercise.reps}\n`;
          if (exercise.weightRange) {
            content += `   重量: ${exercise.weightRange}\n`;
          }
          content += `   休息: ${exercise.restTime}\n`;
          if (exercise.notes) {
            content += `   备注: ${exercise.notes}\n`;
          }
          content += "\n";
        }
      });
    }
    
    setFormData(prev => ({ ...prev, content }));
    setShowTemplateSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // 验证必填字段
      if (!formData.lessonDate || !formData.lessonTime) {
        throw new Error("请填写课程日期和时间");
      }

      // 移除动作验证，允许保存空白记录
      // const hasValidAction = exerciseActions.some(action => 
      //   action.category && action.exercise
      // );
      // if (!hasValidAction) {
      //   throw new Error("请至少添加一个训练动作");
      // }

      const lessonRecordData = {
        clientId,
        clientName,
        coachId: user.uid,
        lessonDate: formData.lessonDate,
        lessonTime: formData.lessonTime,
        duration: Number(formData.duration),
        content: '', // 保留字段但设为空，因为我们现在使用动作训练数据
        notes: formData.notes.trim(),
        performance: formData.performance.trim(),
        nextGoals: formData.nextGoals.trim(),
        packageId: packageId || undefined,
        trainingMode: formData.trainingMode,
        exerciseActions: exerciseActions.filter(action => action.category && action.exercise), // 只保存有效的动作，如果没有则保存空数组
        updatedAt: new Date().toISOString()
      };

      if (isEditing && initialData?.id) {
        // 编辑模式：更新现有记录
        console.log("准备更新课程记录:", lessonRecordData);
        await updateDoc(doc(db, "lessonRecords", initialData.id), lessonRecordData);
        console.log("课程记录更新成功");
        onSuccess(initialData.id);
      } else {
        // 创建模式：新建记录
        const lessonRecord: Omit<LessonRecord, 'id'> = {
          ...lessonRecordData,
          createdAt: new Date().toISOString()
        };
        console.log("准备创建课程记录:", lessonRecord);
        const docRef = await addDoc(collection(db, "lessonRecords"), lessonRecord);
        console.log("课程记录创建成功，ID:", docRef.id);
        
        // 更新课程状态为已完成
        await updateScheduleStatus(formData.lessonDate, formData.lessonTime, clientId);
        
        // 如果有配套ID，更新配套剩余次数
        if (packageId) {
          await updatePackageRemainingSessions(packageId);
        }
        
        onSuccess(docRef.id);
      }
    } catch (error: unknown) {
      console.error(isEditing ? "更新课程记录失败:" : "创建课程记录失败:", error);
      let errorMessage = t('operationFailed');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // 处理Firebase特定错误
      if (error.code === 'permission-denied') {
        errorMessage = "权限不足，请检查Firebase配置";
      } else if (error.code === 'unavailable') {
        errorMessage = "网络连接失败，请检查网络";
      } else if (error.code === 'invalid-argument') {
        errorMessage = "数据格式错误，请检查输入";
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 基本信息 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            {t('courseDate')}
          </label>
          <input
            type="date"
            name="lessonDate"
            value={formData.lessonDate}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#23232a',
              color: '#fff',
              fontSize: 14
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            {t('courseStartTime')}
          </label>
          <input
            type="time"
            name="lessonTime"
            value={formData.lessonTime}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#23232a',
              color: '#fff',
              fontSize: 14
            }}
          />
        </div>
      </div>



      {/* 训练模式 */}
      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
                      {t('trainingMode')}
        </label>
        <select
          name="trainingMode"
          value={formData.trainingMode || ''}
          onChange={handleInputChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
        >
          <option value="">{t('selectTrainingMode')}</option>
          <option value="progressive">渐进负荷</option>
          <option value="pyramid">金字塔训练</option>
          <option value="superset">超级组</option>
          <option value="circuit">循环训练</option>
          <option value="drop">递减组</option>
        </select>
      </div>

      {/* 动作部分 */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ color: '#a1a1aa', fontSize: 12 }}>
            {t('actionTraining')}
          </label>
        </div>

        {exerciseActions.map((action, index) => (
          <div key={action.id} style={{ 
            background: '#18181b', 
            border: '1px solid #333', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 12 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                {t('action')}{index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeExerciseAction(action.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#a1a1aa', fontSize: 12 }}>
                {t('selectCategory')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6, marginBottom: 12 }}>
                {categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => updateExerciseAction(action.id, 'category', category.value)}
                    style={{
                      background: action.category === category.value ? '#60a5fa' : '#23232a',
                      color: action.category === category.value ? '#18181b' : '#a1a1aa',
                      border: '1px solid #333',
                      borderRadius: 6,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: action.category === category.value ? 600 : 400,
                      transition: 'all 0.2s'
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              
              <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
                {t('selectAction')}
              </label>
              <ExerciseSelector
                category={action.category}
                value={action.exercise}
                onChange={(value) => updateExerciseAction(action.id, 'exercise', value)}
                placeholder={t('selectAction')}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#a1a1aa', fontSize: 12 }}>
                {t('weight')} (kg)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {action.weights.map((weight, weightIndex) => (
                  <div key={weightIndex}>
                    <label style={{ display: 'block', marginBottom: 4, color: '#71717a', fontSize: 11 }}>
                      {t('group')} {weightIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => updateWeight(action.id, weightIndex, e.target.value)}
                      placeholder={t('weight')}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #333',
                        background: '#23232a',
                        color: '#fff',
                        fontSize: 14
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newWeights = [...action.weights, ''];
                  updateExerciseAction(action.id, 'weights', newWeights);
                }}
                style={{
                  background: '#60a5fa',
                  color: '#18181b',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 8
                }}
              >
                + {t('addGroup')}
              </button>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addExerciseAction}
          style={{
            background: '#60a5fa',
            color: '#18181b',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            marginTop: 12
          }}
        >
          + {t('addAction')}
        </button>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
          {t('coachRecord')}
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder={t('coachRecordPlaceholder')}
          style={{
            width: '100%',
            minHeight: 80,
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
          {t('studentPerformance')}
        </label>
        <textarea
          name="performance"
          value={formData.performance}
          onChange={handleInputChange}
          placeholder={t('studentPerformancePlaceholder')}
          style={{
            width: '100%',
            minHeight: 80,
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
          {t('nextGoal')}
        </label>
        <textarea
          name="nextGoals"
          value={formData.nextGoals}
          onChange={handleInputChange}
          placeholder={t('nextGoalPlaceholder')}
          style={{
            width: '100%',
            minHeight: 80,
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
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
          type="submit"
          disabled={saving}
          style={{
            background: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? t('saving') : (isEditing ? t('update') : t('save'))}
        </button>
      </div>

      {/* 模板选择器 */}
      {showTemplateSelector && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: 8,
            padding: 20,
            maxWidth: 600,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>选择模板</h3>
            
            {/* 配套模板选择 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#a1a1aa', fontSize: 12 }}>
                配套模板 (可选)
              </label>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 4,
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: 14
                }}
              >
                <option value="">不选择配套</option>
                {packageTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.totalSessions}课时
                  </option>
                ))}
              </select>
            </div>

            {/* 训练动作模板选择 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#a1a1aa', fontSize: 12 }}>
                训练动作模板 (可多选)
              </label>
              <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #333', borderRadius: 4, padding: 8 }}>
                {exerciseTemplates.length === 0 ? (
                  <div style={{ color: '#a1a1aa', fontSize: 12, textAlign: 'center', padding: 20 }}>
                    还没有训练动作模板，请先在模板管理中创建
                  </div>
                ) : (
                  exerciseTemplates.map((template) => (
                    <div key={template.id} style={{ marginBottom: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={selectedExercises.includes(template.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExercises(prev => [...prev, template.id]);
                            } else {
                              setSelectedExercises(prev => prev.filter(id => id !== template.id));
                            }
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <span>{template.name}</span>
                        <span style={{ color: '#a1a1aa', fontSize: 12 }}>
                          ({template.sets}组 × {template.reps})
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowTemplateSelector(false)}
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
                取消
              </button>
              <button
                type="button"
                onClick={applyTemplate}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                应用模板
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 