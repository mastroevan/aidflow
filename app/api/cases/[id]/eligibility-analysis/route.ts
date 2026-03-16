import { NextResponse } from "next/server";
import {
  CaseActionError,
  runSavedCaseEligibilityAnalysis,
} from "@/lib/case-data";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await runSavedCaseEligibilityAnalysis(id);

    return NextResponse.json({
      success: true,
      formData,
    });
  } catch (error) {
    if (error instanceof CaseActionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Run eligibility analysis error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to run eligibility analysis" },
      { status: 500 }
    );
  }
}
