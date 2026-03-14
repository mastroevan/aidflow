export type UrgentNeed = 
| "Food assistance"
| "Rent support"
| "Utility support"
| "Medical assistance"
| "Emergency shelter";

export type DocumentItem = {
    id: string;
    name: string;
    status: "uploaded" | "missing";
    url?: string;
};

export type AidCase = {
    id: string;
    applicantFullName: string;
    dateOfBirth: string;
    householdSize: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    preferredContactMethod: "Phone" | "Email" | "Text";
    lifeEvent: "Job loss" | "Sudden illness" | "Disaster displacement";
    monthlyIncome: number;
    employmentStatus: "Unemployed" | "Part-time" | "Unable to work" | "Displaced";
    urgentNeeds: UrgentNeed[];
    documents: DocumentItem[];
    consentToSubmit: boolean;
    reviewerApproved?: boolean;
};


