"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import UserMenu from "./UserMenu";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Instructor Lounge Logo" 
              width={32} 
              height={32} 
              className="mr-3 rounded-lg"
              priority
            />
            <span className="instructor-lounge-brand">Instructor Lounge</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserMenu />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo - Desktop only */}
          <div className="hidden lg:flex flex-col items-center mb-8">
            <Image 
              src="/logo.png" 
              alt="Instructor Lounge Logo" 
              width={60} 
              height={60} 
              className="mb-3 rounded-lg shadow-sm"
              priority
            />
            <div className="flex flex-col items-center text-center">
              <span className="instructor-lounge-brand leading-tight">Instructor</span>
              <span className="instructor-lounge-brand leading-tight">Lounge</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mt-8 lg:mt-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
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
          
          {/* User Menu - Desktop */}
          <div className="hidden lg:block mt-auto pt-6 border-t border-gray-200">
            <div className="flex justify-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
