import { NextResponse } from "next/server";
import { CaseStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        cases: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const preferredCase =
      user.cases.find((aidCase) => aidCase.status !== CaseStatus.SUBMITTED) ??
      user.cases[0];

    const redirectPath =
      user.role === "REVIEWER"
        ? "/reviewer"
        : preferredCase
          ? `/portal/layout-a?caseId=${preferredCase.id}`
          : "/";

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        caseId: preferredCase?.id ?? null,
        redirectPath,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to sign in right now" },
      { status: 500 }
    );
  }
}
