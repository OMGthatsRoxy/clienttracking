"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLanguage } from "@/features/language/LanguageProvider";
import { useEffect, useState, use } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/types/client";
import Link from "next/link";
import PackageList from "@/features/packages/PackageList";
import PackageForm from "@/features/packages/PackageForm";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测移动设备
  useEffect(() => {
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
  
  // 解包params Promise
  const resolvedParams = use(params);

  useEffect(() => {
    if (!user || !resolvedParams.id) return;
    const fetchClient = async () => {
      setLoading(true);
      try {
        const clientDoc = await getDoc(doc(db, "clients", resolvedParams.id));
        if (clientDoc.exists()) {
          const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
          setClient(clientData);
        }
      } catch (error) {
        console.error("获取客户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [user, resolvedParams.id]);

  // 下拉菜单选项数据
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

  if (!user) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;
  if (!client) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;

  const handleEdit = () => {
    setEditForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      gender: client.gender,
      age: client.age,
      height: client.height,
      weight: client.weight,
      goal: client.goal,
      notes: client.notes
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!client) return;
    
    setSaving(true);
    try {
      const updateData = {
        ...editForm,
        age: editForm.age ? Number(editForm.age) : null,
        height: editForm.height ? Number(editForm.height) : null,
        weight: editForm.weight ? Number(editForm.weight) : null,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "clients", client.id), updateData);
      
      // 更新本地状态
      setClient({ ...client, ...updateData } as Client);
      setIsEditing(false);
      setEditForm({});
    } catch (error) {
      console.error("更新客户信息失败:", error);
      alert(t('operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <main className="page-content" style={{
        minHeight: "100vh",
        padding: isMobile ? "12px" : "24px",
        paddingBottom: "100px",
        background: "#18181b"
      }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* 头部导航 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: isMobile ? 16 : 32,
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: isMobile ? 8 : 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
            <h1 style={{ 
              color: "#fff", 
              fontSize: isMobile ? "clamp(20px, 5vw, 28px)" : "28px", 
              fontWeight: 700 
            }}>{client.name}</h1>
          </div>
          <div style={{ 
            display: "flex", 
            gap: isMobile ? 6 : 12,
            flexWrap: isMobile ? "wrap" : "nowrap"
          }}>
            {!isEditing && (
              <button 
                onClick={handleEdit}
                style={{ 
                  background: '#059669', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '8px 16px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                {t('edit')}
              </button>
            )}
            <Link href={`/client/${client.id}/lesson-records`}>
              <button 
                style={{ 
                  background: '#8b5cf6', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '8px 16px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                课程完整记录
              </button>
            </Link>
            <button 
              onClick={() => setShowPackageForm(!showPackageForm)}
              style={{ 
                background: '#60a5fa', 
                color: '#18181b', 
                border: 'none', 
                borderRadius: 8, 
                padding: '8px 16px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              {showPackageForm ? t('close') : t('addPackage')}
            </button>
          </div>
        </div>

        {/* 客户信息卡片 */}
        <div className="form-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{t('personalInfo')}</h2>
            {isEditing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={handleCancelEdit}
                  style={{ 
                    background: '#23232a', 
                    color: '#a1a1aa', 
                    border: '1px solid #333', 
                    borderRadius: 6, 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{ 
                    background: '#059669', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '6px 12px', 
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <>
              {/* 编辑模式 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('clientName')}</label>
                  <input 
                    name="name" 
                    value={editForm.name || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('phone')}</label>
                  <input 
                    name="phone" 
                    value={editForm.phone || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('email')}</label>
                  <input 
                    name="email" 
                    type="email"
                    value={editForm.email || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('gender')}</label>
                  <select 
                    name="gender" 
                    value={editForm.gender || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value ? t(option.label as keyof typeof t) : t(option.label as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('age')}</label>
                  <select 
                    name="age" 
                    value={editForm.age || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  >
                    {ageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value ? option.label : t(option.label as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('height')}</label>
                  <select 
                    name="height" 
                    value={editForm.height || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  >
                    {heightOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value ? option.label : t(option.label as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('weight')}</label>
                  <select 
                    name="weight" 
                    value={editForm.weight || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  >
                    {weightOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value ? option.label : t(option.label as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('goal')}</label>
                  <select 
                    name="goal" 
                    value={editForm.goal || ''} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  >
                    {goalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value ? t(option.label as keyof typeof t) : t(option.label as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#a1a1aa', fontSize: 12 }}>{t('notes')}</label>
                <textarea 
                  name="notes" 
                  value={editForm.notes || ''} 
                  onChange={handleInputChange}
                  style={{ width: '100%', minHeight: 60, padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', fontSize: 14 }}
                  placeholder={t('notes')}
                />
              </div>
            </>
          ) : (
            // 显示模式
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('clientName')}</p>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{client.name}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('phone')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.phone}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('email')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.email}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('gender')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.gender ? t(client.gender as keyof typeof t) : '-'}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('age')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.age || '-'}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('height')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.height ? `${client.height} cm` : '-'}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('weight')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.weight ? `${client.weight} kg` : '-'}</p>
              </div>
              <div style={{ padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
                <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('goal')}</p>
                <p style={{ color: "#fff", fontSize: 14 }}>{client.goal ? t(client.goal as keyof typeof t) : '-'}</p>
              </div>
            </div>
          )}
          
          {!isEditing && client.notes && (
            <div style={{ marginTop: 16, padding: '12px', background: '#23232a', borderRadius: 6, border: '1px solid #333' }}>
              <p style={{ color: "#a1a1aa", marginBottom: 4, fontSize: 12 }}>{t('notes')}</p>
              <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.4 }}>{client.notes}</p>
            </div>
          )}
        </div>

        {/* 配套表单弹窗 */}
        {showPackageForm && (
          <div 
            style={{
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
              padding: '20px',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPackageForm(false);
              }
            }}
          >
            <div style={{
              background: '#18181b',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #333',
              position: 'relative',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: 0 }}>
                  {t('addPackage')}
                </h2>
                <button
                  onClick={() => setShowPackageForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: 24,
                    cursor: 'pointer',
                    padding: 0,
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
              <PackageForm 
                clientId={client.id} 
                onSuccess={() => setShowPackageForm(false)} 
              />
            </div>
          </div>
        )}

        {/* 配套列表 */}
        <div className="form-card">
          <PackageList clientId={client.id} />
        </div>
      </div>
    </main>
    </>
  );
} 