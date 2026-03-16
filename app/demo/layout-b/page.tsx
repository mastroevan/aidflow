import SharedForm from "@/components/SharedForm";
import { getApplicantCaseById, getDefaultApplicantCase } from "@/lib/case-data";

export default async function LayoutBPage({
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
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <div className="rounded-2xl border p-6">
        <div className="mb-4 text-sm text-gray-500">Step 2 of 5</div>
        <div className="mb-6 h-2 rounded-full bg-gray-200">
          <div className="h-2 w-2/5 rounded-full bg-black"></div>
        </div>
        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-gray-500">Layout B</p>
        <h1 className="mb-6 text-2xl font-bold">Tell us about your situation</h1>
        <SharedForm initialData={data} layout="B" />
      </div>
    </main>
  );
}
