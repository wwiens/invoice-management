"use client";

import { PaymentReminders } from "@/components/PaymentReminders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/types/invoice";
import { AnalyticsService } from "@/utils/analytics";
import { PaymentService } from "@/utils/paymentService";
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardProps {
  invoices: Invoice[];
  onPaymentStatusChange?: (invoice: Invoice, isPaid: boolean) => void;
}

export function Dashboard({ invoices, onPaymentStatusChange }: DashboardProps) {
  const analytics = useMemo(() => new AnalyticsService(invoices), [invoices]);
  const metrics = analytics.getDashboardMetrics();
  const monthlyData = analytics.getMonthlyRevenueData();
  const statusData = analytics.getStatusDistribution();
  const topClients = analytics.getTopClients();
  const recentActivity = analytics.getRecentActivity();

  const overdueCount = useMemo(
    () => PaymentService.getOverdueInvoices(invoices).length,
    [invoices],
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment_received":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "invoice_created":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "invoice_sent":
        return <Activity className="h-4 w-4 text-purple-600" />;
      case "invoice_overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "payment_received":
        return "bg-green-50 border-green-200";
      case "invoice_created":
        return "bg-blue-50 border-blue-200";
      case "invoice_sent":
        return "bg-purple-50 border-purple-200";
      case "invoice_overdue":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your invoice management and revenue analytics
            </p>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {overdueCount} overdue payments
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Reminders - Show only if there are overdue/due soon invoices */}
      {onPaymentStatusChange &&
        (overdueCount > 0 ||
          PaymentService.getDueSoonInvoices(invoices).length > 0) && (
          <PaymentReminders
            invoices={invoices}
            onPaymentStatusChange={onPaymentStatusChange}
          />
        )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average: {formatCurrency(metrics.averageInvoiceValue)} per invoice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={
                  metrics.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {metrics.monthlyGrowth >= 0 ? "+" : ""}
                {metrics.monthlyGrowth.toFixed(1)}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.paidInvoices} paid (
              {((metrics.paidInvoices / metrics.totalInvoices) * 100).toFixed(
                0,
              )}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.pendingAmount)}
            </div>
            <p className="text-xs text-red-600">
              {formatCurrency(metrics.overdueAmount)} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Monthly Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monthly revenue over the last 6 months
            </p>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "Revenue",
                  ]}
                  labelStyle={{ color: "#000" }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of invoice statuses
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Invoices"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">
                    {item.status}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Clients */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Clients
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clients by total revenue
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.invoices} invoices
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(client.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest invoice and payment activities
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {activity.date}
                      </span>
                      {activity.invoiceNumber && (
                        <Badge variant="outline" className="text-xs">
                          {activity.invoiceNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(activity.amount)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
