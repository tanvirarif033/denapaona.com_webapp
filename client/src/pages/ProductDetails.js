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

// same helper as Home
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
        { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
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

  const handleAddToCartDetails = (p) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login");
    } else {
      const updatedCart = [...(cart || []), p];
      setCart(updatedCart);
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(updatedCart));
      toast.success("Item Added to Cart");
    }
  };

  const addReview = async () => {
    if (!product?._id) return toast.error("Product not found");
    if (!newReview.rating || !newReview.comment)
      return toast.error("Please provide both rating and comment");

    try {
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/review/add-review",
        { productId: product._id, rating: newReview.rating, comment: newReview.comment }
      );
      setReviews([...reviews, data.review]);
      toast.success("Review added successfully!");
      setNewReview({ rating: 0, comment: "" });
    } catch {
      toast.error("Failed to add review");
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(`http://localhost:8080/api/v1/review/delete-review/${reviewId}`);
      setReviews(reviews.filter((r) => r._id !== reviewId));
      toast.success("Review deleted successfully!");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const discountedPrice = calcDiscounted(product);

  return (
    <Layout>
      <div className="product-details-container">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
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
                    <Rate disabled value={product.rating || 0} style={{ color: "#ffa41c" }} />
                    <span className="rating-count">{reviews.length} customer reviews</span>
                  </div>

                  <Divider />

                  <div className="price-section">
                    <span className="price-label">Price: </span>
                    {discountedPrice < product.price ? (
                      <>
                        <span className="original-price">
                          <span className="price-symbol">$</span>{product.price}
                        </span>
                        <span className="discounted-price">
                          <span className="price-symbol">$</span>{discountedPrice.toFixed(2)}
                        </span>
                        {product.price > 0 && (
                          <span className="discount-badge">
                            Save {(((product.price - discountedPrice) / product.price) * 100).toFixed(0)}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="price-amount">
                        <span className="price-symbol">$</span>{product.price}
                      </span>
                    )}
                  </div>

                  {discountedPrice < product.price && product.offers?.length > 0 && (
                    <div className="offer-badge">
                      <span className="offer-tag">Special Offer!</span>
                      {product.offers[0]?.discountType === "percentage" && (
                        <span className="offer-details">{product.offers[0]?.discountValue}% OFF</span>
                      )}
                      {product.offers[0]?.discountType === "fixed" && (
                        <span className="offer-details">${product.offers[0]?.discountValue} OFF</span>
                      )}
                      <span className="offer-expiry">
                        Valid until: {new Date(product.offers[0]?.endDate).toLocaleDateString()}
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

            {/* Customer reviews (restored) */}
            <div className="customer-reviews-section">
              <h2>Customer reviews</h2>
              {reviews.length === 0 && <p className="no-reviews">No customer reviews yet.</p>}
              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{review.user.name}</span>
                    <Rate disabled value={review.rating} style={{ color: "#ffa41c", fontSize: 14 }} />
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {review.reply && (
                    <div className="admin-reply">
                      <span className="reply-label">Admin reply:</span>
                      <p>{review.reply}</p>
                    </div>
                  )}
                  {auth?.user?._id === review.user._id && (
                    <Button type="link" danger onClick={() => deleteReview(review._id)} className="delete-review-btn">
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
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="review-textarea"
                  rows={4}
                />
                <Button type="primary" onClick={addReview} className="submit-review-btn">
                  Submit review
                </Button>
              </div>
            </div>

            <Divider />

            {/* Related products (restored) */}
            <div className="similar-products-section">
              <h2>Customers who viewed this item also viewed</h2>
              <Row gutter={[16, 16]}>
                {relatedProducts.length === 0 && (
                  <Col span={24}>
                    <p className="no-similar-products">No similar products found</p>
                  </Col>
                )}

                {relatedProducts.map((p) => {
                  const d = calcDiscounted(p);
                  const hasOffer = typeof p.price === "number" && d < p.price;
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
                            {hasOffer && <div className="similar-product-offer-badge">Offer</div>}
                          </div>
                        }
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        <Card.Meta
                          title={p.name}
                          description={
                            <div className="similar-product-price">
                              {hasOffer ? (
                                <>
                                  <span className="discounted-price">
                                    <span className="price-symbol">$</span>{d.toFixed(2)}
                                  </span>
                                  <span className="original-price">
                                    <span className="price-symbol">$</span>{p.price}
                                  </span>
                                </>
                              ) : (
                                <span className="price-amount">
                                  <span className="price-symbol">$</span>{p.price}
                                </span>
                              )}
                            </div>
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
