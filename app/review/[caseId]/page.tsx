"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AidCase } from "@/lib/schema";
import ReviewSummary from "@/components/ReviewSummary";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const layout = searchParams.get("layout") || "A";

  const caseId = params.caseId as string;
  const [data, setData] = useState<AidCase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (ignore) {
          return;
        }

        if (!response.ok) {
          setLoadError(result.error ?? "We could not load this case.");
          return;
        }

        setData(result.formData);
        setApproved(result.formData.reviewerApproved);
      } catch (requestError) {
        console.error("Load review case error:", requestError);
        if (!ignore) {
          setLoadError("We could not load this case.");
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [caseId]);

  async function handleSubmit() {
    if (!data || !approved) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: data.id,
          reviewerApproved: true,
          layout,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 409 && result.case?.submissionConfirmationId) {
          router.push(`/confirmation/${result.case.submissionConfirmationId}`);
          return;
        }

        setSubmitError(result.error ?? "We could not submit this application.");
        setSubmitting(false);
        return;
      }

      router.push(`/confirmation/${result.submissionId}`);
    } catch (requestError) {
      console.error("Submit review error:", requestError);
      setSubmitError("We could not submit this application.");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {loadError}
        </div>
      </main>
    );
  }

  if (!data) return <div className="p-8">Loading review...</div>;

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-gray-500">Review step</p>
        <h1 className="mt-2 text-3xl font-bold">Review Before Submission</h1>
        <p className="mt-2 text-gray-600">
          Layout {layout} is about to submit the saved packet tied to this case.
        </p>
      </div>

      <ReviewSummary aidCase={data} />

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        Reviewed and approved for submission
      </label>

      {submitError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <button
        disabled={!approved || submitting || Boolean(data.submissionConfirmationId)}
        onClick={handleSubmit}
        className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {data.submissionConfirmationId
          ? "Already submitted"
          : submitting
            ? "Submitting..."
            : "Submit application"}
      </button>
    </main>
  );
}
