import { Sparkles } from "lucide-react";

interface ModelBadgeProps {
  modelName: string;
}

/**
 * ModelBadge - Displays the AI model name for assistant messages
 *
 * Shows a small badge with sparkles icon and model name
 * to indicate which model generated the response.
 */
export function ModelBadge({ modelName }: ModelBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Sparkles className="size-3" />
      <span>{modelName}</span>
    </div>
  );
}
