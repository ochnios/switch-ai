# API Resource Endpoints Implementation Plan: Models

Provides access to the list of available AI models from OpenRouter. This endpoint acts as a proxy to the OpenRouter models API, using the authenticated user's API key.

## Endpoint `/api/models` (GET)

### 1. Overview

Retrieves the list of available AI models from the OpenRouter API. This endpoint requires the user to have a valid OpenRouter API key configured. The endpoint acts as a proxy, fetching the models list from OpenRouter using the user's stored (and encrypted) API key.

### 2. Request Details

* **HTTP Method**: `GET`
* **URL Structure**: `/api/models`
* **Parameters**: None
* **Request Body**: None

### 3. Used Types

* **Response DTO**: `ModelsListDto`

### 4. Response Details

* **Success (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "google/gemini-flash-1.5",
        "name": "Gemini Flash 1.5"
      }
    ]
  }
  ```
* **Error**: See Error Handling section.

### 5. Data Flow

1. The Astro endpoint handler receives the `GET` request.
2. The middleware verifies that the user is authenticated via their Supabase session.
3. The handler calls the `ApiKeyService.getDecryptedApiKey` method, passing the `userId` from the session.
4. If no API key exists for the user, the handler returns a `400 Bad Request` error.
5. The handler calls the `ModelsService.fetchModels` method, passing the decrypted API key.
6. The `ModelsService` makes a `GET` request to the OpenRouter API endpoint (`https://openrouter.ai/api/v1/models`) with the user's API key in the `Authorization` header.
7. The OpenRouter response is transformed to extract only `id` and `name` fields from each model.
8. The models list is returned to the client with a `200 OK` status.

### 6. Security Considerations

* **Authentication**: Access is restricted to authenticated users. The user's identity is derived from the server-side session.
* **Authorization**: Only the user's own API key is used. Supabase RLS policies ensure a user can only access their own key record.
* **API Key Exposure**: The decrypted API key is only used server-side to make the request to OpenRouter and is never exposed to the client.

### 7. Error Handling

* **400 Bad Request**: Returned if the user does not have an API key configured. The response will follow the standard error schema (`ErrorResponseDto`).
* **401 Unauthorized**: Returned by the middleware if the user does not have a valid session.
* **402 Payment Required**: Returned if the OpenRouter API responds with a 402 status, indicating the user's key is invalid or has insufficient funds.
* **500 Internal Server Error**: Returned if the database operation or decryption fails.
* **502 Bad Gateway**: Returned if the OpenRouter API is unreachable or returns an unexpected error.

### 8. Performance Considerations

The performance impact is minimal. The endpoint makes a single HTTP request to the OpenRouter API and transforms the response to return only necessary fields.

### 9. Implementation Steps

1. Add `ModelDto` and `ModelsListDto` types to `src/types.ts`.
2. Extend `ApiKeyService` with a `getDecryptedApiKey(userId: string)` method in `src/lib/services/api-key.service.ts`.
3. Create the service file `src/lib/services/models.service.ts`.
4. Implement the `fetchModels(apiKey: string)` method in `ModelsService`. This method will call the OpenRouter API and transform the response to include only `id` and `name` fields.
5. Create the Astro API route file at `src/pages/api/models.ts`.
6. Implement the `GET` handler within this file. The handler will check for API key existence, call the service, and handle errors.
7. Ensure `export const prerender = false;` is set in the route file to enable dynamic rendering.

***

## Implementation Notes

### OpenRouter Models API

* **Endpoint**: `https://openrouter.ai/api/v1/models`
* **Method**: `GET`
* **Headers**:
  * `Authorization: Bearer <USER_API_KEY>`
  * `HTTP-Referer: <YOUR_SITE_URL>` (optional)
  * `X-Title: <YOUR_APP_NAME>` (optional)

### Type Definitions

Add to `src/types.ts`:

```typescript
export interface ModelDto {
  id: string;
  name: string;
}

export interface ModelsListDto {
  data: ModelDto[];
}
```
