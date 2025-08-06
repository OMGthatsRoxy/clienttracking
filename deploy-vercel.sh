#!/bin/bash

echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📝 提示："
echo "1. 如果是第一次部署，需要登录 Vercel 账号"
echo "2. 部署完成后会得到一个 .vercel.app 域名"
echo "3. 可以在 Vercel 控制台配置自定义域名"
echo "4. 记得在 Vercel 项目设置中配置环境变量"
