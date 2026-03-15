import { NextResponse } from "next/server";
import { seedUsers } from "@/lib/seedUsers";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  const user = seedUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      caseId: user.caseId,
    },
  });
}