import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/ProductDetails.css";
import { useAuth } from "../context/auth";
import { toast } from "react-hot-toast"; // Importing toast
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import ReactStars from "react-stars"; // Import react-stars for star ratings

const ProductDetails = () => {
  const params = useParams();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" }); // Initialize rating as 0
  const [error, setError] = useState(""); // Define the error state
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const navigate = useNavigate();

  // Fetch product details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);

  // Get product details
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product/${params.slug}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
      getReviews(data?.product._id); // Fetch reviews
    } catch (error) {
      console.log(error);
    }
  };

  // Get similar products
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
    }
  };

  // Handle adding product to cart
  const handleAddToCart = (product) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login"); // Redirect to login page if not authenticated
    } else {
      const updatedCart = [...cart, product];
      setCart(updatedCart);
      localStorage.setItem(
        `cart-${auth.user.email}`,
        JSON.stringify(updatedCart)
      ); // Save cart associated with user's email
      toast.success("Item Added to Cart");
    }
  };

  // Get reviews for the product
  const getReviews = async (productId) => {
    try {
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/product-reviews/${productId}`
      );
      setReviews(data.reviews);
    } catch (error) {
      console.log(error);
    }
  };

  // Add a new review
  const addReview = async () => {
    if (!product?._id) {
      setError("Unable to add review. Product not found."); // Set error
      return;
    }

    if (!newReview.rating || !newReview.comment) {
      setError("Please provide both a rating and a comment."); // Set error if inputs are incomplete
      return;
    }

    try {
      const { data } = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/review/add-review",
        {
          productId: product._id,
          rating: newReview.rating,
          comment: newReview.comment,
        }
      );

      // Update state with new review
      setReviews([...reviews, data.review]);
      toast.success("Review added successfully!"); // Success toast
      setError(""); // Clear error on success
      // Reset form
      setNewReview({ rating: 0, comment: "" });
    } catch (error) {
      console.log(error);
      setError("Error adding review. Please try again."); // Set error on failure
    }
  };

  useEffect(() => {
    if (auth?.token) getProduct();
  }, [auth?.token]);

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/delete-review/${reviewId}`
      );

      // Remove the deleted review from state
      setReviews(reviews.filter((review) => review._id !== reviewId));
      toast.success("Review deleted successfully!"); // Success toast
    } catch (error) {
      console.log(error);
      toast.error("Error deleting review. Please try again."); // Error toast
    }
  };

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          <img
            src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${product._id}`}
            className="product-image-large"
            alt={product.name}
            height="400"
            width="450"
          />
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          <h6 className="product-name">Name: {product.name}</h6>
          <h6>Description: {product.description}</h6>
          <h6 className="product-price">
            Price: <span style={{ color: "green" }}>$</span>
            <span style={{ color: "#ffa41c" }}>{product.price}</span>
          </h6>
          <h6>Category: {product?.category?.name}</h6>
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => handleAddToCart(product)}
          >
            Add To Cart
          </button>
        </div>
      </div>

      <hr />

      <div className="container reviews">
        <h4>User Reviews</h4>
        {reviews.length < 1 && <p>No reviews yet.</p>}
        {reviews.map((review) => (
          <div key={review._id} className="review">
            <p>
              <strong>{review.user.name}:</strong> {review.comment}
            </p>
            <ReactStars
              count={5}
              value={review.rating}
              size={24}
              color2={"#ffd700"}
              edit={false} // Disable editing for displayed reviews
            />
            {review.reply && (
              <p>
                <strong>Admin Reply:</strong> {review.reply}
              </p>
            )}
            {auth?.user?._id === review.user._id && (
              <button
                className="btn btn-danger"
                onClick={() => deleteReview(review._id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}

        <h4>Add a Review</h4>
        {error && <p className="text-danger">{error}</p>} {/* Display error */}
        <ReactStars
          count={5}
          value={newReview.rating}
          size={24}
          color2={"#ffd700"}
          onChange={(newRating) =>
            setNewReview({ ...newReview, rating: newRating })
          } // Update rating in newReview state
        />
        <textarea
          placeholder="Comment"
          value={newReview.comment}
          onChange={(e) =>
            setNewReview({ ...newReview, comment: e.target.value })
          }
          className="form-control mb-2"
        />
        <button className="btn btn-primary" onClick={addReview}>
          Submit Review
        </button>
      </div>

      <div className="row container similar-products">
        <h4>Similar Products</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center">No Similar Products found</p>
        )}
        {relatedProducts.map((p) => (
          <div className="card m-2" style={{ width: "18rem" }} key={p._id}>
            <img
              src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
              className="card-img-top"
              alt={p.name}
            />
            <div className="card-body">
              <h5 className="card-title">{p.name}</h5>
              <p className="card-text">{p.description.substring(0, 20)}...</p>
              <p className="card-text1">
                <span style={{ color: "green" }}>$</span> {p.price}
              </p>
              <button
                className="btn btn-link text-decoration-none"
                onClick={() => navigate(`/product/${p.slug}`)}
              >
                More Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ProductDetails;
