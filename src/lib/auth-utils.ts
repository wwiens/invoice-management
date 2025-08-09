"use client";

import { User } from "firebase/auth";

export async function getAuthHeaders(user: User | null): Promise<HeadersInit> {
  if (!user) {
    return {};
  }

  try {
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return {};
  }
}

export function getUserId(user: User | null): string | null {
  return user?.uid || null;
}