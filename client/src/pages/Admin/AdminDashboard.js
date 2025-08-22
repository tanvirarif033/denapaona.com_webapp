import React from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import { useAuth } from "../../context/auth";
import { Card, Row, Col, Typography, Avatar, Divider } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import "../../styles/AdminDashboard.css";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [auth] = useAuth();
  
  return (
    <Layout>
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <Title level={2}>Admin Dashboard</Title>
          <Text className="welcome-text">Welcome back, {auth?.user?.name}</Text>
        </div>
        
        <Divider />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <div className="admin-menu-container">
              <AdminMenu />
            </div>
          </Col>
          
          <Col xs={24} md={18}>
            <Card className="admin-profile-card">
              <div className="profile-header">
                <Avatar size={64} icon={<UserOutlined />} className="admin-avatar" />
                <Title level={3} className="admin-name">{auth?.user?.name}</Title>
                <Text className="admin-role">Administrator</Text>
              </div>
              
              <Divider />
              
              <div className="admin-info">
                <div className="info-item">
                  <MailOutlined className="info-icon" />
                  <div className="info-content">
                    <Text className="info-label">Email Address</Text>
                    <Text className="info-value">{auth?.user?.email}</Text>
                  </div>
                </div>
                
                <div className="info-item">
                  <PhoneOutlined className="info-icon" />
                  <div className="info-content">
                    <Text className="info-label">Contact Number</Text>
                    <Text className="info-value">{auth?.user?.phone || "Not provided"}</Text>
                  </div>
                </div>
                
                <div className="info-item">
                  <UserOutlined className="info-icon" />
                  <div className="info-content">
                    <Text className="info-label">Account Status</Text>
                    <Text className="info-value status-active">Active</Text>
                  </div>
                </div>
              </div>
            </Card>
          
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default AdminDashboard;