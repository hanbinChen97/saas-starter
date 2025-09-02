# SuperC Module Specification

## Overview
SuperC 模块是一个自动预约系统，为用户提供 SuperC（RWTH Aachen University 的学生服务中心）的自动化预约服务。该模块包含完整的用户注册、登录、预约管理和个人资料功能。

## Folder Structure

```
app/superc/
├── README.md                    # 项目文档
├── spec.md                     # 本规格说明文件
├── task.md                     # 任务说明文件
├── task2                       # 额外任务文件
├── page.tsx                    # 主页面 - SuperC 系统首页
├── terminal.tsx                # 终端组件 - 模拟预约过程的动画效果
├── components/                 # 通用组件目录
│   └── header.tsx             # 页面头部组件
├── login/                      # 登录页面
│   ├── page.tsx               # 登录页面组件
│   └── spec.md               # 登录页面规格说明
├── sign-up/                    # 注册页面  
│   ├── page.tsx               # 注册页面组件
│   └── spec.md               # 注册页面规格说明
├── main/                       # 主功能页面（用户信息填写）
│   ├── page.tsx               # 用户资料填写页面
│   ├── actions.ts             # 服务器端操作（创建/取消预约）
│   └── spec.md               # 主功能页面规格说明
└── profile/                    # 个人资料页面
    ├── page.tsx               # 个人资料展示页面
    └── spec.md               # 个人资料页面规格说明
```

## Core Files Description

### `/page.tsx` - SuperC 主页
- **功能**: SuperC 系统的着陆页，展示系统功能和引导用户进入
- **特点**: 
  - Hero section 介绍系统功能
  - 动画终端展示预约流程
  - 感谢捐赠者的滚动横幅
  - 功能特性展示（自动预约、告别手动查询、信息安全）
- **依赖**: Terminal 组件, SuperCHeader 组件, SWR 用户状态管理
- **路由逻辑**: 根据用户登录状态导航到 `/superc/main` 或 `/superc/login`

### `/terminal.tsx` - 终端动画组件
- **功能**: 模拟预约系统工作流程的动画终端界面
- **特点**: 
  - 步进式动画展示预约流程
  - 复制功能
  - Mac 风格终端界面
- **技术**: React hooks (useState, useEffect), 定时器动画

### `/components/header.tsx` - 页面头部
- **功能**: 全局导航头部组件
- **特点**:
  - 品牌 Logo 和导航
  - 用户状态管理（登录/登出）
  - 用户头像下拉菜单
  - 个人资料和登出功能
- **依赖**: SWR, 用户认证 actions, UI 组件库

## Page Modules

### `/login/` - 登录模块
重用主应用的登录组件，配置为 SuperC 模块专用

### `/sign-up/` - 注册模块  
重用主应用的注册组件，配置为 SuperC 模块专用

### `/main/` - 主功能模块
用户填写个人信息和预约设置的核心页面，包含表单验证和预约逻辑

### `/profile/` - 个人资料模块
展示用户预约信息、状态管理和取消预约功能

## Technical Architecture

### State Management
- **SWR**: 用户状态和数据获取
- **Local State**: 表单状态、加载状态、错误处理

### Database Integration
- **Schema**: `appointmentProfiles` 表存储用户预约信息
- **Actions**: Server actions 处理数据库操作
- **Validation**: Zod schema 验证表单数据

### UI Framework
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: 组件库
- **Lucide React**: 图标库
- **react-fast-marquee**: 滚动横幅组件

### Authentication
- 集成主应用的认证系统
- 用户会话管理
- 路由保护

## Key Features

1. **自动预约系统**: 监控 SuperC 官网，自动预约可用时间段
2. **用户管理**: 注册、登录、个人资料管理
3. **预约状态跟踪**: 等待中、已预约等状态管理
4. **排队系统**: 显示排队位置和预计等待时间
5. **多语言支持**: 德文表单标签，中文用户界面
6. **响应式设计**: 移动端和桌面端适配
7. **错误处理**: 完善的表单验证和错误提示
8. **数据安全**: 防重复注册，数据验证

## Development Notes

- 使用 Next.js App Router 架构
- Server Actions 处理表单提交
- TypeScript 类型安全
- 遵循主应用的代码规范和架构模式
- 集成主应用的认证和数据库系统