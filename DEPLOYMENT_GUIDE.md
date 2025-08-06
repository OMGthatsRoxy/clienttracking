# 免费部署指南

## 方案一：Vercel 部署（推荐）

### 步骤 1：准备项目
确保你的项目可以正常构建：
```bash
npm run build
```

### 步骤 2：部署到 Vercel
1. 访问 [vercel.com](https://vercel.com) 并注册账号
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目并配置
5. 点击 "Deploy"

### 步骤 3：环境变量配置
在 Vercel 项目设置中添加以下环境变量：
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### 步骤 4：自定义域名（可选）
在 Vercel 项目设置中可以添加自定义域名。

---

## 方案二：Netlify 部署

### 步骤 1：创建 netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 步骤 2：部署
1. 访问 [netlify.com](https://netlify.com)
2. 拖拽构建后的 `.next` 文件夹到部署区域
3. 或连接 GitHub 仓库自动部署

---

## 方案三：Firebase Hosting

### 步骤 1：安装 Firebase CLI
```bash
npm install -g firebase-tools
```

### 步骤 2：初始化 Firebase
```bash
firebase login
firebase init hosting
```

### 步骤 3：构建和部署
```bash
npm run build
firebase deploy
```

---

## 方案四：Railway 部署

### 步骤 1：准备 Dockerfile
你的项目已经有 Dockerfile，可以直接使用。

### 步骤 2：部署
1. 访问 [railway.app](https://railway.app)
2. 连接 GitHub 仓库
3. 选择 "Deploy from Dockerfile"
4. 配置环境变量

---

## 环境变量配置

为了安全起见，建议将 Firebase 配置移到环境变量中：

```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

## 推荐选择

**Vercel** 是最佳选择，因为：
- 完全免费
- 专为 Next.js 优化
- 自动 HTTPS
- 全球 CDN
- 自动部署
- 优秀的开发者体验

部署完成后，你会得到一个类似 `https://your-project.vercel.app` 的链接。
