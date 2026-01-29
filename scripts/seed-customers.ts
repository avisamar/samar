import "dotenv/config";
import { crmRepository } from "../lib/crm";
import type { NewCustomer, NoteInput } from "../lib/crm";

// Sample data pools for generating realistic customers
const firstNames = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Suresh", "Kavita",
  "Rajesh", "Meera", "Arun", "Deepa", "Sanjay", "Nisha", "Kiran", "Pooja",
  "Manoj", "Swati", "Gaurav", "Ananya",
];

const lastNames = [
  "Sharma", "Patel", "Gupta", "Singh", "Kumar", "Reddy", "Nair", "Iyer",
  "Mehta", "Joshi", "Rao", "Desai", "Malhotra", "Bhatia", "Kapoor", "Verma",
  "Agarwal", "Pillai", "Menon", "Chatterjee",
];

const cities = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow",
];

const industries = ["IT", "BFSI", "Pharma", "Manufacturing", "Healthcare", "Real Estate", "Education"];
const occupationTypes = ["Salaried", "Business Owner", "Professional", "Self-employed", "Retired"];
const incomeBands = ["<10L", "10-25L", "25-50L", "50L-1Cr", "1-2Cr", "2Cr+"];
const goalTypes = ["Retirement", "Child education", "Home purchase", "Wealth creation", "Tax planning"];
const goalHorizons = ["<1y", "1-3y", "3-5y", "5-10y", "10y+"];
const riskBuckets = ["CAPITAL_PRESERVATION", "CONSERVATIVE_BALANCED", "BALANCED_GROWTH", "GROWTH"];
const channels = ["WhatsApp", "Call", "Email"];
const investmentStyles = ["SIP", "Lump sum", "Mix"];

const sampleNotes: NoteInput[] = [
  {
    content: "Initial discovery call. Client is interested in retirement planning and child education funding.",
    source: "call",
    tags: ["discovery", "goals"],
  },
  {
    content: "Met at office. Discussed current portfolio allocation. Client seems risk-averse after 2020 market volatility.",
    source: "meeting",
    tags: ["portfolio", "risk"],
  },
  {
    content: "Follow-up call regarding SIP options. Client prefers monthly investments of 50k-1L range.",
    source: "call",
    tags: ["sip", "investment"],
  },
  {
    content: "Client mentioned upcoming ESOP vesting in Q2. Potential lump sum investment opportunity.",
    source: "whatsapp",
    tags: ["liquidity", "esop"],
  },
  {
    content: "Discussed tax-saving options before year-end. Client interested in ELSS funds.",
    source: "meeting",
    tags: ["tax", "elss"],
  },
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `+91${Math.floor(9000000000 + Math.random() * 999999999)}`;
}

function randomEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com"];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function randomDate(yearsBack: number): Date {
  const now = new Date();
  const past = new Date(now.getFullYear() - yearsBack, 0, 1);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function randomDob(): Date {
  // Generate DOB for ages 25-65
  const now = new Date();
  const minAge = 25;
  const maxAge = 65;
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
  return new Date(now.getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
}

// Completeness levels determine how many fields are populated
type CompletenessLevel = "minimal" | "basic" | "moderate" | "detailed" | "complete";

function generateCustomer(index: number): { customer: NewCustomer; completeness: CompletenessLevel; noteCount: number } {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const fullName = `${firstName} ${lastName}`;

  // Distribute completeness levels
  const completenessLevels: CompletenessLevel[] = [
    "minimal", "minimal", "minimal", "minimal",  // 4 minimal
    "basic", "basic", "basic", "basic",          // 4 basic
    "moderate", "moderate", "moderate", "moderate", // 4 moderate
    "detailed", "detailed", "detailed", "detailed",  // 4 detailed
    "complete", "complete", "complete", "complete",  // 4 complete
  ];
  const completeness = completenessLevels[index];

  // Base customer - minimal fields only
  const customer: NewCustomer = {
    fullName,
  };

  // Add fields based on completeness level
  if (completeness === "minimal") {
    // Just the name, maybe email
    if (Math.random() > 0.5) {
      customer.emailPrimary = randomEmail(firstName, lastName);
    }
    return { customer, completeness, noteCount: 0 };
  }

  // Basic: Identity + Contact
  customer.emailPrimary = randomEmail(firstName, lastName);
  customer.primaryMobile = randomPhone();
  customer.cityOfResidence = randomElement(cities);
  customer.countryOfResidence = "India";
  customer.preferredChannel = randomElement(channels);

  if (completeness === "basic") {
    return { customer, completeness, noteCount: 1 };
  }

  // Moderate: + Professional + Income
  customer.dob = randomDob();
  customer.gender = randomElement(["Male", "Female"]);
  customer.maritalStatus = randomElement(["Single", "Married"]);
  customer.occupationType = randomElement(occupationTypes);
  customer.industry = randomElement(industries);
  customer.incomeBandAnnual = randomElement(incomeBands);
  customer.incomeStability = randomElement(["Stable", "Variable"]);
  customer.residenceStatus = "Resident";

  if (completeness === "moderate") {
    return { customer, completeness, noteCount: 2 };
  }

  // Detailed: + Goals + Preferences
  customer.dependentsCount = Math.floor(Math.random() * 4);
  customer.householdStructure = randomElement(["Nuclear", "Joint family"]);
  customer.goalsSummary = `Primary focus on ${randomElement(goalTypes).toLowerCase()}`;
  customer.primaryGoalType = randomElement(goalTypes);
  customer.primaryGoalHorizon = randomElement(goalHorizons);
  customer.investmentStylePreference = randomElement(investmentStyles);
  customer.liquidityPreference = randomElement(["High liquidity", "Balanced", "Can lock-in"]);
  customer.taxSensitivity = randomElement(["Low", "Medium", "High"]);
  customer.expenseBandMonthly = randomElement(["<50k", "50k-1L", "1-2L", "2-5L"]);
  customer.emergencyBufferStatus = randomElement(["<3 months", "3-6 months", "6-12 months"]);

  if (completeness === "detailed") {
    return { customer, completeness, noteCount: 3 };
  }

  // Complete: All sections populated
  customer.jobTitle = randomElement(["Manager", "Director", "VP", "Consultant", "Founder", "Partner"]);
  customer.employerBusinessName = randomElement(["TCS", "Infosys", "Wipro", "HDFC", "Reliance", "Own Business"]);
  customer.incomeSourcesPrimary = randomElement(["Salary", "Business", "Rent"]);
  customer.surplusInvestableBand = randomElement(["25k-50k", "50k-1L", "1-3L", "3L+"]);
  customer.liabilitiesPresence = randomElement(["None", "Home loan", "Personal loan"]);
  customer.riskBucket = randomElement(riskBuckets);
  customer.riskQuestionnaireCompleted = true;
  customer.riskQuestionnaireVersion = "v1.0";
  customer.financialLiteracyLevel = randomElement(["Low", "Medium", "High"]);
  customer.decisionStyle = randomElement(["Data-heavy", "Balanced", "Simple summary"]);
  customer.decisionSpeed = randomElement(["Fast", "Medium", "Slow"]);
  customer.assetClassPreference = [randomElement(["Equity", "Debt"]), randomElement(["Gold", "International"])];
  customer.productPreference = [randomElement(["Mutual Funds", "PMS"]), randomElement(["Direct Equity", "FDs/Bonds"])];
  customer.kycStage = randomElement(["Completed", "In progress"]);
  customer.panSharedStatus = randomElement(["Yes", "No", "Will share later"]);
  customer.advisoryTouchFrequency = randomElement(["Monthly", "Quarterly"]);
  customer.contentFormatPreference = randomElement(["Short text", "Charts", "Data-heavy"]);
  customer.lastMeetingDate = randomDate(1);
  customer.nextFollowUpDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  customer.nextFollowUpAgenda = randomElement([
    "Discuss Q4 investment plan",
    "Review portfolio performance",
    "Complete KYC documentation",
    "Discuss tax-saving options",
  ]);

  return { customer, completeness, noteCount: 4 };
}

async function seed() {
  console.log("Seeding 20 customers with varying completeness levels...\n");

  const results = {
    minimal: 0,
    basic: 0,
    moderate: 0,
    detailed: 0,
    complete: 0,
  };

  for (let i = 0; i < 20; i++) {
    const { customer: customerData, completeness, noteCount } = generateCustomer(i);

    try {
      const customer = await crmRepository.createCustomer(customerData);
      results[completeness]++;

      // Add notes based on completeness (with staggered timestamps)
      for (let j = 0; j < noteCount; j++) {
        const note = sampleNotes[j % sampleNotes.length];
        // Stagger notes: first note is oldest (weeks ago), later notes are more recent
        const daysAgo = (noteCount - j) * 7 + Math.floor(Math.random() * 5);
        const hoursOffset = Math.floor(Math.random() * 8) + 9; // 9am-5pm
        const minutesOffset = Math.floor(Math.random() * 60);
        const noteDate = new Date();
        noteDate.setDate(noteDate.getDate() - daysAgo);
        noteDate.setHours(hoursOffset, minutesOffset, 0, 0);
        await crmRepository.addNote(customer.id, { ...note, createdAt: noteDate });
      }

      const fieldCount = Object.keys(customerData).filter(k => customerData[k as keyof typeof customerData] !== undefined).length;
      console.log(`✓ Created: ${customer.fullName} (${completeness}, ${fieldCount} fields, ${noteCount} notes)`);
    } catch (error) {
      console.error(`✗ Failed to create customer ${i + 1}:`, error);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Minimal (1-2 fields):   ${results.minimal} customers`);
  console.log(`Basic (5-6 fields):     ${results.basic} customers`);
  console.log(`Moderate (15+ fields):  ${results.moderate} customers`);
  console.log(`Detailed (25+ fields):  ${results.detailed} customers`);
  console.log(`Complete (35+ fields):  ${results.complete} customers`);
  console.log("\nSeeding complete!");
}

seed().catch(console.error);
