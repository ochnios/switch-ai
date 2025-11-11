# API Resource Endpoints Implementation Plan: Branching

Manages the creation of new conversations by branching from existing messages.

***

## Endpoint `/api/conversations/[id]/messages/{id}/branch` - Create a Branch from a Message

### 1. Overview

This endpoint creates a new conversation (a "branch") based on the history of an existing message. It supports two modes: "full", which copies the entire history up to the source message, and "summary", which uses an AI model to generate a summary of the history as the first message of the new branch.

### 2. Request Details

* **HTTP Method**: `POST`
* **URL Structure**: `/api/conversations/[id]/messages/[id]/branch`
* **Parameters**:
  * **Path (required)**: `id` (string, UUID) - The unique identifier for the message to branch from.
* **Request Body**: `CreateBranchCommand`
  ```json
  {
    "type": "full"
  }
  ```
  or
  ```json
  {
    "type": "summary"
  }
  ```

### 3. Used Types

* **Request**: `CreateBranchCommand`
* **Response**: `ConversationDto`

### 4. Response Details

* **Success (201 Created)**: Returns the newly created `ConversationDto` object.
  ```json
  {
    "id": "new-conversation-uuid",
    "title": "[Parent Title] - branch 1",
    "parent_conversation_id": "parent-uuid",
    "created_at": "timestamp"
  }
  ```
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro `POST` handler receives the request at `/api/conversations/[id]/messages/[id]/branch`.
2. It authenticates the user using the Supabase client from `context.locals`.
3. It validates the `id` path parameter (must be a UUID) and the request body (must conform to `CreateBranchCommand`) using a Zod schema.
4. It calls the `ConversationService.createBranchFromMessage()` method, passing the `userId`, source message `id`, and branch `type`.
5. **`ConversationService.createBranchFromMessage()`**:
   a. **Verification**: Fetches the source message and its parent conversation to verify that they exist and belong to the authenticated user.
   b. **Transaction Start**: Initiates a database transaction to ensure atomicity.
   c. **Parent Update**: Fetches the parent conversation's title and `branch_count`, then increments the `branch_count` in the database.
   d. **New Conversation**: Creates a new conversation record, setting `parent_conversation_id` and constructing the title (e.g., `[Parent Title] - branch X`).
   e. **History Processing (Conditional)**:
   i. **If `type` is `full`**: Fetches all messages from the parent conversation up to and including the source message and inserts copies of them linked to the new conversation's ID.
   ii. **If `type` is `summary`**:
   \- Fetches the conversation history.
   \- Calls `ApiKeyService.getDecryptedApiKey()` to get the user's key.
   \- Calls `OpenRouterService.createChatCompletion()` with the history to generate a summary.
   \- Creates a single new `system` message in the new conversation containing the generated summary.
   f. **Transaction Commit**: Commits the transaction.
   g. The service returns the DTO for the newly created conversation.
6. The Astro handler returns the `ConversationDto` with a `201 Created` status.

### 6. Security Considerations

* **Authorization**: The service layer must perform a strict ownership check to ensure the user can only branch from their own messages and conversations. This is the primary defense against unauthorized access.
* **Data Integrity**: The entire branching operation, which involves multiple database writes (updating the parent, creating a new conversation, copying messages), must be wrapped in a database transaction. If any step fails, the entire operation should be rolled back to prevent inconsistent data.
* **API Key Security**: For summary generation, the user's OpenRouter API key must be handled securely on the server-side and never exposed to the client.

### 7. Error Handling

* **400 Bad Request**: If the `id` is not a valid UUID or the request body's `type` is invalid.
* **401 Unauthorized**: If the user is not authenticated.
* **404 Not Found**: If the source message with the given `id` does not exist or does not belong to the user.
* **500 Internal Server Error**: If the database transaction fails for any reason (e.g., constraint violation, connection error).
* **502 Bad Gateway**: If the external call to the OpenRouter API fails during summary generation.

### 8. Performance Considerations

* **Full Branch**: For conversations with a very long history, copying messages can be a moderately intensive database operation. The query to fetch messages should be optimized.
* **Summary Branch**: The performance is largely dependent on the latency of the external OpenRouter API. This operation will be noticeably slower than a "full" branch.

### 9. Implementation Steps

1. Create a new file for the API route: `src/pages/api/conversations/[id]/messages/[id]/branch.ts`.
2. Implement the `POST` handler within this file.
3. Add Zod schemas for validating the path parameter (`id`) and the request body (`CreateBranchCommand`) in `src/lib/schemas/branch.schema.ts`.
4. Create a new service file: `src/lib/services/conversation.service.ts`.
5. Implement the `createBranchFromMessage` method in `ConversationService` to contain all the business logic described in the Data Flow section. This method will utilize a Supabase edge function or RPC call to handle the database transaction.
6. The `ConversationService` will depend on `ApiKeyService` and `OpenRouterService` for the summary generation logic.
7. Connect the Astro `POST` handler to the `ConversationService`.
8. Implement comprehensive error handling to map service-layer exceptions to the appropriate HTTP status codes.
