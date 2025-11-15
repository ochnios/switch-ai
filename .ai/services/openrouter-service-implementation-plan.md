## 1. Service Description

The `OpenRouterService` is responsible for communicating with the OpenRouter API, using the user's encrypted API key stored in Supabase. It is a central point of integration between the backend layer and LLM models provided by OpenRouter, offering two main use cases:

* fetching a list of available models for a given user,
* generating chat completions using the selected model and the provided conversation history.

The service should:

* use the existing API key handling layer (e.g., `ApiKeyService`),
* respect the configuration from `config.ts` (default models, parameters, etc.),
* apply good security practices (encryption, log anonymization, no logging of full prompts and responses),
* ensure consistent and predictable errors (custom error types / mapping OpenRouter errors to domain errors),
* be easy to use from Astro routes (Supabase with `locals`, Zod for I/O validation).

## 2. Constructor Description

The service constructor should accept a `SupabaseClient` instance (type from `src/db/supabase.client.ts`) and, based on it, create internal dependencies:

* initialization of `ApiKeyService` (responsible for reading and decrypting the user's OpenRouter key),
* initialization of `Logger` with the component name, e.g., `OpenRouterService`,
* eventual initial global configuration check (e.g., base URL to OpenRouter, default models).

Recommended constructor assumptions:

* it does not perform any external network calls,
* it does not throw errors related to the API key (key verification occurs when public methods are called),
* it can accept an optional service-specific configuration object (e.g., timeout, default model parameters), with default values based on `config.ts`.

## 3. Public Methods and Fields (Description)

### 3.1. `fetchModels(userId: string): Promise<ModelDto[]>`

* **Purpose**: return a list of models available via OpenRouter for a given user.
* **Input**:
  * `userId` – user identifier (e.g., `auth.user.id`), allowing to read their API key.
* **Action**:
  * fetch and decrypt the user's API key from Supabase using `ApiKeyService`,
  * if the key does not exist – throw a controlled domain error (e.g., "OpenRouter API key not configured"),
  * use the OpenRouter SDK client to fetch models (via `models.list()` method),
  * map the SDK response to an internal `ModelDto` type (at least `id` and `name`, optionally additional fields – e.g., category, max context, token price),
  * optional caching of results per user for a short period (e.g., in process memory or Supabase) to limit the number of queries.
* **Output**:
  * an array of `ModelDto` ready for use on the frontend (e.g., in a model selector).

### 3.2. `createChatCompletion(params): Promise<ChatCompletionResponse>`

It is recommended that the method accepts a parameters object (instead of multiple positional arguments), e.g.:

* `userId` – user identifier,
* `model` – OpenRouter model identifier,
* `systemMessage` – optional system message (if missing, fetched from `config.ts`),
* `userMessages` – list of user messages,
* `assistantMessages` – list of previous assistant responses (history),
* `modelParams` – model parameters (e.g., temperature, max\_tokens, top\_p, top\_k, presence\_penalty, etc.),
* additional metadata, if needed (e.g., conversation ID, operating mode – "draft", "final").

**Method operation**:

* fetch and decrypt the API key from `ApiKeyService` for the given `userId`,
* validate input parameters (e.g., Zod schema for `params`),
* build a list of messages in the format required by OpenRouter:
  * system message as the first message with `system` role (content from `params.systemMessage` or default from `config.ts`),
  * chat history (`assistantMessages` and `userMessages`) as subsequent messages with `assistant` / `user` roles,
  * the last user input as the final `user` message,
* apply model parameters (`modelParams`) when calling the SDK (temperature, max\_tokens, top\_p, etc.),
* use the OpenRouter SDK client to generate a response (via `chat.send()` method),
* map the SDK response to an internal `ChatCompletionResponse` type:
  * response content (`content`),
  * model identifier (`model`),
  * token usage statistics (`usage` – at least `prompt_tokens`, `completion_tokens`),
* log metadata (e.g., model, token count) without logging the full content of the prompt and response.

### 3.3. Eventual Public Fields

It is recommended that `OpenRouterService` does not expose mutable public fields. Read-only constants/properties are allowed, e.g.:

* service name (`serviceName`),
* integration version (`integrationVersion`),
* list of supported model parameters.

In practice, however, it is best to maintain the class API as a set of methods and treat fields as an implementation detail.

## 4. Private Methods and Fields (Description)

### 4.1. Private Fields

* **`apiKeyService`** – instance responsible for OpenRouter key operations (saving, reading, decrypting). Injected and initialized in the constructor; should not be accessible externally.
* **`logger`** – `Logger` instance with the component name (e.g., `OpenRouterService`), used to log events, warnings, and errors without exposing sensitive data.
* **`config`** – reference to global configuration (`config.ts`) or a separated part of AI configuration (e.g., default models, default system prompt, token limits, timeouts).
* **`client`** – OpenRouter SDK client instance, created per-request with the user's decrypted API key. Should not be stored as a persistent field; instead, instantiate it within methods when needed.

### 4.2. `getUserApiKey(userId: string)`

* responsible for fetching and decrypting the OpenRouter key assigned to the user,
* handles the "missing key" scenario and throws a clearly defined domain error (e.g., `MissingApiKeyError`),
* can also log (without sensitive data) attempts to use the service without a configured key.

### 4.3. `buildChatMessages(params)`

* accepts input data (system prompt, user, history),
* creates a unified array of messages with `system`, `user`, and `assistant` roles in the correct order,
* applies rules:
  * system prompt always at the beginning,
  * then alternating user and assistant messages reflecting the history,
  * finally the current user input as the last message with `user` role,
* can include additional constraints, e.g., shortening history to token limit by truncating oldest messages.

### 4.4. `mapOpenRouterError(error)`

* accepts an error originating from the OpenRouter SDK (e.g., `ChatError`, `OpenRouterDefaultError`),
* maps SDK error types to internal, clearly defined domain error types (e.g., `OpenRouterUnauthorizedError`, `OpenRouterRateLimitError`, `OpenRouterServerError`, `OpenRouterValidationError`),
* extracts error details from SDK error properties (status code, error message, error code),
* adds diagnostic information to logs (without key and full prompts),
* facilitates consistent error handling in the API layer (Astro routes).

### 4.5. `createOpenRouterClient(apiKey: string)`

* creates and returns an OpenRouter SDK client instance for a specific user:
  * instantiates the SDK client with the decrypted API key,
  * applies optional configuration (timeout, retry settings) if supported by the SDK,
  * ensures the client instance is created fresh for each request to avoid API key leakage between users,
  * does not store the client instance as a persistent field.

## 5. Error Handling

Error handling should be consistent throughout the service and focused on two main goals: security (no data leakage in logs) and usability (clear error messages at the API and UI level).

### 5.1. Error Scenarios

1. **OpenRouter API key not configured for user** – attempt to call `fetchModels` or `createChatCompletion` without a saved key.
2. **Invalid or expired OpenRouter key** – SDK throws authentication error (e.g., 401 or 403 status codes wrapped in `ChatError`).
3. **Input data validation error** – e.g., invalid model ID, missing required fields in messages (may be thrown by SDK or caught during input validation).
4. **Rate limiting error** – SDK throws rate limit error (e.g., 429 status code, represented as `TooManyRequestsResponseError`).
5. **Server error on OpenRouter side** – SDK throws server errors (5xx status codes, e.g., `InternalServerResponseError`, `ProviderOverloadedResponseError`).
6. **Network error** – timeout, no connection, DNS errors, etc. (thrown by underlying fetch/HTTP layer).
7. **Response parsing error** – SDK may throw errors if response format is unexpected or corrupted.
8. **Internal service error** – unforeseen exceptions in service logic (e.g., mapping error, unhandled case).

### 5.2. Error Handling Strategies

* each SDK error should be caught and mapped to a clearly defined domain error type (or at least a consistent code/type) used in the API layer,
* error messages returned to the client (Astro routes) should be:
  * understandable to the user (e.g., "Configure your OpenRouter key in settings", "Rate limit exceeded, try again shortly"),
  * devoid of technical details (e.g., full SDK error stack trace, internal error objects),
* server-side logs should contain:
  * user and conversation identifiers (if existing),
  * error code and type from SDK error,
  * HTTP status code (if available in SDK error properties),
  * relevant error message (without sensitive data),
  * timestamp and eventual request ID,
* in case of network errors or 5xx:
  * the SDK may provide built-in retry mechanisms (check SDK configuration options),
  * if not, consider implementing optional simple retry with backoff (for selected error types),
  * provide appropriate messages informing the user about temporary problems.

## 6. Security Considerations

Security is crucial as the service operates on:

* encrypted user OpenRouter keys,
* user conversation content (prompts, responses),
* potentially sensitive domain data.

Most important rules:

* **API Keys**:
  * store exclusively in encrypted form in Supabase (`ApiKeyService` handles this),
  * keep in memory only as long as necessary to fulfill the request,
  * never log full keys (at most, log that a key exists).
* **Prompts and Responses**:
  * do not log full content of prompts and responses, eventually shortened fragments or hashes,
  * avoid logging data structures that could contain sensitive data (e.g., full JSON schemas describing user data).
* **Configuration**:
  * store the OpenRouter base API endpoint, default models, and model parameters in `config.ts` or environment variables,
  * do not store the user's OpenRouter key in `config.ts` – always use Supabase.
* **Data Validation**:
  * every payload sent to OpenRouter should be validated (Zod) and sanitized,
* **Limits and Abuse Protection**:
  * introduce restrictions, e.g., max prompt length, max number of messages in history, max allowed value for model parameters (e.g., `max_tokens`),
  * consider simple per-user rate limiting on the application side, in addition to OpenRouter's limits.

## 7. Step-by-Step Implementation Plan

### 7.1. Configuration Preparation

1. In `config.ts`, extend the `ai` section with:
   * default model for generating titles / summaries (already exists – clarify its use),
   * default system message (e.g., "systemPrompt") describing the assistant's role and response style requirements,
   * OpenRouter base API URL and eventual other settings (timeout, max tokens, etc.),
   * model parameter constraints (e.g., temperature range, max tokens).

### 7.2. Type and DTO Organization

1. Ensure consistent types exist:
   * `ChatMessage` – internal message representation (roles: `user`, `assistant`, `system`),
   * `ChatCompletionResponse` – response from OpenRouter (content, model, usage),
   * `ModelDto` – model data returned to UI (id, name, optional metadata).
2. Add input types for `createChatCompletion`:
   * e.g., `ChatCompletionParams` (containing fields listed in section 3.2),
3. For input/output methods exposed on Astro endpoints, prepare Zod validation schemas (e.g., in `src/lib/schemas/messages.schema.ts`).

### 7.3. `fetchModels` Logic Implementation

1. In `OpenRouterService`, replace the current mock implementation with SDK-based logic:
   * use the private `getUserApiKey(userId)` method to fetch the key,
   * create an OpenRouter SDK client instance using `createOpenRouterClient(apiKey)`,
   * call `client.models.list()` to fetch available models,
   * add mapping of the SDK response to `ModelDto`.
2. Add error handling:
   * wrap SDK calls in try-catch blocks,
   * use `mapOpenRouterError()` to map SDK errors to domain errors,
   * throw an error if the key is missing, authorization problems, rate limits, etc.
3. (Optional) Add a simple caching mechanism for the model list:
   * e.g., process memory + timestamp,
   * cache key considering `userId` and eventual configuration.

### 7.4. `createChatCompletion` Logic Implementation

1. In `OpenRouterService`, replace the current mock implementation:
   * define `ChatCompletionParams` type and use it as an argument,
   * validate input in the API layer (Astro route) using Zod, and pass already validated data to the service.
2. Implement message building:
   * fetch the default system prompt from `config.ts` if not provided in parameters,
   * call the private `buildChatMessages` method to create a list of messages in the format expected by the SDK.
3. Set model parameters and response format:
   * merge default parameters from `config.ts` with parameters passed by the client (while respecting limits),
   * prepare SDK-compatible parameter object (temperature, maxTokens, topP, etc.).
4. Call OpenRouter SDK:
   * create SDK client instance using `createOpenRouterClient(apiKey)`,
   * call `client.chat.send()` with messages, model, and parameters,
   * wrap in try-catch to handle SDK errors.
5. Map the response:
   * transform the SDK response to `ChatCompletionResponse`,
   * extract content from `response.choices[0].message.content`,
   * include token statistics from `response.usage` if returned.
6. Add logging:
   * log metadata (model, token count, response time),
   * avoid logging prompt and response content.

### 7.5. Integration with Astro Routes

1. In API endpoints (e.g., `src/pages/api/models.ts`, `src/pages/api/messages.ts`):
   * fetch `supabase` from `locals` (according to backend rules),
   * create an `OpenRouterService` instance, passing `supabase`,
   * validate input/output using Zod,
   * map domain errors from the service to appropriate HTTP statuses and JSON messages.
2. Ensure consistent API response formats:
   * for the model list – `ModelDto` array,
   * for response generation – an object containing response content, model, usage, and eventual conversation metadata (e.g., message ID).

### 7.6. Message and Model Parameter Configuration

1. **System Message**:
   * in `config.ts`, add a field describing the default system prompt (e.g., describing the application, limitations, response style),
   * in `OpenRouterService`, treat this message as default if the caller does not provide their own system prompt,
   * allow overriding the system prompt for specific use cases (e.g., title generation, summaries).
2. **User Message**:
   * in the API layer (Astro routes), accept textual user messages,
   * in the service, include the last message as the final element of the `user` role message list,
   * maintain consistency of order (history + current message).
3. **Model Name**:
   * in `config.ts`, store the default conversational model and other specialized models (summary, title, etc.),
   * in the UI, allow the user to select from the list available from `fetchModels`,
   * in the service, always verify that the provided model is allowed (e.g., belongs to the list returned by `fetchModels` or to the whitelist configuration).
4. **Model Parameters**:
   * in `config.ts`, store default values and limits for model parameters (temperature, max tokens, top\_p, etc.),
   * in the API layer, allow passing overridden values, but validate them against limits,
   * in `OpenRouterService`, merge default parameters with call parameters and pass only those supported by OpenRouter.

### 7.7. SDK-Specific Considerations

**Package Installation**

Install the OpenRouter TypeScript SDK as a project dependency:

```bash
npm install @openrouter/sdk
```

**Import Statement**

Import the main SDK client class at the top of the service file:

```typescript
import { OpenRouter } from "@openrouter/sdk";
```

For error handling, also import relevant error types:

```typescript
import type { ChatError, OpenRouterDefaultError } from "@openrouter/sdk/models";
```

**Client Instantiation**

The SDK client must be instantiated per-request with the user's decrypted API key. Do NOT store client instances as persistent class fields to prevent API key leakage between users:

```typescript
private createOpenRouterClient(apiKey: string): OpenRouter {
  return new OpenRouter({
    apiKey: apiKey
  });
}
```

When calling this method, pass the decrypted key obtained from `ApiKeyService`:

```typescript
const apiKey = await this.getUserApiKey(userId);
const client = this.createOpenRouterClient(apiKey);
```

**Chat Completion Call**

Use the `chat.send()` method to generate completions. The SDK accepts parameters aligned with OpenRouter API specifications:

```typescript
const response = await client.chat.send({
  model: "openai/gpt-4",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" }
  ],
  temperature: 0.7,
  maxTokens: 150,
  stream: false
});
```

Key parameters to consider:

* `model` (string, required) – OpenRouter model identifier
* `messages` (array, required) – conversation history with roles: `system`, `user`, `assistant`
* `temperature` (number, optional) – controls randomness (0.0 - 2.0)
* `maxTokens` (number, optional) – maximum completion length
* `topP` (number, optional) – nucleus sampling parameter
* `frequencyPenalty` (number, optional) – penalizes repeated tokens
* `presencePenalty` (number, optional) – encourages topic diversity
* `stream` (boolean, optional) – enables streaming responses (set to `false` for now)

Access response content via:

* `response.choices[0].message.content` – the generated text
* `response.usage` – token usage statistics (prompt\_tokens, completion\_tokens, total\_tokens)
* `response.model` – the model used for generation

**Model Listing**

Use the `models.list()` method to fetch available models:

```typescript
const modelsResponse = await client.models.list();
```

The response contains a `data` array with model objects. Each model includes:

* `id` (string) – unique model identifier
* `name` (string) – human-readable model name
* Additional metadata (context length, pricing, etc.) if provided by OpenRouter

Map this response to your internal `ModelDto` type.

**Error Handling**

The SDK throws typed errors that should be caught and mapped to domain errors:

1. **ChatError** – thrown for chat completion errors (400, 401, 429, 500 status codes)
   * Contains `code` and `message` properties
   * Use `error.code` to determine the specific error type

2. **OpenRouterDefaultError** – generic error for 4XX and 5XX responses
   * Use this as a fallback when more specific errors aren't available

3. **BadRequestResponseError** (status 400) – invalid request parameters
   * Check for malformed messages, unsupported model, or invalid parameters

4. **TooManyRequestsResponseError** (status 429) – rate limit exceeded
   * Implement appropriate user-facing messaging and optional retry logic

5. **InternalServerResponseError** (status 500) – OpenRouter server errors
   * Log for monitoring and inform user of temporary issues

6. **ProviderOverloadedResponseError** (status 529) – upstream provider overloaded
   * Suggest the user try again or switch models

Wrap SDK calls in try-catch blocks:

```typescript
try {
  const response = await client.chat.send({ ... });
  return this.mapToInternalResponse(response);
} catch (error) {
  throw this.mapOpenRouterError(error);
}
```

In `mapOpenRouterError()`, inspect the error type and properties to create appropriate domain errors with user-friendly messages.

**Limitations and Considerations**

1. **No Built-in Caching** – the SDK does not provide response caching; implement this at the service layer if needed.

2. **Streaming Support** – the SDK supports streaming via `stream: true` option. For initial implementation, use `stream: false` for simplicity. Add streaming support later if needed by handling async iterators returned when streaming is enabled.

3. **Per-Request Client Creation** – always create a new client instance per request. The SDK is lightweight and does not maintain persistent connections, so this approach is safe and prevents API key cross-contamination.

4. **Timeout Configuration** – check SDK documentation for timeout configuration options. If not supported, wrap SDK calls with a manual timeout using `Promise.race()` and `AbortController`.

5. **Retry Logic** – verify if the SDK provides built-in retry mechanisms. If not, implement custom retry logic with exponential backoff for transient errors (network issues, 5xx errors, rate limits with retry-after headers).

6. **TypeScript Types** – leverage the SDK's TypeScript types for request/response objects to ensure type safety. Import types from `@openrouter/sdk/models` as needed.

7. **API Key Security** – never log the API key. The SDK handles authorization headers internally; ensure you only pass keys to the SDK constructor and not to logs or error messages.
