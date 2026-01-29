"use client";

import * as React from "react";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

export interface InlineEditorProps {
  /** Current value */
  value: string;
  /** Callback when value is saved */
  onSave: (value: string) => void;
  /** Callback when edit is cancelled */
  onCancel?: () => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Custom className for the display text */
  displayClassName?: string;
  /** Type of input */
  type?: "text" | "email" | "tel" | "url" | "number";
}

function InlineEditor({
  value,
  onSave,
  onCancel,
  placeholder = "Enter value...",
  disabled = false,
  className,
  displayClassName,
  type = "text",
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 transition-all duration-150",
          className
        )}
      >
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="h-7 text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleSave}
          aria-label="Save"
        >
          <Check className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCancel}
          aria-label="Cancel"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-1 transition-all duration-150",
        className
      )}
    >
      <span
        className={cn(
          "text-sm",
          !value && "text-muted-foreground italic",
          displayClassName
        )}
      >
        {value || placeholder}
      </span>
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleEdit}
          aria-label="Edit"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}

export { InlineEditor };
