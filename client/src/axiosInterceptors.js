import axios from "axios";
import { useAuth } from "./context/auth";

axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      const [auth, setAuth] = useAuth();
  
      if (error.response.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
  
        // Log previous access token
        console.log("Previous Access Token: ", auth.token);
  
        const res = await axios.post(
          "https://denapaona-com-webapp-server.vercel.app/api/v1/auth/refresh-token",
          { refreshToken: auth.refreshToken }
        );
  
        if (res.data.success) {
          // Log the new tokens
          console.log("New Access Token: ", res.data.accessToken);
          console.log("New Refresh Token: ", res.data.refreshToken);
  
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
  
          // Retry the original request with the new token
          axios.defaults.headers.common["Authorization"] = res.data.accessToken;
          originalRequest.headers["Authorization"] = res.data.accessToken;
          return axios(originalRequest);
        }
      }
  
      return Promise.reject(error);
    }
  );
  
