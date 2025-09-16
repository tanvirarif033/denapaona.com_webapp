// client/src/pages/CartPage.js
import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const API = process.env.REACT_APP_API || "http://localhost:8080";

const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---------- helpers (match server logic) ----------
  const isActiveOffer = (o) => {
    if (!o) return false;
    const now = new Date();
    const start = o.startDate ? new Date(o.startDate) : null;
    const end = o.endDate ? new Date(o.endDate) : null;
    return (
      o.isActive === true &&
      (!start || start <= now) &&
      (!end || end >= now)
    );
  };

  const effectivePrice = (p) => {
    const base = Number(p?.price || 0);
    const offers = Array.isArray(p?.offers) ? p.offers : [];
    const offer = offers.find(isActiveOffer);
    if (!offer) return base;

    const val = Number(offer.discountValue || 0);
    if (offer.discountType === "percentage") {
      return Math.max(0, base * (1 - val / 100));
    }
    if (offer.discountType === "fixed") {
      return Math.max(0, base - val);
    }
    return base; // other types (e.g., BOGO) — show base here; server will enforce real charge
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

  // ---------- load user-specific cart ----------
  useEffect(() => {
    if (auth?.user?.email) {
      const saved = localStorage.getItem(`cart-${auth.user.email}`);
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {
          setCart([]);
        }
      }
    }
    // eslint-disable-next-line
  }, [auth?.user?.email]);

  // ---------- persist cart ----------
  useEffect(() => {
    if (auth?.user?.email) {
      if (Array.isArray(cart) && cart.length > 0) {
        localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(cart));
      } else {
        localStorage.removeItem(`cart-${auth.user.email}`);
      }
    }
  }, [cart, auth?.user?.email]);

  // ---------- totals (show discounted) ----------
  const originalTotal = (cart || []).reduce((acc, it) => acc + Number(it.price || 0), 0);
  const discountedTotal = (cart || []).reduce((acc, it) => acc + effectivePrice(it), 0);
  const totalSavings = Math.max(0, originalTotal - discountedTotal);

  const removeCartItem = (pid) => {
    const next = (cart || []).filter((x) => x._id !== pid);
    setCart(next);
    if (auth?.user?.email) {
      if (next.length) localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(next));
      else localStorage.removeItem(`cart-${auth.user.email}`);
    }
  };

  // ---------- braintree token ----------
  const getToken = async () => {
    try {
      const { data } = await axios.get(`${API}/api/v1/product/braintree/token`);
      setClientToken(data?.clientToken || data?.clientToken?.clientToken || "");
    } catch (e) {
      console.log(e);
      toast.error("Failed to load payment UI");
    }
  };

  useEffect(() => {
    getToken();
  }, [auth?.token]);

  // ---------- payment ----------
  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      if (!instance) return toast.error("Payment UI not ready yet.");
      if (!auth?.token) return toast.error("Please login to continue.");
      if (!auth?.user?.address) return toast.error("Please add your address first.");
      setLoading(true);

      const { nonce } = await instance.requestPaymentMethod();

      // send id-only; server will recompute discounts securely
      const minimalCart = (cart || []).map((p) => ({ id: p._id }));

      // raw JWT (middleware supports raw or Bearer)
      const headers = { Authorization: auth?.token || "" };

      const { data } = await axios.post(
        `${API}/api/v1/product/braintree/payment`,
        { nonce, cart: minimalCart },
        { headers }
      );

      // clear cart
      if (auth?.user?.email) localStorage.removeItem(`cart-${auth.user.email}`);
      setCart([]);

      if (data?.ok) {
        if (data?.emailSent) {
          toast.success("Payment completed ✅ Confirmation email sent.");
        } else {
          toast.success(
            `Payment completed ✅ (Email could not be sent${
              data?.emailError ? `: ${data.emailError}` : ""
            })`
          );
        }
        navigate("/dashboard/user/orders");
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Payment Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user ? "Hello Guest" : `Hello  ${auth?.user?.name}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${cart.length} items in your cart ${
                      auth?.token ? "" : "please login to checkout !"
                    }`
                  : "Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>

        <div className="container ">
          <div className="row ">
            {/* items */}
            <div className="col-md-7  p-0 m-0">
              {(cart || []).map((p) => {
                const base = Number(p?.price || 0);
                const eff = effectivePrice(p);
                const hasDiscount = eff < base;
                return (
                  <div className="row mb-2 p-3 card flex-row" key={p._id}>
                    <div className="col-md-4">
                      <img
                        src={`${API}/api/v1/product/product-photo/${p._id}`}
                        className="card-img-top"
                        alt={p.name}
                        width="100%"
                        height={"130px"}
                      />
                    </div>
                    <div className="col-md-4">
                      <p className="mb-1">{p.name}</p>
                      <p className="mb-1">{(p.description || "").substring(0, 30)}</p>

                      {/* price display with discount */}
                      {hasDiscount ? (
                        <p className="mb-0">
                          <span className="text-muted text-decoration-line-through me-2">
                            {fmt(base)}
                          </span>
                          <span className="text-danger fw-semibold">{fmt(eff)}</span>
                        </p>
                      ) : (
                        <p className="mb-0">Price : {fmt(base)}</p>
                      )}
                    </div>
                    <div className="col-md-4 cart-remove-btn d-flex align-items-start justify-content-end">
                      <button className="btn btn-danger" onClick={() => removeCartItem(p._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* summary + payment */}
            <div className="col-md-5 text-center  cart-summary ">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />

              {/* totals with savings */}
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>{fmt(originalTotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount</span>
                    <span>-{fmt(totalSavings)}</span>
                  </div>
                )}
              </div>
              <h4 className="mt-2">Total : {fmt(discountedTotal)}</h4>

              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/login", { state: "/cart" })}
                    >
                      Please Login to checkout
                    </button>
                  )}
                </div>
              )}

              <div className="mt-2">
                {!clientToken || !auth?.token || !(cart || []).length ? null : (
                  <>
                    <DropIn
                      options={{ authorization: clientToken, paypal: { flow: "vault" } }}
                      onInstance={(inst) => setInstance(inst)}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
