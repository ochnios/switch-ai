# Implementation Plan for API Key Settings View

## 1. Overview

The purpose of this view is to enable the logged-in user to manage their own OpenRouter API key (BYOK model - Bring Your Own Key). This view will be rendered as a modal within the main application. It will provide functionality for adding (saving), deleting, and checking the status (whether the key exists) of the API key. For security reasons, the API key **will never** be fetched or displayed in the user interface after it has been saved.

## 2. View Routing

The view will be available as a modal component, triggered from the "Settings" button located at the top of the sidebar. The URL path `/app/settings` can be used for deep linking, which automatically opens the modal. The modal component will be rendered on top of the currently active view (e.g., the chat view).

## 3. Component Structure

Components will be based on the **Shadcn/ui** library and **React**.

```
 /app/settings (Astro page)
└── SettingsModal (React, client:visible)
    ├── Dialog (Shadcn)
    │   ├── DialogTrigger (button "Settings" in UI)
    │   ├── DialogContent
    │   │   ├── DialogHeader
    │   │   │   ├── DialogTitle ("API Key Management")
    │   │   │   └── DialogDescription ("Enter your OpenRouter key...")
    │   │   ├── ApiKeyStatusBadge (Badge component showing status)
    │   │   ├── ApiKeyForm (form with logic)
    │   │   │   ├── Input (type="password" for API key)
    │   │   │   ├── p (for client validation errors)
    │   │   │   ├── Button (type="submit", "Save")
    │   │   │   └── Button (variant="destructive", "Delete Key")
    │   │   ├── SecurityInfo (security explanation)
    │   │   ├── Alert (Shadcn, for displaying API errors)
    │   │   └── DialogFooter
    │   │       └── Button (variant="outline", "Close")
    │   ├── [Optionally] AlertDialog (Shadcn, for delete confirmation)
```

## 4. Component Details

### SettingsModal

* **Component Description**: Main container component. Will use `Dialog` from Shadcn/ui. Responsible for managing the overall state (open/close) and initiating the API key status fetch on open.
* **Main Elements**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`.
* **Supported Interactions**: Opening and closing the modal.
* **Supported Validation**: None.
* **Types**: `ApiKeyStatusViewModel`.
* **Props**: None (will likely be rendered by `Layout` or Astro page).

### ApiKeyStatusBadge

* **Component Description**: Small `Badge` component (Shadcn/ui) that visually informs the user about the current state of their API key.
* **Main Elements**: `Badge`.
* **Supported Interactions**: None (display only).
* **Supported Validation**: None.
* **Types**: `ApiKeyStatusViewModel`.
* **Props**:
  * `status: ApiKeyStatusViewModel` - current state to display.

### ApiKeyForm

* **Component Description**: The heart of the modal is a form (e.g., managed by `react-hook-form` and `zod`) for entering and saving the key. It also contains a button to delete the key.
* **Main Elements**: `<form>`, `Input`, `Button`.
* **Supported Interactions**:
  * `onChange` on `Input`: updates form state.
  * `onSubmit` on `<form>`: triggers validation and sends `PUT` request.
  * `onClick` on "Delete Key" button: triggers `DELETE` request.
* **Supported Validation**: Client-side validation (consistent with backend):
  * Key is required (cannot be empty).
  * Key must start with the prefix `sk-or-`.
* **Types**: `UpsertApiKeyCommand`, `ErrorResponseDto`.
* **Props**:
  * `currentStatus: ApiKeyStatusViewModel` - to decide logic (e.g., whether to show "Delete" button).
  * `onSave: (data: UpsertApiKeyCommand) => Promise<void>` - function to save.
  * `onDelete: () => Promise<void>` - function to delete.
  * `isSaving: boolean` - to show loading state on "Save" button.
  * `isDeleting: boolean` - to show loading state on "Delete" button.

### SecurityInfo

* **Component Description**: Static text component (e.g., `<p>`) with an `Info` icon. Explains to the user why their key is not visible and that it is securely encrypted on the server.
* **Main Elements**: `<p>`, icon (e.g., from `lucide-react`).
* **Supported Interactions**: None.
* **Supported Validation**: None.
* **Types**: None.
* **Props**: None.

## 5. Types

We will use existing DTO types, but add ViewModel types for UI state management.

* **DTO (from `src/types`)**:
  * `ApiKeyExistsDto`: `{ exists: boolean }`
  * `UpsertApiKeyCommand`: `{ apiKey: string }`
  * `SuccessResponseDto`: `{ success: boolean, message: string }`
  * `ErrorResponseDto`: `{ statusCode: number, message: string, errors?: ErrorFieldDto[] }`

* **New ViewModel Types (local to the component)**:
  * `type ApiKeyStatusViewModel = 'loading' | 'exists' | 'not_exists' | 'error';`
    * `loading`: Initial state while checking `GET /api/api-key`.
    * `exists`: `GET` returned `{ exists: true }`.
    * `not_exists`: `GET` returned `{ exists: false }`.
    * `error`: Error occurred while checking `GET`.
  * `type FormStatus = 'idle' | 'saving' | 'deleting';`
    * `idle`: Waiting for user action.
    * `saving`: `PUT` request in progress.
    * `deleting`: `DELETE` request in progress.

## 6. State Management

It is recommended to create a custom hook `useApiKeyManager` that encapsulates all the logic.

### `useApiKeyManager`

* **Purpose**: Encapsulation of logic for fetching status, saving key, deleting key, handling loading states and errors.
* **Managed State**:
  * `keyStatus (ApiKeyStatusViewModel)`: Key existence state (default `'loading'`).
  * `formStatus (FormStatus)`: Form operation state (default `'idle'`).
  * `apiError (ErrorResponseDto | null)`: Stores the last API error (default `null`).
* **Functions**:
  * `checkKeyStatus()`: Called on component mount (or modal open). Performs `GET /api/api-key` and sets `keyStatus` to `'exists'` or `'not_exists'`, or `'error'` on failure.
  * `saveKey(data: UpsertApiKeyCommand)`: Sets `formStatus` to `'saving'`. Performs `PUT /api/api-key`. On success, sets `keyStatus` to `'exists'`, `formStatus` to `'idle'`, and clears `apiError`. On error, sets `formStatus` to `'idle'` and populates `apiError`.
  * `deleteKey()`: Sets `formStatus` to `'deleting'`. Performs `DELETE /api/api-key`. On success, sets `keyStatus` to `'not_exists'`, `formStatus` to `'idle'`, and clears `apiError`. On error, sets `formStatus` to `'idle'` and populates `apiError`.
  * `clearApiError()`: Sets `apiError` to `null`.

## 7. API Integration

The component will communicate with three `/api/api-key` endpoints using `fetch` or a client (e.g., `ky`).

1. **Status Check (On App Load and Modal Open)**
   * **Method**: `GET`
   * **Endpoint**: `/api/api-key`
   * **Request**: No body.
   * **Response (Success 200)**: `ApiKeyExistsDto` (`{ exists: boolean }`)
   * **Action**: Updates `keyStatus` state in the hook. This check should happen during app initialization to determine if the chat panel should be locked, and again when the modal opens to display current status.

2. **Saving Key (On Form Submit)**
   * **Method**: `PUT`
   * **Endpoint**: `/api/api-key`
   * **Request**: `UpsertApiKeyCommand` (`{ apiKey: "sk-or-..." }`)
   * **Response (Success 200)**: `SuccessResponseDto` (`{ success: true, ... }`)
   * **Action**: Updates `keyStatus` to `'exists'`, resets the form (clears input field), shows success notification.

3. **Deleting Key (On Delete Click)**
   * **Method**: `DELETE`
   * **Endpoint**: `/api/api-key`
   * **Request**: No body.
   * **Response (Success 204)**: No body.
   * **Action**: Updates `keyStatus` to `'not_exists'`, shows success notification.

## 8. User Interactions

* **App loads** (initial check):
  1. During app initialization, `GET /api/api-key` is called.
  2. If `exists: false`, the chat panel is locked and onboarding is displayed.
  3. If `exists: true`, the app functions normally.
* **User opens modal**:
  1. Modal appears.
  2. `GET /api/api-key` request is called (to refresh status).
  3. Loading state is displayed (e.g., `Spinner`).
  4. After response, `ApiKeyStatusBadge` shows "Key saved" (green) or "No key" (yellow/red).
* **User enters key and clicks "Save"**:
  1. Client validation is triggered.
  2. If validation fails, error is displayed under the `Input` field, and "Save" button is inactive.
  3. If validation passes, "Save" button shows loading state (`Spinner`).
  4. `PUT` request is called.
  5. On success: `Input` field is cleared, `ApiKeyStatusBadge` updates to "Key saved", success message is displayed (e.g., Toast).
  6. On error: `Alert` displays error message from `ErrorResponseDto`.
* **User clicks "Delete Key"**:
  1. (Recommended) `AlertDialog` is displayed for confirmation.
  2. If user confirms, "Delete Key" button shows loading state.
  3. `DELETE` request is called.
  4. On success: `ApiKeyStatusBadge` updates to "No key", success message is displayed.
  5. On error: `Alert` displays error message.

## 9. Conditions and Validation

* **"Save" Button**: Should be `disabled` if:
  1. `Input` field is empty.
  2. Value in `Input` field does not start with `sk-or-`.
  3. Any API operation is in progress (`formStatus !== 'idle'` or `keyStatus === 'loading'`).
* **"Delete Key" Button**: Should be `disabled` if:
  1. `keyStatus` is `'not_exists'` or `'loading'`.
  2. Any API operation is in progress (`formStatus !== 'idle'`).
* **Input Field**:
  1. Must have `type="password"` attribute to mask the entered value (AC-03 from US-003).
  2. `onChange` or `onBlur` validation should show errors (required, `sk-or-` format) directly under the field.

## 10. Error Handling

* **GET Error (500)**: Display `Alert` with message "Failed to fetch API key status. Try refreshing." Set `keyStatus` to `'error'`, which should block the form.
* **PUT Error (400 Bad Request)**: Display `Alert` with error content from `ErrorResponseDto` (e.g., "Invalid API key format."). This error should be rare if client validation works correctly.
* **PUT / DELETE Error (500 Internal Server Error)**: Display `Alert` with message "Server error occurred. Try again later."
* **Network Error (Offline)**: `fetch` error should be caught and displayed in `Alert` as "No internet connection."

## 11. Implementation Steps

1. **Create Components (layout)**: Create files for `SettingsModal.tsx`, `ApiKeyForm.tsx`, and `ApiKeyStatusBadge.tsx`. Build static UI structure using Shadcn/ui components (`Dialog`, `Input`, `Button`, `Badge`, `Alert`).
2. **Implement `useApiKeyManager`**: Create hook `useApiKeyManager.ts`. Implement state logic (`keyStatus`, `formStatus`, `apiError`).
3. **Integrate GET**: In `useApiKeyManager`, implement `checkKeyStatus` function called in `useEffect` (on mount). Connect `keyStatus` state to `SettingsModal` to conditionally render `ApiKeyStatusBadge` and `Spinner`.
4. **Implement Form**: In `ApiKeyForm`, use `react-hook-form` with `zod` for validation (`z.string().startsWith("sk-or-", "Key must start with 'sk-or-'")`).
5. **Integrate PUT**: Connect form `onSubmit` to `saveKey` function from the hook. Ensure `Input` field is cleared on success (e.g., via `reset` from `react-hook-form`).
6. **Integrate DELETE**: Connect "Delete Key" button to `deleteKey` function from the hook. Add `AlertDialog` component (Shadcn/ui) as confirmation before calling `deleteKey`.
7. **Handle Loading States**: Use `formStatus` state to disable buttons and show `Loader2` component (from `lucide-react`) on buttons during API operations.
8. **Handle Errors**: Pass `apiError` state from the hook to `SettingsModal` and render `Alert` component (Shadcn/ui) if `apiError` is not `null`. Add "X" button to the alert to call `clearApiError`.
9. **Refine UX**: Add `SecurityInfo` component with explanation. Ensure all states (loading, success, error, no key, with key) are clear and understandable for the user.
10. **Testing**: Test all scenarios: loading, adding (success/error), deleting (success/error), client validation.
