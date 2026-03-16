import Link from "next/link";
import DemoLoginForm from "@/components/DemoLoginForm";
import { getDemoPortalOverview } from "@/lib/case-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let portalData = null;
  let loadError: string | null = null;

  try {
    portalData = await getDemoPortalOverview();
  } catch (error) {
    console.error("Demo portal load error:", error);
    loadError = "AidFlow could not connect to the demo database. The portal is configured, but live case data is unavailable right now.";
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f4ee_0%,#ffffff_45%,#eef5fb_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-500">
              AidFlow
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">
              Demo portal for applicant intake, review, and submission.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600">
              Compare three intake layouts, resume seeded applicant cases, and verify that
              reviewer actions and final submissions stay tied to the same Prisma-backed case.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/reviewer"
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open reviewer dashboard
              </Link>
              <Link
                href="/test-db"
                className="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-black hover:text-black"
              >
                Inspect seeded data
              </Link>
            </div>
          </div>

          <div>
            <DemoLoginForm accounts={portalData?.accounts ?? []} />
          </div>
        </section>

        {loadError ? (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            {loadError}
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white/90 p-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                Applicant cases
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">
                Resume each seeded case in any layout
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              All three layouts now save into the same underlying case packet.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {portalData?.cases.map((aidCase) => (
              <article
                key={aidCase.id}
                className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">
                      {aidCase.status.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900">
                      {aidCase.applicantName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{aidCase.applicantEmail}</p>
                  </div>
                  {aidCase.confirmationId ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Submitted
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Life event:</strong> {aidCase.lifeEvent}
                  </p>
                  <p>
                    <strong>Updated:</strong> {new Date(aidCase.updatedAt).toLocaleString()}
                  </p>
                  {aidCase.confirmationId ? (
                    <p>
                      <strong>Confirmation:</strong> {aidCase.confirmationId}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Link
                    href={`/demo/layout-a?caseId=${aidCase.id}`}
                    className="rounded-2xl border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-800 transition hover:border-black hover:text-black"
                  >
                    Layout A
                  </Link>
                  <Link
                    href={`/demo/layout-b?caseId=${aidCase.id}`}
                    className="rounded-2xl border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-800 transition hover:border-black hover:text-black"
                  >
                    Layout B
                  </Link>
                  <Link
                    href={`/demo/layout-c?caseId=${aidCase.id}`}
                    className="rounded-2xl border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-800 transition hover:border-black hover:text-black"
                  >
                    Layout C
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
