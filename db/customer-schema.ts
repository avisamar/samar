import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// =============================================================================
// CUSTOMER TABLE
// =============================================================================

export const customer = pgTable(
  "customer",
  {
    // Core fields
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // -------------------------------------------------------------------------
    // Identity
    // -------------------------------------------------------------------------
    fullName: text("full_name"),
    dob: timestamp("dob"),
    ageBand: text("age_band"),
    ageBandOther: text("age_band_other"),
    gender: text("gender"),
    genderOther: text("gender_other"),
    maritalStatus: text("marital_status"),
    maritalStatusOther: text("marital_status_other"),

    // -------------------------------------------------------------------------
    // Household
    // -------------------------------------------------------------------------
    dependentsCount: integer("dependents_count"),
    dependentsNotes: text("dependents_notes"),
    householdStructure: text("household_structure"),
    householdStructureOther: text("household_structure_other"),
    familyFinancialResponsibilities: text("family_financial_responsibilities"),

    // -------------------------------------------------------------------------
    // Location
    // -------------------------------------------------------------------------
    cityOfResidence: text("city_of_residence"),
    countryOfResidence: text("country_of_residence"),
    countryOfResidenceOther: text("country_of_residence_other"),
    residenceStatus: text("residence_status"),
    residenceStatusOther: text("residence_status_other"),

    // -------------------------------------------------------------------------
    // Contact
    // -------------------------------------------------------------------------
    primaryMobile: text("primary_mobile"),
    secondaryMobile: text("secondary_mobile"),
    emailPrimary: text("email_primary"),

    // -------------------------------------------------------------------------
    // Contact Preferences
    // -------------------------------------------------------------------------
    preferredChannel: text("preferred_channel"),
    preferredChannelOther: text("preferred_channel_other"),
    preferredContactTime: text("preferred_contact_time"),
    preferredContactTimeOther: text("preferred_contact_time_other"),
    languagePreference: text("language_preference"),
    languagePreferenceOther: text("language_preference_other"),

    // -------------------------------------------------------------------------
    // Relationship
    // -------------------------------------------------------------------------
    relationshipOrigin: text("relationship_origin"),
    relationshipOriginOther: text("relationship_origin_other"),
    referralSourceName: text("referral_source_name"),

    // -------------------------------------------------------------------------
    // Professional
    // -------------------------------------------------------------------------
    occupationType: text("occupation_type"),
    occupationTypeOther: text("occupation_type_other"),
    industry: text("industry"),
    industryOther: text("industry_other"),
    jobTitle: text("job_title"),
    employerBusinessName: text("employer_business_name"),
    workLocation: text("work_location"),

    // -------------------------------------------------------------------------
    // Income
    // -------------------------------------------------------------------------
    incomeBandAnnual: text("income_band_annual"),
    incomeBandAnnualOther: text("income_band_annual_other"),
    incomeStability: text("income_stability"),
    incomeStabilityOther: text("income_stability_other"),
    incomeSourcesPrimary: text("income_sources_primary"),
    incomeSourcesPrimaryOther: text("income_sources_primary_other"),
    incomeSourcesSecondary: text("income_sources_secondary"),

    // -------------------------------------------------------------------------
    // Liquidity
    // -------------------------------------------------------------------------
    upcomingLiquidityEvents: text("upcoming_liquidity_events"),
    liquidityNeedsHorizon: text("liquidity_needs_horizon"),
    liquidityNeedsHorizonOther: text("liquidity_needs_horizon_other"),

    // -------------------------------------------------------------------------
    // Cashflow
    // -------------------------------------------------------------------------
    expenseBandMonthly: text("expense_band_monthly"),
    expenseBandMonthlyOther: text("expense_band_monthly_other"),
    surplusInvestableBand: text("surplus_investable_band"),
    surplusInvestableBandOther: text("surplus_investable_band_other"),
    emergencyBufferStatus: text("emergency_buffer_status"),
    emergencyBufferStatusOther: text("emergency_buffer_status_other"),

    // -------------------------------------------------------------------------
    // Liabilities
    // -------------------------------------------------------------------------
    liabilitiesPresence: text("liabilities_presence"),
    liabilitiesPresenceOther: text("liabilities_presence_other"),
    liabilitiesNotes: text("liabilities_notes"),

    // -------------------------------------------------------------------------
    // Goals
    // -------------------------------------------------------------------------
    goalsSummary: text("goals_summary"),
    goalsJson: jsonb("goals_json"),
    primaryGoalType: text("primary_goal_type"),
    primaryGoalTypeOther: text("primary_goal_type_other"),
    primaryGoalHorizon: text("primary_goal_horizon"),
    primaryGoalHorizonOther: text("primary_goal_horizon_other"),
    goalPriorityStyle: text("goal_priority_style"),
    goalPriorityStyleOther: text("goal_priority_style_other"),
    goalClarityLevel: text("goal_clarity_level"),
    goalClarityLevelOther: text("goal_clarity_level_other"),

    // -------------------------------------------------------------------------
    // Constraints
    // -------------------------------------------------------------------------
    constraintsSummary: text("constraints_summary"),
    regulatoryConstraintsNotes: text("regulatory_constraints_notes"),

    // -------------------------------------------------------------------------
    // Preferences
    // -------------------------------------------------------------------------
    investmentStylePreference: text("investment_style_preference"),
    investmentStylePreferenceOther: text("investment_style_preference_other"),
    assetClassPreference: text("asset_class_preference").array(),
    assetClassPreferenceOther: text("asset_class_preference_other"),
    productPreference: text("product_preference").array(),
    productPreferenceOther: text("product_preference_other"),
    productsToAvoid: text("products_to_avoid"),
    liquidityPreference: text("liquidity_preference"),
    liquidityPreferenceOther: text("liquidity_preference_other"),
    taxSensitivity: text("tax_sensitivity"),
    taxSensitivityOther: text("tax_sensitivity_other"),
    esgPreference: text("esg_preference"),
    esgPreferenceOther: text("esg_preference_other"),
    sectorTiltsPreferences: text("sector_tilts_preferences"),
    internationalExposureComfort: text("international_exposure_comfort"),
    internationalExposureComfortOther: text(
      "international_exposure_comfort_other"
    ),

    // -------------------------------------------------------------------------
    // Decisioning
    // -------------------------------------------------------------------------
    decisionStyle: text("decision_style"),
    decisionStyleOther: text("decision_style_other"),
    decisionSpeed: text("decision_speed"),
    decisionSpeedOther: text("decision_speed_other"),

    // -------------------------------------------------------------------------
    // Education
    // -------------------------------------------------------------------------
    financialLiteracyLevel: text("financial_literacy_level"),
    financialLiteracyLevelOther: text("financial_literacy_level_other"),
    knowledgeGapsNotes: text("knowledge_gaps_notes"),

    // -------------------------------------------------------------------------
    // Trust
    // -------------------------------------------------------------------------
    trustConcerns: text("trust_concerns"),
    pastAdvisoryExperience: text("past_advisory_experience"),
    pastAdvisoryExperienceOther: text("past_advisory_experience_other"),
    reasonsForSwitching: text("reasons_for_switching"),

    // -------------------------------------------------------------------------
    // Risk (Context)
    // -------------------------------------------------------------------------
    riskAnecdotes: text("risk_anecdotes"),

    // -------------------------------------------------------------------------
    // Risk (Questionnaire)
    // -------------------------------------------------------------------------
    riskQuestionnaireCompleted: boolean("risk_questionnaire_completed"),
    riskQuestionnaireVersion: text("risk_questionnaire_version"),
    riskProfileQnaJson: jsonb("risk_profile_qna_json"),
    riskBucket: text("risk_bucket"),
    riskBucketOther: text("risk_bucket_other"),
    behavioralRiskLabel: text("behavioral_risk_label"),
    behavioralRiskLabelOther: text("behavioral_risk_label_other"),
    liquidityRiskLabel: text("liquidity_risk_label"),
    liquidityRiskLabelOther: text("liquidity_risk_label_other"),
    returnMismatchFlag: boolean("return_mismatch_flag"),

    // -------------------------------------------------------------------------
    // Risk (Discussion)
    // -------------------------------------------------------------------------
    riskDiscussionNotes: text("risk_discussion_notes"),
    riskDisagreementFlag: text("risk_disagreement_flag"),
    riskDisagreementFlagOther: text("risk_disagreement_flag_other"),

    // -------------------------------------------------------------------------
    // Suitability (Meeting)
    // -------------------------------------------------------------------------
    productRestrictionsNotes: text("product_restrictions_notes"),
    ticketSizeSipBand: text("ticket_size_sip_band"),
    ticketSizeSipBandOther: text("ticket_size_sip_band_other"),
    ticketSizeLumpsumBand: text("ticket_size_lumpsum_band"),
    ticketSizeLumpsumBandOther: text("ticket_size_lumpsum_band_other"),

    // -------------------------------------------------------------------------
    // Lifestyle
    // -------------------------------------------------------------------------
    primaryInterests: text("primary_interests"),
    lifestyleChangesPlanned: text("lifestyle_changes_planned"),

    // -------------------------------------------------------------------------
    // Family/Succession
    // -------------------------------------------------------------------------
    spouseInvolvementLevel: text("spouse_involvement_level"),
    spouseInvolvementLevelOther: text("spouse_involvement_level_other"),
    successionPlanningInterest: text("succession_planning_interest"),
    successionPlanningInterestOther: text("succession_planning_interest_other"),

    // -------------------------------------------------------------------------
    // Special Situations
    // -------------------------------------------------------------------------
    majorLifeEventsNext12m: text("major_life_events_next_12m"),
    healthPlanningNotes: text("health_planning_notes"),
    legalConstraintsNotes: text("legal_constraints_notes"),

    // -------------------------------------------------------------------------
    // KYC Tracking
    // -------------------------------------------------------------------------
    kycStage: text("kyc_stage"),
    kycStageOther: text("kyc_stage_other"),
    kycGapsNotes: text("kyc_gaps_notes"),
    panSharedStatus: text("pan_shared_status"),
    panSharedStatusOther: text("pan_shared_status_other"),
    taxResidencyStatus: text("tax_residency_status"),
    taxResidencyStatusOther: text("tax_residency_status_other"),

    // -------------------------------------------------------------------------
    // Communication
    // -------------------------------------------------------------------------
    contentFormatPreference: text("content_format_preference"),
    contentFormatPreferenceOther: text("content_format_preference_other"),
    advisoryTouchFrequency: text("advisory_touch_frequency"),
    advisoryTouchFrequencyOther: text("advisory_touch_frequency_other"),
    communicationTonePreference: text("communication_tone_preference"),
    communicationTonePreferenceOther: text(
      "communication_tone_preference_other"
    ),

    // -------------------------------------------------------------------------
    // RM Workflow
    // -------------------------------------------------------------------------
    nextFollowUpDate: timestamp("next_follow_up_date"),
    nextFollowUpAgenda: text("next_follow_up_agenda"),

    // -------------------------------------------------------------------------
    // Meetings/Notes
    // -------------------------------------------------------------------------
    lastMeetingDate: timestamp("last_meeting_date"),
    lastMeetingNotes: text("last_meeting_notes"),
    keyDiscussionPoints: text("key_discussion_points"),
    clientPainPoints: text("client_pain_points"),
    clientFeedback: text("client_feedback"),
    relationshipStrengthNotes: text("relationship_strength_notes"),

    // -------------------------------------------------------------------------
    // Audit
    // -------------------------------------------------------------------------
    profileCreatedBy: text("profile_created_by"),
    profileLastUpdatedBy: text("profile_last_updated_by"),

    // -------------------------------------------------------------------------
    // Additional Data (non-schema key-value pairs)
    // -------------------------------------------------------------------------
    additionalData: jsonb("additional_data"),
  },
  (table) => [
    index("customer_full_name_idx").on(table.fullName),
    index("customer_email_idx").on(table.emailPrimary),
  ]
);

// =============================================================================
// CUSTOMER NOTE TABLE
// =============================================================================

export const customerNote = pgTable(
  "customer_note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    source: text("source"), // "meeting", "call", "email", "voice_note"
    tags: text("tags").array(),
    rawInput: text("raw_input"),
    extractedFields: jsonb("extracted_fields"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by"),
  },
  (table) => [index("customer_note_customer_id_idx").on(table.customerId)]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const customerRelations = relations(customer, ({ many }) => ({
  notes: many(customerNote),
}));

export const customerNoteRelations = relations(customerNote, ({ one }) => ({
  customer: one(customer, {
    fields: [customerNote.customerId],
    references: [customer.id],
  }),
}));
