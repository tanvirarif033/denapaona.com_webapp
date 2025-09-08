// src/pages/Notifications.js
import React, { useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useNotifications } from "../context/notifications";
import { List, Button, Badge } from "antd";
import { useNavigate } from "react-router-dom";
import "../styles/Notifications1.css";

const NotificationsPage = () => {
  const { items, countUnread, markAllRead, reload } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => { reload(); }, []); // ensure latest from server

  return (
    <Layout title="Notifications">
      <div className="notif-page">
        <div className="notif-page-header">
          <h2>Notifications</h2>
          <Badge count={countUnread} showZero>
            <Button onClick={markAllRead}>Mark all as read</Button>
          </Badge>
        </div>

        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(n) => (
            <List.Item
              key={n._id}
              className={`notif-row ${n.isRead ? "" : "notif-row-unread"}`}
              onClick={() => navigate(n.link || "/")}
            >
              <List.Item.Meta
                title={<div className="notif-row-title">{n.title}</div>}
                description={
                  <div className="notif-row-desc">
                    <div>{n.text}</div>
                    <div className="notif-row-time">{new Date(n.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Layout>
  );
};

export default NotificationsPage;
