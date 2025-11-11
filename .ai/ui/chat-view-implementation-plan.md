# Implementation Plan for Chat Panel View

## 1. Overview

The chat panel is the main interface of the application where users conduct conversations. This view renders the message history for the selected conversation (based on `:id` in the URL) and provides the `Composer` component for sending new messages. It also enables key features: selecting an AI model for each message (FR-04) and creating branches from any message in the history (FR-06).

When the conversation `id` is not present (e.g., in a new chat), this view handles creating a new conversation upon sending the first message.

## 2. View Routing

The view will be rendered by an Astro page component that dynamically loads a React component.

* **Path:** `/app/conversations/[id]` (for existing conversations)
* **Path:** `/app/new` (for new conversations)

**Routing Behavior:**

* Clicking "New Conversation" button in sidebar → navigates to `/app/new`
* `/app/new` route → on mount sets `activeConversationId = null` in Zustand store
* After first message is sent → navigates to `/app/conversations/[newId]`
* This keeps URL and global state synchronized

The React component inside the Astro page will retrieve the `id` parameter from the URL.

## 3. Component Structure

Components will be built using React and the Shadcn/ui library, in accordance with the technology stack.

```
ChatPanelView (Page/React Component)
│
├── MessageList (useMessages)
│   ├── Skeleton (initial loading)
│   ├── MessageItem (mapping over messages)
│   │   ├── Avatar (for 'user' / 'assistant')
│   │   ├── MarkdownContent (for 'content')
│   │   ├── ModelBadge (if role='assistant' and model_name exists)
│   │   └── BranchAction (useBranching)
│   │       └── DropdownMenu (from Shadcn/ui)
│   │           ├── DropdownMenuItem ("Create branch with full history")
│   │           └── DropdownMenuItem ("Create branch with summary")
│   │
│   ├── MessageItem (for type 'error', US-013)
│   └── MessageItem (for type 'loading', AI response indicator)
│
└── Composer (gets state from global Zustand store)
    ├── ModelSelector (Combobox from Shadcn/ui)
    ├── Textarea (autosize)
    ├── SendButton
    └── TokenCounter (useTokenCounter)
```

## 4. Component Details

### ChatPanelView

* **Component Description:** Main view container. Responsible for retrieving the conversation `id` from the URL and passing it to the `useMessages` hook. Manages the loading state of the entire conversation.
* **Main Elements:** `MessageList`, `Composer`.
* **Supported Interactions:** None, orchestrates child components.
* **Supported Validation:** Checks if the `id` from the URL is valid (if it exists).
* **Types:** `PaginatedMessagesDto`, `MessageDto`.
* **Props:** `conversationId: string | null`.

### MessageList

* **Component Description:** Renders a scrollable message list. Uses an `aria-live` region to announce new messages. Displays messages, API errors (US-013), and the AI response loading indicator.
* **Main Elements:** Loop rendering `MessageItem`, `Skeleton` component from Shadcn/ui.
* **Supported Interactions:** Scrolling.
* **Supported Validation:** None.
* **Types:** `DisplayMessage[]` (see section 5. Types).
* **Props:** `messages: DisplayMessage[]`, `isLoadingInitial: boolean`.

### MessageItem

* **Component Description:** Renders a single message (user, assistant, error, or loading). Contains content, avatar, and for assistant messages, a `ModelBadge` and `BranchAction`.
* **Main Elements:** `Avatar`, `div` for content (rendering Markdown), `ModelBadge`, `BranchAction`.
* **Supported Interactions:** Click on the branch icon (propagated from `BranchAction`).
* **Supported Validation:** None.
* **Types:** `DisplayMessage`.
* **Props:** `message: DisplayMessage`.

### BranchAction

* **Component Description:** Component (button with `git-branch` icon) associated with `MessageItem`. On click, displays a `DropdownMenu` (Shadcn/ui) with two options (FR-06). Initiates the API call to create a branch.
* **Main Elements:** `Button` (as icon), `DropdownMenu`, `DropdownMenuItem`.
* **Supported Interactions:**
  * `onClick` (on icon): Opens the dropdown.
  * `onSelect` (on "Full history" option): Calls `createBranch(message.id, 'full')`.
  * `onSelect` (on "Summary" option): Calls `createBranch(message.id, 'summary')`.
* **Supported Validation:** Options in the menu can be disabled if `isBranching` is `true`.
* **Types:** `CreateBranchCommand`, `ConversationDto`.
* **Props:** `messageId: string`, `conversationId: string`.

### Composer

* **Component Description:** Bottom panel for input. Contains model selector, text field, and send button. Manages the state of entered text and selected model.
* **Main Elements:** `ModelSelector`, `Textarea` (from Shadcn/ui), `Button` (from Shadcn/ui), `TokenCounter`.
* **Supported Interactions:**
  * `onInput`: Updates text state.
  * `onModelChange`: Updates selected model state.
  * `onSubmit` (button click or `Enter`): Calls `sendMessage(text, model)`.
* **Supported Validation:** "Send" button is disabled (`disabled`) when:
  * `isSendingMessage` is `true`.
  * `inputText.trim().length === 0`.
  * `isLoadingModels` is `true` or `modelsList` is empty.
* **Types:** `SendMessageCommand`, `Model`.
* **Props:** None (retrieves all state from global Zustand store, including `activeConversationId`, `isSendingMessage`, `modelsList`).

### ModelSelector

* **Component Description:** Implementation of `Combobox` (from Shadcn/ui) for searching and selecting an AI model (US-005). Retrieves default value from global Zustand store (for US-006).
* **Main Elements:** `Combobox` (composed of `Popover`, `Command` from Shadcn/ui).
* **Supported Interactions:** Search, selection.
* **Supported Validation:** Displays loading or error state while fetching the model list.
* **Types:** `Model[]`.
* **Props:** `value: string`, `onChange: (modelId: string) => void`, `modelsList: Model[]`, `isLoading: boolean`.

### TokenCounter

* **Component Description:** Displays the estimated number of tokens for the current conversation (FR-08).
* **Main Elements:** `span` or `div`.
* **Supported Validation:** None.
* **Types:** `number`.
* **Props:** `totalTokens: number`.

## 5. Types

In addition to API DTO types (`MessageDto`, `ConversationDto`, `ErrorResponseDto`, `SendMessageCommand`, `CreateBranchCommand`), we will need ViewModel types:

```typescript
/**
 * AI Model type retrieved from /api/models
 */
interface Model {
  id: string; // e.g. 'google/gemini-flash-1.5'
  name: string; // e.g. 'Gemini Flash 1.5'
  // ... other properties if the API provides them
}

/**
 * Union type representing everything that can appear in the message list.
 * Enables rendering messages, errors, and loading indicators in a single list.
 */
type DisplayMessage =
  | {
      type: "message";
      data: MessageDto;
    }
  | {
      type: "error";
      id: string; // unique ID, e.g. from timestamp
      content: string; // error message from ErrorResponseDto.message
    }
  | {
      type: "loading";
      id: string; // fixed ID, e.g. 'loading-skeleton'
    };
```

## 6. State Management

State will be managed using **Zustand** as the single source of truth for both UI and server state.

* **Global State (Zustand Store - `src/stores/useAppStore.ts`):**

  * **activeConversationId:** `string | null` - ID of currently selected conversation, or `null` for new chat
  * **conversationsList:** `ConversationDto[]` - List of user's conversations (first 50, sorted newest first)
  * **messagesCache:** `Record<string, MessageDto[]>` - Cached messages per conversation ID
  * **modelsList:** `Model[]` - Cached list of available AI models
  * **lastUsedModel:** `string | null` - ID of the last used model (persisted to localStorage)
  * **uiFlags:** Object containing loading/error states:
    * `isLoadingConversations: boolean`
    * `isLoadingModels: boolean`
    * `isLoadingMessages: boolean`
    * `isSendingMessage: boolean`
    * `isBranching: boolean`
  * **Actions:**
    * `setActiveConversation(id: string | null)` - Sets active conversation and navigates
    * `fetchConversations()` - Calls `GET /api/conversations` and updates `conversationsList`
    * `fetchModels()` - Calls `GET /api/models` and updates `modelsList`
    * `fetchMessages(conversationId: string)` - Calls `GET /api/conversations/[id]/messages` and updates `messagesCache[id]`
    * `sendMessage(cmd: SendMessageCommand)` - Handles sending messages (new or existing conversation)
    * `deleteConversation(id: string)` - Calls `DELETE /api/conversations/[id]` and updates state
    * `createBranch(conversationId: string, messageId: string, type: 'full' | 'summary')` - Handles branching
    * `setLastUsedModel(modelId: string)` - Updates last used model
  * **Middleware:** Use `persist` (from Zustand) to save `lastUsedModel` in `localStorage` (US-006 requirement).

* **Zustand Action Implementation Details:**

  * **`sendMessage(cmd: SendMessageCommand)`:**
    1. Sets `uiFlags.isSendingMessage = true`.
    2. **Optimistic Logic:** Adds user message with temporary ID and loading indicator to current messages.
    3. **Check `activeConversationId`:**
       * If exists: Calls `POST /api/conversations/[id]/messages`
       * If `null`: Calls `POST /api/conversations` (creating new conversation)
    4. **OnSuccess (POST .../messages):** Updates `messagesCache` with real messages, removes loading indicator
    5. **OnSuccess (POST /api/conversations):** Navigates to `/app/conversations/[new_id]`, updates `conversationsList` and `messagesCache`
    6. **OnError:** Removes loading, adds `type: 'error'` DisplayMessage for message send errors (402, 502 from OpenRouter). Shows NonBlockingAlert toast for other errors.
    7. **In `finally`:** Sets `uiFlags.isSendingMessage = false`, updates `lastUsedModel`

  * **`createBranch(conversationId: string, messageId: string, type: 'full' | 'summary')`:**
    1. Sets `uiFlags.isBranching = true`.
    2. Calls `POST /api/conversations/[convoId]/messages/[msgId]/branch` with `CreateBranchCommand`.
    3. **OnSuccess:** Receives `ConversationDto`, navigates to `/app/conversations/[new_id]`, updates `conversationsList`.
    4. **OnError:** Displays NonBlockingAlert toast with error message.
    5. **In `finally`:** Sets `uiFlags.isBranching = false`.

* **Helper Hook:**

  * **`useTokenCounter(conversationId: string | null)`:**
    * Retrieves messages from `messagesCache[conversationId]` via Zustand store.
    * Uses `useMemo` to extract `prompt_tokens` and `completion_tokens` from **only the last assistant message** of type `message`.
    * **Returns:** `totalTokens: number` (sum of prompt\_tokens + completion\_tokens from last assistant message, or 0 if none).

## 7. API Integration

All API calls are handled by Zustand store actions using `fetch`.

1. **Fetching Messages (view loading):**

   * **Endpoint:** `GET /api/conversations/[id]/messages`
   * **Parameters:** `page=1`, `pageSize=50`
   * **Response Type:** `PaginatedMessagesDto`
   * **Handling:** Via `fetchMessages()` Zustand action.

2. **Fetching Model List:**

   * **Endpoint:** `GET /api/models`
   * **Response Type:** `Model[]`
   * **Handling:** Via `fetchModels()` Zustand action.

3. **Sending Message (existing conversation):**

   * **Endpoint:** `POST /api/conversations/[id]/messages`
   * **Request Type:** `SendMessageCommand { content: string, model: string }`
   * **Response Type:** `MessageDto[]` (contains `userMsg` and `assistantMsg`)
   * **Handling:** Via `sendMessage()` Zustand action.

4. **Sending Message (new conversation):**

   * **Endpoint:** `POST /api/conversations`
   * **Request Type:** `CreateConversationFromMessageCommand { content: string, model: string }`
   * **Response Type:** `ConversationWithMessagesDto`
   * **Handling:** Via `sendMessage()` Zustand action.

5. **Creating Branch:**

   * **Endpoint:** `POST /api/conversations/[id]/messages/[id]/branch`
   * **Request Type:** `CreateBranchCommand { type: 'full' | 'summary' }`
   * **Response Type:** `ConversationDto`
   * **Handling:** Via `createBranch()` Zustand action.

## 8. User Interactions

* **User loads page `/app/conversations/[id]`:**
  * Zustand `fetchMessages(id)` action is called. `MessageList` shows `Skeleton`. After loading, the list populates from `messagesCache[id]`.
* **User loads page `/app/new`:**
  * `activeConversationId` is set to `null`. Message list is empty. `Composer` is active.
* **User selects model in `ModelSelector`:**
  * Local component state is updated. Model will be used for next message send.
* **User types in `Textarea` and clicks "Send" (or `Enter`):**
  * Zustand `sendMessage()` action is called.
  * `Composer` is disabled (`uiFlags.isSendingMessage = true`).
  * User's message appears immediately on the list (`type: 'message'`) - optimistic update.
  * Loading indicator appears (`type: 'loading'`).
  * If it was a new chat (`activeConversationId === null`), `POST /api/conversations` is called. On success, navigates to `/app/conversations/[newId]`.
  * If it was an existing chat, `POST .../messages` is called. On success, loading indicator disappears, and assistant's message appears on the list.
  * Zustand store updates `lastUsedModel` (US-006).
  * `Composer` is re-enabled.
* **User clicks "Branch" icon on a message:**
  * `DropdownMenu` opens.
* **User selects "Create branch with full history":**
  * Zustand `createBranch(conversationId, messageId, 'full')` action is called.
  * NonBlockingAlert toast shows "Creating branch..."
  * On success, navigates to `/app/conversations/[new_id]`.
* **API error occurs while sending message:**
  * `Composer` is re-enabled.
  * Loading indicator disappears.
  * **For message send errors (402, 502 from OpenRouter):** A `MessageItem` with `type: 'error'` and error content appears in the chat. The interface remains fully functional (US-013).
  * **For other errors:** NonBlockingAlert toast appears with error message.

## 9. Conditions and Validation

* **`Composer`:** "Send" button is inactive if:
  1. Message content is empty (`content.trim().length === 0`).
  2. Message is being sent (`uiFlags.isSendingMessage === true` from Zustand).
  3. Model list has not been loaded yet (`modelsList.length === 0` or `uiFlags.isLoadingModels === true`).
* **`Composer`:** The entire component (textarea, selector) is in `disabled` state during `uiFlags.isSendingMessage`.
* **`BranchAction`:** Options in the `DropdownMenu` are in `disabled` state during `uiFlags.isBranching`.

## 10. Error Handling

Error handling follows a consistent strategy:

* **Message send errors (402, 502 from OpenRouter)** → MessageItem with `type: 'error'` in chat history
* **All other API errors** → NonBlockingAlert toast notifications

**Specific Error Scenarios:**

* **Error fetching `GET .../messages`:** Zustand `fetchMessages()` action catches error. `ChatPanelView` displays an error message on the page (e.g., "Failed to load conversation") with a retry button that calls `fetchMessages()` again.
* **Error fetching `GET /api/models`:** Zustand `fetchModels()` action catches error. NonBlockingAlert toast appears: "Failed to load models." `Composer` is disabled with a `Tooltip` explaining that messages cannot be sent.
* **Error `POST .../messages` with 402 (invalid API key) or 502 (OpenRouter error):** According to US-013, the Zustand `sendMessage()` action removes the loading indicator and adds a `DisplayMessage` of type `error` to the message list with the error content. The UI remains fully functional (non-blocking).
* **Error `POST .../messages` with other status codes:** NonBlockingAlert toast appears with error message. User can retry.
* **Error `POST .../branch`:** Zustand `createBranch()` action displays a NonBlockingAlert toast (e.g., `Toast` / `Sonner` from Shadcn/ui): "Failed to create branch." The user remains in the same view.
* **API key missing (detected on app load):** Chat panel is locked, onboarding modal/overlay is shown (blocking, not just a toast).

## 11. Implementation Steps

1. **Global State Configuration:**
   * Create `useAppStore` (Zustand) in `src/stores/useAppStore.ts` with all state properties: `activeConversationId`, `conversationsList`, `messagesCache`, `modelsList`, `lastUsedModel`, `uiFlags`.
   * Implement `persist` middleware for `lastUsedModel`.
   * Implement all actions: `setActiveConversation`, `fetchConversations`, `fetchModels`, `fetchMessages`, `sendMessage`, `deleteConversation`, `createBranch`, `setLastUsedModel`.

2. **Create Types:** Define `Model`, `DisplayMessage`, and UI state types in `src/types.ts`.

3. **Implement `Composer` Components:**
   * Create `ModelSelector` component (as `Combobox` from Shadcn/ui) that retrieves `modelsList` and `lastUsedModel` from Zustand store.
   * Create `TokenCounter` component that uses `useTokenCounter` hook.
   * Create `Composer` component combining `ModelSelector`, `Textarea` (autosize), `SendButton`, and `TokenCounter`. Component retrieves all state from Zustand and calls `sendMessage()` action. Implement validation logic for `disabled` states based on `uiFlags`.

4. **Implement `useTokenCounter` Hook:**
   * Create hook that takes `conversationId` as parameter.
   * Retrieves messages from `messagesCache[conversationId]` via Zustand.
   * Uses `useMemo` to find the **last assistant message** and extract `prompt_tokens + completion_tokens`.
   * Returns total tokens (or 0 if no assistant message exists).

5. **Implement `MessageList` Components:**
   * Create `BranchAction` component with `DropdownMenu` (Shadcn/ui). Component calls Zustand `createBranch()` action and uses `uiFlags.isBranching` for disabled state.
   * Create `ModelBadge` component for displaying model name.
   * Create `MessageItem` component that renders different variants of `DisplayMessage` (message, error, loading) and includes `BranchAction` and `ModelBadge` for assistant messages.
   * Create `MessageList` that retrieves messages from Zustand `messagesCache` and maps to `MessageItem`. Handles `uiFlags.isLoadingMessages` to show skeleton.

6. **Assemble `ChatPanelView`:**
   * Create Astro page for `/app/conversations/[id]` and `/app/new`.
   * Create React component that retrieves `id` from URL params.
   * On mount, if `id` exists, call Zustand `fetchMessages(id)` and `setActiveConversation(id)`.
   * If route is `/app/new`, call `setActiveConversation(null)`.
   * Render `MessageList` and `Composer` (both get state from Zustand, no props needed).

7. **Implement NonBlockingAlert System:**
   * Create toast notification system using `Sonner` or Shadcn/ui `Toast`.
   * Integrate into Zustand actions for appropriate error scenarios.

8. **Accessibility and UX:**
   * Add `aria-live` region to `MessageList`.
   * Handle keyboard shortcuts in `Composer` (`Enter` to send, `Shift+Enter` for newline).
   * Ensure all interactive elements have proper `aria-` attributes.

9. **Testing:** Test all scenarios:
   * Loading existing conversation
   * Creating new conversation (sending first message)
   * Sending message in existing conversation
   * Message send errors (402, 502) → should appear as MessageItem
   * Other API errors → should appear as toast
   * Branching (full history and summary)
   * Token counter displays correctly (only last message)
   * Navigation between conversations
   * Model selector remembers last used model
