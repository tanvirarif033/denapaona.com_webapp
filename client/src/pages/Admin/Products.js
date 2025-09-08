import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Spin, Card, Row, Col, Button, Tag } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import "../../styles/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/product/get-product",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts(data.products);
    } catch (error) {
      console.log(error);
      toast.error("Something Went Wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="admin-products-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>All Products List</h1>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={getAllProducts}
                loading={loading}
                className="refresh-btn"
              >
                Refresh
              </Button>
            </div>
            
            <Spin spinning={loading} tip="Loading products...">
              {products.length === 0 ? (
                <Card className="empty-state">
                  <div className="empty-content">
                    <h3>No products found</h3>
                    <p>Get started by creating your first product.</p>
                  </div>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {products.map((product) => (
                    <Col xs={24} sm={12} lg={8} key={product._id}>
                      <Card
                        className="product-card"
                        cover={
                          <img
                            alt={product.name}
                            src={`http://localhost:8080/api/v1/product/product-photo/${product._id}`}
                            className="product-image"
                          />
                        }
                        actions={[
                          <Link to={`/dashboard/admin/product/${product.slug}`}>
                            <EyeOutlined /> View Details
                          </Link>
                        ]}
                      >
                        <div className="product-content">
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-description">
                            {product.description.substring(0, 60)}...
                          </p>
                          <div className="product-meta">
                            <span className="product-price">${product.price}</span>
                            <Tag color={product.quantity > 0 ? "green" : "red"} className="stock-tag">
                              {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                            </Tag>
                          </div>
                          <div className="product-stats">
                            <span className="stat-item">
                              Stock: {product.quantity}
                            </span>
                            <span className="stat-item">
                              Shipping: {product.shipping ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;