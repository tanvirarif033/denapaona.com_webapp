import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: "",
  });

  // Set default axios headers
  axios.defaults.headers.common["Authorization"] = auth?.token;

  useEffect(() => {
    const data = localStorage.getItem("auth");
    if (data) {
      const parseData = JSON.parse(data);
      setAuth({
        ...auth,
        user: parseData.user,
        token: parseData.token,
      });
    }
    //eslint-disable-next-line
  }, []);

  const logout = async() => {
    setAuth({ user: null, token: "" });
  localStorage.removeItem("auth");
  await axios.post("https://denapaona-com-webapp-server.vercel.app/api/v1/auth/logout");

    // Remove the cart associated with the logged-in user
    if (auth?.user?.email) {
      localStorage.removeItem(`cart-${auth.user.email}`);
    }
  };

  return (
    <AuthContext.Provider value={[auth, setAuth, logout]}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };
