## 1. Introduction and Testing Objectives

### Introduction

This document defines the strategy, scope, and approach for testing the **switch-ai** application. The project is an advanced chat application (Astro/React + Supabase) targeted at "power users", enabling AI model switching for each message and creating conversation branches.

### Main Testing Objectives

* **Functionality Verification (P0):** Ensuring that all key MVP features (authentication, API key management, sending messages, model switching, branching) work according to specification.
* **Security Assurance (P0):** Verifying that user API keys are securely stored (encryption) and that RLS (Row Level Security) policies in Supabase effectively isolate user data.
* **Integration Verification (P1):** Confirming correct communication between frontend (React/Astro), backend (Supabase), and external services (OpenRouter.ai).
* **Error Handling (P1):** Checking whether the application handles API errors clearly and securely (e.g., invalid OpenRouter key, rate limits, server errors).
* **UI/UX Validation (P2):** Ensuring that the user interface is intuitive, responsive, and consistent with the Shadcn/ui library.

***

## 2. Test Scope

### Functionalities Covered by Tests (In-Scope)

* Complete **user authentication** cycle (registration, login, logout) using Supabase Auth.
* **API Key Management (BYOK):**
  * Secure addition (encryption) of OpenRouter API key.
  * Key status verification (exists / does not exist).
  * Key deletion.
* **Conversation Management:**
  * Creating a new conversation (including automatic title generation).
  * Displaying conversation list.
  * Switching between conversations.
  * Deleting conversations (including double confirmation mechanism in UI).
* **Chat Interface:**
  * Sending and receiving messages.
  * Rendering responses as Markdown (including code blocks).
  * Displaying loading state and message errors.
* **Key "Power User" Features:**
  * **AI Model Switching:** Ability to select a model for each sent message.
  * **Branching:** Creating new threads from an existing message (types "full" and "summary").
* **Helper Functions:** Token counter, message copy button.
* **Security:** Middleware protection for `/app` and `/api` paths and verification of Supabase RLS policies.

### Functionalities Excluded from Tests (Out-of-Scope for MVP)

According to `README.md`, the following elements are outside the test scope for the MVP version:

* Advanced conversation visualization (e.g., tree view).
* Attachments (files, images).
* Assistant response streaming.
* Internet search integration.
* Sharing and exporting conversations.
* Handling multiple conversations in one view.
* Password recovery process tests (forms exist, but `LoginForm.tsx` indicates this feature is disabled).

***

## 3. Test Types

The strategy is based on the testing pyramid, taking into account the stack specifics (Astro + React + BaaS).

1. **Unit Tests:**
   * **Objective:** Verification of small, isolated code fragments.
   * **Scope:**
     * Business logic in services (e.g., `conversation.service.ts`, `api-key.service.ts`).
     * Encryption logic (`crypto.ts`) – critical for security.
     * Error mapping logic (`handleApiError.ts`, `open-router.service.ts`).
     * Zod validation schemas (`src/lib/schemas/`).
     * React hooks (e.g., `useTokenCounter.ts`).
     * Zustand store logic (`useAppStore.ts`).

2. **Component Tests:**
   * **Objective:** Testing React components in isolation (UI interactions).
   * **Scope:**
     * `ApiKeyForm.tsx`: Form validation, states (loading, error), interactions.
     * `ConversationListItem.tsx`: Two-step deletion logic.
     * `ModelSelector.tsx`: Search, model selection.
     * `Composer.tsx`: Validation, `disabled` states, keyboard shortcut handling.

3. **Integration Tests:**
   * **Objective:** Verification of cooperation between system modules.
   * **Scope:**
     * **API Integration (Backend):** Testing API endpoints (`src/pages/api/`) with mocked Supabase and OpenRouter. Verification of Zod validation, service logic, and response formatting.
     * **Supabase Integration (RLS):** *Critical.* Tests verifying that Row Level Security policies work correctly (e.g., User A *cannot* read or delete User B's conversations).
     * **OpenRouter Integration:** Verification that `open-router.service.ts` correctly handles various response codes from mocked API (401, 403, 429, 5xx).

4. **E2E Tests (End-to-End):**
   * **Objective:** Simulation of complete user flows in the browser.
   * **Scope:** Testing P0 and P1 scenarios (see section 4). Mocking the entire backend (Supabase) and OpenRouter API will be key to ensure stable and fast E2E tests.

5. **Security Testing:**
   * **Objective:** Identification of security vulnerabilities.
   * **Scope:**
     * Verification that decrypted API key cannot be retrieved via endpoint (GET `/api/api-key` must return only `exists`).
     * Testing middleware (`src/middleware/index.ts`) – attempts to access `/app/*` and `/api/*` without authentication.
     * RLS policy verification (see Integration Tests).

6. **Accessibility Tests (A11y):**
   * **Objective:** Ensuring WCAG compliance.
   * **Scope:** Audits of Shadcn/ui components, keyboard navigation verification, ARIA attributes (especially in `ChatContainer.tsx` and `ConversationList.tsx`).

***

## 4. Test Scenarios (Key Functionalities)

Below are high-priority E2E scenarios (P0 and P1).

### SC-01: Authentication and Page Protection (P0)

* **1.1:** Unauthorized user, accessing `/app/settings`, is redirected to `/auth/login`.
* **1.2:** Unauthorized user can access `/auth/login` and `/auth/register`.
* **1.3:** User can successfully register using correct data.
* **1.4:** User can successfully log in using correct data.
* **1.5:** Logged-in user, accessing `/auth/login`, is redirected to `/app/conversations/new`.
* **1.6:** User can successfully log out.

### SC-02: API Key Management (P0)

* **2.1:** Logged-in user without a key sees "No API Key" status (`ApiKeyStatusBadge.tsx`).
* **2.2:** User on `/app/settings` page enters invalid key (e.g., without "sk-or-") and sees Zod validation error.
* **2.3:** User enters valid API key and clicks "Save". Key is saved, and status changes to "API Key Saved".
* **2.4:** User refreshes page, key status remains "API Key Saved" (verification of GET `/api/api-key`).
* **2.5:** User clicks "Delete", confirms in dialog. Key is deleted, and status changes to "No API Key".

### SC-03: Chat Flow (P0)

* **3.1:** User with valid API key creates a new conversation.
* **3.2:** User selects model from `ModelSelector.tsx`.
* **3.3:** User sends message "A".
* **3.4:** UI shows message "A" and loading indicator (`MessageItem` of type "loading").
* **3.5:** (Mock API) Server returns response "B".
* **3.6:** UI replaces loading indicator with message "B", displays correct model name (`ModelBadge.tsx`), and updates token counter (`TokenCounter.tsx`).
* **3.7:** User refreshes page – conversation "A/B" is fully loaded.
* **3.8:** User copies message "B" using `CopyButton.tsx` button.

### SC-04: Model Switching and Branching (P1)

* **4.1:** User sends message "A" using `gpt-4o-mini` model.
* **4.2:** User changes model in `ModelSelector.tsx` to `claude-3-haiku`.
* **4.3:** User sends message "C".
* **4.4:** (Mock API) Server returns response "D".
* **4.5:** UI displays 4 messages. Message "B" has `gpt-4o-mini` badge, and "D" has `claude-3-haiku`.
* **4.6:** User clicks "Branch" button on message "A" and selects "Create branch with full history".
* **4.7:** Application creates new conversation and switches to it. New conversation contains *only* message "A".
* **4.8:** User returns to old conversation, clicks "Branch" on message "C" and selects "Create branch with summary".
* **4.9:** (Mock API) Application creates new conversation that contains one system message (summary of A->B->C generated by AI).

### SC-05: API Error Handling (P1)

* **5.1:** User sends message, but configured OpenRouter mock returns `401 Unauthorized` error.
* **5.2:** UI displays error message (`MessageItem` of type "error") with content "Invalid or expired OpenRouter API key...".
* **5.3:** User sends message, but mock returns `503 Service Unavailable` error.
* **5.4:** UI displays error message with content "AI model provider is currently overloaded...".

***

## 5. Test Environment

1. **Local (Dev):** Unit and component tests run locally by developers and QA (`npm run test`).
2. **CI (GitHub Actions):** Automatic test execution (Lint, Unit, Component, API Integration) on every push to `main` branch or opening a Pull Request.
3. **Staging (Review App):** Environment (e.g., DigitalOcean App Platform, Vercel) automatically built from `main` branch (or PR). Full E2E tests and manual testing will be conducted here. Staging environment connects to *dedicated Supabase instance (staging)*.
4. **Production (DigitalOcean):** Production environment. Tests limited to *smoke tests* after deployment.

***

## 6. Testing Tools

* **Test Runner (Unit/Component/Integration):** **Vitest** – integrated with Vite ecosystem (used by Astro).
* **React Component Tests:** **React Testing Library (RTL)** – for rendering and testing React component interactions.
* **E2E Tests:** **Playwright** – modern E2E tool enabling easy API mocking (key for OpenRouter and Supabase) and testing across different browsers.
* **API Tests (Manual/Exploratory):** **Postman** or **Insomnia** – for direct API endpoint testing and RLS verification.
* **API Mocking:** **MSW (Mock Service Worker)** or built-in Playwright functions (`page.route`) for mocking OpenRouter and Supabase in E2E tests.
* **CI/CD:** **GitHub Actions** (defined in `README.md`).
* **Accessibility (A11y):** **@axe-core/playwright** (for automating A11y tests in E2E pipeline) and **Lighthouse/Axe** plugin for manual testing.

***

## 7. Test Schedule (Outline)

Tests will be conducted in parallel with development (following "shift-left" philosophy).

* **Phase 1: Development (T0 - T+n):**
  * Developers write unit and component tests for newly created features.
  * QA creates E2E and integration scenarios for key flows (P0).
* **Phase 2: MVP Stabilization (before release):**
  * Feature freeze.
  * Full manual and automated (E2E) regression on Staging environment.
  * Security tests (RLS, middleware protection).
  * A11y and responsiveness (RWD) tests.
* **Phase 3: Post-Deployment (Post-MVP):**
  * Running *smoke tests* on production (login, sending 1 message).
  * Continuous monitoring and regression testing for new features.

***

## 8. Test Acceptance Criteria

### Entry Criteria (Start of Phase 2 Testing)

1. All MVP functionalities implemented and merged into `main` branch.
2. Staging environment is active and stable.
3. All unit and integration tests in CI pass (green).

### Exit Criteria (Test Completion / Release Approval)

1. **100%** of automated E2E tests (P0 and P1 scenarios) pass (green) on Staging.
2. **100%** of manual test scenarios (P0, P1, P2) have been executed and completed successfully.
3. **No** unresolved critical bugs (Blocker) and serious bugs (Critical).
4. All identified security issues (RLS, API key leakage) have been resolved.
5. Accessibility (A11y) report shows no critical violations.

***

## 9. Roles and Responsibilities

* **QA Engineer:**
  * Author and maintainer of this test plan.
  * Creating and maintaining automated E2E tests (Playwright).
  * Creating and maintaining API integration tests (including RLS).
  * Conducting manual exploratory and regression tests.
  * Bug reporting and verification.
* **Developers:**
  * Writing unit and component tests for their code.
  * Fixing bugs reported by QA.
  * Conducting "buddy check" tests (mutual code verification) before merging PR.
* **Project Manager / Product Owner:**
  * Defining priorities for tested functionalities.
  * Making final release decision (Go/No-Go) based on QA report.

***

## 10. Bug Reporting Procedures

1. **Tool:** GitHub Issues (in project repository).

2. **Bug Report Template:**
   * **Title:** Short, descriptive (e.g., `[Bug] APIKeyForm: "Save" button inactive after entering valid key`).
   * **Environment:** (e.g., Staging, Local dev).
   * **Browser:** (e.g., Chrome, Firefox).
   * **Priority:**
     * **Blocker:** Prevents testing/using critical feature (e.g., login doesn't work).
     * **Critical:** Critical feature works incorrectly (e.g., sending message returns 500).
     * **Major:** Main feature works but has serious flaws (e.g., branching copies wrong history).
     * **Minor:** UI issue, typo, minor inconvenience.
   * **Steps to Reproduce (STR):** Detailed step list.
   * **Expected Result:** What should happen.
   * **Actual Result:** What happened.
   * **Evidence:** Screenshots, video recordings, console logs.
   * **Labels:** `bug`, `p0` (priority), `auth`, `chat`, `ui` (component).

3. **Bug Lifecycle:**
   * `New` (QA reports) -> `In Progress` (Dev takes on) -> `Ready for QA` (Dev fixes and deploys to Staging) -> `Verified/Closed` (QA confirms fix) or `Reopened` (QA rejects fix).
