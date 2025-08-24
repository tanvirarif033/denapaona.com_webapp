import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import {
  OfferForm,
  OffersList,
  OfferCard,
  ApplyOfferModal,
} from "../../components/OfferManagement";
import toast from "react-hot-toast";
import axios from "axios";
import { Modal, Tabs, Row, Col, Button, Form } from "antd"; // ADD Button AND Form IMPORTS
import { useNavigate } from "react-router-dom";
import moment from "moment";

const { TabPane } = Tabs;

const OfferManagement = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [form] = Form.useForm(); // ADD FORM INSTANCE

const fetchData = async () => {
  setLoading(true);
  try {
    const [offersRes, productsRes, categoriesRes] = await Promise.all([
      axios.get("http://localhost:8080/api/v1/offers/get-offer", {
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      }),
      axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      ),
      axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      ),
    ]);

    if (offersRes.data?.success) setOffers(offersRes.data.offers);
    if (productsRes.data?.success) setProducts(productsRes.data.products);
    if (categoriesRes.data?.success) setCategories(categoriesRes.data.category);
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error("Failed to fetch data");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOffer = async (values) => {
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
        setModalVisible(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (offerId, isActive) => {
    try {
      const { data } = await axios.put(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/offers/update-offer/${offerId}`,
        { isActive }
      );
      if (data?.success) {
        toast.success(`Offer ${isActive ? "activated" : "deactivated"}`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update offer status");
    }
  };

  const handleDelete = async (offer) => {
    Modal.confirm({
      title: "Delete Offer",
      content: `Are you sure you want to delete "${offer.name}"?`,
      onOk: async () => {
        try {
          const { data } = await axios.delete(
            `https://denapaona-com-webapp-server.vercel.app/api/v1/offers/delete-offer/${offer._id}`
          );
          if (data?.success) {
            toast.success("Offer deleted successfully");
            fetchData();
          }
        } catch (error) {
          toast.error("Failed to delete offer");
        }
      },
    });
  };

  const handleApplyOffer = async (productIds) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/offers/apply-to-products",
        {
          offerId: selectedOffer._id,
          productIds,
        }
      );

      if (data?.success) {
        toast.success("Offer applied to products successfully!");
        setApplyModalVisible(false);
        setSelectedOffer(null);
      }
    } catch (error) {
      toast.error("Failed to apply offer to products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Dashboard - Offer Management">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <Tabs
              defaultActiveKey="offers"
              tabBarExtraContent={{
                right: (
                  <Button type="primary" onClick={() => setModalVisible(true)}>
                    Create New Offer
                  </Button>
                ),
              }}
            >
              <TabPane tab="Offers List" key="offers">
                <OffersList
                  offers={offers}
                  loading={loading}
                  onEdit={(offer) =>
                    navigate(`/dashboard/admin/update-offer/${offer._id}`)
                  }
                  onDelete={handleDelete}
                  onView={(offer) => setSelectedOffer(offer)}
                  onStatusChange={handleStatusChange}
                  onCreate={() => setModalVisible(true)}
                />
              </TabPane>

              <TabPane tab="Grid View" key="grid">
                <Row gutter={[16, 16]}>
                  {offers.map((offer) => (
                    <Col key={offer._id} xs={24} sm={12} lg={8}>
                      <OfferCard
                        offer={offer}
                        onEdit={(offer) =>
                          navigate(`/dashboard/admin/update-offer/${offer._id}`)
                        }
                        onDelete={handleDelete}
                        onApply={(offer) => {
                          setSelectedOffer(offer);
                          setApplyModalVisible(true);
                        }}
                        onStatusChange={handleStatusChange}
                      />
                    </Col>
                  ))}
                </Row>
              </TabPane>
            </Tabs>

            {/* Create/Edit Offer Modal */}
            <Modal
              title="Create New Offer"
              visible={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={null}
              width={800}
            >
              <OfferForm
                onSubmit={handleCreateOffer}
                loading={loading}
                products={products}
                categories={categories}
              />
            </Modal>

            {/* Apply Offer Modal */}
            <ApplyOfferModal
              visible={applyModalVisible}
              onCancel={() => {
                setApplyModalVisible(false);
                setSelectedOffer(null);
              }}
              onApply={handleApplyOffer}
              products={products}
              loading={loading}
              offer={selectedOffer}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OfferManagement;
