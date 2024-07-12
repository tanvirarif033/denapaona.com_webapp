import axios from "axios";

export const refreshToken = async (refreshToken) => {
  try {
    const res = await axios.post("https://denapaona-com-webapp-server.vercel.app/api/v1/auth/refresh-token", { refreshToken });
    if (res.data.success) {
      return res.data.accessToken;
    }
  } catch (error) {
    console.log("Error refreshing token:", error);
  }
};
