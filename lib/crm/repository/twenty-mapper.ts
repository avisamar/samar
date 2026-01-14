/**
 * Mapper for converting between our Customer schema and Twenty's multi-object model.
 *
 * Our schema: Flat Customer object with all fields
 * Twenty schema: Person + WealthProfile + RiskProfile objects
 */

import type { Customer, CustomerNote, NewCustomer, CustomerProfileUpdate } from "../types";
import type {
  TwentyPerson,
  TwentyWealthProfile,
  TwentyRiskProfile,
  TwentyNote,
} from "./twenty-types";
import {
  toTwentyEnum,
  fromTwentyEnum,
  toTwentyMultiSelect,
  fromTwentyMultiSelect,
} from "./twenty-enums";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse JSON string, returning null on parse errors.
 */
function safeJsonParse(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Field Group Definitions
// ---------------------------------------------------------------------------

// Fields that belong to Person object
const PERSON_FIELDS = new Set([
  "fullName",
  "dob",
  "ageBand",
  "gender",
  "maritalStatus",
  "dependentsCount",
  "dependentsNotes",
  "householdStructure",
  "familyFinancialResponsibilities",
  "cityOfResidence",
  "countryOfResidence",
  "residenceStatus",
  "primaryMobile",
  "secondaryMobile",
  "emailPrimary",
  "preferredChannel",
  "preferredContactTime",
  "languagePreference",
  "relationshipOrigin",
  "referralSourceName",
  "occupationType",
  "industry",
  "jobTitle",
  "employerBusinessName",
  "workLocation",
  "primaryInterests",
  "lifestyleChangesPlanned",
  "spouseInvolvementLevel",
  "successionPlanningInterest",
  "majorLifeEventsNext12m",
  "healthPlanningNotes",
  "legalConstraintsNotes",
  "kycStage",
  "kycGapsNotes",
  "panSharedStatus",
  "taxResidencyStatus",
  "contentFormatPreference",
  "advisoryTouchFrequency",
  "communicationTonePreference",
  "nextFollowUpDate",
  "nextFollowUpAgenda",
  "lastMeetingDate",
  "lastMeetingNotes",
  "keyDiscussionPoints",
  "clientPainPoints",
  "clientFeedback",
  "relationshipStrengthNotes",
  "profileCreatedBy",
  "profileLastUpdatedBy",
]);

// Fields that belong to WealthProfile object
const WEALTH_PROFILE_FIELDS = new Set([
  "incomeBandAnnual",
  "incomeStability",
  "incomeSourcesPrimary",
  "incomeSourcesSecondary",
  "upcomingLiquidityEvents",
  "liquidityNeedsHorizon",
  "expenseBandMonthly",
  "surplusInvestableBand",
  "emergencyBufferStatus",
  "liabilitiesPresence",
  "liabilitiesNotes",
]);

// Fields that belong to RiskProfile object
const RISK_PROFILE_FIELDS = new Set([
  "goalsSummary",
  "goalsJson",
  "primaryGoalType",
  "primaryGoalHorizon",
  "goalPriorityStyle",
  "goalClarityLevel",
  "constraintsSummary",
  "regulatoryConstraintsNotes",
  "investmentStylePreference",
  "assetClassPreference",
  "productPreference",
  "productsToAvoid",
  "liquidityPreference",
  "taxSensitivity",
  "esgPreference",
  "sectorTiltsPreferences",
  "internationalExposureComfort",
  "decisionStyle",
  "decisionSpeed",
  "financialLiteracyLevel",
  "knowledgeGapsNotes",
  "trustConcerns",
  "pastAdvisoryExperience",
  "reasonsForSwitching",
  "riskAnecdotes",
  "riskQuestionnaireCompleted",
  "riskQuestionnaireVersion",
  "riskProfileQnaJson",
  "riskBucket",
  "behavioralRiskLabel",
  "liquidityRiskLabel",
  "returnMismatchFlag",
  "riskDiscussionNotes",
  "riskDisagreementFlag",
  "productRestrictionsNotes",
  "ticketSizeSipBand",
  "ticketSizeLumpsumBand",
]);

// Enum fields that need transformation
const ENUM_FIELDS = new Set([
  "ageBand",
  "gender",
  "maritalStatus",
  "householdStructure",
  "countryOfResidence",
  "residenceStatus",
  "preferredChannel",
  "preferredContactTime",
  "languagePreference",
  "relationshipOrigin",
  "occupationType",
  "industry",
  "incomeBandAnnual",
  "incomeStability",
  "incomeSourcesPrimary",
  "liquidityNeedsHorizon",
  "expenseBandMonthly",
  "surplusInvestableBand",
  "emergencyBufferStatus",
  "liabilitiesPresence",
  "primaryGoalType",
  "primaryGoalHorizon",
  "goalPriorityStyle",
  "goalClarityLevel",
  "investmentStylePreference",
  "liquidityPreference",
  "taxSensitivity",
  "esgPreference",
  "internationalExposureComfort",
  "decisionStyle",
  "decisionSpeed",
  "financialLiteracyLevel",
  "pastAdvisoryExperience",
  "riskBucket",
  "behavioralRiskLabel",
  "liquidityRiskLabel",
  "riskDisagreementFlag",
  "ticketSizeSipBand",
  "ticketSizeLumpsumBand",
  "spouseInvolvementLevel",
  "successionPlanningInterest",
  "kycStage",
  "panSharedStatus",
  "taxResidencyStatus",
  "contentFormatPreference",
  "advisoryTouchFrequency",
  "communicationTonePreference",
]);

// Multi-select fields
const MULTI_SELECT_FIELDS = new Set([
  "assetClassPreference",
  "productPreference",
]);

// ---------------------------------------------------------------------------
// Twenty → Customer Mapping
// ---------------------------------------------------------------------------

/**
 * Convert Twenty's three objects into our flat Customer object.
 */
export function toCustomer(
  person: TwentyPerson,
  wealthProfile: TwentyWealthProfile | null,
  riskProfile: TwentyRiskProfile | null
): Customer {
  return {
    // System fields
    id: person.id,
    createdAt: person.createdAt ? new Date(person.createdAt) : new Date(),
    updatedAt: person.updatedAt ? new Date(person.updatedAt) : new Date(),

    // Identity
    fullName: person.fullName ?? null,
    dob: person.dob ? new Date(person.dob) : null,
    ageBand: fromTwentyEnum("ageBand", person.ageBand),
    gender: fromTwentyEnum("gender", person.gender),
    maritalStatus: fromTwentyEnum("maritalStatus", person.maritalStatus),

    // Household
    dependentsCount: person.dependentsCount ?? null,
    dependentsNotes: person.dependentsNotes ?? null,
    householdStructure: fromTwentyEnum("householdStructure", person.householdStructure),
    familyFinancialResponsibilities: person.familyFinancialResponsibilities ?? null,

    // Location
    cityOfResidence: person.cityOfResidence ?? null,
    countryOfResidence: fromTwentyEnum("countryOfResidence", person.countryOfResidence),
    residenceStatus: fromTwentyEnum("residenceStatus", person.residenceStatus),

    // Contact
    primaryMobile: person.primaryMobile ?? person.phones?.primaryPhoneNumber ?? null,
    secondaryMobile: person.secondaryMobile ?? null,
    emailPrimary: person.emailPrimary ?? person.emails?.primaryEmail ?? null,

    // Contact Preferences
    preferredChannel: fromTwentyEnum("preferredChannel", person.preferredChannel),
    preferredContactTime: fromTwentyEnum("preferredContactTime", person.preferredContactTime),
    languagePreference: fromTwentyEnum("languagePreference", person.languagePreference),

    // Relationship
    relationshipOrigin: fromTwentyEnum("relationshipOrigin", person.relationshipOrigin),
    referralSourceName: person.referralSourceName ?? null,

    // Professional
    occupationType: fromTwentyEnum("occupationType", person.occupationType),
    industry: fromTwentyEnum("industry", person.industry),
    jobTitle: person.jobTitle ?? null,
    employerBusinessName: person.employerBusinessName ?? null,
    workLocation: person.workLocation ?? null,

    // Lifestyle
    primaryInterests: person.primaryInterests ?? null,
    lifestyleChangesPlanned: person.lifestyleChangesPlanned ?? null,

    // Family/Succession
    spouseInvolvementLevel: fromTwentyEnum("spouseInvolvementLevel", person.spouseInvolvementLevel),
    successionPlanningInterest: fromTwentyEnum("successionPlanningInterest", person.successionPlanningInterest),

    // Special Situations
    majorLifeEventsNext12m: person.majorLifeEventsNext12m ?? null,
    healthPlanningNotes: person.healthPlanningNotes ?? null,
    legalConstraintsNotes: person.legalConstraintsNotes ?? null,

    // KYC Tracking
    kycStage: fromTwentyEnum("kycStage", person.kycStage),
    kycGapsNotes: person.kycGapsNotes ?? null,
    panSharedStatus: fromTwentyEnum("panSharedStatus", person.panSharedStatus),
    taxResidencyStatus: fromTwentyEnum("taxResidencyStatus", person.taxResidencyStatus),

    // Communication
    contentFormatPreference: fromTwentyEnum("contentFormatPreference", person.contentFormatPreference),
    advisoryTouchFrequency: fromTwentyEnum("advisoryTouchFrequency", person.advisoryTouchFrequency),
    communicationTonePreference: fromTwentyEnum("communicationTonePreference", person.communicationTonePreference),

    // RM Workflow
    nextFollowUpDate: person.nextFollowUpDate ? new Date(person.nextFollowUpDate) : null,
    nextFollowUpAgenda: person.nextFollowUpAgenda ?? null,

    // Meetings/Notes
    lastMeetingDate: person.lastMeetingDate ? new Date(person.lastMeetingDate) : null,
    lastMeetingNotes: person.lastMeetingNotes ?? null,
    keyDiscussionPoints: person.keyDiscussionPoints ?? null,
    clientPainPoints: person.clientPainPoints ?? null,
    clientFeedback: person.clientFeedback ?? null,
    relationshipStrengthNotes: person.relationshipStrengthNotes ?? null,

    // Audit
    profileCreatedBy: person.profileCreatedBy ?? null,
    profileLastUpdatedBy: person.profileLastUpdatedBy ?? null,

    // ---------------------------------------------------------------------------
    // WealthProfile Fields
    // ---------------------------------------------------------------------------

    // Income
    incomeBandAnnual: fromTwentyEnum("incomeBandAnnual", wealthProfile?.incomeBandAnnual),
    incomeStability: fromTwentyEnum("incomeStability", wealthProfile?.incomeStability),
    incomeSourcesPrimary: fromTwentyEnum("incomeSourcesPrimary", wealthProfile?.incomeSourcesPrimary),
    incomeSourcesSecondary: wealthProfile?.incomeSourcesSecondary ?? null,

    // Liquidity
    upcomingLiquidityEvents: wealthProfile?.upcomingLiquidityEvents ?? null,
    liquidityNeedsHorizon: fromTwentyEnum("liquidityNeedsHorizon", wealthProfile?.liquidityNeedsHorizon),

    // Cashflow
    expenseBandMonthly: fromTwentyEnum("expenseBandMonthly", wealthProfile?.expenseBandMonthly),
    surplusInvestableBand: fromTwentyEnum("surplusInvestableBand", wealthProfile?.surplusInvestableBand),
    emergencyBufferStatus: fromTwentyEnum("emergencyBufferStatus", wealthProfile?.emergencyBufferStatus),

    // Liabilities
    liabilitiesPresence: fromTwentyEnum("liabilitiesPresence", wealthProfile?.liabilitiesPresence),
    liabilitiesNotes: wealthProfile?.liabilitiesNotes ?? null,

    // ---------------------------------------------------------------------------
    // RiskProfile Fields
    // ---------------------------------------------------------------------------

    // Goals
    goalsSummary: riskProfile?.goalsSummary ?? null,
    goalsJson: safeJsonParse(riskProfile?.goalsJson),
    primaryGoalType: fromTwentyEnum("primaryGoalType", riskProfile?.primaryGoalType),
    primaryGoalHorizon: fromTwentyEnum("primaryGoalHorizon", riskProfile?.primaryGoalHorizon),
    goalPriorityStyle: fromTwentyEnum("goalPriorityStyle", riskProfile?.goalPriorityStyle),
    goalClarityLevel: fromTwentyEnum("goalClarityLevel", riskProfile?.goalClarityLevel),

    // Constraints
    constraintsSummary: riskProfile?.constraintsSummary ?? null,
    regulatoryConstraintsNotes: riskProfile?.regulatoryConstraintsNotes ?? null,

    // Preferences
    investmentStylePreference: fromTwentyEnum("investmentStylePreference", riskProfile?.investmentStylePreference),
    assetClassPreference: fromTwentyMultiSelect("assetClassPreference", riskProfile?.assetClassPreference),
    productPreference: fromTwentyMultiSelect("productPreference", riskProfile?.productPreference),
    productsToAvoid: riskProfile?.productsToAvoid ?? null,
    liquidityPreference: fromTwentyEnum("liquidityPreference", riskProfile?.liquidityPreference),
    taxSensitivity: fromTwentyEnum("taxSensitivity", riskProfile?.taxSensitivity),
    esgPreference: fromTwentyEnum("esgPreference", riskProfile?.esgPreference),
    sectorTiltsPreferences: riskProfile?.sectorTiltsPreferences ?? null,
    internationalExposureComfort: fromTwentyEnum("internationalExposureComfort", riskProfile?.internationalExposureComfort),

    // Decisioning
    decisionStyle: fromTwentyEnum("decisionStyle", riskProfile?.decisionStyle),
    decisionSpeed: fromTwentyEnum("decisionSpeed", riskProfile?.decisionSpeed),

    // Education
    financialLiteracyLevel: fromTwentyEnum("financialLiteracyLevel", riskProfile?.financialLiteracyLevel),
    knowledgeGapsNotes: riskProfile?.knowledgeGapsNotes ?? null,

    // Trust
    trustConcerns: riskProfile?.trustConcerns ?? null,
    pastAdvisoryExperience: fromTwentyEnum("pastAdvisoryExperience", riskProfile?.pastAdvisoryExperience),
    reasonsForSwitching: riskProfile?.reasonsForSwitching ?? null,

    // Risk (Context)
    riskAnecdotes: riskProfile?.riskAnecdotes ?? null,

    // Risk (Questionnaire)
    riskQuestionnaireCompleted: riskProfile?.riskQuestionnaireCompleted ?? null,
    riskQuestionnaireVersion: riskProfile?.riskQuestionnaireVersion ?? null,
    riskProfileQnaJson: safeJsonParse(riskProfile?.riskProfileQnaJson),
    riskBucket: fromTwentyEnum("riskBucket", riskProfile?.riskBucket),
    behavioralRiskLabel: fromTwentyEnum("behavioralRiskLabel", riskProfile?.behavioralRiskLabel),
    liquidityRiskLabel: fromTwentyEnum("liquidityRiskLabel", riskProfile?.liquidityRiskLabel),
    returnMismatchFlag: riskProfile?.returnMismatchFlag ?? null,

    // Risk (Discussion)
    riskDiscussionNotes: riskProfile?.riskDiscussionNotes ?? null,
    riskDisagreementFlag: fromTwentyEnum("riskDisagreementFlag", riskProfile?.riskDisagreementFlag),

    // Suitability (Meeting)
    productRestrictionsNotes: riskProfile?.productRestrictionsNotes ?? null,
    ticketSizeSipBand: fromTwentyEnum("ticketSizeSipBand", riskProfile?.ticketSizeSipBand),
    ticketSizeLumpsumBand: fromTwentyEnum("ticketSizeLumpsumBand", riskProfile?.ticketSizeLumpsumBand),

    // ---------------------------------------------------------------------------
    // Skipped Fields
    // ---------------------------------------------------------------------------

    // additionalData: Skip per design decision
    additionalData: [],

    // _other fields: Skip per design decision
    ageBandOther: null,
    genderOther: null,
    maritalStatusOther: null,
    householdStructureOther: null,
    countryOfResidenceOther: null,
    residenceStatusOther: null,
    preferredChannelOther: null,
    preferredContactTimeOther: null,
    languagePreferenceOther: null,
    relationshipOriginOther: null,
    occupationTypeOther: null,
    industryOther: null,
    incomeBandAnnualOther: null,
    incomeStabilityOther: null,
    incomeSourcesPrimaryOther: null,
    liquidityNeedsHorizonOther: null,
    expenseBandMonthlyOther: null,
    surplusInvestableBandOther: null,
    emergencyBufferStatusOther: null,
    liabilitiesPresenceOther: null,
    primaryGoalTypeOther: null,
    primaryGoalHorizonOther: null,
    goalPriorityStyleOther: null,
    goalClarityLevelOther: null,
    investmentStylePreferenceOther: null,
    assetClassPreferenceOther: null,
    productPreferenceOther: null,
    liquidityPreferenceOther: null,
    taxSensitivityOther: null,
    esgPreferenceOther: null,
    internationalExposureComfortOther: null,
    decisionStyleOther: null,
    decisionSpeedOther: null,
    financialLiteracyLevelOther: null,
    pastAdvisoryExperienceOther: null,
    riskBucketOther: null,
    behavioralRiskLabelOther: null,
    liquidityRiskLabelOther: null,
    riskDisagreementFlagOther: null,
    ticketSizeSipBandOther: null,
    ticketSizeLumpsumBandOther: null,
    spouseInvolvementLevelOther: null,
    successionPlanningInterestOther: null,
    kycStageOther: null,
    panSharedStatusOther: null,
    taxResidencyStatusOther: null,
    contentFormatPreferenceOther: null,
    advisoryTouchFrequencyOther: null,
    communicationTonePreferenceOther: null,
  } as Customer;
}

// ---------------------------------------------------------------------------
// Customer → Twenty Mapping (for updates)
// ---------------------------------------------------------------------------

/**
 * Split Customer update into updates for each Twenty object.
 */
export function splitCustomerUpdate(data: CustomerProfileUpdate): {
  personFields: Record<string, unknown>;
  wealthFields: Record<string, unknown>;
  riskFields: Record<string, unknown>;
} {
  const personFields: Record<string, unknown> = {};
  const wealthFields: Record<string, unknown> = {};
  const riskFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    // Skip reserved fields
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;

    // Skip additionalData and _other fields
    if (key === "additionalData" || key.endsWith("Other")) continue;

    // Transform value if needed
    const transformedValue = transformFieldValue(key, value);

    // Route to appropriate object
    if (PERSON_FIELDS.has(key)) {
      personFields[key] = transformedValue;
    } else if (WEALTH_PROFILE_FIELDS.has(key)) {
      wealthFields[key] = transformedValue;
    } else if (RISK_PROFILE_FIELDS.has(key)) {
      riskFields[key] = transformedValue;
    }
  }

  return { personFields, wealthFields, riskFields };
}

/**
 * Transform a field value for Twenty API.
 */
function transformFieldValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;

  // Handle enum fields
  if (ENUM_FIELDS.has(key) && typeof value === "string") {
    return toTwentyEnum(key, value);
  }

  // Handle multi-select fields
  if (MULTI_SELECT_FIELDS.has(key) && Array.isArray(value)) {
    return toTwentyMultiSelect(key, value as string[]);
  }

  // Handle date fields
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle JSON fields
  if (key === "goalsJson" || key === "riskProfileQnaJson") {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  return value;
}

/**
 * Convert NewCustomer to Twenty Person payload.
 */
export function toTwentyPersonPayload(
  data: NewCustomer
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Map nested fields
  if (data.fullName) {
    const nameParts = data.fullName.split(" ");
    payload.name = {
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" ") ?? "",
    };
  }

  if (data.emailPrimary) {
    payload.emails = {
      primaryEmail: data.emailPrimary,
    };
  }

  if (data.primaryMobile) {
    // Map country of residence to phone country code
    const countryCodeMap: Record<string, string> = {
      India: "IN",
      UAE: "AE",
      US: "US",
      UK: "GB",
      Singapore: "SG",
    };
    const phoneCountryCode = data.countryOfResidence
      ? countryCodeMap[data.countryOfResidence] ?? "IN"
      : "IN";
    payload.phones = {
      primaryPhoneNumber: data.primaryMobile,
      primaryPhoneCountryCode: phoneCountryCode,
    };
  }

  // Map all person fields
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (!PERSON_FIELDS.has(key)) continue;
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
    if (key.endsWith("Other")) continue;

    payload[key] = transformFieldValue(key, value);
  }

  return payload;
}

/**
 * Convert NewCustomer to Twenty WealthProfile payload.
 */
export function toTwentyWealthProfilePayload(
  data: NewCustomer,
  personId: string
): Record<string, unknown> | null {
  const payload: Record<string, unknown> = { personId };
  let hasFields = false;

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (!WEALTH_PROFILE_FIELDS.has(key)) continue;

    payload[key] = transformFieldValue(key, value);
    hasFields = true;
  }

  return hasFields ? payload : null;
}

/**
 * Convert NewCustomer to Twenty RiskProfile payload.
 */
export function toTwentyRiskProfilePayload(
  data: NewCustomer,
  personId: string
): Record<string, unknown> | null {
  const payload: Record<string, unknown> = { personId };
  let hasFields = false;

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (!RISK_PROFILE_FIELDS.has(key)) continue;

    payload[key] = transformFieldValue(key, value);
    hasFields = true;
  }

  return hasFields ? payload : null;
}

// ---------------------------------------------------------------------------
// Note Mapping
// ---------------------------------------------------------------------------

/**
 * Convert Twenty Note to CustomerNote.
 * Per design decision: only map content field.
 */
export function toCustomerNote(
  note: TwentyNote,
  customerId: string
): CustomerNote {
  return {
    id: note.id,
    customerId,
    content: note.bodyV2?.markdown ?? note.title ?? "",
    // Skip: source, tags, rawInput, extractedFields (not in Twenty)
    source: null,
    tags: null,
    rawInput: null,
    extractedFields: null,
    createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
    createdBy: null,
  } as CustomerNote;
}

/**
 * Convert note content to Twenty Note payload.
 */
export function toTwentyNotePayload(content: string): Record<string, unknown> {
  return {
    bodyV2: {
      markdown: content,
    },
    createdBy: {
      source: "API",
    },
  };
}
