"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice } from "@/types/invoice";
import { PaymentService } from "@/utils/paymentService";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  FileText,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";

interface FinancialReportsProps {
  invoices: Invoice[];
}

interface MonthlyData {
  month: string;
  revenue: number;
  invoiceCount: number;
  averageAmount: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

interface OutstandingInvoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  status: string;
}

interface CourseReportRow {
  courseName: string;
  cohort: string;
  courseId: string;
  trainingDates: string;
  amount: number;
  invoiced: boolean;
  paid: boolean;
  invoiceNumber: string;
  notes: string;
}

export function FinancialReports({ invoices }: FinancialReportsProps) {
  const [reportType, setReportType] = useState("financial");
  const [reportPeriod, setReportPeriod] = useState("12months");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate date range based on period selection
  const getDateRange = () => {
    const today = new Date();
    let start = new Date();
    
    switch (reportPeriod) {
      case "1month":
        start.setMonth(today.getMonth() - 1);
        break;
      case "3months":
        start.setMonth(today.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(today.getMonth() - 6);
        break;
      case "12months":
        start.setFullYear(today.getFullYear() - 1);
        break;
      case "custom":
        start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : today;
        return { start, end };
      default:
        start.setFullYear(today.getFullYear() - 1);
    }
    
    return { start, end: today };
  };

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    const { start, end } = getDateRange();
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issuedDate);
      return invoiceDate >= start && invoiceDate <= end;
    });
  }, [invoices, reportPeriod, startDate, endDate]);

  // Revenue Summary Calculations
  const revenueSummary = useMemo(() => {
    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = filteredInvoices
      .filter(inv => inv.status === "pending")
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const overdueRevenue = filteredInvoices
      .filter(inv => PaymentService.isOverdue(inv))
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(inv => inv.status === "paid").length;
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

    return {
      totalRevenue,
      pendingRevenue,
      overdueRevenue,
      totalInvoices,
      paidInvoices,
      collectionRate,
      averageInvoiceValue: totalInvoices > 0 ? totalRevenue / paidInvoices : 0,
    };
  }, [filteredInvoices]);

  // Monthly Revenue Trend
  const monthlyRevenue = useMemo(() => {
    const monthlyData: Record<string, MonthlyData> = {};
    
    filteredInvoices.forEach(invoice => {
      if (invoice.status === "paid") {
        const date = new Date(invoice.paymentDate || invoice.issuedDate);
        const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            invoiceCount: 0,
            averageAmount: 0,
          };
        }
        
        monthlyData[monthKey].revenue += invoice.total;
        monthlyData[monthKey].invoiceCount += 1;
      }
    });

    // Calculate averages and sort by date
    return Object.values(monthlyData)
      .map(data => ({
        ...data,
        averageAmount: data.revenue / data.invoiceCount,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredInvoices]);

  // Payment Methods Analysis
  const paymentMethodsData = useMemo(() => {
    const methodData: Record<string, PaymentMethodData> = {};
    
    filteredInvoices
      .filter(inv => inv.status === "paid" && inv.paymentMethod)
      .forEach(invoice => {
        const method = invoice.paymentMethod || "Unknown";
        
        if (!methodData[method]) {
          methodData[method] = {
            method: method.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
            amount: 0,
            count: 0,
          };
        }
        
        methodData[method].amount += invoice.total;
        methodData[method].count += 1;
      });
    
    return Object.values(methodData).sort((a, b) => b.amount - a.amount);
  }, [filteredInvoices]);

  // Outstanding Invoices Analysis
  const outstandingInvoices = useMemo(() => {
    const outstanding: OutstandingInvoice[] = [];
    const today = new Date();
    
    invoices
      .filter(inv => inv.status === "pending" || PaymentService.isOverdue(inv))
      .forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        // Calculate days overdue - negative means days until due
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        outstanding.push({
          id: invoice.id,
          number: invoice.number,
          client: invoice.client.name,
          amount: invoice.total,
          dueDate,
          daysOverdue,
          status: daysOverdue > 0 ? "overdue" : "pending",
        });
      });
    
    return outstanding.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices]);

  // Cash Flow Forecast
  const cashFlowForecast = useMemo(() => {
    const today = new Date();
    const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    return invoices
      .filter(inv => inv.status === "pending")
      .filter(inv => new Date(inv.dueDate) <= next90Days)
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  // Course Report Data
  const courseReportData = useMemo(() => {
    const courseData: CourseReportRow[] = [];
    
    invoices.forEach(invoice => {
      // Check if invoice has course information
      if (invoice.courseInfo) {
        courseData.push({
          courseName: invoice.courseInfo.courseName || "N/A",
          cohort: invoice.courseInfo.cohort || "None",
          courseId: invoice.courseInfo.courseId || "None",
          trainingDates: invoice.courseInfo.trainingDates || "N/A",
          amount: invoice.total,
          invoiced: true,
          paid: invoice.status === "paid",
          invoiceNumber: invoice.number,
          notes: invoice.notes || ""
        });
      }
    });
    
    return courseData.sort((a, b) => a.courseName.localeCompare(b.courseName));
  }, [invoices]);

  const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const exportReport = () => {
    if (reportType === "course") {
      // Export course report as CSV
      const csvData = [
        ["Course Report", ""],
        ["Generated", new Date().toLocaleDateString()],
        [""],
        ["Course Name", "Cohort", "Course ID", "Training Dates", "Amount", "Invoiced", "Paid", "Invoice Number", "Notes"],
        ...courseReportData.map(course => [
          course.courseName,
          course.cohort,
          course.courseId,
          course.trainingDates,
          course.amount,
          course.invoiced ? "Y" : "N",
          course.paid ? "Y" : "N",
          course.invoiceNumber,
          course.notes
        ]),
      ];
      
      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `course-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // Simple CSV export implementation for financial report
      const csvData = [
        ["Financial Report", ""],
        ["Generated", new Date().toLocaleDateString()],
        ["Period", reportPeriod === "custom" ? `${startDate} to ${endDate}` : reportPeriod],
        [""],
        ["Revenue Summary", ""],
        ["Total Revenue", revenueSummary.totalRevenue],
        ["Pending Revenue", revenueSummary.pendingRevenue],
        ["Overdue Revenue", revenueSummary.overdueRevenue],
        ["Collection Rate", `${revenueSummary.collectionRate.toFixed(1)}%`],
        [""],
        ["Outstanding Invoices", ""],
        ["Invoice Number", "Client", "Amount", "Days Overdue"],
        ...outstandingInvoices.map(inv => [inv.number, inv.client, inv.amount, inv.daysOverdue]),
      ];

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const printCourseReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <html>
        <head>
          <title>Course Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .center { text-align: center; }
            @media print {
              body { margin: 0; }
              table { font-size: 12px; }
            }
          </style>
        </head>
        <body>
          <h1>Course Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Cohort</th>
                <th>Course ID</th>
                <th>Training Dates</th>
                <th class="amount">Amount</th>
                <th class="center">Invoiced</th>
                <th class="center">Paid</th>
                <th>Invoice #</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${courseReportData.map(course => `
                <tr>
                  <td>${course.courseName}</td>
                  <td>${course.cohort}</td>
                  <td>${course.courseId}</td>
                  <td>${course.trainingDates}</td>
                  <td class="amount">${formatCurrency(course.amount)}</td>
                  <td class="center">${course.invoiced ? 'Y' : 'N'}</td>
                  <td class="center">${course.paid ? 'Y' : 'N'}</td>
                  <td>${course.invoiceNumber}</td>
                  <td>${course.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {reportType === "financial" ? "Financial Reports" : "Course Reports"}
          </h1>
          <p className="text-gray-600">
            {reportType === "financial" 
              ? "Comprehensive financial analysis and insights"
              : "Course enrollment and training status overview"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financial Report</SelectItem>
              <SelectItem value="course">Course Report</SelectItem>
            </SelectContent>
          </Select>
          {reportType === "financial" && (
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          )}
          {reportType === "course" && (
            <Button onClick={printCourseReport} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          )}
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {reportType === "financial" && reportPeriod === "custom" && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Report */}
      {reportType === "course" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Course Training Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseReportData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Data</h3>
                <p className="text-gray-500">No invoices with course information found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Course Name</th>
                        <th className="text-left p-3 font-semibold">Cohort</th>
                        <th className="text-left p-3 font-semibold">Course ID</th>
                        <th className="text-left p-3 font-semibold">Training Dates</th>
                        <th className="text-right p-3 font-semibold">Amount</th>
                        <th className="text-center p-3 font-semibold">Invoiced</th>
                        <th className="text-center p-3 font-semibold">Paid</th>
                        <th className="text-left p-3 font-semibold">Invoice #</th>
                        <th className="text-left p-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseReportData.map((course, index) => (
                        <tr key={`${course.invoiceNumber}-${index}`} className="border-b hover:bg-gray-50">
                          <td className="p-3">{course.courseName}</td>
                          <td className="p-3 text-gray-600">{course.cohort}</td>
                          <td className="p-3 text-gray-600">{course.courseId}</td>
                          <td className="p-3">{course.trainingDates}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(course.amount)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.invoiced ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {course.invoiced ? 'Y' : 'N'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {course.paid ? 'Y' : 'N'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-sm">{course.invoiceNumber}</td>
                          <td className="p-3 text-gray-600 text-sm">{course.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Courses: {courseReportData.length}</span>
                    <span>Total Amount: {formatCurrency(courseReportData.reduce((sum, course) => sum + course.amount, 0))}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Reports */}
      {reportType === "financial" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueSummary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {revenueSummary.paidInvoices} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(revenueSummary.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Expected revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(revenueSummary.overdueRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueSummary.collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  nameKey="method"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {paymentMethodsData.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    {method.method}
                  </div>
                  <span className="font-medium">{formatCurrency(method.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {outstandingInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No outstanding invoices</p>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                  <div>Invoice</div>
                  <div>Client</div>
                  <div>Amount</div>
                  <div>Due Date</div>
                  <div>Days Overdue</div>
                  <div>Status</div>
                </div>
                {outstandingInvoices.slice(0, 10).map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="font-medium">{invoice.number}</div>
                    <div className="text-gray-600">{invoice.client}</div>
                    <div className="font-semibold">{formatCurrency(invoice.amount)}</div>
                    <div className="text-gray-600">
                      {invoice.dueDate.toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric", 
                        year: "numeric" 
                      })}
                    </div>
                    <div className={invoice.daysOverdue > 0 ? "text-red-600 font-medium" : invoice.daysOverdue < 0 ? "text-green-600" : "text-gray-600"}>
                      {invoice.daysOverdue > 0 
                        ? `${invoice.daysOverdue} days overdue` 
                        : invoice.daysOverdue < 0 
                        ? `${Math.abs(invoice.daysOverdue)} days until due`
                        : "Due today"}
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "overdue" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
                {outstandingInvoices.length > 10 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    And {outstandingInvoices.length - 10} more outstanding invoices...
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Cash Flow Forecast (Next 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {formatCurrency(cashFlowForecast)}
          </div>
          <p className="text-gray-600">
            Expected revenue from pending invoices due within 90 days
          </p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}