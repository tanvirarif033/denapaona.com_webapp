import axios from 'axios';
import toast from 'react-hot-toast';

// Function to get a new access token using the refresh token
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      toast.error('No refresh token found, please log in again.');
      return null;
    }

    const response = await axios.post('/api/refresh-token', { refreshToken });

    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Store the new tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);  // Optional, if refresh token is rotated

      return accessToken;
    } else {
      toast.error('Failed to refresh token.');
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    toast.error('Error refreshing token, please log in again.');
    return null;
  }
};

export default refreshToken;
