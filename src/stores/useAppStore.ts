import { create } from "zustand";
import { toast } from "sonner";
import type { ConversationDto, PaginatedConversationsDto, ErrorResponseDto } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface UIFlags {
  isLoadingConversations: boolean;
  isDeletingConversation: string | null; // ID of conversation being deleted
}

interface AppState {
  // Active conversation state
  activeConversationId: string | null;

  // Conversations list (first 50, sorted newest first)
  conversationsList: ConversationDto[];

  // UI flags
  uiFlags: UIFlags;

  // Error state
  conversationsError: string | null;
}

interface AppActions {
  // Fetch conversations list
  fetchConversations: () => Promise<void>;

  // Set active conversation and navigate
  setActiveConversation: (id: string | null) => void;

  // Delete conversation
  deleteConversation: (id: string) => Promise<void>;
}

type AppStore = AppState & AppActions;

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  activeConversationId: null,
  conversationsList: [],
  uiFlags: {
    isLoadingConversations: false,
    isDeletingConversation: null,
  },
  conversationsError: null,

  // Actions
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

    // Navigate to the appropriate route
    if (id === null) {
      window.location.href = "/app/new";
    } else {
      window.location.href = `/app/conversations/${id}`;
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
}));
