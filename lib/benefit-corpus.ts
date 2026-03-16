import {
  type LifeEvent,
  type UrgentNeed,
} from "@/lib/schema";

export type BenefitProgramRule = {
  id: string;
  programName: string;
  summary: string;
  lifeEvents: LifeEvent[];
  urgentNeeds: UrgentNeed[];
  maxMonthlyIncome: number;
  requiredDocuments: string[];
  supportingDocuments: string[];
  nextStep: string;
  policyReference: string;
};

export const benefitProgramRules: BenefitProgramRule[] = [
  {
    id: "food-emergency-assistance",
    programName: "Emergency Food Assistance",
    summary:
      "Rapid grocery and meal support for households facing a sudden income disruption.",
    lifeEvents: ["Job loss", "Disaster displacement", "Sudden illness"],
    urgentNeeds: ["Food assistance"],
    maxMonthlyIncome: 2600,
    requiredDocuments: ["Photo ID"],
    supportingDocuments: ["Termination Letter", "Doctor Note", "Displacement Verification"],
    nextStep: "Prioritize same-day food support and confirm household size for benefit amount.",
    policyReference: "AidFlow Program Guide §1.2 Emergency Food Assistance",
  },
  {
    id: "temporary-rent-relief",
    programName: "Temporary Rent Relief",
    summary:
      "Short-term housing stabilization for applicants who can document a recent loss of income.",
    lifeEvents: ["Job loss", "Disaster displacement"],
    urgentNeeds: ["Rent support", "Emergency shelter"],
    maxMonthlyIncome: 3200,
    requiredDocuments: ["Photo ID", "Proof of Address"],
    supportingDocuments: ["Termination Letter", "Displacement Verification"],
    nextStep:
      "Verify address and hardship documentation before moving this packet to landlord outreach.",
    policyReference: "AidFlow Program Guide §2.1 Housing Stabilization",
  },
  {
    id: "utility-stabilization-grant",
    programName: "Utility Stabilization Grant",
    summary:
      "Prevents shutoffs for households dealing with temporary hardship and low-to-moderate income.",
    lifeEvents: ["Job loss", "Sudden illness", "Disaster displacement"],
    urgentNeeds: ["Utility support"],
    maxMonthlyIncome: 3000,
    requiredDocuments: ["Photo ID", "Proof of Address"],
    supportingDocuments: ["Recent Pay Stub", "Doctor Note", "Termination Letter"],
    nextStep: "Collect the most recent utility bill or alternate address proof before final review.",
    policyReference: "AidFlow Program Guide §3.4 Utility Stabilization",
  },
  {
    id: "medical-hardship-support",
    programName: "Medical Hardship Support",
    summary:
      "Bridges urgent medical and recovery-related expenses when illness interrupts work capacity.",
    lifeEvents: ["Sudden illness"],
    urgentNeeds: ["Medical assistance", "Utility support"],
    maxMonthlyIncome: 3500,
    requiredDocuments: ["Photo ID", "Doctor Note"],
    supportingDocuments: ["Recent Pay Stub"],
    nextStep: "Escalate for care coordination once medical verification is complete.",
    policyReference: "AidFlow Program Guide §4.3 Medical Hardship",
  },
  {
    id: "emergency-shelter-support",
    programName: "Emergency Shelter Support",
    summary:
      "Places displaced households into emergency lodging and connects them to follow-on services.",
    lifeEvents: ["Disaster displacement"],
    urgentNeeds: ["Emergency shelter", "Food assistance"],
    maxMonthlyIncome: 4200,
    requiredDocuments: ["Displacement Verification"],
    supportingDocuments: ["Photo ID", "Proof of Address"],
    nextStep: "Route to shelter placement immediately and flag missing identity documents for follow-up.",
    policyReference: "AidFlow Program Guide §5.1 Emergency Shelter",
  },
];
