import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "./ModelSelector";
import { TokenCounter } from "./TokenCounter";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import type { SendMessageCommand, CreateConversationFromMessageCommand } from "@/types";

interface ComposerProps {
  onSendMessage: (cmd: SendMessageCommand | CreateConversationFromMessageCommand) => Promise<void>;
  isSending: boolean;
  totalTokens: number;
}

/**
 * Composer - Bottom panel for composing and sending messages
 *
 * Features:
 * - Model selection via combobox
 * - Auto-resizing textarea for message input
 * - Send button with loading/disabled states
 * - Token counter for current conversation
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Remembers last used model
 */
export function Composer({ onSendMessage, isSending, totalTokens }: ComposerProps) {
  const modelsList = useAppStore((state) => state.modelsList);
  const lastUsedModel = useAppStore((state) => state.lastUsedModel);
  const isLoadingModels = useAppStore((state) => state.uiFlags.isLoadingModels);

  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize selected model from lastUsedModel or first available model
  useEffect(() => {
    if (modelsList.length === 0) return;

    // If we already have a selected model, keep it
    if (selectedModel && modelsList.some((m) => m.id === selectedModel)) {
      return;
    }

    // Try to use lastUsedModel if it exists in the list
    if (lastUsedModel && modelsList.some((m) => m.id === lastUsedModel)) {
      setSelectedModel(lastUsedModel);
      return;
    }

    // Otherwise use the first model
    setSelectedModel(modelsList[0].id);
  }, [modelsList, lastUsedModel, selectedModel]);

  const handleSubmit = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText || !selectedModel || isSending) {
      return;
    }

    // Clear input immediately for better UX
    setInputText("");

    // Focus textarea after sending
    textareaRef.current?.focus();

    // Send message
    await onSendMessage({
      content: trimmedText,
      model: selectedModel,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSendDisabled =
    inputText.trim().length === 0 || isSending || isLoadingModels || modelsList.length === 0 || !selectedModel;

  const isComposerDisabled = isSending;

  return (
    <div className="border-t bg-background p-4 pt-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {/* Model selector and token counter row */}
        <div className="flex items-center justify-between gap-2">
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            modelsList={modelsList}
            isLoading={isLoadingModels}
            disabled={isComposerDisabled}
          />
          <TokenCounter totalTokens={totalTokens} />
        </div>

        {/* Message input and send button row */}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              modelsList.length === 0
                ? "Loading models..."
                : isComposerDisabled
                  ? "Sending message..."
                  : "Type your message... (Enter to send, Shift+Enter for new line)"
            }
            disabled={isComposerDisabled}
            className={cn(
              "min-h-[40px] max-h-[200px] resize-none",
              isComposerDisabled && "cursor-not-allowed opacity-50"
            )}
            aria-label="Message input"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSendDisabled}
            size="icon"
            className="size-10 shrink-0"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd> to send,{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5">Shift</kbd> +{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
