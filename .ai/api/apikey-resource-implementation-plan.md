# API Resource Endpoints Implementation Plan: API Key

Manages the user's OpenRouter API key, which is used for making requests to AI models. The key is securely stored and encrypted to protect user data.

## Endpoint `/api/api-key` (PUT)

### 1. Overview

Creates a new API key or updates an existing one for the authenticated user. The provided key is encrypted server-side before being stored in the database. This endpoint performs an "upsert" operation.

### 2. Request Details

* **HTTP Method**: `PUT`
* **URL Structure**: `/api/api-key`
* **Parameters**: None
* **Request Body**:
  ```json
  {
    "apiKey": "sk-or-..."
  }
  ```

### 3. Used Types

* **Command Model**: `UpsertApiKeyCommand`
* **Response DTO**: `SuccessResponseDto`

### 4. Response Details

* **Success (200 OK)**:
  ```json
  {
    "success": true,
    "message": "API key saved successfully."
  }
  ```
* **Error**: See Error Handling section.

### 5. Data Flow

1. The Astro endpoint handler receives the `PUT` request.
2. The middleware verifies that the user is authenticated via their Supabase session.
3. The request body is parsed and validated against a Zod schema for the `UpsertApiKeyCommand`.
4. The handler calls the `ApiKeyService.upsertApiKey` method, passing the `userId` from the session and the `apiKey` from the request body.
5. The `ApiKeyService` encrypts the key using AES-256-GCM encryption (via `encrypt()` function) and performs an `upsert` operation on the `api_keys` table storing the encrypted key in the `encrypted_key` column.
6. A `SuccessResponseDto` is constructed and returned to the client with a `200 OK` status.

### 6. Security Considerations

* **Authentication**: Access is restricted to authenticated users. The user's identity is derived from the server-side session.
* **Authorization**: Supabase RLS policies ensure a user can only write to their own record in the `api_keys` table.
* **Input Validation**: A Zod schema validates the `apiKey` format, ensuring it is a non-empty string with the expected prefix (`sk-or-`).
* **Data Protection**: The API key is immediately encrypted using AES-256-GCM with a unique salt and IV per encryption, and is never stored in plaintext.

### 7. Error Handling

* **400 Bad Request**: Returned if the request body is missing the `apiKey` field or if it fails Zod validation (e.g., empty string, incorrect format). The response will follow the standard error schema (`ErrorResponseDto`).
* **401 Unauthorized**: Returned by the middleware if the user does not have a valid session.
* **500 Internal Server Error**: Returned if the database operation or the encryption function fails for any reason.

### 8. Performance Considerations

The performance impact is minimal. The endpoint performs a single, indexed `upsert` database operation. Encryption overhead is negligible.

### 9. Implementation Steps

1. Create a file `src/lib/schemas/api-key.schema.ts` and define a Zod schema for `UpsertApiKeyCommand`.
2. Create the service file `src/lib/services/api-key.service.ts`.
3. Implement the `upsertApiKey` method in `ApiKeyService`. This method will encrypt the key using the `encrypt()` function from `src/lib/crypto.ts` and store it in the database using Supabase `.upsert()`.
4. Create the Astro API route file at `src/pages/api/api-key.ts`.
5. Implement the `PUT` handler within this file. The handler will manage request validation and call the service.
6. Ensure `export const prerender = false;` is set in the route file to enable dynamic rendering.

***

## Endpoint `/api/api-key` (GET)

### 1. Overview

Checks if an API key exists for the authenticated user. This endpoint helps the UI determine whether to prompt the user to add a key, without ever exposing the key itself.

### 2. Request Details

* **HTTP Method**: `GET`
* **URL Structure**: `/api/api-key`
* **Parameters**: None
* **Request Body**: None

### 3. Used Types

* **Response DTO**: `ApiKeyExistsDto`

### 4. Response Details

* **Success (200 OK)**:
  ```json
  {
    "exists": true
  }
  ```
  or
  ```json
  {
    "exists": false
  }
  ```
* **Error**: See Error Handling section.

### 5. Data Flow

1. The Astro endpoint handler receives the `GET` request.
2. The middleware verifies that the user is authenticated.
3. The handler calls the `ApiKeyService.checkApiKeyExists` method, passing the `userId` from the session.
4. The service queries the `api_keys` table for a record matching the `userId`.
5. The service returns a boolean value indicating if a key was found.
6. The handler constructs the `ApiKeyExistsDto` and returns it to the client with a `200 OK` status.

### 6. Security Considerations

* **Authentication**: Restricted to authenticated users.
* **Data Exposure**: This endpoint is designed specifically to avoid data exposure. It only confirms the existence of a key, not its value.
* **Authorization**: RLS policies provide an additional layer of security, though the query is already scoped to the `userId`.

### 7. Error Handling

* **401 Unauthorized**: Returned by the middleware if the user does not have a valid session.
* **500 Internal Server Error**: Returned if the database query fails.

### 8. Performance Considerations

Excellent performance. The query will use the index on the `user_id` column for a fast lookup.

### 9. Implementation Steps

1. Implement the `checkApiKeyExists` method in `src/lib/services/apiKey.service.ts`.
2. Add a `GET` handler in the `src/pages/api/api-key.ts` file.
3. The handler will call the `checkApiKeyExists` service method and return the appropriate `ApiKeyExistsDto`.

***

## Endpoint `/api/api-key` (DELETE)

### 1. Overview

Deletes the API key for the authenticated user.

### 2. Request Details

* **HTTP Method**: `DELETE`
* **URL Structure**: `/api/api-key`
* **Parameters**: None
* **Request Body**: None

### 3. Used Types

* **Response DTO**: None

### 4. Response Details

* **Success (204 No Content)**: An empty response body.
* **Error**: See Error Handling section.

### 5. Data Flow

1. The Astro endpoint handler receives the `DELETE` request.
2. The middleware verifies that the user is authenticated.
3. The handler calls the `ApiKeyService.deleteApiKey` method, passing the `userId` from the session.
4. The service issues a `delete` command to the Supabase client, targeting the record in the `api_keys` table that matches the `userId`.
5. The endpoint returns a `204 No Content` status, regardless of whether a key was actually found and deleted.

### 6. Security Considerations

* **Authentication**: Restricted to authenticated users.
* **Authorization**: RLS policies prevent a user from deleting another user's key.

### 7. Error Handling

* **401 Unauthorized**: Returned by the middleware if the user does not have a valid session.
* **500 Internal Server Error**: Returned if the database `delete` operation fails.

### 8. Performance Considerations

High performance. The operation is a simple, indexed `delete`.

### 9. Implementation Steps

1. Implement the `deleteApiKey` method in `src/lib/services/apiKey.service.ts`.
2. Add a `DELETE` handler in the `src/pages/api/api-key.ts` file.
3. The handler will call the `deleteApiKey` service method and return a `204 No Content` response.

***

## Implementation Notes

### Encryption Approach

Instead of using a database RPC function, encryption is handled in the application layer using Node.js `crypto` module:

* **Algorithm**: AES-256-GCM (authenticated encryption)
* **Key Derivation**: scrypt with unique salt per encryption
* **Storage**: Base64-encoded string containing `[salt][iv][authTag][encryptedData]`
* **Environment Variable**: `ENCRYPTION_KEY` must be set
