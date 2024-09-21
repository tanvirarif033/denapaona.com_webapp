import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/auth";

const Users = () => {
  const [reviews, setReviews] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [auth] = useAuth(); // Destructure auth to get user
  const [isHoveringPrimary, setIsHoveringPrimary] = useState(null); // Track which button is being hovered
  const [isHoveringSecondary, setIsHoveringSecondary] = useState(null);
  const [isHoveringDanger, setIsHoveringDanger] = useState(null);

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

  // Function to delete a review
  const handleDeleteReview = async (reviewId) => {
    if (!auth.user || auth.user.role !== 1) {
      toast.error("Unauthorized to delete this review.");
      return;
    }

    try {
      const response = await axios.delete(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/delete-review/${reviewId}`
      );
      if (response.data.success) {
        toast.success("Review deleted successfully!");
        fetchReviews(); // Refresh reviews after deletion
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.response?.data?.message || "Failed to delete review.");
    }
  };

  // Define styles for the component
  const styles = {
 
    reviewItem: {
      border: "1px solid #ddd",
      padding: "20px",
      marginBottom: "20px",
      borderRadius: "8px",
      backgroundColor: "#f5f5f5",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    },
    strongText: {
      color: "#333",
      fontWeight: "bold",
    },
    formControl: {
      width: "100%",
      padding: "12px",
      margin: "10px 0",
      borderRadius: "5px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
    },
    btnLink: {
      color: "#007bff",
      background: "none",
      border: "none",
      padding: 0,
      textDecoration: "underline",
      cursor: "pointer",
      marginTop: "10px",
    },
    // Amazon-style primary button (orange) with hover effect
    btnPrimary: {
      backgroundColor: "#ff9900", // Amazon's orange color
      borderColor: "#ff9900",
      color: "#fff",
      padding: "8px 16px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "none",
      marginTop: "10px",
      fontWeight: "bold",
      transition: "background-color 0.3s ease", // Smooth transition
    },
    btnPrimaryHover: {
      backgroundColor: "#e68a00", // Slightly darker orange on hover
    },
    // Amazon-style secondary button (gray) with hover effect
    btnSecondary: {
      backgroundColor: "#f3f3f3", // Light gray background
      borderColor: "#d5d5d5",
      color: "#333", // Darker text
      padding: "8px 16px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "1px solid #d5d5d5", // Border to match the color
      marginLeft: "10px",
      marginTop: "10px",
      transition: "background-color 0.3s ease", // Smooth transition
    },
    btnSecondaryHover: {
      backgroundColor: "#e0e0e0", // Darker gray on hover
    },
    // Amazon-style danger button (red) with hover effect
    btnDanger: {
      backgroundColor: "#d9534f", // Red for destructive actions
      borderColor: "#d9534f",
      color: "#fff",
      padding: "8px 16px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "none",
      marginLeft: "10px",
      marginTop: "10px",
      fontWeight: "bold",
      transition: "background-color 0.3s ease", // Smooth transition
    },
    btnDangerHover: {
      backgroundColor: "#c9302c", // Darker red on hover
    },
    reviewsList: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    reviewHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
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
            <div style={styles.reviewsList}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} style={styles.reviewItem}>
                    <div style={styles.reviewHeader}>
                      <p>
                        <strong style={styles.strongText}>
                          {review.user.name}:
                        </strong>{" "}
                        {review.comment}
                      </p>
                      {review.reply && (
                        <p>
                          <strong style={styles.strongText}>
                            Admin Reply:
                          </strong>{" "}
                          {review.reply}
                        </p>
                      )}
                    </div>

                    {/* Reply Section */}
                    {selectedReviewId === review._id ? (
                      <div>
                        <textarea
                          placeholder="Write a reply..."
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          style={styles.formControl}
                        />
                        <button
                          style={
                            isHoveringPrimary === review._id
                              ? { ...styles.btnPrimary, ...styles.btnPrimaryHover }
                              : styles.btnPrimary
                          }
                          onMouseEnter={() => setIsHoveringPrimary(review._id)}
                          onMouseLeave={() => setIsHoveringPrimary(null)}
                          onClick={() => handleReplySubmit(review._id)}
                        >
                          Submit Reply
                        </button>
                        <button
                          style={
                            isHoveringSecondary === review._id
                              ? { ...styles.btnSecondary, ...styles.btnSecondaryHover }
                              : styles.btnSecondary
                          }
                          onMouseEnter={() => setIsHoveringSecondary(review._id)}
                          onMouseLeave={() => setIsHoveringSecondary(null)}
                          onClick={() => setSelectedReviewId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        style={styles.btnLink}
                        onClick={() => setSelectedReviewId(review._id)}
                      >
                        Reply
                      </button>
                    )}

                    {/* Delete Review */}
                    <button
                      style={
                        isHoveringDanger === review._id
                          ? { ...styles.btnDanger, ...styles.btnDangerHover }
                          : styles.btnDanger
                      }
                      onMouseEnter={() => setIsHoveringDanger(review._id)}
                      onMouseLeave={() => setIsHoveringDanger(null)}
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
