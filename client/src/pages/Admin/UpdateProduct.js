import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select, Card, Input, Button, Upload, Image, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { UploadOutlined, SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import "../../styles/UpdateProduct.css";

const { Option } = Select;
const { TextArea } = Input;

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  const [photo, setPhoto] = useState(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getSingleProduct = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/product/get-product/${params.slug}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setName(data.product.name);
      setId(data.product._id);
      setDescription(data.product.description);
      setPrice(data.product.price);
      setQuantity(data.product.quantity);
      setShipping(data.product.shipping ? "1" : "0");
      setCategory(data.product.category._id);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSingleProduct();
  }, [params.slug]);

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category");
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      if (photo) productData.append("photo", photo);
      productData.append("category", category);
      productData.append("shipping", shipping);
      
      const { data } = await axios.put(
        `http://localhost:8080/api/v1/product/update-product/${id}`,
        productData
      );
      
      if (data?.success) {
        toast.success("Product Updated Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      let answer = window.prompt("Are you sure you want to delete this product? Type 'yes' to confirm.");
      if (answer?.toLowerCase() !== 'yes') return;

      const response = await axios.delete(
        `http://localhost:8080/api/v1/product/delete-product/${id}`
      );

      if (response.status === 200 && response.data?.success) {
        toast.success("Product Deleted Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(response.data?.message || "Failed to delete the product.");
      }
    } catch (error) {
      console.error("Error details:", error);
      toast.error("Something went wrong");
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      setPhoto(file);
      return false;
    },
    maxCount: 1,
  };

  return (
    <Layout title={"Dashboard - Update Product"}>
      <div className="update-product-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>Update Product</h1>
            </div>
            
            <Spin spinning={loading}>
              <Card className="product-form-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category</label>
                    <Select
                      placeholder="Select a category"
                      size="large"
                      className="form-select"
                      onChange={setCategory}
                      value={category}
                    >
                      {categories?.map((c) => (
                        <Option key={c._id} value={c._id}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div className="form-group">
                    <label>Product Image</label>
                    <Upload {...uploadProps} className="image-upload">
                      <Button icon={<UploadOutlined />}>
                        {photo ? photo.name : "Change Image"}
                      </Button>
                    </Upload>
                    <div className="image-preview">
                      <Image
                        src={photo ? URL.createObjectURL(photo) : 
                          `http://localhost:8080/api/v1/product/product-photo/${id}`}
                        alt="product preview"
                        className="preview-image"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Product Name</label>
                    <Input
                      placeholder="Enter product name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="large"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <TextArea
                      placeholder="Enter product description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      size="large"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price ($)</label>
                    <Input
                      type="number"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      size="large"
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      size="large"
                    />
                  </div>

                  <div className="form-group">
                    <label>Shipping</label>
                    <Select
                      placeholder="Select shipping option"
                      size="large"
                      className="form-select"
                      onChange={setShipping}
                      value={shipping}
                    >
                      <Option value="0">No</Option>
                      <Option value="1">Yes</Option>
                    </Select>
                  </div>
                </div>

                <div className="form-actions">
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={handleUpdate}
                    icon={<SaveOutlined />}
                    className="update-btn"
                    loading={updating}
                  >
                    Update Product
                  </Button>
                  <Button 
                    type="primary" 
                    danger
                    size="large" 
                    onClick={handleDelete}
                    icon={<DeleteOutlined />}
                    className="delete-btn"
                  >
                    Delete Product
                  </Button>
                </div>
              </Card>
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;