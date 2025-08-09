"use client";

import type { Settings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth-utils";
import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from API when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      try {
        const headers = await getAuthHeaders(user);
        const response = await fetch("/api/settings", { headers });

        if (response.ok) {
          const userSettings = await response.json();
          setSettings(userSettings);
        } else {
          console.error("Failed to load settings from API");
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (newSettings: Settings) => {
    if (!user) {
      console.error("Cannot update settings: no authenticated user");
      return;
    }

    // Optimistically update UI
    const settingsWithTimestamp = {
      ...newSettings,
      lastUpdated: new Date().toISOString(),
    };
    setSettings(settingsWithTimestamp);

    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsWithTimestamp),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
      } else {
        console.error("Failed to save settings to API");
        // Revert optimistic update on error
        // Could reload from server here if needed
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert optimistic update on error
      // Could reload from server here if needed
    }
  };

  const resetSettings = async () => {
    if (!user) {
      console.error("Cannot reset settings: no authenticated user");
      return;
    }

    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
      } else {
        console.error("Failed to reset settings via API");
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}