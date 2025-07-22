
# EmAilX - Intelligent Email Management Platform

A modern intelligent email management SaaS platform built with Next.js, integrating Azure OpenAI technology to provide users with a full-featured email client and AI smart assistant services.

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

## ✨ Core Features

### 🤖 AI Smart Assistant (AI Chatbot)
- **One-Click Reply Generation**: Click the "✨ AI Draft" button to automatically analyze email content and generate intelligent replies
- **Conversational Interaction**: Built-in chat interface for real-time conversation with AI assistant to optimize email drafts
- **Context Understanding**: Deep analysis of email subject, sender, and content to generate highly relevant replies
- **Iterative Optimization**: Support user feedback like "make the reply more formal" or "shorten the content"

### 🎨 Multiple Tone Settings (Multiple Tones)
AI provides **6 different style** reply options with one-click switching:

#### Language Options
- **🇺🇸 English**: English replies, suitable for international communication
- **🇩🇪 Deutsch**: German replies, automatically detects and matches original email language

#### Tone Styles
- **📝 Formal**: Professional and formal tone, suitable for business emails
- **😊 Casual**: Friendly and informal tone, suitable for daily communication
- **⚡ Concise**: Brief and direct, quickly express key points
- **📖 Detailed**: Comprehensive and detailed, provides complete information

### 📧 Complete Email Management
- **Multi-Server Support**: Gmail, Outlook, Yahoo, and custom IMAP/SMTP servers
- **Progressive Loading**: Priority loading of first 20 emails, background intelligent sync of complete list
- **Local Caching**: IndexedDB local storage for improved access speed and offline experience
- **On-Demand Connection**: Independent connection for each operation, avoiding session management complexity

### 🔧 Email Operations
- **Email Management**: Mark as read/unread, star/unstar, delete emails
- **Content Viewing**: Support for HTML and plain text email formats
- **Compose & Send**: Complete email composition interface with To, CC, BCC support
- **Reply Features**: Smart reply and traditional manual reply

### 🚀 Performance Features
- **Smart Caching**: Local caching of email content, reducing redundant requests
- **Connection Monitoring**: Automatic detection of IMAP connection status, guides reconnection when disconnected
- **Error Recovery**: Comprehensive error handling and retry mechanisms
- **Responsive Design**: Optimized for both desktop and mobile devices

### 🔒 Security Features
- **Credential Protection**: User passwords are not stored, only used for real-time verification
- **TLS Encryption**: Support for SSL/TLS secure connections
- **On-Demand Verification**: Independent verification for each operation, enhanced security

## 🎯 Use Cases

- **Personal Email Management**: Intelligent organization and reply to personal emails
- **Business Communication**: AI assistant generates professional business replies
- **Multilingual Environment**: Support for Chinese, English, and German email processing
- **Team Collaboration**: Standardized email reply style and quality

## 🛠️ Technical Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Node.js
- **Email Service**: node-imap (IMAP) + nodemailer (SMTP)
- **AI Service**: Azure OpenAI GPT-4.1
- **Data Validation**: Zod type-safe validation
- **Local Storage**: IndexedDB email caching
- **UI Components**: shadcn/ui component library
