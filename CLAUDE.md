# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Main SaaS Application (root directory)
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm db:setup` - Setup database environment and create .env file
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with test data (creates user: test@test.com, password: admin123)
- `pnpm db:generate` - Generate database schema
- `pnpm db:studio` - Open Drizzle Studio for database management

### Next Dashboard (next-dashboard directory)
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application
- `pnpm lint` - Run ESLint

### Stripe Development
- `stripe login` - Login to Stripe CLI
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` - Listen for Stripe webhooks locally

## Project Architecture

This is a Next.js SaaS starter with two main applications:
1. **Main SaaS Application** (root) - Full-featured SaaS with authentication, payments, and team management
2. **Next Dashboard** (next-dashboard/) - Separate dashboard application with email management features

### Core Architecture Patterns

#### Authentication & Authorization
- JWT-based authentication using `jose` library stored in HTTP-only cookies
- Session management in `app/lib/auth/session.ts` with automatic token refresh
- Global middleware (`middleware.ts`) protects `/dashboard` routes and refreshes sessions
- Action middleware (`app/lib/auth/middleware.ts`) provides validation helpers:
  - `validatedAction()` - Validates form data with Zod schemas
  - `validatedActionWithUser()` - Validates + requires authentication
  - `withTeam()` - Validates + requires team membership

#### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `app/lib/db/schema.ts` with relations
- **Core entities**: Users, Teams, TeamMembers, ActivityLogs, Invitations
- **Queries**: Database operations centralized in `app/lib/db/queries.ts`
- **Migrations**: Auto-generated in `app/lib/db/migrations/`

#### Team-based Multi-tenancy
- Users belong to teams through `team_members` junction table
- Role-based access control (Owner/Member roles)
- Team-scoped data with activity logging
- Invitation system for team member management

#### Payment Integration
- Stripe integration in `app/lib/payments/stripe.ts`
- Subscription management with customer portal
- Webhook handling for subscription changes
- Trial period support (14 days default)

#### Project Structure Conventions
- **Subproject Organization**: Code organized into `app/email/` and `app/supac/` subprojects
- **Server Actions**: Form submissions and mutations
- **Route Groups**: `(dashboard)` and `(login)` for layout organization  
- **API Routes**: RESTful endpoints - shared in `app/api/`, project-specific in `app/{project}/api/`
- **Component Organization**: Shared UI components in `app/components/ui/`, project-specific in `app/{project}/components/`
- **Type Safety**: TypeScript with Zod validation throughout
- **Library Code**: Shared utilities in `app/lib/`, project-specific in `app/{project}/lib/`
- **Custom Hooks**: Shared hooks would be in `app/hooks/`, project-specific in `app/{project}/hooks/`
- **App Directory Structure**: Following Next.js 13+ App Router best practices

### Key Files and Locations
- **Database Config**: `drizzle.config.ts`
- **Environment Setup**: `app/lib/db/setup.ts`
- **Global Middleware**: `middleware.ts` (session management)
- **Action Middleware**: `app/lib/auth/middleware.ts` (validation helpers)
- **Stripe Config**: `app/lib/payments/stripe.ts`
- **Database Schema**: `app/lib/db/schema.ts`
- **Database Queries**: `app/lib/db/queries.ts`

### Email Management System (Outlook-style Layout)
- **Email Components**: `app/email/components/email/` - Modern split-view email interface
  - `EmailList.tsx` - Sidebar email list with compact items
  - `EmailListItem.tsx` - Individual email item in the sidebar
  - `EmailView.tsx` - Right panel for viewing selected email content
  - `EmailCard.tsx` - Legacy full-width email card (kept for compatibility)
- **Email Service**: `app/email/lib/email-service/` - IMAP email service implementation using **node-imap**
  
- **Email Types**: `app/email/lib/email-service/mail-imap/types.ts` - Type definitions for email messages, folders, and configuration
- **Email Parser**: `app/email/lib/email-service/mail-imap/email-parser.ts` - Utility for parsing and processing IMAP email data
- **Email Actions**: `app/email/lib/email-service/mail-imap/actions.ts` - Server actions for email operations (fetch, mark as read/unread, delete)
- **Email Hooks**: `app/email/hooks/` - React hooks for managing email state with real IMAP integration
- **Email Pages**: `/email/` - Standalone email application routes
  - Email landing page and authentication
  - IMAP login and email viewing interface
- **Email API**: `app/email/api/` - Email-specific API endpoints

#### Email Interface Features
- ✅ **Split View Layout**: Outlook-style left sidebar + right content panel
- ✅ **Email Selection**: Click to select and view emails
- ✅ **Compact List Items**: Sender, subject, preview, time/date display
- ✅ **Visual Indicators**: Unread dots, attachment icons, flagged status
- ✅ **Responsive Time Display**: Show time for today's emails, date for older ones
- ✅ **Full Content View**: Complete email with headers, body, and attachments
- ✅ **Email Actions**: Mark as read/unread, delete from the detail view
- ✅ **State Management**: Selected email persists during operations

#### Email Configuration (Environment Variables)
- `EXCHANGE_USERNAME` - Email account username
- `EXCHANGE_PASSWORD` - Email account password  
- `RWTH_MAIL_SERVER` - IMAP server hostname
- `RWTH_MAIL_SERVER_PORT` - IMAP server port (typically 993 for SSL)
- `RWTH_MAIL_SERVER_ENCRYPTION` - Encryption type (SSL/TLS)

#### Real Email Features
- ✅ IMAP connection to real email servers
- ✅ Fetch emails from INBOX and other folders
- ✅ Mark emails as read/unread
- ✅ Delete emails
- ✅ View email attachments
- ✅ Connection status monitoring
- ✅ Folder browsing
- ✅ Unread email filtering
- ✅ Email content parsing (text and HTML)

### Development Notes
- Uses Next.js 15 with Turbopack for fast development
- Styled with Tailwind CSS and shadcn/ui components
- Form validation with Zod schemas
- Activity logging for user actions and team events
- Subscription status tracking with Stripe webhooks
- Real email integration using IMAP with RWTH Aachen University mail server
- Email operations are performed server-side for security and performance


使用 react 的 server action 来实现 api 的调用。


### SuperC Automation System (SupaC)
- **SuperC Components**: `app/supac/components/` - SuperC-specific UI components
- **SuperC Pages**: `/supac/` - SuperC automation application routes
  - SuperC landing page and user registration
  - Profile management and automation settings
  - Main application dashboard for SuperC booking
- **SuperC API**: `app/supac/api/` - SuperC-specific API endpoints
- **SuperC Hooks**: `app/supac/hooks/` - React hooks for SuperC functionality (ready for future use)
- **SuperC Libraries**: `app/supac/lib/` - SuperC-specific utilities and services (ready for future use)

#### SuperC Features
- ✅ Automatic SuperC appointment booking system
- ✅ User registration and profile management
- ✅ Integration with shared authentication system
- ✅ Terminal-style interface for automation status
- ✅ Standalone application with its own routing

### Project Organization
The application is now organized into two main subprojects:
1. **Email Project** (`/email`) - Complete email management system with IMAP/SMTP integration
2. **SuperC Project** (`/supac`) - SuperC appointment automation system

Both projects share common infrastructure:
- Authentication system (`app/lib/auth/`)
- Database layer (`app/lib/db/`)
- Payment integration (`app/lib/payments/`)
- Shared UI components (`app/components/ui/`)

llm 使用 azure openai 的 gpt-4.1 模型，argument 在 .env 中配置，参考 .env.example 文件。









