import { cn } from "@/lib/utils";
import React from "react";

interface TagSelectorProps {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export default function TagSelector({
  tags,
  selected,
  onChange,
  className,
}: TagSelectorProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const isActive = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 select-none",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
