# API Resource Endpoints Implementation Plan: Messages

Manages messages within a conversation, including retrieval and creation through interaction with the OpenRouter AI service.

***

## Endpoint `/api/conversations/{id}/messages` - Get All Messages

### 1. Overview

This endpoint retrieves a paginated list of messages for a given conversation. The messages are sorted by their creation date in ascending order to display the conversation history correctly.

### 2. Request Details

* **HTTP Method**: `GET`
* **URL Structure**: `/api/conversations/[id]/messages`
* **Parameters**:
  * **Path (required)**: `id` (string, UUID) - The unique identifier for the conversation.
  * **Query (optional)**:
    * `page` (integer, default: 1) - The page number for pagination.
    * `pageSize` (integer, default: 50) - The number of messages per page.
* **Request Body**: None.

### 3. Used Types

* **Request**: `PaginationParams`
* **Response**: `PaginatedMessagesDto`

### 4. Response Details

* **Success (200 OK)**: Returns a `PaginatedMessagesDto` object containing an array of `MessageDto` objects and pagination metadata.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hello, world!",
        "model_name": null,
        "prompt_tokens": null,
        "completion_tokens": null,
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 1
    }
  }
  ```
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro route handler receives the GET request.
2. It authenticates the user using the Supabase client from `context.locals`.
3. It validates the conversation `id` (UUID) and pagination query parameters (`page`, `pageSize`) using a Zod schema.
4. It calls the `MessageService.getMessages()` method, passing the `userId`, `conversationId`, and pagination parameters.
5. The `MessageService` queries the `messages` table in the Supabase database, filtering by `conversation_id`. RLS policies ensure the user can only access messages from their own conversations.
6. The service formats the results into the `PaginatedMessagesDto` structure.
7. The Astro route handler returns the DTO with a `200 OK` status.

### 6. Security Considerations

* **Authorization**: Access is restricted by Supabase's RLS policies. The service layer must ensure that all queries are made on behalf of the authenticated `userId` to prevent unauthorized data access. The endpoint must first verify that the conversation belongs to the current user.

### 7. Error Handling

* **400 Bad Request**: If the `id` path parameter is not a valid UUID or if pagination parameters are invalid (e.g., not positive integers).
* **401 Unauthorized**: If the user is not authenticated.
* **404 Not Found**: If no conversation with the given `id` exists for the authenticated user.
* **500 Internal Server Error**: For any unexpected database errors during the query.

### 8. Performance Considerations

* The `(conversation_id, created_at)` index on the `messages` table is critical for efficient querying and sorting, especially for conversations with a large number of messages.

### 9. Implementation Steps

1. Create a new file `src/pages/api/conversations/[id]/messages.ts`.
2. Implement the `GET` handler in the new file.
3. Add Zod schemas to validate the `id` path parameter and the `page`/`pageSize` query parameters in `src/lib/schemas/messages.schema.ts`.
4. Create the `MessageService` in `src/lib/services/message.service.ts`.
5. Implement the `getMessages` method in `MessageService` to handle the database query, including pagination logic and a preliminary check for conversation ownership.
6. Connect the `GET` handler to the `MessageService`.

***

## Endpoint `/api/conversations/{id}/messages` - Send a Message

### 1. Overview

This endpoint creates a new user message, sends the conversation context to the OpenRouter API for a response, saves the AI's response as a new assistant message, and returns both new messages.

### 2. Request Details

* **HTTP Method**: `POST`
* **URL Structure**: `/api/conversations/[id]/messages`
* **Parameters**:
  * **Path (required)**: `id` (string, UUID) - The unique identifier for the conversation.
* **Request Body**: `SendMessageCommand`
  ```json
  {
    "content": "What is the capital of France?",
    "model": "google/gemini-flash-1.5"
  }
  ```

### 3. Used Types

* **Request**: `SendMessageCommand`
* **Response**: `MessageDto[]`

### 4. Response Details

* **Success (201 Created)**: Returns an array containing two `MessageDto` objects: the newly created user message and the assistant's response.
  ```json
  [
    { "id": "user-msg-uuid", "role": "user", "content": "...", "created_at": "..." },
    { "id": "asst-msg-uuid", "role": "assistant", "content": "...", "model_name": "...", "created_at": "..." }
  ]
  ```
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro `POST` handler receives the request.
2. It authenticates the user and validates the `id` (UUID) and the request body (`SendMessageCommand`) using Zod.
3. It calls the `MessageService.sendMessage()` method with `userId`, `conversationId`, and the command payload.
4. **`MessageService.sendMessage()`**:
   a. Verifies that the conversation belongs to the user.
   b. Calls `ApiKeyService.getDecryptedApiKey(userId)` to fetch and decrypt the user's OpenRouter API key. Fails if no key exists.
   c. Saves the new user message to the database.
   d. Fetches the existing messages in the conversation to provide context for the AI model.
   e. Calls `OpenRouterService.createChatCompletion()` with the decrypted key, model, and message history.
   f. `OpenRouterService` handles the API call to `https://openrouter.ai/api/v1/chat/completions`.
   g. `MessageService` receives the response from OpenRouter.
   h. If the API call was successful, it parses the response and saves the new assistant message to the database, including token usage stats.
   i. If the API call fails, it saves an assistant message containing the error information. The `role` will be `assistant`, but the `content` will describe the failure.
   j. The service returns the two newly created message DTOs (the user's original message and the assistant's success or error message).
5. The Astro handler returns the array of `MessageDto` with a `201 Created` status.

### 6. Security Considerations

* **API Key Handling**: The user's OpenRouter key is sensitive. It must be fetched, decrypted, used, and discarded entirely on the server-side. It must never be exposed to the client.
* **Authorization**: RLS policies and explicit ownership checks in the service layer are mandatory.
* **External Service Interaction**: All interactions with the OpenRouter API must be properly sanitized and error-handled to prevent injection attacks or service disruptions.

### 7. Error Handling

* **400 Bad Request**: If the request body is invalid or if the user does not have an API key configured.
* **401 Unauthorized**: If the user is not authenticated.
* **402 Payment Required**: If the OpenRouter API returns an error related to billing (e.g., insufficient funds, invalid key).
* **404 Not Found**: If the conversation does not exist for the authenticated user.
* **500 Internal Server Error**: For unexpected database errors or failures in the message-saving logic.
* **502 Bad Gateway**: If an error occurs while communicating with the OpenRouter API (e.g., timeout, 5xx error from their service).

### 8. Performance Considerations

* The latency of this endpoint is highly dependent on the response time of the external OpenRouter API.
* Consider using streaming responses in a future iteration to improve perceived performance for the end-user.

### 9. Implementation Steps

1. Implement the `POST` handler in `src/pages/api/conversations/[id]/messages.ts`.
2. Add a Zod schema for the `SendMessageCommand` request body to `src/lib/schemas/messages.schema.ts`.
3. Create `ApiKeyService` (`src/lib/services/api-key.service.ts`) to manage fetching and decrypting the API key. (Requires a robust encryption/decryption utility).
4. Create `OpenRouterService` (`src/lib/services/open-router.service.ts`) to encapsulate the fetch call to the OpenRouter API.
5. Implement the `sendMessage` method in `MessageService` to orchestrate the data flow.
6. Implement error mapping from the `OpenRouterService` to the appropriate HTTP status codes (e.g., 402, 502).
7. Connect the `POST` handler to the `MessageService`.
