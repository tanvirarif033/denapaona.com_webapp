import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/ProductDetails.css";
import { useAuth } from "../context/auth";

const ProductDetails = () => {
  const params = useParams();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: "", comment: "" });
  const [error, setError] = useState("");
  const [auth, setAuth] = useAuth();

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
      console.error("Product not found or invalid product ID.");
      setError("Unable to add review. Product not found.");
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
      // Reset form
      setNewReview({ rating: "", comment: "" });
    } catch (error) {
      console.log(error);
      setError("Error adding review. Please try again.");
    }
  };

  useEffect(() => {
    if (auth?.token) getProduct(); // Fetch the product details first
  }, [auth?.token]);

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/delete-review/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setReviews(reviews.filter((review) => review._id !== reviewId)); // Remove deleted review from state
    } catch (error) {
      console.log(error);
      setError("Error deleting review. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          <img
            src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${product._id}`}
            className="card-img-top"
            alt={product.name}
            height="300"
            width={"350px"}
          />
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          <h6>Name: {product.name}</h6>
          <h6>Description: {product.description}</h6>
          <h6>Price: {product.price}</h6>
          <h6>Category: {product?.category?.name}</h6>
          <button className="btn btn-secondary ms-1">ADD TO CART</button>
        </div>
      </div>
      <hr />
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
              <p className="card-text">$ {p.price}</p>
              <button className="btn btn-link text-decoration-none">
                ADD TO CART
              </button>
            </div>
          </div>
        ))}
      </div>

      <hr />
      <div className="container reviews">
        <h4>User Reviews</h4>
        {reviews.length < 1 && <p>No reviews yet.</p>}
        {reviews.map((review) => (
          <div key={review._id} className="review">
            <p>
              <strong>{review.user.name}:</strong> {review.comment} (Rating:{" "}
              {review.rating})
            </p>
            {review.reply && (
              <p>
                <strong>Admin Reply:</strong> {review.reply}
              </p>
            )}
            <button
              className="btn btn-danger"
              onClick={() => deleteReview(review._id)}
            >
              Delete
            </button>
          </div>
        ))}

        <h4>Add a Review</h4>
        {error && <p className="text-danger">{error}</p>}
        <input
          type="number"
          min="1"
          max="5"
          placeholder="Rating (1-5)"
          value={newReview.rating}
          onChange={(e) =>
            setNewReview({ ...newReview, rating: e.target.value })
          }
          className="form-control mb-2"
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
    </Layout>
  );
};

export default ProductDetails;
