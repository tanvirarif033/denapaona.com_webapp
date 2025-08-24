import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Card,
  Spin,
  Switch,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

const CreateOffer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();

  // Get all products and categories
  const getProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(
          "https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product"
        ),
        axios.get(
          "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category"
        ),
      ]);

      if (productsRes.data?.success) {
        setProducts(productsRes.data.products);
      }
      if (categoriesRes.data?.success) {
        setCategories(categoriesRes.data.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductsAndCategories();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/offers/create-offer",
        {
          ...values,
          startDate: values.startDate.format(),
          endDate: values.endDate.format(),
          discountValue: Number(values.discountValue),
          minPurchaseAmount: values.minPurchaseAmount
            ? Number(values.minPurchaseAmount)
            : 0,
          maxDiscountAmount: values.maxDiscountAmount
            ? Number(values.maxDiscountAmount)
            : null,
          usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
        }
      );

      if (data?.success) {
        toast.success("Offer created successfully!");
        navigate("/dashboard/admin/offers");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={"Dashboard - Create Offer"}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Create New Offer</h1>
            <Spin spinning={loading}>
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    isActive: true,
                    discountType: "percentage",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Offer Name"
                        name="name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter offer name",
                          },
                        ]}
                      >
                        <Input placeholder="e.g., Summer Sale 2024" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Discount Type"
                        name="discountType"
                        rules={[
                          {
                            required: true,
                            message: "Please select discount type",
                          },
                        ]}
                      >
                        <Select>
                          <Option value="percentage">Percentage (%)</Option>
                          <Option value="fixed">Fixed Amount ($)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[
                      { required: true, message: "Please enter description" },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Offer description..." />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Discount Value"
                        name="discountValue"
                        rules={[
                          {
                            required: true,
                            message: "Please enter discount value",
                          },
                        ]}
                      >
                        <Input type="number" placeholder="e.g., 20" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Min Purchase Amount"
                        name="minPurchaseAmount"
                      >
                        <Input type="number" placeholder="e.g., 100" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Max Discount Amount"
                        name="maxDiscountAmount"
                      >
                        <Input type="number" placeholder="e.g., 500" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Start Date"
                        name="startDate"
                        rules={[
                          {
                            required: true,
                            message: "Please select start date",
                          },
                        ]}
                      >
                        <DatePicker
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="End Date"
                        name="endDate"
                        rules={[
                          { required: true, message: "Please select end date" },
                        ]}
                      >
                        <DatePicker
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Applicable Products"
                        name="applicableProducts"
                      >
                        <Select mode="multiple" placeholder="Select products">
                          {products.map((product) => (
                            <Option key={product._id} value={product._id}>
                              {product.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Applicable Categories"
                        name="applicableCategories"
                      >
                        <Select mode="multiple" placeholder="Select categories">
                          {categories.map((category) => (
                            <Option key={category._id} value={category._id}>
                              {category.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Usage Limit" name="usageLimit">
                        <Input type="number" placeholder="e.g., 1000" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Active Status"
                        name="isActive"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Create Offer
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOffer;
