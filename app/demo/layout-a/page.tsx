import SharedForm from "@/components/SharedForm";
import { getApplicantCaseById, getDefaultApplicantCase } from "@/lib/case-data";

export default async function LayoutAPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const params = await searchParams;
  const data = params.caseId
    ? await getApplicantCaseById(params.caseId)
    : await getDefaultApplicantCase();

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
          <p className="mb-2 text-sm uppercase tracking-[0.18em] text-gray-500">Layout A</p>
          <h1 className="mb-6 text-2xl font-bold">General Assistance Application</h1>
          <SharedForm initialData={data} layout="A" />
        </section>
      </div>
    </main>
  );
}
