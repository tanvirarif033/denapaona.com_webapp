import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
import "../../styles/AuthStyles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useAuth();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/auth/login",
        {
          email,
          password,
        }
      );
      if (res && res.data.success) {
        toast.success(res.data && res.data.message);
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
          refreshToken: res.data.refreshToken,
        });
        localStorage.setItem("auth", JSON.stringify(res.data));
        console.log("Previous Access Token: ", auth.token);
        console.log("Previous Refresh Token: ", auth.refreshToken);
        console.log("New Access Token: ", res.data.accessToken);
        console.log("New Refresh Token: ", res.data);
        navigate(location.state || "/");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 429) {
        toast.error(
          "Too many login attempts. Please try again after 60 seconds."
        );
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Login - Ecommer App">
      <div className="amazon-auth-container">
        <div className="amazon-auth-card">
          <div className="amazon-auth-logo">
            <span className="amazon-logo-text">Denapoana</span>
          </div>
          <h1 className="amazon-auth-title">Sign-In</h1>
          <form onSubmit={handleSubmit} className="amazon-auth-form">
            <div className="amazon-form-group">
              <label htmlFor="email" className="amazon-form-label">Email or mobile phone number</label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="amazon-form-input"
                id="email"
                required
              />
            </div>
            <div className="amazon-form-group">
              <label htmlFor="password" className="amazon-form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="amazon-form-input"
                id="password"
                required
              />
            </div>
            <button
              type="submit"
              className="amazon-auth-button"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <div className="amazon-auth-divider">
            <span>New to Denapoana?</span>
          </div>
          <button 
            className="amazon-auth-create-button"
            onClick={() => navigate("/register")}
          >
            Create your account
          </button>
          <div className="amazon-auth-links">
            <a href="/forgot-password">Forgot your password?</a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;