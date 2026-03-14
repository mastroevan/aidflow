import SharedForm from "@/components/SharedForm";
import { getCaseById } from "@/lib/utils";

export default async function LayoutBPage({
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
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <div className="rounded-2xl border p-6">
        <div className="mb-4 text-sm text-gray-500">Step 2 of 5</div>
        <div className="mb-6 h-2 rounded-full bg-gray-200">
          <div className="h-2 w-2/5 rounded-full bg-black"></div>
        </div>
        <h1 className="mb-6 text-2xl font-bold">Tell us about your situation</h1>
        <SharedForm initialData={data} layout="B" />
      </div>
    </main>
  );
}