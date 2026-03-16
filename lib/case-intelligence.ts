import {
  type AidCaseAnalysis,
  type AidCaseEligibilityRecommendation,
  type AidCasePacket,
  type DocumentItem,
} from "@/lib/schema";
import {
  benefitProgramRules,
  type BenefitProgramRule,
} from "@/lib/benefit-corpus";

type EligibilityScore = {
  rule: BenefitProgramRule;
  score: number;
  uploadedRequiredDocs: string[];
  missingRequiredDocs: string[];
  uploadedSupportingDocs: string[];
};

function titleCaseStatus(status: DocumentItem["status"]) {
  if (status === "needs_review") {
    return "Needs review";
  }

  return status === "uploaded" ? "Uploaded" : "Missing";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeDocumentName(name: string) {
  return name.trim().toLowerCase();
}

function buildDocumentSets(documents: DocumentItem[]) {
  const uploaded = new Set(
    documents
      .filter((document) => document.status === "uploaded")
      .map((document) => normalizeDocumentName(document.name))
  );

  const missing = new Set(
    documents
      .filter((document) => document.status !== "uploaded")
      .map((document) => normalizeDocumentName(document.name))
  );

  return { uploaded, missing };
}

function scoreRule(
  packet: AidCasePacket,
  documents: DocumentItem[],
  rule: BenefitProgramRule
): EligibilityScore {
  const { uploaded, missing } = buildDocumentSets(documents);
  const lifeEventMatch = rule.lifeEvents.includes(packet.lifeEvent);
  const urgentNeedMatches = rule.urgentNeeds.filter((need) =>
    packet.urgentNeeds.includes(need)
  );
  const uploadedRequiredDocs = rule.requiredDocuments.filter((document) =>
    uploaded.has(normalizeDocumentName(document))
  );
  const missingRequiredDocs = rule.requiredDocuments.filter((document) =>
    !uploaded.has(normalizeDocumentName(document))
  );
  const uploadedSupportingDocs = rule.supportingDocuments.filter((document) =>
    uploaded.has(normalizeDocumentName(document))
  );
  const incomeQualified = packet.monthlyIncome <= rule.maxMonthlyIncome;

  let score = 0;

  if (lifeEventMatch) {
    score += 4;
  }

  score += urgentNeedMatches.length * 2;

  if (incomeQualified) {
    score += 3;
  } else if (packet.monthlyIncome <= rule.maxMonthlyIncome + 1200) {
    score += 1;
  } else {
    score -= 2;
  }

  score += uploadedRequiredDocs.length * 2;
  score -= missingRequiredDocs.length;
  score += uploadedSupportingDocs.length;

  if (missing.has(normalizeDocumentName("Photo ID")) && rule.requiredDocuments.includes("Photo ID")) {
    score -= 1;
  }

  return {
    rule,
    score,
    uploadedRequiredDocs,
    missingRequiredDocs,
    uploadedSupportingDocs,
  };
}

function statusFromScore(result: EligibilityScore): AidCaseEligibilityRecommendation["status"] {
  if (result.score >= 8 && result.missingRequiredDocs.length === 0) {
    return "LIKELY_ELIGIBLE";
  }

  if (result.score >= 4) {
    return "MAYBE_ELIGIBLE";
  }

  return "UNLIKELY";
}

function buildReasoningSummary(
  packet: AidCasePacket,
  result: EligibilityScore,
  status: AidCaseEligibilityRecommendation["status"]
) {
  const parts = [
    result.rule.summary,
    `${packet.lifeEvent} and ${formatCurrency(packet.monthlyIncome)} monthly income align with the core program criteria.`,
  ];

  if (status === "MAYBE_ELIGIBLE" && result.missingRequiredDocs.length > 0) {
    parts.push(
      `The case still needs ${result.missingRequiredDocs.join(", ")} before approval can be finalized.`
    );
  }

  if (status === "UNLIKELY") {
    parts.push(
      "The current packet has limited need overlap or missing core evidence compared with stronger-fit programs."
    );
  }

  return parts.join(" ");
}

function buildEvidenceLinks(
  packet: AidCasePacket,
  result: EligibilityScore
) {
  const links = [
    `Policy citation: ${result.rule.policyReference}`,
    `Life event: ${packet.lifeEvent}`,
    `Urgent needs: ${packet.urgentNeeds.join(", ")}`,
    `Monthly income: ${formatCurrency(packet.monthlyIncome)}`,
  ];

  if (result.uploadedRequiredDocs.length > 0) {
    links.push(`Uploaded required docs: ${result.uploadedRequiredDocs.join(", ")}`);
  }

  if (result.uploadedSupportingDocs.length > 0) {
    links.push(`Supporting evidence: ${result.uploadedSupportingDocs.join(", ")}`);
  }

  if (result.missingRequiredDocs.length > 0) {
    links.push(`Missing required docs: ${result.missingRequiredDocs.join(", ")}`);
  }

  links.push(`Recommended next step: ${result.rule.nextStep}`);

  return links;
}

export function runIntakeAnalysis(
  packet: AidCasePacket,
  documents: DocumentItem[]
): AidCaseAnalysis {
  const uploadedDocs = documents.filter((document) => document.status === "uploaded");
  const missingDocs = documents.filter((document) => document.status !== "uploaded");
  const blockers = [
    ...(!packet.address ? ["Address is still missing from the intake packet."] : []),
    ...(!packet.phone ? ["Phone number is missing, so callback outreach may fail."] : []),
    ...missingDocs.map(
      (document) =>
        `${document.name} is ${titleCaseStatus(document.status).toLowerCase()} and may block final verification.`
    ),
  ];

  const confidenceLabel =
    blockers.length === 0
      ? "High"
      : blockers.length <= 2
        ? "Medium"
        : "Review Needed";

  return {
    provider: "rules-engine",
    generatedAt: new Date().toISOString(),
    confidenceLabel,
    householdSnapshot: `${packet.applicantFullName} is navigating ${packet.lifeEvent.toLowerCase()} with a household of ${packet.householdSize}, ${packet.employmentStatus.toLowerCase()} status, and ${formatCurrency(packet.monthlyIncome)} in monthly income.`,
    prioritySummary: `${packet.urgentNeeds[0] ?? "Benefit"} is the top priority, with ${packet.urgentNeeds.slice(1).join(", ") || "no secondary needs listed"} as follow-up support areas.`,
    extractedFacts: [
      `Preferred contact: ${packet.preferredContactMethod}`,
      `Urgent needs selected: ${packet.urgentNeeds.join(", ")}`,
      `Uploaded documents: ${uploadedDocs.map((document) => document.name).join(", ") || "None yet"}`,
      `Household location: ${packet.city || "Unknown city"}, ${packet.state || "Unknown state"}`,
    ],
    blockers,
    nextSteps: [
      missingDocs.length > 0
        ? `Collect ${missingDocs.map((document) => document.name).join(", ")} before the final submission check.`
        : "Move forward with eligibility verification and packet review.",
      "Review the top recommended programs and confirm their evidence citations.",
      "Keep human approval in the loop before any portal submission step.",
    ],
  };
}

export function runEligibilityAnalysis(
  packet: AidCasePacket,
  documents: DocumentItem[]
): AidCaseEligibilityRecommendation[] {
  const ranked = benefitProgramRules
    .map((rule) => scoreRule(packet, documents, rule))
    .sort((left, right) => right.score - left.score);

  const shortlisted = ranked.filter(
    (result) => statusFromScore(result) !== "UNLIKELY"
  );

  const finalList = (shortlisted.length > 0 ? shortlisted : ranked.slice(0, 2))
    .slice(0, 3)
    .map((result, index) => {
      const status = statusFromScore(result);

      return {
        id: result.rule.id,
        programName: result.rule.programName,
        status,
        reasoningSummary: buildReasoningSummary(packet, result, status),
        evidenceLinks: buildEvidenceLinks(packet, result),
        priorityOrder: index + 1,
      };
    });

  return finalList;
}
