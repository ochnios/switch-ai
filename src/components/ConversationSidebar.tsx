import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { SettingsButton } from "./SettingsButton";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationList } from "./ConversationList";

/**
 * ConversationSidebar - Main sidebar container component
 *
 * Responsibilities:
 * - Fetches conversation list on mount
 * - Manages loading/error states
 * - Contains settings button, new conversation button, and conversation list
 */
export function ConversationSidebar() {
  const {
    conversationsList,
    activeConversationId,
    uiFlags,
    conversationsError,
    fetchConversations,
    setActiveConversation,
    deleteConversation,
  } = useAppStore();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
  };

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Settings Button at the top */}
      <SettingsButton />

      {/* New Conversation Button */}
      <NewConversationButton />

      {/* Conversation List */}
      <ConversationList
        conversations={conversationsList}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        isLoading={uiFlags.isLoadingConversations}
        isError={!!conversationsError}
      />
    </div>
  );
}
