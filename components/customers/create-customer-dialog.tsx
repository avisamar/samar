"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePhoneNumber, validateEmail } from "@/lib/validation";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
}: CreateCustomerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [primaryMobile, setPrimaryMobile] = useState("");
  const [emailPrimary, setEmailPrimary] = useState("");
  const [cityOfResidence, setCityOfResidence] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setPrimaryMobile("");
    setEmailPrimary("");
    setCityOfResidence("");
    setError(null);
    setPhoneError(null);
    setEmailError(null);
  };

  const validatePhone = () => {
    if (!primaryMobile.trim()) {
      setPhoneError(null);
      return true;
    }
    const result = validatePhoneNumber(primaryMobile);
    setPhoneError(result.valid ? null : result.error || "Invalid phone number");
    return result.valid;
  };

  const validateEmailField = () => {
    if (!emailPrimary.trim()) {
      setEmailError(null);
      return true;
    }
    const result = validateEmail(emailPrimary);
    setEmailError(result.valid ? null : result.error || "Invalid email");
    return result.valid;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isValid =
    fullName.trim() !== "" &&
    primaryMobile.trim() !== "" &&
    !phoneError &&
    !emailError;

  const handleCreate = () => {
    if (!isValid) return;

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            primaryMobile: primaryMobile.trim(),
            emailPrimary: emailPrimary.trim() || null,
            cityOfResidence: cityOfResidence.trim() || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create customer");
        }

        // Navigate to the new customer's page
        router.push(`/customers/${data.customer.id}`);
        handleOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create customer");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your portfolio. You can enrich their profile later.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter customer's full name"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryMobile" className="text-xs">
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="primaryMobile"
              value={primaryMobile}
              onChange={(e) => {
                setPrimaryMobile(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={validatePhone}
              placeholder="+91 98765 43210"
              type="tel"
              aria-invalid={!!phoneError}
            />
            {phoneError && (
              <p className="text-destructive text-xs">{phoneError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailPrimary" className="text-xs">
              Email
            </Label>
            <Input
              id="emailPrimary"
              value={emailPrimary}
              onChange={(e) => {
                setEmailPrimary(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={validateEmailField}
              placeholder="customer@example.com"
              type="email"
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-destructive text-xs">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cityOfResidence" className="text-xs">
              City
            </Label>
            <Input
              id="cityOfResidence"
              value={cityOfResidence}
              onChange={(e) => setCityOfResidence(e.target.value)}
              placeholder="Mumbai"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isPending || !isValid}
          >
            {isPending ? "Creating..." : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
