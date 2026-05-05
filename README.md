# Credit Risk Intelligent Predictor

A modern credit risk assessment and prediction platform that leverages machine learning to help financial institutions make data-driven lending decisions. Built with React, TypeScript, and Supabase.

## Features

- **Individual Risk Assessment**: Evaluate credit risk for individual loan applications
- **Batch Processing**: Upload CSV files for bulk credit risk predictions
- **Interactive Dashboard**: Visualize risk metrics, KPIs, and trends with Recharts
- **Assessment History**: Track and review past credit assessments
- **Secure Authentication**: User management with Supabase Auth
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: React Context + React Query (TanStack Query)
- **Database/Auth**: Supabase (PostgreSQL + Auth + Real-time)
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library
- **Backend**: Flask API for ML predictions (Python)

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

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Python 3.8+ (for Flask backend, if running locally)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd credit-insight-hub

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000  # Flask API URL (optional)
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
credit-insight-hub/
├── src/
│   ├── components/     # UI components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Third-party integrations
│   ├── lib/            # Utilities
│   ├── pages/          # Page components
│   └── App.tsx         # Root component
├── public/             # Static assets
├── supabase/           # Supabase config and migrations
├── .env.example        # Environment variables example
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
└── README.md           # This file
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Recharts](https://recharts.org/) for the charting library
