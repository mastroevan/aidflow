import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmissionByConfirmationId } from "@/lib/case-data";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = await getSubmissionByConfirmationId(submissionId);

  if (!submission) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <div className="rounded-2xl border bg-green-50 p-6">
        <h1 className="text-3xl font-bold">Application Submitted</h1>
        <p className="mt-3">Your confirmation number is:</p>
        <p className="mt-2 text-2xl font-semibold">{submissionId}</p>
        <div className="mt-6 space-y-2 text-sm text-green-900">
          <p>
            <strong>Applicant:</strong> {submission.case.applicant.name}
          </p>
          <p>
            <strong>Portal layout:</strong> {submission.portalLayout}
          </p>
          <p>
            <strong>Submitted at:</strong>{" "}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/case/${submission.caseId}`}
          className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
        >
          Open case details
        </Link>
        <Link
          href="/reviewer"
          className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
        >
          Go to reviewer dashboard
        </Link>
      </div>
    </main>
  );
}
