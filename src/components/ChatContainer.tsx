import { useFocusOnNavigate } from "./hooks/useFocusOnNavigate";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ChatContainer - Main chat area container with focus management
 *
 * Responsibilities:
 * - Provide a focusable container for the main chat area
 * - Automatically focus on navigation for accessibility
 * - Serve as landmark for screen readers
 */
export function ChatContainer({ children, className }: ChatContainerProps) {
  const activeConversationId = useAppStore((state) => state.activeConversationId);

  // Focus this element when conversation changes (accessibility)
  const containerRef = useFocusOnNavigate<HTMLDivElement>([activeConversationId]);

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full flex-col outline-none", className)}
      tabIndex={-1}
      role="region"
      aria-label={activeConversationId === null ? "New conversation chat area" : "Conversation chat area"}
    >
      {children}
    </div>
  );
}
