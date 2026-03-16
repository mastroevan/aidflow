import Link from "next/link";
import { db } from "@/lib/db";
import { CaseStatus } from "@prisma/client";

export default async function ReviewerDashboardPage() {
  const cases = await db.case.findMany({
    where: {
      status: {
        in: [CaseStatus.UNDER_REVIEW, CaseStatus.APPROVED, CaseStatus.INTAKE_COMPLETE],
      },
    },
    include: {
      applicant: true,
      documents: true,
      eligibilityItems: true,
      reviews: {
        include: {
          reviewer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      submission: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-7xl p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reviewer Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Review applicant cases, confirm evidence, and approve submissions.
        </p>
      </div>

      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Review Queue</h2>
        </div>

        {cases.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No cases in review queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold">Applicant</th>
                  <th className="px-6 py-3 font-semibold">Life Event</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Docs</th>
                  <th className="px-6 py-3 font-semibold">Eligibility</th>
                  <th className="px-6 py-3 font-semibold">Review</th>
                  <th className="px-6 py-3 font-semibold">Submission</th>
                  <th className="px-6 py-3 font-semibold">Updated</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {cases.map((aidCase) => {
                  const uploadedDocs = aidCase.documents.filter(
                    (d) => d.status === "UPLOADED"
                  ).length;

                  const missingDocs = aidCase.documents.filter(
                    (d) => d.status === "MISSING"
                  ).length;

                  const latestReview = aidCase.reviews[0];

                  return (
                    <tr key={aidCase.id} className="border-t align-top">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium">{aidCase.applicant.name}</p>
                          <p className="text-gray-500">{aidCase.applicant.email}</p>
                          <p className="text-xs text-gray-400 break-all">{aidCase.id}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">{aidCase.lifeEvent}</td>

                      <td className="px-6 py-4">
                        <StatusBadge status={aidCase.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p>{uploadedDocs} uploaded</p>
                          <p className={missingDocs > 0 ? "text-amber-600" : "text-gray-500"}>
                            {missingDocs} missing
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {aidCase.eligibilityItems.length} result
                        {aidCase.eligibilityItems.length === 1 ? "" : "s"}
                      </td>

                      <td className="px-6 py-4">
                        {latestReview ? (
                          <div className="space-y-1">
                            <p className="font-medium">{latestReview.decision}</p>
                            <p className="text-gray-500">
                              {latestReview.reviewer?.name ?? "Unknown reviewer"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No review</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {aidCase.submission ? (
                          <div className="space-y-1">
                            <p className="font-medium text-green-700">Submitted</p>
                            <p className="text-gray-500">
                              {aidCase.submission.confirmationId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not submitted</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {new Date(aidCase.updatedAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/case/${aidCase.id}`}
                          className="inline-block rounded-lg border px-3 py-2 font-medium hover:bg-gray-50"
                        >
                          Open case
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");

  return (
    <span className="rounded-full border px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  );
}