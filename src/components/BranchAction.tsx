import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/stores/useAppStore";

interface BranchActionProps {
  messageId: string;
  conversationId: string;
}

/**
 * BranchAction - Dropdown menu for creating conversation branches
 *
 * Features:
 * - Button with git-branch icon
 * - Two branching options: full history and summary
 * - Disabled state during branch creation
 * - Calls Zustand action to create branch
 */
export function BranchAction({ messageId, conversationId }: BranchActionProps) {
  const isBranching = useAppStore((state) => state.uiFlags.isBranching);
  const createBranch = useAppStore((state) => state.createBranch);

  const handleCreateBranch = (type: "full" | "summary") => {
    createBranch(conversationId, messageId, type);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
          disabled={isBranching}
          aria-label="Create branch from this message"
        >
          <GitBranch className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleCreateBranch("full")} disabled={isBranching}>
          <GitBranch className="size-4" />
          Create branch with full history
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreateBranch("summary")} disabled={isBranching}>
          <GitBranch className="size-4" />
          Create branch with summary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
