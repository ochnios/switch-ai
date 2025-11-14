import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { MessageDto, PaginatedMessagesDto, ErrorResponseDto } from "@/types";

/**
 * useConversationMessages - Hook for managing messages in the active conversation
 *
 * This hook handles:
 * - Fetching messages when conversation ID changes
 * - Maintaining local messages state
 * - Providing methods to update messages (for optimistic updates)
 * - Loading states
 *
 * No caching - messages are fetched fresh when conversation changes
 */
export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages when conversation ID changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages?page=1&pageSize=50`);

        if (!response.ok) {
          const error: ErrorResponseDto = await response.json();
          throw new Error(error.message);
        }

        const data: PaginatedMessagesDto = await response.json();
        setMessages(data.data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load messages";
        toast.error(errorMessage);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Callback to add messages (used by useSendMessage for optimistic updates)
  const addMessages = useCallback((newMessages: MessageDto[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  }, []);

  // Callback to replace temp message with real ones (after API response)
  const replaceMessages = useCallback((oldId: string, newMessages: MessageDto[]) => {
    setMessages((prev) => {
      const withoutTemp = prev.filter((msg) => msg.id !== oldId);
      return [...withoutTemp, ...newMessages];
    });
  }, []);

  // Callback to remove a message by ID (for error rollback)
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    addMessages,
    replaceMessages,
    removeMessage,
  };
}

