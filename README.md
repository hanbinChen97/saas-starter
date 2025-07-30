
# EmAilX - Intelligent Email Management Platform

A modern intelligent email management SaaS platform built with Next.js, integrating Azure OpenAI technology to provide users with an AI smart assistant services.

You can check out the live demo at [Live Demo](https://saas-starter-khaki-five.vercel.app/).

## Demo:

[![Watch on YouTube](https://img.shields.io/badge/-Watch%20on%20YouTube-red?logo=youtube&labelColor=grey)](https://www.youtube.com/watch?v=m35XBSk6akE)

<div align="center">
  <video src="https://github.com/user-attachments/assets/a663164d-9521-4b75-81ed-dbf09df60f53" autoplay loop muted playsinline width="600">
    Your browser does not support the video tag.
  </video>
</div>

## Tech Stack

- **Framework**: React, Next.js
- **Database**: Postgres, [Supabase](https://supabase.com/)
- **ORM**: Drizzle
- **UI Library**: shadcn/ui
- **AI Engine**: Azure OpenAI
- **Email Protocols**: IMAP/SMTP with node-imap & nodemailer

## ✨ Core Features

### 🤖 AI Smart Assistant (AI Chatbot)

- **One-Click Reply Generation**: Click the "✨ AI Draft" button to automatically analyze email content and generate intelligent replies
- **Conversational Interaction**: Built-in chat interface for real-time conversation with AI assistant to optimize email drafts
- **Iterative Optimization**: Support user feedback like "make the reply more formal" or "shorten the content"

## 🛠️ Technical Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Node.js
- **Email Service**: node-imap (IMAP) + nodemailer (SMTP)
- **AI Service**: Azure OpenAI GPT-4.1
- **Data Validation**: Zod type-safe validation
- **Local Storage**: IndexedDB email caching
- **UI Components**: shadcn/ui component library
