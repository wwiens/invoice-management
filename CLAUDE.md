# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `bun dev` or `npm run dev` - Start development server with Turbo
- **Build**: `bun run build` or `npm run build` - Build the application
- **Lint & Type Check**: `bun run lint` or `npm run lint` - Run TypeScript compiler and Next.js linting
- **Format**: `bun run format` - Format code using Biome

## Architecture Overview

This is a Next.js 15 invoice management application built with TypeScript, React, and shadcn/ui components.

### Core Structure
- **Frontend**: Next.js App Router with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks (useState, useMemo, useEffect)
- **Data Flow**: Props drilling from main page component to child components
- **Mock Data**: Static data in `/src/data/` for development

### Key Components
- `src/app/page.tsx` - Main application container with tab routing
- `src/components/InvoiceManagement.tsx` - Primary invoice interface with list/detail views
- `src/components/Dashboard.tsx` - Analytics and overview dashboard
- `src/types/invoice.ts` - Core TypeScript interfaces for Invoice, InvoiceStatus, etc.
- `src/utils/paymentService.ts` - Business logic for invoice status updates
- `src/utils/pdfGenerator.ts` - PDF export functionality using jsPDF

### Component Architecture
- **Sidebar Navigation**: Tab-based routing handled in main page component
- **Invoice List/Detail**: Split-pane interface for browsing and viewing invoices
- **Payment Reminders**: Separate tab for overdue invoice management
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Consistent use of shadcn/ui components throughout

### Data Model
- Core entity is `Invoice` with nested `InvoiceItem[]` and client information
- Invoice statuses: 'paid' | 'pending' | 'draft' | 'overdue'
- Automatic status calculation based on due dates via `PaymentService`

## Development Notes

### Code Style
- Uses Biome for formatting (double quotes, 2-space indentation)
- ESLint with Next.js and TypeScript rules
- Many accessibility rules disabled in both tools
- Unused variables warnings disabled for development

### Package Manager
- Primarily uses Bun (lockfile: bun.lock)
- All commands work with npm/yarn/pnpm as fallbacks

### Deployment
- Configured for Netlify deployment (netlify.toml present)
- Next.js static export optimized build