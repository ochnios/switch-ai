# Implementation Plan for Sidebar View — Conversation List

## 1. Overview

The `Sidebar - Conversation List` view (Sidebar Panel - Conversation List) is a key navigation component in the `switch-ai` application. Its main purpose is to enable the user to browse, switch, create new, and delete existing conversations. It is a fixed element of the main application layout that shares state with the chat panel.

## 2. View Routing

This component is not a standalone page but part of the main layout (`/app`). It will be rendered as a React component inside the Astro layout file, e.g., `src/layouts/AppLayout.astro`.

## 3. Component Structure

Components will be built in React (`.tsx`) and utilize `shadcn/ui` components and `tailwind` for styling.

```tsx
<ConversationSidebar>
    <SettingsButton />
    <NewConversationButton />
    <ConversationList>
        <ConversationListItem />
        <ConversationListItem />
    </ConversationList>
</ConversationSidebar>
```

***

## 4. Component Details

### `ConversationSidebar` (Container Component)

* **Component Description:** Main sidebar panel container. Responsible for fetching data, managing loading/error states, and interacting with global state (`activeConversationId`). Contains the settings button at the top.
* **Main Elements:**
  * `<aside>` or `<nav>` (for semantics and landmark roles).
  * `SettingsButton` component (triggers API key settings modal).
  * `NewConversationButton` component.
  * `ConversationList` component.
* **Supported Interactions:** Calls Zustand actions to fetch and manage conversations.
* **Supported Validation:** None.
* **Types:** `ConversationDto`.
* **Props:** None.

### `SettingsButton`

* **Component Description:** Button at the very top of the sidebar that opens the API key settings modal.
* **Main Elements:**
  * `<Button>` component from `shadcn/ui` (likely with a gear/settings icon).
* **Supported Interactions:**
  * `onClick`: Opens the settings modal or navigates to `/app/settings`.
* **Supported Validation:** None.
* **Types:** None.
* **Props:** None.

### `NewConversationButton`

* **Component Description:** "New Conversation" button below the settings button in the sidebar panel.
* **Main Elements:**
  * `<Button>` component from `shadcn/ui`.
* **Supported Interactions:**
  * `onClick`: Calls Zustand `setActiveConversation(null)` action and navigates to `/app/conversations/new`.
* **Supported Validation:** Button is disabled if `activeConversationId` is already `null`.
* **Types:** None.
* **Props:** None (retrieves `activeConversationId` from Zustand store).

### `ConversationList`

* **Component Description:** Renders the conversation list or loading/empty states.
* **Main Elements:**
  * `<ul>` or `<div>` with `role` `list`.
  * `<Skeleton>` components from `shadcn/ui` (during loading).
  * Error or empty state message.
  * List of `ConversationListItem` components (data mapping).
* **Supported Interactions:** None. Passes `onSelect` and `onDelete` handlers down.
* **Supported Validation:** None.
* **Types:** `ConversationDto`.
* **Props:**
  * `conversations: ConversationDto[]`
  * `activeConversationId: string | null`
  * `onSelect: (id: string) => void`
  * `onDelete: (id: string) => void`
  * `isLoading: boolean`
  * `isError: boolean`

### `ConversationListItem`

* **Component Description:** Single item on the conversation list. Manages its own two-stage delete confirmation state.
* **Main Elements:**
  * `<Button variant="ghost">` (as the main clickable element for selection).
  * `<div>` containing title (`conversation.title`) and formatted date (`conversation.created_at`).
  * `<Button variant="ghost" size="icon">` (delete/confirm button).
* **Supported Interactions:**
  * `onClick` (on main element): Calls `onSelect(conversation.id)` and resets delete confirmation state.
  * `onClick` (on delete button):
    * If `!isConfirmingDelete`: Stops event propagation, sets state `isConfirmingDelete(true)`.
    * If `isConfirmingDelete`: Stops event propagation, calls `onDelete(conversation.id)`.
  * `onBlur` (on delete button): Sets `isConfirmingDelete(false)` to cancel the action.
* **Supported Validation:** None.
* **Types:** `ConversationDto`.
* **Props:**
  * `conversation: ConversationDto`
  * `isActive: boolean`
  * `onSelect: (id: string) => void`
  * `onDelete: (id: string) => void`

***

## 5. Types

We will mainly use DTOs defined in `type_definitions` and introduce one type for global state.

* **`ConversationDto`** (from `type_definitions`)
  ```typescript
  type ConversationDto = {
    id: string;
    title: string;
    parent_conversation_id: string | null;
    created_at: string; // ISO string
  };
  ```
* **`PaginatedConversationsDto`** (from `type_definitions`)
  ```typescript
  interface PaginatedConversationsDto {
    data: ConversationDto[];
    pagination: PaginationDto;
  }
  ```

**Note:** The global Zustand state structure is defined in the Chat Implementation Plan and includes `activeConversationId`, `conversationsList`, and related actions. This view uses the same unified Zustand store.

***

## 6. State Management

State will be managed using **Zustand** as the single source of truth. This view uses the unified global store defined in `src/stores/useAppStore.ts`.

### Global State (Zustand - `useAppStore`)

The sidebar uses the following state and actions from the unified store:

* **State Properties:**
  * `activeConversationId: string | null` - Currently selected conversation ID, or `null` for new chat
  * `conversationsList: ConversationDto[]` - List of user's conversations (first 50, sorted newest first)
  * `uiFlags.isLoadingConversations: boolean` - Loading state for conversations list

* **Actions:**
  * `fetchConversations()` - Calls `GET /api/conversations?page=1&pageSize=50` and updates `conversationsList`. Sets loading flags appropriately.
  * `setActiveConversation(id: string | null)` - Sets active conversation and handles navigation to `/app/conversations/[id]` or `/app/conversations/new`
  * `deleteConversation(id: string)` - Implementation:
    1. Sets appropriate loading flag
    2. Calls `DELETE /api/conversations/{id}`
    3. On success:
       * Removes conversation from `conversationsList`
       * If deleted ID was active (`id === activeConversationId`), calls `setActiveConversation(null)` and navigates to `/app/conversations/new`
       * Shows NonBlockingAlert toast: "Conversation deleted"
    4. On error:
       * Shows NonBlockingAlert toast: "Failed to delete conversation"
       * Keeps the conversation in the list
    5. In `finally`: Clears loading flag

***

## 7. API Integration

All API calls are handled by Zustand store actions using `fetch`.

1. **Fetching Conversation List**

   * **Endpoint:** `GET /api/conversations`
   * **Usage:** Called on mount of `ConversationSidebar` component via Zustand `fetchConversations()` action.
   * **Query Parameters:** `page=1`, `pageSize=50`
   * **Response Type (Success):** `PaginatedConversationsDto`
   * **Response Type (Error):** `ErrorResponseDto`
   * **Handling:** Via Zustand `fetchConversations()` action.

2. **Deleting Conversation**

   * **Endpoint:** `DELETE /api/conversations/{id}`
   * **Usage:** Called by Zustand `deleteConversation(id)` action after the second click (confirmation) on the delete button in `ConversationListItem`.
   * **Path Parameter:** `id` (from `ConversationDto.id`)
   * **Response Type (Success):** `204 No Content`
   * **Response Type (Error):** `ErrorResponseDto`
   * **Handling:** Via Zustand `deleteConversation()` action.

**Note:** `POST /api/conversations` is not called by this view. Clicking "New Conversation" navigates to `/app/conversations/new` and sets `activeConversationId = null`. The chat panel will be responsible for performing `POST /api/conversations` when the user sends the first message.

***

## 8. User Interactions

* **Loading the View:** User sees skeletons (`Skeleton`) in place of the list while `uiFlags.isLoadingConversations` is `true`.
* **Browsing the List:** User sees the list of conversations from `conversationsList` (sorted newest first). The currently selected conversation (matching `activeConversationId`) is highlighted (`aria-selected="true"`).
* **Opening Settings (API Key Management):**
  1. User clicks the `SettingsButton` at the top of the sidebar.
  2. Settings modal opens (or navigates to `/app/settings`).
* **Starting a New Conversation (US-007):**
  1. User clicks the "New Conversation" button.
  2. Zustand `setActiveConversation(null)` action is called.
  3. Navigation to `/app/conversations/new` occurs.
  4. "New Conversation" button becomes inactive (`disabled`).
  5. Active highlighting disappears from all list items.
  6. Chat panel renders empty state, ready for a new message.
* **Switching Conversations (US-008):**
  1. User clicks on a `ConversationListItem`.
  2. Zustand `setActiveConversation(id)` action is called.
  3. Navigation to `/app/conversations/[id]` occurs.
  4. The clicked item is highlighted as active.
  5. Chat panel fetches and displays messages for that conversation.
* **Deleting Conversation (US-009, two-step confirmation):**
  1. User clicks the `Trash2` icon on a list item.
  2. `onClick` event is stopped (`stopPropagation`). Local component state `isConfirmingDelete` in `ConversationListItem` is set to `true`.
  3. Icon changes to `Check` (confirmation), and the button changes color to red/destructive.
  4. **Scenario A (Confirmation):** User clicks the `Check` icon.
     * Zustand `deleteConversation(id)` action is called.
     * NonBlockingAlert toast shows "Deleting..."
     * On success: conversation disappears from list, toast shows "Conversation deleted". If it was active, navigates to `/app/conversations/new`.
     * On error: toast shows "Failed to delete conversation", conversation remains in list.
  5. **Scenario B (Cancellation by blur):** User removes focus from the button (e.g., `onBlur`).
     * `isConfirmingDelete` state returns to `false`. Icon returns to `Trash2`.
  6. **Scenario C (Cancellation by selection):** User clicks on the main area of the same `ConversationListItem`.
     * Zustand `setActiveConversation(id)` is called. This also resets local `isConfirmingDelete` to `false`.

***

## 9. Conditions and Validation

* **Condition:** User must be authenticated to see this view.
  * **Handling:** Managed by routing at the layout level (`/app`). If Zustand `fetchConversations()` action receives `401 Unauthorized`, error handling will display appropriate message and potentially redirect to auth.
* **Condition:** "New Conversation" button is inactive when a new conversation is already "active".
  * **Handling:** `NewConversationButton` component retrieves `activeConversationId` from Zustand and sets `disabled={activeConversationId === null}`.

***

## 10. Error Handling

Error handling follows the consistent strategy:

* **All API errors in this view** → NonBlockingAlert toast notifications

**Specific Error Scenarios:**

* **Fetching List Error (`GET /api/conversations`):**
  * Zustand `fetchConversations()` action catches error and stores error state.
  * `ConversationList` component detects error state and displays an error message: "Failed to load conversations" with a "Try Again" button that calls `fetchConversations()` again.
  * NonBlockingAlert toast also appears: "Failed to load conversations"

* **Deletion Error (`DELETE /api/conversations/{id}`):**
  * Zustand `deleteConversation()` action catches error.
  * NonBlockingAlert toast appears: "Failed to delete conversation"
  * The conversation remains in the list.
  * Local `isConfirmingDelete` state in `ConversationListItem` is reset to `false`.

* **Empty List:**
  * If `!uiFlags.isLoadingConversations && !error && conversationsList.length === 0`, `ConversationList` component displays a friendly message: "You don't have any conversations yet. Start a new one!" with a visual prompt to click the "New Conversation" button.

***

## 11. Implementation Steps

1. **Verify Global State:** Ensure the unified Zustand store (`src/stores/useAppStore.ts`) includes all required state and actions: `activeConversationId`, `conversationsList`, `uiFlags.isLoadingConversations`, `fetchConversations()`, `setActiveConversation()`, `deleteConversation()`.

2. **Create Sidebar Components:**
   * Create `ConversationSidebar` container component.
   * Create `SettingsButton` component that opens settings modal.
   * Create `NewConversationButton` component.
   * Create `ConversationList` component.
   * Create `ConversationListItem` component.
   * Use `shadcn/ui` components: `Button`, `Skeleton`, etc.

3. **Implement Data Fetching:**
   * In `ConversationSidebar`, call Zustand `fetchConversations()` action on mount.
   * `ConversationList` retrieves `conversationsList` and `uiFlags.isLoadingConversations` from Zustand.
   * Implement rendering logic for loading (skeletons), error, and empty states.

4. **Implement Settings Button:**
   * `SettingsButton` at the top of sidebar.
   * `onClick` opens the API Key settings modal or navigates to `/app/settings`.

5. **Implement "New Conversation" Logic:**
   * `NewConversationButton` retrieves `activeConversationId` from Zustand.
   * `onClick` calls Zustand `setActiveConversation(null)` which also navigates to `/app/conversations/new`.
   * Button is `disabled` when `activeConversationId === null`.

6. **Implement Conversation Selection Logic:**
   * `ConversationListItem` retrieves `activeConversationId` from Zustand to determine if it's active.
   * `onClick` on main element calls Zustand `setActiveConversation(id)` which also navigates to `/app/conversations/[id]`.
   * Add dynamic styles and `aria-selected` based on whether `conversation.id === activeConversationId`.

7. **Implement Deletion Logic (two-step confirmation):**
   * In `ConversationListItem`, add local state `useState<boolean>(false)` for `isConfirmingDelete`.
   * First click on delete button (Trash2 icon): stops propagation, sets `isConfirmingDelete(true)`, changes icon to Check and button to destructive variant.
   * Second click (on Check icon): calls Zustand `deleteConversation(id)` action.
   * `onBlur` on delete button: resets `isConfirmingDelete(false)`.
   * Zustand action handles API call, updates `conversationsList`, navigates if needed, shows toasts.

8. **Implement NonBlockingAlert System:**
   * Ensure toast notification system (Sonner or Shadcn/ui Toast) is available.
   * Zustand actions show appropriate toasts for errors and success messages.

9. **Styling and Accessibility:**
   * Refine styling with Tailwind.
   * Ensure keyboard navigation works (arrow keys, tab order).
   * Verify all `aria` attributes are correctly set (`aria-selected`, `role="list"`, etc.).
   * Test screen reader compatibility.

10. **Testing:** Test all scenarios:
    * Loading conversations list
    * Empty conversations list
    * Selecting a conversation (navigation works)
    * Starting new conversation (navigation to /app/conversations/new)
    * Deleting conversation (two-step confirmation, active conversation handling)
    * Error handling (load error, delete error)
    * Settings button opens modal
