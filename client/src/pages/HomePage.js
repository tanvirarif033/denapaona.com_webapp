import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import { useCart } from "../context/cart";
import { Checkbox, Radio, Spin, Carousel, Button, Drawer, Badge, Card } from "antd";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineReload,
  AiOutlineFilter,
} from "react-icons/ai";
import {
  LeftOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import "../styles/Homepage.css";

// 👇 Add the chat widget import
import ChatWidget from "../components/chat/ChatWidget";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [auth] = useAuth(); // 👈 we will pass this into ChatWidget
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [offers, setOffers] = useState([]);

  // Load user-specific cart when user logs in
  useEffect(() => {
    if (auth?.user) {
      const savedCart = localStorage.getItem(`cart-${auth.user.email}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [auth?.user, setCart]);

  // Get active offers
  const getActiveOffers = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/offer/get-active-offers",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setOffers(data?.offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  const getAllCategory = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Something went wrong in getting category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
    getAllProducts();
    getTotal();
    getActiveOffers(); // Fetch offers on component mount
  }, []);

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/product-list/${page}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/product/product-count",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/product-list/${page}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts([...products, ...data?.products]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
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
        {
          checked,
          radio,
        }
      );
      setProducts(data?.products);
    } catch (error) {
      console.error("Error fetching filtered products:", error);
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
      const updatedCart = [...cart, product];
      setCart(updatedCart);
      localStorage.setItem(
        `cart-${auth.user.email}`,
        JSON.stringify(updatedCart)
      );
      toast.success("Item Added to Cart");
    }
  };

  const PrevArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
        onClick={onClick}
      >
        <LeftOutlined
          style={{
            fontSize: "20px",
            color: "white",
            background: "rgba(0,0,0,0.5)",
            padding: "10px",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  };

  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
        onClick={onClick}
      >
        <RightOutlined
          style={{
            fontSize: "20px",
            color: "white",
            background: "rgba(0,0,0,0.5)",
            padding: "10px",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title={"Shop - Best Deals"}>
      {/* Offers Carousel */}
      {offers.length > 0 && (
        <div className="offers-carousel mb-4">
          <h2>Special Offers</h2>
          <Carousel
            autoplay
            arrows
            prevArrow={<PrevArrow />}
            nextArrow={<NextArrow />}
            dots={{ className: "carousel-dots" }}
          >
            {offers.map((offer) => (
              <div key={offer._id}>
                <Card
                  cover={
                    <img
                      alt={offer.title}
                      src={`http://localhost:8080/api/v1/offer/offer-banner/${offer._id}`}
                      style={{ height: "300px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "/fallback-image.jpg"; // Add a fallback image
                      }}
                    />
                  }
                >
                  <Card.Meta
                    title={offer.title}
                    description={
                      <div>
                        <p>{offer.description}</p>
                        <p>
                          <strong>Discount:</strong> {offer.discountValue}{" "}
                          {offer.discountType === "percentage" ? "%" : "$"}
                        </p>
                        <Button type="primary">Shop Now</Button>
                      </div>
                    }
                  />
                </Card>
              </div>
            ))}
          </Carousel>
        </div>
      )}

      {/* Main Content */}
      <div className="main-container">
        {/* Filters Button */}
        <div className="filters-header">
          <Badge count={checked.length + (radio.length ? 1 : 0)}>
            <Button
              type="default"
              icon={<AiOutlineFilter />}
              onClick={() => setShowFilters(true)}
              className="filters-button"
            >
              Filters
            </Button>
          </Badge>
          <div className="results-count">
            {filteredProducts.length} of {total} products
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {loading ? (
            <Spin size="large" className="loading-spinner" />
          ) : filteredProducts.length === 0 ? (
            <div className="no-results">
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
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
                  <p className="product-price">
                    <span className="price-amount">
                      <span className="price-symbol">$</span>
                      {p.price}
                    </span>
                  </p>
                  <p className="product-description">
                    {p.description.substring(0, 60)}...
                  </p>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(p)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredProducts.length < total && (
          <div className="load-more-container">
            <Button
              type="default"
              className="load-more-btn"
              onClick={(e) => {
                e.preventDefault();
                setPage(page + 1);
              }}
              loading={loading}
              icon={<AiOutlineReload />}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      <Drawer
        title="Filters"
        placement="left"
        onClose={() => setShowFilters(false)}
        open={showFilters}
        width={300}
        className="filters-drawer"
      >
        <div className="filter-group">
          <h4>Categories</h4>
          <div className="filter-options">
            {loading ? (
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
            {loading ? (
              <Spin size="small" />
            ) : (
              <Radio.Group
                value={radio}
                onChange={(e) => setRadio(e.target.value)}
              >
                {Prices?.map((p) => (
                  <Radio value={p.array} key={p._id}>
                    {p.name}
                  </Radio>
                ))}
              </Radio.Group>
            )}
          </div>
        </div>

        <div className="filter-actions">
          <Button
            type="primary"
            danger
            onClick={resetFilters}
            className="reset-filters-btn"
          >
            Reset All
          </Button>
          <Button
            type="primary"
            onClick={() => setShowFilters(false)}
            className="apply-filters-btn"
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>

      {/* 👇 Add the floating, real-time Chat widget */}
      <ChatWidget auth={auth} />
    </Layout>
  );
};

export default HomePage;
