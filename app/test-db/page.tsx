import { db } from "@/lib/db";
import { sanitizeDisplayEmail, sanitizeDisplayName } from "@/lib/presentation";

export const dynamic = "force-dynamic";

export default async function TestDbPage() {
  const users = await db.user.findMany({
    include: {
      cases: true,
    },
  });

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">DB Test Page</h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border p-4">
            <p>
              <strong>Name:</strong> {sanitizeDisplayName(user.name)}
            </p>
            <p>
              <strong>Email:</strong> {sanitizeDisplayEmail(user.email)}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>

            <div className="mt-3 space-y-2">
              {user.cases.map((aidCase) => (
                <div key={aidCase.id} className="rounded-lg bg-gray-50 p-3">
                  <p>
                    <strong>Case ID:</strong> {aidCase.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {aidCase.status}
                  </p>
                  <p>
                    <strong>Life Event:</strong> {aidCase.lifeEvent}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
