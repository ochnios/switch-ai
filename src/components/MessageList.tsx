import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageDto } from "@/types";
import type { DisplayMessage } from "@/types/ui";

interface MessageListProps {
  messages: MessageDto[];
  isLoading: boolean;
  isSending: boolean;
  conversationId: string | null;
}

/**
 * MessageList - Scrollable container for displaying messages
 *
 * Features:
 * - Auto-scrolls to bottom on new messages (only when user is near bottom)
 * - Shows loading skeleton during initial load
 * - Converts MessageDto[] to DisplayMessage[] for rendering
 * - Includes aria-live region for accessibility
 * - Shows loading indicator when sending message
 */
export function MessageList({ messages, isLoading, isSending, conversationId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Convert MessageDto[] to DisplayMessage[]
  const displayMessages: DisplayMessage[] = messages.map((msg) => ({
    type: "message",
    data: msg,
  }));

  // Add loading indicator when sending message
  if (isSending && conversationId) {
    displayMessages.push({
      type: "loading",
      id: "loading-skeleton",
    });
  }

  // Auto-scroll to bottom only when new messages are added
  useEffect(() => {
    const currentLength = displayMessages.length;
    const hasNewMessages = currentLength > prevMessagesLengthRef.current;

    if (hasNewMessages && scrollRef.current) {
      const scrollElement = scrollRef.current;
      const isNearBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 150;

      // Only auto-scroll if user is near the bottom or this is the first message
      if (isNearBottom || prevMessagesLengthRef.current === 0) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: prevMessagesLengthRef.current === 0 ? "auto" : "smooth",
            });
          }
        });
      }
    }

    prevMessagesLengthRef.current = currentLength;
  }, [displayMessages.length]);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto" role="region" aria-label="Messages">
        {/* Spacer to push skeletons to bottom, matching message position */}
        <div className="flex-1" />
        <div className="mx-auto w-full max-w-3xl p-4">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
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
      className="scrollbar-auto-hide flex flex-1 flex-col overflow-y-auto"
      role="region"
      aria-label="Messages"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Spacer to push messages to bottom when there are few */}
      <div className="flex-1" />
      <div className="mx-auto w-full max-w-3xl">
        {displayMessages.map((message) => (
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
