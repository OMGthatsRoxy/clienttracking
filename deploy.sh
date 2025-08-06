#!/bin/bash

# 健身教练客户管理系统部署脚本

echo "🚀 开始部署健身教练客户管理系统..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "🎉 部署选项："
    echo "1. 本地测试: npm start"
    echo "2. Vercel 部署: 推送到 GitHub 并在 Vercel 导入"
    echo "3. Netlify 部署: 推送到 Git 并在 Netlify 导入"
    echo "4. 自托管: 将 .next 目录复制到服务器"
    echo ""
    echo "📝 注意事项："
    echo "- 确保配置了正确的环境变量"
    echo "- Firebase 项目已正确设置"
    echo "- 域名 DNS 已指向服务器"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi 