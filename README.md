# 🧾 Invoice Management System

A modern, full-featured invoice management application built with Next.js 15, TypeScript, and PostgreSQL. Perfect for instructors, freelancers, and small businesses who need professional invoice generation and client management.

![Invoice Management Dashboard](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## ✨ Features

### 📊 **Dashboard & Analytics**
- Real-time financial overview with charts and KPIs
- Revenue tracking and payment status analytics
- Overdue invoice alerts and payment reminders

### 📋 **Invoice Management**
- Create, edit, and manage professional invoices
- Automatic invoice numbering and status tracking
- PDF generation with customizable company branding
- Support for multiple payment methods and terms

### 👥 **Client Management**
- Comprehensive client database with contact information
- Billing address management
- Client-specific settings and course requirements
- Default pricing and payment terms per client

### 💳 **Payment Tracking**
- Multiple payment status tracking (Draft, Pending, Paid, Overdue)
- Automatic overdue detection based on due dates
- Payment method and transaction ID recording
- Payment date tracking and history

### 🎓 **Course Integration**
- Optional course information collection per client
- Course name, ID, cohort, and training dates
- Flexible course requirements per client relationship

### 🎨 **Modern UI/UX**
- Responsive design optimized for desktop and mobile
- Clean, professional interface with shadcn/ui components
- Dark/light mode support
- Accessible design with keyboard navigation

### 📄 **PDF Export**
- Professional invoice PDF generation
- Company branding integration
- Customizable templates and layouts
- Batch export capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/invoice-management.git
   cd invoice-management
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=invoice_management
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # Optional: Firebase for authentication
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   # ... other Firebase config
   ```

4. **Set up the database**
   ```bash
   cd database
   ./setup.sh
   ```

5. **Start the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Database**: PostgreSQL with connection pooling
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics dashboard
- **PDF**: jsPDF for invoice generation
- **State**: React Context + localStorage persistence

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── page.tsx          # Main application
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Database connection
│   └── validations.ts    # Zod schemas
├── utils/                 # Helper functions
└── styles/               # Global styles

database/
├── schema.sql            # Database schema
├── seed.sql             # Sample data
├── setup.sh             # Automated setup script
├── backup.sh            # Database backup utility
└── restore.sh           # Database restore utility
```

### Database Schema

- **clients**: Customer information and billing details
- **invoices**: Invoice records with payment tracking
- **invoice_items**: Line items for each invoice
- **courses**: Course catalog (optional)
- **user_settings**: User preferences and company settings

## 🛠️ Development

### Available Scripts

```bash
# Development
bun dev                 # Start development server
bun build              # Build for production
bun start              # Start production server

# Code Quality
bun lint               # Run ESLint and TypeScript checks
bun format             # Format code with Biome

# Database
cd database && ./setup.sh      # Initialize database
cd database && ./backup.sh     # Create database backup
cd database && ./restore.sh    # Restore from backup
```

### Database Operations

**Create a backup:**
```bash
cd database
./backup.sh
```

**Restore to production:**
```bash
./restore.sh backups/latest_backup.sql.gz \
  --host production-server.com \
  --user postgres \
  --dbname invoice_production
```

## 📱 API Reference

### Invoices
- `GET /api/invoices` - List all invoices with filtering
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

## 🚢 Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify
2. **Configure build settings**:
   - Build command: `bun run build`
   - Publish directory: `out`
3. **Set environment variables** in Netlify dashboard
4. **Deploy!**

### Docker

```bash
# Build image
docker build -t invoice-management .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  invoice-management
```

### Manual Deployment

1. Build the application: `bun run build`
2. Set up PostgreSQL database using `database/production_schema.sql`
3. Configure environment variables
4. Serve the `out` directory with your preferred web server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- **Formatter**: Biome with double quotes, 2-space indentation
- **Linting**: ESLint with Next.js and TypeScript rules
- **Components**: Use shadcn/ui components exclusively
- **Forms**: React Hook Form + Zod validation pattern

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [PostgreSQL](https://www.postgresql.org/) - Powerful relational database
- [Recharts](https://recharts.org/) - Composable charting library

---

<div align="center">
  <p>Built with ❤️ for the <strong>Instructor Lounge</strong></p>
  <p>Perfect for instructors, freelancers, and small businesses</p>
</div>