import { useEffect, useState } from "react";
import { Menu, Settings, Lock, Unlock, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { apiKeyExists, uiFlags, initializeApp, user, isAuthenticated, logout } = useAppStore();

  // Initialize app on mount (fetch API key, models, conversations)
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

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

  const handleHomeClick = () => {
    // Navigate to home page using View Transitions
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/");
      });
    } else {
      window.location.href = "/";
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

        <Button
          variant="ghost"
          className="h-auto p-0 text-lg font-semibold hover:bg-transparent"
          onClick={handleHomeClick}
          aria-label="Go to home page"
        >
          switch-ai
        </Button>
      </div>

      {/* Right side: API key status + Settings + User menu */}
      <div className="flex items-center gap-2">
        {/* API Key Status Indicator */}
        {isAuthenticated && (
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
        )}

        {/* Settings button */}
        {isAuthenticated && (
          <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Open settings">
            <Settings className="h-5 w-5" />
          </Button>
        )}

        {/* User menu / Auth buttons */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="User menu">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Account</p>
                  {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} disabled={uiFlags.isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{uiFlags.isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined" && "startViewTransition" in document) {
                import("astro:transitions/client").then(({ navigate }) => {
                  navigate("/auth/login");
                });
              } else {
                window.location.href = "/auth/login";
              }
            }}
            aria-label="Sign in"
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
