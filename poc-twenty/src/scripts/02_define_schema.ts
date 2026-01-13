import { apiClient } from '../apiClient';

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY_MS = 2000;

// Define the custom objects we want to create
const CUSTOM_OBJECTS = [
  {
    nameSingular: 'wealthProfile',
    namePlural: 'wealthProfiles',
    labelSingular: 'Wealth Profile',
    labelPlural: 'Wealth Profiles',
    description: 'Financial profile of a client including income, liquidity, and liabilities',
    icon: 'IconWallet'
  },
  {
    nameSingular: 'riskProfile',
    namePlural: 'riskProfiles',
    labelSingular: 'Risk Profile',
    labelPlural: 'Risk Profiles',
    description: 'Investment risk tolerance, goals, preferences, and suitability',
    icon: 'IconShield'
  }
];

// Field type definitions
type FieldType = 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER' | 'BOOLEAN' | 'MULTI_SELECT';

interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  options?: string[]; // For SELECT and MULTI_SELECT
}

// Helper to create options array for Twenty API
// Values must match pattern: ^[A-Z0-9]+_[A-Z0-9]+$ (UPPERCASE with underscore)
function createOptions(options: string[], fieldName: string): Array<{ label: string; value: string; position: number; color: string }> {
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'gray'];
  const prefix = toEnumPrefix(fieldName);
  return options.map((opt, idx) => ({
    label: opt,
    value: `${prefix}_${toEnumValue(opt)}`,
    position: idx,
    color: colors[idx % colors.length]
  }));
}

// Convert field name to UPPERCASE prefix (e.g., "ageBand" -> "AGEBAND")
function toEnumPrefix(fieldName: string): string {
  return fieldName.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Convert option label to UPPERCASE enum value (e.g., "25-34" -> "25TO34", "Other" -> "OTHER")
function toEnumValue(str: string): string {
  return str
    .toUpperCase()
    .replace(/[–—-]/g, 'TO')  // Replace dashes with TO
    .replace(/[<]/g, 'UNDER') // Replace < with UNDER
    .replace(/[>]/g, 'OVER')  // Replace > with OVER
    .replace(/[+]/g, 'PLUS')  // Replace + with PLUS
    .replace(/\s+/g, '')      // Remove spaces
    .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric
    .replace(/^$/, 'EMPTY');  // Handle empty result
}

// Sanitize label for Twenty API - remove special characters that cause errors
function sanitizeLabel(label: string): string {
  return label
    .replace(/\//g, ' - ')    // Replace / with -
    .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();
}

// =============================================================================
// PERSON FIELDS
// Sections: Identity, Household, Location, Contact, Contact Prefs, Relationship,
//           Professional, Lifestyle, Family/Succession, Special Situations,
//           KYC Tracking (CRM), Communication, RM Workflow, Meetings/Notes, Audit
// =============================================================================
const PERSON_FIELDS: FieldDefinition[] = [
  // Identity
  { name: 'fullName', label: 'Full Name', type: 'TEXT', description: 'Free text' },
  { name: 'dob', label: 'Date of Birth', type: 'DATE', description: 'Format: DD-MMM-YYYY (or ISO internally)' },
  { name: 'ageBand', label: 'Age Band', type: 'SELECT', options: ['<25', '25-34', '35-44', '45-54', '55-64', '65+', 'Other'] },
  { name: 'gender', label: 'Gender', type: 'SELECT', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'] },
  { name: 'maritalStatus', label: 'Marital Status', type: 'SELECT', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Other'] },

  // Household
  { name: 'dependentsCount', label: 'Number of Dependents', type: 'NUMBER', description: '0-20' },
  { name: 'dependentsNotes', label: 'Dependents Details', type: 'TEXT', description: 'Names/ages/relationships' },
  { name: 'householdStructure', label: 'Household Structure', type: 'SELECT', options: ['Nuclear', 'Joint family', 'Living alone', 'Other'] },
  { name: 'familyFinancialResponsibilities', label: 'Family Financial Responsibilities', type: 'TEXT', description: 'e.g., parents support, siblings, etc.' },

  // Location
  { name: 'cityOfResidence', label: 'City of Residence', type: 'TEXT', description: 'Free text' },
  { name: 'countryOfResidence', label: 'Country of Residence', type: 'SELECT', options: ['India', 'UAE', 'US', 'UK', 'Singapore', 'Other'] },
  { name: 'residenceStatus', label: 'Residence Status', type: 'SELECT', options: ['Resident', 'NRI', 'OCI', 'PIO', 'Other'] },

  // Contact
  { name: 'primaryMobile', label: 'Primary Contact Number', type: 'TEXT', description: 'Prefer E.164 storage (+91...)' },
  { name: 'secondaryMobile', label: 'Secondary Contact Number', type: 'TEXT', description: 'Optional' },
  { name: 'emailPrimary', label: 'Email Address', type: 'TEXT', description: 'Validate email format' },

  // Contact Prefs
  { name: 'preferredChannel', label: 'Preferred Communication Channel', type: 'SELECT', options: ['WhatsApp', 'Call', 'Email', 'SMS', 'Other'] },
  { name: 'preferredContactTime', label: 'Preferred Time to Contact', type: 'SELECT', options: ['Morning', 'Afternoon', 'Evening', 'Weekends', 'Flexible', 'Other'] },
  { name: 'languagePreference', label: 'Language Preference', type: 'SELECT', options: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Other'] },

  // Relationship
  { name: 'relationshipOrigin', label: 'How RM met client', type: 'SELECT', options: ['Referral', 'Existing relationship', 'Event', 'Cold outreach', 'Digital inbound', 'Other'] },
  { name: 'referralSourceName', label: 'Referral Source (Name)', type: 'TEXT', description: 'Optional' },

  // Professional
  { name: 'occupationType', label: 'Occupation Type', type: 'SELECT', options: ['Salaried', 'Business Owner', 'Professional', 'Self-employed', 'Retired', 'Unemployed', 'Other'] },
  { name: 'industry', label: 'Work Industry', type: 'SELECT', options: ['IT', 'BFSI', 'Pharma', 'Manufacturing', 'Healthcare', 'Real Estate', 'Education', 'Govt', 'Other'] },
  { name: 'jobTitle', label: 'Job Title / Designation', type: 'TEXT', description: 'Free text' },
  { name: 'employerBusinessName', label: 'Employer / Business Name', type: 'TEXT', description: 'Free text' },
  { name: 'workLocation', label: 'Work Location', type: 'TEXT', description: 'City/country if relevant' },

  // Lifestyle
  { name: 'primaryInterests', label: 'Primary Interests', type: 'TEXT', description: 'Hobbies, interests (relationship building)' },
  { name: 'lifestyleChangesPlanned', label: 'Lifestyle Changes Planned', type: 'TEXT', description: 'e.g., relocation, upgrade, sabbatical' },

  // Family/Succession
  { name: 'spouseInvolvementLevel', label: 'Spouse/Family Involvement', type: 'SELECT', options: ['Not involved', 'Consulted', 'Decision-maker', 'Other'] },
  { name: 'successionPlanningInterest', label: 'Succession Planning Interest', type: 'SELECT', options: ['Not now', 'Interested', 'Urgent', 'Other'] },

  // Special Situations
  { name: 'majorLifeEventsNext12m', label: 'Major Life Events (Next 12m)', type: 'TEXT', description: 'marriage, birth, job change, etc.' },
  { name: 'healthPlanningNotes', label: 'Health / Medical Planning Notes', type: 'TEXT', description: 'Optional; treat as sensitive' },
  { name: 'legalConstraintsNotes', label: 'Legal/Compliance Constraints Notes', type: 'TEXT', description: 'Optional' },

  // KYC Tracking (CRM)
  { name: 'kycStage', label: 'KYC Stage (Tracking)', type: 'SELECT', options: ['Not started', 'In progress', 'Completed', 'Blocked', 'Other'] },
  { name: 'kycGapsNotes', label: 'KYC Gaps Notes', type: 'TEXT', description: 'What is missing (PAN copy, address proof etc.)' },
  { name: 'panSharedStatus', label: 'PAN Shared?', type: 'SELECT', options: ['Yes', 'No', 'Will share later', 'Other'] },
  { name: 'taxResidencyStatus', label: 'Tax Residency Status', type: 'SELECT', options: ['India', 'Abroad', 'Dual', 'Other'] },

  // Communication
  { name: 'contentFormatPreference', label: 'Content Format Preference', type: 'SELECT', options: ['Short text', 'Charts', 'Data-heavy', 'Video', 'Other'] },
  { name: 'advisoryTouchFrequency', label: 'Preferred Touch Frequency', type: 'SELECT', options: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Ad-hoc', 'Other'] },
  { name: 'communicationTonePreference', label: 'Preferred Communication Tone', type: 'SELECT', options: ['Formal', 'Professional', 'Friendly', 'Casual', 'Other'] },

  // RM Workflow
  { name: 'nextFollowUpDate', label: 'Next Follow-up Date', type: 'DATE', description: 'CRM tasking; ISO storage' },
  { name: 'nextFollowUpAgenda', label: 'Next Follow-up Agenda', type: 'TEXT', description: 'What RM plans to cover' },

  // Meetings/Notes
  { name: 'lastMeetingDate', label: 'Last Meeting Date', type: 'DATE', description: 'ISO storage' },
  { name: 'lastMeetingNotes', label: 'Last Meeting Notes', type: 'TEXT', description: 'Free text or dictated summary' },
  { name: 'keyDiscussionPoints', label: 'Key Discussion Points', type: 'TEXT', description: 'Bullet themes' },
  { name: 'clientPainPoints', label: 'Pain Points Identified', type: 'TEXT', description: 'What frustrates client' },
  { name: 'clientFeedback', label: 'Client Feedback', type: 'TEXT', description: 'Verbatim highlights' },
  { name: 'relationshipStrengthNotes', label: 'Relationship Strength Notes', type: 'TEXT', description: 'RM judgement; internal' },

  // Audit
  { name: 'profileCreatedDate', label: 'Profile Created Date', type: 'DATE', description: 'System populated' },
  { name: 'profileCreatedBy', label: 'Profile Created By', type: 'TEXT', description: 'RM/user id' },
  { name: 'profileLastUpdatedDate', label: 'Last Updated Date', type: 'DATE', description: 'System populated' },
  { name: 'profileLastUpdatedBy', label: 'Last Updated By', type: 'TEXT', description: 'RM/user id' },
];

// =============================================================================
// WEALTH PROFILE FIELDS
// Sections: Income, Liquidity, Cashflow, Liabilities
// =============================================================================
const WEALTH_PROFILE_FIELDS: FieldDefinition[] = [
  // Income
  { name: 'incomeBandAnnual', label: 'Annual Income Band', type: 'SELECT', options: ['<10L', '10-25L', '25-50L', '50L-1Cr', '1-2Cr', '2Cr+', 'Other'] },
  { name: 'incomeStability', label: 'Income Stability', type: 'SELECT', options: ['Stable', 'Variable', 'Seasonal', 'Uncertain', 'Other'] },
  { name: 'incomeSourcesPrimary', label: 'Primary Income Source', type: 'SELECT', options: ['Salary', 'Business', 'Rent', 'Capital Gains', 'Dividends', 'Pension', 'Other'] },
  { name: 'incomeSourcesSecondary', label: 'Secondary Income Sources', type: 'TEXT', description: 'Free text' },

  // Liquidity
  { name: 'upcomingLiquidityEvents', label: 'Upcoming Liquidity Events', type: 'TEXT', description: 'e.g., ESOP vesting, property sale; include rough timeline' },
  { name: 'liquidityNeedsHorizon', label: 'Liquidity Needs Horizon', type: 'SELECT', options: ['<3 months', '3-12 months', '1-3 years', '3-5 years', '5+ years', 'Other'] },

  // Cashflow
  { name: 'expenseBandMonthly', label: 'Monthly Expense Band', type: 'SELECT', options: ['<50k', '50k-1L', '1-2L', '2-5L', '5L+', 'Other'] },
  { name: 'surplusInvestableBand', label: 'Investable Surplus Band (Monthly)', type: 'SELECT', options: ['<25k', '25k-50k', '50k-1L', '1-3L', '3L+', 'Other'] },
  { name: 'emergencyBufferStatus', label: 'Emergency Buffer Status', type: 'SELECT', options: ['None', '<3 months', '3-6 months', '6-12 months', '12+ months', 'Other'] },

  // Liabilities
  { name: 'liabilitiesPresence', label: 'Liabilities Present?', type: 'SELECT', options: ['None', 'Home loan', 'Personal loan', 'Business loan', 'Credit card', 'Multiple', 'Other'] },
  { name: 'liabilitiesNotes', label: 'Liabilities Notes', type: 'TEXT', description: 'Qualitative summary' },
];

// =============================================================================
// RISK PROFILE FIELDS
// Sections: Goals, Constraints, Preferences, Decisioning, Education, Trust,
//           Risk (Context), Risk (Questionnaire), Risk (Discussion), Suitability (Meeting)
// =============================================================================
const RISK_PROFILE_FIELDS: FieldDefinition[] = [
  // Goals
  { name: 'goalsSummary', label: 'Goals Summary', type: 'TEXT', description: 'Free-text capture of main goals' },
  { name: 'goalsJson', label: 'Goals (Structured)', type: 'TEXT', description: 'JSON: Array of {type, amount_band, target_year, priority, fixed_flexible}' },
  { name: 'primaryGoalType', label: 'Primary Goal Type', type: 'SELECT', options: ['Retirement', 'Child education', 'Home purchase', 'Wealth creation', 'Business goal', 'Travel/lifestyle', 'Tax planning', 'Capital preservation', 'Other'] },
  { name: 'primaryGoalHorizon', label: 'Primary Goal Horizon', type: 'SELECT', options: ['<1y', '1-3y', '3-5y', '5-10y', '10y+', 'Other'] },
  { name: 'goalPriorityStyle', label: 'Goal Priority Style', type: 'SELECT', options: ['One primary', 'Multiple equal', 'Unsure', 'Other'] },
  { name: 'goalClarityLevel', label: 'Goal Clarity Level', type: 'SELECT', options: ['Clear', 'Rough', 'Unclear', 'Other'] },

  // Constraints
  { name: 'constraintsSummary', label: 'Key Constraints', type: 'TEXT', description: 'Liquidity, lock-ins, product bans, etc.' },
  { name: 'regulatoryConstraintsNotes', label: 'Regulatory Constraints Notes', type: 'TEXT', description: 'NRI constraints, employer restrictions, etc.' },

  // Preferences
  { name: 'investmentStylePreference', label: 'Investment Style Preference', type: 'SELECT', options: ['SIP', 'Lump sum', 'Mix', 'Unsure', 'Other'] },
  { name: 'assetClassPreference', label: 'Preferred Asset Classes', type: 'MULTI_SELECT', options: ['Equity', 'Debt', 'Gold', 'International', 'Alternatives', 'Other'] },
  { name: 'productPreference', label: 'Product Preferences', type: 'MULTI_SELECT', options: ['Mutual Funds', 'PMS', 'AIF', 'Direct Equity', 'Insurance', 'FDs/Bonds', 'Structured', 'Other'] },
  { name: 'productsToAvoid', label: 'Products to Avoid', type: 'TEXT', description: 'Free text' },
  { name: 'liquidityPreference', label: 'Liquidity Preference', type: 'SELECT', options: ['High liquidity', 'Balanced', 'Can lock-in', 'Other'] },
  { name: 'taxSensitivity', label: 'Tax Sensitivity', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Other'] },
  { name: 'esgPreference', label: 'ESG / Ethical Preference', type: 'SELECT', options: ['No preference', 'Interested', 'Strong requirement', 'Other'] },
  { name: 'sectorTiltsPreferences', label: 'Sector/Theme Preferences', type: 'TEXT', description: 'Free text' },
  { name: 'internationalExposureComfort', label: 'International Exposure Comfort', type: 'SELECT', options: ['None', 'Limited', 'Moderate', 'High', 'Other'] },

  // Decisioning
  { name: 'decisionStyle', label: 'Decision Style', type: 'SELECT', options: ['Data-heavy', 'Balanced', 'Simple summary', 'Delegates to RM', 'Other'] },
  { name: 'decisionSpeed', label: 'Decision Speed', type: 'SELECT', options: ['Fast', 'Medium', 'Slow', 'Needs family input', 'Other'] },

  // Education
  { name: 'financialLiteracyLevel', label: 'Financial Literacy Level', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Other'] },
  { name: 'knowledgeGapsNotes', label: 'Knowledge Gaps / Topics to Explain', type: 'TEXT', description: 'Free text' },

  // Trust
  { name: 'trustConcerns', label: 'Trust Concerns / Past Bad Experiences', type: 'TEXT', description: 'Free text' },
  { name: 'pastAdvisoryExperience', label: 'Past Advisor Experience', type: 'SELECT', options: ['None', 'Used advisor earlier', 'Switching advisor now', 'Other'] },
  { name: 'reasonsForSwitching', label: 'Reasons for Switching', type: 'TEXT', description: 'Free text' },

  // Risk (Context)
  { name: 'riskAnecdotes', label: 'Risk Anecdotes (Non-authoritative)', type: 'TEXT', description: 'Stories/observations; not used for scoring' },

  // Risk (Questionnaire)
  { name: 'riskQuestionnaireCompleted', label: 'Risk Questionnaire Completed', type: 'BOOLEAN', description: 'Store completion state' },
  { name: 'riskQuestionnaireVersion', label: 'Risk Questionnaire Version', type: 'TEXT', description: 'e.g., v1.0' },
  { name: 'riskProfileQnaJson', label: 'Risk Profile Q&A (JSON)', type: 'TEXT', description: 'Q1-Q9 IDs + answer codes' },
  { name: 'riskBucket', label: 'Risk Bucket', type: 'SELECT', options: ['CAPITAL_PRESERVATION', 'CONSERVATIVE_BALANCED', 'BALANCED_GROWTH', 'GROWTH', 'Other'] },
  { name: 'behavioralRiskLabel', label: 'Behavioral Risk Label', type: 'SELECT', options: ['LOW', 'MEDIUM', 'HIGH', 'Other'] },
  { name: 'liquidityRiskLabel', label: 'Liquidity Risk Label', type: 'SELECT', options: ['LOW', 'MEDIUM', 'HIGH', 'Other'] },
  { name: 'returnMismatchFlag', label: 'Return Expectation Mismatch Flag', type: 'BOOLEAN', description: 'True if need-implied > final bucket' },

  // Risk (Discussion)
  { name: 'riskDiscussionNotes', label: 'Risk Discussion Notes', type: 'TEXT', description: 'How client reacted; objections; clarifications' },
  { name: 'riskDisagreementFlag', label: 'Client Disagrees with Risk Outcome', type: 'SELECT', options: ['No', 'Mildly', 'Strongly', 'Other'] },

  // Suitability (Meeting)
  { name: 'productRestrictionsNotes', label: 'Product Restrictions (Meeting-learned)', type: 'TEXT', description: 'Cannot do X, avoid lock-ins, etc.' },
  { name: 'ticketSizeSipBand', label: 'SIP Ticket Size Comfort', type: 'SELECT', options: ['<10k', '10-25k', '25-50k', '50k-1L', '1L+', 'Other'] },
  { name: 'ticketSizeLumpsumBand', label: 'Lump Sum Ticket Size Comfort', type: 'SELECT', options: ['<1L', '1-5L', '5-10L', '10-25L', '25L+', 'Other'] },
];

async function main() {
  console.log('Starting Schema Definition...');

  // 1. Fetch existing objects to get IDs
  let objectMap = new Map<string, string>();

  try {
    const { data: metaData } = await apiClient.get('metadata/objects');
    const existingObjects = metaData.data.objects;
    existingObjects.forEach((obj: any) => {
      objectMap.set(obj.nameSingular, obj.id);
    });
    console.log(`Loaded ${objectMap.size} objects.`);
    await sleep(API_DELAY_MS);
  } catch (error: any) {
    console.error('Failed to fetch objects:', error.message);
    return;
  }

  const personObjectId = objectMap.get('person');
  if (!personObjectId) {
    console.error('Critical: Person object not found in metadata.');
    return;
  }

  // 2. Create Custom Objects & Relations
  for (const obj of CUSTOM_OBJECTS) {
    let objectId = objectMap.get(obj.nameSingular);

    if (objectId) {
      console.log(`Object ${obj.labelSingular} (${obj.nameSingular}) already exists.`);
    } else {
      try {
        console.log(`Creating Object: ${obj.labelSingular}...`);
        const payload = {
          nameSingular: obj.nameSingular,
          namePlural: obj.namePlural,
          labelSingular: obj.labelSingular,
          labelPlural: obj.labelPlural,
          description: obj.description,
          icon: obj.icon
        };

        const { data: created } = await apiClient.post('metadata/objects', payload);
        await sleep(API_DELAY_MS);
        const newObject = created.data?.createObject || created.data?.object || created.data;

        if (newObject && newObject.id) {
          objectId = newObject.id;
          objectMap.set(obj.nameSingular, newObject.id);
          console.log(`Created Object ${obj.labelSingular} (ID: ${newObject.id}).`);
        } else {
          console.log('Object created but ID not found in response, refetching...');
          const { data: refetch } = await apiClient.get('metadata/objects');
          await sleep(API_DELAY_MS);
          const found = refetch.data.objects.find((o: any) => o.nameSingular === obj.nameSingular);
          if (found) {
            objectId = found.id;
            objectMap.set(obj.nameSingular, found.id);
          }
        }
      } catch (error: any) {
        console.error(`Failed to create object ${obj.labelSingular}:`, error.response?.data || error.message);
      }
    }

    if (objectId) {
      try {
        console.log(`Linking ${obj.labelSingular} to Person...`);
        const relationPayload = {
          name: 'person',
          label: 'Person',
          type: 'RELATION',
          icon: 'IconRelationOneToMany',
          isLabelSyncedWithName: true,
          objectMetadataId: objectId,
          description: 'The client associated with this profile',
          relationCreationPayload: {
            targetFieldIcon: 'IconUsers',
            targetFieldLabel: obj.labelSingular,
            targetObjectMetadataId: personObjectId,
            type: 'MANY_TO_ONE',
          }
        };

        await apiClient.post('metadata/fields', relationPayload);
        await sleep(API_DELAY_MS);
        console.log(`Linked ${obj.labelSingular} -> Person`);
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message;
        if (msg && (msg.includes('already exists') || msg.includes('Duplicate'))) {
          console.log(`Relation ${obj.nameSingular}.person already exists.`);
        } else {
          console.error(`Failed to create relation for ${obj.labelSingular}:`, JSON.stringify(error.response?.data || error.message));
        }
      }
    }
  }

  // 3. Create Fields for each object
  const fieldSets: Array<{ objectKey: string; fields: FieldDefinition[] }> = [
    { objectKey: 'person', fields: PERSON_FIELDS },
    { objectKey: 'wealthProfile', fields: WEALTH_PROFILE_FIELDS },
    { objectKey: 'riskProfile', fields: RISK_PROFILE_FIELDS },
  ];

  for (const { objectKey, fields } of fieldSets) {
    const objectId = objectMap.get(objectKey);
    if (!objectId) {
      console.error(`Object '${objectKey}' not found. Skipping its fields.`);
      continue;
    }

    console.log(`\nCreating ${fields.length} fields for ${objectKey}...`);

    for (const field of fields) {
      const payload: any = {
        name: field.name,
        label: sanitizeLabel(field.label),
        type: field.type,
        objectMetadataId: objectId,
        description: field.description || '',
        isNullable: true
      };

      if ((field.type === 'SELECT' || field.type === 'MULTI_SELECT') && field.options) {
        payload.options = createOptions(field.options, field.name);
      }

      try {
        console.log(`  Creating: ${objectKey}.${field.name} (${field.type})...`);
        await apiClient.post('metadata/fields', payload);
        await sleep(API_DELAY_MS);
        console.log(`  Created: ${field.name}`);
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message;
        if (msg && (msg.includes('already exists') || msg.includes('Duplicate'))) {
          console.log(`  Field ${field.name} already exists.`);
        } else {
          console.error(`  Failed to create field ${field.name}:`, JSON.stringify(error.response?.data || error.message));
        }
        await sleep(API_DELAY_MS);
      }
    }
  }

  console.log('\nSchema definition complete.');
}

main();
