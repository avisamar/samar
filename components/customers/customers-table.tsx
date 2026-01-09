"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer } from "@/lib/crm/types";
import {
  type ProfileCompleteness,
  calculateCompleteness,
  getCompletenessBgColor,
} from "@/lib/crm/completeness";
import { cn } from "@/lib/utils";

interface CustomersTableProps {
  customers: Customer[];
}

type CompletenessFilter = "all" | "minimal" | "basic" | "moderate" | "detailed" | "complete";

interface CustomerRow extends Customer {
  completeness: ProfileCompleteness;
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [search, setSearch] = useState("");
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>("all");

  // Calculate completeness for all customers
  const customersWithCompleteness: CustomerRow[] = useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      completeness: calculateCompleteness(customer),
    }));
  }, [customers]);

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    return customersWithCompleteness.filter((customer) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = customer.fullName?.toLowerCase().includes(searchLower);
        const matchesEmail = customer.emailPrimary?.toLowerCase().includes(searchLower);
        const matchesCity = customer.cityOfResidence?.toLowerCase().includes(searchLower);
        const matchesPhone = customer.primaryMobile?.includes(search);
        if (!matchesName && !matchesEmail && !matchesCity && !matchesPhone) {
          return false;
        }
      }

      // Completeness filter
      if (completenessFilter !== "all" && customer.completeness.level !== completenessFilter) {
        return false;
      }

      return true;
    });
  }, [customersWithCompleteness, search, completenessFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={completenessFilter}
          onValueChange={(v) => setCompletenessFilter(v as CompletenessFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Completeness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All profiles</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-medium px-3 py-2">Name</th>
              <th className="text-left font-medium px-3 py-2">Contact</th>
              <th className="text-left font-medium px-3 py-2">Location</th>
              <th className="text-left font-medium px-3 py-2">Income</th>
              <th className="text-left font-medium px-3 py-2">Goal</th>
              <th className="text-left font-medium px-3 py-2 w-28">Profile</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {customers.length === 0
                    ? "No customers yet"
                    : "No customers match your filters"}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium hover:text-primary hover:underline transition-colors"
                    >
                      {customer.fullName || "—"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {customer.occupationType || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="truncate max-w-40">{customer.emailPrimary || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.primaryMobile || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{customer.cityOfResidence || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.countryOfResidence || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{customer.incomeBandAnnual || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.incomeStability || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="truncate max-w-32">{customer.primaryGoalType || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.primaryGoalHorizon || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <CompletenessBar completeness={customer.completeness} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>
    </div>
  );
}

function CompletenessBar({ completeness }: { completeness: ProfileCompleteness }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize">{completeness.level}</span>
        <span className="text-muted-foreground">{completeness.percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getCompletenessBgColor(completeness.level))}
          style={{ width: `${completeness.percentage}%` }}
        />
      </div>
    </div>
  );
}
