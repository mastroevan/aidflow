"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sanitizeDisplayName } from "@/lib/presentation";

type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: "Applicant" | "Reviewer";
  caseId: string | null;
  redirectPath: string;
};

type Props = {
  accounts: DemoAccount[];
};

export default function DemoLoginForm({ accounts }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  function continueAs(account: DemoAccount) {
    setError(null);
    setActiveEmail(account.email);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: account.email,
              password: account.password,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            setError(result.error ?? "Unable to sign in.");
            return;
          }

          sessionStorage.setItem("aidflow-session", JSON.stringify(result.user));
          router.push(result.user.redirectPath);
        } catch (requestError) {
          console.error("Portal access error:", requestError);
          setError("Unable to sign in right now.");
        }
      })();
    });
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
          Portal access
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">
          Continue with a prepared account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose an applicant path or jump straight to the reviewer workspace.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => continueAs(account)}
            disabled={isPending}
            className="flex w-full items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition hover:border-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div>
              <p className="text-base font-semibold text-gray-900">
                {sanitizeDisplayName(account.name)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {account.role === "Reviewer" ? "Open the reviewer queue" : "Resume an intake case"}
              </p>
            </div>
            <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
              {isPending && activeEmail === account.email ? "Opening..." : "Continue"}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
