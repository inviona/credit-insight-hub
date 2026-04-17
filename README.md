# Credit Risk Intelligent Predictor

A credit risk assessment and prediction platform built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: React Context + React Query
- **Database/Auth**: Supabase
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest

## Software Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui component library
│   └── *.tsx           # Custom components (DashboardLayout, AuthGuard, etc.)
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
├── integrations/       # Third-party service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utilities and API helpers
├── pages/              # Route-level page components
└── App.tsx             # Root component with routing
```

### Core Pages

| Page | Description |
|------|-------------|
| `LandingPage` | Public marketing/landing page |
| `LoginPage` / `RegisterPage` | Authentication pages |
| `DashboardPage` | Main dashboard with KPIs and charts |
| `AssessmentPage` | Single credit risk assessment form |
| `BatchPage` | Bulk CSV processing for credit predictions |
| `HistoryPage` | View past assessment results |

### Component Architecture

```
App (Root)
├── QueryClientProvider (React Query)
│   └── TooltipProvider
│       └── BrowserRouter
│           └── AuthProvider
│               └── Routes
│                   ├── Public Routes (Landing, Login, Register)
│                   └── Protected Routes (wrapped in AuthGuard)
│                       └── DashboardLayout
│                           └── Page Components (Dashboard, Assessment, Batch, History)
```

### Key Design Patterns

**Protected Routes**: The `AuthGuard` component wraps protected pages and redirects unauthenticated users to login.

**Layout Pattern**: The `DashboardLayout` provides a consistent sidebar navigation structure for all authenticated pages.

**Authentication Flow**: `AuthContext` manages user session state using Supabase's auth listeners and provides `useAuth()` hook for consuming components.

**API Layer**: The `lib/api.ts` provides a centralized API client that communicates with a Flask backend for predictions and Supabase Edge Functions for batch processing.

### Routing Structure

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | LandingPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/dashboard` | DashboardPage | Yes |
| `/assess` | AssessmentPage | Yes |
| `/batch` | BatchPage | Yes |
| `/history` | HistoryPage | Yes |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_API_URL=your_flask_api_url  # optional
```
