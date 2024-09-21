import axios from "axios";
import { useAuth } from "./context/auth";

// Setup an Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const [auth, setAuth] = useAuth();

    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const res = await axios.post("/api/v1/auth/refresh-token", {
        refreshToken: auth.refreshToken,
      });

      if (res.data.success) {
        setAuth({
          ...auth,
          token: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
        localStorage.setItem("auth", JSON.stringify({
          ...auth,
          token: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }));

        // Update Authorization header and retry the original request
        axios.defaults.headers.common["Authorization"] = res.data.accessToken;
        originalRequest.headers["Authorization"] = res.data.accessToken;
        return axios(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
