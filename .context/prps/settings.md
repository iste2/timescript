# Settings Feature Implementation PRP

## Project Context

**Target**: Next.js 15 App Router + Supabase + TypeScript application
**Feature**: User Settings Configuration System for TimeScript
**Complexity**: Full-stack CRUD with authentication, validation, and real-time preview

## Feature Overview

Implement a comprehensive settings page that allows authenticated users to configure their personalized time entry format, including:

- Custom column definitions (free text, enum, number, datetime)
- Row and entry delimiters configuration
- Enum value management with key-value pairs
- General behavior notes for documenting special rules
- Live preview of configured output format
- Import/export functionality

## All Needed Context

### Existing Codebase Patterns

**Authentication Pattern** (from `lib/supabase/server.ts`):

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          /* implementation */
        },
      },
    }
  );
}
```

**Client-side Pattern** (from `lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Component Structure** (from `components/login-form.tsx`):

```typescript
"use client";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export function ComponentName({ className, ...props }: ComponentProps) {
  const [state, setState] = useState();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Implementation
}
```

**Protected Route Pattern** (from `app/protected/page.tsx`):

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }
  // Page content
}
```

**UI Components** (shadcn/ui patterns):

- `components/ui/button.tsx` - Button variants with cva
- `components/ui/card.tsx` - Card, CardHeader, CardTitle, CardContent
- `components/ui/input.tsx` - Form inputs with proper styling
- `components/ui/label.tsx` - Form labels

### Database Schema (from feature spec)

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  row_delimiter VARCHAR(10) NOT NULL DEFAULT ',',
  entry_delimiter VARCHAR(10) NOT NULL DEFAULT '\n',
  general_behavior TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE user_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('free', 'enum', 'number', 'datetime')),
  description TEXT,
  required BOOLEAN DEFAULT false,
  format VARCHAR(100), -- For datetime types
  position INTEGER NOT NULL, -- For column ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, column_id),
  UNIQUE(user_id, position)
);

CREATE TABLE user_enum_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES user_columns(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(column_id, key)
);
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Next.js 15 uses App Router by default
// All API routes must be in app/api/[route]/route.ts format

// CRITICAL: Supabase SSR requires proper cookie handling
// Server components use createClient from @/lib/supabase/server
// Client components use createClient from @/lib/supabase/client

// CRITICAL: TypeScript strict mode is enabled
// All types must be properly defined, no implicit any

// CRITICAL: We use shadcn/ui components with Tailwind CSS
// Follow existing component patterns for consistency

// CRITICAL: Authentication middleware is in place
// Protected routes automatically redirect to login if not authenticated

// CRITICAL: Vitest is used for testing, not Jest
// Test files should follow __tests__ directory structure
```

### External Documentation References

1. **Next.js 15 App Router API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
2. **Supabase SSR Guide**: https://supabase.com/docs/guides/auth/server-side-rendering
3. **Supabase TypeScript**: https://supabase.com/docs/reference/javascript/typescript-support
4. **Shadcn components**: .context/frameworks/shadcn.md

## TypeScript Interfaces

```typescript
// Core Types
export interface UserSettings {
  id: string;
  user_id: string;
  row_delimiter: string;
  entry_delimiter: string;
  general_behavior: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserColumn {
  id: string;
  user_id: string;
  column_id: string;
  name: string;
  type: "free" | "enum" | "number" | "datetime";
  description: string | null;
  required: boolean;
  format: string | null; // For datetime types
  position: number;
  created_at: string;
  updated_at: string;
}

export interface UserEnumValue {
  id: string;
  column_id: string;
  key: string;
  value: string;
  created_at: string;
}

// API Request/Response Types
export interface SettingsConfig {
  rowDelimiter: string;
  entryDelimiter: string;
  generalBehavior: string;
  columns: ColumnConfig[];
}

export interface ColumnConfig {
  id: string;
  name: string;
  type: "free" | "enum" | "number" | "datetime";
  description: string;
  required: boolean;
  format?: string; // For datetime
  values?: Record<string, string>; // For enum
  position: number;
}

// Component Props
export interface ColumnEditorProps {
  column?: ColumnConfig;
  onSave: (column: ColumnConfig) => void;
  onCancel: () => void;
}

export interface PreviewProps {
  config: SettingsConfig;
}
```

## Implementation Blueprint

### Architecture Overview

```
app/
├── settings/
│   ├── page.tsx                 # Main settings page (protected)
│   └── loading.tsx              # Loading state
├── api/
│   └── settings/
│       ├── route.ts             # GET, PUT, DELETE settings
│       ├── import/
│       │   └── route.ts         # POST import config
│       └── export/
│           └── route.ts         # GET export config
components/
├── settings/
│   ├── settings-form.tsx        # Main settings form
│   ├── column-editor.tsx        # Column configuration editor
│   ├── delimiter-config.tsx     # Delimiter configuration
│   ├── preview-section.tsx      # Live preview component
│   ├── enum-value-manager.tsx   # Manage enum values
│   └── general-behavior.tsx     # General behavior notes
lib/
├── types/
│   └── settings.ts              # All TypeScript interfaces
├── utils/
│   ├── settings-validation.ts   # Validation schemas
│   └── settings-helpers.ts      # Helper functions
__tests__/
├── api/
│   └── settings.test.ts         # API endpoint tests
└── components/
    └── settings/
        ├── settings-form.test.tsx
        └── column-editor.test.tsx
```

### Implementation Tasks (Ordered)

1. **Database Setup**

   - Create migration files for user_settings, user_columns, user_enum_values tables
   - Add indexes for performance

2. **TypeScript Types & Validation**

   - Create `lib/types/settings.ts` with all interfaces
   - Create `lib/utils/settings-validation.ts` with Zod schemas

3. **API Routes Implementation**

   - `app/api/settings/route.ts` - CRUD operations
   - `app/api/settings/import/route.ts` - Import functionality
   - `app/api/settings/export/route.ts` - Export functionality

4. **Core Components**

   - `components/settings/settings-form.tsx` - Main form wrapper
   - `components/settings/delimiter-config.tsx` - Delimiter selection
   - `components/settings/general-behavior.tsx` - Behavior notes

5. **Advanced Components**

   - `components/settings/column-editor.tsx` - Column management
   - `components/settings/enum-value-manager.tsx` - Enum handling
   - `components/settings/preview-section.tsx` - Live preview

6. **Main Page**

   - `app/settings/page.tsx` - Protected settings page

7. **Testing**
   - API endpoint tests
   - Component unit tests
   - Integration tests

### Error Handling Strategy

```typescript
// API Error Responses
interface ApiError {
  error: string;
  message: string;
  details?: string;
}

// Client Error Handling
try {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
} catch (error) {
  setError(error instanceof Error ? error.message : "Unknown error");
  return null;
}
```

### Real-time Preview Logic

```typescript
// Preview generation logic
const generatePreview = (config: SettingsConfig): string => {
  const sampleData = [
    ["202506061215", "202506061300", "3445", "presentation"],
    ["202506061400", "202506061500", "3446", "meeting"],
  ];

  return sampleData
    .map((row) => row.join(config.rowDelimiter))
    .join(config.entryDelimiter);
};
```

## Validation Gates

```bash
# TypeScript Compilation
npx tsc --noEmit

# Linting
npm run lint

# Unit Tests
npm run test

# Build Test
npm run build

# API Integration Test (manual verification)
curl -X GET http://localhost:3000/api/settings \
  -H "Cookie: sb-access-token=valid-token"
```

## Security Considerations

1. **Authentication**: All API routes must verify user authentication
2. **Authorization**: Users can only access their own settings
3. **Input Validation**: Server-side validation with Zod schemas
4. **SQL Injection**: Use Supabase query builder, never raw SQL
5. **XSS Prevention**: Sanitize user input, especially general_behavior field

## Performance Considerations

1. **Database Indexing**: Index on user_id for fast lookups
2. **Caching**: Consider caching user settings in memory
3. **Pagination**: If enum values grow large, implement pagination
4. **Debounced Preview**: Debounce preview updates to avoid excessive re-renders

## Testing Strategy

```typescript
// Example API test structure
describe("Settings API", () => {
  beforeEach(async () => {
    // Setup test user and auth
  });

  it("should get user settings", async () => {
    const response = await request(app)
      .get("/api/settings")
      .set("Cookie", "auth-cookie")
      .expect(200);

    expect(response.body).toMatchObject({
      rowDelimiter: ",",
      entryDelimiter: "\n",
      columns: expect.any(Array),
    });
  });
});
```

## Migration Path

1. **Database Migration**: Create tables with proper constraints
2. **Default Settings**: Create default configuration for existing users
3. **Gradual Rollout**: Feature flag for beta testing
4. **Data Validation**: Ensure all existing data remains valid

## Success Criteria

- [ ] Users can create/edit/delete column configurations
- [ ] Enum values can be managed with key-value pairs
- [ ] Row and entry delimiters are configurable
- [ ] Live preview updates in real-time
- [ ] Configuration persists across sessions
- [ ] Import/export functionality works
- [ ] All API endpoints are properly authenticated
- [ ] Comprehensive test coverage (>80%)
- [ ] No TypeScript errors
- [ ] Responsive design works on mobile

## Documentation Requirements

1. **API Documentation**: OpenAPI spec for all endpoints
2. **Component Documentation**: Props and usage examples
3. **User Guide**: How to configure settings
4. **Migration Guide**: For database changes
5. **Product current state**: Update .context/product/product_current_state.md

## Quality Score: 9/10

**Confidence Level**: Very High

- Comprehensive context provided
- Existing patterns clearly identified
- All major edge cases considered
- Clear implementation path
- Robust testing strategy
- Proper error handling
- Security considerations addressed

**Risk Factors**:

- Complex state management in column editor
- Drag-and-drop reordering implementation
- Enum value validation complexity

**Mitigation**:

- Start with basic CRUD, add advanced features incrementally
- Use proven React libraries for drag-and-drop
- Implement thorough validation testing
