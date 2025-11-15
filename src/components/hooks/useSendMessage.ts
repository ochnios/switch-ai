import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import type {
  MessageDto,
  SendMessageCommand,
  CreateConversationFromMessageCommand,
  ErrorResponseDto,
  ConversationWithMessagesDto,
} from "@/types";

interface UseSendMessageOptions {
  conversationId: string | null;
  onMessagesUpdate: (oldId: string, newMessages: MessageDto[]) => void;
  onMessageAdd: (message: MessageDto) => void;
  onMessageRemove: (messageId: string) => void;
}

/**
 * useSendMessage - Hook for sending messages
 *
 * This hook handles:
 * - Sending messages to new conversations (creates conversation)
 * - Sending messages to existing conversations
 * - Optimistic updates via callbacks
 * - Error handling and rollback
 * - Coordination with global store for conversation management
 */
export function useSendMessage({
  conversationId,
  onMessagesUpdate,
  onMessageAdd,
  onMessageRemove,
}: UseSendMessageOptions) {
  const [isSending, setIsSending] = useState(false);

  // Global store actions
  const setActiveConversation = useAppStore((state) => state.setActiveConversation);
  const addConversationToList = useAppStore((state) => state.addConversationToList);
  const setLastUsedModel = useAppStore((state) => state.setLastUsedModel);

  const sendMessage = useCallback(
    async (cmd: SendMessageCommand | CreateConversationFromMessageCommand) => {
      setIsSending(true);

      // Create temporary user message for optimistic update
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

      // Only add optimistic message if we have an active conversation
      if (conversationId) {
        onMessageAdd(tempUserMessage);
      }

      try {
        if (conversationId === null) {
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

          // Add conversation to global list
          addConversationToList(data.conversation);

          // Save last used model
          setLastUsedModel(cmd.model);

          // Navigate to new conversation (messages will be fetched automatically via useEffect)
          setActiveConversation(data.conversation.id);
        } else {
          // Send message to existing conversation
          const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cmd),
          });

          if (!response.ok) {
            const error: ErrorResponseDto = await response.json();

            // Remove optimistic message
            onMessageRemove(tempUserId);

            // For API errors (402, 502), the error is already handled by the API
            // Just show the error message to the user
            throw new Error(error.message);
          }

          const data: MessageDto[] = await response.json();

          // Replace temp message with real messages
          onMessagesUpdate(tempUserId, data);

          // Save last used model
          setLastUsedModel(cmd.model);
        }
      } catch (error) {
        // Remove optimistic update on error (if conversation exists)
        if (conversationId) {
          onMessageRemove(tempUserId);
        }

        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        toast.error(errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [
      conversationId,
      onMessagesUpdate,
      onMessageAdd,
      onMessageRemove,
      setActiveConversation,
      addConversationToList,
      setLastUsedModel,
    ]
  );

  return {
    sendMessage,
    isSending,
  };
}
