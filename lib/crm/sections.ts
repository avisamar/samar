import type { Customer } from "./types";

export interface FieldDefinition {
  key: keyof Customer;
  label: string;
  priority: "high" | "medium" | "low";
  type: "text" | "date" | "enum" | "number" | "boolean" | "multi_select" | "json";
}

export interface SectionDefinition {
  id: string;
  label: string;
  fields: FieldDefinition[];
}

// Sections ordered by RM priority (most important first)
export const PROFILE_SECTIONS: SectionDefinition[] = [
  {
    id: "goals",
    label: "Goals & Constraints",
    fields: [
      { key: "goalsSummary", label: "Goals Summary", priority: "high", type: "text" },
      { key: "primaryGoalType", label: "Primary Goal", priority: "high", type: "enum" },
      { key: "primaryGoalHorizon", label: "Goal Horizon", priority: "high", type: "enum" },
      { key: "goalPriorityStyle", label: "Priority Style", priority: "medium", type: "enum" },
      { key: "goalClarityLevel", label: "Clarity Level", priority: "medium", type: "enum" },
      { key: "constraintsSummary", label: "Key Constraints", priority: "high", type: "text" },
      { key: "regulatoryConstraintsNotes", label: "Regulatory Constraints", priority: "medium", type: "text" },
    ],
  },
  {
    id: "income",
    label: "Income & Cashflow",
    fields: [
      { key: "incomeBandAnnual", label: "Annual Income", priority: "high", type: "enum" },
      { key: "incomeStability", label: "Income Stability", priority: "high", type: "enum" },
      { key: "incomeSourcesPrimary", label: "Primary Source", priority: "medium", type: "enum" },
      { key: "incomeSourcesSecondary", label: "Secondary Sources", priority: "low", type: "text" },
      { key: "expenseBandMonthly", label: "Monthly Expenses", priority: "high", type: "enum" },
      { key: "surplusInvestableBand", label: "Investable Surplus", priority: "high", type: "enum" },
      { key: "emergencyBufferStatus", label: "Emergency Buffer", priority: "high", type: "enum" },
      { key: "upcomingLiquidityEvents", label: "Upcoming Liquidity Events", priority: "high", type: "text" },
      { key: "liquidityNeedsHorizon", label: "Liquidity Horizon", priority: "high", type: "enum" },
    ],
  },
  {
    id: "risk",
    label: "Risk Assessment",
    fields: [
      { key: "riskQuestionnaireCompleted", label: "Questionnaire Done", priority: "high", type: "boolean" },
      { key: "riskBucket", label: "Risk Bucket", priority: "high", type: "enum" },
      { key: "behavioralRiskLabel", label: "Behavioral Risk", priority: "high", type: "enum" },
      { key: "liquidityRiskLabel", label: "Liquidity Risk", priority: "high", type: "enum" },
      { key: "returnMismatchFlag", label: "Return Mismatch", priority: "medium", type: "boolean" },
      { key: "riskDiscussionNotes", label: "Discussion Notes", priority: "high", type: "text" },
      { key: "riskDisagreementFlag", label: "Client Disagrees", priority: "medium", type: "enum" },
      { key: "riskAnecdotes", label: "Risk Anecdotes", priority: "medium", type: "text" },
    ],
  },
  {
    id: "preferences",
    label: "Investment Preferences",
    fields: [
      { key: "investmentStylePreference", label: "Investment Style", priority: "high", type: "enum" },
      { key: "liquidityPreference", label: "Liquidity Preference", priority: "high", type: "enum" },
      { key: "assetClassPreference", label: "Asset Classes", priority: "medium", type: "multi_select" },
      { key: "productPreference", label: "Products", priority: "medium", type: "multi_select" },
      { key: "productsToAvoid", label: "Products to Avoid", priority: "medium", type: "text" },
      { key: "taxSensitivity", label: "Tax Sensitivity", priority: "medium", type: "enum" },
      { key: "internationalExposureComfort", label: "International Comfort", priority: "medium", type: "enum" },
      { key: "esgPreference", label: "ESG Preference", priority: "low", type: "enum" },
      { key: "sectorTiltsPreferences", label: "Sector Preferences", priority: "low", type: "text" },
    ],
  },
  {
    id: "professional",
    label: "Professional",
    fields: [
      { key: "occupationType", label: "Occupation", priority: "high", type: "enum" },
      { key: "industry", label: "Industry", priority: "medium", type: "enum" },
      { key: "jobTitle", label: "Job Title", priority: "low", type: "text" },
      { key: "employerBusinessName", label: "Employer/Business", priority: "medium", type: "text" },
      { key: "workLocation", label: "Work Location", priority: "low", type: "text" },
    ],
  },
  {
    id: "identity",
    label: "Identity & Household",
    fields: [
      { key: "fullName", label: "Full Name", priority: "high", type: "text" },
      { key: "dob", label: "Date of Birth", priority: "high", type: "date" },
      { key: "ageBand", label: "Age Band", priority: "medium", type: "enum" },
      { key: "gender", label: "Gender", priority: "low", type: "enum" },
      { key: "maritalStatus", label: "Marital Status", priority: "medium", type: "enum" },
      { key: "dependentsCount", label: "Dependents", priority: "medium", type: "number" },
      { key: "dependentsNotes", label: "Dependents Details", priority: "low", type: "text" },
      { key: "householdStructure", label: "Household", priority: "low", type: "enum" },
      { key: "familyFinancialResponsibilities", label: "Family Responsibilities", priority: "medium", type: "text" },
      { key: "cityOfResidence", label: "City", priority: "high", type: "text" },
      { key: "countryOfResidence", label: "Country", priority: "medium", type: "enum" },
      { key: "residenceStatus", label: "Residence Status", priority: "medium", type: "enum" },
    ],
  },
  {
    id: "contact",
    label: "Contact & Communication",
    fields: [
      { key: "primaryMobile", label: "Primary Mobile", priority: "high", type: "text" },
      { key: "secondaryMobile", label: "Secondary Mobile", priority: "low", type: "text" },
      { key: "emailPrimary", label: "Email", priority: "high", type: "text" },
      { key: "preferredChannel", label: "Preferred Channel", priority: "high", type: "enum" },
      { key: "preferredContactTime", label: "Contact Time", priority: "low", type: "enum" },
      { key: "languagePreference", label: "Language", priority: "low", type: "enum" },
      { key: "contentFormatPreference", label: "Content Format", priority: "medium", type: "enum" },
      { key: "advisoryTouchFrequency", label: "Touch Frequency", priority: "medium", type: "enum" },
      { key: "communicationTonePreference", label: "Tone Preference", priority: "low", type: "enum" },
    ],
  },
  {
    id: "trust",
    label: "Trust & Decisioning",
    fields: [
      { key: "trustConcerns", label: "Trust Concerns", priority: "high", type: "text" },
      { key: "pastAdvisoryExperience", label: "Past Experience", priority: "low", type: "enum" },
      { key: "reasonsForSwitching", label: "Reasons for Switching", priority: "low", type: "text" },
      { key: "decisionStyle", label: "Decision Style", priority: "medium", type: "enum" },
      { key: "decisionSpeed", label: "Decision Speed", priority: "low", type: "enum" },
      { key: "financialLiteracyLevel", label: "Financial Literacy", priority: "medium", type: "enum" },
      { key: "knowledgeGapsNotes", label: "Knowledge Gaps", priority: "medium", type: "text" },
    ],
  },
  {
    id: "special",
    label: "Special Situations",
    fields: [
      { key: "majorLifeEventsNext12m", label: "Major Events (12m)", priority: "high", type: "text" },
      { key: "liabilitiesPresence", label: "Liabilities", priority: "medium", type: "enum" },
      { key: "liabilitiesNotes", label: "Liabilities Notes", priority: "medium", type: "text" },
      { key: "primaryInterests", label: "Interests", priority: "low", type: "text" },
      { key: "lifestyleChangesPlanned", label: "Lifestyle Changes", priority: "low", type: "text" },
      { key: "spouseInvolvementLevel", label: "Spouse Involvement", priority: "low", type: "enum" },
      { key: "successionPlanningInterest", label: "Succession Interest", priority: "low", type: "enum" },
      { key: "healthPlanningNotes", label: "Health Planning", priority: "low", type: "text" },
      { key: "legalConstraintsNotes", label: "Legal Constraints", priority: "low", type: "text" },
    ],
  },
  {
    id: "kyc",
    label: "KYC & Compliance",
    fields: [
      { key: "kycStage", label: "KYC Stage", priority: "medium", type: "enum" },
      { key: "kycGapsNotes", label: "KYC Gaps", priority: "medium", type: "text" },
      { key: "panSharedStatus", label: "PAN Shared", priority: "medium", type: "enum" },
      { key: "taxResidencyStatus", label: "Tax Residency", priority: "medium", type: "enum" },
      { key: "productRestrictionsNotes", label: "Product Restrictions", priority: "medium", type: "text" },
      { key: "ticketSizeSipBand", label: "SIP Ticket Size", priority: "medium", type: "enum" },
      { key: "ticketSizeLumpsumBand", label: "Lumpsum Ticket Size", priority: "medium", type: "enum" },
    ],
  },
  {
    id: "relationship",
    label: "Relationship & Workflow",
    fields: [
      { key: "relationshipOrigin", label: "Relationship Origin", priority: "medium", type: "enum" },
      { key: "referralSourceName", label: "Referral Source", priority: "low", type: "text" },
      { key: "nextFollowUpDate", label: "Next Follow-up", priority: "high", type: "date" },
      { key: "nextFollowUpAgenda", label: "Follow-up Agenda", priority: "high", type: "text" },
      { key: "lastMeetingDate", label: "Last Meeting", priority: "high", type: "date" },
      { key: "lastMeetingNotes", label: "Meeting Notes", priority: "high", type: "text" },
      { key: "keyDiscussionPoints", label: "Key Points", priority: "medium", type: "text" },
      { key: "clientPainPoints", label: "Pain Points", priority: "medium", type: "text" },
      { key: "clientFeedback", label: "Client Feedback", priority: "low", type: "text" },
      { key: "relationshipStrengthNotes", label: "Relationship Notes", priority: "low", type: "text" },
    ],
  },
];

// Calculate section completeness
export function calculateSectionCompleteness(
  customer: Customer,
  section: SectionDefinition
): { filled: number; total: number; percentage: number } {
  const total = section.fields.length;
  let filled = 0;

  for (const field of section.fields) {
    const value = customer[field.key];
    if (value !== null && value !== undefined) {
      if (typeof value === "string" && value.trim() !== "") {
        filled++;
      } else if (typeof value === "boolean") {
        filled++;
      } else if (typeof value === "number") {
        filled++;
      } else if (Array.isArray(value) && value.length > 0) {
        filled++;
      } else if (value instanceof Date) {
        filled++;
      }
    }
  }

  return {
    filled,
    total,
    percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
  };
}

// Get color for completeness percentage
export function getSectionCompletenessColor(percentage: number): string {
  if (percentage < 25) return "text-red-500";
  if (percentage < 50) return "text-orange-500";
  if (percentage < 75) return "text-yellow-500";
  return "text-green-500";
}

export function getSectionCompletenessBgColor(percentage: number): string {
  if (percentage < 25) return "bg-red-500";
  if (percentage < 50) return "bg-orange-500";
  if (percentage < 75) return "bg-yellow-500";
  return "bg-green-500";
}
