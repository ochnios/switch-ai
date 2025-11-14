import { useAppStore } from "@/stores/useAppStore";
import { useUrlSync } from "./hooks/useUrlSync";
import { SettingsButton } from "./SettingsButton";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationList } from "./ConversationList";

interface ConversationSidebarProps {
  /**
   * Optional callback for when navigation occurs (used to close mobile sheet)
   */
  onNavigate?: () => void;
}

/**
 * ConversationSidebar - Main sidebar container component
 *
 * Responsibilities:
 * - Fetches conversation list on mount
 * - Manages loading/error states
 * - Contains settings button, new conversation button, and conversation list
 */
export function ConversationSidebar({ onNavigate }: ConversationSidebarProps) {
  const {
    conversationsList,
    activeConversationId,
    uiFlags,
    conversationsError,
    fetchConversations,
    setActiveConversation,
    deleteConversation,
  } = useAppStore();

  // Keep store synced with current URL
  useUrlSync();

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    onNavigate?.();
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
  };

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Settings Button at the top */}
      <SettingsButton onNavigate={onNavigate} />

      {/* New Conversation Button */}
      <NewConversationButton onNavigate={onNavigate} />

      {/* Conversation List */}
      <ConversationList
        conversations={conversationsList}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onRetry={fetchConversations}
        isLoading={uiFlags.isLoadingConversations}
        isError={!!conversationsError}
      />
    </div>
  );
}
