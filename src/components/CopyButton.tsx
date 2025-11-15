import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyButtonProps {
  content: string;
}

/**
 * CopyButton - Button to copy message content to clipboard
 *
 * Features:
 * - Copies content to clipboard using Clipboard API
 * - Shows success toast notification
 * - Temporarily changes icon to checkmark on success
 * - Visible on message hover (via group-hover)
 */
export function CopyButton({ content }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success("Copied to clipboard");

      // Reset icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
      aria-label="Copy message to clipboard"
    >
      {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
