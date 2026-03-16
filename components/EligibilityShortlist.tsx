import { type AidCaseEligibilityRecommendation } from "@/lib/schema";

type Props = {
  items: AidCaseEligibilityRecommendation[];
};

const statusStyles: Record<AidCaseEligibilityRecommendation["status"], string> = {
  LIKELY_ELIGIBLE: "bg-green-50 text-green-700 border-green-200",
  MAYBE_ELIGIBLE: "bg-amber-50 text-amber-700 border-amber-200",
  UNLIKELY: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function EligibilityShortlist({ items }: Props) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Program shortlist
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Evidence-backed recommendations
          </h2>
        </div>

        <span className="text-sm text-gray-500">{items.length} program matches</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">
          No eligibility recommendations are available yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {items
            .slice()
            .sort((left, right) => left.priorityOrder - right.priorityOrder)
            .map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Priority {item.priorityOrder}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">
                      {item.programName}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
                  >
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-700">
                  {item.reasoningSummary}
                </p>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">Evidence links</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {item.evidenceLinks.map((evidence) => (
                      <li key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
