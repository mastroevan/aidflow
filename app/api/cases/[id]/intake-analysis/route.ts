import { NextResponse } from "next/server";
import {
  CaseActionError,
  runSavedCaseIntakeAnalysis,
} from "@/lib/case-data";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await runSavedCaseIntakeAnalysis(id);

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

    console.error("Run intake analysis error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to run intake analysis" },
      { status: 500 }
    );
  }
}
