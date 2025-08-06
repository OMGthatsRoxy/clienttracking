"use client";
import { useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import type { PackageTemplate } from "@/types/coach";

interface PackageTemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: PackageTemplate; // 编辑时传入
}

export default function PackageTemplateForm({
  onSuccess,
  onCancel,
  template
}: PackageTemplateFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    totalSessions: template?.totalSessions || 10,
    price: template?.price || 0,
    validityDays: template?.validityDays || 90,
    category: template?.category || "fitness",
    features: template?.features || [],
    notes: template?.notes || "",
    isPublic: template?.isPublic || false
  });
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const packageTemplate: Omit<PackageTemplate, 'id'> = {
        coachId: user.uid,
        name: formData.name,
        description: formData.description,
        totalSessions: Number(formData.totalSessions),
        price: Number(formData.price),
        validityDays: Number(formData.validityDays),
        category: formData.category as PackageTemplate['category'],
        features: formData.features,
        notes: formData.notes || undefined,
        isPublic: formData.isPublic,
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (template) {
        // 更新现有模板
        await updateDoc(doc(db, "packageTemplates", template.id), packageTemplate);
      } else {
        // 创建新模板
        await addDoc(collection(db, "packageTemplates"), packageTemplate);
      }
      
      onSuccess();
    } catch (error) {
      console.error("保存配套模板失败:", error);
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
            配套名称 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="例如：减脂套餐、增肌套餐"
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
            配套类型 *
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
            <option value="weight_loss">减脂</option>
            <option value="muscle_gain">增肌</option>
            <option value="rehabilitation">康复</option>
            <option value="fitness">健身</option>
            <option value="sports">运动专项</option>
            <option value="custom">自定义</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
            总课时 *
          </label>
          <input
            type="number"
            name="totalSessions"
            value={formData.totalSessions}
            onChange={handleInputChange}
            required
            min="1"
            max="100"
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
            价格 (元) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
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
            有效期 (天) *
          </label>
          <input
            type="number"
            name="validityDays"
            value={formData.validityDays}
            onChange={handleInputChange}
            required
            min="1"
            max="365"
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
          配套描述 *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="详细描述配套内容和目标"
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
          配套特色
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="添加特色功能"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#23232a',
              color: '#fff',
              fontSize: 14
            }}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <button
            type="button"
            onClick={addFeature}
            style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            添加
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {formData.features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: '#333',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {feature}
              <button
                type="button"
                onClick={() => removeFeature(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                  marginLeft: 4
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>
          备注
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="其他说明或注意事项"
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