import { useState } from "react";
import { Trash2, Check } from "lucide-react";
import type { ConversationDto } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationListItemProps {
  conversation: ConversationDto;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * ConversationListItem - Single conversation item with two-step delete
 *
 * Features:
 * - Displays conversation title and formatted date
 * - Highlights when active
 * - Two-step delete confirmation (Trash2 → Check)
 * - Cancels delete on blur or on clicking the conversation
 */
export function ConversationListItem({ conversation, isActive, onSelect, onDelete }: ConversationListItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleClick = () => {
    // Reset delete confirmation when selecting conversation
    setIsConfirmingDelete(false);
    onSelect(conversation.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConfirmingDelete) {
      // First click - show confirmation
      setIsConfirmingDelete(true);
    } else {
      // Second click - confirm delete
      onDelete(conversation.id);
      setIsConfirmingDelete(false);
    }
  };

  const handleDeleteBlur = () => {
    // Cancel delete confirmation on blur
    setIsConfirmingDelete(false);
  };

  // Format date to relative time or readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Get display title with fallback for untitled conversations
  const displayTitle = conversation.title?.trim() || "Untitled Conversation";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
        "hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent"
      )}
      role="listitem"
    >
      {/* Main conversation button */}
      <Button
        variant="ghost"
        className={cn(
          "flex-1 justify-start gap-2 overflow-hidden text-left hover:bg-transparent",
          "h-auto min-h-[2.5rem] p-0"
        )}
        onClick={handleClick}
        aria-selected={isActive}
        aria-label={`Select conversation: ${displayTitle}`}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <span
            className={cn(
              "truncate text-sm font-medium",
              conversation.title?.trim() ? "text-sidebar-foreground" : "text-muted-foreground italic"
            )}
          >
            {displayTitle}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(conversation.created_at)}</span>
        </div>
      </Button>

      {/* Delete button with two-step confirmation */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
          isConfirmingDelete && "bg-destructive text-destructive-foreground opacity-100 hover:bg-destructive/90"
        )}
        onClick={handleDeleteClick}
        onBlur={handleDeleteBlur}
        aria-label={isConfirmingDelete ? "Confirm delete conversation" : "Delete conversation"}
      >
        {isConfirmingDelete ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
