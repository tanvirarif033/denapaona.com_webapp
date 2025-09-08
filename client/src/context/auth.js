// src/context/auth.js
import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API || "http://localhost:8080";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, token: "" });

  // Keep Authorization header synced
  useEffect(() => {
    if (auth?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [auth?.token]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAuth({ user: parsed.user || null, token: parsed.token || "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      const email = auth?.user?.email;
      // clear client state immediately
      setAuth({ user: null, token: "" });
      localStorage.removeItem("auth");
      if (email) localStorage.removeItem(`cart-${email}`);
      // clear axios header
      delete axios.defaults.headers.common["Authorization"];
      // inform server (optional)
      await axios.post("/api/v1/auth/logout");
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={[auth, setAuth, logout]}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { useAuth, AuthProvider };
