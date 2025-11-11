import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SettingsButton - Opens API key settings modal
 *
 * Located at the very top of the sidebar.
 * Clicking opens the settings modal or navigates to /app/settings.
 */
export function SettingsButton() {
  const handleClick = () => {
    // TODO: Implement settings modal or navigation
    // For now, navigate to settings page
    window.location.href = "/app/settings";
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
