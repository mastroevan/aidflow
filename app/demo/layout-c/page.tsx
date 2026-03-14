import SharedForm from "@/components/SharedForm";
import { getCaseById } from "@/lib/utils";

export default async function LayoutCPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const params = await searchParams;
  const caseId = params.caseId || "case-001";
  const data = getCaseById(caseId);

  if (!data) {
    return <div className="p-8">Case not found.</div>;
  }

  return (
    <main className="mx-auto max-w-6xl p-8 grid gap-6 md:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border bg-white p-6">
        <h1 className="mb-6 text-2xl font-bold">Case Intake Review</h1>
        <SharedForm initialData={data} layout="C" />
      </section>

      <aside className="rounded-2xl border bg-gray-50 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Case Snapshot</h2>
        <p><strong>Applicant:</strong> {data.applicantFullName}</p>
        <p><strong>Life event:</strong> {data.lifeEvent}</p>
        <p><strong>Urgent needs:</strong> {data.urgentNeeds.join(", ")}</p>
      </aside>
    </main>
  );
}