import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

// client-side calc for display (server will recompute securely)
const calcDiscounted = (p) => {
  if (!p || !p.price) return 0;
  const offers = p?.offers || [];
  if (!offers.length) return p.price;
  const now = new Date();
  const active = offers.filter(
    (o) =>
      o?.isActive &&
      new Date(o.startDate) <= now &&
      new Date(o.endDate) >= now
  );
  if (!active.length) return p.price;
  const o = active[0];
  if (o.discountType === "percentage") return Math.max(0, p.price * (1 - (o.discountValue || 0) / 100));
  if (o.discountType === "fixed") return Math.max(0, (p.price || 0) - (o.discountValue || 0));
  return p.price;
};

const effectivePriceOf = (item) => {
  if (item?.offers?.length) return calcDiscounted(item);
  if (typeof item?.effectivePrice === "number") return item.effectivePrice;
  return item?.price || 0;
};

const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // load cart for logged user
  useEffect(() => {
    if (auth?.user) {
      const saved = localStorage.getItem(`cart-${auth.user.email}`);
      if (saved) setCart(JSON.parse(saved));
    }
  }, [auth?.user, setCart]);

  // persist on change
  useEffect(() => {
    if (auth?.user) {
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(cart || []));
    }
  }, [cart, auth?.user]);

  const totalPrice = () => {
    const total = (cart || []).reduce((sum, it) => sum + effectivePriceOf(it), 0);
    return total.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const removeCartItem = (pid) => {
    try {
      const next = (cart || []).filter((x) => x._id !== pid);
      setCart(next);
      if (auth?.user) localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(next));
    } catch (e) {
      console.log(e);
    }
  };

  const getToken = async () => {
    try {
      const { data } = await axios.get("http://localhost:8080/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (e) { console.log(e); }
  };
  useEffect(() => { getToken(); }, [auth?.token]);

const handlePayment = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const { nonce } = await instance.requestPaymentMethod();

    // ✅ send only minimal data to avoid 413
    const minimalCart = (cart || []).map((p) => ({ id: p._id }));

    await axios.post(
      "http://localhost:8080/api/v1/product/braintree/payment",
      { nonce, cart: minimalCart }
    );

    localStorage.removeItem(`cart-${auth.user.email}`);
    setCart([]);
    navigate("/dashboard/user/orders");
    toast.success("Payment Completed Successfully");
  } catch (e) {
    console.log(e);
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
                  ? `You Have ${cart.length} items in your cart ${auth?.token ? "" : "please login to checkout !"}`
                  : "Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-md-7 p-0 m-0">
              {(cart || []).map((p) => {
                const ep = effectivePriceOf(p);
                const hasOffer = typeof p.price === "number" && ep < p.price;
                return (
                  <div className="row mb-2 p-3 card flex-row" key={p._id}>
                    <div className="col-md-4">
                      <img
                        src={`http://localhost:8080/api/v1/product/product-photo/${p._id}`}
                        className="card-img-top"
                        alt={p.name}
                        width="100%"
                        height={"130px"}
                      />
                    </div>
                    <div className="col-md-4">
                      <p>{p.name}</p>
                      <p>{(p.description || "").substring(0, 30)}</p>
                      {hasOffer ? (
                        <p>
                          Price : <b>${ep.toFixed(2)}</b>{" "}
                          <span style={{ textDecoration: "line-through", opacity: 0.6, marginLeft: 6 }}>
                            ${p.price}
                          </span>
                        </p>
                      ) : (
                        <p>Price : ${p.price}</p>
                      )}
                    </div>
                    <div className="col-md-4 cart-remove-btn">
                      <button className="btn btn-danger" onClick={() => removeCartItem(p._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="col-md-5 text-center cart-summary">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total : {totalPrice()}</h4>

              {auth?.user?.address ? (
                <div className="mb-3">
                  <h4>Current Address</h4>
                  <h5>{auth?.user?.address}</h5>
                  <button className="btn btn-outline-warning" onClick={() => navigate("/dashboard/user/profile")}>
                    Update Address
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button className="btn btn-outline-warning" onClick={() => navigate("/dashboard/user/profile")}>
                      Update Address
                    </button>
                  ) : (
                    <button className="btn btn-outline-warning" onClick={() => navigate("/login", { state: "/cart" })}>
                      Please Login to checkout
                    </button>
                  )}
                </div>
              )}

              <div className="mt-2">
                {!clientToken || !auth?.token || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <DropIn options={{ authorization: clientToken, paypal: { flow: "vault" } }} onInstance={(i) => setInstance(i)} />
                    <button className="btn btn-primary" onClick={handlePayment} disabled={loading || !instance || !auth?.user?.address}>
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
