# UI Architecture for switch-ai

## 1. UI Structure Overview

switch-ai is a chat application for LLM power-users, designed around a fixed, two-column layout: **Sidebar (conversation list + actions)** and **Main Panel (active chat + input field + model selector)**. Global state is managed via Zustand (activeConversationId, conversationsList, modelsList, lastUsedModel). The interface supports per-message model switching, branching (full / summary), simple pagination (first 50 conversations and first 50 oldest messages for the active chat), BYOK API key onboarding, and non-blocking API error messages. The UI clearly separates the "New Chat" logic (activeConversationId === null) from the view of an existing conversation.

***

## 2. View List

### View: Login / Registration Screen

* **Path**: `/auth` (or Supabase-managed)
* **Main Goal**: enable registration (email + password) and login; transition to the app upon success.
* **Key Information**: email, password fields, format validation, error feedback (e.g., email taken, wrong password).
* **Key Components**: login/registration forms, "Log In" / "Register" CTAs, "Forgot Password" link.
* **UX / Accessibility / Security**: aria-labels for fields, email validation debounce, strong password (optional), HTTPS, do not store password in localStorage.

***

### View: Main Layout (Two-Column) — Global

* **Path**: `/app` (layout)
* **Main Goal**: frame for the sidebar + chat panel; central navigation point.
* **Key Information**: API key status (locked/unlocked), model list preload, activeConversationId, hamburger button (mobile).
* **Key Components**: Header (hamburger, settings), Sidebar, ChatPanel.
* **UX / Accessibility / Security**: focus management when switching conversations, landmark roles (nav, main), tokens and API key never in frontend state except for momentary input.

***

### View: Sidebar — Conversation List

* **Path**: part of the layout (`/app#sidebar`)
* **Main Goal**: browsing and managing conversations (new, select, delete).
* **Key Information**: list (first 50) of conversations sorted newest→oldest, titles, creation time, trash icon (two-step confirmation), "New Conversation" button (dimmed when activeConversationId === null).
* **Key Components**: list item with accessible buttons (select, delete/confirm), search/filter (optional in MVP), sticky "New Chat" CTA.
* **UX / Accessibility / Security**: keyboard navigation (arrow keys), aria-selected for the active conversation, two-step delete confirmation (icon changes) instead of a modal (as per decision).

***

### View: Chat Panel — History + Interaction

* **Path**: `/app/conversations/:id` or active "New Chat" when `activeConversationId === null`
* **Main Goal**: conducting conversation, sending messages with per-message model selection, reviewing history, branching from each message item.
* **Key Information**: message list (GET .../messages — first 50 oldest), model\_name under each response, token counter (prompt+completion from the last assistant message), loading indicator (skeleton) when awaiting response, non-blocking alert with API error content (US-013).
* **Key Components**: MessageList (role=log), MessageItem (user/assistant/error), Branch action (icon + menu), ModelBadge (under response), Composer (input, model selector, send button, token counter).
* **UX / Accessibility / Security**: aria-live region for new messages, disabled input + button while waiting (but UI does not block other actions), distinct colors/roles for error messages, readable contrasts, do not hold API key in JS runtime.

***

### View: Composer / Message Sending (part of Chat Panel)

* **Path**: component in `/app`
* **Main Goal**: enter text, select a model for this single message, send.
* **Key Information**: textarea with autosize, Combobox with model search (modelsList from /api/models), "Send" button, token counter, last used model (localStorage ↔ Zustand).
* **Key Components**: Combobox (searchable), Send button, Token counter, model history tooltip (recently used).
* **UX / Accessibility / Security**: keyboard shortcuts (Enter send, Shift+Enter newline), aria-controls for Combobox, remembering lastUsedModel in localStorage (without API key).

***

### View: Settings / API Key Onboarding

* **Path**: `/app/settings` (modal or page)
* **Main Goal**: BYOK management — entering, removing, checking existence (GET /user/api-key; PUT /user/api-key; DELETE /user/api-key).
* **Key Information**: API key input, validation status (existence check), BYOK instructions, save button, info about server-side encryption.
* **Key Components**: secure input (mask), status badge, explainers (why we don't see the key).
* **UX / Accessibility / Security**: key never shown, input clears after sending; tips on account security; validation errors displayed as alerts.

***

### View: Branching Flow Modal / Popover

* **Path**: overlay in Chat Panel (not a new page)
* **Main Goal**: select branch type (full / summary), confirm, call `POST /conversations/{id}/messages/{id}/branch`.
* **Key Information**: brief description of the difference between full and summary, "Create branch (full history)" and "Create branch (summary)" buttons.
* **Key Components**: accessible dialog, loading state, success navigation (switch activeConversationId to the new one).
* **UX / Accessibility / Security**: focus trap in dialog, aria-describedby with description of consequences, endpoint error handler (500 → non-blocking alert).

***

### View: Errors and Inactive States (Global)

* **Path**: global overlay/inline alerts (component)
* **Main Goal**: displaying information about API errors, missing API key, connection errors, validation.
* **Key Information**: error content, recommended action (e.g., check settings), retry button where it makes sense.
* **Key Components**: non-blocking Alert (Shadcn/ui), inline error message in MessageList.
* **UX / Accessibility / Security**: role=alert for accessibility, client-side event logging of metadata only (without key).

***

## 3. User Journey Map

### Main Use Case — "Create a new conversation and use a different model for a message"

1. User logs in (`/auth`) → on success, proceeds to `/app`.
2. App load: fetch `/api/models` once, fetch `/conversations` (first 50). Check `/user/api-key`.
   * If API key `exists: false` → lock the chat panel and show modal/onboarding with a link to settings.
3. In the Sidebar, user clicks "New Conversation" or is already in the new chat view (activeConversationId === null).
4. In the Composer, user selects a model from the Combobox (optionally uses search). The selected model is saved in localStorage as `lastUsedModel`.
5. User types content → presses "Send" → UI sends `POST /conversations` (new conversation flow) with payload {content, model}.
6. Backend: creates conversation, saves user message, calls OpenRouter, saves assistant message, generates title (2-4 words) → returns conversation + messages.
7. UI: sets `activeConversationId` to the newly created id, refreshes conversations list (GET /conversations), renders messages; displays `model_name` under the response and updates token counter.
8. User can click the Branch icon on any message → select `full` or `summary` → UI calls `POST /conversations/{id}/messages/{id}/branch` → on success, sets activeConversationId to the new branch and fetches its messages.

***

## 4. Layout and Navigation Structure

* **Global Header**: hamburger (mobile), profile/settings (opens settings modal/page), API key status (icon).
* **Sidebar (persistent)**: conversation list (select), "New Conversation" button (sticky), filter/search options (optional). Clicking an item → set `activeConversationId` and fetch messages.
* **Main Panel**: dynamic; if `activeConversationId === null` → "New Chat", otherwise render history. Branching triggered inline on the message item.
* **Mobile Navigation**: hamburger toggles Sidebar as a Sheet (Shadcn/ui). All actions available via keyboard and screen reader.
* **API Pipelines**: mutating operations (POST/PUT/DELETE) cause local state updates in Zustand and potential re-fetches (conversations list, messages) according to decisions in the plan.

***

## 5. Key Components

1. **SidebarList** — conversation list with two-step delete; keyboard navigation; lazy highlight active.
2. **ChatPanel / MessageList** — rendering messages with role significance; aria-live for new messages; handling message error card.
3. **MessageItem** — contains actions: branch (menu), copy, show model badge; accessibility for action buttons.
4. **Composer** — textarea, Combobox model selector (searchable), Send button, Token counter, keyboard shortcuts.
5. **ModelCombobox** — preloaded modelsList from /api/models; searchable; updates lastUsedModel in localStorage on send.
6. **BranchDialog** — accessible dialog with `full`/`summary` selection, loading state, error handling.
7. **APIKeyOnboarding** — modal/section with secure input and explanatory text; calls PUT/GET/DELETE /user/api-key.
8. **NonBlockingAlert** — inline alert component for API errors (maps error payload to friendly message).
9. **GlobalState (Zustand store)** — activeConversationId, conversationsList, messagesCache (per conversation), modelsList, lastUsedModel, uiFlags (loading states).

***

## 6. Mapping Main API Endpoints → UI Goals

* `GET /api/models` → **ModelCombobox** prefetch, save in Zustand; used in Composer.
* `GET /user/api-key` → **Onboarding flow**: block/unblock chat panel.
* `PUT /user/api-key` → save key (UI displays success + unblocks chat).
* `DELETE /user/api-key` → remove key → UI block + instruction.
* `GET /conversations?page=1&pageSize=50` → **SidebarList** (first 50).
* `POST /conversations` → create new conversation with the first message (New Chat flow). UI: sets activeConversationId and refreshes list.
* `GET /conversations/{id}` → (optional) conversation metadata.
* `DELETE /conversations/{id}` → deletion; UI: two-step confirmation, then remove from Zustand.
* `GET /conversations/{id}/messages?page=1&pageSize=50` → **MessageList** (fetch after activeConversationId change).
* `POST /conversations/{id}/messages` → send subsequent message; UI: adds user message, shows loading, after results adds assistant message and updates token counter. Errors (402, 502) mapped to inline error message.
* `POST /conversations/{id}/messages/{id}/branch` → branching; UI: dialog → POST → on success switch activeConversationId to new branch.

***

## 7. Mapping User Stories (PRD) to UI Elements

* **US-001 / US-002 (Registration / Login)** → Auth View (`/auth`) + redirect to `/app` on success.
* **US-003 (API Key Management)** → Settings `/app/settings` + Onboarding overlay; `GET/PUT/DELETE /user/api-key` integration.
* **US-004 (Send/Receive)** → Composer + `POST /conversations` and `POST /conversations/{id}/messages` + MessageList rendering.
* **US-005 (Per-message model selection)** → ModelCombobox in Composer; model sent in payload of each POST; `model_name` entry under assistant response.
* **US-006 (Remember last model)** → localStorage sync ↔ Zustand; preselect Combobox to `lastUsedModel`.
* **US-007 (New Conversation)** → "New Conversation" CTA in Sidebar; activeConversationId === null; POST /conversations after first send.
* **US-008 (Browsing / Switching)** → SidebarList select → set activeConversationId → GET messages.
* **US-009 (Deleting)** → two-step delete action in Sidebar (icon → confirm) → DELETE /conversations/{id}.
* **US-010 / US-011 (Branch Full / Summary)** → BranchDialog on MessageItem → POST /.../branch (type full/summary) → switch to new conversation on success.
* **US-012 (Token Counter)** → Token counter calculated from the last assistant message (prompt\_tokens + completion\_tokens) and displayed next to Composer.
* **US-013 (API Error Handling)** → NonBlockingAlert + inline MessageItem error with API error content; UI remains interactive.

***

## 8. UX, Accessibility, and Security Summary (Condensed)

* **UX**: minimal clicks for power-user: last model preselected; keyboard shortcuts (Enter send); quick branch/confirm; few spinners; two-step delete instead of modal.
* **Accessibility**: semantic HTML landmarks (nav, main), role=log/aria-live for new messages, accessible Combobox (aria-expanded, aria-activedescendant), focus management in dialogs, color contrast, keyboard navigation support (tabindex, arrow keys in lists).
* **Security**: BYOK — key sent only to backend (PUT /user/api-key), not stored in frontend state or localStorage; all HTTP requests via HTTPS; auth via JWT (Bearer) in every request; UI does not log or display the key; message length limit (1-50k chars) and validation before sending; does not reveal server error details to user — shows API error content in a safe form, backend logs details.

***

## 9. Potential Error States and Edge Cases (and Handling)

1. **No API key (GET /user/api-key → exists: false)**
   * UI: chat locked, onboarding modal displayed with link to settings, send button not shown.
2. **Invalid / Exhausted key (402)**
   * UI: inline error message as MessageItem after sending, suggestion "Check your key in settings", option to retry.
3. **OpenRouter Server Error (502/5xx)**
   * UI: non-blocking alert, allow retry, keep user message in local state as pending/error.
4. **Long / Very Long Context (Exceeding token limits)**
   * UI: token counter warning, indication of possible overflow; encouragement to branch or shorten; backend might return 400 → generate friendly message.
5. **Long Conversations — Pagination (main unresolved issue)**
   * UI: information that only the first 50 are visible (old MVP compromise), "Load more" option marked; clearly inform the user.
6. **Race Conditions**: rapid successive sends → Composer disabled while awaiting response (as per decision). Alternative: allow concurrent messages but queue them — outside MVP.
7. **Branch Summary Generation Fail (500)**
   * UI: error alert in dialog, leave user in original conversation, log error.

***

## 10. API Plan Compliance (Brief Confirmation)

The UI architecture directly maps to the API plan: every mutation and fetch has a corresponding endpoint; branching, creating conversations from the first message, and per-message model selection required by the backend are reflected in the Composer and BranchDialog; JWT authentication and BYOK are assumed by Settings/Onboarding. Local state and fetch policies (once on load for models; fetch conversations once + refresh on create/delete; fetch messages on activeConversationId change) have been accounted for.

***

## 11. User Pain Points and How the UI Alleviates Them

1. **Switching models is tedious** → Combobox model selector with search + remembering lastUsedModel.
2. **Losing context when exploring alternatives** → branching (full/summary) allows for independent threads without losing history.
3. **Unclear API errors** → inline, non-blocking alerts with suggested action (settings / retry).
4. **Too many windows** → one, consistent view with the ability to copy/open branch in the same UI.
5. **Mobility** → sidebar as Sheet, discreet CTAs, keyboard friendly.

***

## 12. Brief Implementation Recommendations (UX tech hints, no code)

* Prefetch `/api/models` and `/conversations` after login; block composer only if API key is missing or while awaiting a response from the model.
* Treat `activeConversationId === null` as an important state — it triggers a different flow (POST /conversations on first message send).
* Store `lastUsedModel` in localStorage and synchronize on Zustand initialization, update after each send.
* Map all API errors to readable messages in MessageList (with error code and brief instruction).

***

## 13. Summary

The UI design for switch-ai focuses on maximum power-user ergonomics: quick model switching, easy conversation branching, clear error handling, and secure BYOK. The two-column layout with Sidebar and Chat Panel, global state in Zustand, and accessible components (Shadcn/ui) ensure consistency, accessibility, and simplicity for MVP implementation.
