# Application - switch-ai (MVP)

## Main Problem

Users of advanced language models (LLM) face two key problems in standard chat interfaces:

1. **Lack of flexibility in model selection:** Different AI models have different specializations. Switching between them requires opening multiple tabs and manually copying conversation context, which is inconvenient and disrupts workflow.
2. **Conversation linearity:** Exploring alternative ideas or asking follow-up questions within one conversation is difficult. Current solutions force users to "clutter" the main thread or start a new conversation from scratch, leading to context loss. Only a few of them allow creating conversation branches.

`switch-ai` aims to solve these problems by creating a single, fluid interface that enables both dynamic AI model switching and easy creation of new, intelligently managed conversation threads.

## Minimum Feature Set

The MVP includes the following features:

1. **Chat interface:** Simple, clear interface for conducting conversations with AI.
2. **Per-message model switching:** Ability to select a language model for each sent message.
3. **Conversation list:** Display of historical conversations for logged-in users, with the ability to switch between them and create new ones.
4. **Starting new threads ("branching"):** Each message in a conversation has an option to create a new, separate thread, which offers two modes:
   * **Full history:** New thread is created as a copy of the entire conversation so far.
   * **Summary thread:** The application automatically generates a summary of the current conversation and uses it as the starting context for the new thread.
5. **User authentication:** Simple registration and login to store conversation history assigned to the user.

## What is NOT included in MVP

The following features are consciously omitted in the first version to focus on core value:

* Complex conversation visualization in tree form
* Ability to attach files (images, documents, audio)
* Assistant response streaming
* Internet search integration
* Conversation sharing and exporting
* Support for multiple conversations simultaneously in one view (e.g., in tabs)

## Success Criteria

The MVP will be considered successful when the following functional criteria are met:

1. **Application is fully functional:** Users can create an account, log in, and use the application
2. **Key features work flawlessly:**
   * Users can seamlessly switch AI models during one conversation.
   * The function of creating new threads (both by copying history and by summarizing it) works reliably.
   * Conversation management (starting new, browsing list, switching, deleting) works reliably.
