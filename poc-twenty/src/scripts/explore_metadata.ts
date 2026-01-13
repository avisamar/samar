import { apiClient } from '../apiClient';

async function explore() {
  try {
    const { data } = await apiClient.get('metadata/objects');
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
}

explore();

