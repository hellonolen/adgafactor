# FactorFlow — Invoice Factoring Web Application

A modern, premium invoice factoring platform built with Next.js 14+, TypeScript, Tailwind CSS, and Recharts.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** (App Router) | Framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |
| **next-themes** | Light/dark mode |
| **Zustand** | State management |
| **Zod + React Hook Form** | Form validation |

## 🚀 Getting Started

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features Implemented

### Pages
| Route | Description |
|-------|-------------|
| `/login` | Authentication with role selector (Business/Admin/Debtor) |
| `/dashboard` | Role-based dashboard with KPI cards and charts |
| `/invoices` | Invoice list with filtering, sorting, pagination |
| `/invoices/new` | 3-step invoice submission wizard with OCR simulation |
| `/invoices/[id]` | Invoice detail with funding timeline and fee breakdown |
| `/debtors` | Debtor management with credit utilization cards |
| `/facility` | Facility overview with utilization and fee structure |
| `/reports` | Analytics with area charts, aging reports, trend lines |
| `/settings` | Profile, notifications (toggles), security, billing |
| `/admin/dashboard` | Admin portal with client list and approval queue |
| `/onboarding` | 5-step application form (KYC, bank, docs, e-sign) |

### Core Features
- ✅ **Light/Dark mode** — Persists to localStorage, defaults to light
- ✅ **Responsive design** — Mobile-first, works on all screen sizes
- ✅ **Role-based access** — Business Owner, Factor Admin, Debtor views
- ✅ **Invoice factoring calculations** — Advance amount, reserve, fees, net advance
- ✅ **OCR simulation** — Auto-fills invoice fields from uploaded PDF
- ✅ **Data visualization** — Area charts, bar charts, line charts, pie charts
- ✅ **Sortable/filterable tables** — All data tables with search
- ✅ **Multi-step onboarding** — KYC, bank verification, document upload, e-sign
- ✅ **PWA ready** — manifest.json, meta tags, installable
- ✅ **Toast notifications** — User feedback system

### Financial Features
- ✅ Advance calculation engine (rate × amount − fees − prior balance)
- ✅ Tiered fee structure display
- ✅ Debtor credit limits and concentration tracking
- ✅ Accounts receivable aging buckets
- ✅ Facility utilization with visual progress bar
- ✅ Reserve release calculations

## 📁 Project Structure

```
app/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── invoices/           # Invoice management
│   ├── debtors/            # Debtor management
│   ├── facility/           # Facility overview
│   ├── reports/            # Analytics & reports
│   ├── settings/           # User settings
│   ├── admin/              # Admin portal
│   ├── onboarding/         # Application wizard
│   └── login/              # Authentication
├── components/
│   ├── layout/             # Header, Sidebar, AppLayout
│   └── ui/                 # Button, Card, Badge, etc.
├── lib/
│   ├── mock-data.ts        # All mock data fixtures
│   └── utils.ts            # Helpers and calculations
└── types/
    └── index.ts            # TypeScript interfaces
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎨 Theme

The app defaults to **light mode** on first visit. Preferences are persisted to `localStorage` via `next-themes`. Toggle via the moon/sun icon in the header.

## 📄 PRD

See `invoice_factoring_prd.pdf` in the project root for the full product requirements document.

## 🔜 Future Enhancements

- Backend API integration (REST or GraphQL)
- Real KYC/AML provider integration (Stripe Identity, Persona)
- Real OCR integration (AWS Textract, Google Document AI)
- Plaid bank account verification
- ACH/Wire disbursement integration
- Real-time notifications (WebSockets)
- E-signature integration (DocuSign)
- QuickBooks/Xero accounting sync
- Mobile push notifications (PWA)
- Multi-tenant admin panel
