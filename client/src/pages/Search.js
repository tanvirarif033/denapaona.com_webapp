import React from "react";
import Layout from "./../components/Layout/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card, Button, Rate, Space } from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import "../styles/Search.css";

const { Meta } = Card;

const Search = () => {
  const [values] = useSearch();
  const [cart, setCart] = useCart();
  const [auth] = useAuth();
  const navigate = useNavigate();

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

  const handleMoreDetails = (slug) => {
    navigate(`/product/${slug}`);
  };

  return (
    <Layout title={"Search results"}>
      <div className="search-results-container">
        <div className="search-header">
          <h1>Search Results</h1>
          <p className="results-count">
            {values?.results.length < 1
              ? "No products found"
              : `Found ${values?.results.length} product${values?.results.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        
        <div className="products-grid">
          {values?.results.map((p) => (
            <Card
              key={p._id}
              className="product-card"
              cover={
                <img
                  alt={p.name}
                  src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
                  className="product-image"
                  onClick={() => handleMoreDetails(p.slug)}
                />
              }
              actions={[
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => handleMoreDetails(p.slug)}
                  className="action-btn"
                >
                  Details
                </Button>,
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCart(p)}
                  className="action-btn cart-btn"
                >
                  Add to Cart
                </Button>
              ]}
            >
              <Meta
                title={p.name}
                description={
                  <div className="product-info">
                    <p className="product-desc">
                      {p.description.substring(0, 60)}...
                    </p>
                    <div className="product-meta">
                      <Rate disabled defaultValue={4} className="product-rating" />
                      <span className="price">${p.price}</span>
                    </div>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Search;