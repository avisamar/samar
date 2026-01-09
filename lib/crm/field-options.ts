// Maps field keys to their enum options for form generation
import * as CustomerTypes from "@/db/customer-types";

type EnumOptions = readonly string[];

// Map of field keys to their enum options
export const FIELD_OPTIONS: Record<string, EnumOptions> = {
  // Identity
  ageBand: CustomerTypes.AgeBandOptions,
  gender: CustomerTypes.GenderOptions,
  maritalStatus: CustomerTypes.MaritalStatusOptions,

  // Household
  householdStructure: CustomerTypes.HouseholdStructureOptions,

  // Location
  countryOfResidence: CustomerTypes.CountryOfResidenceOptions,
  residenceStatus: CustomerTypes.ResidenceStatusOptions,

  // Contact Preferences
  preferredChannel: CustomerTypes.PreferredChannelOptions,
  preferredContactTime: CustomerTypes.PreferredContactTimeOptions,
  languagePreference: CustomerTypes.LanguagePreferenceOptions,

  // Relationship
  relationshipOrigin: CustomerTypes.RelationshipOriginOptions,

  // Professional
  occupationType: CustomerTypes.OccupationTypeOptions,
  industry: CustomerTypes.IndustryOptions,

  // Income
  incomeBandAnnual: CustomerTypes.IncomeBandAnnualOptions,
  incomeStability: CustomerTypes.IncomeStabilityOptions,
  incomeSourcesPrimary: CustomerTypes.IncomeSourcesPrimaryOptions,

  // Liquidity
  liquidityNeedsHorizon: CustomerTypes.LiquidityNeedsHorizonOptions,

  // Cashflow
  expenseBandMonthly: CustomerTypes.ExpenseBandMonthlyOptions,
  surplusInvestableBand: CustomerTypes.SurplusInvestableBandOptions,
  emergencyBufferStatus: CustomerTypes.EmergencyBufferStatusOptions,

  // Liabilities
  liabilitiesPresence: CustomerTypes.LiabilitiesPresenceOptions,

  // Goals
  primaryGoalType: CustomerTypes.PrimaryGoalTypeOptions,
  primaryGoalHorizon: CustomerTypes.PrimaryGoalHorizonOptions,
  goalPriorityStyle: CustomerTypes.GoalPriorityStyleOptions,
  goalClarityLevel: CustomerTypes.GoalClarityLevelOptions,

  // Preferences
  investmentStylePreference: CustomerTypes.InvestmentStylePreferenceOptions,
  assetClassPreference: CustomerTypes.AssetClassPreferenceOptions,
  productPreference: CustomerTypes.ProductPreferenceOptions,
  liquidityPreference: CustomerTypes.LiquidityPreferenceOptions,
  taxSensitivity: CustomerTypes.TaxSensitivityOptions,
  esgPreference: CustomerTypes.EsgPreferenceOptions,
  internationalExposureComfort: CustomerTypes.InternationalExposureComfortOptions,

  // Decisioning
  decisionStyle: CustomerTypes.DecisionStyleOptions,
  decisionSpeed: CustomerTypes.DecisionSpeedOptions,

  // Education
  financialLiteracyLevel: CustomerTypes.FinancialLiteracyLevelOptions,

  // Trust
  pastAdvisoryExperience: CustomerTypes.PastAdvisoryExperienceOptions,

  // Risk
  riskBucket: CustomerTypes.RiskBucketOptions,
  behavioralRiskLabel: CustomerTypes.BehavioralRiskLabelOptions,
  liquidityRiskLabel: CustomerTypes.LiquidityRiskLabelOptions,
  riskDisagreementFlag: CustomerTypes.RiskDisagreementFlagOptions,

  // Suitability
  ticketSizeSipBand: CustomerTypes.TicketSizeSipBandOptions,
  ticketSizeLumpsumBand: CustomerTypes.TicketSizeLumpsumBandOptions,

  // Family/Succession
  spouseInvolvementLevel: CustomerTypes.SpouseInvolvementLevelOptions,
  successionPlanningInterest: CustomerTypes.SuccessionPlanningInterestOptions,

  // KYC
  kycStage: CustomerTypes.KycStageOptions,
  panSharedStatus: CustomerTypes.PanSharedStatusOptions,
  taxResidencyStatus: CustomerTypes.TaxResidencyStatusOptions,

  // Communication
  contentFormatPreference: CustomerTypes.ContentFormatPreferenceOptions,
  advisoryTouchFrequency: CustomerTypes.AdvisoryTouchFrequencyOptions,
  communicationTonePreference: CustomerTypes.CommunicationTonePreferenceOptions,
};

export function getFieldOptions(fieldKey: string): EnumOptions | undefined {
  return FIELD_OPTIONS[fieldKey];
}
