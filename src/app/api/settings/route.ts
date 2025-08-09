import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-middleware";
import { query } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type { Settings } from "@/types/settings";

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsQuery = "SELECT settings_data FROM user_settings WHERE user_id = $1";
    const rows = await query<{ settings_data: Settings }>(settingsQuery, [userId]);

    if (rows.length === 0) {
      // Return default settings if no user settings found
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json(rows[0].settings_data);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST/PUT /api/settings - Save user settings
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings: Settings = await request.json();

    // Add timestamp
    const settingsWithTimestamp = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    };

    // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE)
    const upsertQuery = `
      INSERT INTO user_settings (user_id, settings_data) 
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        settings_data = EXCLUDED.settings_data,
        updated_at = NOW()
      RETURNING settings_data
    `;

    const rows = await query<{ settings_data: Settings }>(upsertQuery, [
      userId,
      JSON.stringify(settingsWithTimestamp),
    ]);

    return NextResponse.json(rows[0].settings_data);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// PUT method alias for POST (some clients prefer PUT for updates)
export const PUT = POST;