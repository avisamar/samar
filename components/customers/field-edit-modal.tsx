"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/crm/types";
import type { FieldDefinition } from "@/lib/crm/sections";
import { getFieldOptions } from "@/lib/crm/field-options";
import { validateContactField, isContactField } from "@/lib/validation";

interface FieldEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FieldDefinition | null;
  customer: Customer;
}

type FieldValue = string | number | boolean | string[] | Date | null | object;

export function FieldEditModal({
  open,
  onOpenChange,
  field,
  customer,
}: FieldEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<FieldValue>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize value when field changes
  useEffect(() => {
    if (field) {
      const currentValue = customer[field.key] as FieldValue;
      setValue(currentValue ?? null);
      setValidationError(null);
    }
  }, [field, customer]);

  if (!field) return null;

  const currentValue = customer[field.key];
  const hasValue = currentValue !== null && currentValue !== undefined && currentValue !== "";
  const hasChanged = JSON.stringify(value) !== JSON.stringify(currentValue ?? null);
  const enumOptions = getFieldOptions(field.key as string);

  const validateValue = (): boolean => {
    if (!field) return true;

    const fieldKey = field.key as string;
    if (!isContactField(fieldKey)) return true;

    const result = validateContactField(fieldKey, value);
    if (result && !result.valid) {
      setValidationError(result.error || "Invalid value");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = () => {
    if (!hasChanged) {
      onOpenChange(false);
      return;
    }
    if (!validateValue()) {
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmation(false);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/customers/${customer.id}/fields`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: field.key,
            value: value,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update field");
        }

        router.refresh();
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirmation(false);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/customers/${customer.id}/fields`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: field.key,
            value: null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete field");
        }

        router.refresh();
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  };

  const formatDisplayValue = (val: unknown): string => {
    if (val === null || val === undefined) return "Empty";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (val instanceof Date) return val.toLocaleDateString("en-IN");
    if (Array.isArray(val)) return val.join(", ") || "Empty";
    return String(val) || "Empty";
  };

  const renderInput = () => {
    switch (field.type) {
      case "boolean":
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={value === true ? "default" : "outline"}
              size="sm"
              onClick={() => setValue(true)}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={value === false ? "default" : "outline"}
              size="sm"
              onClick={() => setValue(false)}
            >
              No
            </Button>
          </div>
        );

      case "enum":
        if (enumOptions) {
          return (
            <Select
              value={value as string ?? ""}
              onValueChange={(v) => setValue(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Input
            value={value as string ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "multi_select":
        if (enumOptions) {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-lg bg-muted/30">
                {selectedValues.length > 0 ? (
                  selectedValues.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setValue(selectedValues.filter((v) => v !== item))
                      }
                    >
                      {item} &times;
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No items selected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {enumOptions
                  .filter((opt) => !selectedValues.includes(opt))
                  .map((option) => (
                    <Badge
                      key={option}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => setValue([...selectedValues, option])}
                    >
                      + {option}
                    </Badge>
                  ))}
              </div>
            </div>
          );
        }
        return (
          <Textarea
            value={Array.isArray(value) ? value.join(", ") : ""}
            onChange={(e) =>
              setValue(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
            }
            placeholder="Enter comma-separated values"
            rows={3}
          />
        );

      case "date":
        const dateValue = value instanceof Date
          ? value.toISOString().split("T")[0]
          : typeof value === "string" && value
            ? new Date(value).toISOString().split("T")[0]
            : "";
        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setValue(e.target.value ? new Date(e.target.value) : null)}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value as number ?? ""}
            onChange={(e) =>
              setValue(e.target.value ? Number(e.target.value) : null)
            }
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "text":
      default:
        // Use textarea for longer text fields
        const isLongText =
          field.key.toString().includes("Notes") ||
          field.key.toString().includes("Summary") ||
          field.key.toString().includes("notes") ||
          field.key.toString().includes("summary");

        const fieldKey = field.key as string;
        const needsValidation = isContactField(fieldKey);

        const handleBlur = () => {
          if (needsValidation) {
            validateValue();
          }
        };

        const handleChange = (newValue: string) => {
          setValue(newValue);
          if (validationError) setValidationError(null);
        };

        if (isLongText) {
          return (
            <Textarea
              value={value as string ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={4}
            />
          );
        }

        return (
          <Input
            value={value as string ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            aria-invalid={!!validationError}
          />
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {field.label}</DialogTitle>
            <DialogDescription>
              Update the value for this field.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Current Value */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                Current Value
              </Label>
              <div
                className={cn(
                  "text-sm p-2 rounded-md bg-muted/50",
                  !hasValue && "text-muted-foreground italic"
                )}
              >
                {formatDisplayValue(currentValue)}
              </div>
            </div>

            {/* New Value Input */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                New Value
              </Label>
              {renderInput()}
              {validationError && (
                <p className="text-destructive text-xs">{validationError}</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              {hasValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4 mr-1" />
                  Clear
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || !hasChanged}
                >
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update <strong>{field.label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-4 py-3 bg-muted/50 rounded-md text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[60px]">From:</span>
              <span className={cn(!hasValue && "text-muted-foreground italic")}>
                {formatDisplayValue(currentValue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[60px]">To:</span>
              <span className="text-primary font-medium">
                {formatDisplayValue(value)}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isPending}>
              {isPending ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear Field Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the value for <strong>{field.label}</strong>?
              This will remove the current value: &ldquo;{formatDisplayValue(currentValue)}&rdquo;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? "Clearing..." : "Clear Value"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
