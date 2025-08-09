import { NextRequest } from "next/server";

export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // For client-side requests, we'll extract user ID from the token
    // In production, you should verify the Firebase ID token server-side
    // For now, we'll decode the JWT to get the user ID
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.sub || null;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

export function createAuthorizationHeader(user: any): HeadersInit {
  if (!user) return {};
  
  return {
    'Authorization': `Bearer ${user.accessToken}`,
  };
}