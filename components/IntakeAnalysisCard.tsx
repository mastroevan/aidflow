import { type AidCaseAnalysis } from "@/lib/schema";

type Props = {
  analysis: AidCaseAnalysis | null;
};

export default function IntakeAnalysisCard({ analysis }: Props) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Intake analysis
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Structured case facts
          </h2>
        </div>

        {analysis ? (
          <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{analysis.confidenceLabel}</p>
            <p className="mt-1">{new Date(analysis.generatedAt).toLocaleString()}</p>
          </div>
        ) : null}
      </div>

      {!analysis ? (
        <p className="mt-4 text-sm text-gray-600">
          No analysis has been generated for this case yet.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Household snapshot</p>
            <p className="mt-2 leading-6">{analysis.householdSnapshot}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Priority summary</p>
            <p className="mt-2 leading-6">{analysis.prioritySummary}</p>
          </div>

          <BulletSection title="Extracted facts" items={analysis.extractedFacts} />
          <BulletSection title="Blockers" items={analysis.blockers} emptyLabel="No blockers detected." />
          <BulletSection title="Recommended next steps" items={analysis.nextSteps} />
        </div>
      )}
    </section>
  );
}

function BulletSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">{emptyLabel ?? "No items available."}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
