# HTML文件迁移指南

## 文件信息
- **源文件**: `app-introduction.html`
- **文件类型**: 自包含的HTML页面（包含内联CSS和JavaScript）
- **功能**: TrainerLogbook介绍页面
- **语言支持**: 中文、英文、马来文

## 迁移步骤

### 1. 复制文件
```bash
# 将文件复制到目标项目目录
cp app-introduction.html /path/to/your/new/project/
```

### 2. 修改配置

#### 2.1 更新链接地址
在HTML文件中找到并修改以下链接：
```html
<!-- 第1087行附近 -->
<a href="http://localhost:3001" class="cta-button">立即体验系统</a>

<!-- 第1087行附近 -->
<a href="http://localhost:3001" class="cta-button">Try System Now</a>

<!-- 第1087行附近 -->
<a href="http://localhost:3001" class="cta-button">Cuba Sistem Sekarang</a>
```

将 `http://localhost:3001` 替换为你的新项目地址。

#### 2.2 更新项目信息（可选）
根据需要修改以下内容：
- 页面标题
- 项目描述
- 技术栈信息
- 版权信息

### 3. 文件结构建议

建议的文件组织结构：
```
your-new-project/
├── index.html (或 app-introduction.html)
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── README.md
```

### 4. 部署选项

#### 4.1 静态网站托管
- **GitHub Pages**: 直接上传HTML文件
- **Netlify**: 拖拽上传或Git连接
- **Vercel**: 支持静态HTML部署
- **AWS S3**: 配置为静态网站

#### 4.2 本地服务器
```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 使用Node.js
npx serve .

# 使用PHP
php -S localhost:8000
```

### 5. 自定义建议

#### 5.1 样式定制
- 修改颜色主题（当前使用深色主题）
- 调整字体和布局
- 添加品牌元素

#### 5.2 功能增强
- 添加更多语言支持
- 集成分析工具（Google Analytics等）
- 添加联系表单
- 集成社交媒体链接

#### 5.3 性能优化
- 压缩CSS和JavaScript
- 优化图片
- 添加缓存策略

## 注意事项

1. **浏览器兼容性**: 文件使用了现代CSS特性，确保目标浏览器支持
2. **移动端适配**: 文件已包含响应式设计
3. **SEO优化**: 考虑添加meta标签和结构化数据
4. **安全性**: 如果部署到生产环境，考虑添加安全头

## 测试清单

- [ ] 文件在新环境中正常打开
- [ ] 所有链接指向正确的地址
- [ ] 语言切换功能正常
- [ ] 移动端显示正常
- [ ] 样式渲染正确
- [ ] 没有控制台错误

## 常见问题

**Q: 文件太大怎么办？**
A: 可以将CSS和JavaScript提取到外部文件，减少HTML文件大小。

**Q: 如何添加新的语言？**
A: 复制现有的语言内容块，修改ID和内容，并在语言切换器中添加按钮。

**Q: 如何修改颜色主题？**
A: 在CSS中搜索颜色值（如#007aff, #1a1a1a），替换为新的颜色。

