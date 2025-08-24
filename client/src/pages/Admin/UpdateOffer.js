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
  Row,
  Col,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

const UpdateOffer = () => {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offer, setOffer] = useState(null);
  const [form] = Form.useForm();

  const getOfferData = async () => {
    setLoading(true);
    try {
      const [offerRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(
          `https://denapaona-com-webapp-server.vercel.app/api/v1/offers/get-offer/${offerId}`
        ),
        axios.get(
          "https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product"
        ),
        axios.get(
          "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category"
        ),
      ]);

      if (offerRes.data?.success) {
        setOffer(offerRes.data.offer);
        form.setFieldsValue({
          ...offerRes.data.offer,
          startDate: moment(offerRes.data.offer.startDate),
          endDate: moment(offerRes.data.offer.endDate),
        });
      }

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
    if (offerId) {
      getOfferData();
    }
  }, [offerId]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.put(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/offers/update-offer/${offerId}`,
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
        toast.success("Offer updated successfully!");
        navigate("/dashboard/admin/offers");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  if (!offer) return <Spin />;

  return (
    <Layout title={"Dashboard - Update Offer"}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Update Offer</h1>
            <Spin spinning={loading}>
              <Card>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  {/* Same form fields as CreateOffer.js */}
                  {/* ... (copy the form fields from CreateOffer.js) ... */}

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Update Offer
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

export default UpdateOffer;
