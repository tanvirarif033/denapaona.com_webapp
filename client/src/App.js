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
import Orders from "./pages/user/Orders";
import Profile from "./pages/user/Profile";
import Products from "./pages/Admin/Products";
import UpdateProduct from "./pages/Admin/UpdateProduct";
import Search from "./pages/Search";
import Categories from "./pages/Categories";
import CategoryProduct from "./pages/CategoryProduct";
import ProductDetails from "./pages/ProductDetails";
import CartPage from "./pages/CartPage";
import AdminOrders from "./pages/Admin/AdminOrders";

// ➕ NEW: Chat admin & Sales analytics
import ChatAdmin from "./pages/Admin/ChatAdmin";
import SalesAnalytics from "./pages/Admin/SalesAnalytics";

// ➕ NEW: provide auth to ChatAdmin for Authorization header
import { useAuth } from "./context/auth";

function App() {
  const [auth] = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryProduct />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/product/:slug" element={<ProductDetails />} />

        <Route path="/search" element={<Search />} />

        {/* User dashboard (protected) */}
        <Route path="/dashboard" element={<PrivateRoute />}>
          <Route path="user" element={<Dashboard />} />
          <Route path="user/orders" element={<Orders />} />
          <Route path="user/profile" element={<Profile />} />
        </Route>

        {/* Admin dashboard (protected) */}
        <Route path="/dashboard" element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/create-category" element={<CreateCategory />} />
          <Route path="admin/create-product" element={<CreateProduct />} />
          <Route path="admin/product/:slug" element={<UpdateProduct />} />
          <Route path="admin/products" element={<Products />} />
          <Route path="admin/users" element={<Users />} />
          <Route path="admin/orders" element={<AdminOrders />} />
          {/* ➕ NEW routes */}
          <Route path="admin/chat" element={<ChatAdmin auth={auth} />} />
          <Route path="admin/analytics" element={<SalesAnalytics />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* (kept from your previous file even though it duplicates /dashboard root) */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="*" element={<Pagenotfound />} />
      </Routes>
    </>
  );
}

export default App;
