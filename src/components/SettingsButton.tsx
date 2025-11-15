import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsButtonProps {
  /**
   * Optional callback for when navigation occurs (used to close mobile sheet)
   */
  onNavigate?: () => void;
}

/**
 * SettingsButton - Opens API key settings modal
 *
 * Located at the very top of the sidebar.
 * Clicking opens the settings modal or navigates to /app/settings.
 */
export function SettingsButton({ onNavigate }: SettingsButtonProps) {
  const handleClick = () => {
    // Navigate to settings page using View Transitions
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/app/settings");
        onNavigate?.();
      });
    } else {
      window.location.href = "/app/settings";
      onNavigate?.();
    }
  };

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleClick}
      className="w-full justify-start gap-2"
      aria-label="Open settings"
    >
      <Settings className="h-4 w-4" />
      <span>Settings</span>
    </Button>
  );
}
