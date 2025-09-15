import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import { Select, Card, Tag, Spin, Button, Image } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import "../../styles/AdminOrders.css";

const { Option } = Select;

const AdminOrders = () => {
  const [status, setStatus] = useState([
    "Not Process",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]);
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch orders
  const getOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/auth/all-orders"
      );
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        console.error("Unexpected response format, orders not an array", data);
        setOrders([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  // Handle order status change
  const handleChange = async (orderId, value) => {
    try {
      const { data } = await axios.put(
        `http://localhost:8080/api/v1/auth/order-status/${orderId}`,
        { status: value }
      );
      toast.success(data.message);
      getOrders();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "green";
      case "Shipped":
        return "blue";
      case "Processing":
        return "orange";
      case "Cancelled":
        return "red";
      default:
        return "default";
    }
  };

  // NEW: pick price from order.items (purchase-time), fallback to product.price
  const priceFor = (order, product) => {
    const items = order?.items || order?.lineItems || [];
    const found = items.find(
      (it) =>
        String(it?.product?._id || it?.product) === String(product?._id)
    );
    const val =
      typeof found?.price === "number" ? found.price : product?.price;
    return Number(val || 0);
  };

  return (
    <Layout title="All Orders Data">
      <div className="admin-orders-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>All Orders</h1>
              <Button
                icon={<ReloadOutlined />}
                onClick={getOrders}
                loading={loading}
                className="refresh-btn"
              >
                Refresh
              </Button>
            </div>

            <Spin spinning={loading}>
              {orders.length === 0 ? (
                <Card className="empty-state">
                  <div className="empty-content">
                    <h3>No orders found</h3>
                    <p>There are no orders to display at this time.</p>
                  </div>
                </Card>
              ) : (
                orders.map((order, index) => (
                  <Card key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <span className="order-number">Order #{index + 1}</span>
                        <span className="order-date">
                          {moment(order.createdAt).format("MMM D, YYYY h:mm A")}
                        </span>
                      </div>
                      <Tag color={getStatusColor(order.status)} className="status-tag">
                        {order.status}
                      </Tag>
                    </div>

                    <div className="order-details">
                      <div className="order-meta">
                        <div className="meta-item">
                          <span className="meta-label">Customer:</span>
                          <span className="meta-value">{order.buyer?.name}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Payment:</span>
                          <span className={`meta-value ${order.payment?.success ? "success" : "failed"}`}>
                            {order.payment?.success ? "Success" : "Failed"}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Items:</span>
                          <span className="meta-value">{order.products?.length}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Status:</span>
                          <Select
                            className="status-select"
                            onChange={(value) => handleChange(order._id, value)}
                            defaultValue={order.status}
                            size="small"
                          >
                            {status.map((s, i) => (
                              <Option key={i} value={s}>
                                {s}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="order-products">
                        <h4>Products</h4>
                        {order.products.map((product) => (
                          <div key={product._id} className="product-item">
                            <Image
                              src={`http://localhost:8080/api/v1/product/product-photo/${product._id}`}
                              alt={product.name}
                              width={120}
                              height={120}
                              preview={false}
                              className="product-image"
                            />
                            <div className="product-info">
                              <h5 className="product-name">{product.name}</h5>
                              <p className="product-desc">
                                {product.description.substring(0, 60)}...
                              </p>
                              <p className="product-price">
                                ${priceFor(order, product).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
