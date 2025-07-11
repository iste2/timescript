# TimeScript App Architecture

This document describes the target architecture of the timescript application. It is a living document that evolves as we gain experience and make architectural decisions.

## Overview

TimeScript is a modern web application built with Next.js that combines AI-powered functionality with a clean, responsive user interface. The architecture follows a clear separation of concerns with distinct layers for frontend, backend, and AI processing.

## Technology Stack

For detailed information about each framework and library, see [frameworks.md](../frameworks/frameworks.md).

### Frontend

- **Next.js** - React framework for production
- **shadcn/ui** - Component library for UI components
- **Tailwind CSS** - Utility-first CSS framework
- **AI SDK** - Client-side AI interactions and chat hooks

### Backend

- **Supabase** - Backend-as-a-Service for data storage and authentication
- **Next.js API Routes** - Server-side logic

### AI/Agent Framework

- **Mastra** - Agent framework carrying core business logic
- **AI SDK** - Server-client AI communication

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[shadcn/ui Components]
        TW[Tailwind CSS Styling]
        HOOKS[AI SDK Chat Hooks]
        PAGES[Next.js Pages]
    end

    subgraph "Application Layer"
        API[Next.js API Routes]
        MW[Middleware]
        AUTH[Authentication Logic]
    end

    subgraph "AI Layer"
        MASTRA[Mastra Agent Framework]
        AISDK[AI SDK Server]
    end

    subgraph "Data Layer"
        SUPABASE[Supabase Backend]
        DB[(Database)]
        STORAGE[(File Storage)]
        AUTHSVC[Auth Service]
    end

    UI --> PAGES
    TW --> UI
    HOOKS --> PAGES
    PAGES --> API
    API --> MW
    MW --> AUTH
    API --> MASTRA
    MASTRA --> AISDK
    AISDK --> API
    API --> SUPABASE
    SUPABASE --> DB
    SUPABASE --> STORAGE
    SUPABASE --> AUTHSVC
    AUTH --> AUTHSVC
```

## Component Architecture

```mermaid
graph LR
    subgraph "UI Components"
        A[Auth Components]
        B[Business Logic Components]
        C[Common UI Components]
        D[Tutorial Components]
    end

    subgraph "shadcn/ui Base"
        E[Button]
        F[Input]
        G[Card]
        H[Badge]
        I[Dropdown]
        J[Checkbox]
        K[Label]
    end

    A --> E
    A --> F
    A --> G
    B --> E
    B --> F
    B --> G
    C --> E
    C --> F
    C --> G
    D --> E
    D --> F
    D --> G

    E --> TailwindCSS
    F --> TailwindCSS
    G --> TailwindCSS
    H --> TailwindCSS
    I --> TailwindCSS
    J --> TailwindCSS
    K --> TailwindCSS
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAPI
    participant Mastra
    participant AISDK
    participant Supabase

    User->>Frontend: Interacts with UI
    Frontend->>NextAPI: API Request
    NextAPI->>Mastra: Business Logic
    Mastra->>AISDK: AI Processing
    AISDK-->>Mastra: AI Response
    Mastra-->>NextAPI: Processed Result
    NextAPI->>Supabase: Data Operations
    Supabase-->>NextAPI: Data Response
    NextAPI-->>Frontend: API Response
    Frontend-->>User: Updated UI
```

## Authentication Flow

```mermaid
graph TD
    A[User Access] --> B{Authenticated?}
    B -->|No| C[Login/Sign-up Page]
    B -->|Yes| D[Protected Routes]

    C --> E[Supabase Auth]
    E --> F{Valid Credentials?}
    F -->|No| G[Auth Error Page]
    F -->|Yes| H[Set Session]

    H --> D
    D --> I[Middleware Check]
    I --> J{Session Valid?}
    J -->|No| K[Redirect to Login]
    J -->|Yes| L[Access Granted]

    G --> C
    K --> C
```

## File Structure Mapping

```mermaid
graph TB
    subgraph "App Directory"
        A[layout.tsx - Root Layout]
        B[page.tsx - Home Page]
        C[globals.css - Global Styles]

        subgraph "Auth Routes"
            D[login/page.tsx]
            E[sign-up/page.tsx]
            F[forgot-password/page.tsx]
            G[update-password/page.tsx]
        end

        subgraph "Protected Routes"
            H[protected/layout.tsx]
            I[protected/page.tsx]
        end
    end

    subgraph "Components"
        J[auth-button.tsx]
        K[login-form.tsx]
        L[sign-up-form.tsx]

        subgraph "UI Components"
            M[ui/button.tsx]
            N[ui/input.tsx]
            O[ui/card.tsx]
        end

        subgraph "Tutorial"
            P[tutorial/tutorial-step.tsx]
            Q[tutorial/code-block.tsx]
        end
    end

    subgraph "Lib"
        R[utils.ts]
        S[supabase/client.ts]
        T[supabase/server.ts]
        U[supabase/middleware.ts]
    end

    A --> J
    D --> K
    E --> L
    K --> M
    L --> M
    J --> M
    S --> T
    T --> U
```

## Key Architectural Decisions

### 1. Framework Choice

- **Next.js**: Chosen for its full-stack capabilities, excellent developer experience, and built-in optimizations
- **React**: Component-based architecture for maintainable and reusable UI

### 2. Styling Strategy

- **Tailwind CSS**: Utility-first approach for rapid development and consistent design
- **shadcn/ui**: Pre-built, accessible components that integrate seamlessly with Tailwind

### 3. Backend Strategy

- **Supabase**: BaaS solution providing database, authentication, and real-time features
- **Next.js API Routes**: Server-side logic and API endpoints

### 4. AI Integration

- **Mastra**: Agent framework for complex business logic and AI workflows
- **AI SDK**: Streamlined AI interactions between client and server

### 5. Authentication

- **Supabase Auth**: Integrated authentication with session management
- **Middleware**: Route protection and session validation

## Future Considerations

As this is a living document, future architectural decisions may include:

1. **Scalability**: Consider microservices architecture if the application grows
2. **State Management**: Evaluate need for global state management (Redux, Zustand)
3. **Real-time Features**: Leverage Supabase real-time capabilities
4. **Performance**: Implement caching strategies and optimize bundle sizes
5. **Testing**: Add comprehensive testing strategy
6. **Monitoring**: Implement logging and error tracking
7. **Deployment**: Consider containerization and CI/CD pipelines

## Related Documentation

- [Frameworks and Libraries](../frameworks/frameworks.md)
- [Mastra Agent Framework](../frameworks/mastra.md)
- [Supabase Integration](../frameworks/supabase_js.md)
- [shadcn/ui Components](../frameworks/shadcn.md)
- [Tailwind CSS](../frameworks/tailwind.md)
