import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { ChatContainer } from "./ChatContainer";
import { useConversationMessages } from "./hooks/useConversationMessages";
import { useSendMessage } from "./hooks/useSendMessage";
import { useTokenCounter } from "./hooks/useTokenCounter";

interface ChatPanelViewProps {
  conversationId: string | null;
}

/**
 * ChatPanelView - Main chat panel view component
 *
 * Responsibilities:
 * - Manages messages state for the active conversation (local state)
 * - Orchestrates MessageList and Composer components
 * - Handles message sending via hooks
 * - Handles loading and error states
 *
 * Note: Active conversation ID is synced by the store's syncFromUrl() method,
 * not by this component, to avoid infinite navigation loops.
 */
export function ChatPanelView({ conversationId }: ChatPanelViewProps) {
  // Local messages state for the active conversation
  const { messages, isLoading, addMessages, replaceMessages, removeMessage } = useConversationMessages(conversationId);

  // Send message hook with optimistic updates
  const { sendMessage, isSending } = useSendMessage({
    conversationId,
    onMessagesUpdate: replaceMessages,
    onMessageAdd: (message) => addMessages([message]),
    onMessageRemove: removeMessage,
  });

  // Calculate total tokens from messages
  const totalTokens = useTokenCounter(messages);

  return (
    <ChatContainer>
      <MessageList messages={messages} isLoading={isLoading} isSending={isSending} conversationId={conversationId} />
      <Composer onSendMessage={sendMessage} isSending={isSending} totalTokens={totalTokens} />
    </ChatContainer>
  );
}
