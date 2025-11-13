import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import type {
  ConversationDto,
  PaginatedConversationsDto,
  ErrorResponseDto,
  ApiKeyExistsDto,
  ModelDto,
  ModelsListDto,
  MessageDto,
  PaginatedMessagesDto,
  SendMessageCommand,
  CreateConversationFromMessageCommand,
  ConversationWithMessagesDto,
  CreateBranchCommand,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

interface UIFlags {
  isLoadingConversations: boolean;
  isDeletingConversation: string | null; // ID of conversation being deleted
  isLoadingApiKey: boolean;
  isLoadingModels: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isBranching: boolean;
}

interface AppState {
  // Active conversation state
  activeConversationId: string | null;

  // Conversations list (first 50, sorted newest first)
  conversationsList: ConversationDto[];

  // Messages cache per conversation ID
  messagesCache: Record<string, MessageDto[]>;

  // API key status
  apiKeyExists: boolean;

  // Available models list
  modelsList: ModelDto[];

  // Last used model ID (persisted to localStorage)
  lastUsedModel: string | null;

  // UI flags
  uiFlags: UIFlags;

  // Error state
  conversationsError: string | null;

  // Initialization flag to prevent redundant fetches
  isInitialized: boolean;
}

interface AppActions {
  // Initialize app (fetch API key status, models, conversations)
  initializeApp: () => Promise<void>;

  // Sync active conversation ID from current URL
  syncFromUrl: () => void;

  // Fetch API key status
  fetchApiKeyStatus: () => Promise<void>;

  // Fetch available models
  fetchModels: () => Promise<void>;

  // Fetch conversations list
  fetchConversations: () => Promise<void>;

  // Fetch messages for a conversation
  fetchMessages: (conversationId: string) => Promise<void>;

  // Send message (handles both new and existing conversations)
  sendMessage: (cmd: SendMessageCommand | CreateConversationFromMessageCommand) => Promise<void>;

  // Create branch from a message
  createBranch: (conversationId: string, messageId: string, type: "full" | "summary") => Promise<void>;

  // Set active conversation and navigate
  setActiveConversation: (id: string | null) => void;

  // Set last used model
  setLastUsedModel: (modelId: string) => void;

  // Delete conversation
  deleteConversation: (id: string) => Promise<void>;

  // Check if a conversation exists in the list
  conversationExists: (id: string) => boolean;
}

type AppStore = AppState & AppActions;

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeConversationId: null,
      conversationsList: [],
      messagesCache: {},
      apiKeyExists: false,
      modelsList: [],
      lastUsedModel: null,
      uiFlags: {
        isLoadingConversations: false,
        isDeletingConversation: null,
        isLoadingApiKey: false,
        isLoadingModels: false,
        isLoadingMessages: false,
        isSendingMessage: false,
        isBranching: false,
      },
      conversationsError: null,
      isInitialized: false,

      // Actions
      initializeApp: async () => {
        // Skip initialization if already initialized
        if (get().isInitialized) {
          // Only sync URL state on subsequent calls
          get().syncFromUrl();
          return;
        }

        // Sync state from URL first
        get().syncFromUrl();
        // Fetch all initial data in parallel
        await Promise.all([get().fetchApiKeyStatus(), get().fetchModels(), get().fetchConversations()]);
        // Mark as initialized
        set({ isInitialized: true });
      },

      syncFromUrl: () => {
        if (typeof window === "undefined") return;

        const path = window.location.pathname;
        const currentActiveId = get().activeConversationId;

        // Extract conversation ID from URL pattern: /app/conversations/:id
        const conversationMatch = path.match(/^\/app\/conversations\/([^/]+)$/);
        if (conversationMatch) {
          const conversationId = conversationMatch[1];

          // Only update state if it actually changed (prevent unnecessary re-renders)
          if (currentActiveId !== conversationId) {
            // Validate conversation ID format (UUID v4 pattern)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const isValidUUID = uuidPattern.test(conversationId);

            if (isValidUUID) {
              set({ activeConversationId: conversationId });
            } else {
              // Invalid conversation ID - navigate to new conversation
              // eslint-disable-next-line no-console
              console.warn(`Invalid conversation ID in URL: ${conversationId}`);
              get().setActiveConversation(null);
            }
          }
          return;
        }

        // Check if we're on the new conversation page
        if (path === "/app/new") {
          // Only update if state needs to change
          if (currentActiveId !== null) {
            set({ activeConversationId: null });
          }
          return;
        }

        // For any other /app/* route (like settings), keep the current state
        // This prevents resetting activeConversationId when navigating to settings
      },

      fetchApiKeyStatus: async () => {
        set({
          uiFlags: { ...get().uiFlags, isLoadingApiKey: true },
        });

        try {
          const response = await fetch("/api/api-key");

          if (!response.ok) {
            throw new Error("Failed to check API key status");
          }

          const data: ApiKeyExistsDto = await response.json();

          set({
            apiKeyExists: data.exists,
            uiFlags: { ...get().uiFlags, isLoadingApiKey: false },
          });
        } catch {
          // Silently fail - assume no API key
          set({
            apiKeyExists: false,
            uiFlags: { ...get().uiFlags, isLoadingApiKey: false },
          });
        }
      },

      fetchModels: async () => {
        set({
          uiFlags: { ...get().uiFlags, isLoadingModels: true },
        });

        try {
          const response = await fetch("/api/models");

          if (!response.ok) {
            throw new Error("Failed to fetch models");
          }

          const data: ModelsListDto = await response.json();

          set({
            modelsList: data.data,
            uiFlags: { ...get().uiFlags, isLoadingModels: false },
          });
        } catch {
          // Silently fail - empty models list
          set({
            modelsList: [],
            uiFlags: { ...get().uiFlags, isLoadingModels: false },
          });
        }
      },

      fetchConversations: async () => {
        set({
          uiFlags: { ...get().uiFlags, isLoadingConversations: true },
          conversationsError: null,
        });

        try {
          const response = await fetch("/api/conversations?page=1&pageSize=50");

          if (!response.ok) {
            const error: ErrorResponseDto = await response.json();
            throw new Error(error.message);
          }

          const data: PaginatedConversationsDto = await response.json();

          set({
            conversationsList: data.data,
            uiFlags: { ...get().uiFlags, isLoadingConversations: false },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to load conversations";

          set({
            conversationsError: errorMessage,
            uiFlags: { ...get().uiFlags, isLoadingConversations: false },
          });

          // Show error toast notification
          toast.error("Failed to load conversations");
        }
      },

      setActiveConversation: (id: string | null) => {
        set({ activeConversationId: id });

        // Navigate to the appropriate route using Astro's View Transitions
        const targetUrl = id === null ? "/app/new" : `/app/conversations/${id}`;

        // Use native navigation with View Transitions support
        if (typeof window !== "undefined" && "startViewTransition" in document) {
          // Browser supports View Transitions
          import("astro:transitions/client").then(({ navigate }) => {
            navigate(targetUrl);
          });
        } else {
          // Fallback for browsers without View Transitions support
          window.location.href = targetUrl;
        }
      },

      fetchMessages: async (conversationId: string) => {
        set({
          uiFlags: { ...get().uiFlags, isLoadingMessages: true },
        });

        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages?page=1&pageSize=50`);

          if (!response.ok) {
            const error: ErrorResponseDto = await response.json();
            throw new Error(error.message);
          }

          const data: PaginatedMessagesDto = await response.json();

          set({
            messagesCache: {
              ...get().messagesCache,
              [conversationId]: data.data,
            },
            uiFlags: { ...get().uiFlags, isLoadingMessages: false },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to load messages";

          set({
            uiFlags: { ...get().uiFlags, isLoadingMessages: false },
          });

          toast.error(errorMessage);
        }
      },

      sendMessage: async (cmd: SendMessageCommand | CreateConversationFromMessageCommand) => {
        const { activeConversationId, messagesCache } = get();

        set({
          uiFlags: { ...get().uiFlags, isSendingMessage: true },
        });

        // Optimistic update: Add user message and loading indicator
        const tempUserId = `temp-user-${Date.now()}`;

        const tempUserMessage: MessageDto = {
          id: tempUserId,
          role: "user",
          content: cmd.content,
          created_at: new Date().toISOString(),
          model_name: null,
          prompt_tokens: null,
          completion_tokens: null,
        };

        if (activeConversationId) {
          // Add optimistic messages to existing conversation
          set({
            messagesCache: {
              ...messagesCache,
              [activeConversationId]: [...(messagesCache[activeConversationId] || []), tempUserMessage],
            },
          });
        }

        try {
          if (activeConversationId === null) {
            // Create new conversation
            const response = await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cmd),
            });

            if (!response.ok) {
              const error: ErrorResponseDto = await response.json();
              throw new Error(error.message);
            }

            const data: ConversationWithMessagesDto = await response.json();

            // Update conversations list
            set({
              conversationsList: [data.conversation, ...get().conversationsList],
              messagesCache: {
                ...get().messagesCache,
                [data.conversation.id]: data.messages,
              },
              uiFlags: { ...get().uiFlags, isSendingMessage: false },
            });

            // Save last used model
            get().setLastUsedModel(cmd.model);

            // Navigate to new conversation
            get().setActiveConversation(data.conversation.id);
          } else {
            // Send message to existing conversation
            const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cmd),
            });

            if (!response.ok) {
              const error: ErrorResponseDto = await response.json();
              // Check if it's a message send error (402, 502)
              if (response.status === 402 || response.status === 502) {
                // Remove loading, add error message to chat
                const errorMessageId = `error-${Date.now()}`;
                const currentMessages = messagesCache[activeConversationId] || [];
                const messagesWithoutTemp = currentMessages.filter((msg) => msg.id !== tempUserId);

                set({
                  messagesCache: {
                    ...messagesCache,
                    [activeConversationId]: messagesWithoutTemp,
                  },
                  uiFlags: { ...get().uiFlags, isSendingMessage: false },
                });

                throw { isMessageError: true, id: errorMessageId, message: error.message };
              }
              throw new Error(error.message);
            }

            const data: MessageDto[] = await response.json();

            // Replace temp messages with real ones
            const currentMessages = messagesCache[activeConversationId] || [];
            const messagesWithoutTemp = currentMessages.filter((msg) => msg.id !== tempUserId);

            set({
              messagesCache: {
                ...messagesCache,
                [activeConversationId]: [...messagesWithoutTemp, ...data],
              },
              uiFlags: { ...get().uiFlags, isSendingMessage: false },
            });

            // Save last used model
            get().setLastUsedModel(cmd.model);
          }
        } catch (error: unknown) {
          // Handle message send errors (402, 502) vs other errors
          if (typeof error === "object" && error !== null && "isMessageError" in error) {
            // Error already handled above - message already removed from cache
          } else {
            // Remove optimistic update on error
            if (activeConversationId) {
              const currentMessages = messagesCache[activeConversationId] || [];
              const messagesWithoutTemp = currentMessages.filter((msg) => msg.id !== tempUserId);

              set({
                messagesCache: {
                  ...messagesCache,
                  [activeConversationId]: messagesWithoutTemp,
                },
                uiFlags: { ...get().uiFlags, isSendingMessage: false },
              });
            } else {
              set({
                uiFlags: { ...get().uiFlags, isSendingMessage: false },
              });
            }

            const errorMessage = error instanceof Error ? error.message : "Failed to send message";
            toast.error(errorMessage);
          }
        }
      },

      createBranch: async (conversationId: string, messageId: string, type: "full" | "summary") => {
        set({
          uiFlags: { ...get().uiFlags, isBranching: true },
        });

        const toastId = toast.loading("Creating branch...");

        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages/${messageId}/branch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type } as CreateBranchCommand),
          });

          if (!response.ok) {
            const error: ErrorResponseDto = await response.json();
            throw new Error(error.message);
          }

          const data: ConversationDto = await response.json();

          // Update conversations list
          set({
            conversationsList: [data, ...get().conversationsList],
            uiFlags: { ...get().uiFlags, isBranching: false },
          });

          toast.success("Branch created successfully", { id: toastId });

          // Navigate to new conversation
          get().setActiveConversation(data.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create branch";

          set({
            uiFlags: { ...get().uiFlags, isBranching: false },
          });

          toast.error(errorMessage, { id: toastId });
        }
      },

      setLastUsedModel: (modelId: string) => {
        set({ lastUsedModel: modelId });
      },

      deleteConversation: async (id: string) => {
        const { activeConversationId, conversationsList } = get();

        set({
          uiFlags: { ...get().uiFlags, isDeletingConversation: id },
        });

        try {
          const response = await fetch(`/api/conversations/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const error: ErrorResponseDto = await response.json();
            throw new Error(error.message);
          }

          // Remove conversation from list
          set({
            conversationsList: conversationsList.filter((conv) => conv.id !== id),
            uiFlags: { ...get().uiFlags, isDeletingConversation: null },
          });

          // If deleted conversation was active, navigate to new chat
          if (id === activeConversationId) {
            get().setActiveConversation(null);
          }

          // Show success toast
          toast.success("Conversation deleted");
        } catch {
          set({
            uiFlags: { ...get().uiFlags, isDeletingConversation: null },
          });

          // Show error toast
          toast.error("Failed to delete conversation");
        }
      },

      conversationExists: (id: string) => {
        return get().conversationsList.some((conv) => conv.id === id);
      },
    }),
    {
      name: "switch-ai-storage",
      // Only persist conversations list, models list, and last used model
      // activeConversationId comes from URL
      // apiKeyExists should be fetched fresh on each page load
      // isInitialized is session-based (in-memory only) - resets on page reload
      // uiFlags are transient state
      // messagesCache is fetched on demand
      partialize: (state) => ({
        conversationsList: state.conversationsList,
        modelsList: state.modelsList,
        lastUsedModel: state.lastUsedModel,
      }),
    }
  )
);
