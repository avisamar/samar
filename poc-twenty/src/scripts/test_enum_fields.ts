import { apiClient } from '../apiClient';

/**
 * Test script to debug SELECT/enum field creation
 *
 * Per API docs, option values must match pattern: ^[A-Z0-9]+_[A-Z0-9]+$
 * Example: "OPTION_1", "MALE_GENDER", "AGE_25_34"
 */

async function main() {
  console.log('Fetching person object ID...');

  let personObjectId: string | undefined;

  try {
    const { data: metaData } = await apiClient.get('metadata/objects');
    const personObj = metaData.data.objects.find((obj: any) => obj.nameSingular === 'person');
    if (personObj) {
      personObjectId = personObj.id;
      console.log(`Found person object ID: ${personObjectId}`);
    } else {
      console.error('Person object not found');
      return;
    }
  } catch (error: any) {
    console.error('Failed to fetch objects:', error.response?.data || error.message);
    return;
  }

  // Test field 1: Gender (SELECT)
  // Values must be UPPERCASE with at least one underscore: ^[A-Z0-9]+_[A-Z0-9]+$
  const genderPayload = {
    name: 'gender',
    label: 'Gender',
    type: 'SELECT',
    objectMetadataId: personObjectId,
    description: 'Gender of the person',
    isNullable: true,
    options: [
      { label: 'Male', value: 'GENDER_MALE', position: 0, color: 'blue' },
      { label: 'Female', value: 'GENDER_FEMALE', position: 1, color: 'green' },
      { label: 'Non-binary', value: 'GENDER_NONBINARY', position: 2, color: 'yellow' },
      { label: 'Prefer not to say', value: 'GENDER_PREFERNOTTOSAY', position: 3, color: 'orange' },
      { label: 'Other', value: 'GENDER_OTHER', position: 4, color: 'red' },
    ]
  };

  console.log('\n=== Gender Field Request ===');
  console.log(JSON.stringify(genderPayload, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', genderPayload);
    console.log('\n=== Gender Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Gender Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test field 2: Age Band (SELECT)
  const ageBandPayload = {
    name: 'ageBand',
    label: 'Age Band',
    type: 'SELECT',
    objectMetadataId: personObjectId,
    description: 'Age band of the person',
    isNullable: true,
    options: [
      { label: 'Under 25', value: 'AGE_UNDER25', position: 0, color: 'blue' },
      { label: '25-34', value: 'AGE_25TO34', position: 1, color: 'green' },
      { label: '35-44', value: 'AGE_35TO44', position: 2, color: 'yellow' },
      { label: '45-54', value: 'AGE_45TO54', position: 3, color: 'orange' },
      { label: '55-64', value: 'AGE_55TO64', position: 4, color: 'red' },
      { label: '65+', value: 'AGE_65PLUS', position: 5, color: 'purple' },
      { label: 'Other', value: 'AGE_OTHER', position: 6, color: 'gray' },
    ]
  };

  console.log('\n=== Age Band Field Request ===');
  console.log(JSON.stringify(ageBandPayload, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', ageBandPayload);
    console.log('\n=== Age Band Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Age Band Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

main();
