import { apiClient } from '../apiClient';

/**
 * Test script to debug TEXT field creation
 *
 * Testing jobTitle and majorLifeEventsNext12m fields
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

  // Test field 1: jobTitle (TEXT) - original payload
  // const jobTitlePayload = {
  //   name: 'jobTitle',
  //   label: 'Job Title / Designation',
  //   type: 'TEXT',
  //   objectMetadataId: personObjectId,
  //   description: 'Free text',
  //   isNullable: true,
  // };

  // console.log('\n=== Job Title Field Request (Original) ===');
  // console.log(JSON.stringify(jobTitlePayload, null, 2));

  // try {
  //   console.log('\nSending request...');
  //   const response = await apiClient.post('metadata/fields', jobTitlePayload);
  //   console.log('\n=== Job Title Field Response ===');
  //   console.log(JSON.stringify(response.data, null, 2));
  // } catch (error: any) {
  //   console.log('\n=== Job Title Field Error ===');
  //   console.log('Status:', error.response?.status);
  //   console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  // }

  // Test field 2: jobTitle with simplified label (no special chars)
  const jobTitlePayload2 = {
    name: 'jobTitle',
    label: 'Job Title',  // Simplified - no slash
    type: 'TEXT',
    objectMetadataId: personObjectId,
    description: 'Free text',
    isNullable: true,
  };

  console.log('\n=== Job Title Field Request (Simplified Label) ===');
  console.log(JSON.stringify(jobTitlePayload2, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', jobTitlePayload2);
    console.log('\n=== Job Title Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Job Title Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test field 3: majorLifeEventsNext12m (TEXT) - original payload
  const majorLifePayload = {
    name: 'majorLifeEventsNext12m',
    label: 'Major Life Events (Next 12m)',
    type: 'TEXT',
    objectMetadataId: personObjectId,
    description: 'marriage, birth, job change, etc.',
    isNullable: true,
  };

  console.log('\n=== Major Life Events Field Request (Original) ===');
  console.log(JSON.stringify(majorLifePayload, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', majorLifePayload);
    console.log('\n=== Major Life Events Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Major Life Events Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test field 4: majorLifeEvents with simplified label
  const majorLifePayload2 = {
    name: 'majorLifeEvents',  // Shorter name
    label: 'Major Life Events',  // No parentheses
    type: 'TEXT',
    objectMetadataId: personObjectId,
    description: 'marriage, birth, job change, etc.',
    isNullable: true,
  };

  console.log('\n=== Major Life Events Field Request (Simplified) ===');
  console.log(JSON.stringify(majorLifePayload2, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', majorLifePayload2);
    console.log('\n=== Major Life Events Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Major Life Events Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test field 5: Minimal TEXT field to verify basic TEXT works
  const minimalPayload = {
    name: 'testTextField',
    label: 'Test Text Field',
    type: 'TEXT',
    objectMetadataId: personObjectId,
  };

  console.log('\n=== Minimal TEXT Field Request ===');
  console.log(JSON.stringify(minimalPayload, null, 2));

  try {
    console.log('\nSending request...');
    const response = await apiClient.post('metadata/fields', minimalPayload);
    console.log('\n=== Minimal TEXT Field Response ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n=== Minimal TEXT Field Error ===');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

main();
