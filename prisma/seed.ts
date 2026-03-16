import {
  PrismaClient,
  UserRole,
  CaseStatus,
  DocumentStatus,
  EligibilityStatus,
  ReviewDecision,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.submission.deleteMany();
  await prisma.review.deleteMany();
  await prisma.applicationPacket.deleteMany();
  await prisma.eligibilityResult.deleteMany();
  await prisma.document.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  const maria = await prisma.user.create({
    data: {
      email: "maria.demo@example.com",
      password: "Password123!",
      name: "Maria Lopez",
      role: UserRole.APPLICANT,
    },
  });

  const kevin = await prisma.user.create({
    data: {
      email: "kevin.demo@example.com",
      password: "Password123!",
      name: "Kevin Carter",
      role: UserRole.APPLICANT,
    },
  });

  const alina = await prisma.user.create({
    data: {
      email: "alina.demo@example.com",
      password: "Password123!",
      name: "Alina Brooks",
      role: UserRole.APPLICANT,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: "reviewer.demo@example.com",
      password: "Password123!",
      name: "Case Worker Demo",
      role: UserRole.REVIEWER,
    },
  });

  await prisma.case.create({
    data: {
      applicantUserId: maria.id,
      status: CaseStatus.UNDER_REVIEW,
      lifeEvent: "Job loss",
      summaryText: "Recently laid off. Needs food and rent support for household of 3.",
      documents: {
        create: [
          { name: "Photo ID", type: "ID", status: DocumentStatus.UPLOADED, url: "/docs/id.pdf" },
          { name: "Termination Letter", type: "Employment", status: DocumentStatus.UPLOADED, url: "/docs/termination.pdf" },
          { name: "Proof of Address", type: "Address", status: DocumentStatus.UPLOADED, url: "/docs/address.pdf" },
        ],
      },
      eligibilityItems: {
        create: [
          {
            programName: "Emergency Food Assistance",
            status: EligibilityStatus.LIKELY_ELIGIBLE,
            reasoningSummary: "Income disruption documented and household size indicates need.",
            evidenceLinksJson: ["Termination Letter", "Household size 3", "Monthly income 0"],
            priorityOrder: 1,
          },
          {
            programName: "Temporary Rent Relief",
            status: EligibilityStatus.LIKELY_ELIGIBLE,
            reasoningSummary: "Recent job loss and proof of address support rent hardship claim.",
            evidenceLinksJson: ["Termination Letter", "Proof of Address"],
            priorityOrder: 2,
          },
        ],
      },
      applicationPacket: {
        create: {
          packetJson: {
            applicantFullName: "Maria Lopez",
            lifeEvent: "Job loss",
            urgentNeeds: ["Food assistance", "Rent support"],
          },
        },
      },
      reviews: {
        create: {
          reviewerUserId: reviewer.id,
          decision: ReviewDecision.PENDING,
        },
      },
    },
  });

  await prisma.case.create({
    data: {
      applicantUserId: kevin.id,
      status: CaseStatus.INTAKE_COMPLETE,
      lifeEvent: "Sudden illness",
      summaryText: "Unable to work temporarily. Needs utility and medical support.",
      documents: {
        create: [
          { name: "Photo ID", type: "ID", status: DocumentStatus.UPLOADED, url: "/docs/id.pdf" },
          { name: "Doctor Note", type: "Medical", status: DocumentStatus.UPLOADED, url: "/docs/doctor.pdf" },
          { name: "Recent Pay Stub", type: "Income", status: DocumentStatus.MISSING },
        ],
      },
      eligibilityItems: {
        create: [
          {
            programName: "Medical Hardship Support",
            status: EligibilityStatus.LIKELY_ELIGIBLE,
            reasoningSummary: "Doctor note supports temporary inability to work.",
            evidenceLinksJson: ["Doctor Note", "Reported reduced income"],
            priorityOrder: 1,
          },
        ],
      },
      applicationPacket: {
        create: {
          packetJson: {
            applicantFullName: "Kevin Carter",
            lifeEvent: "Sudden illness",
            urgentNeeds: ["Medical support", "Utility support"],
          },
        },
      },
    },
  });

  await prisma.case.create({
    data: {
      applicantUserId: alina.id,
      status: CaseStatus.DRAFT,
      lifeEvent: "Disaster displacement",
      summaryText: "Temporarily displaced and needs shelter and food assistance.",
      documents: {
        create: [
          { name: "Photo ID", type: "ID", status: DocumentStatus.MISSING },
          { name: "Displacement Verification", type: "Disaster", status: DocumentStatus.UPLOADED, url: "/docs/disaster.pdf" },
        ],
      },
      eligibilityItems: {
        create: [
          {
            programName: "Emergency Shelter Support",
            status: EligibilityStatus.LIKELY_ELIGIBLE,
            reasoningSummary: "Displacement documentation strongly supports shelter need.",
            evidenceLinksJson: ["Displacement Verification"],
            priorityOrder: 1,
          },
        ],
      },
      applicationPacket: {
        create: {
          packetJson: {
            applicantFullName: "Alina Brooks",
            lifeEvent: "Disaster displacement",
            urgentNeeds: ["Emergency shelter", "Food assistance"],
          },
        },
      },
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });