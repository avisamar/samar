// =============================================================================
// Customer Profile Enum Types
// Generated from docs/customer_profile.csv
// =============================================================================

// Identity
export const AgeBandOptions = [
  "<25",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
  "Other",
] as const;
export type AgeBand = (typeof AgeBandOptions)[number];

export const GenderOptions = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;
export type Gender = (typeof GenderOptions)[number];

export const MaritalStatusOptions = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
  "Other",
] as const;
export type MaritalStatus = (typeof MaritalStatusOptions)[number];

// Household
export const HouseholdStructureOptions = [
  "Nuclear",
  "Joint family",
  "Living alone",
  "Other",
] as const;
export type HouseholdStructure = (typeof HouseholdStructureOptions)[number];

// Location
export const CountryOfResidenceOptions = [
  "India",
  "UAE",
  "US",
  "UK",
  "Singapore",
  "Other",
] as const;
export type CountryOfResidence = (typeof CountryOfResidenceOptions)[number];

export const ResidenceStatusOptions = [
  "Resident",
  "NRI",
  "OCI",
  "PIO",
  "Other",
] as const;
export type ResidenceStatus = (typeof ResidenceStatusOptions)[number];

// Contact Preferences
export const PreferredChannelOptions = [
  "WhatsApp",
  "Call",
  "Email",
  "SMS",
  "Other",
] as const;
export type PreferredChannel = (typeof PreferredChannelOptions)[number];

export const PreferredContactTimeOptions = [
  "Morning",
  "Afternoon",
  "Evening",
  "Weekends",
  "Flexible",
  "Other",
] as const;
export type PreferredContactTime = (typeof PreferredContactTimeOptions)[number];

export const LanguagePreferenceOptions = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Other",
] as const;
export type LanguagePreference = (typeof LanguagePreferenceOptions)[number];

// Relationship
export const RelationshipOriginOptions = [
  "Referral",
  "Existing relationship",
  "Event",
  "Cold outreach",
  "Digital inbound",
  "Other",
] as const;
export type RelationshipOrigin = (typeof RelationshipOriginOptions)[number];

// Professional
export const OccupationTypeOptions = [
  "Salaried",
  "Business Owner",
  "Professional",
  "Self-employed",
  "Retired",
  "Unemployed",
  "Other",
] as const;
export type OccupationType = (typeof OccupationTypeOptions)[number];

export const IndustryOptions = [
  "IT",
  "BFSI",
  "Pharma",
  "Manufacturing",
  "Healthcare",
  "Real Estate",
  "Education",
  "Govt",
  "Other",
] as const;
export type Industry = (typeof IndustryOptions)[number];

// Income
export const IncomeBandAnnualOptions = [
  "<10L",
  "10-25L",
  "25-50L",
  "50L-1Cr",
  "1-2Cr",
  "2Cr+",
  "Other",
] as const;
export type IncomeBandAnnual = (typeof IncomeBandAnnualOptions)[number];

export const IncomeStabilityOptions = [
  "Stable",
  "Variable",
  "Seasonal",
  "Uncertain",
  "Other",
] as const;
export type IncomeStability = (typeof IncomeStabilityOptions)[number];

export const IncomeSourcesPrimaryOptions = [
  "Salary",
  "Business",
  "Rent",
  "Capital Gains",
  "Dividends",
  "Pension",
  "Other",
] as const;
export type IncomeSourcesPrimary = (typeof IncomeSourcesPrimaryOptions)[number];

// Liquidity
export const LiquidityNeedsHorizonOptions = [
  "<3 months",
  "3-12 months",
  "1-3 years",
  "3-5 years",
  "5+ years",
  "Other",
] as const;
export type LiquidityNeedsHorizon =
  (typeof LiquidityNeedsHorizonOptions)[number];

// Cashflow
export const ExpenseBandMonthlyOptions = [
  "<50k",
  "50k-1L",
  "1-2L",
  "2-5L",
  "5L+",
  "Other",
] as const;
export type ExpenseBandMonthly = (typeof ExpenseBandMonthlyOptions)[number];

export const SurplusInvestableBandOptions = [
  "<25k",
  "25k-50k",
  "50k-1L",
  "1-3L",
  "3L+",
  "Other",
] as const;
export type SurplusInvestableBand =
  (typeof SurplusInvestableBandOptions)[number];

export const EmergencyBufferStatusOptions = [
  "None",
  "<3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
  "Other",
] as const;
export type EmergencyBufferStatus =
  (typeof EmergencyBufferStatusOptions)[number];

// Liabilities
export const LiabilitiesPresenceOptions = [
  "None",
  "Home loan",
  "Personal loan",
  "Business loan",
  "Credit card",
  "Multiple",
  "Other",
] as const;
export type LiabilitiesPresence = (typeof LiabilitiesPresenceOptions)[number];

// Goals
export const PrimaryGoalTypeOptions = [
  "Retirement",
  "Child education",
  "Home purchase",
  "Wealth creation",
  "Business goal",
  "Travel/lifestyle",
  "Tax planning",
  "Capital preservation",
  "Other",
] as const;
export type PrimaryGoalType = (typeof PrimaryGoalTypeOptions)[number];

export const PrimaryGoalHorizonOptions = [
  "<1y",
  "1-3y",
  "3-5y",
  "5-10y",
  "10y+",
  "Other",
] as const;
export type PrimaryGoalHorizon = (typeof PrimaryGoalHorizonOptions)[number];

export const GoalPriorityStyleOptions = [
  "One primary",
  "Multiple equal",
  "Unsure",
  "Other",
] as const;
export type GoalPriorityStyle = (typeof GoalPriorityStyleOptions)[number];

export const GoalClarityLevelOptions = [
  "Clear",
  "Rough",
  "Unclear",
  "Other",
] as const;
export type GoalClarityLevel = (typeof GoalClarityLevelOptions)[number];

// Preferences
export const InvestmentStylePreferenceOptions = [
  "SIP",
  "Lump sum",
  "Mix",
  "Unsure",
  "Other",
] as const;
export type InvestmentStylePreference =
  (typeof InvestmentStylePreferenceOptions)[number];

export const AssetClassPreferenceOptions = [
  "Equity",
  "Debt",
  "Gold",
  "International",
  "Alternatives",
  "Other",
] as const;
export type AssetClassPreference =
  (typeof AssetClassPreferenceOptions)[number];

export const ProductPreferenceOptions = [
  "Mutual Funds",
  "PMS",
  "AIF",
  "Direct Equity",
  "Insurance",
  "FDs/Bonds",
  "Structured",
  "Other",
] as const;
export type ProductPreference = (typeof ProductPreferenceOptions)[number];

export const LiquidityPreferenceOptions = [
  "High liquidity",
  "Balanced",
  "Can lock-in",
  "Other",
] as const;
export type LiquidityPreference = (typeof LiquidityPreferenceOptions)[number];

export const TaxSensitivityOptions = ["Low", "Medium", "High", "Other"] as const;
export type TaxSensitivity = (typeof TaxSensitivityOptions)[number];

export const EsgPreferenceOptions = [
  "No preference",
  "Interested",
  "Strong requirement",
  "Other",
] as const;
export type EsgPreference = (typeof EsgPreferenceOptions)[number];

export const InternationalExposureComfortOptions = [
  "None",
  "Limited",
  "Moderate",
  "High",
  "Other",
] as const;
export type InternationalExposureComfort =
  (typeof InternationalExposureComfortOptions)[number];

// Decisioning
export const DecisionStyleOptions = [
  "Data-heavy",
  "Balanced",
  "Simple summary",
  "Delegates to RM",
  "Other",
] as const;
export type DecisionStyle = (typeof DecisionStyleOptions)[number];

export const DecisionSpeedOptions = [
  "Fast",
  "Medium",
  "Slow",
  "Needs family input",
  "Other",
] as const;
export type DecisionSpeed = (typeof DecisionSpeedOptions)[number];

// Education
export const FinancialLiteracyLevelOptions = [
  "Low",
  "Medium",
  "High",
  "Other",
] as const;
export type FinancialLiteracyLevel =
  (typeof FinancialLiteracyLevelOptions)[number];

// Trust
export const PastAdvisoryExperienceOptions = [
  "None",
  "Used advisor earlier",
  "Switching advisor now",
  "Other",
] as const;
export type PastAdvisoryExperience =
  (typeof PastAdvisoryExperienceOptions)[number];

// Risk (Questionnaire)
export const RiskBucketOptions = [
  "CAPITAL_PRESERVATION",
  "CONSERVATIVE_BALANCED",
  "BALANCED_GROWTH",
  "GROWTH",
  "Other",
] as const;
export type RiskBucket = (typeof RiskBucketOptions)[number];

export const BehavioralRiskLabelOptions = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "Other",
] as const;
export type BehavioralRiskLabel = (typeof BehavioralRiskLabelOptions)[number];

export const LiquidityRiskLabelOptions = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "Other",
] as const;
export type LiquidityRiskLabel = (typeof LiquidityRiskLabelOptions)[number];

// Risk (Discussion)
export const RiskDisagreementFlagOptions = [
  "No",
  "Mildly",
  "Strongly",
  "Other",
] as const;
export type RiskDisagreementFlag = (typeof RiskDisagreementFlagOptions)[number];

// Suitability
export const TicketSizeSipBandOptions = [
  "<10k",
  "10-25k",
  "25-50k",
  "50k-1L",
  "1L+",
  "Other",
] as const;
export type TicketSizeSipBand = (typeof TicketSizeSipBandOptions)[number];

export const TicketSizeLumpsumBandOptions = [
  "<1L",
  "1-5L",
  "5-10L",
  "10-25L",
  "25L+",
  "Other",
] as const;
export type TicketSizeLumpsumBand =
  (typeof TicketSizeLumpsumBandOptions)[number];

// Family/Succession
export const SpouseInvolvementLevelOptions = [
  "Not involved",
  "Consulted",
  "Decision-maker",
  "Other",
] as const;
export type SpouseInvolvementLevel =
  (typeof SpouseInvolvementLevelOptions)[number];

export const SuccessionPlanningInterestOptions = [
  "Not now",
  "Interested",
  "Urgent",
  "Other",
] as const;
export type SuccessionPlanningInterest =
  (typeof SuccessionPlanningInterestOptions)[number];

// KYC Tracking
export const KycStageOptions = [
  "Not started",
  "In progress",
  "Completed",
  "Blocked",
  "Other",
] as const;
export type KycStage = (typeof KycStageOptions)[number];

export const PanSharedStatusOptions = [
  "Yes",
  "No",
  "Will share later",
  "Other",
] as const;
export type PanSharedStatus = (typeof PanSharedStatusOptions)[number];

export const TaxResidencyStatusOptions = [
  "India",
  "Abroad",
  "Dual",
  "Other",
] as const;
export type TaxResidencyStatus = (typeof TaxResidencyStatusOptions)[number];

// Communication
export const ContentFormatPreferenceOptions = [
  "Short text",
  "Charts",
  "Data-heavy",
  "Video",
  "Other",
] as const;
export type ContentFormatPreference =
  (typeof ContentFormatPreferenceOptions)[number];

export const AdvisoryTouchFrequencyOptions = [
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Quarterly",
  "Ad-hoc",
  "Other",
] as const;
export type AdvisoryTouchFrequency =
  (typeof AdvisoryTouchFrequencyOptions)[number];

export const CommunicationTonePreferenceOptions = [
  "Formal",
  "Professional",
  "Friendly",
  "Casual",
  "Other",
] as const;
export type CommunicationTonePreference =
  (typeof CommunicationTonePreferenceOptions)[number];

// Note source types
export const NoteSourceOptions = [
  "meeting",
  "call",
  "email",
  "voice_note",
  "sms",
  "whatsapp",
  "other",
] as const;
export type NoteSource = (typeof NoteSourceOptions)[number];

// =============================================================================
// Field Metadata (for schema validation and UI generation)
// =============================================================================

export interface FieldMetadata {
  dataKey: string;
  displayName: string;
  dataType:
    | "text"
    | "date"
    | "enum"
    | "number"
    | "boolean"
    | "multi_select"
    | "json";
  priority: "High" | "Medium" | "Low";
  fieldClass: "FACT" | "SIGNAL" | "OPINION" | "SYSTEM";
  source:
    | "client_declared"
    | "rm_observed"
    | "questionnaire"
    | "system"
    | "document_shared";
  section: string;
  options?: readonly string[];
}

// Field priority for profiling
export const FieldPriority = {
  High: 3,
  Medium: 2,
  Low: 1,
} as const;

export type Priority = keyof typeof FieldPriority;
