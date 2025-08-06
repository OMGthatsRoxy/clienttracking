# 新建记录页面功能说明

## 页面概述

新建记录页面允许教练为客户创建新的课程记录，记录课程内容、学员表现和下次目标等信息。

## 页面路径

```
/client/[id]/lesson-records/new
```

其中 `[id]` 是客户ID，支持URL参数传递课程信息。

## 功能特性

### 1. 页面结构

#### **头部导航**
- 返回按钮：跳转回客户课程记录列表
- 页面标题：显示"新建课程记录 - {客户姓名}"
- 页面描述：说明当前操作

#### **表单区域**
- 使用 `LessonRecordForm` 组件
- 深色主题设计
- 响应式布局

### 2. 数据传递

#### **URL参数支持**
- `date`: 课程日期（YYYY-MM-DD格式）
- `time`: 课程时间（HH:MM格式）
- `clientName`: 客户姓名

#### **自动填充**
- 从URL参数自动填充日期和时间
- 从客户信息自动填充客户姓名

### 3. 错误处理

#### **状态管理**
- 加载状态：显示"加载中..."
- 错误状态：显示具体错误信息
- 成功状态：正常显示表单

#### **错误类型**
- 用户未登录：提示"请先登录"
- 客户不存在：提示"客户不存在"
- 网络错误：提示"获取客户信息失败"

### 4. 表单功能

#### **基本信息**
- 课程日期：日期选择器
- 课程时间：时间选择器
- 课程时长：下拉选择（30/45/60/90分钟）

#### **课程内容**
- 课程内容：多行文本输入
- 教练记录：多行文本输入
- 学员表现：多行文本输入
- 下次目标：多行文本输入

#### **模板功能**
- 训练动作模板：预设的训练动作
- 配套模板：预设的课程配套
- 一键应用：快速填充课程内容

### 5. 操作流程

#### **创建记录**
1. 用户点击"新建记录"按钮
2. 跳转到新建记录页面
3. 自动填充客户信息和课程信息
4. 用户填写课程详情
5. 点击保存按钮
6. 保存成功后跳转回课程记录列表

#### **取消操作**
1. 用户点击取消按钮
2. 跳转回课程记录列表
3. 不保存任何数据

## 技术实现

### 1. 页面组件

**文件**: `src/app/client/[id]/lesson-records/new/page.tsx`

#### **Next.js 15 兼容性**
```typescript
// params和searchParams现在是Promise，需要使用React.use()解包
const resolvedParams = use(params);
const resolvedSearchParams = use(searchParams);
```

#### **核心功能**
```typescript
// 获取客户信息
const fetchClient = async () => {
  const clientDoc = await getDoc(doc(db, "clients", resolvedParams.id));
  if (clientDoc.exists()) {
    const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
    setClient(clientData);
  }
};

// 处理URL参数
const initialDate = resolvedSearchParams.date;
const initialTime = resolvedSearchParams.time;
```

### 2. 表单组件

**文件**: `src/features/lessonRecords/LessonRecordForm.tsx`

#### **表单状态**
```typescript
const [formData, setFormData] = useState({
  lessonDate: initialDate || new Date().toISOString().split('T')[0],
  lessonTime: initialTime || "09:00",
  duration: 60,
  content: "",
  notes: "",
  performance: "",
  nextGoals: ""
});
```

#### **保存逻辑**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const lessonRecord: Omit<LessonRecord, 'id'> = {
    clientId,
    clientName,
    coachId: user.uid,
    lessonDate: formData.lessonDate,
    lessonTime: formData.lessonTime,
    duration: Number(formData.duration),
    content: formData.content,
    notes: formData.notes,
    performance: formData.performance,
    nextGoals: formData.nextGoals,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await addDoc(collection(db, "lessonRecords"), lessonRecord);
  onSuccess();
};
```

### 3. 数据模型

**文件**: `src/types/lessonRecord.ts`

```typescript
export interface LessonRecord {
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

## 用户体验

### 1. 视觉设计
- **深色主题**：与整体应用风格一致
- **清晰布局**：信息层次分明
- **响应式设计**：支持移动端和桌面端

### 2. 交互体验
- **自动填充**：减少用户输入
- **实时验证**：表单验证提示
- **状态反馈**：加载和错误状态清晰

### 3. 操作便利性
- **一键返回**：快速回到上一页面
- **模板应用**：快速填充常用内容
- **保存提示**：操作结果明确反馈

## 集成功能

### 1. 与课程管理集成
- 从课程详情页面跳转
- 自动填充课程信息
- 保存后更新课程状态

### 2. 与客户管理集成
- 从客户详情页面跳转
- 显示客户基本信息
- 关联客户课程记录

### 3. 与模板系统集成
- 支持训练动作模板
- 支持配套模板
- 快速应用预设内容

## 测试验证

新建记录页面应该：
1. ✅ 正确加载客户信息
2. ✅ 自动填充URL参数
3. ✅ 表单验证正常工作
4. ✅ 保存功能正常
5. ✅ 错误处理完善
6. ✅ 响应式设计正常
7. ✅ 模板功能正常
8. ✅ 导航功能正常
9. ✅ Next.js 15兼容性正常 