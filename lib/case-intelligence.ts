import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
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

export type CombinedCaseAnalysis = {
  analysis: AidCaseAnalysis;
  eligibility: AidCaseEligibilityRecommendation[];
};

let bedrockClient: BedrockRuntimeClient | null = null;

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

  if (
    missing.has(normalizeDocumentName("Photo ID")) &&
    rule.requiredDocuments.includes("Photo ID")
  ) {
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

function statusFromScore(
  result: EligibilityScore
): AidCaseEligibilityRecommendation["status"] {
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

function buildFallbackIntakeAnalysis(
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

function buildFallbackEligibility(
  packet: AidCasePacket,
  documents: DocumentItem[]
): AidCaseEligibilityRecommendation[] {
  const ranked = benefitProgramRules
    .map((rule) => scoreRule(packet, documents, rule))
    .sort((left, right) => right.score - left.score);

  const shortlisted = ranked.filter(
    (result) => statusFromScore(result) !== "UNLIKELY"
  );

  return (shortlisted.length > 0 ? shortlisted : ranked.slice(0, 2))
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
}

function buildFallbackCombinedAnalysis(
  packet: AidCasePacket,
  documents: DocumentItem[]
): CombinedCaseAnalysis {
  return {
    analysis: buildFallbackIntakeAnalysis(packet, documents),
    eligibility: buildFallbackEligibility(packet, documents),
  };
}

function getBedrockClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(process.env.AWS_SESSION_TOKEN
          ? { sessionToken: process.env.AWS_SESSION_TOKEN }
          : {}),
      },
    });
  }

  return bedrockClient;
}

function cleanJsonResponse(rawText: string) {
  const fenced = rawText.replace(/```json|```/gi, "").trim();
  const firstBrace = fenced.indexOf("{");
  const lastBrace = fenced.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model response did not contain a JSON object.");
  }

  return fenced.slice(firstBrace, lastBrace + 1);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeNovaAnalysis(raw: unknown): AidCaseAnalysis {
  if (!raw || typeof raw !== "object") {
    throw new Error("Missing analysis payload.");
  }

  const analysis = raw as Record<string, unknown>;
  const confidenceLabel =
    analysis.confidenceLabel === "High" ||
    analysis.confidenceLabel === "Medium" ||
    analysis.confidenceLabel === "Review Needed"
      ? analysis.confidenceLabel
      : "Review Needed";

  return {
    provider: "amazon-nova-lite",
    generatedAt: new Date().toISOString(),
    confidenceLabel,
    householdSnapshot: isString(analysis.householdSnapshot)
      ? analysis.householdSnapshot
      : "",
    prioritySummary: isString(analysis.prioritySummary)
      ? analysis.prioritySummary
      : "",
    extractedFacts: normalizeStringArray(analysis.extractedFacts),
    blockers: normalizeStringArray(analysis.blockers),
    nextSteps: normalizeStringArray(analysis.nextSteps),
  };
}

function normalizeNovaEligibility(raw: unknown) {
  if (!Array.isArray(raw)) {
    throw new Error("Missing eligibility payload.");
  }

  const allowedPrograms = new Map(
    benefitProgramRules.map((rule) => [rule.programName, rule.id] as const)
  );

  const normalized = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const recommendation = item as Record<string, unknown>;
      const programName = isString(recommendation.programName)
        ? recommendation.programName
        : null;

      if (!programName || !allowedPrograms.has(programName)) {
        return null;
      }

      const status =
        recommendation.status === "LIKELY_ELIGIBLE" ||
        recommendation.status === "MAYBE_ELIGIBLE" ||
        recommendation.status === "UNLIKELY"
          ? recommendation.status
          : "MAYBE_ELIGIBLE";

      return {
        id: allowedPrograms.get(programName)!,
        programName,
        status,
        reasoningSummary: isString(recommendation.reasoningSummary)
          ? recommendation.reasoningSummary
          : "",
        evidenceLinks: normalizeStringArray(recommendation.evidenceLinks),
        priorityOrder:
          typeof recommendation.priorityOrder === "number"
            ? recommendation.priorityOrder
            : index + 1,
      } satisfies AidCaseEligibilityRecommendation;
    })
    .filter(
      (item): item is AidCaseEligibilityRecommendation =>
        item !== null
    )
    .sort((left, right) => left.priorityOrder - right.priorityOrder)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      priorityOrder: index + 1,
    }));

  if (normalized.length === 0) {
    throw new Error("Model did not return any allowed program matches.");
  }

  return normalized;
}

async function runBedrockCombinedAnalysis(
  packet: AidCasePacket,
  documents: DocumentItem[]
): Promise<CombinedCaseAnalysis> {
  const client = getBedrockClient();
  const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

  if (!client) {
    throw new Error("AWS credentials are not configured for Bedrock.");
  }

  const systemPrompt = [
    "You are AidFlow's intake and eligibility analyst running on Amazon Nova Lite.",
    "Return only valid JSON with no markdown fences.",
    "Use only the supplied benefit programs. Do not invent new programs.",
    "Base your reasoning only on the provided intake packet, document statuses, and policy references.",
    'Output schema: {"analysis":{"confidenceLabel":"High|Medium|Review Needed","householdSnapshot":"string","prioritySummary":"string","extractedFacts":["string"],"blockers":["string"],"nextSteps":["string"]},"eligibility":[{"programName":"string","status":"LIKELY_ELIGIBLE|MAYBE_ELIGIBLE|UNLIKELY","reasoningSummary":"string","evidenceLinks":["string"],"priorityOrder":1}]}',
  ].join(" ");

  const userPayload = {
    packet,
    documents,
    benefitPrograms: benefitProgramRules.map((rule) => ({
      programName: rule.programName,
      summary: rule.summary,
      lifeEvents: rule.lifeEvents,
      urgentNeeds: rule.urgentNeeds,
      maxMonthlyIncome: rule.maxMonthlyIncome,
      requiredDocuments: rule.requiredDocuments,
      supportingDocuments: rule.supportingDocuments,
      nextStep: rule.nextStep,
      policyReference: rule.policyReference,
    })),
  };

  const command = new ConverseCommand({
    modelId,
    system: [
      {
        text: systemPrompt,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            text: JSON.stringify(userPayload, null, 2),
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 1400,
      temperature: 0.2,
    },
  });

  const response = await client.send(command);
  const rawText = response.output?.message?.content
    ?.map((item) => ("text" in item ? item.text : ""))
    .join("\n")
    .trim();

  if (!rawText) {
    throw new Error("Bedrock returned an empty response.");
  }

  const parsed = JSON.parse(cleanJsonResponse(rawText)) as Record<string, unknown>;

  return {
    analysis: normalizeNovaAnalysis(parsed.analysis),
    eligibility: normalizeNovaEligibility(parsed.eligibility),
  };
}

export async function analyzeCase(
  packet: AidCasePacket,
  documents: DocumentItem[]
): Promise<CombinedCaseAnalysis> {
  try {
    return await runBedrockCombinedAnalysis(packet, documents);
  } catch (error) {
    console.warn("Falling back to local AidFlow analysis:", error);
    return buildFallbackCombinedAnalysis(packet, documents);
  }
}
