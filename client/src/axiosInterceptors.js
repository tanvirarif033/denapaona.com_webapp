import axios from 'axios';
import refreshToken from './refreshToken'; // Import the function from above

// Create an Axios instance
const api = axios.create({
  baseURL: '/api', // Your API base URL
});

// Axios interceptor to handle token refresh on 403 response
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // If the access token has expired (403) and we haven't retried yet
    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newAccessToken = await refreshToken(); // Get a new access token

      if (newAccessToken) {
        // Update the authorization header with the new token
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return api(originalRequest);
      }
    }
    
    // If the error is not due to token expiry or retry failed, reject
    return Promise.reject(error);
  }
);

export default api;
