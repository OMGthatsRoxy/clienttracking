"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useAuth } from "@/features/auth/AuthProvider";

const initialState = {
  startDate: "",
  validUntil: "",
  totalSessions: "",
  totalAmount: "",
  notes: "",
};

export default function PackageForm({ clientId, onSuccess }: { clientId: string, onSuccess?: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const isExpired = form.validUntil && new Date(form.validUntil) < now;
      const totalSessions = Number(form.totalSessions);
      const totalAmount = Number(form.totalAmount);
      
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
        clientId,
        coachId: user?.uid,
        startDate: form.startDate || getLocalDate(),
        validUntil: form.validUntil,
        totalSessions,
        totalAmount,
        remainingSessions: totalSessions,
        isExpired,
        notes: form.notes,
        createdAt: getLocalISOString(),
        updatedAt: getLocalISOString(),
      };
      
      console.log('创建配套数据:', packageData);
      
      const docRef = await addDoc(collection(db, "packages"), packageData);
      console.log('配套创建成功，ID:', docRef.id);
      setForm(initialState);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(t('operationFailed') + (err.message || t('unknown')));
    }
    setLoading(false);
  };

  return (
    <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h2>{t('addPackage')}</h2>
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="totalSessions">{t('totalSessions')}</label>
      <input id="totalSessions" name="totalSessions" type="number" placeholder={t('totalSessions')} value={form.totalSessions} onChange={handleChange} required />
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="totalAmount">{t('totalAmount')}</label>
      <input id="totalAmount" name="totalAmount" type="number" step="0.01" placeholder={t('totalAmount')} value={form.totalAmount} onChange={handleChange} required />
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="startDate">{t('startDate')}</label>
      <input id="startDate" name="startDate" type="date" placeholder={t('startDate')} value={form.startDate} onChange={handleChange} />
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="validUntil">{t('expiryDate')}</label>
      <input id="validUntil" name="validUntil" type="date" placeholder={t('expiryDate')} value={form.validUntil} onChange={handleChange} />
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="notes">{t('notes')}</label>
      <textarea 
        id="notes" 
        name="notes" 
        placeholder={t('notes')} 
        value={form.notes} 
        onChange={handleChange} 
        onFocus={(e) => {
          e.target.style.outline = '2px solid #60a5fa';
        }}
        onBlur={(e) => {
          e.target.style.outline = '1.5px solid #333';
        }}
        style={{ 
          width: '100%',
          padding: '0.7rem 1rem',
          marginBottom: '1rem',
          border: 'none',
          borderRadius: '8px',
          background: '#18181b',
          color: '#f4f4f5',
          outline: '1.5px solid #333',
          transition: 'outline 0.2s',
          minHeight: 60,
          resize: 'vertical',
          fontFamily: 'inherit',
          fontSize: '1rem'
        }} 
      />
      <button type="submit" disabled={loading}>{loading ? t('loading') : t('addPackage')}</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}