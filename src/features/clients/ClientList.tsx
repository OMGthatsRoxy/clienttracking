"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Client } from "@/types/client";
import PackageList from "@/features/packages/PackageList";
import PackageForm from "@/features/packages/PackageForm";

export default function ClientList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPackageForm, setShowPackageForm] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      setLoading(true);
      const q = query(collection(db, "clients"), where("coachId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      setLoading(false);
    };
    fetchClients();
  }, [user]);

  if (!user) return null;
  if (loading) return <div style={{ color: '#a1a1aa' }}>加载中...</div>;

  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>客户列表</h2>
      {clients.length === 0 ? (
        <div style={{ color: '#a1a1aa' }}>暂无客户，请添加新客户。</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {clients.map(client => (
            <li key={client.id} className="form-card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{client.name}</div>
              <div style={{ color: '#a1a1aa', fontSize: 14 }}>电话：{client.phone} | 邮箱：{client.email}</div>
              <div style={{ color: '#a1a1aa', fontSize: 14 }}>目标：{client.goal}</div>
              <button
                style={{ margin: '12px 0 8px 0', background: '#23232a', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}
                onClick={() => setShowPackageForm(showPackageForm === client.id ? null : client.id)}
              >
                {showPackageForm === client.id ? '关闭配套表单' : '添加配套'}
              </button>
              {showPackageForm === client.id && (
                <PackageForm clientId={client.id} onSuccess={() => setShowPackageForm(null)} />
              )}
              <PackageList clientId={client.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}