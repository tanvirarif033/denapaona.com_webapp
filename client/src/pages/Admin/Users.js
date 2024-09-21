import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import { toast } from "react-hot-toast"; // For notifications

const Users = () => {
  const [reviews, setReviews] = useState([]);
  const [reply, setReply] = useState(""); // For reply input
  const [selectedReviewId, setSelectedReviewId] = useState(null); // To track the review being replied to

  // Fetch all reviews when the component mounts
  useEffect(() => {
    fetchReviews();
  }, []);

  // Function to fetch all reviews
  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/review/all-reviews"
      );
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews.");
    }
  };

  // Function to handle adding a reply to a review
  const handleReplySubmit = async (reviewId) => {
    try {
      await axios.put(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/reply-review/${reviewId}`,
        { reply }
      );
      toast.success("Reply added successfully!");
      fetchReviews(); // Refresh reviews after adding a reply
      setReply(""); // Clear reply input
      setSelectedReviewId(null); // Reset selected review
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply.");
    }
  };

  // Function to handle deleting a review
  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/delete-review/${reviewId}`
      );
      toast.success("Review deleted successfully!");
      fetchReviews(); // Refresh reviews after deletion
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review.");
    }
  };

  return (
    <Layout title={"Dashboard - Manage Reviews"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Reviews</h1>
            <div className="reviews-list">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <p>
                      <strong>{review.user.name}:</strong> {review.comment}
                    </p>
                    {review.reply && (
                      <p>
                        <strong>Admin Reply:</strong> {review.reply}
                      </p>
                    )}
                    {/* Reply Section */}
                    {selectedReviewId === review._id ? (
                      <div>
                        <textarea
                          placeholder="Write a reply..."
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          className="form-control mb-2"
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleReplySubmit(review._id)}
                        >
                          Submit Reply
                        </button>
                        <button
                          className="btn btn-secondary ms-2"
                          onClick={() => setSelectedReviewId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-link text-decoration-none"
                        onClick={() => setSelectedReviewId(review._id)}
                      >
                        Reply
                      </button>
                    )}

                    {/* Delete Review */}
                    <button
                      className="btn btn-danger ms-3"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p>No reviews found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
