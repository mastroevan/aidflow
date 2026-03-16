export const urgentNeedOptions = [
  "Food assistance",
  "Rent support",
  "Utility support",
  "Medical assistance",
  "Emergency shelter",
] as const;

export const preferredContactMethods = ["Phone", "Email", "Text"] as const;

export const lifeEventOptions = [
  "Job loss",
  "Sudden illness",
  "Disaster displacement",
] as const;

export const employmentStatusOptions = [
  "Unemployed",
  "Part-time",
  "Unable to work",
  "Displaced",
] as const;

export const reviewLayoutOptions = ["A", "B", "C"] as const;

export type UrgentNeed = (typeof urgentNeedOptions)[number];
export type PreferredContactMethod = (typeof preferredContactMethods)[number];
export type LifeEvent = (typeof lifeEventOptions)[number];
export type EmploymentStatus = (typeof employmentStatusOptions)[number];
export type ReviewLayout = (typeof reviewLayoutOptions)[number];
export type AidCaseDocumentStatus = "uploaded" | "missing" | "needs_review";

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  status: AidCaseDocumentStatus;
  url?: string;
  evidenceNote?: string;
};

export type AidCasePacket = {
  applicantFullName: string;
  dateOfBirth: string;
  householdSize: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  preferredContactMethod: PreferredContactMethod;
  lifeEvent: LifeEvent;
  monthlyIncome: number;
  employmentStatus: EmploymentStatus;
  urgentNeeds: UrgentNeed[];
  consentToSubmit: boolean;
};

export type AidCase = AidCasePacket & {
  id: string;
  applicantUserId: string;
  documents: DocumentItem[];
  reviewerApproved: boolean;
  status: string;
  summaryText: string;
  resumeToken: string;
  lastUpdatedAt: string;
  packetVersion: number;
  latestReviewDecision: string | null;
  submissionConfirmationId: string | null;
  submissionSubmittedAt: string | null;
};


