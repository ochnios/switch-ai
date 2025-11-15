import { User, Bot, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelBadge } from "./ModelBadge";
import { BranchAction } from "./BranchAction";
import type { DisplayMessage } from "@/types/ui";

interface MessageItemProps {
  message: DisplayMessage;
  conversationId: string | null;
}

/**
 * MessageItem - Renders a single message item
 *
 * Supports three types of display messages:
 * - message: User or assistant messages with content
 * - error: Error messages displayed inline
 * - loading: Loading skeleton for AI response
 *
 * Assistant messages include:
 * - Model badge (if model_name exists)
 * - Branch action button (visible on hover)
 */
export function MessageItem({ message, conversationId }: MessageItemProps) {
  // Loading indicator
  if (message.type === "loading") {
    return (
      <div className="group flex gap-4 px-4 py-6">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="size-4" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Error message
  if (message.type === "error") {
    return (
      <div className="group flex gap-4 border-l-2 border-destructive bg-destructive/5 px-4 py-6">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-4 text-destructive" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="text-sm font-medium text-destructive">Error</div>
          <div className="text-sm text-foreground">{message.content}</div>
        </div>
      </div>
    );
  }

  // Regular message (user or assistant)
  const isUser = message.data.role === "user";

  // User message - bubble style on the right
  if (isUser) {
    return (
      <div className="group flex justify-end gap-3 px-4 py-3">
        {/* Message bubble */}
        <div className="flex max-w-[80%] flex-col gap-2 rounded-2xl bg-muted px-4 py-3">
          <p className="whitespace-pre-wrap leading-relaxed">{message.data.content}</p>
        </div>

        {/* Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-4 text-foreground" />
        </div>
      </div>
    );
  }

  // Assistant message - full width on the left
  return (
    <div className="group flex gap-4 px-4 py-6">
      {/* Avatar */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="size-4" />
      </div>

      {/* Message content */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Header with model badge and branch action */}
        <div className="flex items-center gap-2">
          {message.data.model_name && <ModelBadge modelName={message.data.model_name} />}
          {conversationId && <BranchAction messageId={message.data.id} conversationId={conversationId} />}
        </div>

        {/* Message text - will be replaced with Markdown rendering later */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{message.data.content}</p>
        </div>
      </div>
    </div>
  );
}
