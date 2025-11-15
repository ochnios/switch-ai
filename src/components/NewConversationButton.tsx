import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const { apiKeyExists, uiFlags, setActiveConversation } = useAppStore();
  const [currentPath, setCurrentPath] = useState("");

  // Track URL changes to update button state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePath = () => setCurrentPath(window.location.pathname);

    // Set initial path
    updatePath();

    // Listen for navigation events (View Transitions and regular navigation)
    window.addEventListener("popstate", updatePath);
    document.addEventListener("astro:after-swap", updatePath);

    return () => {
      window.removeEventListener("popstate", updatePath);
      document.removeEventListener("astro:after-swap", updatePath);
    };
  }, []);

  const handleClick = () => {
    setActiveConversation(null);
    onNavigate?.();
  };

  // Check if we're on the /app/new page by checking the actual URL
  const isOnNewPage = currentPath === "/app/new";

  // Disable if:
  // 1. Already on new conversation page (check URL)
  // 2. We've confirmed no API key exists (not loading and apiKeyExists is false)
  const hasNoApiKey = !uiFlags.isLoadingApiKey && !apiKeyExists;
  const isDisabled = isOnNewPage || hasNoApiKey;

  const button = (
    <Button
      variant="default"
      size="default"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full justify-start gap-2"
      aria-label={hasNoApiKey ? "New conversation (API key required)" : "New conversation"}
    >
      <Plus className="h-4 w-4" />
      <span>New Conversation</span>
    </Button>
  );

  // Wrap button in tooltip when disabled due to missing API key
  // Note: Tooltips don't work on disabled buttons, so we wrap it in a span
  if (hasNoApiKey) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-full inline-block">{button}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Configure your API key to start new conversation</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
