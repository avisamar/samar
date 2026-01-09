import type { Customer } from "./types";

// Fields grouped by priority for completeness calculation
const HIGH_PRIORITY_FIELDS: (keyof Customer)[] = [
  "fullName",
  "dob",
  "primaryMobile",
  "emailPrimary",
  "cityOfResidence",
  "occupationType",
  "incomeBandAnnual",
  "goalsSummary",
  "primaryGoalType",
  "primaryGoalHorizon",
  "constraintsSummary",
  "investmentStylePreference",
  "liquidityPreference",
  "riskQuestionnaireCompleted",
  "trustConcerns",
  "majorLifeEventsNext12m",
  "nextFollowUpDate",
  "nextFollowUpAgenda",
  "lastMeetingDate",
  "lastMeetingNotes",
  "preferredChannel",
  "upcomingLiquidityEvents",
  "liquidityNeedsHorizon",
  "expenseBandMonthly",
  "surplusInvestableBand",
  "emergencyBufferStatus",
];

const MEDIUM_PRIORITY_FIELDS: (keyof Customer)[] = [
  "ageBand",
  "maritalStatus",
  "dependentsCount",
  "countryOfResidence",
  "residenceStatus",
  "relationshipOrigin",
  "industry",
  "employerBusinessName",
  "incomeStability",
  "incomeSourcesPrimary",
  "liabilitiesPresence",
  "liabilitiesNotes",
  "goalsJson",
  "goalPriorityStyle",
  "goalClarityLevel",
  "regulatoryConstraintsNotes",
  "assetClassPreference",
  "productPreference",
  "taxSensitivity",
  "internationalExposureComfort",
  "financialLiteracyLevel",
  "knowledgeGapsNotes",
  "riskBucket",
  "riskDiscussionNotes",
  "productRestrictionsNotes",
  "ticketSizeSipBand",
  "ticketSizeLumpsumBand",
  "kycStage",
  "panSharedStatus",
  "taxResidencyStatus",
  "advisoryTouchFrequency",
  "keyDiscussionPoints",
  "clientPainPoints",
];

export interface ProfileCompleteness {
  percentage: number;
  highPriorityFilled: number;
  highPriorityTotal: number;
  mediumPriorityFilled: number;
  mediumPriorityTotal: number;
  level: "minimal" | "basic" | "moderate" | "detailed" | "complete";
}

function countFilledFields(customer: Customer, fields: (keyof Customer)[]): number {
  return fields.filter((field) => {
    const value = customer[field];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
}

export function calculateCompleteness(customer: Customer): ProfileCompleteness {
  const highPriorityFilled = countFilledFields(customer, HIGH_PRIORITY_FIELDS);
  const mediumPriorityFilled = countFilledFields(customer, MEDIUM_PRIORITY_FIELDS);

  const highPriorityTotal = HIGH_PRIORITY_FIELDS.length;
  const mediumPriorityTotal = MEDIUM_PRIORITY_FIELDS.length;

  // Weighted calculation: high priority fields count more
  const highWeight = 0.7;
  const mediumWeight = 0.3;

  const highPercentage = highPriorityFilled / highPriorityTotal;
  const mediumPercentage = mediumPriorityFilled / mediumPriorityTotal;

  const percentage = Math.round(
    (highPercentage * highWeight + mediumPercentage * mediumWeight) * 100
  );

  let level: ProfileCompleteness["level"];
  if (percentage < 15) {
    level = "minimal";
  } else if (percentage < 35) {
    level = "basic";
  } else if (percentage < 55) {
    level = "moderate";
  } else if (percentage < 75) {
    level = "detailed";
  } else {
    level = "complete";
  }

  return {
    percentage,
    highPriorityFilled,
    highPriorityTotal,
    mediumPriorityFilled,
    mediumPriorityTotal,
    level,
  };
}

export function getCompletenessColor(level: ProfileCompleteness["level"]): string {
  switch (level) {
    case "minimal":
      return "text-red-600 dark:text-red-400";
    case "basic":
      return "text-orange-600 dark:text-orange-400";
    case "moderate":
      return "text-yellow-600 dark:text-yellow-400";
    case "detailed":
      return "text-blue-600 dark:text-blue-400";
    case "complete":
      return "text-green-600 dark:text-green-400";
  }
}

export function getCompletenessBgColor(level: ProfileCompleteness["level"]): string {
  switch (level) {
    case "minimal":
      return "bg-red-500";
    case "basic":
      return "bg-orange-500";
    case "moderate":
      return "bg-yellow-500";
    case "detailed":
      return "bg-blue-500";
    case "complete":
      return "bg-green-500";
  }
}
