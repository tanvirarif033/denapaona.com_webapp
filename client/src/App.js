// src/App.js
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import Pagenotfound from "./pages/Pagenotfound";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";

import Dashboard from "./pages/user/Dashboard";
import PrivateRoute from "./components/Routes/Private";
import ForgotPassword from "./pages/Auth/ForgotPassword";

import AdminRoute from "./components/Routes/AdminRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CreateCategory from "./pages/Admin/CreateCategory";
import CreateProduct from "./pages/Admin/CreateProduct";
import Users from "./pages/Admin/Users";
import AdminOrders from "./pages/Admin/AdminOrders";
import Products from "./pages/Admin/Products";
import UpdateProduct from "./pages/Admin/UpdateProduct";

import Orders from "./pages/user/Orders";
import Profile from "./pages/user/Profile";
import Search from "./pages/Search";
import Categories from "./pages/Categories";
import CategoryProduct from "./pages/CategoryProduct";
import ProductDetails from "./pages/ProductDetails";
import CartPage from "./pages/CartPage";

// ➕ NEW
import ReturnRequestForm from "./pages/user/ReturnRequestForm";
import AdminReturnRequests from "./pages/Admin/AdminReturnRequests";

// ➕ (existing extras)
import ChatAdmin from "./pages/Admin/ChatAdmin";
import SalesAnalytics from "./pages/Admin/SalesAnalytics";
import NotificationsPage from "./pages/Notifications";

// Pass auth to ChatAdmin if you need it
import { useAuth } from "./context/auth";

function App() {
  const [auth] = useAuth();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryProduct />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/search" element={<Search />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policy" element={<Policy />} />

        {/* Logged-in users */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* User dashboard (protected, nested) */}
        <Route path="/dashboard/user" element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          {/* ➕ NEW: Return Request form */}
          <Route path="returns/new/:orderId" element={<ReturnRequestForm />} />
        </Route>

        {/* Admin dashboard (protected, nested) */}
        <Route path="/dashboard/admin" element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="create-category" element={<CreateCategory />} />
          <Route path="create-product" element={<CreateProduct />} />
          <Route path="product/:slug" element={<UpdateProduct />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<Users />} />
          <Route path="orders" element={<AdminOrders />} />
          {/* existing extras */}
          <Route path="chat" element={<ChatAdmin auth={auth} />} />
          <Route path="analytics" element={<SalesAnalytics />} />
          {/* ➕ NEW: Admin sees all return requests */}
          <Route path="return-requests" element={<AdminReturnRequests />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Pagenotfound />} />
      </Routes>
    </>
  );
}

export default App;
