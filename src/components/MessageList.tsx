import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/stores/useAppStore";
import type { DisplayMessage } from "@/types/ui";

interface MessageListProps {
  conversationId: string | null;
}

/**
 * MessageList - Scrollable container for displaying messages
 *
 * Features:
 * - Auto-scrolls to bottom on new messages
 * - Shows loading skeleton during initial load
 * - Converts MessageDto[] to DisplayMessage[] for rendering
 * - Includes aria-live region for accessibility
 * - Shows loading indicator when sending message
 */
export function MessageList({ conversationId }: MessageListProps) {
  const messagesCache = useAppStore((state) => state.messagesCache);
  const isLoadingMessages = useAppStore((state) => state.uiFlags.isLoadingMessages);
  const isSendingMessage = useAppStore((state) => state.uiFlags.isSendingMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = conversationId ? messagesCache[conversationId] || [] : [];

  // Convert MessageDto[] to DisplayMessage[]
  const displayMessages: DisplayMessage[] = messages.map((msg) => ({
    type: "message",
    data: msg,
  }));

  // Add loading indicator when sending message
  if (isSendingMessage && conversationId) {
    displayMessages.push({
      type: "loading",
      id: "loading-skeleton",
    });
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length]);

  // Loading state - show skeleton
  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" role="region" aria-label="Messages">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Empty state - new conversation
  if (displayMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4" role="region" aria-label="Messages">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Start a new conversation</p>
          <p className="text-sm text-muted-foreground">Select a model and type your message below</p>
        </div>
      </div>
    );
  }

  // Messages list
  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col overflow-y-auto"
      role="region"
      aria-label="Messages"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="mx-auto w-full max-w-3xl">
        {displayMessages.map((message, index) => (
          <MessageItem
            key={message.type === "message" ? message.data.id : message.id}
            message={message}
            conversationId={conversationId}
          />
        ))}
      </div>
    </div>
  );
}
