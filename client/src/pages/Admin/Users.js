import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/auth";
import { Card, Input, Button, Tag, Spin, Avatar, Space } from "antd";
import { SendOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import "../../styles/Users.css";

const { TextArea } = Input;

const Users = () => {
  const [reviews, setReviews] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [auth] = useAuth();
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/review/all-reviews"
      );
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    setReplying(true);
    try {
      await axios.put(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/reply-review/${reviewId}`,
        { reply }
      );
      toast.success("Reply added successfully!");
      fetchReviews();
      setReply("");
      setSelectedReviewId(null);
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply.");
    } finally {
      setReplying(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!auth.user || auth.user.role !== 1) {
      toast.error("Unauthorized to delete this review.");
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/review/delete-review/${reviewId}`
      );
      if (response.data.success) {
        toast.success("Review deleted successfully!");
        fetchReviews();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title={"Dashboard - Manage Reviews"}>
      <div className="admin-reviews-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>Manage Reviews</h1>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchReviews}
                loading={loading}
                className="refresh-btn"
              >
                Refresh
              </Button>
            </div>
            
            <Spin spinning={loading || deleting}>
              {reviews.length === 0 ? (
                <Card className="empty-state">
                  <div className="empty-content">
                    <h3>No reviews found</h3>
                    <p>There are no reviews to display at this time.</p>
                  </div>
                </Card>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <Card key={review._id} className="review-card">
                      <div className="review-header">
                        <div className="user-info">
                          <Avatar className="user-avatar">
                            {review.user?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <div className="user-details">
                            <h4 className="user-name">{review.user?.name}</h4>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Tag color="blue" className="review-tag">
                          Review
                        </Tag>
                      </div>

                      <div className="review-content">
                        <p className="review-comment">{review.comment}</p>
                        
                        {review.reply && (
                          <div className="admin-reply">
                            <div className="reply-header">
                              <Avatar className="admin-avatar">A</Avatar>
                              <span className="admin-label">Admin Reply</span>
                            </div>
                            <p className="reply-content">{review.reply}</p>
                          </div>
                        )}
                      </div>

                      <div className="review-actions">
                        <Space size="middle" align="center">
                          {selectedReviewId === review._id ? (
                            <div className="reply-section">
                              <TextArea
                                placeholder="Write your reply..."
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={3}
                                className="reply-input"
                              />
                              <div className="reply-buttons">
                                <Button
                                  type="primary"
                                  icon={<SendOutlined />}
                                  onClick={() => handleReplySubmit(review._id)}
                                  loading={replying}
                                  className="send-btn"
                                >
                                  Send Reply
                                </Button>
                                <Button
                                  onClick={() => setSelectedReviewId(null)}
                                  className="cancel-btn"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="default"
                              onClick={() => setSelectedReviewId(review._id)}
                              className="reply-btn"
                            >
                              Reply
                            </Button>
                          )}
                          
                          <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteReview(review._id)}
                            loading={deleting}
                            className="delete-btn"
                            size="middle"
                          >
                            Delete
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;