import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { toast } from "react-hot-toast";
import { useCart } from "../context/cart";
import { Button, Card, Row, Col, Divider, Rate, Spin, Input } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "../styles/ProductDetails.css";

const { TextArea } = Input;

const ProductDetails = () => {
  const params = useParams();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [loading, setLoading] = useState(false);
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);

  const getProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/get-product/${params.slug}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
      getReviews(data?.product._id);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
    }
  };

  const getReviews = async (productId) => {
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/review/product-reviews/${productId}`
      );
      setReviews(data.reviews);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddToCartDetails = (product) => {
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

  const addReview = async () => {
    if (!product?._id) {
      toast.error("Product not found");
      return;
    }

    if (!newReview.rating || !newReview.comment) {
      toast.error("Please provide both rating and comment");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/review/add-review",
        {
          productId: product._id,
          rating: newReview.rating,
          comment: newReview.comment,
        }
      );
      setReviews([...reviews, data.review]);
      toast.success("Review added successfully!");
      setNewReview({ rating: 0, comment: "" });
    } catch (error) {
      console.log(error);
      toast.error("Failed to add review");
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/v1/review/delete-review/${reviewId}`
      );
      setReviews(reviews.filter((review) => review._id !== reviewId));
      toast.success("Review deleted successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete review");
    }
  };
  // Calculate discounted price with better logic
  const calculateDiscountedPrice = (product) => {
    if (!product || !product.offers || product.offers.length === 0) {
      return product?.price || 0;
    }

    // Get active offers (filter by date and active status)
    const currentDate = new Date();
    const activeOffers = product.offers.filter(
      (offer) =>
        offer.isActive &&
        new Date(offer.startDate) <= currentDate &&
        new Date(offer.endDate) >= currentDate
    );

    if (activeOffers.length === 0) {
      return product.price;
    }

    // For simplicity, use the first active offer
    // You could implement logic to find the best offer
    const offer = activeOffers[0];

    if (offer.discountType === "percentage") {
      const discountAmount = product.price * (offer.discountValue / 100);
      return Math.max(0, product.price - discountAmount);
    } else if (offer.discountType === "fixed") {
      return Math.max(0, product.price - offer.discountValue);
    } else if (offer.discountType === "bogo") {
      // Buy One Get One - return same price for single item
      return product.price;
    }

    return product.price;
  };

  const discountedPrice = calculateDiscountedPrice(product);

  return (
    <Layout>
      <div className="product-details-container">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-button"
        >
          Back to results
        </Button>

        {loading ? (
          <Spin size="large" className="loading-spinner" />
        ) : (
          <>
            <Row gutter={[32, 32]} className="product-main-section">
              <Col xs={24} md={12} lg={10}>
                <div className="product-image-container">
                  <img
                    src={`http://localhost:8080/api/v1/product/product-photo/${product._id}`}
                    alt={product.name}
                    className="product-image-large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12} lg={14}>
                <div className="product-info-section">
                  <h1 className="product-title">{product.name}</h1>

                  <div className="product-rating">
                    <Rate
                      disabled
                      value={product.rating || 0}
                      style={{ color: "#ffa41c" }}
                    />
                    <span className="rating-count">
                      {reviews.length} customer reviews
                    </span>
                  </div>

                  <Divider />

                  <div className="price-section">
                    <span className="price-label">Price: </span>
                    {discountedPrice < product.price ? (
                      <>
                        <span className="original-price">
                          <span className="price-symbol">$</span>
                          {product.price}
                        </span>
                        <span className="discounted-price">
                          <span className="price-symbol">$</span>
                          {discountedPrice.toFixed(2)}
                        </span>
                        <span className="discount-badge">
                          Save{" "}
                          {(
                            ((product.price - discountedPrice) /
                              product.price) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </>
                    ) : (
                      <span className="price-amount">
                        <span className="price-symbol">$</span>
                        {product.price}
                      </span>
                    )}
                  </div>

                  {discountedPrice < product.price &&
                    product.offers &&
                    product.offers.length > 0 && (
                      <div className="offer-badge">
                        <span className="offer-tag">Special Offer!</span>
                        {product.offers[0]?.discountType === "percentage" && (
                          <span className="offer-details">
                            {product.offers[0]?.discountValue}% OFF
                          </span>
                        )}
                        {product.offers[0]?.discountType === "fixed" && (
                          <span className="offer-details">
                            ${product.offers[0]?.discountValue} OFF
                          </span>
                        )}
                        {product.offers[0]?.discountType === "bogo" && (
                          <span className="offer-details">Buy One Get One</span>
                        )}
                        <span className="offer-expiry">
                          Valid until:{" "}
                          {new Date(
                            product.offers[0]?.endDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                  <div className="product-description">
                    <h3>About this item</h3>
                    <p>{product.description}</p>
                  </div>

                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCartDetails(product)}
                    className="add-to-cart-details-btn"
                  >
                    Add to Your Cart
                  </Button>
                </div>
              </Col>
            </Row>

            <Divider />

            <div className="customer-reviews-section">
              <h2>Customer reviews</h2>

              {reviews.length === 0 && (
                <p className="no-reviews">No customer reviews yet.</p>
              )}

              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{review.user.name}</span>
                    <Rate
                      disabled
                      value={review.rating}
                      style={{ color: "#ffa41c", fontSize: 14 }}
                    />
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {review.reply && (
                    <div className="admin-reply">
                      <span className="reply-label">Admin reply:</span>
                      <p>{review.reply}</p>
                    </div>
                  )}
                  {auth?.user?._id === review.user._id && (
                    <Button
                      type="link"
                      danger
                      onClick={() => deleteReview(review._id)}
                      className="delete-review-btn"
                    >
                      Delete review
                    </Button>
                  )}
                </div>
              ))}

              <div className="add-review-section">
                <h3>Write a customer review</h3>
                <Rate
                  value={newReview.rating}
                  onChange={(rating) => setNewReview({ ...newReview, rating })}
                  style={{ color: "#ffa41c" }}
                />
                <TextArea
                  placeholder="Share your thoughts about this product"
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  className="review-textarea"
                  rows={4}
                />
                <Button
                  type="primary"
                  onClick={addReview}
                  className="submit-review-btn"
                >
                  Submit review
                </Button>
              </div>
            </div>

            <Divider />

            <div className="similar-products-section">
              <h2>Customers who viewed this item also viewed</h2>
              <Row gutter={[16, 16]}>
                {relatedProducts.length === 0 && (
                  <Col span={24}>
                    <p className="no-similar-products">
                      No similar products found
                    </p>
                  </Col>
                )}
                // In ProductDetails.js - Update the similar products section
                {relatedProducts.map((p) => {
                  const similarDiscountedPrice = calculateDiscountedPrice(p);
                  const hasOffer = similarDiscountedPrice < p.price;

                  return (
                    <Col xs={12} sm={8} md={6} lg={6} key={p._id}>
                      <Card
                        hoverable
                        className="similar-product-card"
                        cover={
                          <div className="similar-product-image-container">
                            <img
                              src={`http://localhost:8080/api/v1/product/product-photo/${p._id}`}
                              alt={p.name}
                              className="similar-product-image"
                            />
                            {hasOffer && (
                              <div className="similar-product-offer-badge">
                                {p.offers &&
                                  p.offers[0]?.discountType === "percentage" &&
                                  `${p.offers[0]?.discountValue}% OFF`}
                                {p.offers &&
                                  p.offers[0]?.discountType === "fixed" &&
                                  `$${p.offers[0]?.discountValue} OFF`}
                                {p.offers &&
                                  p.offers[0]?.discountType === "bogo" &&
                                  "BOGO"}
                              </div>
                            )}
                          </div>
                        }
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        <Card.Meta
                          title={p.name}
                          description={
                            <>
                              <div className="similar-product-price">
                                {hasOffer ? (
                                  <>
                                    <span className="discounted-price">
                                      <span className="price-symbol">$</span>
                                      {similarDiscountedPrice.toFixed(2)}
                                    </span>
                                    <span className="original-price">
                                      <span className="price-symbol">$</span>
                                      {p.price}
                                    </span>
                                  </>
                                ) : (
                                  <span className="price-amount">
                                    <span className="price-symbol">$</span>
                                    {p.price}
                                  </span>
                                )}
                              </div>
                              <Rate
                                disabled
                                value={p.rating || 0}
                                style={{ color: "#ffa41c", fontSize: 14 }}
                              />
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetails;
