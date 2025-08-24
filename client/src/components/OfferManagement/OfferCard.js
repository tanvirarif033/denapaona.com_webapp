import React from "react";
import { Card, Tag, Progress, Button, Space } from "antd";
import {
  GiftOutlined,
  CalendarOutlined,
  UserOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import moment from "moment";

const OfferCard = ({ offer, onEdit, onDelete, onApply, onStatusChange }) => {
  const now = moment();
  const start = moment(offer.startDate);
  const end = moment(offer.endDate);

  const isValid = offer.isActive && now.isBetween(start, end);
  const usagePercentage = offer.usageLimit
    ? (offer.usedCount / offer.usageLimit) * 100
    : 0;

  return (
    <Card
      className="offer-card"
      title={
        <div className="d-flex justify-content-between align-items-center">
          <span>
            <GiftOutlined /> {offer.name}
          </span>
          <Tag color={isValid ? "green" : "red"}>
            {isValid ? "Active" : "Inactive"}
          </Tag>
        </div>
      }
      extra={
        <Space>
          <Button size="small" onClick={() => onEdit(offer)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDelete(offer)}>
            Delete
          </Button>
        </Space>
      }
    >
      <div className="offer-content">
        <p>{offer.description}</p>

        <div className="offer-details">
          <div className="offer-discount">
            <Tag color="blue" style={{ fontSize: "16px", padding: "8px" }}>
              {offer.discountType === "percentage"
                ? `${offer.discountValue}% OFF`
                : `$${offer.discountValue} OFF`}
            </Tag>
          </div>

          <div className="offer-dates">
            <div>
              <CalendarOutlined /> Start:{" "}
              {moment(offer.startDate).format("MMM D, YYYY")}
            </div>
            <div>
              <CalendarOutlined /> End:{" "}
              {moment(offer.endDate).format("MMM D, YYYY")}
            </div>
          </div>

          {offer.usageLimit && (
            <div className="offer-usage">
              <div className="d-flex justify-content-between">
                <span>
                  <UserOutlined /> Usage
                </span>
                <span>
                  {offer.usedCount || 0} / {offer.usageLimit}
                </span>
              </div>
              <Progress
                percent={Math.min(usagePercentage, 100)}
                size="small"
                status={usagePercentage >= 80 ? "exception" : "normal"}
              />
            </div>
          )}

          {offer.minPurchaseAmount > 0 && (
            <div className="offer-min-purchase">
              <ShoppingOutlined /> Min purchase: ${offer.minPurchaseAmount}
            </div>
          )}
        </div>

        <div className="offer-actions">
          <Button
            type="primary"
            size="small"
            onClick={() => onApply(offer)}
            disabled={!isValid}
          >
            Apply to Products
          </Button>
          <Switch
            size="small"
            checked={offer.isActive}
            onChange={(checked) => onStatusChange(offer._id, checked)}
          />
        </div>
      </div>
    </Card>
  );
};

export default OfferCard;
