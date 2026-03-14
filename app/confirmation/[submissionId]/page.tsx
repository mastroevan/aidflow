export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <div className="rounded-2xl border bg-green-50 p-6">
        <h1 className="text-3xl font-bold">Application Submitted</h1>
        <p className="mt-3">Your confirmation number is:</p>
        <p className="mt-2 text-2xl font-semibold">{submissionId}</p>
      </div>
    </main>
  );
}