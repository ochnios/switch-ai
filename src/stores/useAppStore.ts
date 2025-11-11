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
} from "@/types";

// ============================================================================
// Types
// ============================================================================

interface UIFlags {
  isLoadingConversations: boolean;
  isDeletingConversation: string | null; // ID of conversation being deleted
  isLoadingApiKey: boolean;
  isLoadingModels: boolean;
}

interface AppState {
  // Active conversation state
  activeConversationId: string | null;

  // Conversations list (first 50, sorted newest first)
  conversationsList: ConversationDto[];

  // API key status
  apiKeyExists: boolean;

  // Available models list
  modelsList: ModelDto[];

  // UI flags
  uiFlags: UIFlags;

  // Error state
  conversationsError: string | null;
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

  // Set active conversation and navigate
  setActiveConversation: (id: string | null) => void;

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
      apiKeyExists: false,
      modelsList: [],
      uiFlags: {
        isLoadingConversations: false,
        isDeletingConversation: null,
        isLoadingApiKey: false,
        isLoadingModels: false,
      },
      conversationsError: null,

      // Actions
      initializeApp: async () => {
        // Sync state from URL first
        get().syncFromUrl();
        // Fetch all initial data in parallel
        await Promise.all([get().fetchApiKeyStatus(), get().fetchModels(), get().fetchConversations()]);
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
      // Only persist conversations list and models list
      // activeConversationId comes from URL
      // apiKeyExists should be fetched fresh
      // uiFlags are transient state
      partialize: (state) => ({
        conversationsList: state.conversationsList,
        modelsList: state.modelsList,
      }),
    }
  )
);
