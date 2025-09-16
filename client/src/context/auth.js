// client/src/context/auth.js
import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";
import { closeSocket } from "../chat/socket";

axios.defaults.baseURL = process.env.REACT_APP_API || "http://localhost:8080";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, token: "", refreshToken: "" });

  useEffect(() => {
    if (auth?.token) {
      axios.defaults.headers.common["Authorization"] = auth.token;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [auth?.token]);

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAuth({ user: parsed.user || null, token: parsed.token || "", refreshToken: parsed.refreshToken || "" });
    }
  }, []);

  const refreshToken = async () => {
    try {
      const { data } = await axios.post("/api/v1/auth/refresh", { refreshToken: auth.refreshToken });
      const authData = {
        user: {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        },
        token: data.token,
        refreshToken: data.refreshToken || auth.refreshToken,
      };
      setAuth(authData);
      localStorage.setItem("auth", JSON.stringify(authData));
      return authData.token;
    } catch (error) {
      console.error("Token refresh error:", error.response?.data?.message || error.message);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post("/api/v1/auth/login", { email, password });
      const authData = {
        user: {
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        },
        token: data.token,
        refreshToken: data.refreshToken || "",
      };
      setAuth(authData);
      localStorage.setItem("auth", JSON.stringify(authData));
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      setAuth({ user: null, token: "", refreshToken: "" });
      localStorage.removeItem("auth");
      delete axios.defaults.headers.common["Authorization"];
      closeSocket();
      // Optional: Inform server if needed
      // await axios.post("/api/v1/auth/logout");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={[auth, setAuth, login, logout, refreshToken]}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { useAuth, AuthProvider };