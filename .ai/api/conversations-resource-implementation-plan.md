# API Resource Endpoints Implementation Plan: Conversations

Manages user conversations, including creation, retrieval, and deletion. This resource is central to the application's functionality, allowing users to interact with AI models.

## Endpoint `/api/conversations` (GET)

### 1. Overview

Retrieves a paginated list of conversations for the currently authenticated user. The conversations are sorted by creation date in descending order to show the most recent ones first.

### 2. Request Details

* **HTTP Method**: `GET`
* **URL Structure**: `/api/conversations`
* **Parameters**:
  * **Optional (Query)**:
    * `page` (integer, default: `1`): The page number for pagination.
    * `pageSize` (integer, default: `20`): The number of items per page.
* **Request Body**: None.

### 3. Used Types

* `PaginationParams`
* `PaginatedConversationsDto`
* `ConversationDto`
* `PaginationDto`

### 4. Response Details

* **Success (200 OK)**: Returns a `PaginatedConversationsDto` object.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "My First Conversation",
        "parent_conversation_id": null,
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
  }
  ```
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro endpoint receives the `GET` request.
2. User authentication is verified by the middleware, which also provides a user-specific Supabase client via `Astro.locals`.
3. The endpoint validates the optional `page` and `pageSize` query parameters using a Zod schema.
4. It calls the `getConversations` method in the `ConversationService`, passing the validated pagination parameters.
5. The service calculates the offset for the database query based on `page` and `pageSize`.
6. It performs two queries in parallel: one to fetch the total count of conversations for the user and another to fetch the paginated data.
7. RLS policies on the `conversations` table ensure only the user's own data is returned.
8. The service formats the results into a `PaginatedConversationsDto` object.
9. The endpoint returns the DTO with a `200 OK` status.

### 6. Security Considerations

* Authentication is mandatory. The middleware must reject any unauthenticated requests.
* Authorization is handled by Supabase RLS, ensuring strict data isolation between users.

### 7. Error Handling

* **400 Bad Request**: If `page` or `pageSize` are not valid positive integers.
* **401 Unauthorized**: If the user is not authenticated.
* **500 Internal Server Error**: If the database query fails for an unexpected reason.

### 8. Performance Considerations

* The query uses an index on `(user_id, created_at)` for efficient fetching and sorting of conversations.
* The total count is retrieved via a separate, optimized query to avoid performance issues with large datasets.

### 9. Implementation Steps

1. Create the Zod schema for pagination query parameters in `src/lib/schemas/conversation.schema.ts`.
2. Create the `ConversationService` class in `src/lib/services/conversation.service.ts` with a `getConversations` method.
3. Implement the Astro endpoint at `src/pages/api/conversations/index.ts` to handle the `GET` request.
4. In the endpoint, import and use the Zod schema for validation.
5. Instantiate `ConversationService` with `Astro.locals.supabase` and call the service method.
6. Return the response from the service.

***

## Endpoint `/api/conversations` (POST)

### 1. Overview

Creates a new conversation from a user's first message. This is a complex operation that involves creating the conversation record, storing the user's message, invoking an AI model via OpenRouter, storing the assistant's response, and generating a title for the conversation.

### 2. Request Details

* **HTTP Method**: `POST`
* **URL Structure**: `/api/conversations`
* **Parameters**: None.
* **Request Body**: A `CreateConversationFromMessageCommand` object.
  ```json
  {
    "content": "What is the capital of France?",
    "model": "google/gemini-flash-1.5"
  }
  ```

### 3. Used Types

* `CreateConversationFromMessageCommand`
* `ConversationWithMessagesDto`
* `ConversationDto`
* `MessageDto`

### 4. Response Details

* **Success (201 Created)**: Returns a `ConversationWithMessagesDto` object containing the new conversation and the initial two messages.
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro endpoint receives the `POST` request.
2. Middleware verifies authentication.
3. The endpoint validates the request body using a Zod schema for `CreateConversationFromMessageCommand`.
4. It calls the `createConversation` method in the `ConversationService`.
5. The service fetches the user's encrypted API key from the `api_keys` table. If not found, it throws an error.
6. The key is decrypted.
7. An `OpenRouterService` is used to send the user's message and model choice to the OpenRouter API, using the decrypted key.
8. The service generates a concise title for the conversation based on the user's prompt and the AI's response.
9. The service executes a database transaction to ensure all writes are atomic:
   a. A new record is inserted into the `conversations` table with the generated title.
   b. The user's message is inserted into the `messages` table, linked to the new conversation ID.
   c. The assistant's response is inserted into the `messages` table, also linked to the new conversation ID.
10. The service formats the newly created records into a `ConversationWithMessagesDto`.
11. The endpoint returns the DTO with a `201 Created` status.

### 6. Security Considerations

* **Authentication**: Mandatory.
* **API Key Security**: The user's OpenRouter API key must be securely decrypted on the server, used for the external API call, and never exposed in logs or client-side responses. The plaintext key should not be held in memory longer than necessary.
* **Data Integrity**: The use of a database transaction is critical to prevent partial data creation (e.g., a conversation record without any messages).

### 7. Error Handling

* **400 Bad Request**: If the request body is invalid or the user does not have an API key configured.
* **401 Unauthorized**: If the user is not authenticated.
* **402 Payment Required**: If the OpenRouter API rejects the key due to insufficient funds, rate limits, or invalidity.
* **500 Internal Server Error**: If the API key decryption fails, the database transaction fails, or an unknown server error occurs.
* **502 Bad Gateway**: If the OpenRouter API is unreachable or returns a server-side error.

### 8. Performance Considerations

* The primary bottleneck will be the response time of the external OpenRouter API.
* The database operations should be fast, especially when wrapped in a single transaction.

### 9. Implementation Steps

1. Add a Zod schema for `CreateConversationFromMessageCommand` to `src/lib/schemas/conversation.schema.ts`.
2. Create an `OpenRouterService` in `src/lib/services/openrouter.service.ts` to handle communication with the OpenRouter API.
3. Implement a helper function or service for secure API key decryption.
4. Implement a helper function to generate conversation titles.
5. Add the `createConversation` method to the `ConversationService`. This method will orchestrate the data flow described above.
6. Implement the `POST` handler in `src/pages/api/conversations/index.ts`.

***

## Endpoint `/api/conversations/{id}` (GET)

### 1. Overview

Retrieves a single conversation by its unique ID.

### 2. Request Details

* **HTTP Method**: `GET`
* **URL Structure**: `/api/conversations/{id}`
* **Parameters**:
  * **Required (Path)**: `id` (string, UUID) - The ID of the conversation to retrieve.
* **Request Body**: None.

### 3. Used Types

* `ConversationDto`

### 4. Response Details

* **Success (200 OK)**: Returns a `ConversationDto` object.
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro endpoint receives the `GET` request.
2. Middleware verifies authentication.
3. The endpoint validates that the `{id}` parameter is a valid UUID.
4. It calls the `getConversationById` method in `ConversationService`, passing the ID.
5. The service queries the `conversations` table for a record matching the provided ID.
6. Supabase RLS automatically filters the query, ensuring the user can only retrieve a conversation they own. If no record is found (either it doesn't exist or belongs to another user), the query returns no results.
7. If a conversation is found, the service maps it to a `ConversationDto`.
8. The endpoint returns the DTO with a `200 OK` status.

### 6. Security Considerations

* **Authentication**: Mandatory.
* **Authorization**: RLS is the key security measure, preventing users from accessing conversations that do not belong to them (IDOR protection).

### 7. Error Handling

* **400 Bad Request**: If the provided `id` is not a valid UUID.
* **401 Unauthorized**: If the user is not authenticated.
* **404 Not Found**: If no conversation with that ID exists for the authenticated user.
* **500 Internal Server Error**: For unexpected database errors.

### 8. Performance Considerations

* The query is a simple primary key lookup, which is highly efficient.

### 9. Implementation Steps

1. Create an Astro dynamic route file at `src/pages/api/conversations/[id].ts`.
2. Add the `getConversationById` method to the `ConversationService`.
3. Implement the `GET` handler in the new Astro route file.
4. In the handler, extract and validate the `id` parameter from `Astro.params`.
5. Instantiate and call the `ConversationService`.
6. Handle the case where the service returns `null` by sending a `404` response.

***

## Endpoint `/api/conversations/{id}` (DELETE)

### 1. Overview

Permanently deletes a conversation and all of its associated messages.

### 2. Request Details

* **HTTP Method**: `DELETE`
* **URL Structure**: `/api/conversations/{id}`
* **Parameters**:
  * **Required (Path)**: `id` (string, UUID) - The ID of the conversation to delete.
* **Request Body**: None.

### 3. Used Types

* None.

### 4. Response Details

* **Success (204 No Content)**: Returns an empty response.
* **Error**: Returns a standard error response object (`ErrorResponseDto`) as defined in the API Design Rules.

### 5. Data Flow

1. The Astro endpoint receives the `DELETE` request.
2. Middleware verifies authentication.
3. The endpoint validates that the `{id}` parameter is a valid UUID.
4. It calls the `deleteConversation` method in `ConversationService`.
5. The service issues a `delete` command to the `conversations` table for the matching ID.
6. RLS ensures the user can only delete a conversation they own. If the ID is valid but belongs to another user, the `delete` operation will affect zero rows.
7. The database's `ON DELETE CASCADE` constraint on the `messages` table's foreign key automatically deletes all messages associated with the conversation.
8. The service checks the result of the delete operation to see if a row was affected.
9. If a row was deleted, the endpoint returns a `204 No Content` status. If not, it returns a `404 Not Found`.

### 6. Security Considerations

* **Authentication**: Mandatory.
* **Authorization**: RLS prevents users from deleting conversations that do not belong to them.

### 7. Error Handling

* **400 Bad Request**: If the `id` is not a valid UUID.
* **401 Unauthorized**: If the user is not authenticated.
* **404 Not Found**: If no conversation with that ID exists for the user.
* **500 Internal Server Error**: For unexpected database errors.

### 8. Performance Considerations

* Deletion is a primary key operation and should be fast. The cascading delete on messages is also efficient due to indexing on `conversation_id`.

### 9. Implementation Steps

1. Add the `deleteConversation` method to `ConversationService`.
2. Implement the `DELETE` handler in the `src/pages/api/conversations/[id].ts` file.
3. In the handler, validate the `id` parameter.
4. Call the service method and check its return value to determine whether to send a `204` or `404` response.
