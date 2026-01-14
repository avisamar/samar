import { apiClient } from '../apiClient';

async function main() {
  console.log('Starting Phase 3.5: Update & Validate Data (Dr. Anita Menon)...');

  try {
    // ---------------------------------------------------------
    // Step 1: Retrieve Target Person
    // ---------------------------------------------------------
    console.log('\n--- Step 1: Retrieving Person ---');
    // NOTE: Filter syntax might vary based on the specific Twenty API version or setup.
    // Standard: ?filter[emails][primaryEmail][eq]=... or similar.
    // Let's try to search or filter.
    
    let personId: string | undefined;

    try {
        // Trying a filter that matches the structure.
        // If "emails" is an object with "primaryEmail", we might need a nested filter or JSON filter.
        // Commonly: filter[emails][primaryEmail][eq]=value
        const { data: searchResponse } = await apiClient.get('people', {
            params: {
                // 'filter[emails][primaryEmail][eq]': 'anita.menon@example.com' // Ideal
                // 'filter[emails][primaryEmail][ilike]': 'anita.menon@example.com'
                // For simplicity, let's fetch list and find if filter is tricky, 
                // but standard Twenty uses standard filter syntax.
                'filter': 'emails.primaryEmail[eq]:anita.menon@example.com'
            }
        });
        
        const people = searchResponse.data?.people || [];
        const person = people.find((p: any) => p.emails?.primaryEmail === 'anita.menon@example.com');
        
        if (person) {
            personId = person.id;
            console.log(`✅ Found Person: ${person.name.firstName} ${person.name.lastName} (ID: ${personId})`);
            console.log(`   Current City: ${person.city}`);
        } else {
             console.error('❌ Person not found via filter. Checking without filter...');
             // Fallback: Fetch latest few
             const { data: listResponse } = await apiClient.get('people', { params: { limit: 20 } });
             const found = listResponse.data?.people?.find((p: any) => p.emails?.primaryEmail === 'anita.menon@example.com');
             if (found) {
                 personId = found.id;
                 console.log(`✅ Found Person (fallback): ${found.name.firstName} ${found.name.lastName} (ID: ${personId})`);
             }
        }
    } catch (error: any) {
        console.error('❌ Failed to search Person:', error.response?.data || error.message);
        return;
    }

    if (!personId) {
        console.error('❌ Could not find Dr. Anita Menon. Ensure Phase 3 was run.');
        return;
    }

    // ---------------------------------------------------------
    // Step 2: Update Person Record
    // ---------------------------------------------------------
    console.log('\n--- Step 2: Updating Person (City -> Pune) ---');
    try {
        const updatePayload = {
            city: 'Noida'
        };
        const { data: updateResponse } = await apiClient.patch(`people/${personId}`, updatePayload);
        const updatedPerson = updateResponse.data;
        console.log(`✅ Updated Person City: ${updatedPerson.city}`);
        if (updatedPerson.city !== 'Pune') console.warn('⚠️ Update might not have persisted correctly.');
    } catch (error: any) {
        console.error('❌ Failed to update Person:', error.response?.data || error.message);
    }

    // // ---------------------------------------------------------
    // // Step 3: Update Wealth Profile
    // // ---------------------------------------------------------
    // console.log('\n--- Step 3: Updating Wealth Profile (Surplus -> 250000) ---');
    // try {
    //     // Find the profile first
    //     const { data: wealthSearch } = await apiClient.get('wealthProfiles', {
    //         params: {
    //             'filter': `personId[eq]:${personId}`
    //         }
    //     });
        
    //     const wealthProfiles = wealthSearch.data?.wealthProfiles || [];
    //     const profile = wealthProfiles[0];

    //     if (!profile) {
    //         console.error('❌ Wealth Profile not found for this person.');
    //     } else {
    //          console.log(`   Found Wealth Profile ID: ${profile.id}`);
    //          console.log(`   Old Surplus: ${profile.monthlySurplusAfterExpenses}`);

    //          const wealthUpdate = {
    //              monthlySurplusAfterExpenses: 350000
    //          };
             
    //          const { data: wealthUpdateResponse } = await apiClient.patch(`wealthProfiles/${profile.id}`, wealthUpdate);
    //          const updatedWealth = wealthUpdateResponse.data;
    //          console.log(`✅ Updated Wealth Profile Surplus: ${updatedWealth.monthlySurplusAfterExpenses}`);
    //     }
    // } catch (error: any) {
    //      console.error('❌ Failed to update Wealth Profile:', error.response?.data || error.message);
    // }

    // // ---------------------------------------------------------
    // // Step 4: Update Risk Profile
    // // ---------------------------------------------------------
    // console.log('\n--- Step 4: Updating Risk Profile (Risk Tolerance -> 8) ---');
    // try {
    //     const { data: riskSearch } = await apiClient.get('riskProfiles', {
    //         params: {
    //             'filter': `personId[eq]:${personId}`
    //         }
    //     });
        
    //     const riskProfiles = riskSearch.data?.riskProfiles || [];
    //     const profile = riskProfiles[0];

    //     if (!profile) {
    //         console.error('❌ Risk Profile not found for this person.');
    //     } else {
    //          console.log(`   Found Risk Profile ID: ${profile.id}`);
    //          console.log(`   Old Risk Tolerance: ${profile.riskToleranceScale110}`);

    //          const riskUpdate = {
    //              riskToleranceScale110: 8
    //          };
             
    //          const { data: riskUpdateResponse } = await apiClient.patch(`riskProfiles/${profile.id}`, riskUpdate);
    //          const updatedRisk = riskUpdateResponse.data;
    //          console.log(`✅ Updated Risk Profile Tolerance: ${updatedRisk.riskToleranceScale110}`);
    //     }
    // } catch (error: any) {
    //      console.error('❌ Failed to update Risk Profile:', error.response?.data || error.message);
    // }

    // console.log('\n✅ Phase 3.5 Complete.');

  } catch (error: any) {
    console.error('❌ Script failed:', error.response?.data || error.message);
  }
}

main();
