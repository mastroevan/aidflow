import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">AidFlow Autopilot Demo Portal</h1>
      <p className="text-gray-600">
        Standardized demo portal for social-service application submission.
      </p>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Demo Layouts</h2>
        <div className="flex flex-col gap-3">
          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/demo/layout-a?caseId=case-001">
            Layout A — Government-style intake
          </Link>
          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/demo/layout-b?caseId=case-001">
            Layout B — Wizard flow
          </Link>
          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/demo/layout-c?caseId=case-001">
            Layout C — Case worker review style
          </Link>
        </div>
      </div>
    </main>
  );
}