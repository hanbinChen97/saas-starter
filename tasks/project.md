# 项目介绍文档

## 版本一：详细版本

### 1. 项目名称
**EmAilX - 智能邮件管理 SaaS 平台**

### 2. 项目简介
EmAilX 是一个基于 Next.js 构建的企业级 SaaS 智能邮件管理平台，集成了先进的 AI 技术，为用户提供高效的邮件处理、智能回复生成和团队协作解决方案。平台采用现代化的 Outlook 风格界面设计，支持多账户管理、实时邮件同步、AI 助手功能和完整的订阅付费体系。

### 3. 项目技术栈
- **核心框架**：Next.js 15 (App Router + API Routes) + React 19 + TypeScript
- **AI 集成**：Azure OpenAI (GPT-4.1) + AI SDK + Agent LLM
- **邮件服务**：IMAP (node-imap) + SMTP (nodemailer) + 自定义邮件解析器
- **状态管理**：SWR + React Hooks
- **认证授权**：JWT (jose) + HTTP-only Cookies
- **开发工具**：Claude Code + Turbopack + ESLint + Zod 表单验证
- **其他技术**：PostgreSQL + Drizzle ORM、shadcn/ui + Tailwind CSS、Stripe 支付集成

### 4. 项目架构
- **多应用架构**：主 SaaS 应用 + 独立仪表板应用
- **团队多租户**：基于团队的数据隔离和权限管理
- **分层设计**：Presentation Layer (UI) → Service Layer (业务逻辑) → Data Layer (数据库)
- **模块化结构**：
  - 认证授权模块 (JWT + 中间件)
  - 邮件服务模块 (IMAP/SMTP 集成)
  - AI 服务模块 (Azure OpenAI 集成)
  - 支付管理模块 (Stripe 集成)
  - 团队协作模块 (多用户管理)
  - 活动日志模块 (用户行为追踪)

### 5. 项目亮点
- **Next.js API Route**：采用 Next.js 15 的 API Routes 和 Server Actions，全栈开发体验
- **个人全栈开发**：从前端到后端完整独立开发，涵盖邮件服务、AI 集成等核心功能
- **Vibe Coding 与 Claude Code**：使用 Claude Code 进行 AI 辅助开发，提升开发效率
- **AI Draft 功能**：集成 Azure OpenAI 自动生成邮件草稿，智能回复建议
- **Agent LLM**：基于大语言模型的智能助手，提供上下文感知的邮件处理
- **实时邮件同步**：基于 IMAP 协议的实时邮件数据同步和状态更新
- **Outlook 风格界面**：现代化分割视图邮件管理界面
- **企业级认证**：JWT 无状态认证 + 自动令牌刷新 + 全局路由保护
- **团队协作**：多用户团队管理、角色权限控制、邀请系统

### 6. 项目未来规划
- **功能扩展**：邮件模板管理、自动化工作流、邮件分析报表
- **AI 功能增强**：情感分析、智能分类、多语言支持
- **集成生态**：第三方邮件服务商集成、CRM 系统对接
- **移动端支持**：React Native 移动应用开发
- **企业级功能**：单点登录 (SSO)、LDAP 集成、合规性管理
- **性能优化**：邮件数据缓存、推送通知、离线支持

---

## 版本二：精简版本

### 1. 项目名称
**EmAilX - 智能邮件管理平台**

### 2. 项目简介
基于 Next.js 的 SaaS 邮件管理平台，集成 AI 技术，提供智能邮件处理和团队协作功能。

### 3. 项目技术栈
- **核心**：Next.js 15 (API Routes) + React 19 + TypeScript
- **AI**：Azure OpenAI (GPT-4.1) + Agent LLM
- **邮件**：IMAP + SMTP + 自定义解析器
- **开发**：Claude Code + Turbopack
- **其他**：PostgreSQL + JWT + shadcn/ui

### 4. 项目架构
多租户 SaaS 架构，包含认证、邮件服务、AI 集成、支付管理四大核心模块。

### 5. 项目亮点
- **Next.js API Route**：采用 Next.js 15 的 API Routes 和 Server Actions，全栈开发体验
- **个人全栈开发**：从前端到后端完整独立开发，涵盖邮件服务、AI 集成等核心功能
- **Vibe Coding 与 Claude Code**：使用 Claude Code 进行 AI 辅助开发，提升开发效率
- **AI Draft 功能**：集成 Azure OpenAI 自动生成邮件草稿，智能回复建议
- **Agent LLM**：基于大语言模型的智能助手，提供上下文感知的邮件处理
- **实时邮件同步**：基于 IMAP 协议的实时邮件数据同步和状态更新
- **Outlook 风格界面**：现代化分割视图邮件管理界面

### 6. 项目未来规划
扩展 AI 功能、移动端支持、企业级集成、性能优化。