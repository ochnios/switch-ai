# Product Requirements Document (PRD) - switch-ai (MVP)

## 1. Product Overview

switch-ai is a chat application designed for advanced Large Language Model (LLM) users who require greater flexibility and control over their conversations. In the MVP (Minimum Viable Product) version, the application focuses on solving two key problems: the inability to seamlessly switch between different AI models within a single conversation, and the difficulty in exploring alternative threads without losing context.

The product offers a single, fluid interface that allows users to select an AI model for each message sent and to create new, independent conversation threads (branching) based on the full history or an automatically generated summary. The application is aimed at "power users," operates on a BYOK (Bring Your Own Key) model with OpenRouter integration, and prioritizes functionality and workflow efficiency.

## 2. User Problem

Users of standard chat interfaces with LLMs encounter two fundamental limitations that hinder their productivity and creativity:

1. Lack of flexibility in model selection: Different AI models specialize in different tasks (e.g., creative writing, code analysis, logical reasoning). To leverage these specializations, users are forced to work in multiple browser windows, manually copying and pasting conversation context, which is time-consuming, inconvenient, and leads to fragmented work.
2. Linearity of conversations: Current interfaces impose a linear conversation flow. Exploring alternative ideas, asking tangential questions, or testing different scenarios within the same context is difficult. Users must either "clutter" the main thread, leading to chaos, or start a new conversation from scratch, losing all previous history.

switch-ai addresses these problems by creating an integrated environment for dynamic and contextual management of interactions with multiple AI models.

## 3. Functional Requirements

* FR-01: User Authentication: The system will allow users to create an account and log in to store and access their conversation history.
* FR-02: API Key Management (BYOK): Users must be able to securely enter and save their own OpenRouter API key. The key must be stored encrypted on the server side and never exposed on the client side.
* FR-03: Chat Interface: The application will provide a simple and clear interface for conducting text conversations with AI models.
* FR-04: Per-message Model Switching: For each message input field, the user will have the option to select an AI model from a list. The list will include the most popular OpenRouter models and a search function.
* FR-05: Conversation Management: Users will have access to a list of their historical conversations. The application will allow creating new conversations, switching between existing ones, and permanently deleting them.
* FR-06: Conversation Branching: Each message (both user and assistant) in a conversation will have an option to create a new, independent conversation in two modes:
  * FR-06a: Full History: A new conversation is created as an exact copy of the entire history up to that point.
  * FR-06b: Summary Thread: The application automatically generates a summary of the conversation up to that point, which becomes the first system message in the new thread.
* FR-07: Automatic Conversation Naming: Newly created conversations will automatically receive a title (2-4 words) based on the content of the first message. Branched conversations will be named according to the scheme `[Parent Conversation Title] - branch X`.
* FR-08: Token Counter: An estimated token counter for the current conversation will be visible in the user interface, updated after each new message.
* FR-09: Remembering Last Model: The application will remember the last used AI model in the browser's `localStorage` and set it as the default for the next message or a new conversation.
* FR-10: API Error Handling: Errors returned by the OpenRouter API will be displayed as a message in the chat window, without blocking the interface and allowing the user to continue working.

## 4. Product Scope

### What is in scope for MVP:

* Simple user authentication (email/password).
* Chat interface with per-message model selection and conversation list.
* Integration exclusively with models available via OpenRouter.
* Conversation branching functionality (full history and summary).
* Automatic conversation naming.
* Displaying token counter.
* Permanent deletion of conversations.

### What is out of scope for MVP:

* Complex conversation visualization in a tree format.
* Ability to attach files (images, documents, audio).
* Assistant response streaming.
* Web search integration.
* Sharing and exporting conversations.
* Handling multiple conversations simultaneously in one view (e.g., in tabs).
* Automatic conversation context shortening.

## 5. User Stories

### Authentication and Configuration

#### ID: US-001

Title: New User Registration
Description: As a new user, I want to be able to create an account using my email address and password so that I can save my conversation history.
Acceptance Criteria:

1. The registration form contains fields for email address and password.
2. The system validates the correctness of the email address format.
3. Upon successful registration, I am automatically logged in and redirected to the main application view.
4. In case of unsuccessful registration (e.g., email already taken), a clear error message is displayed.

#### ID: US-002

Title: Application Login
Description: As a registered user, I want to be able to log into my account to access my saved conversations.
Acceptance Criteria:

1. The login form contains fields for email address and password.
2. Upon successful login, I am redirected to the view of the last active conversation or a new, empty conversation.
3. In case of incorrect login credentials, an appropriate message is displayed.

#### ID: US-003

Title: API Key Management
Description: As a logged-in user, I want to be able to enter and save my OpenRouter API key so that the application can make requests to AI models on my behalf.
Acceptance Criteria:

1. In the account settings, there is a field to enter the API key.
2. Upon saving, the API key is stored on the server in encrypted form.
3. The API key is never visible in the front-end code.
4. If the API key is invalid, an error message appears in the chat on the first attempt to use it (according to US-015).

### Basic Chat Interaction

#### ID: US-004

Title: Sending Messages and Receiving Responses
Description: As a user, I want to be able to type a message in the text field and send it to receive a response from the default AI model.
Acceptance Criteria:

1. The chat interface shows a text input field and a "Send" button.
2. After sending a message, it appears in the conversation window.
3. The AI model's response appears below the user's message.
4. The first message in a new conversation defines its automatically generated title.

#### ID: US-005

Title: Selecting an AI Model for a Specific Message
Description: As a user, I want to be able to select a specific AI model from a dropdown list before sending a message to leverage its specialized capabilities.
Acceptance Criteria:

1. Next to the text input field, there is a UI element (e.g., a dropdown list) with a list of available models.
2. The list includes popular models and a search field to filter the list.
3. The selected model is used to process only that single, upcoming message.
4. Selecting a model for one message does not change the default model for subsequent queries, unless it was the first selection (according to US-006).

#### ID: US-006

Title: Remembering the Last Used Model
Description: As a user, I want the application to remember the last model I used and set it as the default for subsequent messages to minimize clicks.
Acceptance Criteria:

1. After selecting a model from the list and sending a message, that model becomes the default selection for the next query in the same and any new conversation.
2. Information about the last used model is saved in the browser's `localStorage`.
3. Upon reopening the application, the last used model is correctly set as default.

### Conversation Management

#### ID: US-007

Title: Starting a New Conversation
Description: As a user, I want to be able to easily start a new, empty conversation to address a new task.
Acceptance Criteria:

1. The interface contains a clearly marked "New Conversation" button.
2. Clicking the button clears the current chat view and creates a new entry in the conversation list (with a temporary title until the first message is sent).
3. The new conversation becomes the active conversation.

#### ID: US-008

Title: Browsing and Switching Conversations
Description: As a user, I want to see a list of my previous conversations and be able to switch between them to continue my work.
Acceptance Criteria:

1. In the sidebar, a list of all my conversations is visible, sorted from newest to oldest.
2. Each item in the list displays the automatically generated conversation title.
3. Clicking on a conversation title in the list loads its full history into the main chat window.

#### ID: US-009

Title: Deleting Conversations
Description: As a user, I want to be able to permanently delete conversations I no longer need to keep the list tidy.
Acceptance Criteria:

1. Each conversation in the list has a "Delete" icon (trash icon).
2. Clicking "Delete" icon changes it to a "Confirm" state, providing a second click opportunity to confirm deletion.
3. Upon confirmation (second click), the conversation is permanently deleted from the database and disappears from the list.
4. Clicking elsewhere or waiting dismisses the confirmation state and returns the icon to its normal "Delete" state without deleting the conversation.

### Branching

#### ID: US-010

Title: Creating a Branch with Full History
Description: As a user, I want to be able to create a branch from a selected message that copies the entire history up to that point, so I can explore an alternative scenario without modifying the original thread.
Acceptance Criteria:

1. Next to each message in the conversation, a "Branch" icon is visible.
2. Clicking the icon reveals the "Create branch with full history" option.
3. Selecting this option creates a new, independent conversation in the database, containing a copy of all messages up to the branching point.
4. The new conversation is named in the format `[Parent Conversation Title] - branch X`.
5. The user is automatically switched to the view of the newly created conversation.

#### ID: US-011

Title: Creating a Branch with Summary
Description: As a user, I want to be able to create a branch that starts with an automatic summary of the previous conversation, to quickly begin a new, related topic with key context transferred.
Acceptance Criteria:

1. Next to each message in the conversation, a "Branch" icon is visible.
2. Clicking the icon reveals the "Create branch with summary" option.
3. Selecting this option triggers the AI model to generate a summary of the conversation up to the branching point.
4. A new, independent conversation is created, with the generated summary as its first message.
5. The new conversation is named in the format `[Parent Conversation Title] - branch X`.
6. The user is automatically switched to the view of the newly created conversation.

### Additional Functionalities (UX/Error Handling)

#### ID: US-012

Title: Displaying Token Counter
Description: As a user conducting a long conversation, I want to see the estimated number of tokens to be aware of the context size sent to the API and avoid exceeding the limit.
Acceptance Criteria:

1. In the chat interface, in a visible location, the number representing the estimated amount of tokens in the current conversation is displayed.
2. The counter updates after each new message is added (both user and assistant).
3. The UI design for the counter is readable and non-intrusive.

#### ID: US-013

Title: API Error Handling
Description: As a user, in case of a problem with API communication (e.g., invalid key, model server error), I want to receive feedback in the form of a message in the chat, so I can continue working without the entire interface being blocked.
Acceptance Criteria:

1. When an OpenRouter API request returns an error, a special error message appears in the chat window (e.g., "An error occurred: \[API error content]").
2. The application interface remains fully functional, allowing for sending another message or changing the model.
3. The error message is visually distinguishable from standard AI responses.

## 6. Success Metrics

The success of the MVP version will be measured through a combination of functional criteria and adoption indicators for key features.

### Functional Criteria:

1. Application stability: The application is 100% functional. Users can create accounts, log in, and use all basic functions without hindrance.
2. Reliability of key features:
   * Switching AI models for individual messages works flawlessly.
   * Creating new threads (both by copying history and by summarizing it) works reliably.
   * Conversation management (creating, browsing, switching, deleting) works as expected.

### Measurable Success Indicators (KPIs):

1. Branching feature adoption rate: At least 15% of active users have used the branching feature (any type) at least once within the first week of measurement.
2. Model switching feature adoption rate: At least 20% of active users have used at least 3 different AI models within the first week of measurement.
