"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ width: "100%" }}>
      <h2 style={{ 
        fontSize: "clamp(16px, 3vw, 20px)", // 响应式字体
        marginBottom: 12, // 减少底部间距
        textAlign: "center"
      }}>教练登录</h2>
      <div style={{ marginBottom: 8 }}> {/* 减少底部间距 */}
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px", // 减少内边距
            borderRadius: 6, // 减小圆角
            border: "1px solid #333",
            background: "#23232a",
            color: "#fff",
            fontSize: "clamp(13px, 2.5vw, 14px)", // 响应式字体
            marginBottom: 8 // 减少底部间距
          }}
        />
      </div>
      <div style={{ marginBottom: 12 }}> {/* 减少底部间距 */}
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px", // 减少内边距
            borderRadius: 6, // 减小圆角
            border: "1px solid #333",
            background: "#23232a",
            color: "#fff",
            fontSize: "clamp(13px, 2.5vw, 14px)" // 响应式字体
          }}
        />
      </div>
      <button 
        type="submit"
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
        登录
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