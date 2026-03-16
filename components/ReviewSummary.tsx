import DocumentChecklist from "@/components/DocumentChecklist";
import { type AidCase } from "@/lib/schema";

type Props = {
  aidCase: AidCase;
};

export default function ReviewSummary({ aidCase }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Applicant
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {aidCase.applicantFullName}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{aidCase.email}</p>
          </div>

          <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">
              {aidCase.status.replaceAll("_", " ")}
            </p>
            <p className="mt-1">Packet v{aidCase.packetVersion}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Detail label="Life event" value={aidCase.lifeEvent} />
          <Detail label="Employment status" value={aidCase.employmentStatus} />
          <Detail label="Monthly income" value={`$${aidCase.monthlyIncome.toLocaleString()}`} />
          <Detail label="Household size" value={String(aidCase.householdSize)} />
          <Detail label="Preferred contact" value={aidCase.preferredContactMethod} />
          <Detail label="Phone" value={aidCase.phone || "Not provided"} />
          <Detail
            label="Address"
            value={
              aidCase.address
                ? `${aidCase.address}, ${aidCase.city}, ${aidCase.state} ${aidCase.zipCode}`
                : "Not provided"
            }
          />
          <Detail label="Resume token" value={aidCase.resumeToken} />
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Urgent needs</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {aidCase.urgentNeeds.map((need) => (
            <span
              key={need}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
            >
              {need}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Case summary</p>
          <p className="mt-2 leading-6">{aidCase.summaryText}</p>
        </div>
      </section>

      <DocumentChecklist documents={aidCase.documents} title="Submission documents" />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-gray-800">{value}</p>
    </div>
  );
}
