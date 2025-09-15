import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import { Spin } from "antd";
import "../styles/CategoryProduct.css";

// helper
const calcDiscounted = (p) => {
  if (!p?.price) return 0;
  const offers = Array.isArray(p?.offers) ? p.offers : [];
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
  if (o.discountType === "percentage")
    return Math.max(0, p.price * (1 - Number(o.discountValue || 0) / 100));
  if (o.discountType === "fixed")
    return Math.max(0, p.price - Number(o.discountValue || 0));
  return p.price;
};

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useCart();
  const [auth] = useAuth();

  useEffect(() => {
    if (params?.slug) getPrductsByCat();
  }, [params?.slug]);

  const getPrductsByCat = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/product-category/${params.slug}`,
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login");
    } else {
      const updatedCart = [...(cart || []), product];
      setCart(updatedCart);
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(updatedCart));
      toast.success("Item Added to Cart");
    }
  };

  return (
    <Layout>
      <div className="category-products-container">
        <div className="category-header">
          <h1>{category?.name}</h1>
          <p className="results-count">
            {products?.length} product{products?.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <Spin spinning={loading}>
          <div className="products-grid">
            {products?.map((p) => {
              const d = calcDiscounted(p);
              const hasOffer = typeof p.price === "number" && d < p.price;
              return (
                <div className="product-card" key={p._id}>
                  <div className="product-image-container">
                    <img
                      src={`http://localhost:8080/api/v1/product/product-photo/${p._id}`}
                      alt={p.name}
                      className="product-image"
                      onClick={() => navigate(`/product/${p.slug}`)}
                    />
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{p.name}</h3>
                    <div className="product-rating">
                      <span className="stars">★★★★★</span>
                      <span className="rating-count">(0)</span>
                    </div>

                  <p className="product-price" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  {hasOffer ? (
    <>
      {/* original first (struck) */}
      <span
        className="price-amount"
        style={{ textDecoration: "line-through", opacity: 0.6 }}
      >
        <span className="price-symbol">$</span>
        {p.price}
      </span>
      {/* then discounted */}
      <span
        className="price-amount"
        style={{ color: "#ff5a5f", fontWeight: "bold" }}
      >
        <span className="price-symbol">$</span>
        {d.toFixed(2)}
      </span>
    </>
  ) : (
    <span className="price-amount">
      <span className="price-symbol">$</span>
      {p.price}
    </span>
  )}
</p>

                    <p className="product-description">{p.description.substring(0, 60)}...</p>
                    <div className="product-actions">
                      <button className="details-btn" onClick={() => navigate(`/product/${p.slug}`)}>
                        More Details
                      </button>
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Spin>

        {products?.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No products found in this category</h3>
            <button className="browse-btn" onClick={() => navigate("/categories")}>
              Browse All Categories
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryProduct;
