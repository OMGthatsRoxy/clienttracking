"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { CustomExercise } from "@/types/exercise";
import { EXERCISE_CATEGORIES } from "@/types/exercise";

interface ExerciseSelectorProps {
  category: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ExerciseSelector({
  category,
  value,
  onChange,
  placeholder = "选择动作"
}: ExerciseSelectorProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'preset' | 'custom' | null>(null);

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

  // 实时监听所有动作（包括预设和自定义）
  useEffect(() => {
    if (!user || !category) return;

    setLoading(true);
    
    // 设置exercises集合实时监听
    const exercisesQuery = query(
      collection(db, "exercises"),
      where("coachId", "==", user.uid),
      where("category", "==", category),
      where("isActive", "==", true)
    );
    
    const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // 设置所有动作（包括预设和自定义）
      setCustomExercises(exercises);
      
      // 调试信息
      console.log(`📊 ${category} 部位动作统计:`, {
        total: exercises.length,
        preset: exercises.filter(ex => ex.isPreset).length,
        custom: exercises.filter(ex => !ex.isPreset).length,
        exercises: exercises.map(ex => ({ name: ex.name, isPreset: ex.isPreset }))
      });
      
      setLoading(false);
    }, (error) => {
      console.error("获取动作失败:", error);
      setLoading(false);
    });

    // 清理监听器
    return () => {
      unsubscribe();
    };
  }, [user, category]);

  // 添加新自定义动作
  const handleAddCustomExercise = async () => {
    if (!user || !newExerciseName.trim() || !category) return;

    setSaving(true);
    try {
      const customExerciseData = {
        coachId: user.uid,
        name: newExerciseName.trim(),
        category: category,
        isPreset: false, // 标记为自定义动作
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "exercises"), customExerciseData);
      
      // 选择新添加的动作
      onChange(newExerciseName.trim());
      setNewExerciseName("");
      setShowAddForm(false);
      
      // 显示成功提示
      console.log("✅ 动作添加成功:", newExerciseName.trim());
    } catch (error) {
      console.error("❌ 添加自定义动作失败:", error);
      alert(t('operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 删除自定义动作
  const handleDeleteCustomExercise = async (exerciseId: string, exerciseName: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "exercises", exerciseId));
      
      // 如果删除的是当前选中的动作，清空选择
      if (value === exerciseName) {
        onChange("");
      }
      
      setShowDeleteConfirm(null);
      setDeleteType(null);
      console.log("✅ 自定义动作删除成功:", exerciseName);
    } catch (error) {
      console.error("❌ 删除自定义动作失败:", error);
      alert(t('operationFailed'));
    }
  };

  // 删除预设动作
  const handleDeletePresetExercise = async (exerciseName: string) => {
    if (!user) return;

    try {
      // 直接删除预设动作（不再记录到deletedPresetExercises）
      const exercisesQuery = query(
        collection(db, "exercises"),
        where("coachId", "==", user.uid),
        where("category", "==", category),
        where("name", "==", exerciseName),
        where("isPreset", "==", true)
      );
      const snapshot = await getDocs(exercisesQuery);
      
      if (!snapshot.empty) {
        await deleteDoc(doc(db, "exercises", snapshot.docs[0].id));
      }
      
      // 如果删除的是当前选中的动作，清空选择
      if (value === exerciseName) {
        onChange("");
      }
      
      setShowDeleteConfirm(null);
      setDeleteType(null);
      console.log("✅ 预设动作删除成功:", exerciseName);
    } catch (error) {
      console.error("❌ 删除预设动作失败:", error);
      alert(t('operationFailed'));
    }
  };

  // 获取当前分类的所有动作（从exercises集合）
  const allExercises = customExercises
    .sort((a, b) => {
      // 按创建时间倒序排列（最新的在最上面）
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .map((ex, index) => ({
      name: ex.name,
      id: ex.id,
      index: index
    }));

  // 获取要删除的动作名称
  const getDeleteExerciseName = () => {
    if (deleteType === 'preset') {
      return showDeleteConfirm;
    } else if (deleteType === 'custom') {
      const exercise = customExercises.find(ex => ex.id === showDeleteConfirm);
      return exercise?.name;
    }
    return null;
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
          disabled={loading}
        >
          <option value="">{loading ? '加载中...' : placeholder}</option>
          
          {/* 合并显示所有动作 */}
          {allExercises.map((exercise) => {
            // 使用更稳定的key生成方式
            const uniqueKey = exercise.id || `exercise-${category}-${exercise.index}`;
            return (
              <option key={uniqueKey} value={exercise.name}>
                {exercise.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* 添加新动作按钮 */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{
            background: '#374151',
            color: '#fff',
            border: '1px solid #4b5563',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {t('addNewExercise')}
        </button>
      </div>

      {/* 添加新动作表单 */}
      {showAddForm && (
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
            background: '#18181b',
            borderRadius: 8,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            border: '1px solid #333'
          }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>
              {t('addNewExercise')}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder={t('enterExerciseName')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 4,
                  border: '1px solid #333',
                  background: '#23232a',
                  color: '#fff',
                  fontSize: 14
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newExerciseName.trim()) {
                    handleAddCustomExercise();
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewExerciseName("");
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
                取消
              </button>
              <button
                type="button"
                onClick={handleAddCustomExercise}
                disabled={saving || !newExerciseName.trim()}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: saving || !newExerciseName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: saving || !newExerciseName.trim() ? 0.6 : 1
                }}
              >
                {saving ? '保存中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 动作管理模态框 */}
      {showDeleteConfirm === 'manage' && (
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
            background: '#18181b',
            borderRadius: 8,
            padding: 24,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>
              管理动作库
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 12 }}>
                所有动作：
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 8
              }}>
                {customExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    style={{
                      background: exercise.isPreset ? '#23232a' : '#374151',
                      padding: '8px 12px',
                      borderRadius: 4,
                      border: exercise.isPreset ? '1px solid #333' : '1px solid #4b5563',
                      color: '#fff',
                      fontSize: 12,
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    {exercise.name}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(exercise.id);
                        setDeleteType(exercise.isPreset ? 'preset' : 'custom');
                      }}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteType(null);
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
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteConfirm && showDeleteConfirm !== 'manage' && (
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
          zIndex: 1001
        }}>
          <div style={{
            background: '#18181b',
            borderRadius: 8,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            border: '1px solid #333'
          }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>
              确认删除
            </h3>
            
            <p style={{ color: '#a1a1aa', marginBottom: 16 }}>
              {deleteType === 'preset' 
                ? `确定要从预设动作中移除: "${showDeleteConfirm}" 吗？`
                : `确定要删除动作 "${getDeleteExerciseName()}" 吗？`
              }
            </p>

            {/* 调试信息 */}
            <div style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
              调试: showDeleteConfirm={showDeleteConfirm}, deleteType={deleteType}, exerciseName={getDeleteExerciseName()}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteType(null);
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
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('确认删除按钮点击:', { deleteType, showDeleteConfirm, exerciseName: getDeleteExerciseName() });
                  if (deleteType === 'preset') {
                    handleDeletePresetExercise(showDeleteConfirm);
                  } else if (deleteType === 'custom') {
                    const exerciseName = getDeleteExerciseName();
                    if (exerciseName) {
                      handleDeleteCustomExercise(showDeleteConfirm, exerciseName);
                    } else {
                      console.error('无法获取自定义动作名称');
                    }
                  }
                }}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 