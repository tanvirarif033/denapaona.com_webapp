import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { SearchProvider } from "./context/search";
import { CartProvider } from "./context/cart";
import { NotificationsProvider } from "./context/notifications";
import "antd/dist/reset.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID} locale="en">
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NotificationsProvider>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

reportWebVitals();
