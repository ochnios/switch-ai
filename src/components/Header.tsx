import { useState } from "react";
import { Menu, Settings, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConversationSidebar } from "./ConversationSidebar";
import { useAppStore } from "@/stores/useAppStore";
import { useUrlSync } from "./hooks/useUrlSync";

/**
 * Header - Global header component
 *
 * Responsibilities:
 * - Display hamburger menu for mobile sidebar
 * - Show API key status indicator
 * - Provide settings access
 */
export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { apiKeyExists, uiFlags } = useAppStore();

  // Keep store synced with current URL
  useUrlSync();

  const handleSettingsClick = () => {
    // Navigate to settings page using View Transitions
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/app/settings");
      });
    } else {
      window.location.href = "/app/settings";
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      {/* Mobile hamburger menu */}
      <div className="flex items-center gap-2">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open conversation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <ConversationSidebar onNavigate={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold">switch-ai</h1>
      </div>

      {/* Right side: API key status + Settings */}
      <div className="flex items-center gap-2">
        {/* API Key Status Indicator */}
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
          role="status"
          aria-label={
            uiFlags.isLoadingApiKey
              ? "Checking API key status"
              : apiKeyExists
                ? "API key configured"
                : "API key missing"
          }
        >
          {uiFlags.isLoadingApiKey ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          ) : apiKeyExists ? (
            <Unlock className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4 text-destructive" aria-hidden="true" />
          )}
          <span className="hidden text-muted-foreground sm:inline">
            {uiFlags.isLoadingApiKey ? "Checking..." : apiKeyExists ? "API Key" : "No API Key"}
          </span>
        </div>

        {/* Settings button */}
        <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Open settings">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
