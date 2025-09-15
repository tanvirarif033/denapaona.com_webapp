import React from "react";
import { NavLink } from "react-router-dom";

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
            Create Category
          </NavLink>
          <NavLink
            to="/dashboard/admin/create-product"
            className="list-group-item list-group-item-action"
          >
            Create Product
          </NavLink>
          <NavLink
            to="/dashboard/admin/products"
            className="list-group-item list-group-item-action"
          >
            Products
          </NavLink>
          <NavLink
            to="/dashboard/admin/orders"
            className="list-group-item list-group-item-action"
          >
            Orders
          </NavLink>
          <NavLink
            to="/dashboard/admin/users"
            className="list-group-item list-group-item-action"
          >
            Users
          </NavLink>
          <NavLink
            to="/dashboard/admin/offers"
            className="list-group-item list-group-item-action"
          >
            Offer Management
          </NavLink>
          <NavLink
            to="/dashboard/admin/chat"
            className="list-group-item list-group-item-action"
          >
            Chat
          </NavLink>
          <NavLink
            to="/dashboard/admin/analytics"
            className="list-group-item list-group-item-action"
          >
            Sales Analytics
          </NavLink>
          <NavLink
            to="/dashboard/admin/return-requests"
            className="list-group-item list-group-item-action"
          >
            Return Request
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default AdminMenu;
