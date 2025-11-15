import { AlertCircle } from "lucide-react";
import type { ConversationDto } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConversationListItem } from "./ConversationListItem";

interface ConversationListProps {
  conversations: ConversationDto[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
  isLoading: boolean;
  isError: boolean;
}

/**
 * ConversationList - Renders the conversation list or loading/empty states
 *
 * Displays:
 * - Skeleton loaders during loading
 * - Error state with retry button
 * - Empty state message
 * - List of conversation items
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onRetry,
  isLoading,
  isError,
}: ConversationListProps) {
  // Loading state - show skeletons
  if (isLoading) {
    return (
      <div className="flex-1 space-y-2 overflow-y-auto" role="status" aria-label="Loading conversations">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
        <span className="sr-only">Loading conversations...</span>
      </div>
    );
  }

  // Error state - show error message with retry
  if (isError) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Failed to load conversations</p>
          <p className="text-xs text-muted-foreground">Please try again</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state - no conversations yet
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground">Start a new conversation by clicking the button above!</p>
      </div>
    );
  }

  // Render conversation list
  return (
    <div className="flex-1 overflow-y-auto" role="list" aria-label="Conversations">
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
