import type { Invoice } from "@/types/invoice";

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyGrowth: number;
  averageInvoiceValue: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  value: number;
  color: string;
}

export interface TopClient {
  name: string;
  revenue: number;
  invoices: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "invoice_created"
    | "payment_received"
    | "invoice_sent"
    | "invoice_overdue";
  description: string;
  amount?: number;
  date: string;
  invoiceNumber?: string;
}

export class AnalyticsService {
  constructor(private invoices: Invoice[]) {}

  getDashboardMetrics(): DashboardMetrics {
    const totalRevenue = this.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalInvoices = this.invoices.length;
    const paidInvoices = this.invoices.filter(
      (inv) => inv.status === "paid",
    ).length;

    const pendingAmount = this.invoices
      .filter((inv) => inv.status === "pending")
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdueAmount = this.invoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    // Calculate current month revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = this.invoices
      .filter((inv) => {
        const invoiceDate = new Date(inv.issuedDate);
        return (
          invoiceDate.getMonth() === currentMonth &&
          invoiceDate.getFullYear() === currentYear &&
          inv.status === "paid"
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    // Calculate previous month for growth
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthRevenue = this.invoices
      .filter((inv) => {
        const invoiceDate = new Date(inv.issuedDate);
        return (
          invoiceDate.getMonth() === prevMonth &&
          invoiceDate.getFullYear() === prevYear &&
          inv.status === "paid"
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const monthlyGrowth =
      previousMonthRevenue > 0
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

    const averageInvoiceValue =
      totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      totalInvoices,
      paidInvoices,
      pendingAmount,
      overdueAmount,
      monthlyGrowth,
      averageInvoiceValue,
    };
  }

  getMonthlyRevenueData(): MonthlyRevenueData[] {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentDate = new Date();
    const months: MonthlyRevenueData[] = [];

    // Get last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      const monthlyInvoices = this.invoices.filter((inv) => {
        const invoiceDate = new Date(inv.issuedDate);
        return (
          invoiceDate.getMonth() === date.getMonth() &&
          invoiceDate.getFullYear() === year &&
          inv.status === "paid"
        );
      });

      months.push({
        month: `${month} ${year}`,
        revenue: monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0),
        invoices: monthlyInvoices.length,
      });
    }

    return months;
  }

  getStatusDistribution(): StatusDistribution[] {
    const statusColors = {
      paid: "#22c55e",
      pending: "#a855f7",
      draft: "#f97316",
      overdue: "#ef4444",
    };

    const statusCounts = this.invoices.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      value: count,
      color: statusColors[status as keyof typeof statusColors],
    }));
  }

  getTopClients(): TopClient[] {
    const clientStats = this.invoices.reduce(
      (acc, inv) => {
        if (!acc[inv.client.name]) {
          acc[inv.client.name] = { revenue: 0, invoices: 0 };
        }
        acc[inv.client.name].revenue += inv.total;
        acc[inv.client.name].invoices += 1;
        return acc;
      },
      {} as Record<string, { revenue: number; invoices: number }>,
    );

    return Object.entries(clientStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  getRecentActivity(): RecentActivity[] {
    const activities: RecentActivity[] = [];

    // Add invoice creation activities
    this.invoices
      .slice()
      .sort(
        (a, b) =>
          new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime(),
      )
      .slice(0, 10)
      .forEach((inv) => {
        if (inv.status === "paid" && inv.paymentDate) {
          activities.push({
            id: `payment-${inv.id}`,
            type: "payment_received",
            description: `Payment received from ${inv.client.name}`,
            amount: inv.total,
            date: inv.paymentDate,
            invoiceNumber: inv.number,
          });
        }

        activities.push({
          id: `created-${inv.id}`,
          type: "invoice_created",
          description: `Invoice created for ${inv.client.name}`,
          amount: inv.total,
          date: inv.issuedDate,
          invoiceNumber: inv.number,
        });

        if (inv.status === "overdue") {
          activities.push({
            id: `overdue-${inv.id}`,
            type: "invoice_overdue",
            description: `Invoice ${inv.number} is now overdue`,
            amount: inv.total,
            date: inv.dueDate,
            invoiceNumber: inv.number,
          });
        }
      });

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  }
}
