"use client";
import { useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { ExerciseTemplate } from "@/types/coach";

interface ExerciseTemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: ExerciseTemplate; // 编辑时传入
}

export default function ExerciseTemplateForm({
  onSuccess,
  onCancel,
  template
}: ExerciseTemplateFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    category: template?.category || "upper_body",
    target: template?.target || "strength",
    description: template?.description || "",
    sets: template?.sets || 3,
    reps: template?.reps || "8-12",
    weightRange: template?.weightRange || "",
    restTime: template?.restTime || "60秒",
    notes: template?.notes || "",
    isPublic: template?.isPublic || false
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const exerciseTemplate: Omit<ExerciseTemplate, 'id'> = {
        coachId: user.uid,
        name: formData.name,
        category: formData.category as ExerciseTemplate['category'],
        target: formData.target as ExerciseTemplate['target'],
        description: formData.description,
        sets: Number(formData.sets),
        reps: formData.reps,
        weightRange: formData.weightRange || undefined,
        restTime: formData.restTime,
        notes: formData.notes || undefined,
        isPublic: formData.isPublic,
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (template) {
        // 更新现有模板
        await updateDoc(doc(db, "exerciseTemplates", template.id), exerciseTemplate);
      } else {
        // 创建新模板
        await addDoc(collection(db, "exerciseTemplates"), exerciseTemplate);
      }
      
      onSuccess();
    } catch (error) {
      console.error("保存训练动作模板失败:", error);
      alert(t('operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            动作名称 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="例如：深蹲、卧推、引体向上"
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
            身体部位 *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
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
            <option value="upper_body">上肢</option>
            <option value="lower_body">下肢</option>
            <option value="core">核心</option>
            <option value="full_body">全身</option>
            <option value="cardio">有氧</option>
            <option value="flexibility">柔韧性</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            训练目标 *
          </label>
          <select
            name="target"
            value={formData.target}
            onChange={handleInputChange}
            required
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
            <option value="strength">力量</option>
            <option value="endurance">耐力</option>
            <option value="flexibility">柔韧性</option>
            <option value="coordination">协调性</option>
            <option value="balance">平衡性</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            组数 *
          </label>
          <input
            type="number"
            name="sets"
            value={formData.sets}
            onChange={handleInputChange}
            required
            min="1"
            max="10"
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            次数/时长 *
          </label>
          <input
            type="text"
            name="reps"
            value={formData.reps}
            onChange={handleInputChange}
            required
            placeholder="例如：8-12次、30秒、至力竭"
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
            重量范围
          </label>
          <input
            type="text"
            name="weightRange"
            value={formData.weightRange}
            onChange={handleInputChange}
            placeholder="例如：20-30kg、自重"
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

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
          休息时间 *
        </label>
        <input
          type="text"
          name="restTime"
          value={formData.restTime}
          onChange={handleInputChange}
          required
          placeholder="例如：60秒、90秒"
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
          动作描述 *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="详细描述动作要领和注意事项"
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
          备注
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="其他注意事项或变体动作"
          style={{
            width: '100%',
            minHeight: 60,
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#23232a',
            color: '#fff',
            fontSize: 14
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          name="isPublic"
          checked={formData.isPublic}
          onChange={handleInputChange}
          style={{ width: 16, height: 16 }}
        />
        <label style={{ color: '#a1a1aa', fontSize: 12 }}>
          公开分享此模板（其他教练可见）
        </label>
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
          {saving ? t('saving') : (template ? '更新' : '创建')}
        </button>
      </div>
    </form>
  );
} 