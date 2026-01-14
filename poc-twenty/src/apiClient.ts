import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.TWENTY_API_URL || 'http://localhost:3000/rest/';
const token = process.env.TWENTY_API_TOKEN;

if (!token) {
  console.warn('Warning: TWENTY_API_TOKEN is not set in environment variables.');
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error('Error 401: Unauthorized. Check your API token.');
      } else if (status === 403) {
        console.error('Error 403: Forbidden. You do not have access to this resource.');
      } else if (status === 429) {
        console.error('Error 429: Too Many Requests. Rate limit exceeded.');
      } else {
        console.error(`Error ${status}:`, error.response.data);
      }
    } else {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);
