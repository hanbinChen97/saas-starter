
# EmAilX - 智能邮件管理平台

基于 Next.js 构建的现代化智能邮件管理 SaaS 平台，集成 Azure OpenAI 技术，为用户提供全功能邮件客户端和 AI 智能助手服务。

You can check out the live demo at [Live Demo](https://saas-starter-khaki-five.vercel.app/).

## Demo:

[![Watch on YouTube](https://img.shields.io/badge/-Watch%20on%20YouTube-red?logo=youtube&labelColor=grey)](https://www.youtube.com/watch?v=m35XBSk6akE)

<div align="center">
  <video src="https://github.com/user-attachments/assets/a663164d-9521-4b75-81ed-dbf09df60f53" autoplay loop muted playsinline width="600">
    Your browser does not support the video tag.
  </video>
</div>

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **AI Engine**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/)
- **Email Protocols**: IMAP/SMTP with node-imap & nodemailer

## ✨ 核心功能 Features

### 🤖 AI 智能助手 (AI Chatbot)
- **一键生成回复**: 点击"✨ AI Draft"按钮，AI 自动分析邮件内容生成智能回复
- **对话式交互**: 内置聊天界面，与 AI 助手实时对话优化邮件草稿
- **上下文理解**: 深度分析邮件主题、发件人、内容，生成高度相关的回复
- **迭代优化**: 支持用户反馈，如"让回复更正式一些"、"缩短内容"等

### 🎨 多种语调设置 (Multiple Tones)
AI 提供 **6 种不同风格** 的回复选项，一键切换：

#### 语言选项
- **🇺🇸 English**: 英文回复，适合国际交流
- **🇩🇪 Deutsch**: 德文回复，自动检测并匹配原邮件语言

#### 语调风格
- **📝 Formal**: 专业正式语调，适合商务邮件
- **😊 Casual**: 友好非正式语调，适合日常交流
- **⚡ Concise**: 简洁直接，快速表达要点
- **📖 Detailed**: 详细全面，提供完整信息




### 🔒 安全特性
- **凭据保护**: 用户密码不存储，仅用于实时验证
- **TLS 加密**: 支持 SSL/TLS 安全连接
- **按需验证**: 每次操作独立验证，提高安全性

## 🎯 使用场景

- **个人邮件管理**: 智能整理和回复个人邮件
- **商务沟通**: AI 助手生成专业的商务回复
- **多语言环境**: 支持中英德多语言邮件处理
- **团队协作**: 标准化邮件回复风格和质量

## 🛠️ 技术架构

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Node.js
- **邮件服务**: node-imap (IMAP) + nodemailer (SMTP)
- **AI 服务**: Azure OpenAI GPT-4.1
- **数据验证**: Zod 类型安全验证
- **本地存储**: IndexedDB 邮件缓存
- **UI 组件**: shadcn/ui 组件库
