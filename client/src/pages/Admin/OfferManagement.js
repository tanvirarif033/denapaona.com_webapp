// pages/Admin/OfferManagement.js - FIXED VERSION
import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
import {
  Select,
  DatePicker,
  Switch,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

const OfferManagement = () => {
  const [loading, setLoading] = useState(false);
  const [auth] = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form] = Form.useForm();

  // Get all categories
  const getAllCategories = async () => {
    setLoading(true);
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

  // Get all offers - FIXED
  const getAllOffers = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/offer/get-offers",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: auth?.token,
          },
        }
      );
      if (data?.success) {
        setOffers(data?.offers);
      }
    } catch (error) {
      console.log(error);
      message.error("Something went wrong in getting offers");
    }
  };

  // Get products by category - FIXED
  const getProductsByCategory = async (categoryId) => {
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/v1/offer/products-by-category/${categoryId}`,
        {
          headers: {
            Authorization: auth?.token,
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (data?.success) {
        setProducts(data?.products);
      }
    } catch (error) {
      console.log("Error fetching products:", error);
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllOffers();
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    getProductsByCategory(value);
    setSelectedProducts([]);
  };

  const handleProductChange = (value) => {
    setSelectedProducts(value);
  };

  const showModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      form.setFieldsValue({
        ...offer,
        startDate: moment(offer.startDate),
        endDate: moment(offer.endDate),
        category: offer.category._id,
        products: offer.products.map((p) => p._id),
        bannerImage: offer.bannerImage
          ? [{ uid: "-1", name: "banner.jpg" }]
          : undefined,
      });
      setSelectedCategory(offer.category._id);
      setSelectedProducts(offer.products.map((p) => p._id));
      getProductsByCategory(offer.category._id);
    } else {
      setEditingOffer(null);
      form.resetFields();
      setSelectedCategory("");
      setSelectedProducts([]);
      setProducts([]);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleSubmit = async (values) => {
    try {
      console.log("Form values:", values);

      const formData = new FormData();

      // Append all required fields
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("category", values.category);
      formData.append("discountType", values.discountType);
      formData.append("discountValue", values.discountValue);
      formData.append("startDate", values.startDate.format("YYYY-MM-DD"));
      formData.append("endDate", values.endDate.format("YYYY-MM-DD"));
      formData.append("isActive", values.isActive);

      // Append products array
      if (values.products && Array.isArray(values.products)) {
        values.products.forEach((product) => {
          formData.append("products", product);
        });
      }

      // FIXED: Handle banner image correctly
      if (
        values.bannerImage &&
        Array.isArray(values.bannerImage) &&
        values.bannerImage.length > 0
      ) {
        const bannerFile = values.bannerImage[0];
        if (bannerFile.originFileObj) {
          formData.append("bannerImage", bannerFile.originFileObj);
          console.log("Appending banner image:", bannerFile.originFileObj);
        }
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: auth?.token,
        },
      };

      // Debug: Log FormData entries
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      let response;
      if (editingOffer) {
        response = await axios.put(
          `http://localhost:8080/api/v1/offer/update-offer/${editingOffer._id}`,
          formData,
          config
        );
      } else {
        response = await axios.post(
          "http://localhost:8080/api/v1/offer/create-offer",
          formData,
          config
        );
      }

      if (response.data?.success) {
        message.success(
          editingOffer
            ? "Offer updated successfully"
            : "Offer created successfully"
        );
        getAllOffers();
        setIsModalVisible(false);
      } else {
        message.error(response.data?.error || "Operation failed");
      }
    } catch (error) {
      console.log("Full error:", error);
      console.log("Error response:", error.response?.data);

      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong";

      message.error(errorMessage);
    }
  };
  const handleDelete = async (offerId) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:8080/api/v1/offer/delete-offer/${offerId}`,
        {
          headers: {
            Authorization: auth?.token,
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        message.success("Offer deleted successfully");
        getAllOffers();
      }
    } catch (error) {
      console.log(error);
      message.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Offer Management"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Offer Management</h1>
            <div className="d-flex justify-content-end mb-3">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Create Offer
              </Button>
            </div>

            <div className="row">
              {offers.map((offer) => (
                <div key={offer._id} className="col-md-6 mb-3">
                  <Card
                    title={offer.title}
                    extra={
                      <span
                        className={`badge ${
                          offer.isActive ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                    }
                    actions={[
                      <EyeOutlined key="view" />,
                      <EditOutlined
                        key="edit"
                        onClick={() => showModal(offer)}
                      />,
                      <DeleteOutlined
                        key="delete"
                        onClick={() => handleDelete(offer._id)}
                      />,
                    ]}
                  >
                    <p>{offer.description}</p>
                    <p>
                      <strong>Discount:</strong> {offer.discountValue}{" "}
                      {offer.discountType === "percentage" ? "%" : "$"}
                    </p>
                    <p>
                      <strong>Period:</strong>{" "}
                      {moment(offer.startDate).format("MMM DD, YYYY")} -{" "}
                      {moment(offer.endDate).format("MMM DD, YYYY")}
                    </p>
                    <p>
                      <strong>Products:</strong> {offer.products.length}{" "}
                      products
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={editingOffer ? "Edit Offer" : "Create Offer"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            discountType: "percentage",
            isActive: true,
          }}
        >
          <Form.Item
            label="Offer Title"
            name="title"
            rules={[{ required: true, message: "Please input offer title!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please input offer description!" },
            ]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select
              onChange={handleCategoryChange}
              placeholder="Select category"
            >
              {categories.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Products"
            name="products"
            rules={[{ required: true, message: "Please select products!" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select products"
              onChange={handleProductChange}
              value={selectedProducts}
              disabled={!selectedCategory}
            >
              {products.map((p) => (
                <Option key={p._id} value={p._id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Discount Type"
            name="discountType"
            rules={[
              { required: true, message: "Please select discount type!" },
            ]}
          >
            <Select>
              <Option value="percentage">Percentage</Option>
              <Option value="fixed">Fixed Amount</Option>
              <Option value="bogo">Buy One Get One</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Discount Value"
            name="discountValue"
            rules={[
              { required: true, message: "Please input discount value!" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: "Please select start date!" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: "Please select end date!" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Banner Image"
            name="bannerImage"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                required: !editingOffer,
                message: "Please upload a banner image!",
              },
            ]}
          >
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingOffer ? "Update Offer" : "Create Offer"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default OfferManagement;
