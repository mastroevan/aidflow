"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const [email, setEmail] = useState(accounts[0]?.email ?? "");
  const [password, setPassword] = useState(accounts[0]?.password ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const passwordHint = accounts[0]?.password ?? "";

  function pickAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
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
          console.error("Demo login error:", requestError);
          setError("Unable to sign in right now.");
        }
      })();
    });
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
          Demo sign-in
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">
          Use seeded demo accounts
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in as an applicant to resume a case, or jump in as the reviewer.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => pickAccount(account)}
            className="rounded-full border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
          >
            {account.name} · {account.role}
          </button>
        ))}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="demo@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password123!"
          />
        </label>

        {passwordHint ? (
          <p className="text-sm text-gray-500">
            Demo password hint: <span className="font-medium text-gray-800">{passwordHint}</span>
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
