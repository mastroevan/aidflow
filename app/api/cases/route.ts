import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CaseStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const applicantUserId = searchParams.get("applicantUserId");
  const status = searchParams.get("status");
  const role = searchParams.get("role");

  const cases = await db.case.findMany({
    where: {
      ...(applicantUserId ? { applicantUserId } : {}),
      ...(status ? { status: status as CaseStatus } : {}),
    },
    include: {
      applicant: true,
      documents: true,
      eligibilityItems: {
        orderBy: { priorityOrder: "asc" },
      },
      applicationPacket: true,
      reviews: {
        include: {
          reviewer: true,
        },
      },
      submission: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({
    success: true,
    role: role ?? null,
    count: cases.length,
    cases,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      applicantUserId,
      lifeEvent,
      summaryText,
    } = body;

    if (!applicantUserId || !lifeEvent || !summaryText) {
      return NextResponse.json(
        {
          success: false,
          error: "applicantUserId, lifeEvent, and summaryText are required",
        },
        { status: 400 }
      );
    }

    const newCase = await db.case.create({
      data: {
        applicantUserId,
        lifeEvent,
        summaryText,
        status: CaseStatus.DRAFT,
      },
      include: {
        applicant: true,
        documents: true,
        eligibilityItems: true,
        applicationPacket: true,
        reviews: true,
        submission: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        case: newCase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create case error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create case",
      },
      { status: 500 }
    );
  }
}