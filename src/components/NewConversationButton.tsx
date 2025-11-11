import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/useAppStore";

/**
 * NewConversationButton - Creates a new conversation
 *
 * Clicking sets activeConversationId to null and navigates to /app/new.
 * Button is disabled when activeConversationId is already null.
 */
export function NewConversationButton() {
  const { activeConversationId, setActiveConversation } = useAppStore();

  const handleClick = () => {
    setActiveConversation(null);
  };

  const isDisabled = activeConversationId === null;

  return (
    <Button
      variant="default"
      size="default"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full justify-start gap-2"
      aria-label="New conversation"
    >
      <Plus className="h-4 w-4" />
      <span>New Conversation</span>
    </Button>
  );
}
