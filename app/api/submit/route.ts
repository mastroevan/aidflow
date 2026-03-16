import { NextResponse } from "next/server";
import {
  CaseActionError,
  getApplicantCaseById,
  submitAidCase,
} from "@/lib/case-data";
import { reviewLayoutOptions, type ReviewLayout } from "@/lib/schema";

export async function POST(req: Request) {
  let caseId: string | null = null;

  try {
    const body = await req.json();
    caseId = typeof body.caseId === "string" ? body.caseId : "";
    const reviewerApproved = body.reviewerApproved === true;
    const layout = reviewLayoutOptions.includes(body.layout as ReviewLayout)
      ? (body.layout as ReviewLayout)
      : null;

    if (!caseId || !layout) {
      return NextResponse.json(
        { success: false, error: "caseId and layout are required" },
        { status: 400 }
      );
    }

    if (!reviewerApproved) {
      return NextResponse.json(
        { success: false, error: "Reviewer approval is required before submission" },
        { status: 400 }
      );
    }

    const submission = await submitAidCase({ caseId, layout });

    return NextResponse.json({
      success: true,
      submissionId: submission.confirmationId,
      submittedAt: submission.submittedAt,
      case: submission.case,
    });
  } catch (error) {
    if (error instanceof CaseActionError) {
      const caseData =
        error.statusCode === 409 && caseId
          ? await getApplicantCaseById(caseId)
          : null;

      return NextResponse.json(
        { success: false, error: error.message, case: caseData },
        { status: error.statusCode }
      );
    }

    console.error("Submit case error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to submit case" },
      { status: 500 }
    );
  }
}
