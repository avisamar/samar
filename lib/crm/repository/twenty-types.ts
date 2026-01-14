/**
 * Type definitions for Twenty CRM API objects.
 * These match the schema defined in poc-twenty/src/scripts/02_define_schema.ts
 */

// ---------------------------------------------------------------------------
// Twenty Person Object
// ---------------------------------------------------------------------------

export interface TwentyPersonName {
  firstName?: string;
  lastName?: string;
}

export interface TwentyPersonEmails {
  primaryEmail?: string;
  additionalEmails?: string[] | null;
}

export interface TwentyPersonPhones {
  primaryPhoneNumber?: string;
  primaryPhoneCountryCode?: string;
  additionalPhoneNumbers?: string[] | null;
}

export interface TwentyPerson {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Standard Twenty fields (nested objects)
  name?: TwentyPersonName;
  emails?: TwentyPersonEmails;
  phones?: TwentyPersonPhones;
  jobTitle?: string;
  city?: string;

  // Custom fields - Identity
  fullName?: string;
  dob?: string;
  ageBand?: string;
  gender?: string;
  maritalStatus?: string;

  // Custom fields - Household
  dependentsCount?: number;
  dependentsNotes?: string;
  householdStructure?: string;
  familyFinancialResponsibilities?: string;

  // Custom fields - Location
  cityOfResidence?: string;
  countryOfResidence?: string;
  residenceStatus?: string;

  // Custom fields - Contact
  primaryMobile?: string;
  secondaryMobile?: string;
  emailPrimary?: string;

  // Custom fields - Contact Prefs
  preferredChannel?: string;
  preferredContactTime?: string;
  languagePreference?: string;

  // Custom fields - Relationship
  relationshipOrigin?: string;
  referralSourceName?: string;

  // Custom fields - Professional
  occupationType?: string;
  industry?: string;
  employerBusinessName?: string;
  workLocation?: string;

  // Custom fields - Lifestyle
  primaryInterests?: string;
  lifestyleChangesPlanned?: string;

  // Custom fields - Family/Succession
  spouseInvolvementLevel?: string;
  successionPlanningInterest?: string;

  // Custom fields - Special Situations
  majorLifeEventsNext12m?: string;
  healthPlanningNotes?: string;
  legalConstraintsNotes?: string;

  // Custom fields - KYC Tracking
  kycStage?: string;
  kycGapsNotes?: string;
  panSharedStatus?: string;
  taxResidencyStatus?: string;

  // Custom fields - Communication
  contentFormatPreference?: string;
  advisoryTouchFrequency?: string;
  communicationTonePreference?: string;

  // Custom fields - RM Workflow
  nextFollowUpDate?: string;
  nextFollowUpAgenda?: string;

  // Custom fields - Meetings/Notes
  lastMeetingDate?: string;
  lastMeetingNotes?: string;
  keyDiscussionPoints?: string;
  clientPainPoints?: string;
  clientFeedback?: string;
  relationshipStrengthNotes?: string;

  // Custom fields - Audit
  profileCreatedDate?: string;
  profileCreatedBy?: string;
  profileLastUpdatedDate?: string;
  profileLastUpdatedBy?: string;
}

// ---------------------------------------------------------------------------
// Twenty Wealth Profile Object
// ---------------------------------------------------------------------------

export interface TwentyWealthProfile {
  id: string;
  personId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Income
  incomeBandAnnual?: string;
  incomeStability?: string;
  incomeSourcesPrimary?: string;
  incomeSourcesSecondary?: string;

  // Liquidity
  upcomingLiquidityEvents?: string;
  liquidityNeedsHorizon?: string;

  // Cashflow
  expenseBandMonthly?: string;
  surplusInvestableBand?: string;
  emergencyBufferStatus?: string;

  // Liabilities
  liabilitiesPresence?: string;
  liabilitiesNotes?: string;
}

// ---------------------------------------------------------------------------
// Twenty Risk Profile Object
// ---------------------------------------------------------------------------

export interface TwentyRiskProfile {
  id: string;
  personId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Goals
  goalsSummary?: string;
  goalsJson?: string;
  primaryGoalType?: string;
  primaryGoalHorizon?: string;
  goalPriorityStyle?: string;
  goalClarityLevel?: string;

  // Constraints
  constraintsSummary?: string;
  regulatoryConstraintsNotes?: string;

  // Preferences
  investmentStylePreference?: string;
  assetClassPreference?: string[];
  productPreference?: string[];
  productsToAvoid?: string;
  liquidityPreference?: string;
  taxSensitivity?: string;
  esgPreference?: string;
  sectorTiltsPreferences?: string;
  internationalExposureComfort?: string;

  // Decisioning
  decisionStyle?: string;
  decisionSpeed?: string;

  // Education
  financialLiteracyLevel?: string;
  knowledgeGapsNotes?: string;

  // Trust
  trustConcerns?: string;
  pastAdvisoryExperience?: string;
  reasonsForSwitching?: string;

  // Risk (Context)
  riskAnecdotes?: string;

  // Risk (Questionnaire)
  riskQuestionnaireCompleted?: boolean;
  riskQuestionnaireVersion?: string;
  riskProfileQnaJson?: string;
  riskBucket?: string;
  behavioralRiskLabel?: string;
  liquidityRiskLabel?: string;
  returnMismatchFlag?: boolean;

  // Risk (Discussion)
  riskDiscussionNotes?: string;
  riskDisagreementFlag?: string;

  // Suitability (Meeting)
  productRestrictionsNotes?: string;
  ticketSizeSipBand?: string;
  ticketSizeLumpsumBand?: string;
}

// ---------------------------------------------------------------------------
// Twenty Note Object
// ---------------------------------------------------------------------------

export interface TwentyNoteBodyV2 {
  blocknote?: string;
  markdown?: string;
}

export interface TwentyNoteCreatedBy {
  source?:
    | "EMAIL"
    | "CALENDAR"
    | "WORKFLOW"
    | "AGENT"
    | "API"
    | "IMPORT"
    | "MANUAL"
    | "SYSTEM"
    | "WEBHOOK";
}

export interface TwentyNote {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  position?: number;
  title?: string;
  bodyV2?: TwentyNoteBodyV2;
  createdBy?: TwentyNoteCreatedBy;
}

export interface TwentyNoteTarget {
  id: string;
  noteId: string;
  personId: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface TwentyApiResponse<T> {
  data: T;
  pageInfo?: {
    hasNextPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

export interface TwentyListResponse<T> {
  data: T[];
  pageInfo?: {
    hasNextPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

// ---------------------------------------------------------------------------
// Composite Types
// ---------------------------------------------------------------------------

export interface TwentyCustomerComplete {
  person: TwentyPerson;
  wealthProfile: TwentyWealthProfile | null;
  riskProfile: TwentyRiskProfile | null;
}
