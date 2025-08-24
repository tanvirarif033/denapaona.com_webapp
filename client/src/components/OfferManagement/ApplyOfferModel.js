import React, { useState } from "react";
import { Modal, List, Checkbox, Button, Spin, Empty, message } from "antd";
import { GiftOutlined } from "@ant-design/icons";

const ApplyOfferModal = ({
  visible,
  onCancel,
  onApply,
  products = [],
  loading,
  offer,
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleApply = () => {
    if (selectedProducts.length === 0) {
      message.warning("Please select at least one product");
      return;
    }

    onApply(selectedProducts);
    setSelectedProducts([]);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  return (
    <Modal
      title={
        <span>
          <GiftOutlined /> Apply Offer: {offer?.name}
        </span>
      }
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          loading={loading}
        >
          Apply to Selected Products
        </Button>,
      ]}
      width={600}
    >
      <div className="apply-offer-modal">
        <div className="select-all" style={{ marginBottom: 16 }}>
          <Checkbox
            onChange={(e) => handleSelectAll(e.target.checked)}
            checked={selectedProducts.length === products.length}
          >
            Select All Products
          </Checkbox>
        </div>

        <Spin spinning={loading}>
          {products.length === 0 ? (
            <Empty description="No products available" />
          ) : (
            <List
              dataSource={products}
              renderItem={(product) => (
                <List.Item>
                  <Checkbox
                    checked={selectedProducts.includes(product._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts([...selectedProducts, product._id]);
                      } else {
                        setSelectedProducts(
                          selectedProducts.filter((id) => id !== product._id)
                        );
                      }
                    }}
                  >
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">${product.price}</div>
                    </div>
                  </Checkbox>
                </List.Item>
              )}
            />
          )}
        </Spin>

        <div className="selected-count" style={{ marginTop: 16 }}>
          Selected: {selectedProducts.length} product(s)
        </div>
      </div>
    </Modal>
  );
};

export default ApplyOfferModal;
