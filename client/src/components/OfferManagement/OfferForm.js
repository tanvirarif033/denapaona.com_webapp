import React from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  Card,
} from "antd";
import { GiftOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const OfferForm = ({
  onSubmit,
  loading,
  initialValues,
  products = [],
  categories = [],
  form,
}) => {
  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          isActive: true,
          discountType: "percentage",
          ...initialValues,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Offer Name"
              name="name"
              rules={[{ required: true, message: "Please enter offer name" }]}
            >
              <Input
                placeholder="e.g., Summer Sale 2024"
                prefix={<GiftOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Discount Type"
              name="discountType"
              rules={[
                { required: true, message: "Please select discount type" },
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
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <TextArea rows={3} placeholder="Offer description..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Discount Value"
              name="discountValue"
              rules={[
                { required: true, message: "Please enter discount value" },
              ]}
            >
              <Input type="number" placeholder="e.g., 20" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Min Purchase Amount" name="minPurchaseAmount">
              <Input type="number" placeholder="e.g., 100" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Discount Amount" name="maxDiscountAmount">
              <Input type="number" placeholder="e.g., 500" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Please select start date" }]}
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
              rules={[{ required: true, message: "Please select end date" }]}
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
            <Form.Item label="Applicable Products" name="applicableProducts">
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
            {initialValues ? "Update Offer" : "Create Offer"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OfferForm;
