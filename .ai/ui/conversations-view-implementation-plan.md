# Implementation Plan for Sidebar View — Conversation List

## 1. Overview

The `Sidebar - Conversation List` view (Sidebar Panel - Conversation List) is a key navigation component in the `switch-ai` application. Its main purpose is to enable the user to browse, switch, create new, and delete existing conversations. It is a fixed element of the main application layout that shares state with the chat panel.

## 2. View Routing

This component is not a standalone page but part of the main layout (`/app`). It will be rendered as a React component inside the Astro layout file, e.g., `src/layouts/AppLayout.astro`.

## 3. Component Structure

Components will be built in React (`.tsx`) and utilize `shadcn/ui` components and `tailwind` for styling.

```tsx
<ConversationSidebar>
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

* **Component Description:** Main sidebar panel container. Responsible for fetching data, managing loading/error states, and interacting with global state (`activeConversationId`).
* **Main Elements:**
  * `<aside>` or `<nav>` (for semantics and landmark roles).
  * `NewConversationButton` component.
  * `ConversationList` component.
* **Supported Interactions:** No direct interactions. The component manages data fetching logic and passes handlers to child components.
* **Supported Validation:** None.
* **Types:** `PaginatedConversationsDto`, `ConversationDto`.
* **Props:** None.

### `NewConversationButton`

* **Component Description:** Sticky "New Conversation" button at the top of the sidebar panel.
* **Main Elements:**
  * `<Button>` component from `shadcn/ui`.
* **Supported Interactions:**
  * `onClick`: Sets global `activeConversationId` to `null`.
* **Supported Validation:** Button is disabled if `activeConversationId` is already `null`.
* **Types:** None.
* **Props:**
  * `activeConversationId: string | null`
  * `onNew: () => void`

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
* **`ConversationStoreState`** (ViewModel for Zustand global state)
  ```typescript
  interface ConversationStoreState {
    activeConversationId: string | null;
    setActiveConversation: (id: string | null) => void;
  }
  ```

***

## 6. State Management

State will be managed using a combination of **Zustand** (for global UI state) and **Tanstack Query** (React Query) (for server state).

### Global State (Zustand)

We will create `src/stores/useConversationStore.ts`:

* **State:** `activeConversationId: string | null`
  * Stores the ID of the currently selected conversation.
  * `null` means the "New Conversation" mode is active.
* **Action:** `setActiveConversation: (id: string | null) => void`
  * Sets the active ID. The `ConversationSidebar` component will call this action.
  * The `ChatPanel` component (out of scope for this plan) will listen to changes in this state to fetch appropriate messages.

### Server State (Tanstack Query)

We will create custom hooks to manage the API data lifecycle.

* **`useGetConversations`:**

  * Hook based on `useQuery`.
  * `queryKey: ['conversations', { page: 1, pageSize: 50 }]`
  * `queryFn`: Calls `GET /api/conversations?page=1&pageSize=50`.
  * Provides `data`, `isLoading`, `isError`, `error`, `refetch`.
  * Used in `ConversationSidebar` to fetch the list.

* **`useDeleteConversation`:**

  * Hook based on `useMutation`.
  * `mutationFn: (id: string) => fetch('/api/conversations/' + id, { method: 'DELETE' })`
  * `onSuccess`:
    1. Invalidates the `['conversations']` query (using `queryClient.invalidateQueries`) to automatically refresh the list.
    2. Checks if the deleted ID was active (`deletedId === store.activeConversationId`). If so, calls `store.setActiveConversation(null)` to clear the chat panel.
  * `onError`: Displays a toast notification (e.g., "Failed to delete conversation").
  * Used in `ConversationSidebar` and passed as `onDelete` to `ConversationListItem`.

***

## 7. API Integration

This view will integrate with two endpoints:

1. **Fetching Conversation List**

   * **Endpoint:** `GET /api/conversations`
   * **Usage:** Called on mount of `ConversationSidebar` component via `useGetConversations` hook.
   * **Query Parameters:** `page=1`, `pageSize=50` (according to `view_description`).
   * **Response Type (Success):** `PaginatedConversationsDto`
   * **Response Type (Error):** `ErrorResponseDto`

2. **Deleting Conversation**

   * **Endpoint:** `DELETE /api/conversations/{id}`
   * **Usage:** Called by `useDeleteConversation` hook after the second click on the delete button in `ConversationListItem`.
   * **Query Parameters:** `id` (from `ConversationDto.id`) as path parameter.
   * **Response Type (Success):** `204 No Content`
   * **Response Type (Error):** `ErrorResponseDto`

**Note:** `POST /api/conversations` is not called by this view. Clicking "New Conversation" only changes the global state. The chat panel (`ChatPanel`) will be responsible for detecting `activeConversationId === null` and performing `POST` when sending the first message.

***

## 8. User Interactions

* **Loading the View:** User sees skeletons (`Skeleton`) in place of the list while fetching data.
* **Browsing the List:** User sees the list of conversations sorted from newest. The currently selected (active) conversation is highlighted (`aria-selected="true"`).
* **Starting a New Conversation (US-007):**
  1. User clicks the "New Conversation" button.
  2. `setActiveConversation(null)` action is called.
  3. "New Conversation" button becomes inactive (`disabled`).
  4. Active highlighting disappears from all list items.
  5. Chat panel (listening to state) clears its view, ready for a new message.
* **Switching Conversations (US-008):**
  1. User clicks on a `ConversationListItem`.
  2. `onSelect(id)` action is called, which sets `setActiveConversation(id)`.
  3. The clicked item is highlighted as active.
  4. Chat panel (listening to state) fetches and displays messages for `id`.
* **Deleting Conversation (US-009, modified):**
  1. User clicks the `Trash2` icon on a list item.
  2. `onClick` event is stopped (`stopPropagation`). Internal state `isConfirmingDelete` in `ConversationListItem` is set to `true`.
  3. Icon changes to `Check` (confirmation), and the button changes color to red.
  4. **Scenario A (Confirmation):** User clicks the `Check` icon.
     * `useDeleteConversation.mutate(id)` mutation is called.
     * After successful deletion, `onSuccess` refreshes the list (item disappears) and possibly clears the chat panel.
  5. **Scenario B (Cancellation by clicking elsewhere):** User removes focus from the button (e.g., `onBlur`).
     * `isConfirmingDelete` state returns to `false`. Icon returns to `Trash2`.
  6. **Scenario C (Cancellation by selection):** User clicks on the main area of the same `ConversationListItem`.
     * `onSelect(id)` is called. This handler *also* resets `isConfirmingDelete` to `false`.

***

## 9. Conditions and Validation

* **Condition:** User must be authenticated to see this view.
  * **Handling:** Managed by routing at the layout level (`/app`). If `useGetConversations` returns `401 Unauthorized`, the `useQuery` hook will go into `isError` state, and error handling (see below) will display the appropriate message.
* **Condition:** "New Conversation" button is inactive when a new conversation is already "active".
  * **Handling:** `NewConversationButton` component receives `activeConversationId` prop and sets `disabled={activeConversationId === null}`.

***

## 10. Error Handling

* **Fetching List Error (`GET /api/conversations`):**
  * `useGetConversations` hook will set `isError: true` and pass the `error` object.
  * `ConversationList` component will detect `isError` and instead of the list or skeletons, display an error message, e.g., "Cannot load conversations." and a "Try Again" button (calling `refetch` from `useQuery`).
* **Deletion Error (`DELETE /api/conversations/{id}`):**
  * `useDeleteConversation` hook will call the `onError` callback.
  * We will display a global notification (toast, e.g., from `shadcn/ui/use-toast`) with message "Error occurred while deleting conversation."
  * `isConfirmingDelete` state in `ConversationListItem` will be reset to `false`.
* **Empty List:**
  * If `!isLoading && !isError && conversations.length === 0`, `ConversationList` component will display a message, e.g., "You don't have any conversations yet. Start a new one!".

***

## 11. Implementation Steps

1. **State Configuration:** Create Zustand store `src/stores/useConversationStore.ts` with `activeConversationId` and `setActiveConversation`.
2. **API Configuration:** Create hooks `useGetConversations` and `useDeleteConversation` (e.g., in `src/hooks/api/useConversations.ts`) using `tanstack/query`. Configure `queryClient` in the main application file.
3. **Skeleton Components:** Create components `ConversationSidebar`, `NewConversationButton`, `ConversationList`, and `ConversationListItem` with basic HTML structure (using `shadcn/ui` `Button`, `Skeleton` etc.) and static data.
4. **Data Fetching:** Integrate `useGetConversations` in `ConversationSidebar`. Pass `data`, `isLoading`, `isError` to `ConversationList`. Implement rendering logic for loading, error, and empty states.
5. **"New Conversation" Logic:**
   * Retrieve `activeConversationId` and `setActiveConversation` from the Zustand store in `ConversationSidebar`.
   * Pass them as props to `NewConversationButton`.
   * Implement `onClick` and `disabled` logic in `NewConversationButton`.
6. **Conversation Selection Logic:**
   * Pass `activeConversationId` and `setActiveConversation` (as `onSelect`) down to `ConversationList` -> `ConversationListItem`.
   * In `ConversationListItem`, implement `onClick` on the main element to call `onSelect`.
   * Add dynamic styles (e.g., `data-[active=true]:...`) and `aria-selected` based on `isActive` prop.
7. **Deletion Logic (two stages):**
   * Integrate `useDeleteConversation` in `ConversationSidebar` and pass `mutate` as `onDelete` prop.
   * In `ConversationListItem`, add local state `useState<boolean>(false)` for `isConfirmingDelete`.
   * Implement delete button logic ( `Trash2` icon), which on `onClick` stops propagation and sets `isConfirmingDelete(true)`.
   * Add `onBlur` logic on the button to reset the state.
   * Change button rendering to show `Check` icon and red variant after `isConfirmingDelete(true)`. Clicking it should call `onDelete(id)`.
   * Ensure `onSuccess` of the mutation in `useDeleteConversation` invalidates the list query and resets `activeConversationId` if necessary.
8. **Styling and A11y:** Refine styling with Tailwind, ensure keyboard navigation (arrow keys) works correctly on the list (may require `react-aria` or manual `onKeyDown` handling), and that all `aria` attributes are correctly set.
