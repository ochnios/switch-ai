import { useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook to calculate total tokens from the last assistant message
 * in the current conversation.
 *
 * @param conversationId - ID of the conversation to count tokens for
 * @returns Total tokens (prompt + completion) from last assistant message, or 0 if none
 */
export function useTokenCounter(conversationId: string | null): number {
  // Get messages from cache
  const messagesCache = useAppStore((state) => state.messagesCache);

  const totalTokens = useMemo(() => {
    if (!conversationId) return 0;

    const messages = messagesCache[conversationId] || [];

    // Find the last assistant message
    const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant");

    if (!lastAssistantMessage) return 0;

    // Sum prompt and completion tokens (handle null values)
    const promptTokens = lastAssistantMessage.prompt_tokens || 0;
    const completionTokens = lastAssistantMessage.completion_tokens || 0;

    return promptTokens + completionTokens;
  }, [conversationId, messagesCache]);

  return totalTokens;
}
