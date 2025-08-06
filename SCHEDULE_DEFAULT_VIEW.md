# 课程排程页面默认视图修改

## 修改内容

将课程排程页面的默认视图从"周视图"改为"3日视图"。

## 修改位置

**文件**: `src/app/schedule/page.tsx`
**行号**: 137
**修改前**: 
```typescript
const [viewMode, setViewMode] = useState<'day' | 'threeDay' | 'week' | 'month'>('week');
```

**修改后**:
```typescript
const [viewMode, setViewMode] = useState<'day' | 'threeDay' | 'week' | 'month'>('threeDay');
```

## 功能说明

### 3日视图特性
- **显示范围**: 以当前日期为中心，显示前1天、当天、后1天，共3天
- **标题显示**: "3日视图"
- **导航按钮**: 
  - "前3天" - 向前移动3天
  - "今天" - 回到当前日期
  - "后3天" - 向后移动3天
- **响应式布局**: 
  - 移动端: 400px宽度
  - 桌面端: 500px宽度
  - 容器最大宽度: 600px

### 日期计算逻辑
```typescript
// 在 src/lib/scheduleUtils.ts 中的 getDatesByViewMode 函数
} else if (mode === 'threeDay') {
  const centerDate = new Date(today);
  centerDate.setDate(today.getDate() + offset);
  
  return Array.from({ length: 3 }, (_, i) => {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + (i - 1));
    return date.toISOString().split('T')[0];
  });
}
```

## 用户体验改进

1. **更聚焦的视图**: 3日视图比周视图更聚焦，便于查看近期课程
2. **更好的移动端体验**: 3日视图在移动设备上显示更清晰
3. **快速导航**: 用户可以快速在3天范围内查看和安排课程
4. **保持灵活性**: 用户仍可切换到日视图、周视图或月视图

## 测试验证

修改后，当用户访问课程排程页面时：
- 默认显示3日视图
- 页面标题显示"3日视图"
- 显示当前日期前后各1天的课程安排
- 导航按钮正常工作
- 可以正常切换到其他视图模式

## 兼容性

- ✅ 所有现有功能保持不变
- ✅ 其他视图模式（日视图、周视图、月视图）正常工作
- ✅ 响应式布局适配移动端和桌面端
- ✅ 实时数据更新功能正常 