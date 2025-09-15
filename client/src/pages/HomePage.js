import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import { useCart } from "../context/cart";
import {
  Checkbox,
  Radio,
  Spin,
  Carousel,
  Button,
  Drawer,
  Badge,
  Card,
} from "antd";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";
import { useNavigate } from "react-router-dom";
import { AiOutlineReload, AiOutlineFilter } from "react-icons/ai";
import {
  LeftOutlined,
  RightOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import "../styles/Homepage.css";
import ChatWidget from "../components/chat/ChatWidget";

// helper — compute discounted price from populated offers (if present)
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

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [auth] = useAuth();
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (auth?.user) {
      const savedCart = localStorage.getItem(`cart-${auth.user.email}`);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } else {
      setCart([]);
    }
  }, [auth?.user, setCart]);

  const getActiveOffers = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/offer/get-active-offers",
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
      );
      if (data?.success) setOffers(data.offers || []);
    } catch {
      setOffers([]);
    }
  };

  const getAllCategory = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/category/get-category",
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
      );
      if (data?.success) setCategories(data?.category);
    } catch {
      toast.error("Something went wrong in getting category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
    getAllProducts();
    getTotal();
    getActiveOffers();
  }, []);

  // NOTE: your backend product list stays the same; if it doesn't populate offers
  // we'll still render base price. When offers are populated, UI will strike-through.
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/product-list/${page}`,
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
      );
      setProducts(data.products || []);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/product/product-count",
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
      );
      setTotal(data?.total);
    } catch { /* no-op */ }
  };

  useEffect(() => {
    if (page === 1) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `http://localhost:8080/api/v1/product/product-list/${page}`,
          { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
        );
        setProducts((prev) => [...prev, ...(data?.products || [])]);
      } catch { /* no-op */ } finally { setLoading(false); }
    })();
  }, [page]);

  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) all.push(id);
    else all = all.filter((c) => c !== id);
    setChecked(all);
  };

  useEffect(() => {
    if (!checked.length || !radio.length) getAllProducts();
  }, [checked.length, radio.length]);

  useEffect(() => {
    if (checked.length || radio.length) filterProduct();
  }, [checked, radio]);

  const filterProduct = async () => {
    try {
      setFilterLoading(true);
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/product/product-filters",
        { checked, radio }
      );
      setProducts(data?.products || []);
    } catch {
      toast.error("Something went wrong in fetching filtered products");
    } finally {
      setFilterLoading(false);
    }
  };

  const resetFilters = () => {
    setChecked([]);
    setRadio([]);
    getAllProducts();
    setShowFilters(false);
  };

  const handleAddToCart = (product) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login");
    } else {
      const updatedCart = [...(cart || []), product];
      setCart(updatedCart);
      localStorage.setItem(
        `cart-${auth.user.email}`,
        JSON.stringify(updatedCart)
      );
      toast.success("Item Added to Cart");
    }
  };

  const PrevArrow = ({ className, style, onClick }) => (
    <div
      className={className}
      style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
      onClick={onClick}
    >
      <LeftOutlined style={{ fontSize: 20, color: "white", background: "rgba(0,0,0,0.5)", padding: 10, borderRadius: "50%" }} />
    </div>
  );
  const NextArrow = ({ className, style, onClick }) => (
    <div
      className={className}
      style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
      onClick={onClick}
    >
      <RightOutlined style={{ fontSize: 20, color: "white", background: "rgba(0,0,0,0.5)", padding: 10, borderRadius: "50%" }} />
    </div>
  );

  const handleShopNow = (offer) => {
    if (offer?.category?.slug) navigate(`/category/${offer.category.slug}`);
    else if (offer?.products?.length && offer.products[0]?.slug)
      navigate(`/product/${offer.products[0].slug}`);
    else navigate("/products");
  };
  // Normalize offer fields and build readable labels
// normalize for safe rendering
const normalizeOffer = (offer) => {
  const desc = offer?.description || "";
  const type = (offer?.discountType || "").toLowerCase(); // "percentage" | "fixed"
  const val = offer?.discountValue;
  const discountLabel =
    val === null || val === undefined || val === ""
      ? ""
      : type === "percentage"
      ? `${val}%`
      : `$${val}`;
  return { desc, discountLabel };
};



  return (
    <Layout title={"Shop - Best Deals"}>
      {/* Offers Carousel */}
{/* Offers Carousel */}
{offers.length > 0 && (
  <div className="offers-carousel mb-4">
    <h2>Special Offers</h2>
    <Carousel autoplay arrows prevArrow={<PrevArrow />} nextArrow={<NextArrow />}>
      {offers.map((offer) => {
        const { desc, discountLabel } = normalizeOffer(offer);
        return (
          <div key={offer._id}>
            <Card
              cover={
                <img
                  alt={offer.title}
                  src={`http://localhost:8080/api/v1/offer/offer-banner/${offer._id}`}
                  style={{ height: 300, objectFit: "cover" }}
                  onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                />
              }
            >
              {/* Plain JSX so content never gets swallowed by Card.Meta */}
              <div style={{ whiteSpace: "normal" }}>
                <h3 style={{ marginBottom: 8 }}>{offer.title}</h3>

                {desc ? <p style={{ marginBottom: 8 }}>{desc}</p> : null}

                {discountLabel ? (
                  <p style={{ marginBottom: 16 }}>
                    <strong>Discount:</strong> {discountLabel}
                  </p>
                ) : null}

                <Button
                  onClick={() => handleShopNow(offer)}
                  style={{
                    backgroundColor: "#FFA41C", // Amazon orange
                    borderColor: "#FFA41C",
                    color: "#111",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#FF8F00";
                    e.currentTarget.style.borderColor = "#FF8F00";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFA41C";
                    e.currentTarget.style.borderColor = "#FFA41C";
                  }}
                >
                  Shop Now
                </Button>
              </div>
            </Card>
          </div>
        );
      })}
    </Carousel>
  </div>
)}



      {/* Products grid */}
      <div className="products-grid">
        {loading ? (
          <Spin size="large" className="loading-spinner" />
        ) : products.length === 0 ? (
          <div className="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          products.map((p) => {
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

                  {/* PRICE — original (struck) + offer price like your old design */}
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

 

                  <p className="product-description">{(p.description || "").substring(0, 60)}...</p>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)}>
                    <ShoppingCartOutlined /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {products.length < total && (
        <div className="load-more-container">
          <Button
            type="default"
            className="load-more-btn"
            onClick={(e) => {
              e.preventDefault();
              setPage((x) => x + 1);
            }}
            loading={loading}
            icon={<AiOutlineReload />}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <Drawer title="Filters" placement="left" onClose={() => setShowFilters(false)} open={showFilters} width={300} className="filters-drawer">
        <div className="filter-group">
          <h4>Categories</h4>
          <div className="filter-options">
            {filterLoading ? (
              <Spin size="small" />
            ) : (
              categories?.map((c) => (
                <Checkbox
                  key={c._id}
                  checked={checked.includes(c._id)}
                  onChange={(e) => handleFilter(e.target.checked, c._id)}
                >
                  {c.name}
                </Checkbox>
              ))
            )}
          </div>
        </div>

        <div className="filter-group">
          <h4>Price Range</h4>
          <div className="filter-options">
            <Radio.Group value={radio} onChange={(e) => setRadio(e.target.value)}>
              {Prices?.map((p) => (
                <Radio value={p.array} key={p._id}>
                  {p.name}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>

        <div className="filter-actions">
          <Button type="primary" danger onClick={resetFilters} className="reset-filters-btn">
            Reset All
          </Button>
          <Button type="primary" onClick={() => setShowFilters(false)} className="apply-filters-btn">
            Apply Filters
          </Button>
        </div>
      </Drawer>

      <ChatWidget auth={auth} />
    </Layout>
  );
};

export default HomePage;
