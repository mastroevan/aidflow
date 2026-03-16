import { NextResponse } from "next/server";
import {
  CaseActionError,
  getCaseDetailById,
  mapCaseRecordToAidCase,
  saveAidCaseDraft,
} from "@/lib/case-data";
import { type AidCase } from "@/lib/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const aidCase = await getCaseDetailById(id);

    if (!aidCase) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: aidCase,
      formData: mapCaseRecordToAidCase(aidCase),
    });
  } catch (error) {
    console.error("Fetch case error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load case" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as AidCase;
    const formData = await saveAidCaseDraft(id, body);

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

    console.error("Update case error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the case packet" },
      { status: 500 }
    );
  }
}
