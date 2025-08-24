import React from "react";
import { Table, Tag, Space, Button, Switch, Card, Empty } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import moment from "moment";

const OffersList = ({
  offers,
  loading,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  onCreate,
}) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <span style={{ fontWeight: "bold" }}>{text}</span>
      ),
    },
    {
      title: "Discount",
      dataIndex: "discountValue",
      key: "discount",
      render: (value, record) => (
        <Tag color="blue">
          {record.discountType === "percentage" ? `${value}%` : `$${value}`}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive, record) => {
        const now = moment();
        const start = moment(record.startDate);
        const end = moment(record.endDate);

        let status = "Inactive";
        let color = "red";

        if (isActive) {
          if (now.isBefore(start)) {
            status = "Upcoming";
            color = "blue";
          } else if (now.isAfter(end)) {
            status = "Expired";
            color = "orange";
          } else {
            status = "Active";
            color = "green";
          }
        }

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Validity Period",
      key: "validity",
      render: (_, record) => (
        <div>
          <div>{moment(record.startDate).format("MMM D, YYYY")}</div>
          <div>to</div>
          <div>{moment(record.endDate).format("MMM D, YYYY")}</div>
        </div>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => (
        <span>
          {record.usedCount || 0} / {record.usageLimit || "∞"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onView(record)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => onDelete(record)}
          >
            Delete
          </Button>
          <Switch
            size="small"
            checked={record.isActive}
            onChange={(checked) => onStatusChange(record._id, checked)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Offers Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Create New Offer
        </Button>
      </div>

      <Card>
        {offers.length === 0 && !loading ? (
          <Empty
            description="No offers found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={onCreate}>
              Create Your First Offer
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={offers}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} offers`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};

export default OffersList;
 