name: "Base PRP Template v2 - Context-Rich with Validation Loops"
description: |

## Purpose

Template optimized for AI agents to implement features with sufficient context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles

1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal

[What needs to be built - be specific about the end state and desires]

## Why

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]

## All Needed Context

### Documentation & References (list all context needed to implement the feature)

```yaml
# MUST READ - Include these in your context window
- url: [Official API docs URL]
  why: [Specific sections/methods you'll need]

- file: [path/to/example.ts]
  why: [Pattern to follow, gotchas to avoid]

- doc: [Library documentation URL]
  section: [Specific section about common pitfalls]
  critical: [Key insight that prevents common errors]

- docfile: [PRPs/ai_docs/file.md]
  why: [docs that the user has pasted in to the project]
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash

```

### Desired Codebase tree with files to be added and responsibility of file

```bash

```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: [Library name] requires [specific setup]
// Example: Next.js 14 uses App Router by default, not Pages Router
// Example: Supabase client needs to be initialized with env vars
// Example: We use Tailwind CSS with shadcn/ui components
// Example: TypeScript strict mode is enabled - all types must be defined
```

## Implementation Blueprint

### Data models and structure

Create the core data models and types, ensuring type safety and consistency.

```typescript
Examples:
 - TypeScript interfaces
 - Zod schemas for validation
 - Next.js API route types
 - Database schema types (if using Supabase/Prisma)
 - Component prop types
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed

```yaml
Task 1:
MODIFY app/existing-page/page.tsx:
  - FIND pattern: "export default function ExistingPage"
  - INJECT after line containing "const [state, setState]"
  - PRESERVE existing component structure

CREATE components/new-feature.tsx:
  - MIRROR pattern from: components/similar-feature.tsx
  - MODIFY component name and core logic
  - KEEP error handling pattern identical

CREATE app/api/new-feature/route.ts:
  - MIRROR pattern from: app/api/similar-feature/route.ts
  - MODIFY API logic and response format
  - KEEP error handling and validation patterns

...(...)

Task N:
...
```

### Per task pseudocode as needed added to each task

```typescript
// Task 1
// Pseudocode with CRITICAL details dont write entire code
async function newFeature(param: string): Promise<Result> {
  // PATTERN: Always validate input first (see lib/validations.ts)
  const validated = validateInput(param); // throws ValidationError

  // GOTCHA: Next.js API routes need proper error handling
  try {
    // PATTERN: Use existing database client pattern
    const { data, error } = await supabase
      .from("table_name")
      .select("*")
      .eq("param", validated);

    if (error) throw error;

    // CRITICAL: Always return consistent response format
    return { success: true, data }; // see lib/api-responses.ts
  } catch (error) {
    // PATTERN: Standardized error handling
    return formatError(error); // see lib/error-handling.ts
  }
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "Add column 'feature_enabled' to users table"
  - index: "CREATE INDEX idx_feature_lookup ON users(feature_id)"

ENVIRONMENT:
  - add to: .env.local
  - pattern: "NEXT_PUBLIC_FEATURE_ENABLED=true"

COMPONENTS:
  - add to: components/index.ts
  - pattern: "export { NewFeature } from './new-feature'"

ROUTES:
  - add to: app/api/routes
  - pattern: "POST /api/new-feature"

STYLES:
  - add to: app/globals.css or component-specific CSS modules
  - pattern: "Follow existing Tailwind utility patterns"
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint            # ESLint with auto-fix
npm run type-check      # TypeScript type checking
npm run format          # Prettier formatting (if configured)

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns

```typescript
// CREATE __tests__/new-feature.test.ts with these test cases:
describe("NewFeature", () => {
  test("happy path - basic functionality works", () => {
    const result = newFeature("valid_input");
    expect(result.success).toBe(true);
  });

  test("validation error - invalid input throws error", () => {
    expect(() => newFeature("")).toThrow("ValidationError");
  });

  test("api error - handles API failures gracefully", async () => {
    // Mock API failure
    jest.spyOn(supabase, "from").mockImplementation(() => ({
      select: () => ({ error: "Database error" }),
    }));

    const result = await newFeature("valid");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Database error");
  });
});
```

```bash
# Run and iterate until passing:
npm run test
# If failing: Read error, understand root cause, fix code, re-run (never mock to pass)
```

### Level 3: Integration Test

```bash
# Start the Next.js development server
npm run dev

# Test the API endpoint
curl -X POST http://localhost:3000/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"param": "test_value"}'

# Expected: {"success": true, "data": {...}}
# If error: Check browser console and terminal logs for stack trace

# Test the UI component (if applicable)
# Navigate to http://localhost:3000/feature-page
# Verify component renders and functions correctly
```

## Final validation Checklist

- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Manual test successful: [specific curl/command or UI interaction]
- [ ] Error cases handled gracefully
- [ ] Console logs are informative but not verbose
- [ ] Documentation updated if needed

---

## Anti-Patterns to Avoid

- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't mix client and server code inappropriately
- ❌ Don't hardcode values that should be environment variables
- ❌ Don't ignore TypeScript errors or use `any` type
- ❌ Don't forget to handle loading and error states in UI components
