# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `bun dev` or `npm run dev` - Start development server with Turbo on port 3000
- **Build**: `bun run build` or `npm run build` - Build the application
- **Lint & Type Check**: `bun run lint` or `npm run lint` - Run TypeScript compiler and Next.js linting
- **Format**: `bun run format` - Format code using Biome
- **Database Setup**: `cd database && ./setup.sh` - Initialize PostgreSQL database with schema and seed data

## Architecture Overview

This is a Next.js 15 invoice management application ("Instructor Lounge") built with TypeScript, React, PostgreSQL, and shadcn/ui components.

### Tech Stack
- **Frontend**: Next.js 15 App Router with TypeScript and React 18
- **Database**: PostgreSQL with connection pooling via `pg` library
- **Styling**: Tailwind CSS with shadcn/ui component library  
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF for invoice exports
- **State Management**: React Context (SettingsContext) + local component state
- **Charts**: Recharts for dashboard analytics

### Database Architecture
- **Connection**: PostgreSQL pool via `src/lib/db.ts` with environment-based config
- **Tables**: clients, courses, invoices, invoice_items with UUID primary keys
- **Setup**: Automated via `database/setup.sh` script with schema.sql and seed.sql
- **Migrations**: Manual SQL files in database/ directory for schema updates
- **API**: RESTful endpoints in `src/app/api/` for CRUD operations

### Application Structure
- **Main Container**: `src/app/page.tsx` - Root component with sidebar navigation and tab routing
- **Core Modules**:
  - `InvoiceManagement.tsx` - Primary invoice interface with list/detail split-pane layout
  - `Dashboard.tsx` - Analytics dashboard with charts and KPIs
  - `ClientManagement.tsx` - Client CRUD operations
  - `Settings.tsx` - Company details, payment info, and invoice defaults
- **Settings System**: Global SettingsContext with localStorage persistence, flows through PDF generation
- **Business Logic**: `PaymentService` handles invoice status calculations and overdue detection

### Key Features
- **Invoice Management**: Full CRUD with status tracking (draft/pending/paid/overdue)
- **Client-Specific Settings**: Optional course information collection per client
- **PDF Generation**: Styled invoice exports using company settings
- **Payment Tracking**: Automated overdue detection and payment reminders
- **Responsive Design**: Mobile-optimized with sidebar navigation
- **Filter & Search**: Multi-criteria invoice filtering with status tabs

### Data Flow
1. **Settings**: SettingsContext → localStorage persistence → PDF generation integration
2. **Invoices**: Database → API routes → React state → UI components
3. **Status Updates**: PaymentService calculates overdue based on due dates
4. **Client Integration**: Course requirements toggle affects invoice forms

## Development Notes

### Code Style
- **Formatter**: Biome with double quotes, 2-space indentation
- **Linting**: ESLint with Next.js/TypeScript rules
- **Accessibility**: Many a11y rules disabled for rapid development
- **TypeScript**: Strict mode with unused variable warnings disabled

### Database Development
- **Local Setup**: Requires PostgreSQL on port 5433 (customizable via .env.local)
- **Environment Variables**: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- **Schema Changes**: Create migration files in database/ directory
- **Testing**: Use `src/utils/testDb.ts` for database connection testing

### Component Patterns
- **UI Components**: Exclusively use shadcn/ui components for consistency
- **Form Handling**: React Hook Form + Zod validation throughout
- **State Management**: Context for global state (Settings), local state for UI
- **Error Handling**: Toast notifications via Sonner library
- **Loading States**: Inline loading indicators and skeleton states

### API Development
- **Structure**: Next.js API routes in `src/app/api/`
- **Database**: Use connection pool from `src/lib/db.ts`
- **Error Handling**: Consistent HTTP status codes and error messages
- **Validation**: Server-side validation for all endpoints

### Package Management
- **Primary**: Bun (lockfile: bun.lock)
- **Fallback**: All commands work with npm/yarn/pnpm

### Deployment
- **Target**: Netlify (netlify.toml configuration present)
- **Build**: Next.js static export optimized build
- **Database**: Configure production PostgreSQL connection via environment variables

## Important Reminders

- **Font Usage**: Application uses Roboto (Google Fonts) for "Instructor Lounge" branding with bold weight
- **Status Logic**: "Overdue" is calculated, not stored - use `PaymentService.isOverdue()` for filtering
- **Client Requirements**: `requiresCourseInfo` field controls course section visibility in invoice forms
- **PDF Integration**: Company settings from SettingsContext automatically flow to PDF generation
- **Database Migrations**: Always test migrations locally before applying to production