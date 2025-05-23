import { Button } from "@/components/ui/button";

interface PromptSuggestionsProps {
  label: string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function PromptSuggestions({
  label,
  suggestions,
  onSuggestionClick,
}: PromptSuggestionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto my-6">
      <p className="text-sm font-medium text-center text-muted-foreground">{label}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto whitespace-normal text-center px-4 py-2 rounded-full"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
