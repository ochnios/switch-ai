import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Model } from "@/types/ui";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  modelsList: Model[];
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * ModelSelector - Combobox for searching and selecting an AI model
 *
 * Features:
 * - Searchable dropdown with Command palette
 * - Displays loading state while fetching models
 * - Shows error state if models fail to load
 * - Disabled state during message sending
 */
export function ModelSelector({ value, onChange, modelsList, isLoading, disabled = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedModel = modelsList.find((model) => model.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="model-selector"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select AI model"
          disabled={disabled || isLoading || modelsList.length === 0}
          className="w-[260px] justify-between"
        >
          {isLoading ? (
            "Loading models..."
          ) : selectedModel ? (
            <span className="truncate">{selectedModel.name}</span>
          ) : modelsList.length === 0 ? (
            "No models available"
          ) : (
            "Select model..."
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {modelsList.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  keywords={[model.name, model.id]}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{model.name}</span>
                  <Check className={cn("mr-1 size-4", value === model.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
