# 课程记录功能

## 功能概述

课程记录功能允许教练为每个客户的每节课程创建详细的记录，包括课程内容、学员表现、教练备注等信息。

## 功能层级结构

1. **客户详情页** - 显示客户基本信息
2. **课程完整记录按钮** - 紫色按钮，点击进入课程记录列表
3. **课程完整记录页面** - 显示该客户的所有课程记录，按日期排序
4. **具体课程记录页面** - 点击某个记录后查看详细内容

## 功能流程

### 1. 访问课程记录
- 在客户详情页点击"课程完整记录"按钮
- 进入课程记录列表页面

### 2. 创建新课程记录
**方式一：从课程记录列表页面**
- 在课程记录列表页面点击"新建课程记录"按钮
- 跳转到新建课程记录页面
- 填写课程信息并保存

**方式二：从排课页面（推荐）**
- 在排课页面点击任意课程
- 在课程详情弹窗中点击"课程记录"按钮
- 自动跳转到新建课程记录页面，并预填充课程信息（日期、时间、客户名）
- 填写其他课程信息并保存

### 3. 查看课程记录
- 在课程记录列表中点击任意记录
- 查看该课程的完整详细信息

## 课程信息预填充

从排课页面创建课程记录时，系统会自动预填充：
- 课程日期（从排课信息获取）
- 课程时间（从排课信息获取）
- 客户姓名（从排课信息获取）
- 课程时长（默认60分钟，可修改）

## 实时更新功能

保存课程记录后：
- 课程记录列表会实时更新，显示新保存的记录
- 显示成功提示消息（3秒后自动消失）
- 新记录会按日期倒序排列在列表顶部
- 无需手动刷新页面

## 数据结构

### LessonRecord 类型
```typescript
interface LessonRecord {
  id?: string;
  clientId: string;
  clientName: string;
  coachId: string;
  lessonDate: string; // YYYY-MM-DD
  lessonTime: string; // HH:MM
  duration: number; // 分钟
  content: string; // 课程内容
  notes: string; // 教练记录
  performance: string; // 学员表现
  nextGoals: string; // 下次目标
  attachments?: string[]; // 附件
  createdAt: string;
  updatedAt: string;
}
```

## 页面路由

- `/client/[id]` - 客户详情页（包含课程记录按钮）
- `/client/[id]/lesson-records` - 课程完整记录页面
- `/client/[id]/lesson-records/new` - 新建课程记录页面
- `/lesson-records/[id]` - 具体课程记录详情页面

## 组件结构

- `LessonRecordForm.tsx` - 课程记录表单组件
- `LessonRecordList.tsx` - 课程记录列表组件
- `page.tsx` - 课程完整记录页面
- `new/page.tsx` - 新建课程记录页面
- `[id]/page.tsx` - 课程记录详情页面

## 翻译支持

已添加以下翻译键：
- `lessonRecord` - 课程记录
- `lessonRecords` - 课程记录
- `newLessonRecord` - 新建课程记录
- `lessonDate` - 课程日期
- `lessonTime` - 课程时间
- `duration` - 课程时长
- `lessonContent` - 课程内容
- `coachNotes` - 教练记录
- `studentPerformance` - 学员表现
- `nextGoals` - 下次目标
- `noLessonRecords` - 暂无课程记录
- `recordNotFound` - 课程记录不存在

## 使用说明

1. 登录系统后，进入任意客户详情页
2. 点击"课程完整记录"按钮
3. 在课程记录列表页面可以：
   - 查看所有课程记录（按日期倒序排列）
   - 点击"新建课程记录"创建新记录
   - 点击任意记录查看详情
4. 在课程记录详情页面可以查看完整的课程信息

## 技术特点

- 响应式设计，支持移动端
- 实时数据同步（Firebase Firestore）
- 类型安全的TypeScript实现
- 多语言支持
- 现代化的UI设计 