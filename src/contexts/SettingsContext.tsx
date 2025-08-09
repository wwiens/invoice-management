"use client";

import type { Settings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "invoice-app-settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          setSettings(parsedSettings);
        }
      } catch (error) {
        console.error("Failed to load settings from localStorage:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error);
      }
    }
  }, [settings, isInitialized]);

  const updateSettings = (newSettings: Settings) => {
    setSettings({
      ...newSettings,
      lastUpdated: new Date().toISOString(),
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
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