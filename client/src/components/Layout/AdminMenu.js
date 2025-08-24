import React from "react";
import { NavLink } from "react-router-dom";
import {
  PlusOutlined,
  ShoppingOutlined,
  SolutionOutlined,
  UserOutlined,
  GiftOutlined,
} from "@ant-design/icons";

const AdminMenu = () => {
  return (
    <>
      <div className="text-center">
        <div className="list-group dashboard-menu">
          <h4>Admin Panel</h4>

          <NavLink
            to="/dashboard/admin/create-category"
            className="list-group-item list-group-item-action"
          >
            <PlusOutlined /> Create Category
          </NavLink>

          <NavLink
            to="/dashboard/admin/create-product"
            className="list-group-item list-group-item-action"
          >
            <PlusOutlined /> Create Product
          </NavLink>

          <NavLink
            to="/dashboard/admin/products"
            className="list-group-item list-group-item-action"
          >
            <ShoppingOutlined /> Products
          </NavLink>

          <NavLink
            to="/dashboard/admin/orders"
            className="list-group-item list-group-item-action"
          >
            <SolutionOutlined /> Orders
          </NavLink>

          <NavLink
            to="/dashboard/admin/users"
            className="list-group-item list-group-item-action"
          >
            <UserOutlined /> Users
          </NavLink>

          {/* Offer Management Link */}
          <NavLink
            to="/dashboard/admin/offers"
            className="list-group-item list-group-item-action"
          >
            <GiftOutlined /> Offer Management
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default AdminMenu;
