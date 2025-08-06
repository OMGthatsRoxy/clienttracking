# 统计详情页面规划

## 页面结构

### 本月成绩卡片详情页面

1. **本月进账详情** - `/stats/monthly-income`
   - ✅ 已创建
   - 显示本月新增配套的详细进账信息
   - 按客户分组的进账统计
   - 配套详情列表

2. **今日课程详情** - `/stats/today-courses`
   - ✅ 已创建
   - 显示今日所有课程的详细信息
   - 按状态分组的统计
   - 时间分布统计

3. **本月已完成课程详情** - `/stats/monthly-completed-courses`
   - 显示本月已完成和取消但扣课时的课程
   - 按客户分组的完成情况
   - 完成率统计

4. **本月新增配套详情** - `/stats/monthly-new-packages`
   - 显示本月新增的所有配套
   - 按客户分组的配套统计
   - 配套类型分析

5. **本月活跃客户详情** - `/stats/monthly-active-clients`
   - 显示本月有课程活动的客户
   - 客户活跃度统计
   - 课程参与情况

### 我的职业生涯卡片详情页面

1. **总进账详情** - `/stats/total-income`
   - 显示职业生涯总进账
   - 按年份/月份的收入趋势
   - 收入来源分析

2. **总客户人数详情** - `/stats/total-clients`
   - 显示所有客户列表
   - 客户注册时间分布
   - 客户状态统计

3. **剩余客户配套详情** - `/stats/remaining-packages`
   - 显示所有未过期的配套
   - 按客户分组的配套情况
   - 配套使用率统计

4. **潜在顾客详情** - `/stats/potential-clients`
   - 显示所有潜在顾客
   - 潜在顾客转化情况
   - 跟进状态统计

5. **生涯执教时长详情** - `/stats/career-duration`
   - 显示所有已完成的课程记录
   - 按时间段的课程分布
   - 执教时长趋势

## 页面功能特性

### 通用功能
- 返回首页按钮
- 响应式设计（移动端适配）
- 实时数据更新
- 数据可视化展示
- 详细统计信息

### 数据展示
- 列表视图
- 分组统计
- 图表展示（可选）
- 搜索和筛选
- 排序功能

### 交互功能
- 点击卡片跳转到详情页
- 悬停效果
- 数据导出（可选）
- 分享功能（可选）

## 技术实现

### 路由结构
```
/stats/
├── monthly-income/
├── today-courses/
├── monthly-completed-courses/
├── monthly-new-packages/
├── monthly-active-clients/
├── total-income/
├── total-clients/
├── remaining-packages/
├── potential-clients/
└── career-duration/
```

### 数据获取
- 使用 Firestore 实时监听
- 按教练ID过滤数据
- 支持实时更新

### 样式设计
- 统一的卡片样式
- 渐变背景
- 响应式布局
- 暗色主题

## 开发进度

### 已完成
- ✅ 本月进账详情页面
- ✅ 今日课程详情页面
- ✅ 首页卡片链接功能

### 待完成
- ⏳ 本月已完成课程详情页面
- ⏳ 本月新增配套详情页面
- ⏳ 本月活跃客户详情页面
- ⏳ 总进账详情页面
- ⏳ 总客户人数详情页面
- ⏳ 剩余客户配套详情页面
- ⏳ 潜在顾客详情页面
- ⏳ 生涯执教时长详情页面

## 文件结构

```
src/app/stats/
├── monthly-income/
│   └── page.tsx
├── today-courses/
│   └── page.tsx
├── monthly-completed-courses/
│   └── page.tsx
├── monthly-new-packages/
│   └── page.tsx
├── monthly-active-clients/
│   └── page.tsx
├── total-income/
│   └── page.tsx
├── total-clients/
│   └── page.tsx
├── remaining-packages/
│   └── page.tsx
├── potential-clients/
│   └── page.tsx
└── career-duration/
    └── page.tsx
```

## 注意事项

1. **性能优化** - 大量数据时需要考虑分页
2. **数据一致性** - 确保统计数据的准确性
3. **用户体验** - 加载状态和错误处理
4. **移动端适配** - 确保在小屏幕上的良好体验
5. **数据安全** - 确保只能查看自己的数据 