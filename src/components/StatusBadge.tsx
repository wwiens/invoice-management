import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/invoice";

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  pending: {
    label: "Pending",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  draft: {
    label: "Draft",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
