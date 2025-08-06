# ScheduleItem 组件使用说明

## 概述

`ScheduleItem` 是一个可复用的课程显示组件，用于在日程表中精确显示课程信息。该组件实现了 Google Calendar 风格的课程块显示，支持精确的时间定位和多种状态显示。

## 特性

### ✅ 已实现功能

1. **精确时间定位**
   - 课程块准确显示在对应的时间位置
   - 支持半点时间（如 9:30-10:30）
   - 使用 `absolute + top + height` 实现精准定位

2. **时间格式显示**
   - 第一行：`930–1030` 格式
   - 第二行：`9:30 – 10:30am` 格式
   - 自动处理 12 小时制显示

3. **状态颜色区分**
   - 蓝色：已预约 (`scheduled`)
   - 绿色：已完成 (`completed`)
   - 红色：已取消 (`cancelled`)
   - 黄色：取消扣课时 (`cancelled_with_deduction`)

4. **响应式设计**
   - 支持移动端和桌面端不同尺寸
   - 自适应字体大小和间距

5. **Google Calendar 风格**
   - 浅蓝色背景 (`bg-blue-500`)
   - 白色文字
   - 圆角设计
   - 阴影效果

6. **交互功能**
   - 支持点击事件处理
   - 悬停效果
   - 工具提示显示

## 使用方法

### 基本用法

```tsx
import ScheduleItem from '@/components/ScheduleItem';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';

const schedule: ScheduleItemType = {
  id: '1',
  date: '2024-01-15',
  time: '09:30',
  startTime: '09:30',
  endTime: '10:30',
  clientName: '张三',
  clientId: 'client-1',
  status: 'scheduled',
  hasBeenChanged: false,
  coachId: 'coach-1'
};

function MyComponent() {
  return (
    <div style={{ position: 'relative', height: '600px' }}>
      <ScheduleItem
        schedule={schedule}
        isMobile={false}
        onClick={() => console.log('课程被点击')}
      />
    </div>
  );
}
```

### 在日程页面中使用

```tsx
// 在日程页面中，课程项目层
{currentDates.map((date: string, dateIndex: number) => {
  const dateSchedules = schedules.filter(schedule => schedule.date === date);
  
  return (
    <div
      key={`schedules-${date}`}
      style={{
        position: 'absolute',
        top: isMobile ? 50 : 60, // 跳过标题行
        left: `${(dateIndex + 1) * (isMobile ? 60 : 80)}px`, // 跳过时间列
        width: isMobile ? 60 : 80,
        height: `${timeSlots.length * (isMobile ? 50 : 60)}px`,
        pointerEvents: 'auto',
        zIndex: 10
      }}
    >
      {dateSchedules.map((schedule) => (
        <ScheduleItem
          key={schedule.id}
          schedule={schedule}
          isMobile={isMobile}
          onClick={() => {
            setSelectedDate(date);
            setSelectedTime(schedule.startTime || schedule.time);
            setIsModalOpen(true);
          }}
        />
      ))}
    </div>
  );
})}
```

## 组件属性

### Props

| 属性 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `schedule` | `ScheduleItemType` | ✅ | - | 课程数据对象 |
| `isMobile` | `boolean` | ❌ | `false` | 是否为移动端模式 |
| `onClick` | `() => void` | ❌ | - | 点击事件处理函数 |

### ScheduleItemType 接口

```typescript
interface ScheduleItemType {
  id?: string;
  date: string;
  time: string; // 保持兼容性，存储开始时间
  startTime: string; // 课程开始时间 (如 "09:00" 或 "09:30")
  endTime: string; // 课程结束时间 (如 "10:00" 或 "10:30")
  clientName: string;
  clientId: string;
  packageId?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'cancelled_with_deduction';
  originalStatus?: 'scheduled' | 'completed' | 'cancelled' | 'cancelled_with_deduction';
  hasBeenChanged: boolean;
  coachId: string;
  createdAt?: string;
  updatedAt?: string;
}
```

## 定位计算

组件使用以下算法计算课程块的位置和高度：

```typescript
const calculatePosition = () => {
  const startTime = schedule.startTime || schedule.time;
  const endTime = schedule.endTime || getEndTime(startTime);
  
  // 解析开始和结束时间
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // 计算相对于5:00的位置（以分钟为单位）
  const startMinutes = (startHour - 5) * 60 + startMinute;
  const endMinutes = (endHour - 5) * 60 + endMinute;
  
  // 每个时间格的高度
  const timeSlotHeight = isMobile ? 50 : 60; // 移动端50px，桌面端60px per hour
  
  // 计算top位置（相对于时间轴）
  const top = (startMinutes / 60) * timeSlotHeight;
  
  // 计算高度
  const height = ((endMinutes - startMinutes) / 60) * timeSlotHeight;
  
  return { top, height };
};
```

## 样式定制

组件使用内联样式，主要样式特点：

- **定位**：`position: absolute`
- **背景色**：根据状态动态设置
- **文字颜色**：白色或深色（根据背景色对比度）
- **圆角**：`borderRadius: '6px'`
- **阴影**：`boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'`
- **过渡效果**：`transition: 'all 0.2s ease'`

## 演示页面

访问 `/schedule-demo` 页面可以查看组件的演示效果，包括：

- 不同状态的课程显示
- 移动端和桌面端切换
- 点击交互演示
- 时间格式显示示例

## 注意事项

1. **容器要求**：父容器需要设置 `position: relative`
2. **时间范围**：组件假设时间轴从 5:00 开始
3. **响应式**：移动端和桌面端使用不同的时间格高度
4. **兼容性**：支持旧数据格式（使用 `time` 字段作为开始时间）

## 更新日志

- **v1.0.0**：初始版本，实现基本功能
- 精确时间定位
- 状态颜色区分
- 响应式设计
- Google Calendar 风格 