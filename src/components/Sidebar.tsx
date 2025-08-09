"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
  },
  {
    name: "Invoices",
    icon: FileText,
    id: "invoices",
  },
  {
    name: "Clients",
    icon: Building2,
    id: "clients",
  },
  {
    name: "Reports",
    icon: BarChart3,
    id: "reports",
  },
  {
    name: "Settings",
    icon: Settings,
    id: "settings",
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6">
      {/* Logo */}
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">PR</span>
        </div>
        <span className="font-semibold text-lg">Profitsor</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
