import { useMemo } from "react";
import type { MessageDto } from "@/types";

/**
 * Hook to calculate total tokens from the last assistant message
 * in the provided messages array.
 *
 * @param messages - Array of messages to count tokens from
 * @returns Total tokens (prompt + completion) from last assistant message, or 0 if none
 */
export function useTokenCounter(messages: MessageDto[]): number {
  const totalTokens = useMemo(() => {
    // Find the last assistant message
    const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant");

    if (!lastAssistantMessage) return 0;

    // Sum prompt and completion tokens (handle null values)
    const promptTokens = lastAssistantMessage.prompt_tokens || 0;
    const completionTokens = lastAssistantMessage.completion_tokens || 0;

    return promptTokens + completionTokens;
  }, [messages]);

  return totalTokens;
}
