/**
 * Enum value mappings between our schema and Twenty CRM.
 *
 * Our schema uses human-readable values: "25-34", "<10L", "Prefer not to say"
 * Twenty uses UPPERCASE_UNDERSCORE: "AGEBAND_25TO34", "INCOMEBANDANNUAL_UNDER10L"
 *
 * Convention: Twenty enum values are prefixed with field name in uppercase.
 */

type EnumMapping = {
  toTwenty: Record<string, string>;
  fromTwenty: Record<string, string>;
};

// Helper to create bidirectional mapping
function createMapping(
  fieldPrefix: string,
  values: string[]
): EnumMapping {
  const toTwenty: Record<string, string> = {};
  const fromTwenty: Record<string, string> = {};

  for (const value of values) {
    const twentyValue = `${fieldPrefix}_${toEnumValue(value)}`;
    toTwenty[value] = twentyValue;
    fromTwenty[twentyValue] = value;
  }

  return { toTwenty, fromTwenty };
}

// Convert human-readable value to Twenty enum format
function toEnumValue(str: string): string {
  return str
    .toUpperCase()
    .replace(/[–—-]/g, "TO") // "25-34" -> "25TO34"
    .replace(/[<]/g, "UNDER") // "<25" -> "UNDER25"
    .replace(/[>]/g, "OVER") // ">5L" -> "OVER5L"
    .replace(/[+]/g, "PLUS") // "65+" -> "65PLUS"
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^A-Z0-9]/g, "") // Remove non-alphanumeric
    || "EMPTY";
}

// ---------------------------------------------------------------------------
// Identity Fields
// ---------------------------------------------------------------------------

// Note: Twenty uses "AGE" prefix, not "AGEBAND"
export const AGE_BAND = createMapping("AGE", [
  "<25",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
  "Other",
]);

export const GENDER = createMapping("GENDER", [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
  "Other",
]);

export const MARITAL_STATUS = createMapping("MARITALSTATUS", [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
  "Other",
]);

// ---------------------------------------------------------------------------
// Household Fields
// ---------------------------------------------------------------------------

export const HOUSEHOLD_STRUCTURE = createMapping("HOUSEHOLDSTRUCTURE", [
  "Nuclear",
  "Joint family",
  "Living alone",
  "Other",
]);

// ---------------------------------------------------------------------------
// Location Fields
// ---------------------------------------------------------------------------

export const COUNTRY_OF_RESIDENCE = createMapping("COUNTRYOFRESIDENCE", [
  "India",
  "UAE",
  "US",
  "UK",
  "Singapore",
  "Other",
]);

export const RESIDENCE_STATUS = createMapping("RESIDENCESTATUS", [
  "Resident",
  "NRI",
  "OCI",
  "PIO",
  "Other",
]);

// ---------------------------------------------------------------------------
// Contact Preferences
// ---------------------------------------------------------------------------

export const PREFERRED_CHANNEL = createMapping("PREFERREDCHANNEL", [
  "WhatsApp",
  "Call",
  "Email",
  "SMS",
  "Other",
]);

export const PREFERRED_CONTACT_TIME = createMapping("PREFERREDCONTACTTIME", [
  "Morning",
  "Afternoon",
  "Evening",
  "Weekends",
  "Flexible",
  "Other",
]);

export const LANGUAGE_PREFERENCE = createMapping("LANGUAGEPREFERENCE", [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Other",
]);

// ---------------------------------------------------------------------------
// Relationship Fields
// ---------------------------------------------------------------------------

export const RELATIONSHIP_ORIGIN = createMapping("RELATIONSHIPORIGIN", [
  "Referral",
  "Existing relationship",
  "Event",
  "Cold outreach",
  "Digital inbound",
  "Other",
]);

// ---------------------------------------------------------------------------
// Professional Fields
// ---------------------------------------------------------------------------

export const OCCUPATION_TYPE = createMapping("OCCUPATIONTYPE", [
  "Salaried",
  "Business Owner",
  "Professional",
  "Self-employed",
  "Retired",
  "Unemployed",
  "Other",
]);

export const INDUSTRY = createMapping("INDUSTRY", [
  "IT",
  "BFSI",
  "Pharma",
  "Manufacturing",
  "Healthcare",
  "Real Estate",
  "Education",
  "Govt",
  "Other",
]);

// ---------------------------------------------------------------------------
// Income Fields (WealthProfile)
// ---------------------------------------------------------------------------

export const INCOME_BAND_ANNUAL = createMapping("INCOMEBANDANNUAL", [
  "<10L",
  "10-25L",
  "25-50L",
  "50L-1Cr",
  "1-2Cr",
  "2Cr+",
  "Other",
]);

export const INCOME_STABILITY = createMapping("INCOMESTABILITY", [
  "Stable",
  "Variable",
  "Seasonal",
  "Uncertain",
  "Other",
]);

export const INCOME_SOURCES_PRIMARY = createMapping("INCOMESOURCESPRIMARY", [
  "Salary",
  "Business",
  "Rent",
  "Capital Gains",
  "Dividends",
  "Pension",
  "Other",
]);

// ---------------------------------------------------------------------------
// Liquidity Fields (WealthProfile)
// ---------------------------------------------------------------------------

export const LIQUIDITY_NEEDS_HORIZON = createMapping("LIQUIDITYNEEDSHORIZON", [
  "<3 months",
  "3-12 months",
  "1-3 years",
  "3-5 years",
  "5+ years",
  "Other",
]);

// ---------------------------------------------------------------------------
// Cashflow Fields (WealthProfile)
// ---------------------------------------------------------------------------

export const EXPENSE_BAND_MONTHLY = createMapping("EXPENSEBANDMONTHLY", [
  "<50k",
  "50k-1L",
  "1-2L",
  "2-5L",
  "5L+",
  "Other",
]);

export const SURPLUS_INVESTABLE_BAND = createMapping("SURPLUSINVESTABLEBAND", [
  "<25k",
  "25k-50k",
  "50k-1L",
  "1-3L",
  "3L+",
  "Other",
]);

export const EMERGENCY_BUFFER_STATUS = createMapping("EMERGENCYBUFFERSTATUS", [
  "None",
  "<3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
  "Other",
]);

// ---------------------------------------------------------------------------
// Liabilities Fields (WealthProfile)
// ---------------------------------------------------------------------------

export const LIABILITIES_PRESENCE = createMapping("LIABILITIESPRESENCE", [
  "None",
  "Home loan",
  "Personal loan",
  "Business loan",
  "Credit card",
  "Multiple",
  "Other",
]);

// ---------------------------------------------------------------------------
// Goals Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const PRIMARY_GOAL_TYPE = createMapping("PRIMARYGOALTYPE", [
  "Retirement",
  "Child education",
  "Home purchase",
  "Wealth creation",
  "Business goal",
  "Travel/lifestyle",
  "Tax planning",
  "Capital preservation",
  "Other",
]);

export const PRIMARY_GOAL_HORIZON = createMapping("PRIMARYGOALHORIZON", [
  "<1y",
  "1-3y",
  "3-5y",
  "5-10y",
  "10y+",
  "Other",
]);

export const GOAL_PRIORITY_STYLE = createMapping("GOALPRIORITYSTYLE", [
  "One primary",
  "Multiple equal",
  "Unsure",
  "Other",
]);

export const GOAL_CLARITY_LEVEL = createMapping("GOALCLARITYLEVEL", [
  "Clear",
  "Rough",
  "Unclear",
  "Other",
]);

// ---------------------------------------------------------------------------
// Preferences Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const INVESTMENT_STYLE_PREFERENCE = createMapping(
  "INVESTMENTSTYLEPREFERENCE",
  ["SIP", "Lump sum", "Mix", "Unsure", "Other"]
);

export const ASSET_CLASS_PREFERENCE = createMapping("ASSETCLASSPREFERENCE", [
  "Equity",
  "Debt",
  "Gold",
  "International",
  "Alternatives",
  "Other",
]);

export const PRODUCT_PREFERENCE = createMapping("PRODUCTPREFERENCE", [
  "Mutual Funds",
  "PMS",
  "AIF",
  "Direct Equity",
  "Insurance",
  "FDs/Bonds",
  "Structured",
  "Other",
]);

export const LIQUIDITY_PREFERENCE = createMapping("LIQUIDITYPREFERENCE", [
  "High liquidity",
  "Balanced",
  "Can lock-in",
  "Other",
]);

export const TAX_SENSITIVITY = createMapping("TAXSENSITIVITY", [
  "Low",
  "Medium",
  "High",
  "Other",
]);

export const ESG_PREFERENCE = createMapping("ESGPREFERENCE", [
  "No preference",
  "Interested",
  "Strong requirement",
  "Other",
]);

export const INTERNATIONAL_EXPOSURE_COMFORT = createMapping(
  "INTERNATIONALEXPOSURECOMFORT",
  ["None", "Limited", "Moderate", "High", "Other"]
);

// ---------------------------------------------------------------------------
// Decisioning Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const DECISION_STYLE = createMapping("DECISIONSTYLE", [
  "Data-heavy",
  "Balanced",
  "Simple summary",
  "Delegates to RM",
  "Other",
]);

export const DECISION_SPEED = createMapping("DECISIONSPEED", [
  "Fast",
  "Medium",
  "Slow",
  "Needs family input",
  "Other",
]);

// ---------------------------------------------------------------------------
// Education Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const FINANCIAL_LITERACY_LEVEL = createMapping("FINANCIALLITERACYLEVEL", [
  "Low",
  "Medium",
  "High",
  "Other",
]);

// ---------------------------------------------------------------------------
// Trust Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const PAST_ADVISORY_EXPERIENCE = createMapping("PASTADVISORYEXPERIENCE", [
  "None",
  "Used advisor earlier",
  "Switching advisor now",
  "Other",
]);

// ---------------------------------------------------------------------------
// Risk Questionnaire Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const RISK_BUCKET = createMapping("RISKBUCKET", [
  "CAPITAL_PRESERVATION",
  "CONSERVATIVE_BALANCED",
  "BALANCED_GROWTH",
  "GROWTH",
  "Other",
]);

export const BEHAVIORAL_RISK_LABEL = createMapping("BEHAVIORALRISKLABEL", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "Other",
]);

export const LIQUIDITY_RISK_LABEL = createMapping("LIQUIDITYRISKLABEL", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "Other",
]);

export const RISK_DISAGREEMENT_FLAG = createMapping("RISKDISAGREEMENTFLAG", [
  "No",
  "Mildly",
  "Strongly",
  "Other",
]);

// ---------------------------------------------------------------------------
// Suitability Fields (RiskProfile)
// ---------------------------------------------------------------------------

export const TICKET_SIZE_SIP_BAND = createMapping("TICKETSIZESIPBAND", [
  "<10k",
  "10-25k",
  "25-50k",
  "50k-1L",
  "1L+",
  "Other",
]);

export const TICKET_SIZE_LUMPSUM_BAND = createMapping("TICKETSIZELUMPSUMBAND", [
  "<1L",
  "1-5L",
  "5-10L",
  "10-25L",
  "25L+",
  "Other",
]);

// ---------------------------------------------------------------------------
// Family/Succession Fields
// ---------------------------------------------------------------------------

export const SPOUSE_INVOLVEMENT_LEVEL = createMapping("SPOUSEINVOLVEMENTLEVEL", [
  "Not involved",
  "Consulted",
  "Decision-maker",
  "Other",
]);

export const SUCCESSION_PLANNING_INTEREST = createMapping(
  "SUCCESSIONPLANNINGINTEREST",
  ["Not now", "Interested", "Urgent", "Other"]
);

// ---------------------------------------------------------------------------
// KYC Fields
// ---------------------------------------------------------------------------

export const KYC_STAGE = createMapping("KYCSTAGE", [
  "Not started",
  "In progress",
  "Completed",
  "Blocked",
  "Other",
]);

export const PAN_SHARED_STATUS = createMapping("PANSHAREDSTATUS", [
  "Yes",
  "No",
  "Will share later",
  "Other",
]);

export const TAX_RESIDENCY_STATUS = createMapping("TAXRESIDENCYSTATUS", [
  "India",
  "Abroad",
  "Dual",
  "Other",
]);

// ---------------------------------------------------------------------------
// Communication Fields
// ---------------------------------------------------------------------------

export const CONTENT_FORMAT_PREFERENCE = createMapping("CONTENTFORMATPREFERENCE", [
  "Short text",
  "Charts",
  "Data-heavy",
  "Video",
  "Other",
]);

export const ADVISORY_TOUCH_FREQUENCY = createMapping("ADVISORYTOUCHFREQUENCY", [
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Quarterly",
  "Ad-hoc",
  "Other",
]);

export const COMMUNICATION_TONE_PREFERENCE = createMapping(
  "COMMUNICATIONTONEPREFERENCE",
  ["Formal", "Professional", "Friendly", "Casual", "Other"]
);

// ---------------------------------------------------------------------------
// Field to Mapping lookup
// ---------------------------------------------------------------------------

export const ENUM_MAPPINGS: Record<string, EnumMapping> = {
  // Identity
  ageBand: AGE_BAND,
  gender: GENDER,
  maritalStatus: MARITAL_STATUS,

  // Household
  householdStructure: HOUSEHOLD_STRUCTURE,

  // Location
  countryOfResidence: COUNTRY_OF_RESIDENCE,
  residenceStatus: RESIDENCE_STATUS,

  // Contact Preferences
  preferredChannel: PREFERRED_CHANNEL,
  preferredContactTime: PREFERRED_CONTACT_TIME,
  languagePreference: LANGUAGE_PREFERENCE,

  // Relationship
  relationshipOrigin: RELATIONSHIP_ORIGIN,

  // Professional
  occupationType: OCCUPATION_TYPE,
  industry: INDUSTRY,

  // Income (WealthProfile)
  incomeBandAnnual: INCOME_BAND_ANNUAL,
  incomeStability: INCOME_STABILITY,
  incomeSourcesPrimary: INCOME_SOURCES_PRIMARY,

  // Liquidity (WealthProfile)
  liquidityNeedsHorizon: LIQUIDITY_NEEDS_HORIZON,

  // Cashflow (WealthProfile)
  expenseBandMonthly: EXPENSE_BAND_MONTHLY,
  surplusInvestableBand: SURPLUS_INVESTABLE_BAND,
  emergencyBufferStatus: EMERGENCY_BUFFER_STATUS,

  // Liabilities (WealthProfile)
  liabilitiesPresence: LIABILITIES_PRESENCE,

  // Goals (RiskProfile)
  primaryGoalType: PRIMARY_GOAL_TYPE,
  primaryGoalHorizon: PRIMARY_GOAL_HORIZON,
  goalPriorityStyle: GOAL_PRIORITY_STYLE,
  goalClarityLevel: GOAL_CLARITY_LEVEL,

  // Preferences (RiskProfile)
  investmentStylePreference: INVESTMENT_STYLE_PREFERENCE,
  assetClassPreference: ASSET_CLASS_PREFERENCE,
  productPreference: PRODUCT_PREFERENCE,
  liquidityPreference: LIQUIDITY_PREFERENCE,
  taxSensitivity: TAX_SENSITIVITY,
  esgPreference: ESG_PREFERENCE,
  internationalExposureComfort: INTERNATIONAL_EXPOSURE_COMFORT,

  // Decisioning (RiskProfile)
  decisionStyle: DECISION_STYLE,
  decisionSpeed: DECISION_SPEED,

  // Education (RiskProfile)
  financialLiteracyLevel: FINANCIAL_LITERACY_LEVEL,

  // Trust (RiskProfile)
  pastAdvisoryExperience: PAST_ADVISORY_EXPERIENCE,

  // Risk Questionnaire (RiskProfile)
  riskBucket: RISK_BUCKET,
  behavioralRiskLabel: BEHAVIORAL_RISK_LABEL,
  liquidityRiskLabel: LIQUIDITY_RISK_LABEL,
  riskDisagreementFlag: RISK_DISAGREEMENT_FLAG,

  // Suitability (RiskProfile)
  ticketSizeSipBand: TICKET_SIZE_SIP_BAND,
  ticketSizeLumpsumBand: TICKET_SIZE_LUMPSUM_BAND,

  // Family/Succession
  spouseInvolvementLevel: SPOUSE_INVOLVEMENT_LEVEL,
  successionPlanningInterest: SUCCESSION_PLANNING_INTEREST,

  // KYC
  kycStage: KYC_STAGE,
  panSharedStatus: PAN_SHARED_STATUS,
  taxResidencyStatus: TAX_RESIDENCY_STATUS,

  // Communication
  contentFormatPreference: CONTENT_FORMAT_PREFERENCE,
  advisoryTouchFrequency: ADVISORY_TOUCH_FREQUENCY,
  communicationTonePreference: COMMUNICATION_TONE_PREFERENCE,
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Convert internal enum value to Twenty format.
 * Returns original value if no mapping found.
 */
export function toTwentyEnum(field: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const mapping = ENUM_MAPPINGS[field];
  if (!mapping) return value;
  return mapping.toTwenty[value] ?? value;
}

/**
 * Convert Twenty enum value to internal format.
 * Returns original value if no mapping found.
 */
export function fromTwentyEnum(field: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const mapping = ENUM_MAPPINGS[field];
  if (!mapping) return value;
  return mapping.fromTwenty[value] ?? value;
}

/**
 * Convert internal multi-select array to Twenty format.
 */
export function toTwentyMultiSelect(
  field: string,
  values: string[] | null | undefined
): string[] | null {
  if (!values || values.length === 0) return null;
  return values.map((v) => toTwentyEnum(field, v) ?? v);
}

/**
 * Convert Twenty multi-select array to internal format.
 */
export function fromTwentyMultiSelect(
  field: string,
  values: string[] | null | undefined
): string[] | null {
  if (!values || values.length === 0) return null;
  return values.map((v) => fromTwentyEnum(field, v) ?? v);
}
