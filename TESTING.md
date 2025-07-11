# Testing Setup with Vitest

This project is configured to use Vitest for testing, following the official Next.js testing guide.

## Installation

Due to disk space constraints, you'll need to install the testing dependencies:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Configuration Files

- `vitest.config.ts` - Main Vitest configuration
- `vitest.setup.ts` - Test setup file with mocks and global configurations
- `__tests__/` - Test files directory

## Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Unit Tests

- Component tests: `__tests__/components/`
- Utility tests: `__tests__/lib/`
- Page tests: `__tests__/`

### Example Test Files

- `__tests__/page.test.tsx` - Homepage test
- `__tests__/components/auth-button.test.tsx` - Component test
- `__tests__/lib/utils.test.ts` - Utility function test

## Features Configured

- **React Testing Library** - For component testing
- **jsdom** - DOM environment for tests
- **Next.js mocks** - Router and navigation mocks
- **TypeScript support** - Full TypeScript integration
- **Path aliases** - Uses `@/*` imports like the main app

## Writing Tests

### Component Tests

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MyComponent from "@/components/my-component";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Utility Tests

```typescript
import { describe, it, expect } from "vitest";
import { myUtilFunction } from "@/lib/utils";

describe("myUtilFunction", () => {
  it("should return expected result", () => {
    expect(myUtilFunction("input")).toBe("expected output");
  });
});
```

## Environment Variables

Test environment variables are configured in `vitest.setup.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Best Practices

1. **Test file naming**: Use `.test.ts` or `.test.tsx` extensions
2. **Test organization**: Group related tests in describe blocks
3. **Mock external dependencies**: Use `vi.mock()` for external services
4. **Test user interactions**: Use `@testing-library/user-event` for user interactions
5. **Accessibility testing**: Use `getByRole` and other accessibility-friendly queries

## Coverage

Run `npm run test:coverage` to generate coverage reports. Coverage files will be generated in the `coverage/` directory.
