import { useEffect } from "react";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { ChatContainer } from "./ChatContainer";
import { useAppStore } from "@/stores/useAppStore";

interface ChatPanelViewProps {
  conversationId: string | null;
}

/**
 * ChatPanelView - Main chat panel view component
 *
 * Responsibilities:
 * - Fetches messages for the conversation on mount
 * - Orchestrates MessageList and Composer components
 * - Handles loading and error states
 *
 * Note: Active conversation ID is synced by the store's syncFromUrl() method,
 * not by this component, to avoid infinite navigation loops.
 */
export function ChatPanelView({ conversationId }: ChatPanelViewProps) {
  const fetchMessages = useAppStore((state) => state.fetchMessages);

  // Fetch messages for the conversation on mount or when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  return (
    <ChatContainer>
      <MessageList conversationId={conversationId} />
      <Composer />
    </ChatContainer>
  );
}
