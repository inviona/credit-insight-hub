```mermaid
%% Figure 3.4 — Technology Stack Architecture
%% Layered architecture showing principal technologies across all system layers

graph TB
    classDef frontend fill:#1E3A5F,color:#fff,stroke:#2D5F8A,stroke-width:2px,font-weight:700
    classDef backend fill:#2D5F8A,color:#fff,stroke:#4A7FB5,stroke-width:2px,font-weight:700
    classDef ml fill:#378ADD,color:#fff,stroke:#5A9DE0,stroke-width:2px,font-weight:700
    classDef data fill:#1B5E20,color:#fff,stroke:#2E7D32,stroke-width:2px,font-weight:700
    classDef ai fill:#F0F4FA,color:#1E3A5F,stroke:#1E3A5F,stroke-width:2px,font-weight:700
    classDef tech fill:#FFFFFF,color:#1E3A5F,stroke:#C0D0E0,stroke-width:1px

    subgraph L1["Frontend Layer"]
        direction TB
        FE["React 18 · TypeScript · Vite<br/>Tailwind CSS · shadcn/ui · Recharts<br/>React Router · TanStack Query · Zod"]:::frontend
    end

    L1 -->|"↓ HTTP / REST"| L2

    subgraph L2["Backend Layer"]
        direction TB
        BE["FastAPI · Python 3.11<br/>Pydantic · Uvicorn<br/>Docker · Railway / Render"]:::backend
    end

    L2 -->|"↓ Internal calls"| L3

    subgraph L3["Machine Learning Layer"]
        direction TB
        ML["XGBoost Classifier<br/>SHAP TreeExplainer<br/>scikit-learn · joblib · imbalanced-learn"]:::ml
    end

    L3 -->|"↓ Read / Write"| L4

    subgraph L4["Data Layer"]
        direction TB
        DS["Supabase PostgreSQL<br/>Row-Level Security<br/>Auth (JWT · bcrypt) · Edge Functions"]:::data
    end

    L4 -->|"↓ External API"| L5

    subgraph L5["AI Assistant Layer"]
        direction TB
        AI["Mistral AI API<br/>mistral-small-latest<br/>react-markdown"]:::ai
    end

    T1[<i>Frontend: Vercel / Static Host</i>]:::tech
    T2[<i>Backend: Railway / Render (Docker)</i>]:::tech
    T3[<i>ML: Docker container, loaded at startup</i>]:::tech
    T4[<i>Data: Supabase Cloud Platform</i>]:::tech
    T5[<i>AI: External API, no local model</i>]:::tech

    L1 -.- T1
    L2 -.- T2
    L3 -.- T3
    L4 -.- T4
    L5 -.- T5
```
