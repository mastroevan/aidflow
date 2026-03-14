import { NextResponse } from "next/server";
import { generateSubmissionId } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();

  const submissionId = generateSubmissionId();

  console.log("SUBMISSION RECEIVED", {
    submissionId,
    applicant: body.applicantFullName,
    layout: body.layout,
    reviewerApproved: body.reviewerApproved,
  });

  return NextResponse.json({
    success: true,
    submissionId,
  });
}