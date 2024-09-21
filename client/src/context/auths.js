import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from './auth'; // Use the hook from the context
import axios from 'axios';
import {jwtDecode} from 'jwt-decode'; // Ensure jwt-decode is correctly imported

const useAuthToken = () => {
  const [auth, setAuth] = useAuth();
  const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
    const refreshAccessToken = async () => {
      try {
        const response = await axios.get('/refresh-token');
        if (response.status === 200) {
          const { accessToken } = response.data;
          const parsedData = JSON.parse(localStorage.getItem('auth'));
          setAuth({ ...parsedData, token: accessToken });
          localStorage.setItem(
            'auth',
            JSON.stringify({
              ...parsedData,
              token: accessToken,
            })
          );
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);

        // If we get 401 (Unauthorized) or 403 (Forbidden), we force logout
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Clear auth state and localStorage, forcing user to log out
          setAuth({ user: null, token: null });
          localStorage.removeItem('auth');
          toast.error('Session expired. Please log in again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check if token exists and if it's expired
    if (auth.token && !isTokenExpired(auth.token)) {
      setIsLoading(false);
    } else if (auth.token) {
      refreshAccessToken();
    } else {
      setIsLoading(false);
    }
  }, [auth, setAuth]);

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now(); // Token expiration time is in milliseconds
  };

  return { auth, isLoading };
};

const PrivateRoute = ({ children }) => {
  const { auth, isLoading } = useAuthToken();

  if (isLoading) {
    // Show a loading screen or spinner while verifying token
    return <div>Loading...</div>;
  }

  if (!auth?.user || !auth?.token) {
    toast.error('You need to log in first to access this page.');
    return <Navigate to="/login" />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { auth, isLoading } = useAuthToken();

  if (isLoading) {
    // Show a loading screen or spinner while verifying token
    return <div>Loading...</div>;
  }

  if (!auth?.user || !auth?.token) {
    toast.error('You need to log in first to access this page.');
    return <Navigate to="/login" />;
  }

  if (!auth.user.isAdmin) {
    toast.error('You do not have permission to access this page.');
    return <Navigate to="/" />;
  }

  return children;
};

export { PrivateRoute, AdminRoute };