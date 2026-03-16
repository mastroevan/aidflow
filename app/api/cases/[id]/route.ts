import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const aidCase = await db.case.findUnique({
    where: { id },
    include: {
      applicant: true,
      documents: {
        orderBy: { createdAt: "asc" },
      },
      eligibilityItems: {
        orderBy: { priorityOrder: "asc" },
      },
      applicationPacket: true,
      reviews: {
        include: {
          reviewer: true,
        },
        orderBy: { createdAt: "desc" },
      },
      submission: true,
    },
  });

  if (!aidCase) {
    return NextResponse.json(
      { success: false, error: "Case not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    case: aidCase,
  });
}