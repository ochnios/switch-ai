interface TokenCounterProps {
  totalTokens: number;
}

/**
 * TokenCounter - Displays the estimated number of tokens
 * for the current conversation.
 *
 * Shows tokens from the last assistant message in the format
 * "X tokens" with muted styling.
 */
export function TokenCounter({ totalTokens }: TokenCounterProps) {
  if (totalTokens === 0) return null;

  return (
    <span className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
      {totalTokens.toLocaleString()} tokens
    </span>
  );
}
