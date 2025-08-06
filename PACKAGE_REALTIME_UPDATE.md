# 配套信息实时更新功能实现

## 概述
已成功实现预约课程表单中配套信息的实时更新功能。当用户选择客户时，系统会自动获取并显示该客户的可用配套信息，并在配套信息发生变化时实时更新。

## 实现的功能

### 1. ScheduleForm 组件更新
- **文件**: `src/features/schedule/ScheduleForm.tsx`
- **功能**: 
  - 添加了配套信息选择字段
  - 当选择客户时，自动获取该客户的配套信息
  - 只显示未过期且还有剩余课时的配套
  - 实时更新配套信息显示

### 2. 主页面实时监听
- **文件**: `src/app/schedule/page.tsx`
- **功能**:
  - 将配套数据获取从 `getDocs` 改为 `onSnapshot`
  - 添加了按教练ID过滤的查询条件
  - 实现配套数据的实时监听和更新

### 3. PackageList 组件更新
- **文件**: `src/features/packages/PackageList.tsx`
- **功能**:
  - 将配套列表获取从 `getDocs` 改为 `onSnapshot`
  - 实现配套列表的实时更新
  - 当配套被删除或修改时，列表会自动更新

### 4. 统计卡片组件
- **文件**: 
  - `src/components/StatsCard.tsx`
  - `src/components/CareerStatsCard.tsx`
- **功能**:
  - 已经使用 `onSnapshot` 实现实时监听
  - 配套统计信息会实时更新

## 技术实现细节

### 实时监听机制
```typescript
// 使用 onSnapshot 替代 getDocs
const packagesUnsubscribe = onSnapshot(q, (snapshot) => {
  const packagesData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Package));
  setPackages(packagesData);
}, (error) => {
  console.error("获取配套数据失败:", error);
});

return () => packagesUnsubscribe();
```

### 配套过滤逻辑
```typescript
// 只显示未过期且还有剩余课时的配套
const clientPackages = querySnapshot.docs.map(doc => {
  const data = doc.data() as Package;
  return {
    ...data,
    id: doc.id,
    isExpired: isExpired(data.validUntil),
  };
}).filter(pkg => !pkg.isExpired && pkg.remainingSessions > 0);
```

### 自动清理机制
```typescript
// 当客户选择改变时，清空配套选择
if (form.packageId && !clientPackages.find(pkg => pkg.id === form.packageId)) {
  setForm(prev => ({ ...prev, packageId: "" }));
}
```

## 用户体验改进

1. **实时响应**: 当配套信息发生变化时（如课时被扣除、配套过期等），表单中的配套选择会立即更新
2. **智能过滤**: 只显示可用的配套，避免选择已过期或用完的配套
3. **自动清理**: 当选择的配套变为不可用时，自动清空选择
4. **数据一致性**: 确保所有相关组件都使用最新的配套数据

## 测试建议

1. **创建配套**: 为客户创建新的配套，检查预约表单是否立即显示
2. **扣除课时**: 完成课程后扣除课时，检查配套剩余次数是否实时更新
3. **配套过期**: 等待配套过期，检查是否从可用列表中移除
4. **删除配套**: 删除配套，检查是否从所有相关组件中移除

## 注意事项

- 所有实时监听都有适当的错误处理
- 组件卸载时会正确清理监听器，避免内存泄漏
- 配套信息按教练ID过滤，确保数据安全
- 使用 `useCallback` 优化性能，避免不必要的重新渲染

## 问题修复

### 配套更新延迟问题
**问题描述**: 完成课程后，预约表单中的配套剩余次数没有立即更新

**原因分析**: 在完成课程和取消课程时，代码使用了本地状态中的配套数据来获取当前的剩余次数，但这些数据可能不是最新的

**解决方案**: 
- 修改 `handleCompleteCourse` 和 `handleCancelConfirm` 函数
- 使用 `getDoc` 直接从Firestore获取最新的配套数据
- 确保使用最新的剩余次数进行扣减

**修复前**:
```typescript
const packageDoc = packages.find(p => p.id === schedule.packageId);
if (packageDoc && packageDoc.remainingSessions > 0) {
  await updateDoc(packageRef, {
    remainingSessions: packageDoc.remainingSessions - 1
  });
}
```

**修复后**:
```typescript
const packageDoc = await getDoc(packageRef);
if (packageDoc.exists()) {
  const packageData = packageDoc.data();
  if (packageData.remainingSessions > 0) {
    await updateDoc(packageRef, {
      remainingSessions: packageData.remainingSessions - 1
    });
  }
}
```

这个修复确保了：
1. 每次扣减课时都使用最新的配套数据
2. 避免了因本地状态延迟导致的数据不一致
3. 实时更新功能能够立即反映配套变化 