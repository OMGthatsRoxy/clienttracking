"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Client } from "@/types/client";
import type { Package } from "@/types/package";

const initialState = {
  clientId: "",
  packageId: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
};

function isExpired(validUntil: string) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

export default function ScheduleForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 获取客户列表
  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      const q = query(collection(db, "clients"), where("coachId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    };
    fetchClients();
  }, [user]);

  // 当客户选择改变时，获取该客户的配套信息
  useEffect(() => {
    if (!form.clientId) {
      setPackages([]);
      setForm(prev => ({ ...prev, packageId: "" }));
      return;
    }

    const fetchPackages = async () => {
      const q = query(collection(db, "packages"), where("clientId", "==", form.clientId));
      const querySnapshot = await getDocs(q);
      const clientPackages = querySnapshot.docs.map(doc => {
        const data = doc.data() as Package;
        return {
          ...data,
          id: doc.id,
          isExpired: isExpired(data.validUntil),
        };
      }).filter(pkg => !pkg.isExpired && pkg.remainingSessions > 0); // 只显示未过期且还有剩余课时的配套
      
      setPackages(clientPackages);
      // 如果当前选择的配套不在新的配套列表中，清空配套选择
      if (form.packageId && !clientPackages.find(pkg => pkg.id === form.packageId)) {
        setForm(prev => ({ ...prev, packageId: "" }));
      }
    };

    fetchPackages();
  }, [form.clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "schedules"), {
        ...form,
        coachId: user.uid,
        reminderSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setForm(initialState);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError("添加失败：" + (err.message || "未知错误"));
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      <h2>新增课程</h2>
      
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="clientId">选择客户</label>
      <select 
        id="clientId" 
        name="clientId" 
        value={form.clientId} 
        onChange={handleChange} 
        required 
        style={{ width: '100%', padding: '0.7rem 1rem', marginBottom: '1rem', border: 'none', borderRadius: 8, background: '#18181b', color: '#f4f4f5', outline: '1.5px solid #333' }}
      >
        <option value="">请选择客户</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>

      {form.clientId && (
        <>
          <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="packageId">选择配套</label>
          <select 
            id="packageId" 
            name="packageId" 
            value={form.packageId} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '0.7rem 1rem', marginBottom: '1rem', border: 'none', borderRadius: 8, background: '#18181b', color: '#f4f4f5', outline: '1.5px solid #333' }}
          >
            <option value="">请选择配套（可选）</option>
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.totalSessions}课时 - 剩余{pkg.remainingSessions}课时 - ¥{pkg.totalAmount?.toFixed(2) || '0.00'}
              </option>
            ))}
          </select>
          
          {packages.length === 0 && (
            <div style={{ color: '#f87171', fontSize: 14, marginBottom: '1rem' }}>
              该客户暂无可用配套或所有配套已过期/用完
            </div>
          )}
        </>
      )}

      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="startTime">开始时间</label>
      <input id="startTime" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} required />
      
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="endTime">结束时间</label>
      <input id="endTime" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} required />
      
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="location">上课地点</label>
      <input id="location" name="location" placeholder="上课地点" value={form.location} onChange={handleChange} />
      
      <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa' }} htmlFor="notes">备注</label>
      <textarea id="notes" name="notes" placeholder="备注" value={form.notes} onChange={handleChange} style={{ minHeight: 60, marginBottom: 12 }} />
      
      <button type="submit" disabled={loading}>{loading ? "提交中..." : "添加课程"}</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
} 