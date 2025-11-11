# Implementation Plan for Chat Panel View

## 1. Overview

The chat panel is the main interface of the application where users conduct conversations. This view renders the message history for the selected conversation (based on `:id` in the URL) and provides the `Composer` component for sending new messages. It also enables key features: selecting an AI model for each message (FR-04) and creating branches from any message in the history (FR-06).

When the conversation `id` is not present (e.g., in a new chat), this view handles creating a new conversation upon sending the first message.

## 2. View Routing

The view will be rendered by an Astro page component that dynamically loads a React component.

* **Path:** `/app/conversations/[id]` (for existing conversations)
* **Path:** `/app/new` (or similar, for new conversations where `:id` is absent)

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
└── Composer (useMessages, useModels, useAppStore)
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
* **Props:** `isSending: boolean`, `sendMessage: (cmd: SendMessageCommand) => void`, `activeConversationId: string | null`.

### ModelSelector

* **Component Description:** Implementation of `Combobox` (from Shadcn/ui) for searching and selecting an AI model (US-005). Retrieves default value from `useAppStore` (for US-006).
* **Main Elements:** `Combobox` (composed of `Popover`, `Command` from Shadcn/ui).
* **Supported Interactions:** Search, selection.
* **Supported Validation:** Displays loading or error state while fetching the model list.
* **Types:** `Model[]`.
* **Props:** `value: string`, `onChange: (modelId: string) => void`, `models: Model[]`, `isLoading: boolean`.

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
 * AI Model type retrieved from /api/models (assumed shape)
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

We will use a combination of local React state (useState) and global state (Zustand) for cross-component functionality.

* **Global State (Zustand - `useAppStore`):**

  * `lastUsedModel: string | null`: Stores the ID of the last used model.
  * `models: Model[]`: Cached list of AI models.
  * `isLoadingModels: boolean`: Loading state for the model list.
  * **Actions:** `setLastUsedModel`, `fetchModels`.
  * **Middleware:** Use `persist` (from Zustand) to save `lastUsedModel` in `localStorage` (US-006 requirement).

* **Custom Hooks:**

  * **`useMessages(conversationId: string | null)`:**

    * Manages the logic for fetching and sending messages.
    * **State:** `messages: DisplayMessage[]`, `isLoadingInitial: boolean`, `isSendingMessage: boolean`.
    * **Function `fetchMessages`:** Calls `GET /api/conversations/[id]/messages` on mount (if `conversationId` exists).
    * **Function `sendMessage(cmd: SendMessageCommand)`:**
      1. Sets `isSendingMessage(true)`.
      2. **Optimistic Logic:** Adds the user's message (`type: 'message'`) with a temporary ID and a loading indicator (`type: 'loading'`) to `messages`.
      3. **Check `conversationId`:**
         * If `conversationId` exists: Calls `POST /api/conversations/[id]/messages` (for US-004).
         * If `conversationId` is `null`: Calls `POST /api/conversations` (creating a new conversation).
      4. **OnSuccess (POST .../messages):** Receives `[userMsg, assistantMsg]`. Replaces the temporary user message with `userMsg`, removes `loading`, and adds `assistantMsg`.
      5. **OnSuccess (POST /api/conversations):** Receives `ConversationWithMessagesDto`. Uses `router.push()` to navigate to `/app/conversations/[new_id]`.
      6. **OnError:** Removes `loading`, adds an `type: 'error'` message with the error content (US-013).
      7. **In `finally`:** Sets `isSendingMessage(false)` and updates `lastUsedModel` in `useAppStore`.
    * **Returns:** `{ messages, isLoadingInitial, isSendingMessage, sendMessage }`.

  * **`useBranching()`:**

    * **State:** `isBranching: boolean`.
    * **Function `createBranch(messageId: string, type: 'full' | 'summary')`:**
      1. Sets `isBranching(true)`.
      2. Calls `POST /api/conversations/[convoId]/messages/[msgId]/branch` with `CreateBranchCommand`.
      3. **OnSuccess:** Receives `ConversationDto`. Uses `router.push()` to navigate to `/app/conversations/[new_id]`.
      4. **OnError:** Displays a global error (e.g., toast/sonner).
      5. **In `finally`:** Sets `isBranching(false)`.
    * **Returns:** `{ isBranching, createBranch }`.

  * **`useTokenCounter(messages: DisplayMessage[])`:**

    * Uses `useMemo` to sum `prompt_tokens` and `completion_tokens` from all messages of type `message`.
    * **Returns:** `totalTokens: number`.

## 7. API Integration

1. **Fetching Messages (view loading):**

   * **Endpoint:** `GET /api/conversations/[id]/messages`
   * **Parameters:** `page=1`, `pageSize=50` (according to view description)
   * **Response Type:** `PaginatedMessagesDto`
   * **Handling:** Via `useMessages`.

2. **Fetching Model List:**

   * **Endpoint:** `GET /api/models` (assumed)
   * **Response Type:** `Model[]` (assumed)
   * **Handling:** Via `useAppStore` (or `useModels`).

3. **Sending Message (existing conversation):**

   * **Endpoint:** `POST /api/conversations/[id]/messages`
   * **Request Type:** `SendMessageCommand { content: string, model: string }`
   * **Response Type:** `MessageDto[]` (contains `userMsg` and `assistantMsg`)
   * **Handling:** Via `useMessages`.

4. **Sending Message (new conversation):**

   * **Endpoint:** `POST /api/conversations`
   * **Request Type:** `CreateConversationFromMessageCommand { content: string, model: string }`
   * **Response Type:** `ConversationWithMessagesDto`
   * **Handling:** Via `useMessages`.

5. **Creating Branch:**

   * **Endpoint:** `POST /api/conversations/[id]/messages/[id]/branch`
   * **Request Type:** `CreateBranchCommand { type: 'full' | 'summary' }`
   * **Response Type:** `ConversationDto`
   * **Handling:** Via `useBranching`.

## 8. User Interactions

* **User loads page `/app/conversations/[id]`:**
  * `GET .../messages` is called. `MessageList` shows `Skeleton`. After loading, the list populates.
* **User loads page `/app/new`:**
  * Message list is empty. `Composer` is active.
* **User selects model in `ModelSelector`:**
  * `selectedModel` state in `Composer` is updated.
* **User types in `Textarea` and clicks "Send" (or `Enter`):**
  * `sendMessage` function from `useMessages` is called.
  * `Composer` is disabled.
  * User's message appears immediately on the list (`type: 'message'`).
  * Loading indicator appears (`type: 'loading'`).
  * If it was a new chat, `POST /api/conversations` is called. On success, redirects.
  * If it was an existing chat, `POST .../messages` is called. On success, loading indicator disappears, and assistant's message appears on the list.
  * `useAppStore` updates `lastUsedModel` (US-006).
  * `Composer` is re-enabled.
* **User clicks "Branch" icon on a message:**
  * `DropdownMenu` opens.
* **User selects "Create branch with full history":**
  * `createBranch(msg.id, 'full')` function is called.
  * Loading indicator is displayed (e.g., toast).
  * On success, redirects to new URL `/app/conversations/[new_id]`.
* **API error occurs while sending message:**
  * `Composer` is re-enabled.
  * Loading indicator disappears.
  * On the message list, a `MessageItem` with `type: 'error'` and error content appears (according to US-013). The interface *is not* blocked.

## 9. Conditions and Validation

* **`Composer`:** "Send" button is inactive if:
  1. Message content is empty (`content.trim().length === 0`).
  2. Message is being sent (`isSendingMessage === true`).
  3. Model list has not been loaded yet or an error occurred.
* **`Composer`:** The entire component (textarea, selector) is in `disabled` state during `isSendingMessage`.
* **`BranchAction`:** Options in the `DropdownMenu` are in `disabled` state during `isBranching`.

## 10. Error Handling

* **Error fetching `GET .../messages`:** `ChatPanelView` displays an error message on the entire page (e.g., "Failed to load conversation").
* **Error fetching `GET /api/models`:** `ModelSelector` displays an error inside the dropdown list. `Composer` is disabled with information (e.g., via `Tooltip`) that messages cannot be sent.
* **Error `POST .../messages` (e.g., OpenRouter error):** According to US-013, the `useMessages` hook removes the loading indicator and adds a `DisplayMessage` of type `error` to the list with the error content. The UI remains fully functional.
* **Error `POST .../branch`:** The `useBranching` hook displays a global, non-blocking error message (e.g., `Toast` / `Sonner` from Shadcn/ui) informing about the operation failure. The user remains in the same view.

## 11. Implementation Steps

1. **Global State Configuration:** Create `useAppStore` (Zustand) with `lastUsedModel` (with `persist` middleware) and `models`, `isLoadingModels`, and action `fetchModels` (which calls `GET /api/models`).
2. **Create Types:** Define `Model` and `DisplayMessage` types in the `types.ts` file.
3. **Implement `Composer` Components:**
   * Create `ModelSelector` component (as `Combobox` from Shadcn/ui) that retrieves data from `useAppStore`.
   * Create `TokenCounter` component.
   * Create `Composer` component combining `ModelSelector`, `Textarea` (autosize), `SendButton`, and `TokenCounter`. Implement validation logic (`disabled` states).
4. **Implement `useTokenCounter` Hook:** Create a hook that takes `DisplayMessage[]` and returns the sum of tokens.
5. **Implement `useMessages` Hook:**
   * Implement state `messages`, `isLoadingInitial`, `isSendingMessage`.
   * Implement `fetchMessages` (for `GET`).
   * Implement `sendMessage` with key logic distinguishing `conversationId` (null vs. string) to call `POST /api/conversations` or `POST .../messages`.
   * Implement optimistic logic (adding temp user and loading) and success handling (replacement/addition) and error handling (adding `type: 'error'`).
6. **Implement `useBranching` Hook:**
   * Implement `isBranching` state.
   * Implement `createBranch` function calling `POST .../branch` and handling navigation (via `router.push()`) or error (via toast).
7. **Implement `MessageList` Components:**
   * Create `BranchAction` component (with `DropdownMenu` and `useBranching` hook).
   * Create `ModelBadge` component.
   * Create `MessageItem` component that renders different variants of `DisplayMessage` (message, error, loading) and uses `BranchAction` and `ModelBadge`.
   * Create `MessageList` that maps `messages` state from `useMessages` to `MessageItem` and handles `isLoadingInitial`.
8. **Assemble `ChatPanelView`:**
   * Create component that retrieves `id` from URL.
   * Pass `id` to `useMessages`.
   * Render `MessageList` and `Composer`, passing states and functions from hooks.
9. **Accessibility and UX:** Add `aria-live` to `MessageList`, handle keyboard shortcuts in `Composer` (`Enter` / `Shift+Enter`).
10. **Testing:** Test all paths: loading, sending (new chat), sending (existing chat), sending error (US-013), branching (full), branching (summary).
