import { randomUUID } from "node:crypto";
import {
  CaseStatus,
  EligibilityStatus,
  Prisma,
  ReviewDecision,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  runEligibilityAnalysis,
  runIntakeAnalysis,
} from "@/lib/case-intelligence";
import {
  type AidCase,
  type AidCaseAnalysis,
  type AidCaseEligibilityRecommendation,
  type AidCasePacket,
  type DocumentItem,
  type EmploymentStatus,
  employmentStatusOptions,
  type LifeEvent,
  lifeEventOptions,
  preferredContactMethods,
  type ReviewLayout,
  type UrgentNeed,
  urgentNeedOptions,
} from "@/lib/schema";

const caseDetailArgs = Prisma.validator<Prisma.CaseDefaultArgs>()({
  include: {
    applicant: true,
    documents: {
      orderBy: { createdAt: "asc" },
    },
    eligibilityItems: {
      orderBy: { priorityOrder: "asc" },
    },
    applicationPacket: true,
    reviews: {
      include: {
        reviewer: true,
      },
      orderBy: { createdAt: "desc" },
    },
    submission: true,
  },
});

const demoPortalUserArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    email: true,
    password: true,
    name: true,
    role: true,
    cases: {
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        lifeEvent: true,
        updatedAt: true,
        submission: {
          select: {
            confirmationId: true,
          },
        },
      },
    },
  },
});

type CaseDetailRecord = Prisma.CaseGetPayload<typeof caseDetailArgs>;
type DemoPortalUserRecord = Prisma.UserGetPayload<typeof demoPortalUserArgs>;

export type DemoPortalAccount = {
  email: string;
  password: string;
  name: string;
  role: "Applicant" | "Reviewer";
  caseId: string | null;
  redirectPath: string;
};

export type DemoPortalCaseCard = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  lifeEvent: string;
  status: string;
  updatedAt: string;
  confirmationId: string | null;
};

export type DemoPortalOverview = {
  accounts: DemoPortalAccount[];
  cases: DemoPortalCaseCard[];
};

export class CaseActionError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "CaseActionError";
  }
}

const defaultEmploymentByLifeEvent: Record<LifeEvent, EmploymentStatus> = {
  "Job loss": "Unemployed",
  "Sudden illness": "Unable to work",
  "Disaster displacement": "Displaced",
};

const defaultUrgentNeedsByLifeEvent: Record<LifeEvent, UrgentNeed[]> = {
  "Job loss": ["Food assistance", "Rent support"],
  "Sudden illness": ["Medical assistance", "Utility support"],
  "Disaster displacement": ["Emergency shelter", "Food assistance"],
};

function isRecord(value: Prisma.JsonValue | null | undefined): value is Record<string, Prisma.JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  value: Prisma.JsonValue | undefined,
  fallback = ""
) {
  return typeof value === "string" ? value : fallback;
}

function readNumber(
  value: Prisma.JsonValue | undefined,
  fallback = 0
) {
  return typeof value === "number" ? value : fallback;
}

function readBoolean(
  value: Prisma.JsonValue | undefined,
  fallback = false
) {
  return typeof value === "boolean" ? value : fallback;
}

function readStringArray(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function coerceEnum<T extends readonly string[]>(
  value: Prisma.JsonValue | undefined,
  allowed: T,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

function coerceEnumArray<T extends readonly string[]>(
  value: Prisma.JsonValue | undefined,
  allowed: T,
  fallback: readonly T[number][]
): T[number][] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const filtered = value.filter(
    (item): item is T[number] =>
      typeof item === "string" && allowed.includes(item as T[number])
  );

  return filtered.length > 0 ? filtered : [...fallback];
}

function normalizeLifeEvent(rawLifeEvent: string): LifeEvent {
  return lifeEventOptions.includes(rawLifeEvent as LifeEvent)
    ? (rawLifeEvent as LifeEvent)
    : "Job loss";
}

function toDocumentStatus(status: string): AidCase["documents"][number]["status"] {
  if (status === "NEEDS_REVIEW") {
    return "needs_review";
  }

  return status === "MISSING" ? "missing" : "uploaded";
}

function packetToJson(packet: AidCasePacket): Prisma.InputJsonValue {
  return {
    applicantFullName: packet.applicantFullName,
    dateOfBirth: packet.dateOfBirth,
    householdSize: packet.householdSize,
    address: packet.address,
    city: packet.city,
    state: packet.state,
    zipCode: packet.zipCode,
    phone: packet.phone,
    email: packet.email,
    preferredContactMethod: packet.preferredContactMethod,
    lifeEvent: packet.lifeEvent,
    monthlyIncome: packet.monthlyIncome,
    employmentStatus: packet.employmentStatus,
    urgentNeeds: packet.urgentNeeds,
    consentToSubmit: packet.consentToSubmit,
  } satisfies Prisma.InputJsonObject;
}

function buildApplicationPacketJson(
  packet: AidCasePacket,
  existingPacketJson?: Prisma.JsonValue | null,
  updates?: {
    aidflowAnalysis?: AidCaseAnalysis | null;
  }
): Prisma.InputJsonValue {
  const basePacket = packetToJson(packet);
  const existingExtras =
    isRecord(existingPacketJson)
      ? Object.fromEntries(
          Object.entries(existingPacketJson).filter(
            ([key]) =>
              ![
                "applicantFullName",
                "dateOfBirth",
                "householdSize",
                "address",
                "city",
                "state",
                "zipCode",
                "phone",
                "email",
                "preferredContactMethod",
                "lifeEvent",
                "monthlyIncome",
                "employmentStatus",
                "urgentNeeds",
                "consentToSubmit",
              ].includes(key)
          )
        )
      : {};

  return {
    ...existingExtras,
    ...(basePacket as Prisma.InputJsonObject),
    ...(updates?.aidflowAnalysis
      ? {
          aidflowAnalysis: updates.aidflowAnalysis,
        }
      : {}),
  } satisfies Prisma.InputJsonObject;
}

function buildPacketDefaults(aidCase: CaseDetailRecord): AidCasePacket {
  const lifeEvent = normalizeLifeEvent(aidCase.lifeEvent);

  return {
    applicantFullName: aidCase.applicant.name,
    dateOfBirth: "",
    householdSize: 1,
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: aidCase.applicant.email,
    preferredContactMethod: "Email",
    lifeEvent,
    monthlyIncome: 0,
    employmentStatus: defaultEmploymentByLifeEvent[lifeEvent],
    urgentNeeds: [...defaultUrgentNeedsByLifeEvent[lifeEvent]],
    consentToSubmit: true,
  };
}

function parseAidCaseAnalysis(packetJson?: Prisma.JsonValue | null): AidCaseAnalysis | null {
  if (!isRecord(packetJson) || !isRecord(packetJson.aidflowAnalysis)) {
    return null;
  }

  const raw = packetJson.aidflowAnalysis;

  return {
    provider: "rules-engine",
    generatedAt: readString(raw.generatedAt, new Date(0).toISOString()),
    confidenceLabel:
      readString(raw.confidenceLabel) === "High" ||
      readString(raw.confidenceLabel) === "Medium"
        ? (readString(raw.confidenceLabel) as AidCaseAnalysis["confidenceLabel"])
        : "Review Needed",
    householdSnapshot: readString(raw.householdSnapshot),
    prioritySummary: readString(raw.prioritySummary),
    extractedFacts: readStringArray(raw.extractedFacts),
    blockers: readStringArray(raw.blockers),
    nextSteps: readStringArray(raw.nextSteps),
  };
}

function normalizePacket(aidCase: CaseDetailRecord): AidCasePacket {
  const defaults = buildPacketDefaults(aidCase);
  const packet = isRecord(aidCase.applicationPacket?.packetJson)
    ? aidCase.applicationPacket.packetJson
    : null;

  if (!packet) {
    return defaults;
  }

  const lifeEvent = coerceEnum(
    packet.lifeEvent,
    lifeEventOptions,
    defaults.lifeEvent
  );

  return {
    applicantFullName: readString(packet.applicantFullName, defaults.applicantFullName),
    dateOfBirth: readString(packet.dateOfBirth, defaults.dateOfBirth),
    householdSize: readNumber(packet.householdSize, defaults.householdSize),
    address: readString(packet.address, defaults.address),
    city: readString(packet.city, defaults.city),
    state: readString(packet.state, defaults.state),
    zipCode: readString(packet.zipCode, defaults.zipCode),
    phone: readString(packet.phone, defaults.phone),
    email: readString(packet.email, defaults.email),
    preferredContactMethod: coerceEnum(
      packet.preferredContactMethod,
      preferredContactMethods,
      defaults.preferredContactMethod
    ),
    lifeEvent,
    monthlyIncome: readNumber(packet.monthlyIncome, defaults.monthlyIncome),
    employmentStatus: coerceEnum(
      packet.employmentStatus,
      employmentStatusOptions,
      defaultEmploymentByLifeEvent[lifeEvent]
    ),
    urgentNeeds: coerceEnumArray(
      packet.urgentNeeds,
      urgentNeedOptions,
      defaultUrgentNeedsByLifeEvent[lifeEvent]
    ),
    consentToSubmit: readBoolean(
      packet.consentToSubmit,
      defaults.consentToSubmit
    ),
  };
}

export function buildCaseSummaryText(packet: AidCasePacket) {
  const income = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(packet.monthlyIncome);

  return [
    `${packet.lifeEvent}.`,
    `${packet.employmentStatus} applicant in a household of ${packet.householdSize}.`,
    `Urgent needs: ${packet.urgentNeeds.join(", ")}.`,
    `Monthly income: ${income}.`,
  ].join(" ");
}

function mapEligibilityRecommendationStatus(
  status: EligibilityStatus
): AidCaseEligibilityRecommendation["status"] {
  if (status === EligibilityStatus.LIKELY_ELIGIBLE) {
    return "LIKELY_ELIGIBLE";
  }

  if (status === EligibilityStatus.MAYBE_ELIGIBLE) {
    return "MAYBE_ELIGIBLE";
  }

  return "UNLIKELY";
}

function toEligibilityStatus(
  status: AidCaseEligibilityRecommendation["status"]
) {
  if (status === "LIKELY_ELIGIBLE") {
    return EligibilityStatus.LIKELY_ELIGIBLE;
  }

  if (status === "MAYBE_ELIGIBLE") {
    return EligibilityStatus.MAYBE_ELIGIBLE;
  }

  return EligibilityStatus.UNLIKELY;
}

function mapDocumentsFromCaseRecord(aidCase: CaseDetailRecord): DocumentItem[] {
  return aidCase.documents.map((document) => ({
    id: document.id,
    name: document.name,
    type: document.type,
    status: toDocumentStatus(document.status),
    url: document.url ?? undefined,
    evidenceNote: document.evidenceNote ?? undefined,
  }));
}

export function mapCaseRecordToAidCase(aidCase: CaseDetailRecord): AidCase {
  const packet = normalizePacket(aidCase);
  const latestReview = aidCase.reviews[0];

  return {
    id: aidCase.id,
    applicantUserId: aidCase.applicantUserId,
    applicantFullName: packet.applicantFullName,
    dateOfBirth: packet.dateOfBirth,
    householdSize: packet.householdSize,
    address: packet.address,
    city: packet.city,
    state: packet.state,
    zipCode: packet.zipCode,
    phone: packet.phone,
    email: packet.email,
    preferredContactMethod: packet.preferredContactMethod,
    lifeEvent: packet.lifeEvent,
    monthlyIncome: packet.monthlyIncome,
    employmentStatus: packet.employmentStatus,
    urgentNeeds: packet.urgentNeeds,
    documents: mapDocumentsFromCaseRecord(aidCase),
    analysis: parseAidCaseAnalysis(aidCase.applicationPacket?.packetJson),
    eligibility: aidCase.eligibilityItems.map((item) => ({
      id: item.id,
      programName: item.programName,
      status: mapEligibilityRecommendationStatus(item.status),
      reasoningSummary: item.reasoningSummary,
      evidenceLinks: Array.isArray(item.evidenceLinksJson)
        ? item.evidenceLinksJson.map((entry) => String(entry))
        : [],
      priorityOrder: item.priorityOrder,
    })),
    consentToSubmit: packet.consentToSubmit,
    reviewerApproved:
      latestReview?.decision === ReviewDecision.APPROVED ||
      aidCase.status === CaseStatus.APPROVED ||
      aidCase.status === CaseStatus.SUBMITTED,
    status: aidCase.status,
    summaryText: aidCase.summaryText,
    resumeToken: aidCase.resumeToken,
    lastUpdatedAt: aidCase.updatedAt.toISOString(),
    packetVersion: aidCase.applicationPacket?.packetVersion ?? 1,
    latestReviewDecision: latestReview?.decision ?? null,
    submissionConfirmationId: aidCase.submission?.confirmationId ?? null,
    submissionSubmittedAt: aidCase.submission?.submittedAt.toISOString() ?? null,
  };
}

export async function getCaseDetailById(id: string) {
  return db.case.findUnique({
    where: { id },
    ...caseDetailArgs,
  });
}

export async function getApplicantCaseById(id: string) {
  const aidCase = await getCaseDetailById(id);
  return aidCase ? mapCaseRecordToAidCase(aidCase) : null;
}

export async function getDefaultApplicantCase() {
  const aidCase = await db.case.findFirst({
    where: {
      status: {
        not: CaseStatus.SUBMITTED,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    ...caseDetailArgs,
  });

  return aidCase ? mapCaseRecordToAidCase(aidCase) : null;
}

function nextStatusAfterDraftSave(status: CaseStatus) {
  if (status === CaseStatus.DRAFT || status === CaseStatus.CHANGES_REQUESTED) {
    return CaseStatus.INTAKE_COMPLETE;
  }

  return status;
}

function sanitizePacket(packet: AidCase): AidCasePacket {
  return {
    applicantFullName: packet.applicantFullName.trim(),
    dateOfBirth: packet.dateOfBirth,
    householdSize: Math.max(1, packet.householdSize),
    address: packet.address.trim(),
    city: packet.city.trim(),
    state: packet.state.trim(),
    zipCode: packet.zipCode.trim(),
    phone: packet.phone.trim(),
    email: packet.email.trim(),
    preferredContactMethod: packet.preferredContactMethod,
    lifeEvent: packet.lifeEvent,
    monthlyIncome: Math.max(0, packet.monthlyIncome),
    employmentStatus: packet.employmentStatus,
    urgentNeeds: packet.urgentNeeds,
    consentToSubmit: packet.consentToSubmit,
  };
}

export async function saveAidCaseDraft(id: string, incomingCase: AidCase) {
  const current = await getCaseDetailById(id);

  if (!current) {
    throw new CaseActionError("Case not found.", 404);
  }

  if (current.status === CaseStatus.SUBMITTED) {
    throw new CaseActionError("Submitted cases are read-only.", 409);
  }

  const packet = sanitizePacket(incomingCase);
  const summaryText = buildCaseSummaryText(packet);
  const nextStatus = nextStatusAfterDraftSave(current.status);

  await db.$transaction([
    db.user.update({
      where: { id: current.applicantUserId },
      data: {
        name: packet.applicantFullName,
        email: packet.email,
      },
    }),
    db.case.update({
      where: { id },
      data: {
        lifeEvent: packet.lifeEvent,
        summaryText,
        status: nextStatus,
      },
    }),
    db.applicationPacket.upsert({
      where: { caseId: id },
      create: {
        caseId: id,
        packetJson: buildApplicationPacketJson(
          packet,
          current.applicationPacket?.packetJson
        ),
      },
      update: {
        packetJson: buildApplicationPacketJson(
          packet,
          current.applicationPacket?.packetJson
        ),
        packetVersion: {
          increment: 1,
        },
        generatedAt: new Date(),
      },
    }),
  ]);

  const updated = await getApplicantCaseById(id);

  if (!updated) {
    throw new CaseActionError("Saved case could not be reloaded.", 500);
  }

  return updated;
}

export async function runSavedCaseIntakeAnalysis(caseId: string) {
  const current = await getCaseDetailById(caseId);

  if (!current) {
    throw new CaseActionError("Case not found.", 404);
  }

  if (current.submission) {
    throw new CaseActionError("Submitted cases cannot be re-analyzed.", 409);
  }

  const packet = normalizePacket(current);
  const documents = mapDocumentsFromCaseRecord(current);
  const analysis = runIntakeAnalysis(packet, documents);

  await db.applicationPacket.upsert({
    where: { caseId },
    create: {
      caseId,
      packetJson: buildApplicationPacketJson(packet, null, {
        aidflowAnalysis: analysis,
      }),
    },
    update: {
      packetJson: buildApplicationPacketJson(
        packet,
        current.applicationPacket?.packetJson,
        {
          aidflowAnalysis: analysis,
        }
      ),
      packetVersion: {
        increment: 1,
      },
      generatedAt: new Date(),
    },
  });

  const updated = await getApplicantCaseById(caseId);

  if (!updated) {
    throw new CaseActionError("Case could not be reloaded after intake analysis.", 500);
  }

  return updated;
}

function nextStatusAfterEligibilityRun(status: CaseStatus) {
  if (
    status === CaseStatus.DRAFT ||
    status === CaseStatus.INTAKE_COMPLETE ||
    status === CaseStatus.CHANGES_REQUESTED
  ) {
    return CaseStatus.UNDER_REVIEW;
  }

  return status;
}

export async function runSavedCaseEligibilityAnalysis(caseId: string) {
  const current = await getCaseDetailById(caseId);

  if (!current) {
    throw new CaseActionError("Case not found.", 404);
  }

  if (current.submission) {
    throw new CaseActionError("Submitted cases cannot be re-analyzed.", 409);
  }

  const packet = normalizePacket(current);
  const documents = mapDocumentsFromCaseRecord(current);
  const recommendations = runEligibilityAnalysis(packet, documents);

  await db.$transaction([
    db.eligibilityResult.deleteMany({
      where: { caseId },
    }),
    db.eligibilityResult.createMany({
      data: recommendations.map((recommendation) => ({
        caseId,
        programName: recommendation.programName,
        status: toEligibilityStatus(recommendation.status),
        reasoningSummary: recommendation.reasoningSummary,
        evidenceLinksJson: recommendation.evidenceLinks,
        priorityOrder: recommendation.priorityOrder,
      })),
    }),
    db.case.update({
      where: { id: caseId },
      data: {
        status: nextStatusAfterEligibilityRun(current.status),
      },
    }),
  ]);

  const updated = await getApplicantCaseById(caseId);

  if (!updated) {
    throw new CaseActionError("Case could not be reloaded after eligibility analysis.", 500);
  }

  return updated;
}

function createConfirmationId() {
  return `AID-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function submitAidCase(input: {
  caseId: string;
  layout: ReviewLayout;
}) {
  const current = await getCaseDetailById(input.caseId);

  if (!current) {
    throw new CaseActionError("Case not found.", 404);
  }

  if (current.submission) {
    throw new CaseActionError("Case has already been submitted.", 409);
  }

  const packet = mapCaseRecordToAidCase(current);

  if (!packet.consentToSubmit) {
    throw new CaseActionError("Applicant consent is required before submission.", 400);
  }

  const reviewerId =
    current.reviews[0]?.reviewerUserId ??
    (
      await db.user.findFirst({
        where: { role: UserRole.REVIEWER },
        select: { id: true },
      })
    )?.id;

  if (!reviewerId) {
    throw new CaseActionError("No reviewer account is available for submission.", 500);
  }

  const confirmationId = createConfirmationId();
  const approvedAt = new Date();
  const submittedBy = `${packet.applicantFullName} <${packet.email}>`;

  await db.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: input.caseId },
      data: {
        status: CaseStatus.SUBMITTED,
        summaryText: buildCaseSummaryText(packet),
      },
    });

    if (current.reviews[0]) {
      await tx.review.update({
        where: { id: current.reviews[0].id },
        data: {
          decision: ReviewDecision.APPROVED,
          notes:
            current.reviews[0].notes ??
            `Approved for layout ${input.layout} demo submission.`,
          approvedAt,
        },
      });
    } else {
      await tx.review.create({
        data: {
          caseId: input.caseId,
          reviewerUserId: reviewerId,
          decision: ReviewDecision.APPROVED,
          notes: `Approved for layout ${input.layout} demo submission.`,
          approvedAt,
        },
      });
    }

    await tx.submission.create({
      data: {
        caseId: input.caseId,
        submittedBy,
        portalLayout: input.layout,
        confirmationId,
      },
    });
  });

  const updated = await getCaseDetailById(input.caseId);

  if (!updated || !updated.submission) {
    throw new CaseActionError("Submission could not be loaded after save.", 500);
  }

  return {
    confirmationId: updated.submission.confirmationId,
    submittedAt: updated.submission.submittedAt.toISOString(),
    case: mapCaseRecordToAidCase(updated),
  };
}

function buildAccountRedirectPath(user: DemoPortalUserRecord) {
  if (user.role === UserRole.REVIEWER) {
    return "/reviewer";
  }

  const preferredCase =
    user.cases.find((aidCase) => aidCase.status !== CaseStatus.SUBMITTED) ??
    user.cases[0];

  return preferredCase ? `/demo/layout-a?caseId=${preferredCase.id}` : "/";
}

export async function getDemoPortalOverview(): Promise<DemoPortalOverview> {
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "asc",
    },
    ...demoPortalUserArgs,
  });

  return {
    accounts: users.map((user) => {
      const preferredCase =
        user.cases.find((aidCase) => aidCase.status !== CaseStatus.SUBMITTED) ??
        user.cases[0];

      return {
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role === UserRole.REVIEWER ? "Reviewer" : "Applicant",
        caseId: preferredCase?.id ?? null,
        redirectPath: buildAccountRedirectPath(user),
      };
    }),
    cases: users
      .filter((user) => user.role === UserRole.APPLICANT)
      .map((user) => {
        const latestCase = user.cases[0];

        return {
          id: latestCase?.id ?? user.id,
          applicantName: user.name,
          applicantEmail: user.email,
          lifeEvent: latestCase?.lifeEvent ?? "No case available",
          status: latestCase?.status ?? "NO_CASE",
          updatedAt: latestCase?.updatedAt.toISOString() ?? new Date(0).toISOString(),
          confirmationId: latestCase?.submission?.confirmationId ?? null,
        };
      }),
  };
}

export async function getSubmissionByConfirmationId(confirmationId: string) {
  return db.submission.findUnique({
    where: { confirmationId },
    include: {
      case: {
        include: {
          applicant: true,
        },
      },
    },
  });
}
