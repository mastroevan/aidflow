"use client";

import { AidCase } from "@/lib/schema";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: AidCase;
  layout: "A" | "B" | "C";
};

export default function SharedForm({ initialData, layout }: Props) {
  const [form, setForm] = useState<AidCase>(initialData);
  const router = useRouter();

  function update<K extends keyof AidCase>(key: K, value: AidCase[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function goToReview() {
    sessionStorage.setItem(`aidflow-case-${form.id}`, JSON.stringify(form));
    router.push(`/review/${form.id}?layout=${layout}`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="rounded-lg border p-3"
          value={form.applicantFullName}
          onChange={(e) => update("applicantFullName", e.target.value)}
          placeholder="Full name"
        />
        <input
          className="rounded-lg border p-3"
          value={form.dateOfBirth}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          placeholder="Date of birth"
        />
        <input
          className="rounded-lg border p-3"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="Phone"
        />
        <input
          className="rounded-lg border p-3"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="Email"
        />
        <input
          className="rounded-lg border p-3"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Address"
        />
        <input
          className="rounded-lg border p-3"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="City"
        />
        <input
          className="rounded-lg border p-3"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
          placeholder="State"
        />
        <input
          className="rounded-lg border p-3"
          value={form.zipCode}
          onChange={(e) => update("zipCode", e.target.value)}
          placeholder="ZIP"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          className="rounded-lg border p-3"
          value={form.lifeEvent}
          onChange={(e) => update("lifeEvent", e.target.value as AidCase["lifeEvent"])}
        >
          <option>Job loss</option>
          <option>Sudden illness</option>
          <option>Disaster displacement</option>
        </select>

        <input
          className="rounded-lg border p-3"
          type="number"
          value={form.monthlyIncome}
          onChange={(e) => update("monthlyIncome", Number(e.target.value))}
          placeholder="Monthly income"
        />
      </div>

      <button
        onClick={goToReview}
        className="rounded-xl bg-black px-5 py-3 text-white"
      >
        Review application
      </button>
    </div>
  );
}