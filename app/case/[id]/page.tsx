import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Document = {
  id: string;
  name: string;
  type: string;
  status: string;
  url?: string;
  evidenceNote?: string;
};

type EligibilityItem = {
  id: string;
  programName: string;
  status: string;
  reasoningSummary: string;
  evidenceLinksJson?: string[];
};

type Review = {
  id: string;
  reviewer?: { name: string };
  decision: string;
  notes?: string;
  approvedAt?: string;
};

async function getCase(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/cases/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Failed to fetch case");
  }

  return res.json();
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getCase(id);

  if (!data?.case) {
    notFound();
  }

  const aidCase = data.case;

  return (
    <main className="mx-auto max-w-6xl p-8 space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Case Details</h1>
          <p className="mt-2 text-sm text-gray-500">Case ID: {aidCase.id}</p>
        </div>
        <StatusBadge status={aidCase.status} />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Applicant">
          <div className="space-y-2">
            <p><strong>Name:</strong> {aidCase.applicant.name}</p>
            <p><strong>Email:</strong> {aidCase.applicant.email}</p>
            <p><strong>Role:</strong> {aidCase.applicant.role}</p>
            <p><strong>Life Event:</strong> {aidCase.lifeEvent}</p>
          </div>
        </Card>

        <Card title="Case Summary">
          <div className="space-y-2">
            <p>{aidCase.summaryText}</p>
            <p><strong>Created:</strong> {new Date(aidCase.createdAt).toLocaleString()}</p>
            <p><strong>Updated:</strong> {new Date(aidCase.updatedAt).toLocaleString()}</p>
            <p><strong>Resume Token:</strong> {aidCase.resumeToken}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Documents">
          <div className="space-y-3">
            {aidCase.documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents found.</p>
            ) : (
              aidCase.documents.map((doc: Document) => (
                <div key={doc.id} className="rounded-lg border p-3">
                  <p><strong>{doc.name}</strong></p>
                  <p className="text-sm text-gray-600">Type: {doc.type}</p>
                  <p className="text-sm">
                    Status: <span className="font-medium">{doc.status}</span>
                  </p>
                  {doc.url ? (
                    <p className="text-sm text-blue-600 break-all">{doc.url}</p>
                  ) : null}
                  {doc.evidenceNote ? (
                    <p className="text-sm text-gray-600">Note: {doc.evidenceNote}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Eligibility Shortlist">
          <div className="space-y-3">
            {aidCase.eligibilityItems.length === 0 ? (
              <p className="text-sm text-gray-500">No eligibility results yet.</p>
            ) : (
              aidCase.eligibilityItems.map((item: EligibilityItem) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.programName}</p>
                    <EligibilityBadge status={item.status} />
                  </div>
                  <p className="text-sm text-gray-700">{item.reasoningSummary}</p>

                  <div>
                    <p className="text-sm font-medium">Evidence</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                      {Array.isArray(item.evidenceLinksJson) &&
                        item.evidenceLinksJson.map((evidence: string, index: number) => (
                          <li key={index}>{evidence}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Application Packet">
          {!aidCase.applicationPacket ? (
            <p className="text-sm text-gray-500">No application packet generated.</p>
          ) : (
            <div className="space-y-3">
              <p>
                <strong>Packet Version:</strong> {aidCase.applicationPacket.packetVersion}
              </p>
              <p>
                <strong>Generated:</strong>{" "}
                {new Date(aidCase.applicationPacket.generatedAt).toLocaleString()}
              </p>

              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white">
                {JSON.stringify(aidCase.applicationPacket.packetJson, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <Card title="Review + Submission">
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Reviews</p>
              <div className="mt-2 space-y-3">
                {aidCase.reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                ) : (
                  aidCase.reviews.map((review: Review) => (
                    <div key={review.id} className="rounded-lg border p-3">
                      <p><strong>Reviewer:</strong> {review.reviewer?.name ?? "Unknown"}</p>
                      <p><strong>Decision:</strong> {review.decision}</p>
                      {review.notes ? <p><strong>Notes:</strong> {review.notes}</p> : null}
                      {review.approvedAt ? (
                        <p><strong>Approved At:</strong> {new Date(review.approvedAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold">Submission</p>
              <div className="mt-2">
                {!aidCase.submission ? (
                  <p className="text-sm text-gray-500">Not submitted yet.</p>
                ) : (
                  <div className="rounded-lg border p-3 space-y-1">
                    <p><strong>Confirmation ID:</strong> {aidCase.submission.confirmationId}</p>
                    <p><strong>Portal Layout:</strong> {aidCase.submission.portalLayout}</p>
                    <p><strong>Submitted By:</strong> {aidCase.submission.submittedBy}</p>
                    <p>
                      <strong>Submitted At:</strong>{" "}
                      {new Date(aidCase.submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border px-3 py-1 text-sm font-medium">
      {status.replaceAll("_", " ")}
    </span>
  );
}

function EligibilityBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
      {status.replaceAll("_", " ")}
    </span>
  );
}