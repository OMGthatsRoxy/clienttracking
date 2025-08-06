"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";

export default function TestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const testAddProspect = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const testData = {
        name: "测试用户",
        phone: "13800138000",
        email: "test@example.com",
        gender: "male",
        age: 25,
        height: 170,
        weight: 70,
        goal: "weightLoss",
        source: "朋友推荐",
        notes: "这是一个测试记录",
        status: 'new' as const,
        coachId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log("测试数据:", testData);
      console.log("Firebase实例:", db);
      console.log("用户ID:", user.uid);
      
      const docRef = await addDoc(collection(db, "prospects"), testData);
      console.log("文档已创建，ID:", docRef.id);
      setSuccess("测试成功！文档ID: " + docRef.id);
    } catch (err: any) {
      console.error("测试失败:", err);
      setError("测试失败: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#18181b",
      padding: "20px",
      color: "#fff"
    }}>
      <h1>Firebase连接测试</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <p>用户状态: {user ? "已登录 (" + user.uid + ")" : "未登录"}</p>
        <p>Firebase实例: {db ? "已初始化" : "未初始化"}</p>
      </div>
      
      <button
        onClick={testAddProspect}
        disabled={loading}
        style={{
          background: loading ? "#6b7280" : "#60a5fa",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px"
        }}
      >
        {loading ? "测试中..." : "测试添加潜在客户"}
      </button>
      
      {error && (
        <div style={{
          background: "#ef4444",
          color: "#fff",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          错误: {error}
        </div>
      )}
      
      {success && (
        <div style={{
          background: "#10b981",
          color: "#fff",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          成功: {success}
        </div>
      )}
    </div>
  );
} 