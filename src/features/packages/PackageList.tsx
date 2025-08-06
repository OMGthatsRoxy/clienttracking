"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Package } from "@/types/package";
import { useLanguage } from "@/features/language/LanguageProvider";

function isExpired(validUntil: string) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

export default function PackageList({ clientId }: { clientId: string }) {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    
    setLoading(true);
    const q = query(collection(db, "packages"), where("clientId", "==", clientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => {
        const data = doc.data() as Package;
        return {
          ...data,
          id: doc.id,
          isExpired: isExpired(data.validUntil),
        };
      });
      setPackages(packagesData);
      setLoading(false);
    }, (error) => {
      console.error("获取配套数据失败:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm(t('confirmDeletePackage'))) return;
    
    setDeletingPackageId(packageId);
    try {
      await deleteDoc(doc(db, "packages", packageId));
      setPackages(packages.filter(pkg => pkg.id !== packageId));
    } catch (error) {
      console.error('Error deleting package:', error);
      alert(t('operationFailed'));
    } finally {
      setDeletingPackageId(null);
    }
  };

  if (loading) return <div style={{ color: '#a1a1aa' }}>{t('loading')}</div>;

  // 分离有效配套和已完成配套
  const activePackages = packages.filter(pkg => pkg.remainingSessions > 0 && !pkg.isExpired);
  const completedPackages = packages.filter(pkg => pkg.remainingSessions === 0 || pkg.isExpired);

  const renderPackageItem = (pkg: Package) => (
    <li key={pkg.id} className="form-card" style={{ 
      marginBottom: 8, 
      padding: '10px 12px',
      borderLeft: pkg.remainingSessions === 0 ? '4px solid #10b981' : pkg.isExpired ? '4px solid #f87171' : '4px solid #60a5fa' 
    }}>
      <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 2 }}>{t('totalSessions')}：{pkg.totalSessions}</div>
      <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 2 }}>{t('totalAmount')}：¥{pkg.totalAmount?.toFixed(2) || '0.00'}</div>
      <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 2 }}>{t('remainingSessions')}：{pkg.remainingSessions}</div>
      <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 2 }}>{t('startDate')}：{pkg.startDate}</div>
      <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 2 }}>{t('expiryDate')}：{pkg.validUntil}</div>
      <div style={{ 
        color: pkg.remainingSessions === 0 ? '#10b981' : pkg.isExpired ? '#f87171' : '#a1a1aa', 
        fontSize: 12, 
        marginBottom: 2,
        fontWeight: 600
      }}>
        {pkg.remainingSessions === 0 ? '已完成' : pkg.isExpired ? t('expired') : t('valid')}
      </div>
      {pkg.notes && <div style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}>{t('notes')}：{pkg.notes}</div>}
      
      <button
        onClick={() => handleDeletePackage(pkg.id!)}
        disabled={deletingPackageId === pkg.id}
        style={{
          background: 'none',
          color: '#dc2626',
          border: 'none',
          padding: 0,
          fontSize: 11,
          cursor: 'pointer',
          opacity: deletingPackageId === pkg.id ? 0.5 : 1,
          textDecoration: 'underline',
          marginTop: 4
        }}
      >
        {deletingPackageId === pkg.id ? t('loading') : t('delete')}
      </button>
    </li>
  );

  return (
    <div style={{ marginTop: 16 }}>
      {/* 有效配套 */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>
          有效配套 ({activePackages.length})
        </h3>
        {activePackages.length === 0 ? (
          <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>暂无有效配套</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activePackages.map(renderPackageItem)}
          </ul>
        )}
      </div>

      {/* 已完成配套 */}
      <div>
        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>
          已完成配套 ({completedPackages.length})
        </h3>
        {completedPackages.length === 0 ? (
          <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>暂无已完成配套</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {completedPackages.map(renderPackageItem)}
          </ul>
        )}
      </div>
    </div>
  );
}