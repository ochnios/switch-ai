# Tests Directory

This directory contains all tests for the switch-ai application.

> **IMPORTANT**:
> Only `P0` priority level unit tests are implemented

> **IMPORTANT**:
> Only `E2E-APIKEY-01` end to end test is implemented for now

Before running tests you should create `.env.test` based on `.env.test.example` (especially for E2E tests).

## Structure

```
tests/
├── setup.ts           # Vitest global setup file
├── helpers/           # Test helper functions and utilities
├── mocks/             # Mock data and mock implementations
├── unit/              # vitest unit tests
└── e2e/               # Playwright E2E tests
```

## Unit & Component Tests

Unit tests are co-located with source files following the pattern:
`src/lib/services/conversation.service.ts` → `tests/unit/services/conversation.service.test.ts`

### Running Tests

```bash
# Run all unit and component tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Unit and component tests use:

* **Vitest** as the test runner
* **React Testing Library** for component tests
* **@testing-library/jest-dom** for DOM assertions

Example component test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## E2E Tests

E2E tests are located in the `tests/e2e/` directory and use Playwright.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate tests using codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

Example E2E test:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/app/conversations/new');
  });
});
```

## Best Practices

### Unit Tests

* Test business logic in isolation
* Mock external dependencies (Supabase, OpenRouter)
* Use `vi.mock()` for module mocks
* Focus on behavior, not implementation

### Component Tests

* Test user interactions
* Use semantic queries (getByRole, getByLabelText)
* Avoid testing implementation details
* Test accessibility

### E2E Tests

* Test critical user flows (P0 scenarios)
* Use Page Object Model for maintainability
* Mock external APIs (OpenRouter, Supabase)
* Keep tests independent and idempotent

## Mocking

### Supabase Mock

Place Supabase mocks in `tests/mocks/supabase.ts`:

```typescript
import { vi } from 'vitest';

export const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
});
```

### OpenRouter Mock

Place OpenRouter mocks in `tests/mocks/openrouter.ts`:

```typescript
import { vi } from 'vitest';

export const createMockOpenRouterResponse = () => ({
  id: 'chatcmpl-123',
  choices: [{
    message: {
      role: 'assistant',
      content: 'Mock response',
    },
  }],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
});
```

## Coverage

Coverage reports are generated in the `coverage/` directory.

Target coverage thresholds:

* Lines: 70%
* Functions: 70%
* Branches: 70%
* Statements: 70%

Focus on testing critical paths:

* Authentication flows
* API key management
* Message sending and receiving
* Conversation management
* Branching logic

## CI/CD

Tests are automatically run in GitHub Actions on:

* Push to `master` branch
* Pull request creation/update

The CI pipeline runs:

1. Linting
2. Unit and component tests
3. E2E tests (on staging environment)
