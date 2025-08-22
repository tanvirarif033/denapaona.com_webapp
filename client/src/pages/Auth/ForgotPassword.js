import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const ForgotPasssword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [answer, setAnswer] = useState("");

  const navigate = useNavigate();

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/auth/forgot-password",
        {
          email,
          newPassword,
          answer,
        }
      );
      if (res && res.data.success) {
        toast.success(res.data && res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Forgot Password - Ecommerce APP"}>
      <div className="amazon-auth-container">
        <div className="amazon-auth-card">
          <div className="amazon-auth-logo">
            <span className="amazon-logo-text">Denapoana</span>
          </div>
          <h1 className="amazon-auth-title">Password Assistance</h1>
          <p className="amazon-auth-subtitle">Enter the email address associated with your Denapoana account.</p>
          
          <form onSubmit={handleSubmit} className="amazon-auth-form">
            <div className="amazon-form-group">
              <label htmlFor="email" className="amazon-form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="amazon-form-input"
                id="email"
                required
              />
            </div>
            <div className="amazon-form-group">
              <label htmlFor="answer" className="amazon-form-label">What is your favorite book?</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="amazon-form-input"
                id="answer"
                placeholder="Enter the name of your favorite book"
                required
              />
            </div>
            <div className="amazon-form-group">
              <label htmlFor="newPassword" className="amazon-form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="amazon-form-input"
                id="newPassword"
                required
              />
            </div>
            <button type="submit" className="amazon-auth-button">
              Continue
            </button>
          </form>
          
          <div className="amazon-auth-divider"></div>
          
          <div className="amazon-auth-secondary-actions">
            <h3>Has your email address changed?</h3>
            <p>If you no longer use the email address associated with your Denapoana account, you may contact <a href="/help">Customer Service</a> for help restoring access to your account.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasssword;