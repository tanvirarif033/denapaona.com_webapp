import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import UsersMenu from "../../components/Layout/UsersMenu";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";
import "../../styles/Profile.css";

const Profile = () => {
  //context
  const [auth, setAuth] = useAuth();
  //state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  //get user data
  useEffect(() => {
    const { email, name, phone, address } = auth?.user;
    setName(name);
    setPhone(phone);
    setEmail(email);
    setAddress(address);
  }, [auth?.user]);

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.put(
        "http://localhost:8080/api/v1/auth/profile",
        {
          name,
          email,
          password,
          phone,
          address,
        }
      );
      if (data?.error) {
        toast.error(data.error);
      } else {
        setAuth({ ...auth, user: data.updatedUser });
        let ls = localStorage.getItem("auth");
        ls = JSON.parse(ls);
        ls.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(ls));
        toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title={"Your Profile"}>
      <div className="amazon-profile-container">
        <div className="amazon-profile-content">
          <div className="amazon-profile-sidebar">
            <UsersMenu />
          </div>
          
          <div className="amazon-profile-main">
            <div className="amazon-profile-card">
              <div className="amazon-card-header">
                <h2>Your Account</h2>
                <p>Manage your profile information</p>
              </div>
              
              <form onSubmit={handleSubmit} className="amazon-profile-form">
                <div className="amazon-form-section">
                  <h3>Login & Security</h3>
                  <div className="amazon-form-row">
                    <div className="amazon-form-group medium-width">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="amazon-form-input"
                        id="name"
                        placeholder="Enter your full name"
                        autoFocus
                      />
                    </div>
                    
                    <div className="amazon-form-group medium-width">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="amazon-form-input"
                        id="email"
                        placeholder="Enter your email address"
                        disabled
                      />
                      <div className="amazon-input-note">Email cannot be changed</div>
                    </div>
                  </div>
                  
                  <div className="amazon-form-row">
                    <div className="amazon-form-group medium-width">
                      <label htmlFor="phone">Mobile Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="amazon-form-input"
                        id="phone"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div className="amazon-form-group medium-width">
                      <label htmlFor="password">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="amazon-form-input"
                        id="password"
                        placeholder="Enter new password"
                      />
                      <div className="amazon-input-note">Leave blank to keep current password</div>
                    </div>
                  </div>
                </div>
                
                <div className="amazon-form-section">
                  <h3>Address Information</h3>
                  <div className="amazon-form-group full-width">
                    <label htmlFor="address">Shipping Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="amazon-form-textarea"
                      id="address"
                      placeholder="Enter your complete address"
                      rows="2"
                    />
                  </div>
                </div>
                
                <div className="amazon-form-actions">
                  <button 
                    type="submit" 
                    className="amazon-save-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;