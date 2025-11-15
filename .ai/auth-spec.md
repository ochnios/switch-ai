# Authentication System - Technical Specification

## Overview

This document outlines the technical architecture for implementing user authentication in switch-ai, covering registration, login, logout, and password recovery functionality. The implementation leverages Supabase Auth integrated with Astro 5's SSR capabilities while maintaining compatibility with existing application requirements.

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Public vs Protected Routes

**Public Routes** (accessible without authentication):

* `/` - Landing page (index.astro with LandingPage.tsx)
* `/auth/login` - Login page
* `/auth/register` - Registration page
* `/auth/reset-password` - Password reset request page
* `/auth/update-password` - Password update page (accessed via email link)

**Protected Routes** (require authentication):

* `/app/*` - All application routes
* `/api/*` - All API endpoints (except auth-related endpoints)

### 1.2 Page Components Structure

#### Authentication Pages

**Login Page** (`/src/pages/auth/login.astro`)

* Astro page component with SSR
* Pre-render check: if user already authenticated, redirect to `/app/new`
* Contains LoginForm React component
* Includes link to registration and password reset pages
* Uses Layout.astro for consistent styling

**Registration Page** (`/src/pages/auth/register.astro`)

* Astro page component with SSR
* Pre-render check: if user already authenticated, redirect to `/app/new`
* Contains RegisterForm React component
* Includes link to login page
* Uses Layout.astro for consistent styling

**Reset Password Request Page** (`/src/pages/auth/reset-password.astro`)

* Astro page component with SSR
* Contains ResetPasswordForm React component
* Displays success message after submission
* Includes link back to login page

**Update Password Page** (`/src/pages/auth/update-password.astro`)

* Astro page component with SSR
* Verifies token from email link
* Contains UpdatePasswordForm React component
* Redirects to login after successful password update

#### React Form Components

All form components located in `/src/components/auth/` directory:

**LoginForm.tsx**

* Controlled form component with state management
* Fields: email (text input), password (password input)
* Submit button with loading state
* Client-side validation before submission
* Calls `/api/auth/login` endpoint
* Displays server-side validation errors
* On success: redirects based on context:
  * If `redirect` query parameter exists (user was redirected from protected route), redirect to that URL
  * Otherwise, redirect to`/app/new`

**RegisterForm.tsx**

* Controlled form component with state management
* Fields: email (text input), password (password input), confirmPassword (password input)
* Submit button with loading state
* Client-side validation before submission
* Calls `/api/auth/register` endpoint
* Displays server-side validation errors
* On success: automatically logs in user and redirects to `/app/new`

**ResetPasswordForm.tsx**

* Controlled form component
* Field: email (text input)
* Submit button with loading state
* Calls `/api/auth/reset-password` endpoint
* Displays success message on submission
* Displays errors if email not found (optional, for UX)

**UpdatePasswordForm.tsx**

* Controlled form component
* Fields: password (password input), confirmPassword (password input)
* Submit button with loading state
* Receives recovery token from URL query parameters
* Calls `/api/auth/update-password` endpoint
* On success: redirects to login with success message

#### Protected Page Modifications

**Existing Pages** (`/src/pages/app/*.astro`)

* No structural changes required
* Authentication check handled by middleware
* Access to authenticated user via `context.locals.user`

**Layout Modifications** (`/src/layouts/Layout.astro`)

* No changes required for authentication logic
* Optionally add user context provider for client-side components

#### User Context Component

**AuthProvider.tsx** (optional, if needed for client-side auth state)

* React context provider for user authentication state
* Provides current user information to React components
* Manages logout functionality
* Used in app pages for displaying user information

### 1.3 Navigation and User Actions

**Post-Authentication Navigation**:

* After successful login:
  * If `redirect` query parameter exists (user came from protected route), redirect to that URL
  * Otherwise, redirect to user's last active conversation (most recently created) or `/app/new` if no conversations exist
* After successful registration → redirect to `/app/new` (new users always have no conversations)
* After password reset request → display success message on same page
* After password update → redirect to `/auth/login` with success message
* After logout → redirect to `/` (landing page)
* Authenticated user accessing landing page `/` → redirect to last active conversation or `/app/new`
* Authenticated user accessing `/auth/login` or `/auth/register` → redirect to last active conversation or `/app/new`

**Error Handling in Forms**:

* Display inline validation errors below each field
* Display general form errors in an alert component above form
* Maintain form state during error display
* Clear errors on field modification

### 1.4 Validation Cases and Error Messages

**Email Validation**:

* Format: valid email address pattern
* Error messages:
  * "Email address is required"
  * "Please enter a valid email address"

**Password Validation (Registration and Update)**:

* Minimum length: 8 characters
* Error messages:
  * "Password is required"
  * "Password must be at least 8 characters long"
  * "Passwords do not match" (for confirmPassword field)

**Server-side Error Messages**:

* Authentication failed: "Invalid email or password"
* Email already exists: "An account with this email already exists"
* Email not found: "No account found with this email address"
* Invalid token: "Password reset link is invalid or has expired"
* General error: "An error occurred. Please try again later"

### 1.5 Key Scenarios

**Scenario: User Registration**

1. User navigates to `/auth/register`
2. User fills email and password fields
3. Client-side validation runs on blur and submit
4. On submit, form calls POST `/api/auth/register`
5. On success: user is created in Supabase and automatically logged in
6. User is redirected to `/app/new` (new users have no existing conversations)

**Scenario: User Login**

1. User navigates to `/auth/login` (optionally with `?redirect=/app/conversations/{id}` if redirected from protected route)
2. User enters credentials
3. Client-side validation runs
4. On submit, form calls POST `/api/auth/login`
5. On success: server sets session cookie
6. Client requests GET `/api/conversations` to check for existing conversations
7. User is redirected to:
   * The URL from `redirect` query parameter if present, OR
   * The most recently created conversation (`/app/conversations/{id}`), OR
   * `/app/new` if user has no conversations

**Scenario: Password Recovery**

1. User navigates to `/auth/reset-password`
2. User enters email address
3. On submit, form calls POST `/api/auth/reset-password`
4. Server sends recovery email via Supabase
5. Success message displayed to user
6. User receives email with link to `/auth/update-password?token=...`
7. User clicks link, navigates to update password page
8. User enters new password
9. On submit, form calls POST `/api/auth/update-password`
10. On success: password updated, user redirected to login

**Scenario: Accessing Protected Route While Unauthenticated**

1. Unauthenticated user attempts to access `/app/conversations/{id}` or `/app/new` or `/app/settings`
2. Middleware intercepts request
3. No valid session found
4. User is redirected to `/auth/login?redirect=/app/conversations/{id}` (or the originally requested URL)
5. After successful login, user is redirected to the URL from the `redirect` query parameter

**Note on "Last Active Conversation"**:
For MVP, "last active conversation" is defined as the most recently created conversation (sorted by `created_at DESC`). The application does not track "last accessed" or "last viewed" timestamps. This means the first item in the conversations list (fetched from GET `/api/conversations`) is considered the "last active" conversation. This interpretation aligns with the existing database schema and keeps the MVP implementation simple.

**Scenario: User Logout**

1. User clicks logout button (in header or settings)
2. Client calls POST `/api/auth/logout`
3. Server invalidates session and clears cookie
4. User is redirected to `/` (landing page)

## 2. BACKEND LOGIC

### 2.1 API Endpoints Structure

All authentication endpoints located at `/src/pages/api/auth/*`:

#### POST /api/auth/register

**Request Body**:

```typescript
{
  email: string;
  password: string;
}
```

**Response** (201 Created):

```typescript
{
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Error Responses**:

* 400: Validation error (invalid email/password format)
* 409: Email already exists
* 500: Server error

**Behavior**:

* Validates input using Zod schema
* Calls `supabase.auth.signUp()`
* On success: sets session cookie and returns user data
* Creates session cookie with httpOnly, secure, sameSite flags

#### POST /api/auth/login

**Request Body**:

```typescript
{
  email: string;
  password: string;
}
```

**Response** (200 OK):

```typescript
{
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Error Responses**:

* 400: Validation error
* 401: Invalid credentials
* 500: Server error

**Behavior**:

* Validates input using Zod schema
* Calls `supabase.auth.signInWithPassword()`
* On success: sets session cookie and returns user data

#### POST /api/auth/logout

**Request**: No body required

**Response** (204 No Content)

**Behavior**:

* Calls `supabase.auth.signOut()`
* Clears session cookie
* Returns success response

#### POST /api/auth/reset-password

**Request Body**:

```typescript
{
  email: string;
}
```

**Response** (200 OK):

```typescript
{
  message: "Password reset email sent";
}
```

**Behavior**:

* Validates email using Zod schema
* Calls `supabase.auth.resetPasswordForEmail()`
* Sends email with link to `/auth/update-password`
* Returns success message (even if email not found, for security)

#### POST /api/auth/update-password

**Request Body**:

```typescript
{
  password: string;
  token: string; // recovery token from email link
}
```

**Response** (200 OK):

```typescript
{
  message: "Password updated successfully";
}
```

**Error Responses**:

* 400: Validation error or invalid/expired token
* 500: Server error

**Behavior**:

* Validates input using Zod schema
* Verifies recovery token
* Calls `supabase.auth.updateUser()` with new password
* Returns success message

#### GET /api/auth/session

**Request**: No body required

**Response** (200 OK):

```typescript
{
  user: {
    id: string;
    email: string;
  } | null;
}
```

**Behavior**:

* Retrieves current session from cookie
* Calls `supabase.auth.getUser()`
* Returns user data if authenticated, null otherwise
* Used by client-side auth state management

#### GET /api/auth/redirect-url

**Request**: Query parameter `fallback` (optional, URL to use if no conversations exist)

**Response** (200 OK):

```typescript
{
  url: string;  // URL to redirect to (e.g., "/app/conversations/{id}" or "/app/new")
}
```

**Behavior**:

* Requires authentication (returns 401 if not authenticated)
* Fetches user's conversations list (first item only, sorted by created\_at DESC)
* If user has conversations, returns URL to most recent conversation
* If user has no conversations, returns `/app/new` or the fallback URL if provided
* Used by login/registration forms to determine post-authentication redirect target

### 2.2 Data Models and Validation

#### Zod Schemas

Located in `/src/lib/schemas/auth.schema.ts`:

**registerSchema**:

```typescript
{
  email: z.string().email(),
  password: z.string().min(8)
}
```

**loginSchema**:

```typescript
{
  email: z.string().email(),
  password: z.string().min(1)
}
```

**resetPasswordSchema**:

```typescript
{
  email: z.string().email()
}
```

**updatePasswordSchema**:

```typescript
{
  password: z.string().min(8),
  token: z.string().min(1)
}
```

#### User Type Definitions

Located in `/src/types.ts`:

**AuthUser**:

```typescript
{
  id: string;
  email: string;
  created_at: string;
}
```

**AuthSession**:

```typescript
{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

### 2.3 Service Layer

#### AuthService

Located in `/src/lib/services/auth.service.ts`:

**Methods**:

* `signUp(email: string, password: string)` - Creates new user account
* `signIn(email: string, password: string)` - Authenticates user
* `signOut()` - Ends user session
* `resetPassword(email: string)` - Initiates password recovery
* `updatePassword(password: string)` - Updates user password
* `getUser()` - Retrieves current authenticated user
* `verifySession(token: string)` - Verifies session token validity

**Dependencies**:

* Supabase client (injected via constructor)
* Logger for error tracking

**Error Handling**:

* Wraps Supabase errors in application-specific error types
* Logs all authentication attempts and failures
* Returns structured error responses

### 2.4 Exception Handling

**Error Types** (located in `/src/lib/errors/auth.errors.ts`):

* `AuthenticationError` - Invalid credentials, extends base error
* `RegistrationError` - Registration failure (e.g., email exists)
* `ValidationError` - Input validation failure
* `TokenError` - Invalid or expired token

**Error Handler Function**:

Located in `/src/lib/utils/api-error-handler.ts`, extended to handle auth-specific errors:

**handleAuthError(error: Error, logger: Logger)**:

* Maps error types to HTTP status codes
* Returns structured error response
* Logs error details for debugging
* Sanitizes sensitive information from responses

### 2.5 Session Management

**Cookie Configuration**:

* Name: `sb-access-token`, `sb-refresh-token`
* HttpOnly: true (prevents XSS attacks)
* Secure: true in production (HTTPS only)
* SameSite: 'lax' (CSRF protection)
* Max-Age: 7 days for refresh token, 1 hour for access token

**Session Refresh Strategy**:

* Middleware checks token expiration on each request
* Auto-refresh using refresh token if access token expired
* If refresh fails, clear cookies and redirect to login

**Session Storage**:

* Tokens stored in HTTP-only cookies
* No session data stored in localStorage/sessionStorage
* User data available via `context.locals.user` in SSR
* Client-side can access user via `/api/auth/session` endpoint

### 2.6 Middleware Updates

**Enhanced Middleware** (`/src/middleware/index.ts`):

**Responsibilities**:

1. Inject Supabase client into context (existing)
2. Extract session tokens from cookies
3. Verify and refresh session if needed
4. Retrieve user data and add to `context.locals.user`
5. Implement route protection logic:
   * Public routes (unauthenticated only): `/auth/*` (except when already authenticated - see below)
   * Semi-public route: `/` (landing page) - accessible but redirects authenticated users
   * Protected routes: `/app/*`, `/api/*` (except `/api/auth/*`) → require authentication
6. Handle authenticated user navigation:
   * If authenticated user accesses `/`, `/auth/login`, or `/auth/register`:
     * Fetch user's most recent conversation (or use cached value)
     * Redirect to `/app/conversations/{id}` if conversations exist
     * Otherwise redirect to `/app/new`
7. Redirect unauthenticated users accessing protected routes to `/auth/login?redirect={original_url}`
8. Handle session refresh and cookie updates

**Context Extension**:

Updated in `/src/env.d.ts`:

```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user: AuthUser | null;
  }
}
```

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

**Configuration**:

* Use Supabase built-in authentication system
* Email/password authentication provider enabled
* Email confirmation: optional for MVP (can be disabled)
* Email templates customized for password recovery

**Auth Flow**:

1. Client submits credentials to API endpoint
2. API endpoint calls Supabase Auth methods
3. Supabase validates credentials against `auth.users` table
4. On success: Supabase returns access and refresh tokens
5. Server sets tokens as HTTP-only cookies
6. Server returns user data to client
7. Client redirects to protected route

**Token Management**:

* Access tokens valid for 1 hour
* Refresh tokens valid for 7 days
* Middleware handles automatic token refresh
* Expired refresh tokens require re-authentication

### 3.2 Security Considerations

**Password Security**:

* Minimum 8 characters enforced
* Passwords hashed by Supabase (bcrypt)
* No password stored in plain text
* Password complexity recommendations displayed in UI (optional enhancement)

**Session Security**:

* HTTP-only cookies prevent XSS token theft
* Secure flag ensures HTTPS transmission in production
* SameSite attribute prevents CSRF attacks
* Short access token lifetime limits exposure
* Refresh token rotation on each use (optional enhancement)

**API Security**:

* All auth endpoints use POST to prevent credential leakage in logs
* CORS configured to allow only application domain
* Rate limiting applied to auth endpoints (optional enhancement)
* Logging excludes sensitive data (passwords, tokens)

**Password Recovery Security**:

* Recovery tokens single-use and time-limited (1 hour)
* Recovery links contain unique token, not user identifier
* Email sending rate-limited to prevent abuse

### 3.3 User Flow State Management

**Server-side State**:

* Session managed entirely server-side via Supabase
* User information retrieved on each request via middleware
* No client-side session management complexity

**Client-side State**:

* React components access user via props from Astro context
* Optional: AuthContext provider for React component tree
* Session validation endpoint for client-side checks

### 3.4 Error Recovery

**Failed Login Attempts**:

* Display generic error message to prevent user enumeration
* Log failed attempts with IP for security monitoring
* Optional: implement rate limiting after N failed attempts

**Session Expiration**:

* Middleware detects expired session during request
* Attempts token refresh automatically
* On refresh failure: clears cookies and redirects to login
* Preserves original URL for post-login redirect

**Network Errors**:

* API calls wrapped in try-catch
* Display user-friendly error messages
* Retry logic for transient failures (optional)
* Fallback to login page on persistent errors

### 3.5 Environment Variables

**Required Environment Variables**:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx (anon key)
SITE_URL=http://localhost:3000 (for email links)
```

**Email Configuration** (Supabase dashboard):

* SMTP settings for transactional emails
* Custom email templates for password reset
* Password recovery redirect URL: `{SITE_URL}/auth/update-password`

### 3.6 Migration from DEFAULT\_USER\_ID

**Current State**:

* All API endpoints currently use `DEFAULT_USER_ID` constant
* No authentication required to access application

**Migration Steps**:

1. Implement authentication system as specified
2. Update middleware to extract `userId` from session
3. Replace all `DEFAULT_USER_ID` references with `context.locals.user.id`
4. Add null checks for unauthenticated requests
5. Update API endpoints to return 401 if user not authenticated
6. Test all endpoints with authenticated user context

**Affected Files**:

* `/src/db/supabase.client.ts` - remove DEFAULT\_USER\_ID export
* `/src/pages/api/**/*.ts` - replace DEFAULT\_USER\_ID with context.locals.user.id
* `/src/lib/services/*.ts` - accept userId as parameter instead of using constant

### 3.7 Testing Considerations

**Unit Tests**:

* Test Zod schema validations
* Test AuthService methods with mocked Supabase client
* Test error handling and error type mappings

**Integration Tests**:

* Test complete auth flows (register, login, logout)
* Test password recovery flow
* Test session refresh mechanism
* Test middleware route protection

**End-to-End Tests**:

* Test user registration through UI
* Test login and navigation to protected routes
* Test logout and redirect to public pages
* Test password recovery email flow

## 4. IMPLEMENTATION NOTES

### 4.1 Component Organization

```
src/
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── ResetPasswordForm.tsx
│       ├── UpdatePasswordForm.tsx
│       └── AuthProvider.tsx (optional)
├── pages/
│   ├── auth/
│   │   ├── login.astro
│   │   ├── register.astro
│   │   ├── reset-password.astro
│   │   └── update-password.astro
│   └── api/
│       └── auth/
│           ├── register.ts
│           ├── login.ts
│           ├── logout.ts
│           ├── reset-password.ts
│           ├── update-password.ts
│           ├── session.ts
│           └── redirect-url.ts
├── lib/
│   ├── services/
│   │   └── auth.service.ts
│   ├── schemas/
│   │   └── auth.schema.ts
│   ├── errors/
│   │   └── auth.errors.ts
│   └── utils/
│       ├── session.ts
│       └── cookies.ts
└── middleware/
    └── index.ts (updated)
```

### 4.2 Dependencies

**Required Packages** (already in package.json):

* `@supabase/supabase-js` - Supabase client
* `zod` - Schema validation
* `astro` - SSR framework

**No Additional Dependencies Required**

### 4.3 Configuration Updates

**astro.config.mjs**:

* No changes required (already configured for SSR)

**Environment Variables**:

* Add `SITE_URL` for email links
* Existing `SUPABASE_URL` and `SUPABASE_KEY` sufficient

### 4.4 Compatibility Notes

**Existing Functionality Preserved**:

* Landing page remains public and functional
* All existing API endpoints maintain their contracts
* Database schema unchanged (uses Supabase auth.users table)
* View transitions continue to work with authentication
* Middleware enhancement is non-breaking for existing logic

**User Experience Maintained**:

* First-time users can view landing page without registration
* "Get Started" button redirects to `/app/new`, which now requires authentication
* After login/registration:
  * New users (from registration) → always redirected to `/app/new`
  * Returning users (from login) → redirected to last active conversation (most recently created) or `/app/new` if no conversations exist
  * Users who were redirected from protected route → redirected back to originally requested URL
* Authenticated users accessing landing page → automatically redirected to last conversation or `/app/new`
* All US-003 through US-013 requirements remain implementable with authenticated user context

## 5. FUTURE ENHANCEMENTS

Items intentionally excluded from MVP but considered in architecture:

* Multi-factor authentication (MFA)
* OAuth providers (Google, GitHub)
* Session management dashboard
* Password complexity requirements beyond minimum length
* Remember me functionality
* Account deletion
* Email verification requirement
* Rate limiting on auth endpoints
* Automatic session timeout with warning
* Device management (view/revoke sessions)
