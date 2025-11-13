import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/useAppStore";

interface NewConversationButtonProps {
  /**
   * Optional callback for when navigation occurs (used to close mobile sheet)
   */
  onNavigate?: () => void;
}

/**
 * NewConversationButton - Creates a new conversation
 *
 * Clicking sets activeConversationId to null and navigates to /app/new.
 * Button is disabled when:
 * - Already on the /app/new page
 * - No API key exists (confirmed after loading - apiKeyExists is false AND not loading)
 */
export function NewConversationButton({ onNavigate }: NewConversationButtonProps) {
  const { apiKeyExists, uiFlags, activeConversationId, setActiveConversation } = useAppStore();

  const handleClick = () => {
    setActiveConversation(null);
    onNavigate?.();
  };

  // Check if we're on the /app/new page
  const isOnNewPage = activeConversationId === null;

  // Disable if:
  // 1. Already on new conversation page (check URL)
  // 2. We've confirmed no API key exists (not loading and apiKeyExists is false)
  const hasNoApiKey = !uiFlags.isLoadingApiKey && !apiKeyExists;
  const isDisabled = isOnNewPage || hasNoApiKey;

  return (
    <Button
      variant="default"
      size="default"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full justify-start gap-2"
      aria-label={hasNoApiKey ? "New conversation (API key required)" : "New conversation"}
      title={hasNoApiKey ? "Please configure your API key in settings first" : undefined}
    >
      <Plus className="h-4 w-4" />
      <span>New Conversation</span>
    </Button>
  );
}
