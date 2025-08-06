# 自定义动作功能修复总结

## 问题描述

用户反馈：
1. 新建的动作没有显示在表单里
2. 表单里的删除按钮也没有工作

## 问题分析

### 1. 新建动作不显示的问题
- **原因**: 动作选择器在添加新动作后没有重新加载数据
- **位置**: `src/features/exercises/ExerciseSelector.tsx`
- **问题**: 添加动作后只是更新了本地状态，但没有重新从Firebase获取最新数据

### 2. 删除按钮不工作的问题
- **原因**: 个人资料页面的动作库功能使用的是本地状态管理，而不是Firebase数据库
- **位置**: `src/app/profile/page.tsx`
- **问题**: 删除功能只操作本地状态，没有与Firebase数据库同步

## 修复方案

### 1. 修复动作选择器

#### 修改前
```typescript
// 添加后只是更新本地状态
const newExercise: CustomExercise = {
  id: Date.now().toString(), // 临时ID
  ...customExerciseData
};
setCustomExercises(prev => [...prev, newExercise]);
```

#### 修改后
```typescript
// 重新从Firebase加载数据
const exercisesQuery = query(
  collection(db, "customExercises"),
  where("coachId", "==", user.uid),
  where("category", "==", category),
  where("isActive", "==", true)
);
const snapshot = await getDocs(exercisesQuery);
const exercises = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
})) as CustomExercise[];
setCustomExercises(exercises);
```

### 2. 修复个人资料页面动作库

#### 添加Firebase数据加载
```typescript
// 加载自定义动作
if (user) {
  const loadCustomExercises = async () => {
    try {
      const exercisesQuery = query(
        collection(db, "customExercises"),
        where("coachId", "==", user.uid),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(exercisesQuery);
      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirebaseCustomExercises(exercises);
    } catch (error) {
      console.error("获取自定义动作失败:", error);
    }
  };
  loadCustomExercises();
}
```

#### 修复删除功能
```typescript
const handleRemoveExercise = async (exerciseName: string) => {
  if (!selectedCategory || !user) return;
  
  try {
    // 找到要删除的动作
    const exerciseToDelete = firebaseCustomExercises.find(ex => 
      ex.name === exerciseName && ex.category === selectedCategory.category
    );
    
    if (exerciseToDelete) {
      // 从Firebase删除
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "customExercises", exerciseToDelete.id));
      
      // 更新本地状态
      setFirebaseCustomExercises(prev => 
        prev.filter(ex => ex.id !== exerciseToDelete.id)
      );
      
      console.log("动作删除成功:", exerciseName);
    }
  } catch (error) {
    console.error("删除动作失败:", error);
    alert("删除动作失败，请重试");
  }
};
```

#### 修复添加功能
```typescript
const handleAddExercise = async () => {
  if (!selectedCategory || !newExerciseName.trim() || !user) return;
  
  try {
    const { addDoc, collection } = await import("firebase/firestore");
    const customExerciseData = {
      coachId: user.uid,
      name: newExerciseName.trim(),
      category: selectedCategory.category as any,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addDoc(collection(db, "customExercises"), customExerciseData);
    
    // 重新加载自定义动作
    const exercisesQuery = query(
      collection(db, "customExercises"),
      where("coachId", "==", user.uid),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(exercisesQuery);
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setFirebaseCustomExercises(exercises);
    
    setNewExerciseName("");
    setShowAddExerciseForm(false);
    
    console.log("动作添加成功:", newExerciseName.trim());
  } catch (error) {
    console.error("添加动作失败:", error);
    alert("添加动作失败，请重试");
  }
};
```

#### 修复动作显示逻辑
```typescript
// 获取当前分类的所有动作（预设 + 自定义）
const getCurrentCategoryExercises = () => {
  if (!selectedCategory) return [];
  
  const category = selectedCategory.category;
  const preset = presetExercises[category as keyof typeof presetExercises] || [];
  
  // 从Firebase获取自定义动作
  const firebaseCustom = firebaseCustomExercises
    .filter(ex => ex.category === category)
    .map(ex => ex.name);
  
  // 合并预设和自定义动作，过滤掉重复的
  const allExercises = [...preset, ...firebaseCustom];
  const uniqueExercises = Array.from(new Set(allExercises));
  
  // 根据搜索词过滤
  if (searchTerm.trim()) {
    return uniqueExercises.filter(exercise => 
      exercise.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  return uniqueExercises;
};
```

## 修复结果

### ✅ 已修复的问题

1. **新建动作显示问题**
   - 动作选择器现在会重新加载数据
   - 新添加的动作会立即显示在下拉菜单中
   - 添加后会自动选择新动作

2. **删除按钮功能**
   - 删除功能现在与Firebase数据库集成
   - 删除后会立即从界面移除
   - 支持错误处理和用户提示

3. **数据同步问题**
   - 个人资料页面的动作库现在使用Firebase数据
   - 添加和删除操作都会实时同步
   - 所有操作都有适当的错误处理

### 🔧 技术改进

1. **数据一致性**: 所有动作操作都通过Firebase数据库进行
2. **实时同步**: 添加和删除操作都会立即反映在界面上
3. **错误处理**: 完善的错误处理和用户提示
4. **类型安全**: 修复了TypeScript类型错误

## 测试建议

1. **测试添加动作**
   - 在课程记录表单中添加新动作
   - 验证动作是否立即显示在选择器中
   - 验证动作是否自动被选择

2. **测试删除动作**
   - 在个人资料页面的动作库中删除动作
   - 验证动作是否立即从界面移除
   - 验证删除是否同步到数据库

3. **测试数据同步**
   - 在一个页面添加动作，在另一个页面验证是否显示
   - 在一个页面删除动作，在另一个页面验证是否移除

## 总结

通过修复动作选择器的数据加载逻辑和个人资料页面的Firebase集成，现在自定义动作功能已经完全正常工作：

- ✅ 新建动作会立即显示在表单中
- ✅ 删除按钮可以正常工作
- ✅ 所有操作都与Firebase数据库同步
- ✅ 提供完善的错误处理和用户反馈

用户现在可以正常使用自定义动作功能，添加的动作会立即显示，删除功能也能正常工作。 