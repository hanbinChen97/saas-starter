# Email 功能重构计划

## 🎯 重构目标
将邮件功能从 `app/dashboard/main/emails` 和 `app/dashboard/main/mail` 整合并迁移到独立的 `app/email` 目录，简化架构并提升维护性。

## 📁 当前结构分析
```
当前邮件功能分布：
- app/dashboard/main/emails/page.tsx (重定向逻辑)
- app/dashboard/main/mail/page.tsx (登录页面)  
- app/dashboard/main/mail/[id]/page.tsx (主邮件界面)
- app/components/email/ (邮件组件)
- app/lib/email-service/ (邮件服务)
- app/hooks/ (邮件相关hooks)
```

## 🔄 重构步骤

### **第一阶段：创建新的 Email 目录结构**
```
app/email/
├── page.tsx                    # 邮件登录页面 (整合当前mail/page.tsx + emails重定向逻辑)
├── [id]/
│   └── page.tsx               # 邮件管理界面 (迁移mail/[id]/page.tsx)
├── layout.tsx                 # Email专用布局组件
└── loading.tsx                # 加载状态页面
```

### **第二阶段：重构主页面路由**
修改 `app/page.tsx`：
- 移除 Dashboard 选项
- 新增 Email 功能入口
- 保留 SuperC 功能入口
- 更新页面标题和描述

### **第三阶段：整合邮件登录逻辑**
创建 `app/email/page.tsx`：
- 整合 `emails/page.tsx` 的重定向逻辑
- 整合 `mail/page.tsx` 的登录表单
- 统一认证状态检查和路由跳转

### **第四阶段：迁移邮件管理界面**
创建 `app/email/[id]/page.tsx`：
- 完整迁移 `mail/[id]/page.tsx` 的功能
- 更新内部路由引用
- 保持所有现有功能不变

### **第五阶段：更新路由引用**
- 更新所有指向旧路径的引用
- 修改 middleware.ts 中的路由保护
- 更新组件内的路由跳转

### **第六阶段：清理冗余文件**
- 删除 `app/dashboard/main/emails/` 目录
- 删除 `app/dashboard/main/mail/` 目录
- 验证没有遗留引用

## 📝 具体修改的文件

### 需要创建的文件：
1. `app/email/page.tsx` - 整合登录和重定向逻辑
2. `app/email/[id]/page.tsx` - 邮件管理主界面
3. `app/email/layout.tsx` - Email专用布局
4. `app/email/loading.tsx` - 加载状态

### 需要修改的文件：
1. `app/page.tsx` - 更新主页面选择器
2. `middleware.ts` - 更新路由保护规则
3. `app/components/email/` - 更新内部路由引用
4. `app/hooks/useEmailAuth.ts` - 更新跳转路径

### 需要删除的文件：
1. `app/dashboard/main/emails/page.tsx`
2. `app/dashboard/main/mail/page.tsx`
3. `app/dashboard/main/mail/[id]/page.tsx`

## 🎨 实现的功能特性
- **统一入口**：`/email` 作为邮件功能的唯一入口
- **智能路由**：自动检测认证状态，智能跳转到合适页面
- **保持功能**：所有现有邮件功能完全保留
- **简化架构**：减少路由层级，提升用户体验

## 🔧 技术实现要点
- 使用 `useEmailAuth` hook 进行认证状态管理
- 整合重定向逻辑到登录页面中
- 保持所有现有的 email 组件和服务不变
- 更新路由保护中间件配置

## ✅ 完成标准
- [ ] 新 Email 目录结构创建完成
- [ ] 主页面更新为 Email + SuperC 双选项
- [ ] 邮件登录逻辑整合完成
- [ ] 邮件管理界面迁移完成
- [ ] 所有路由引用更新完成
- [ ] 冗余文件清理完成
- [ ] 功能测试通过

## 🚀 预期效果
重构完成后，用户从主页面可以直接选择进入 Email 或 SuperC 功能，邮件功能拥有独立、清晰的目录结构，便于维护和扩展。