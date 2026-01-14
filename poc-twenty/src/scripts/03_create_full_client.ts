import { apiClient } from '../apiClient';

async function main() {
  console.log('Starting Phase 3: Chained Data Entry (Dr. Anita Menon)...');

  try {
    // ---------------------------------------------------------
    // Step 1: Create Person
    // ---------------------------------------------------------
    // console.log('\n--- Step 1: Creating Person (Dr. Anita Menon) ---');
    
    // Mapping Dr. Anita Menon
    // const personPayload = {
    //   name: {
    //     firstName: 'Anita',
    //     lastName: 'Menon',
    //   },
    //   emails: {
    //     primaryEmail: 'anita.menon@example.com',
    //     additionalEmails: null,
    //   },
    //   jobTitle: 'Senior Consultant Radiologist',
    //   city: 'Bangalore', // Standard field
    //   phones: {
    //     primaryPhoneNumber: '+919819056789',
    //     primaryPhoneCountryCode: 'IN',
    //   },
    //   // Custom Fields (CamelCase from CSV "Field Name")
    //   // Section A
    //   dateOfBirth: '1975-05-03T00:00:00.000Z', // 03-May-1975
    //   gender: 'FEMALE', // Dropdown: Female
    //   nationality: 'Indian', // Default/Derived
    //   // residenceStatus: 'resident', // Resident
    //   cityOfResidence: 'Bangalore',
    //   // address: 'Bangalore, Koramangala 4th Block',
    //   primaryContactNumber: '+91 98190 56789',
    //   // preferredCommunicationChannel: 'email', // Selected 'Email' from "Email + WhatsApp" (Select only allows one)
    //   // preferredTimeToContact: 'evening', // "Evenings after 6 PM" -> Evening
    //   // languagePreference: 'english',
    // };

    // let personId: string | undefined;

    // try {
    //   const { data: personResponse } = await apiClient.post('people', personPayload);
    //   const person = personResponse.data;
    //   personId = person.id;
    //   console.log(`✅ Person created: ${person.name.firstName} ${person.name.lastName} (ID: ${personId})`);
    // } catch (error: any) {
    //   console.error('❌ Failed to create Person:', JSON.stringify(error.response?.data || error.message, null, 2));
    //   return;
    // }

    // if (!personId) return;
    // console.log(personId);
    const personId = 'f8c19c41-1407-4c31-b136-6e6927a7280c';

    // ---------------------------------------------------------
    // Step 2: Create Wealth Profile
    // ---------------------------------------------------------
    // console.log('\n--- Step 2: Creating Wealth Profile ---');
    
    // const wealthPayload = {
    //   personId: personId,
      
    //   // Section C: Professional & Income
    //   // occupationType: 'professional', // "Senior Consultant Radiologist"
    //   jobTitleDesignation: 'Senior Consultant Radiologist',
    //   // annualIncomeCtcNet: '60-75 lakhs', // Text field in CSV (Numeric Range)
    //   monthlySurplusAfterExpenses: 200000, // Numeric
    //   monthlySalaryDraw: 0, // Not specified, but implied in surplus/income
    //   // primarySourceOfWealth: 'salary', // Best fit for "Medical practice" from options (Salary|Business Sale|Inheritance|ESOP|Property Sale|Trading)
    //   secondaryWealthSources: 'Rental income', // Free text
      
    //   // Section D: Wealth Sources
    //   // liquidityPattern: 'monthly', // implied
    //   recentUpcomingLiquidityEvents: 'Clinic expansion sale expected next year',

    //   // Section E: Financial Profile
    //   // monthlyHouseholdExpenses: ... (derived from surplus if needed, but not provided explicitly)
      
    //   // Section F: Liabilities
    //   existingLoanObligations: 'Small car loan',
      
    //   // Section H: Holdings (Derived/Declared)
    //   // mutualFundsCurrentValue: ... (Can't set derived fields easily if they are computed, but we can set declared text)
    //   mutualFundsDetail: '55% of Portfolio',
    //   directEquityDetail: '25% of Portfolio',
    //   // debtHoldingsBondsFdsEtc: 0, // 10% mentioned
    //   goldDigitalGold: 0, // 5% mentioned
      
    //   // Section L: Investment Preferences
    //   ticketSizeComfortLump: 1500000, // "10-20 lakhs" -> Avg 15L
    //   // ticketSizeComfortSip: 50000, // "50,000+"
    //   // preferredAssetClasses: ['equity', 'debt', 'gold', 'international'], // Multi-select
    //   lockInPreference: true, // "Avoid high lock-in products" -> Yes (Avoid?) or No? "Lock-in Preference: Avoid lock-in products?" -> Yes.
    //   liquidityNeeds: 'Clinic expansion next year',
    // };

    // try {
    //   // Try 'wealthProfiles' first (plural)
    //   const { data: wealthResponse } = await apiClient.post('wealthProfiles', wealthPayload);
    //   const wealthProfile = wealthResponse.data;
    //   console.log(`✅ Wealth Profile created (ID: ${wealthProfile.id})`);
    // } catch (error: any) {
    //   // Fallback or detailed error
    //   console.error('❌ Failed to create Wealth Profile:', JSON.stringify(error.response?.data || error.message, null, 2));
    // }


    // // ---------------------------------------------------------
    // // Step 3: Create Risk Profile
    // // ---------------------------------------------------------
    console.log('\n--- Step 3: Creating Risk Profile ---');
    
    const riskPayload = {
      personId: personId,
      name: 'Dr. Anita Menon',

      // Section G: Experience
      // experienceLevel: 'experienced',
      // comfortWithEquity: 'high', // Implied by 25% Equity + 55% MF (mostly equity presumably)
      // comfortWithDebt: 'medium',
      pastAdvisorsUsed: true,
      reasonsForSwitchingAdvisors: 'Poor responsiveness',

      // Section J: Risk Psychology
      riskToleranceScale110: 7, // "7/10"
      // riskCapacity: 'high', // "High"
      // reactionToMarketDips: 'seekClarity', // "Usually holds but seeks clarification"
      // recencyBiasLevel: 'high', // "High recency bias"
      lossAversionScore: 3, // "Mild" -> 3/10 estimate
      
      // Section K: Goals
      // goal1Description: 'Daughter’s US education',
      // goal1TimelineYears: 5,
      // goal2Description: 'Early retirement',
      // goal2TimelineYears: 10,
      // goal3Description: 'Real estate diversification',
      // goal3TimelineYears: 3,
      
      // Section M: Suitability
      taxBracket: 30, // "30% + surcharge"
      taxOptimisationPreferences: 'Prefers index funds, aware of taxation',
      
      // Section N: Lifestyle
      // contentFormatPreference: 'charts', // "Charts + data-heavy long notes" -> Maps to 'Charts' or 'Data-Heavy' or 'Short Text'? Options: Short Text|Charts|Data-Heavy|Video Explainers. I'll pick 'Charts'.
      // primaryInterests: 'Medicine, travel, fitness',
    };

    try {
      const { data: riskResponse } = await apiClient.post('riskProfiles', riskPayload);
      const riskProfile = riskResponse.data;
      console.log(`✅ Risk Profile created (ID: ${riskProfile.id})`);
    } catch (error: any) {
      console.error('❌ Failed to create Risk Profile:', JSON.stringify(error.response?.data || error.message, null, 2));
    }

    console.log('\n✅ Phase 3 Complete (Dr. Anita Menon).');

  } catch (error: any) {
    console.error('❌ Script failed:', error.response?.data || error.message);
  }
}

main();
