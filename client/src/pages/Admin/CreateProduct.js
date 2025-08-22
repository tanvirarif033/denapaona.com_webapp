import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select, Spin, Card, Input, Button, Upload } from "antd";
import { useNavigate } from "react-router-dom";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import "../../styles/CreateProduct.css";

const { Option } = Select;
const { TextArea } = Input;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(false);

  // Get all categories
  const getAllCategory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setCategories(data?.category);
      } else {
        toast.error(data?.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Create product function
  const handleCreate = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      productData.append("photo", photo);
      productData.append("category", category);
      productData.append("shipping", shipping);
      
      const { data } = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/create-product",
        productData
      );
      
      if (data?.success) {
        toast.success("Product Created Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message || "Failed to create product");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
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
    <Layout title={"Dashboard - Create Product"}>
      <div className="create-product-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>Create Product</h1>
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
                        {photo ? photo.name : "Select Image"}
                      </Button>
                    </Upload>
                    {photo && (
                      <div className="image-preview">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt="product preview"
                          className="preview-image"
                        />
                      </div>
                    )}
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
                    onClick={handleCreate}
                    icon={<PlusOutlined />}
                    className="create-btn"
                    disabled={!name || !description || !price || !category || !quantity || !photo}
                  >
                    Create Product
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

export default CreateProduct;