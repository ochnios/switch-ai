# Unit Test Plan

This document outlines the unit test scenarios for the switch-ai application. Unit tests focus on testing isolated code units (functions, classes, utilities) in isolation from external dependencies.

## Test Organization

Unit tests are co-located with source files following the pattern:

* `src/lib/services/conversation.service.ts` → `tests/unit/services/conversation.service.test.ts`
* `src/lib/crypto.ts` → `tests/unit/crypto.test.ts`
* `src/lib/schemas/auth.schema.ts` → `tests/unit/schemas/auth.schema.test.ts`

## 1. Crypto Module (`src/lib/crypto.ts`)

**Priority: P0 (Critical for Security)**

### Test Scenarios

#### UT-CRYPTO-01: Encryption Function

* **1.1:** Encrypts plaintext string successfully and returns base64-encoded string
* **1.2:** Throws error when `ENCRYPTION_KEY` environment variable is not set
* **1.3:** Encrypted output is different for same plaintext (due to random salt/IV)
* **1.4:** Encrypted output has correct structure (base64 format)
* **1.5:** Handles empty string input
* **1.6:** Handles special characters and unicode in plaintext
* **1.7:** Handles very long plaintext strings

#### UT-CRYPTO-02: Decryption Function

* **2.1:** Decrypts valid encrypted data and returns original plaintext
* **2.2:** Throws error when `ENCRYPTION_KEY` environment variable is not set
* **2.3:** Throws error when encrypted data is corrupted (invalid base64)
* **2.4:** Throws error when encrypted data is tampered with (auth tag mismatch)
* **2.5:** Throws error when encrypted data has incorrect length
* **2.6:** Handles decryption of empty string
* **2.7:** Handles decryption of special characters and unicode

#### UT-CRYPTO-03: Encryption/Decryption Roundtrip

* **3.1:** Encrypt and decrypt roundtrip preserves original plaintext
* **3.2:** Multiple encryptions of same plaintext produce different ciphertexts but decrypt to same value
* **3.3:** Roundtrip works with various data types (strings, JSON strings, multiline text)

## 2. API Key Service (`src/lib/services/api-key.service.ts`)

**Priority: P0**

### Test Scenarios

#### UT-APIKEY-01: Upsert API Key

* **1.1:** Successfully encrypts and stores API key for user
* **1.2:** Updates existing API key when user already has one
* **1.3:** Throws `ApiKeyEncryptionError` when encryption fails
* **1.4:** Throws error when Supabase upsert operation fails
* **1.5:** Handles empty or invalid API key strings

#### UT-APIKEY-02: Check API Key Exists

* **2.1:** Returns `true` when API key exists for user
* **2.2:** Returns `false` when API key does not exist for user
* **2.3:** Throws error when database query fails

#### UT-APIKEY-03: Delete API Key

* **3.1:** Successfully deletes API key for user
* **3.2:** Does not throw error when deleting non-existent key (idempotent)
* **3.3:** Throws error when database delete operation fails

#### UT-APIKEY-04: Get API Key

* **4.1:** Successfully retrieves and decrypts API key for user
* **4.2:** Throws `ApiKeyNotFoundError` when API key does not exist
* **4.3:** Throws `ApiKeyDecryptionError` when decryption fails
* **4.4:** Throws error when database query fails

## 3. Auth Service (`src/lib/services/auth.service.ts`)

**Priority: P0**

### Test Scenarios

#### UT-AUTH-01: Sign In

* **1.1:** Successfully authenticates user with valid credentials
* **1.2:** Returns `AuthUser` object with correct id and email
* **1.3:** Throws `AuthenticationError` when credentials are invalid
* **1.4:** Throws `AuthenticationError` when user email is missing
* **1.5:** Throws `AuthenticationError` when user object is null
* **1.6:** Maps Supabase auth errors correctly using `mapSupabaseAuthError`

#### UT-AUTH-02: Sign Out

* **2.1:** Successfully signs out authenticated user
* **2.2:** Throws `AuthError` when sign out fails
* **2.3:** Maps Supabase errors correctly

#### UT-AUTH-03: Get User

* **3.1:** Returns `AuthUser` when user is authenticated
* **3.2:** Returns `null` when user is not authenticated
* **3.3:** Returns `null` when user exists but email is missing (logs warning)
* **3.4:** Returns `null` on any error (does not throw)

#### UT-AUTH-04: Sign Up

* **4.1:** Successfully registers new user with valid email and password
* **4.2:** Returns `AuthUser` object with correct id and email
* **4.3:** Throws `RegistrationError` when email already exists (409)
* **4.4:** Throws `RegistrationError` when registration fails
* **4.5:** Throws error when user object is null after registration
* **4.6:** Throws error when user email is missing after registration

#### UT-AUTH-05: Reset Password

* **5.1:** Successfully sends password reset email
* **5.2:** Uses correct redirect URL from environment or default
* **5.3:** Throws `AuthError` when reset password request fails
* **5.4:** Maps Supabase errors correctly

#### UT-AUTH-06: Update Password

* **6.1:** Successfully updates password with valid token
* **6.2:** Throws `TokenError` when token is invalid or expired
* **6.3:** Throws `TokenError` when exchangeCodeForSession fails
* **6.4:** Throws `AuthError` when password update fails
* **6.5:** Maps Supabase errors correctly

## 4. Conversation Service (`src/lib/services/conversation.service.ts`)

**Priority: P0**

### Test Scenarios

#### UT-CONV-01: Generate Title

* **1.1:** Successfully generates title from first message using OpenRouter
* **1.2:** Removes quotes from generated title if present
* **1.3:** Truncates title to 50 characters if longer
* **1.4:** Removes trailing punctuation after truncation
* **1.5:** Returns fallback "New Conversation" when generated title is empty
* **1.6:** Returns fallback (first 50 chars of message) when OpenRouter call fails
* **1.7:** Handles very short first messages
* **1.8:** Handles very long first messages

#### UT-CONV-02: Create Conversation

* **2.1:** Successfully creates conversation with optional title
* **2.2:** Successfully creates conversation without title (null)
* **2.3:** Throws error when database insert fails
* **2.4:** Returns conversation with correct fields (id, title, parent\_conversation\_id, created\_at)

#### UT-CONV-03: Get Conversations (Paginated)

* **3.1:** Returns paginated conversations for user (first page)
* **3.2:** Returns correct pagination metadata (page, pageSize, total)
* **3.3:** Returns empty array when user has no conversations
* **3.4:** Handles pagination correctly (offset calculation)
* **3.5:** Returns conversations sorted by created\_at descending
* **3.6:** Throws error when count query fails
* **3.7:** Throws error when data query fails

#### UT-CONV-04: Get Conversation By ID

* **4.1:** Returns conversation when found and owned by user
* **4.2:** Returns `null` when conversation not found
* **4.3:** Returns `null` when conversation exists but not owned by user
* **4.4:** Throws error when database query fails

#### UT-CONV-05: Delete Conversation

* **5.1:** Returns `true` when conversation is successfully deleted
* **5.2:** Returns `false` when conversation not found or unauthorized
* **5.3:** Throws error when database delete operation fails
* **5.4:** Verifies ownership before deletion (RLS handled by Supabase)

#### UT-CONV-06: Create Branch From Message (Full Type)

* **6.1:** Successfully creates branch with full message history
* **6.2:** Verifies message exists and belongs to user's conversation
* **6.3:** Increments branch\_count on parent conversation
* **6.4:** Creates new conversation with correct title format
* **6.5:** Copies all messages up to and including source message
* **6.6:** Preserves message metadata (role, content, model\_name, tokens)
* **6.7:** Throws error when message not found
* **6.8:** Throws error when parent conversation not found or unauthorized
* **6.9:** Throws error when branch count update fails
* **6.10:** Throws error when message copy fails
* **6.11:** Handles empty message history correctly

#### UT-CONV-07: Create Branch From Message (Summary Type)

* **7.1:** Successfully creates branch with AI-generated summary
* **7.2:** Verifies message exists and belongs to user's conversation
* **7.3:** Increments branch\_count on parent conversation
* **7.4:** Creates new conversation with correct title format
* **7.5:** Generates summary using OpenRouter with correct prompt
* **7.6:** Inserts summary as system message in new conversation
* **7.7:** Formats conversation history correctly for summarization
* **7.8:** Throws error when message not found
* **7.9:** Throws error when parent conversation not found or unauthorized
* **7.10:** Throws error when summary generation fails
* **7.11:** Throws error when conversation history is empty
* **7.12:** Handles very long conversation histories

#### UT-CONV-08: Copy Messages For Full Branch (Private Method)

* **8.1:** Copies all messages up to source message timestamp
* **8.2:** Orders messages by created\_at ascending
* **8.3:** Preserves all message fields correctly
* **8.4:** Handles empty message list (no-op)
* **8.5:** Throws error when message fetch fails
* **8.6:** Throws error when message insert fails

#### UT-CONV-09: Create Summary For Branch (Private Method)

* **9.1:** Fetches conversation history up to source message
* **9.2:** Formats conversation as text with role prefixes
* **9.3:** Calls OpenRouter with correct parameters
* **9.4:** Inserts summary as system message
* **9.5:** Throws error when message fetch fails
* **9.6:** Throws error when conversation text is empty
* **9.7:** Throws error when summary generation fails
* **9.8:** Throws error when summary insert fails

## 5. Message Service (`src/lib/services/message.service.ts`)

**Priority: P0**

### Test Scenarios

#### UT-MSG-01: Get Messages (Paginated)

* **1.1:** Returns paginated messages for conversation
* **1.2:** Returns correct pagination metadata
* **1.3:** Returns messages sorted by created\_at ascending
* **1.4:** Returns empty array when conversation has no messages
* **1.5:** Transforms messages to MessageDto (excludes conversation\_id)
* **1.6:** Throws error when count query fails
* **1.7:** Throws error when messages query fails

#### UT-MSG-02: Send Message

* **2.1:** Successfully saves user message and gets AI response
* **2.2:** Fetches conversation history excluding current user message
* **2.3:** Separates user, assistant, and system messages correctly
* **2.4:** Includes conversation summary in system message when available
* **2.5:** Calls OpenRouter with correct parameters
* **2.6:** Saves assistant response with correct metadata
* **2.7:** Returns both user and assistant messages as MessageDto array
* **2.8:** Throws error when user message save fails
* **2.9:** Throws error when history fetch fails
* **2.10:** Throws error when OpenRouter API call fails
* **2.11:** Throws error when assistant message save fails
* **2.12:** Handles empty conversation history (first message)
* **2.13:** Handles conversation with system message (summary)

## 6. OpenRouter Service (`src/lib/services/open-router.service.ts`)

**Priority: P0**

### Test Scenarios

#### UT-OR-01: Fetch Models

* **1.1:** Successfully fetches models from OpenRouter API
* **1.2:** Maps SDK response to ModelDto array correctly
* **1.3:** Uses model.name or falls back to model.id
* **1.4:** Throws `ApiKeyNotFoundError` when API key not found
* **1.5:** Maps OpenRouter errors correctly using `mapOpenRouterError`
* **1.6:** Handles empty models list

#### UT-OR-02: Create Chat Completion

* **2.1:** Successfully creates chat completion with valid parameters
* **2.2:** Validates input parameters using Zod schema
* **2.3:** Throws `OpenRouterValidationError` when parameters are invalid
* **2.4:** Retrieves and decrypts user API key
* **2.5:** Builds messages array correctly (system, user, assistant)
* **2.6:** Applies history limit (maxHistoryMessages) correctly
* **2.7:** Merges model parameters with defaults correctly
* **2.8:** Returns response with content, model, and usage
* **2.9:** Throws `OpenRouterServerError` when response content is empty
* **2.10:** Throws `ApiKeyNotFoundError` when API key not found
* **2.11:** Maps OpenRouter errors correctly

#### UT-OR-03: Get User API Key (Private Method)

* **3.1:** Successfully retrieves and returns decrypted API key
* **3.2:** Throws `ApiKeyNotFoundError` when key is null or empty
* **3.3:** Logs warning when API key not found

#### UT-OR-04: Build Chat Messages (Private Method)

* **4.1:** Adds system message from params or uses default from config
* **4.2:** Interleaves user and assistant messages correctly
* **4.3:** Adds current user message as last message
* **4.4:** Applies history limit correctly (keeps system + last N messages)
* **4.5:** Handles empty assistant messages array
* **4.6:** Handles single user message (no history)

#### UT-OR-05: Build Model Parameters (Private Method)

* **5.1:** Merges provided parameters with defaults from config
* **5.2:** Uses default values when parameters not provided
* **5.3:** Returns all required parameters (temperature, maxTokens, topP, frequencyPenalty, presencePenalty)

#### UT-OR-06: Map OpenRouter Error

* **6.1:** Returns domain error as-is if already a domain error
* **6.2:** Maps 400 status code to `OpenRouterValidationError`
* **6.3:** Maps 401/403 status codes to `OpenRouterUnauthorizedError`
* **6.4:** Maps 429 status code to `OpenRouterRateLimitError`
* **6.5:** Maps 500/502/503/504 status codes to `OpenRouterServerError`
* **6.6:** Maps 529 status code to `OpenRouterProviderOverloadedError`
* **6.7:** Maps network errors (network, timeout, ECONNREFUSED, ETIMEDOUT) to `OpenRouterNetworkError`
* **6.8:** Maps unknown errors to `OpenRouterServerError`
* **6.9:** Handles non-Error objects correctly
* **6.10:** Extracts status code from error object correctly
* **6.11:** Extracts error message from error object correctly

#### UT-OR-07: Is OpenRouter Error (Private Method)

* **7.1:** Returns true for objects with statusCode property
* **7.2:** Returns true for objects with code property
* **7.3:** Returns false for Error objects without statusCode/code
* **7.4:** Returns false for non-objects

#### UT-OR-08: Extract Status Code (Private Method)

* **8.1:** Extracts numeric statusCode from error object
* **8.2:** Parses status code from error code string (4xx/5xx pattern)
* **8.3:** Parses status code from error message string
* **8.4:** Returns undefined when status code cannot be extracted

#### UT-OR-09: Extract Error Message (Private Method)

* **9.1:** Extracts message from error.message
* **9.2:** Falls back to error.code if message not available
* **9.3:** Falls back to "Unknown error" if neither available

## 7. Error Handling (`src/lib/errors.ts`, `src/lib/errors/auth.errors.ts`)

**Priority: P1**

### Test Scenarios

#### UT-ERROR-01: Error Classes

* **1.1:** All error classes extend correct base class
* **1.2:** Error classes have correct name property
* **1.3:** Error classes preserve cause when provided
* **1.4:** AuthError classes have correct statusCode

#### UT-ERROR-02: Map Supabase Auth Error

* **2.1:** Maps "Invalid login credentials" to `AuthenticationError`
* **2.2:** Maps "Email not confirmed" to `AuthenticationError`
* **2.3:** Maps "User already registered" to `RegistrationError` (409)
* **2.4:** Maps "Password should be at least" to `ValidationError`
* **2.5:** Maps "Invalid token" to `TokenError`
* **2.6:** Maps "Token has expired" to `TokenError`
* **2.7:** Maps unknown errors to generic `AuthError`
* **2.8:** Handles non-object errors correctly

## 8. API Error Handler (`src/lib/utils/api-error-handler.ts`)

**Priority: P1**

### Test Scenarios

#### UT-API-ERROR-01: Handle API Error

* **1.1:** Maps `ApiKeyNotFoundError` to 404 response
* **1.2:** Maps `OpenRouterUnauthorizedError` to 401 response
* **1.3:** Maps `OpenRouterValidationError` to 400 response
* **1.4:** Maps `OpenRouterRateLimitError` to 429 response
* **1.5:** Maps `OpenRouterProviderOverloadedError` to 503 response
* **1.6:** Maps `OpenRouterNetworkError` to 503 response
* **1.7:** Maps `OpenRouterServerError` to 502 response
* **1.8:** Maps unknown errors to 500 response with "Internal server error"
* **1.9:** All responses have correct Content-Type header (application/json)
* **1.10:** All responses include error message in body
* **1.11:** Logs unknown errors using provided logger
* **1.12:** Includes context in error log when provided

## 9. Auth Helpers (`src/lib/utils/auth-helpers.ts`)

**Priority: P1**

### Test Scenarios

#### UT-AUTH-HELPER-01: Get User ID Or Unauthorized

* **1.1:** Returns user ID string when user is authenticated
* **1.2:** Returns 401 Response when user is not authenticated
* **1.3:** Returns 401 Response when user.id is missing
* **1.4:** Returns 401 Response when context.locals.user is null
* **1.5:** Response has correct Content-Type header
* **1.6:** Response body contains correct error message

## 10. Utils (`src/lib/utils.ts`)

**Priority: P2**

### Test Scenarios

#### UT-UTILS-01: CN Function (Class Name Utility)

* **1.1:** Merges class names correctly using clsx and twMerge
* **1.2:** Handles conditional classes
* **1.3:** Handles arrays of classes
* **1.4:** Handles Tailwind class conflicts (twMerge behavior)
* **1.5:** Handles empty inputs
* **1.6:** Handles undefined/null values

## 11. Logger (`src/lib/logger.ts`)

**Priority: P2**

### Test Scenarios

#### UT-LOGGER-01: Logger Class

* **1.1:** Creates logger with correct context
* **1.2:** Error method logs error with context and metadata
* **1.3:** Warn method logs warning with context and metadata
* **1.4:** Info method logs info with context and metadata
* **1.5:** All log methods include timestamp
* **1.6:** Sanitizes sensitive data from metadata (apiKey, token, password, secret, authorization)
* **1.7:** Replaces sensitive values with "\[REDACTED]"
* **1.8:** Case-insensitive sensitive key matching
* **1.9:** Handles undefined metadata
* **1.10:** Includes stack trace in error logs when available

## 12. Zod Validation Schemas (`src/lib/schemas/`)

**Priority: P1**

### Test Scenarios

#### UT-SCHEMA-01: API Key Schema (`api-key.schema.ts`)

* **1.1:** Validates API key starting with "sk-or-"
* **1.2:** Rejects API key not starting with "sk-or-"
* **1.3:** Rejects empty API key
* **1.4:** Rejects API key longer than 500 characters
* **1.5:** Provides correct error messages

#### UT-SCHEMA-02: Auth Schema (`auth.schema.ts`)

* **2.1:** Login schema validates valid email and password
* **2.2:** Login schema rejects invalid email format
* **2.3:** Login schema rejects empty password
* **2.4:** Register schema validates valid email and password (min 8 chars)
* **2.5:** Register schema rejects password shorter than 8 characters
* **2.6:** Reset password schema validates valid email
* **2.7:** Update password schema validates password (min 8 chars) and token
* **2.8:** Update password schema rejects empty token
* **2.9:** All schemas provide correct error messages

#### UT-SCHEMA-03: Branch Schema (`branch.schema.ts`)

* **3.1:** Validates branch type "full"
* **3.2:** Validates branch type "summary"
* **3.3:** Rejects invalid branch type
* **3.4:** Message ID param schema validates UUID format
* **3.5:** Message ID param schema rejects non-UUID strings
* **3.6:** Provides correct error messages

#### UT-SCHEMA-04: Common Schema (`common.schema.ts`)

* **4.1:** UUID param schema validates valid UUID
* **4.2:** UUID param schema rejects invalid UUID format
* **4.3:** Pagination schema validates valid page and pageSize
* **4.4:** Pagination schema defaults page to 1 when not provided
* **4.5:** Pagination schema defaults pageSize to config default when not provided
* **4.6:** Pagination schema transforms string page to number
* **4.7:** Pagination schema transforms string pageSize to number
* **4.8:** Pagination schema rejects negative page numbers
* **4.9:** Pagination schema rejects pageSize exceeding maxPageSize
* **4.10:** Pagination schema rejects non-integer page/pageSize
* **4.11:** Provides correct error messages

#### UT-SCHEMA-05: Messages Schema (`messages.schema.ts`)

* **5.1:** Validates message content (min 1, max 10000 chars)
* **5.2:** Rejects empty message content
* **5.3:** Rejects message content longer than 10000 characters
* **5.4:** Validates model name (required, min 1 char)
* **5.5:** Rejects empty model name
* **5.6:** Provides correct error messages

#### UT-SCHEMA-06: OpenRouter Schema (`openrouter.schema.ts`)

* **6.1:** Chat message schema validates role enum (user, assistant, system)
* **6.2:** Chat message schema rejects invalid role
* **6.3:** Chat message schema validates non-empty content
* **6.4:** Model parameters schema validates temperature within range
* **6.5:** Model parameters schema validates maxTokens within range
* **6.6:** Model parameters schema validates topP within range
* **6.7:** Model parameters schema validates frequencyPenalty within range
* **6.8:** Model parameters schema validates presencePenalty within range
* **6.9:** Model parameters schema rejects values outside min/max range
* **6.10:** Chat completion params schema validates userId as UUID
* **6.11:** Chat completion params schema validates model name
* **6.12:** Chat completion params schema validates userMessages array (min 1)
* **6.13:** Chat completion params schema validates userMessages max length
* **6.14:** Chat completion params schema validates assistantMessages max length
* **6.15:** Chat completion params schema makes systemMessage optional
* **6.16:** Chat completion params schema makes assistantMessages optional
* **6.17:** Provides correct error messages

## 13. React Hooks (`src/components/hooks/`)

**Priority: P1**

### Test Scenarios

#### UT-HOOK-01: Use Token Counter (`useTokenCounter.ts`)

* **1.1:** Returns 0 when messages array is empty
* **1.2:** Returns 0 when no assistant messages exist
* **1.3:** Returns sum of prompt\_tokens and completion\_tokens from last assistant message
* **1.4:** Handles null token values (defaults to 0)
* **1.5:** Uses memoization correctly (only recalculates when messages change)
* **1.6:** Finds last assistant message correctly (reverse order)

#### UT-HOOK-02: Use API Key Manager (`useApiKeyManager.ts`)

* **2.1:** Initializes with "loading" keyStatus
* **2.2:** Checks key status on mount
* **2.3:** Sets keyStatus to "exists" when API key exists
* **2.4:** Sets keyStatus to "not\_exists" when API key does not exist
* **2.5:** Sets keyStatus to "error" when API call fails
* **2.6:** Save key sets formStatus to "saving" during operation
* **2.7:** Save key updates keyStatus to "exists" on success
* **2.8:** Save key syncs with global store (fetchApiKeyStatus, fetchModels)
* **2.9:** Save key shows success toast on success
* **2.10:** Save key sets apiError when API call fails
* **2.11:** Save key sets formStatus to "idle" after operation
* **2.12:** Delete key sets formStatus to "deleting" during operation
* **2.13:** Delete key updates keyStatus to "not\_exists" on success
* **2.14:** Delete key syncs with global store and clears models list
* **2.15:** Delete key shows success toast on success
* **2.16:** Delete key sets apiError when API call fails
* **2.17:** ClearApiError clears apiError state
* **2.18:** Handles network errors correctly

## 14. Zustand Store (`src/stores/useAppStore.ts`)

**Priority: P1**

### Test Scenarios

#### UT-STORE-01: Initialization

* **1.1:** Initializes with correct default state
* **1.2:** Sets isInitialized to false initially
* **1.3:** InitializeApp checks auth and fetches data when not initialized
* **1.4:** InitializeApp skips initialization if already initialized
* **1.5:** InitializeApp syncs from URL on each call
* **1.6:** InitializeApp only fetches app data when authenticated

#### UT-STORE-02: Authentication

* **2.1:** CheckAuth sets isCheckingAuth flag during operation
* **2.2:** CheckAuth sets user and isAuthenticated on success
* **2.3:** CheckAuth sets user to null and isAuthenticated to false on error
* **2.4:** Logout sets isLoggingOut flag during operation
* **2.5:** Logout clears auth state on success
* **2.6:** Logout navigates to landing page on success
* **2.7:** Logout shows success toast on success
* **2.8:** Logout shows error toast on failure
* **2.9:** Logout handles View Transitions API availability

#### UT-STORE-03: URL Synchronization

* **3.1:** SyncFromUrl extracts conversation ID from /app/conversations/:id
* **3.2:** SyncFromUrl sets activeConversationId to null for /app/conversations/new
* **3.3:** SyncFromUrl validates UUID format
* **3.4:** SyncFromUrl navigates to new conversation on invalid UUID
* **3.5:** SyncFromUrl does not update state if already correct (prevents re-renders)
* **3.6:** SyncFromUrl handles SSR (window undefined)

#### UT-STORE-04: API Key Status

* **4.1:** FetchApiKeyStatus sets isLoadingApiKey flag during operation
* **4.2:** FetchApiKeyStatus updates apiKeyExists on success
* **4.3:** FetchApiKeyStatus sets apiKeyExists to false on error (silent fail)

#### UT-STORE-05: Models

* **5.1:** FetchModels sets isLoadingModels flag during operation
* **5.2:** FetchModels updates modelsList on success
* **5.3:** FetchModels sets modelsList to empty array on error (silent fail)

#### UT-STORE-06: Conversations

* **6.1:** FetchConversations sets isLoadingConversations flag during operation
* **6.2:** FetchConversations updates conversationsList on success
* **6.3:** FetchConversations sets conversationsError on failure
* **6.4:** FetchConversations shows error toast on failure
* **6.5:** AddConversationToList adds conversation to beginning of list
* **6.6:** DeleteConversation sets isDeletingConversation flag during operation
* **6.7:** DeleteConversation removes conversation from list on success
* **6.8:** DeleteConversation navigates to new conversation if deleted was active
* **6.9:** DeleteConversation shows success toast on success
* **6.10:** DeleteConversation shows error toast on failure
* **6.11:** ConversationExists returns true when conversation in list
* **6.12:** ConversationExists returns false when conversation not in list

#### UT-STORE-07: Active Conversation

* **7.1:** SetActiveConversation updates activeConversationId
* **7.2:** SetActiveConversation navigates to correct URL
* **7.3:** SetActiveConversation uses View Transitions when available
* **7.4:** SetActiveConversation falls back to window.location when View Transitions unavailable
* **7.5:** SetActiveConversation does not navigate if already on target URL

#### UT-STORE-08: Branching

* **8.1:** CreateBranch sets isBranching flag during operation
* **8.2:** CreateBranch shows loading toast during operation
* **8.3:** CreateBranch adds new conversation to list on success
* **8.4:** CreateBranch navigates to new conversation on success
* **8.5:** CreateBranch shows success toast on success
* **8.6:** CreateBranch shows error toast on failure
* **8.7:** CreateBranch sets isBranching to false after operation

#### UT-STORE-09: Model Selection

* **9.1:** SetLastUsedModel updates lastUsedModel
* **9.2:** LastUsedModel is persisted to localStorage

#### UT-STORE-10: Persistence

* **10.1:** Only specified fields are persisted (conversationsList, modelsList, lastUsedModel)
* **10.2:** Auth state is not persisted
* **10.3:** UI flags are not persisted
* **10.4:** Active conversation ID is not persisted (comes from URL)

## Test Implementation Notes

### Mocking Strategy

1. **Supabase Client:** Mock all Supabase operations using `vi.fn()` and return appropriate mock responses
2. **OpenRouter SDK:** Mock OpenRouter client methods (models.list, chat.send)
3. **Environment Variables:** Use `vi.stubEnv()` to set/unset `ENCRYPTION_KEY` for crypto tests
4. **Fetch API:** Mock `fetch` calls for store and hook tests using `vi.spyOn(global, 'fetch')`
5. **Console Methods:** Mock console methods for logger tests
6. **Window/Document:** Mock window and document for store URL sync tests

### Test Data

* Create reusable test fixtures for:
  * Mock Supabase responses
  * Mock OpenRouter responses
  * Sample users, conversations, messages
  * Valid/invalid API keys
  * Valid/invalid UUIDs

### Coverage Goals

* **P0 (Critical):** 80%+ coverage
* **P1 (Important):** 70%+ coverage
* **P2 (Nice to have):** 60%+ coverage

Focus on testing:

* Error paths and edge cases
* Business logic correctness
* Data transformation and validation
* Security-critical operations (encryption, auth)
