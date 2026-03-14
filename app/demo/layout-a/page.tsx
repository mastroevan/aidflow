import SharedForm from "@/components/SharedForm";
import { getCaseById } from "@/lib/utils";

export default async function LayoutAPage({
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
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-8 py-4 font-semibold">Aid Services Intake Portal</div>
      <div className="mx-auto max-w-5xl p-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="font-semibold">Navigation</div>
          <div>Applicant Info</div>
          <div>Household</div>
          <div>Needs</div>
          <div>Documents</div>
        </aside>
        <section className="rounded-2xl border bg-white p-6">
          <h1 className="mb-6 text-2xl font-bold">General Assistance Application</h1>
          <SharedForm initialData={data} layout="A" />
        </section>
      </div>
    </main>
  );
}