import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/Register.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [answer, setAnswer] = useState("");
  const navigate = useNavigate();

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/auth/register",
        {
          name,
          email,
          password,
          phone,
          address,
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
    <Layout title="Register - Ecommer App">
      <div className="register-container">
        <div className="register-card">
          <div className="register-logo">
            <span className="register-logo-text">Denapoana</span>
          </div>
          <h1 className="register-title">Create Account</h1>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="name" className="form-label">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  id="name"
                  placeholder="First and last name"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  id="email"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  id="password"
                  placeholder="At least 6 characters"
                  required
                />
                <div className="form-note">Passwords must be at least 6 characters.</div>
              </div>
              
              <div className="form-group half-width">
                <label htmlFor="phone" className="form-label">Mobile number</label>
                <input
                  type="number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  id="phone"
                  placeholder="1234567890"
                  required
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="address" className="form-label">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-textarea"
                id="address"
                placeholder="Enter your complete address"
                rows="2"
                required
              />
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="answer" className="form-label">Security Question</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="form-input"
                id="answer"
                placeholder="What is your favorite book?"
                required
              />
              <div className="form-note">This helps verify your identity if you forget your password.</div>
            </div>
            
            <button type="submit" className="register-button">
              Create your Denapoana account
            </button>
          </form>
          
          <div className="register-terms">
            <p>By creating an account, you agree to Denapoana's <a href="/conditions">Conditions of Use</a> and <a href="/privacy">Privacy Notice</a>.</p>
          </div>
          
          <div className="register-divider">
            <span>Already have an account?</span>
          </div>
          
          <button 
            className="login-redirect-button"
            onClick={() => navigate("/login")}
          >
            Sign in to your account
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Register;