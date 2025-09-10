// src/components/Routes/Private.js
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";
import { useAuth } from "../../context/auth";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authCheck = async () => {
      try {
        // IMPORTANT: send Authorization header so /user-auth doesn’t 401
        const token = auth?.token || "";
        const headers = { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };

        const res = await axios.get("http://localhost:8080/api/v1/auth/user-auth", { headers });
        setOk(!!res?.data?.ok);
      } catch (err) {
        setOk(false);
      }
    };

    if (auth?.token) authCheck();
    else setOk(false);
  }, [auth?.token]);

  // If no token, push to login, preserving redirect
  useEffect(() => {
    if (!auth?.token) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [auth?.token, navigate, location.pathname]);

  return ok ? <Outlet /> : <Spinner />;
}
