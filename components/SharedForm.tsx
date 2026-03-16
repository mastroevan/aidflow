"use client";

import { AidCase } from "@/lib/schema";
import {
  employmentStatusOptions,
  lifeEventOptions,
  preferredContactMethods,
  urgentNeedOptions,
} from "@/lib/schema";
import DocumentChecklist from "@/components/DocumentChecklist";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: AidCase;
  layout: "A" | "B" | "C";
};

export default function SharedForm({ initialData, layout }: Props) {
  const [form, setForm] = useState<AidCase>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function update<K extends keyof AidCase>(key: K, value: AidCase[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNeed(need: (typeof urgentNeedOptions)[number]) {
    const nextNeeds = form.urgentNeeds.includes(need)
      ? form.urgentNeeds.filter((item) => item !== need)
      : [...form.urgentNeeds, need];

    update("urgentNeeds", nextNeeds);
  }

  function goToReview() {
    setError(null);
    setIsSaving(true);

    void (async () => {
      try {
        const response = await fetch(`/api/cases/${form.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error ?? "We could not save your draft.");
          return;
        }

        const intakeResponse = await fetch(
          `/api/cases/${result.formData.id}/intake-analysis`,
          {
            method: "POST",
          }
        );
        const intakeResult = await intakeResponse.json();

        if (!intakeResponse.ok) {
          setError(intakeResult.error ?? "We could not analyze the intake packet.");
          return;
        }

        const eligibilityResponse = await fetch(
          `/api/cases/${result.formData.id}/eligibility-analysis`,
          {
            method: "POST",
          }
        );
        const eligibilityResult = await eligibilityResponse.json();

        if (!eligibilityResponse.ok) {
          setError(
            eligibilityResult.error ??
              "We could not generate eligibility recommendations."
          );
          return;
        }

        router.push(`/review/${eligibilityResult.formData.id}?layout=${layout}`);
      } catch (requestError) {
        console.error("Save draft error:", requestError);
        setError("We could not save and analyze your draft.");
      } finally {
        setIsSaving(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">
              Case status
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {form.status.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Resume token: {form.resumeToken}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-gray-900">Packet version</p>
            <p className="mt-1">v{form.packetVersion}</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Applicant details</h2>
          <p className="mt-1 text-sm text-gray-600">
            Update the intake packet before sending it to review.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.applicantFullName}
            onChange={(e) => update("applicantFullName", e.target.value)}
            placeholder="Full name"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            placeholder="Date of birth"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={String(form.householdSize)}
            type="number"
            min={1}
            onChange={(e) => update("householdSize", Number(e.target.value))}
            placeholder="Household size"
          />
          <select
            className="rounded-2xl border border-gray-300 p-3"
            value={form.preferredContactMethod}
            onChange={(e) =>
              update("preferredContactMethod", e.target.value as AidCase["preferredContactMethod"])
            }
          >
            {preferredContactMethods.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Phone"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Email"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Address"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="State"
          />
          <input
            className="rounded-2xl border border-gray-300 p-3"
            value={form.zipCode}
            onChange={(e) => update("zipCode", e.target.value)}
            placeholder="ZIP"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Situation overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            These details are saved into the case packet used by review and submission.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-2xl border border-gray-300 p-3"
            value={form.lifeEvent}
            onChange={(e) => update("lifeEvent", e.target.value as AidCase["lifeEvent"])}
          >
            {lifeEventOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-gray-300 p-3"
            value={form.employmentStatus}
            onChange={(e) =>
              update("employmentStatus", e.target.value as AidCase["employmentStatus"])
            }
          >
            {employmentStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <input
          className="w-full rounded-2xl border border-gray-300 p-3"
          type="number"
          min={0}
          value={form.monthlyIncome}
          onChange={(e) => update("monthlyIncome", Number(e.target.value))}
          placeholder="Monthly income"
        />

        <div className="space-y-3 rounded-3xl border border-gray-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              Urgent needs
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Select the support categories this case should prioritize.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {urgentNeedOptions.map((need) => {
              const selected = form.urgentNeeds.includes(need);

              return (
                <button
                  key={need}
                  type="button"
                  onClick={() => toggleNeed(need)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black"
                  }`}
                >
                  {need}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <DocumentChecklist documents={form.documents} />

      <label className="flex items-start gap-3 rounded-3xl border border-gray-200 bg-white p-5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={form.consentToSubmit}
          onChange={(e) => update("consentToSubmit", e.target.checked)}
        />
        <div>
          <p className="font-medium text-gray-900">Consent to submit</p>
          <p className="mt-1 text-sm text-gray-600">
            This must be checked before the packet can move to the review step.
          </p>
        </div>
      </label>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        onClick={goToReview}
        disabled={isSaving || !form.consentToSubmit}
        className="rounded-2xl bg-black px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving and analyzing..." : "Save, analyze, and review"}
      </button>
    </div>
  );
}
