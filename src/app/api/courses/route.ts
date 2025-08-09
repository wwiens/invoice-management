import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-middleware";

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await query<{
      id: string;
      name: string;
      created_at: string;
    }>("SELECT id, name, created_at FROM courses WHERE user_id = $1 ORDER BY name ASC", [userId]);

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    // Check if course already exists for this user
    const existing = await query<{ id: string }>(
      "SELECT id FROM courses WHERE LOWER(name) = LOWER($1) AND user_id = $2",
      [trimmedName, userId],
    );

    if (existing.length > 0) {
      // Return the existing course instead of creating a duplicate
      const course = await query<{
        id: string;
        name: string;
        created_at: string;
      }>("SELECT id, name, created_at FROM courses WHERE id = $1 AND user_id = $2", [
        existing[0].id,
        userId,
      ]);
      return NextResponse.json(course[0]);
    }

    // Create new course
    const newCourse = await query<{
      id: string;
      name: string;
      created_at: string;
    }>(
      "INSERT INTO courses (name, user_id) VALUES ($1, $2) RETURNING id, name, created_at",
      [trimmedName, userId],
    );

    return NextResponse.json(newCourse[0], { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
