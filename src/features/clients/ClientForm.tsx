"use client";
import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";

const initialState = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
  goal: "",
  // 配套相关字段 - 现在是必填
  packageTotalSessions: "",
  packageTotalAmount: "",
  packageStartDate: "",
  packageValidUntil: "",
  packageNotes: "",
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

export default function ClientForm({ onSuccess }: { onSuccess?: (clientName: string) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 创建客户
      const clientRef = await addDoc(collection(db, "clients"), {
        name: form.name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
        goal: form.goal,
        coachId: user.uid,
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
      });

      // 创建配套（现在是必填）
      if (form.packageTotalSessions) {
        const now = new Date();
        const isExpired = form.packageValidUntil && new Date(form.packageValidUntil) < now;
        const totalSessions = Number(form.packageTotalSessions);
        const totalAmount = Number(form.packageTotalAmount);
        
        // 使用本地时区生成日期
        const getLocalDate = () => {
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        // 生成本地时区的ISO字符串
        const getLocalISOString = () => {
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
        };
        
        const packageData = {
          clientId: clientRef.id,
          coachId: user.uid, // 添加教练ID
          startDate: form.packageStartDate || getLocalDate(),
          validUntil: form.packageValidUntil,
          totalSessions,
          totalAmount,
          remainingSessions: totalSessions,
          isExpired,
          notes: form.packageNotes,
          createdAt: getLocalISOString(), // 添加创建时间
          updatedAt: getLocalISOString(), // 添加更新时间
        };
        
        // 创建配套数据
        
        await addDoc(collection(db, "packages"), packageData);
      }

      setForm(initialState);
      if (onSuccess) onSuccess(form.name);
    } catch (err: any) {
      setError(t('operationFailed') + (err.message || t('unknown')));
    }
    setLoading(false);
  };

  // 通用输入框样式
  const inputStyle = {
    width: '100%',
    padding: '8px 12px', // 减少内边距
    borderRadius: 6, // 减小圆角
    border: '1px solid #333',
    background: '#23232a',
    color: '#fff',
    fontSize: 'clamp(13px, 2.5vw, 14px)', // 响应式字体
    outline: 'none'
  };

  // 通用标签样式
  const labelStyle = {
    display: 'block',
    marginBottom: 4,
    color: '#a1a1aa',
    fontSize: 'clamp(12px, 2.5vw, 14px)' // 响应式字体
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <h2 style={{ 
        fontSize: "clamp(16px, 3vw, 20px)", // 响应式字体
        marginBottom: 12, // 减少底部间距
        textAlign: "center"
      }}>{t('newClient')}</h2>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('clientName')}</label>
        <input 
          name="name" 
          placeholder={t('clientName')} 
          value={form.name} 
          onChange={handleChange} 
          required 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('phone')}</label>
        <input 
          name="phone" 
          placeholder={t('phone')} 
          value={form.phone} 
          onChange={handleChange} 
          required 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('email')}</label>
        <input 
          name="email" 
          placeholder={t('email')} 
          value={form.email} 
          onChange={handleChange} 
          required 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('gender')}</label>
        <select 
          name="gender" 
          value={form.gender} 
          onChange={handleChange} 
          style={inputStyle}
        >
          {genderOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? t(option.label as any) : t('selectGender')}
            </option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('age')}</label>
        <input 
          name="age" 
          type="text" 
          placeholder={t('selectAge')} 
          value={form.age} 
          onChange={handleChange} 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('height')}</label>
        <input 
          name="height" 
          type="text" 
          placeholder={t('selectHeight')} 
          value={form.height} 
          onChange={handleChange} 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('weight')}</label>
        <input 
          name="weight" 
          type="text" 
          placeholder={t('selectWeight')} 
          value={form.weight} 
          onChange={handleChange} 
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <label style={labelStyle}>{t('goal')}</label>
        <select 
          name="goal" 
          value={form.goal} 
          onChange={handleChange} 
          style={inputStyle}
        >
          {goalOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? t(option.label) : t(option.label)}
            </option>
          ))}
        </select>
      </div>

      {/* 配套部分 - 必填 */}
      <div style={{ 
        marginTop: 16, // 减少顶部间距
        marginBottom: 12, // 减少底部间距
        paddingTop: 12, // 减少内边距
        borderTop: '1px solid #333' 
      }}>
        
        <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
          <label style={labelStyle}>{t('courseCount')}</label>
          <input 
            name="packageTotalSessions" 
            type="text" 
            placeholder={t('courseCount')} 
            value={form.packageTotalSessions} 
            onChange={handleChange} 
            required
            style={inputStyle}
          />
        </div>
        
        <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
          <label style={labelStyle}>{t('totalAmount')}</label>
          <input 
            name="packageTotalAmount" 
            type="text" 
            placeholder={t('totalAmount')} 
            value={form.packageTotalAmount} 
            onChange={handleChange} 
            required
            style={inputStyle}
          />
        </div>
        
        <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
          <label style={labelStyle}>{t('startDate')}</label>
          <input 
            name="packageStartDate" 
            type="date" 
            placeholder={t('startDate')} 
            value={form.packageStartDate} 
            onChange={handleChange} 
            required
            style={inputStyle}
          />
        </div>
        
        <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
          <label style={labelStyle}>{t('expiryDate')}</label>
          <input 
            name="packageValidUntil" 
            type="date" 
            placeholder={t('expiryDate')} 
            value={form.packageValidUntil} 
            onChange={handleChange} 
            style={inputStyle}
          />
        </div>
        
        <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
          <label style={labelStyle}>{t('notes')}</label>
          <textarea 
            name="packageNotes" 
            placeholder={t('notes')} 
            value={form.packageNotes} 
            onChange={handleChange} 
            style={{ 
              ...inputStyle,
              minHeight: 50, // 减少最小高度
              resize: 'vertical'
            }} 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        style={{
          width: "100%",
          padding: "8px 12px", // 减少内边距
          borderRadius: 6, // 减小圆角
          background: "#60a5fa",
          color: "#18181b",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "clamp(13px, 2.5vw, 14px)" // 响应式字体
        }}
      >
        {loading ? t('loading') : t('addClient')}
      </button>
      {error && (
        <p style={{ 
          color: "red", 
          fontSize: "clamp(11px, 2.5vw, 12px)", // 响应式字体
          marginTop: 8, // 减少顶部间距
          textAlign: "center"
        }}>
          {error}
        </p>
      )}
    </form>
  );
}
