# REST API Plan

This document outlines the REST API for the `switch-ai` application, based on the product requirements, database schema, and technical stack.

## 1. Resources

The API is designed around the following main resources:

* **API Key**: Represents the user's encrypted OpenRouter API key. It is treated as a singleton sub-resource of the user.
* **Conversations**: Represents a single chat conversation, containing metadata like title and relationships.
* **Messages**: Represents an individual message within a conversation. It's the core resource for chat interactions.

## 2. Endpoints

All endpoints are prefixed with `/api`.

***

### API Key

Manages the user's OpenRouter API key.

#### Upsert API Key

* **Method**: `PUT`
* **Path**: `/user/api-key`
* **Description**: Creates or updates the API key for the authenticated user. The key is encrypted server-side before storage.
* **Request Payload**:
  ```json
  {
    "apiKey": "sk-or-..."
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "API key saved successfully."
  }
  ```
* **Success Code**: `200 OK`
* **Error Codes**:
  * `400 Bad Request`: `apiKey` is missing or invalid.
  * `401 Unauthorized`: User is not authenticated.
  * `500 Internal Server Error`: Failed to encrypt or save the key.

#### Check API Key Existence

* **Method**: `GET`
* **Path**: `/user/api-key`
* **Description**: Checks if an API key exists for the authenticated user without exposing the key itself.
* **Response Payload**:
  ```json
  {
    "exists": true
  }
  ```
* **Success Code**: `200 OK`
* **Error Codes**: `401 Unauthorized`.

#### Delete API Key

* **Method**: `DELETE`
* **Path**: `/user/api-key`
* **Description**: Deletes the API key for the authenticated user.
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "API key deleted successfully."
  }
  ```
* **Success Code**: `200 OK`
* **Error Codes**: `401 Unauthorized`.

***

### Conversations

Manages user conversations.

#### Get All Conversations

* **Method**: `GET`
* **Path**: `/conversations`
* **Description**: Retrieves a paginated list of conversations for the authenticated user, sorted by creation date descending.
* **Query Parameters**:
  * `page` (integer, default: 1): The page number to retrieve.
  * `pageSize` (integer, default: 20): The number of conversations per page.
* **Response Payload**:
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
* **Success Code**: `200 OK`
* **Error Codes**: `401 Unauthorized`.

#### Create a New Conversation from First Message

* **Method**: `POST`
* **Path**: `/conversations`
* **Description**: Creates a new conversation from the user's first message. This endpoint creates the conversation, saves the user's message, calls the AI model, saves the assistant's response, and returns the new conversation along with both messages. It also automatically generates and sets the conversation title.
* **Request Payload**:
  ```json
  {
    "content": "What is the capital of France?",
    "model": "google/gemini-flash-1.5"
  }
  ```
* **Response Payload**:
  ```json
  {
      "conversation": {
          "id": "uuid",
          "title": "Capital of France",
          "parent_conversation_id": null,
          "created_at": "timestamp"
      },
      "messages": [
        {
          "id": "user-message-uuid",
          "role": "user",
          "content": "What is the capital of France?",
          "created_at": "timestamp"
        },
        {
          "id": "assistant-message-uuid",
          "role": "assistant",
          "content": "The capital of France is Paris.",
          "model_name": "google/gemini-flash-1.5",
          "prompt_tokens": 150,
          "completion_tokens": 8,
          "created_at": "timestamp"
        }
      ]
  }
  ```
* **Success Code**: `201 Created`
* **Error Codes**:
  * `400 Bad Request`: Invalid payload or missing user API key.
  * `401 Unauthorized`.
  * `402 Payment Required`: The user's OpenRouter key is invalid or has insufficient funds.
  * `502 Bad Gateway`: An error occurred while communicating with the OpenRouter API.

#### Get a Single Conversation

* **Method**: `GET`
* **Path**: `/conversations/{id}`
* **Description**: Retrieves a single conversation by its ID.
* **Response Payload**: A conversation object (same structure as in the list).
* **Success Code**: `200 OK`
* **Error Codes**:
  * `401 Unauthorized`.
  * `404 Not Found`: Conversation does not exist or user does not have access.

#### Delete a Conversation

* **Method**: `DELETE`
* **Path**: `/conversations/{id}`
* **Description**: Permanently deletes a conversation and all its associated messages.
* **Response Payload**: None.
* **Success Code**: `204 No Content`
* **Error Codes**:
  * `401 Unauthorized`.
  * `404 Not Found`.

***

### Messages

Manages messages within a conversation.

#### Get All Messages in a Conversation

* **Method**: `GET`
* **Path**: `/conversations/{id}/messages`
* **Description**: Retrieves a paginated list of messages for a given conversation, sorted by creation date ascending.
* **Query Parameters**:
  * `page` (integer, default: 1): The page number to retrieve.
  * `pageSize` (integer, default: 50): The number of messages per page.
* **Response Payload**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hello, world!",
        "model_name": null,
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
* **Success Code**: `200 OK`
* **Error Codes**:
  * `401 Unauthorized`.
  * `404 Not Found`: Conversation not found.

#### Send a Subsequent Message

* **Method**: `POST`
* **Path**: `/conversations/{id}/messages`
* **Description**: Sends a subsequent message from the user in an existing conversation. This endpoint acts as a proxy to the OpenRouter API. It saves the user's message, calls the AI model, saves the assistant's response, and returns both new messages.
* **Request Payload**:
  ```json
  {
    "content": "What is the capital of France?",
    "model": "google/gemini-flash-1.5"
  }
  ```
* **Response Payload**: An array containing the newly created user message and the assistant's response message.
  ```json
  [
    {
      "id": "user-message-uuid",
      "role": "user",
      "content": "What is the capital of France?",
      "created_at": "timestamp"
    },
    {
      "id": "assistant-message-uuid",
      "role": "assistant",
      "content": "The capital of France is Paris.",
      "model_name": "google/gemini-flash-1.5",
      "prompt_tokens": 150,
      "completion_tokens": 8,
      "created_at": "timestamp"
    }
  ]
  ```
* **Success Code**: `201 Created`
* **Error Codes**:
  * `400 Bad Request`: Invalid payload or missing user API key.
  * `401 Unauthorized`.
  * `402 Payment Required`: The user's OpenRouter key is invalid or has insufficient funds.
  * `404 Not Found`: Conversation not found.
  * `502 Bad Gateway`: An error occurred while communicating with the OpenRouter API.

***

### Branching

Manages conversation branching.

#### Create a Branch from a Message

* **Method**: `POST`
* **Path**: `/messages/{id}/branch`
* **Description**: Creates a new conversation (a "branch") from an existing message. The new conversation's history depends on the `type`.
* **Request Payload**:
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
* **Response Payload**: The newly created conversation object.
  ```json
  {
    "id": "new-conversation-uuid",
    "title": "[Parent Title] - branch 1",
    "parent_conversation_id": "parent-uuid",
    "created_at": "timestamp"
  }
  ```
* **Success Code**: `201 Created`
* **Error Codes**:
  * `400 Bad Request`: Invalid `type` in payload.
  * `401 Unauthorized`.
  * `404 Not Found`: The source message `{id}` does not exist.
  * `500 Internal Server Error`: Failed to generate summary or create the new conversation.

## 3. Authentication and Authorization

* **Authentication**: The API will be stateless and use JSON Web Tokens (JWTs) provided by Supabase Auth. The client must include the JWT in the `Authorization` header of every request as a Bearer token (`Authorization: Bearer <SUPABASE_JWT>`).
* **Authorization**: API endpoints will use middleware to verify the JWT. The `user_id` extracted from the token will be used in all database queries to enforce Row-Level Security (RLS) policies defined in the database schema. This ensures that users can only access and manipulate their own data.

## 4. Validation and Business Logic

* **Payload Validation**: All incoming request bodies and query parameters will be validated for correct data types, presence of required fields, and format.
  * `api_keys`: `apiKey` must be a non-empty string.
  * `messages`: `content` and `model` must be non-empty strings.
  * `branching`: `type` must be either `full` or `summary`.
* **Business Logic**:
  * **API Key Encryption**: The `PUT /user/api-key` endpoint will use a secure, server-side mechanism (e.g., `pgsodium` in Supabase) to encrypt the key before storing it.
  * **Automatic Naming**: When the first message is posted to a conversation via `POST /conversations/{id}/messages`, the API will trigger a call to an LLM to generate a 2-4 word title for the conversation and update the conversation record.
  * **Branch Naming**: The `POST /messages/{id}/branch` endpoint will fetch the parent conversation's title and `branch_count`, increment the count, and construct the new title in the format `[Parent Title] - branch X`.
  * **Summary Branching**: If `type` is `summary`, the branching endpoint will first fetch the conversation history up to the source message, send it to an LLM to generate a summary, and then create the new conversation with that summary as the initial system message.
  * **OpenRouter Proxying**: The `POST /conversations/{id}/messages` endpoint orchestrates fetching conversation history, calling the OpenRouter API with the correct payload and user key, and persisting the results. It will also handle mapping OpenRouter API errors to appropriate HTTP status codes.
