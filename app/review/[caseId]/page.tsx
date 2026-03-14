"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AidCase } from "@/lib/schema";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const layout = searchParams.get("layout") || "A";

  const caseId = params.caseId as string;
  const [data, setData] = useState<AidCase | null>(null);
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`aidflow-case-${caseId}`);
    if (raw) {
      setTimeout(() => {
        setData(JSON.parse(raw));
      }, 0);
    }
  }, [caseId]);

  async function handleSubmit() {
    if (!data || !approved) return;

    setSubmitting(true);

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, reviewerApproved: true, layout }),
    });

    const result = await res.json();
    router.push(`/confirmation/${result.submissionId}`);
  }

  if (!data) return <div className="p-8">Loading review...</div>;

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">Review Before Submission</h1>

      <div className="rounded-2xl border p-6 space-y-3">
        <p><strong>Name:</strong> {data.applicantFullName}</p>
        <p><strong>Life Event:</strong> {data.lifeEvent}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Phone:</strong> {data.phone}</p>
        <p><strong>Needs:</strong> {data.urgentNeeds.join(", ")}</p>

        <div>
          <strong>Documents:</strong>
          <ul className="mt-2 space-y-1">
            {data.documents.map((doc) => (
              <li key={doc.id}>
                {doc.name} — {doc.status}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        Reviewed and approved for submission
      </label>

      <button
        disabled={!approved || submitting}
        onClick={handleSubmit}
        className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </main>
  );
}