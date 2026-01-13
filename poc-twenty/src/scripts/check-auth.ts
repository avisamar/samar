import { apiClient } from '../apiClient';

async function checkAuth() {
  try {
    console.log('Verifying connection to Twenty CRM...');
    // Log the baseURL (partial) to debug
    console.log('Base URL:', apiClient.defaults.baseURL);

    // Try a different endpoint that is mentioned in the plan
    const endpoint = '/people'; 
    console.log(`Requesting ${endpoint}...`);
    
    const response = await apiClient.get(endpoint, {
      params: { limit: 1 }
    });
    console.log('✅ Connection Successful!');
    console.log('Status:', response.status);
    console.log('Data sample:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Connection Failed.');
    if (error.config) {
        console.log(`Url attempted: ${error.config.baseURL}${error.config.url}`);
    }
    // Error details are already logged by the interceptor
  }
}

checkAuth();
