"use client";
import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { appStyles } from "@/lib/styles";

const initialState = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
  goal: "",
  source: "",
  notes: "",
};

// 选项数据
const genderOptions = [
  { value: "", label: "selectGender" },
  { value: "male", label: "male" },
  { value: "female", label: "female" },
  { value: "other", label: "other" }
];

const ageOptions = [
  { value: "", label: "selectAge" },
  ...Array.from({ length: 83 }, (_, i) => ({ 
    value: (i + 18).toString(), 
    label: (i + 18).toString() 
  }))
];

const heightOptions = [
  { value: "", label: "selectHeight" },
  ...Array.from({ length: 83 }, (_, i) => ({ 
    value: (i + 140).toString(), 
    label: `${i + 140} cm` 
  }))
];

const weightOptions = [
  { value: "", label: "selectWeight" },
  ...Array.from({ length: 121 }, (_, i) => ({ 
    value: (i + 40).toString(), 
    label: `${i + 40} kg` 
  }))
];

const goalOptions = [
  { value: "", label: "selectGoal" },
  { value: "weightLoss", label: "weightLoss" },
  { value: "muscleGain", label: "muscleGain" },
  { value: "endurance", label: "endurance" },
  { value: "flexibility", label: "flexibility" },
  { value: "generalFitness", label: "generalFitness" }
];

const sourceOptions = [
  { value: "", label: "selectSource" },
  { value: "朋友推荐", label: "friendRecommendation" },
  { value: "社交媒体", label: "socialMedia" },
  { value: "广告", label: "advertisement" },
  { value: "网站", label: "website" },
  { value: "其他", label: "other" }
];

export default function ProspectForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 测试Firebase连接
  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        console.log("=== Firebase连接测试 ===");
        console.log("当前用户:", user);
        console.log("用户ID:", user?.uid);
        console.log("Firebase实例:", db);
        console.log("Firebase应用:", db.app);
        console.log("Firebase项目ID:", db.app.options.projectId);
        console.log("========================");
      } catch (err) {
        console.error("Firebase连接测试失败:", err);
      }
    };
    
    testFirebaseConnection();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 检查用户是否已登录
      if (!user) {
        throw new Error("用户未登录，请重新登录");
      }
      
      const now = new Date();
      const prospectData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gender: form.gender || "",
        age: form.age ? Number(form.age) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        goal: form.goal || "",
        source: form.source || "",
        notes: form.notes.trim(),
        status: 'new' as const,
        coachId: user.uid,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      
      // 验证必填字段
      if (!prospectData.name || !prospectData.phone || !prospectData.email) {
        throw new Error("请填写姓名、电话和邮箱");
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(prospectData.email)) {
        throw new Error("请输入有效的邮箱地址");
      }
      
      console.log("准备添加潜在客户数据:", prospectData);
      
      await addDoc(collection(db, "prospects"), prospectData);
      console.log("潜在客户添加成功");
      setForm(initialState);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("添加潜在客户错误:", err);
      let errorMessage = err.message || t('unknown');
      
      // 处理Firebase特定错误
      if (err.code === 'permission-denied') {
        errorMessage = "权限不足，请检查Firebase配置";
      } else if (err.code === 'unavailable') {
        errorMessage = "网络连接失败，请检查网络";
      } else if (err.code === 'invalid-argument') {
        errorMessage = "数据格式错误，请检查输入";
      }
      
      setError(t('operationFailed') + ": " + errorMessage);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: '0 0 24px 0' }}>{t('addProspect')}</h2>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('prospectName')} *</label>
        <input 
          name="name" 
          placeholder={t('enterProspectName')} 
          value={form.name} 
          onChange={handleChange} 
          required 
          style={appStyles.formInput}
        />
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('phone')} *</label>
        <input 
          name="phone" 
          placeholder={t('enterPhone')} 
          value={form.phone} 
          onChange={handleChange} 
          required 
          style={appStyles.formInput}
        />
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('email')} *</label>
        <input 
          name="email" 
          placeholder={t('enterEmail')} 
          value={form.email} 
          onChange={handleChange} 
          required 
          style={appStyles.formInput}
        />
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('gender')}</label>
        <select name="gender" value={form.gender} onChange={handleChange} style={appStyles.formInput}>
          {genderOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? t(option.label) : t(option.label)}
            </option>
          ))}
        </select>
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('age')}</label>
        <select name="age" value={form.age} onChange={handleChange} style={appStyles.formInput}>
          {ageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? option.label : t(option.label)}
            </option>
          ))}
        </select>
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('height')}</label>
        <select name="height" value={form.height} onChange={handleChange} style={appStyles.formInput}>
          {heightOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? option.label : t(option.label)}
            </option>
          ))}
        </select>
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('weight')}</label>
        <select name="weight" value={form.weight} onChange={handleChange} style={appStyles.formInput}>
          {weightOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? option.label : t(option.label)}
            </option>
          ))}
        </select>
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('goal')}</label>
        <select name="goal" value={form.goal} onChange={handleChange} style={appStyles.formInput}>
          {goalOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? t(option.label) : t(option.label)}
            </option>
          ))}
        </select>
      </div>

      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('source')}</label>
        <select name="source" value={form.source} onChange={handleChange} style={appStyles.formInput}>
          {sourceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? t(option.label) : t(option.label)}
            </option>
          ))}
        </select>
      </div>
      
      <div style={appStyles.formGroup}>
        <label style={appStyles.formLabel}>{t('notes')}</label>
        <textarea 
          name="notes" 
          placeholder={t('enterNotes')} 
          value={form.notes} 
          onChange={handleChange} 
          style={{ 
            ...appStyles.formInput,
            minHeight: 60,
            resize: 'vertical'
          }} 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        style={{
          width: '100%',
          ...appStyles.primaryButton,
          background: loading ? '#6b7280' : appStyles.primaryButton.background,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? t('adding') : t('addProspect')}
      </button>
      {error && <p style={{ color: "#ef4444", marginTop: 12, fontSize: 14 }}>{error}</p>}
    </form>
  );
} 