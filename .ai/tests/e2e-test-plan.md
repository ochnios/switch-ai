# E2E Test Plan

This document outlines the end-to-end test scenarios for the switch-ai application. E2E tests focus on complete user flows through the browser, testing the integration of frontend, backend, and external services.

## Test Organization

E2E tests are located in `tests/e2e/` directory and organized by feature area:

* `tests/e2e/auth/` - Authentication flows
* `tests/e2e/api-key/` - API key management flows
* `tests/e2e/conversations/` - Conversation management flows
* `tests/e2e/chat/` - Chat and messaging flows
* `tests/e2e/branching/` - Conversation branching flows
* `tests/e2e/navigation/` - Navigation and routing flows
* `tests/e2e/errors/` - Error handling flows

## Test Environment Setup

### Prerequisites

* Test environment must have `.env.test` configured with test credentials
* Supabase test instance with clean database state
* OpenRouter API mocking via Playwright `page.route()`
* Authentication state management via `auth.setup.ts`

### Mocking Strategy

* **Supabase Auth:** Use real Supabase test instance for authentication flows
* **Supabase Database:** Use real Supabase test instance with RLS policies
* **OpenRouter API:** Mock all OpenRouter API calls using `page.route()` to ensure deterministic responses
* **External Services:** Mock all external HTTP requests

## 1. Authentication Flows

**Priority: P0 (Critical)**

### E2E-AUTH-01: User Registration Flow

* **1.1:** User navigates to landing page, clicks "Get Started" button, and is redirected to `/auth/register`
* **1.2:** User fills registration form with valid email and password (min 8 chars)
* **1.3:** User submits form and is successfully registered
* **1.4:** User is automatically logged in and redirected to `/app/conversations/new`
* **1.5:** User sees empty conversation list in sidebar
* **1.6:** User sees "No API Key" status badge in header
* **1.7:** Registration form shows validation error for invalid email format
* **1.8:** Registration form shows validation error for password shorter than 8 characters
* **1.9:** Registration form shows error when email already exists
* **1.10:** Already authenticated user accessing `/auth/register` is redirected to `/app/conversations/new`

### E2E-AUTH-02: User Login Flow

* **2.1:** Unauthenticated user navigates to `/auth/login`
* **2.2:** User fills login form with valid credentials
* **2.3:** User submits form and is successfully authenticated
* **2.4:** User is redirected to `/app/conversations/new` (default destination)
* **2.5:** User with existing conversations sees conversation list in sidebar
* **2.6:** Login form shows validation error for invalid email format
* **2.7:** Login form shows error for invalid credentials
* **2.8:** Already authenticated user accessing `/auth/login` is redirected to `/app/conversations/new`
* **2.9:** User accessing protected route while unauthenticated is redirected to `/auth/login` with redirect query parameter
* **2.10:** User logs in with redirect parameter and is redirected to originally requested URL

### E2E-AUTH-03: User Logout Flow

* **3.1:** Authenticated user clicks logout button in header
* **3.2:** User is successfully logged out
* **3.3:** User is redirected to landing page (`/`)
* **3.4:** User session is cleared (cannot access protected routes)
* **3.5:** User attempting to access `/app/*` after logout is redirected to `/auth/login`

### E2E-AUTH-04: Password Reset Flow

* **4.1:** User navigates to `/auth/reset-password`
* **4.2:** User enters valid email address
* **4.3:** User submits form and sees success message
* **4.4:** Password reset email is sent (verify via mock or test email service)
* **4.5:** Reset password form shows validation error for invalid email format
* **4.6:** Reset password form shows error when email not found

### E2E-AUTH-05: Password Update Flow

* **5.1:** User navigates to `/auth/update-password` with valid token query parameter
* **5.2:** User enters new password (min 8 chars)
* **5.3:** User submits form and password is successfully updated
* **5.4:** User is redirected to `/auth/login`
* **5.5:** User can log in with new password
* **5.6:** Update password form shows validation error for password shorter than 8 characters
* **5.7:** Update password form shows error for invalid or expired token
* **5.8:** User accessing update password page without token sees error

### E2E-AUTH-06: Route Protection

* **6.1:** Unauthenticated user accessing `/app/conversations/new` is redirected to `/auth/login`
* **6.2:** Unauthenticated user accessing `/app/conversations/{id}` is redirected to `/auth/login`
* **6.3:** Unauthenticated user accessing `/app/settings` is redirected to `/auth/login`
* **6.4:** Unauthenticated user accessing `/api/conversations` receives 401 error
* **6.5:** Authenticated user can access all `/app/*` routes
* **6.6:** Public routes (`/`, `/auth/login`, `/auth/register`) are accessible without authentication

## 2. API Key Management Flows

**Priority: P0 (Critical)**

### E2E-APIKEY-01: API Key Onboarding Flow

* **1.1:** New user without API key sees "No API Key" status badge in header
* **1.2:** User navigates to `/app/settings` and sees API key form
* **1.3:** User sees instruction text explaining API key requirement
* **1.4:** User enters invalid API key (not starting with "sk-or-") and sees validation error
* **1.5:** User enters valid API key (starting with "sk-or-")
* **1.6:** User clicks "Save" button
* **1.7:** API key is successfully saved and encrypted
* **1.8:** Status badge changes to "API Key Saved"
* **1.10:** User refreshes page and API key status remains "API Key Saved"
* **1.11:** Models list is automatically fetched and displayed after saving API key

### E2E-APIKEY-02: API Key Update Flow

* **2.1:** User with existing API key navigates to `/app/settings`
* **2.2:** User sees "API Key Saved" status badge
* **2.3:** User enters new valid API key
* **2.4:** User clicks "Save" button
* **2.5:** Existing API key is replaced with new key
* **2.6:** Status badge remains "API Key Saved"
* **2.7:** Success toast notification is displayed

### E2E-APIKEY-03: API Key Deletion Flow

* **3.1:** User with existing API key navigates to `/app/settings`
* **3.2:** User clicks "Delete" button
* **3.3:** Confirmation dialog is displayed
* **3.4:** User confirms deletion in dialog
* **3.5:** API key is successfully deleted
* **3.6:** Status badge changes to "No API Key"
* **3.7:** Success toast notification is displayed
* **3.8:** Models list is cleared
* **3.9:** User cancels deletion dialog and API key remains saved
* **3.10:** User refreshes page and API key status remains "No API Key"

### E2E-APIKEY-04: API Key Error Handling

* **4.1:** User attempts to save API key when network request fails
* **4.2:** Error message is displayed in form
* **4.3:** User attempts to delete API key when network request fails
* **4.4:** Error message is displayed
* **4.5:** API key status check fails and error is handled gracefully

## 3. Conversation Management Flows

**Priority: P0 (Critical)**

### E2E-CONV-01: New Conversation Creation

* **1.1:** User clicks "New Conversation" button in sidebar
* **1.2:** User is navigated to `/app/conversations/new`
* **1.3:** Chat panel shows empty state with composer ready
* **1.4:** User sends first message in new conversation
* **1.5:** New conversation is created in database
* **1.6:** Conversation appears in sidebar list with auto-generated title
* **1.7:** URL updates to `/app/conversations/{id}`
* **1.8:** Active conversation is highlighted in sidebar

### E2E-CONV-02: Conversation List Display

* **2.1:** User with multiple conversations sees list in sidebar
* **2.2:** Conversations are sorted by created\_at descending (newest first)
* **2.3:** First 50 conversations are displayed (pagination)
* **2.4:** Each conversation shows title and metadata
* **2.5:** Active conversation is visually highlighted
* **2.6:** User with no conversations sees empty state in sidebar

### E2E-CONV-03: Conversation Switching

* **3.1:** User clicks on conversation in sidebar
* **3.2:** User is navigated to `/app/conversations/{id}`
* **3.3:** Conversation messages are loaded and displayed
* **3.4:** Active conversation highlight updates in sidebar
* **3.5:** URL updates correctly
* **3.6:** Previous conversation state is preserved when switching back

### E2E-CONV-04: Conversation Deletion

* **4.1:** User clicks delete icon on conversation in sidebar
* **4.2:** First confirmation dialog is displayed
* **4.3:** User clicks "Cancel" and conversation is not deleted
* **4.4:** User clicks delete icon again
* **4.5:** User confirms deletion in dialog
* **4.6:** Conversation is successfully deleted from database
* **4.7:** Conversation is removed from sidebar list
* **4.8:** Success toast notification is displayed
* **4.9:** If deleted conversation was active, user is navigated to `/app/conversations/new`
* **4.10:** If deleted conversation was not active, user remains on current conversation

### E2E-CONV-05: Conversation Title Generation

* **5.1:** User creates new conversation and sends first message
* **5.2:** OpenRouter API is called to generate title from first message
* **5.3:** Generated title is displayed in sidebar (truncated to 50 chars if needed)
* **5.4:** Title generation fails gracefully and fallback title is used
* **5.5:** Very long first message results in truncated title
* **5.6:** Very short first message results in fallback title

## 4. Chat and Messaging Flows

**Priority: P0 (Critical)**

### E2E-CHAT-01: Send First Message Flow

* **1.1:** User navigates to `/app/conversations/new`
* **1.2:** User selects model from ModelSelector dropdown
* **1.3:** User enters message in composer textarea
* **1.4:** User clicks "Send" button (or presses Ctrl+Enter)
* **1.5:** User message is immediately displayed in chat panel
* **1.6:** Loading indicator is displayed for assistant response
* **1.7:** OpenRouter API is called with correct parameters
* **1.8:** Assistant response is received and displayed
* **1.9:** Model badge is displayed on assistant message
* **1.10:** Token counter is updated with usage information
* **1.11:** Conversation is created with auto-generated title

### E2E-CHAT-02: Send Subsequent Messages Flow

* **2.1:** User in existing conversation enters message
* **2.2:** User selects different model from ModelSelector
* **2.3:** User sends message
* **2.4:** User message is displayed
* **2.5:** Conversation history (previous messages) is included in API request
* **2.6:** Assistant response is received and displayed
* **2.7:** All messages are displayed in chronological order
* **2.8:** Each assistant message shows correct model badge

### E2E-CHAT-03: Model Switching Per Message

* **3.1:** User sends first message with model A (e.g., gpt-4o-mini)
* **3.2:** User changes ModelSelector to model B (e.g., claude-3-haiku)
* **3.3:** User sends second message
* **3.4:** First assistant message shows model A badge
* **3.5:** Second assistant message shows model B badge
* **3.6:** User can switch models for each message independently
* **3.7:** Last used model is remembered and pre-selected for next message

### E2E-CHAT-04: Message Display and Formatting

* **4.1:** Assistant message with markdown is rendered correctly
* **4.2:** Code blocks are displayed with syntax highlighting
* **4.3:** Inline code is formatted correctly
* **4.4:** Lists (ordered and unordered) are rendered correctly
* **4.5:** Links are clickable and open in new tab
* **4.6:** Long messages are scrollable
* **4.7:** Message timestamps are displayed (if implemented)

### E2E-CHAT-05: Message Pagination

* **5.1:** Conversation with more than 50 messages loads first 50 (oldest)
* **5.2:** User can scroll to see all loaded messages
* **5.3:** Pagination controls are displayed (if implemented)
* **5.4:** Loading more messages works correctly (if implemented)

### E2E-CHAT-06: Composer Interactions

* **6.1:** Composer textarea expands as user types long message
* **6.2:** Send button is disabled when message is empty
* **6.3:** Send button is enabled when message has content
* **6.4:** Ctrl+Enter keyboard shortcut sends message
* **6.5:** Enter key (without Ctrl) creates new line
* **6.6:** Composer is disabled while message is being sent
* **6.7:** Composer is re-enabled after response is received

### E2E-CHAT-07: Copy Message Functionality

* **7.1:** User clicks copy button on message
* **7.2:** Message content is copied to clipboard
* **7.3:** Copy button shows visual feedback (icon change or toast)
* **7.4:** Copied content can be pasted elsewhere
* **7.5:** Copy works for both user and assistant messages

### E2E-CHAT-08: Token Counter Display

* **8.1:** Token counter displays 0 for new conversation
* **8.2:** Token counter updates after each assistant response
* **8.3:** Token counter shows sum of prompt\_tokens and completion\_tokens
* **8.4:** Token counter persists across page refreshes
* **8.5:** Token counter resets when switching to new conversation

## 5. Conversation Branching Flows

**Priority: P1 (Important)**

### E2E-BRANCH-01: Create Branch with Full History

* **1.1:** User has conversation with multiple messages (A -> B -> C -> D)
* **1.2:** User clicks branch icon/button on message B
* **1.3:** Dropdown menu appears with branching options
* **1.4:** User selects "Create branch with full history"
* **1.5:** Loading toast is displayed during branch creation
* **1.6:** New conversation is created in database
* **1.7:** New conversation contains all messages up to and including message B
* **1.8:** User is automatically navigated to new conversation
* **1.9:** New conversation appears in sidebar with correct title format
* **1.10:** Branch count on parent conversation is incremented
* **1.11:** Success toast notification is displayed

### E2E-BRANCH-02: Create Branch with Summary

* **2.1:** User has conversation with multiple messages (A -> B -> C -> D)
* **2.2:** User clicks branch icon/button on message C
* **2.3:** User selects "Create branch with summary"
* **2.4:** Loading toast is displayed during branch creation
* **2.5:** OpenRouter API is called to generate summary of conversation up to message C
* **2.6:** New conversation is created with system message containing summary
* **2.7:** User is automatically navigated to new conversation
* **2.8:** New conversation shows system message with AI-generated summary
* **2.9:** New conversation appears in sidebar with correct title format
* **2.10:** Branch count on parent conversation is incremented
* **2.11:** Success toast notification is displayed

### E2E-BRANCH-03: Branch from First Message

* **3.1:** User creates branch from first message in conversation
* **3.2:** Full history branch contains only the first message
* **3.3:** Summary branch contains system message with summary of first message

### E2E-BRANCH-04: Branch Error Handling

* **4.1:** Branch creation fails due to network error
* **4.2:** Error toast notification is displayed
* **4.3:** User remains on original conversation
* **4.4:** Branch creation fails due to invalid message ID
* **4.5:** Appropriate error message is displayed
* **4.6:** Summary generation fails and error is handled gracefully

### E2E-BRANCH-05: Multiple Branches from Same Message

* **5.1:** User creates branch from message A
* **5.2:** User returns to original conversation
* **5.3:** User creates another branch from same message A
* **5.4:** Both branches are created successfully
* **5.5:** Both branches appear in sidebar

## 6. Error Handling Flows

**Priority: P1 (Important)**

### E2E-ERROR-01: OpenRouter API Error Handling

* **1.1:** User sends message with invalid API key (401 Unauthorized)
* **1.2:** Error message is displayed in chat panel
* **1.3:** Error message content: "Invalid or expired OpenRouter API key..."
* **1.4:** User can retry sending message after fixing API key
* **1.5:** User sends message and receives 403 Forbidden error
* **1.6:** Appropriate error message is displayed
* **1.7:** User sends message and receives 429 Rate Limit error
* **1.8:** Error message indicates rate limit exceeded
* **1.9:** User sends message and receives 503 Service Unavailable error
* **1.10:** Error message indicates provider overload
* **1.11:** User sends message and receives 502 Bad Gateway error
* **1.12:** Error message indicates server error
* **1.13:** User sends message and network request fails
* **1.14:** Network error message is displayed

### E2E-ERROR-02: API Endpoint Error Handling

* **2.1:** User attempts to access non-existent conversation
* **2.2:** 404 error is handled gracefully
* **2.3:** User attempts to access conversation they don't own
* **2.4:** 404 or 403 error is returned (RLS protection)
* **2.5:** User sends message to non-existent conversation
* **2.6:** Appropriate error is displayed

### E2E-ERROR-03: Form Validation Errors

* **3.1:** User submits login form with invalid email format
* **3.2:** Client-side validation error is displayed
* **3.3:** User submits registration form with short password
* **3.4:** Client-side validation error is displayed
* **3.5:** User submits API key form with invalid key format
* **3.6:** Client-side validation error is displayed

### E2E-ERROR-04: Network Failure Handling

* **4.1:** User performs action when network is offline
* **4.2:** Error message indicates network failure
* **4.3:** User retries action when network is restored
* **4.4:** Action completes successfully

## 7. Navigation and Routing Flows

**Priority: P1 (Important)**

### E2E-NAV-01: Direct URL Navigation

* **1.1:** User navigates directly to `/app/conversations/{valid-id}`
* **1.2:** Conversation is loaded and displayed correctly
* **1.3:** User navigates directly to `/app/conversations/new`
* **1.4:** New conversation view is displayed
* **1.5:** User navigates directly to `/app/settings`
* **1.6:** Settings page is displayed
* **1.7:** User navigates to invalid conversation ID
* **1.8:** Error is handled gracefully (redirect or error message)

### E2E-NAV-02: Browser Navigation

* **2.1:** User uses browser back button
* **2.2:** Previous page state is restored correctly
* **2.3:** User uses browser forward button
* **2.4:** Next page state is restored correctly
* **2.5:** User refreshes page on conversation view
* **2.6:** Conversation state is preserved and reloaded
* **2.7:** User refreshes page on settings view
* **2.8:** Settings state is preserved

### E2E-NAV-03: Sidebar Navigation

* **3.1:** User clicks "New Conversation" button
* **3.2:** User is navigated to `/app/conversations/new`
* **3.3:** User clicks conversation in sidebar
* **3.4:** User is navigated to `/app/conversations/{id}`
* **3.5:** User clicks "Settings" button in header
* **3.6:** User is navigated to `/app/settings`
* **3.7:** User clicks logo/brand in header
* **3.8:** User is navigated to `/app/conversations/new` (or landing if logged out)

### E2E-NAV-04: URL Synchronization

* **4.1:** URL updates when user switches conversations
* **4.2:** URL updates when user creates new conversation
* **4.3:** URL updates when user creates branch
* **4.4:** Active conversation ID in URL matches sidebar highlight
* **4.5:** Invalid UUID in URL redirects to new conversation

## 8. UI/UX Validation Flows

**Priority: P2 (Nice to Have)**

### E2E-UI-01: Responsive Design

* **1.1:** Application is usable on desktop viewport (1920x1080)
* **1.2:** Application is usable on tablet viewport (768x1024)
* **1.3:** Application is usable on mobile viewport (375x667)
* **1.4:** Sidebar is accessible on all viewport sizes
* **1.5:** Chat panel is readable on all viewport sizes

### E2E-UI-02: Loading States

* **2.1:** Loading skeleton is displayed while conversations load
* **2.2:** Loading indicator is displayed while messages load
* **2.3:** Loading indicator is displayed while sending message
* **2.4:** Loading states are cleared after data loads

### E2E-UI-03: Toast Notifications

* **3.1:** Success toast appears after saving API key
* **3.2:** Success toast appears after deleting API key
* **3.3:** Success toast appears after deleting conversation
* **3.4:** Success toast appears after creating branch
* **3.5:** Error toast appears on API errors
* **3.6:** Toasts auto-dismiss after timeout
* **3.7:** User can manually dismiss toasts

### E2E-UI-04: Accessibility (A11y)

* **4.1:** All interactive elements are keyboard accessible
* **4.2:** Focus indicators are visible
* **4.3:** ARIA labels are present on interactive elements
* **4.4:** Screen reader can navigate application
* **4.5:** Color contrast meets WCAG standards
* **4.6:** Form labels are associated with inputs

### E2E-UI-05: Visual Regression Testing

* **5.1:** Landing page matches baseline screenshot
* **5.2:** Login page matches baseline screenshot
* **5.3:** Registration page matches baseline screenshot
* **5.4:** Conversation view matches baseline screenshot
* **5.5:** Settings page matches baseline screenshot
* **5.6:** Error states match baseline screenshots
* **5.7:** Visual changes are detected and require baseline updates

## Test Implementation Notes

### Browser Configuration

* Configure Playwright to use **Chromium/Desktop Chrome browser only** (as per project guidelines)
* Browser configuration is set in `playwright.config.ts`

### Page Object Model

Implement Page Objects for maintainability:

* `pages/LandingPage.ts` - Landing page interactions
* `pages/LoginPage.ts` - Login page interactions
* `pages/RegisterPage.ts` - Registration page interactions
* `pages/ConversationPage.ts` - Conversation view interactions
* `pages/SettingsPage.ts` - Settings page interactions
* `components/ConversationSidebar.ts` - Sidebar component interactions
* `components/ChatPanel.ts` - Chat panel component interactions
* `components/Composer.ts` - Composer component interactions

### Element Selection

* **Always use Playwright locators** (`page.getByRole()`, `page.getByLabel()`, `page.getByText()`, etc.) for resilient element selection
* Avoid CSS selectors and XPath when possible
* Use semantic queries (role, label, text) for better maintainability
* Locators auto-wait for elements to be actionable

### Browser Contexts and Test Isolation

* Use **browser contexts** for isolating test environments
* Each test should use its own browser context when needed
* Each test should be independent and idempotent
* Use `test.beforeEach()` for common setup (e.g., creating new browser context)
* Use `test.afterEach()` for cleanup (e.g., closing browser context)
* Use authentication state from `auth.setup.ts` for authenticated tests
* Implement test hooks for setup and teardown operations

### API Testing

* **Leverage API testing for backend validation** alongside UI tests
* Use `request` API from Playwright to test API endpoints directly
* Validate API responses, status codes, and data structures
* Test error scenarios at API level before UI level
* Combine API and UI tests for comprehensive coverage

### Visual Comparison Testing

* **Implement visual comparison** with `expect(page).toHaveScreenshot()` for critical UI states
* Capture screenshots of key pages and components
* Use visual regression testing for UI consistency
* Store baseline screenshots in version control
* Update baselines when intentional UI changes are made

### Test Development Tools

* **Use the codegen tool** (`npm run test:e2e:codegen`) for test recording
* Record user interactions to generate initial test structure
* Refine generated tests with proper locators and assertions
* Use codegen as a starting point, not final implementation

### Debugging and Tracing

* **Leverage trace viewer** for debugging test failures
* Configure trace collection in `playwright.config.ts` (e.g., `trace: "on-first-retry"`)
* Use `npx playwright show-trace` to analyze test failures
* Traces include screenshots, network requests, and console logs

### Assertions

* **Use expect assertions with specific matchers** for better error messages
* Prefer specific matchers: `toHaveURL()`, `toHaveText()`, `toBeVisible()`, `toBeEnabled()`, etc.
* Avoid generic `toBeTruthy()` or `toBeFalsy()` when specific matchers are available
* Use `toHaveScreenshot()` for visual assertions

### Test Data Management

* Use test fixtures for consistent test data
* Create helper functions for user creation and cleanup
* Use database seeding for predictable test scenarios
* Clean up test data after each test run

### Mocking Strategy

* Mock OpenRouter API responses using `page.route()`
* Use deterministic responses for consistent test results
* Mock different error scenarios (401, 403, 429, 500, 502, 503)
* Mock network failures for error handling tests

### Performance Considerations

* Keep E2E tests focused on critical user flows
* **Leverage parallel execution** for faster test runs (configured in `playwright.config.ts`)
* Minimize test execution time
* Use appropriate wait strategies (avoid fixed timeouts - rely on auto-waiting locators)

### Coverage Goals

* **P0 (Critical):** 100% of scenarios must pass
* **P1 (Important):** 90%+ of scenarios should pass
* **P2 (Nice to Have):** Implement as time permits

Focus on testing:

* Complete user journeys from start to finish
* Integration between frontend and backend
* Real-world error scenarios
* Security boundaries (authentication, authorization)
* Data persistence across page refreshes
