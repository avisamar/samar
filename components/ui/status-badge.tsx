import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      status: {
        new: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        in_convo: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        opportunity: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        client: "bg-green-500/15 text-green-600 dark:text-green-400",
      },
      interactive: {
        true: "cursor-pointer hover:opacity-80",
        false: "",
      },
    },
    defaultVariants: {
      status: "new",
      interactive: false,
    },
  }
);

export type RelationshipStatus = "new" | "in_convo" | "opportunity" | "client";

const statusLabels: Record<RelationshipStatus, string> = {
  new: "New",
  in_convo: "In Convo",
  opportunity: "Opportunity",
  client: "Client",
};

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onClick">,
    VariantProps<typeof statusBadgeVariants> {
  status: RelationshipStatus;
  onClick?: (status: RelationshipStatus) => void;
}

function StatusBadge({
  className,
  status,
  onClick,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(status) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(status);
              }
            }
          : undefined
      }
      className={cn(
        statusBadgeVariants({ status, interactive: !!onClick }),
        className
      )}
      {...props}
    >
      {statusLabels[status]}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants };
