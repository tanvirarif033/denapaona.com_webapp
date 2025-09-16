// src/components/Layout/Header.js
import React, { useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import { useCart } from "../../context/cart";
import { useNotifications } from "../../context/notifications";
import { Badge, Dropdown } from "antd";
import { ShoppingCartOutlined, BellOutlined } from "@ant-design/icons";
import useCategory from "../../hooks/useCategory";
import SearchInput from "../Form/SearchInput";

function formatDate(ts) {
  try {
    const d = ts ? new Date(ts) : null;
    return d ? d.toLocaleString() : "";
  } catch {
    return "";
  }
}

const Header = () => {
  const [auth, , logout] = useAuth();
  const [cart] = useCart();
  const { countUnread, items, markAllRead } = useNotifications();
  const categories = useCategory();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {}
  };

  // সর্বশেষ ২টা notification (notification page যে data দেয়, সেটাই context থেকে)
  const recent = useMemo(() => (items || []).slice(0, 2), [items]);

  // কাস্টম dropdown content: notification page-এর মত full data
  const notifPanel = (
    <div
      style={{
        width: 320,
        padding: 8,
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        boxShadow:
          "0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          padding: "6px 8px",
          fontWeight: 600,
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 6,
        }}
      >
        Notifications
      </div>

      {recent.length === 0 ? (
        <div style={{ padding: "10px 8px", color: "#888" }}>No notifications</div>
      ) : (
        recent.map((n) => {
          const title =
            n.title || n.message?.slice(0, 80) || "New notification";
          const desc =
            n.message || n.body || n.description || n.details || "";
          const created = n.createdAt || n.timestamp || n.time;
          const read = !!n.isRead;

          return (
            <div
              key={n._id || Math.random()}
              style={{
                padding: 8,
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                marginBottom: 8,
                background: read ? "#fff" : "#f6ffed", // unread হলে হালকা হাইলাইট
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                {!read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#52c41a",
                      display: "inline-block",
                      marginTop: 4,
                    }}
                  />
                )}
                <div style={{ fontWeight: 600, lineHeight: "1.2rem" }}>
                  {title}
                </div>
              </div>

              {desc && (
                <div
                  style={{
                    color: "#555",
                    fontSize: 13,
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {desc}
                </div>
              )}

              <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>
                {formatDate(created)}
              </div>
            </div>
          );
        })
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <button
          type="button"
          onClick={async () => {
            try {
              await markAllRead();
            } catch {}
          }}
          style={{
            border: "1px solid #d9d9d9",
            background: "#fff",
            borderRadius: 6,
            fontSize: 12,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          Mark all as read
        </button>
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          style={{
            border: "none",
            background: "transparent",
            color: "#1677ff",
            fontSize: 13,
            padding: "6px 6px",
            cursor: "pointer",
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarTogglerDemo01"
          aria-controls="navbarTogglerDemo01"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <Link to="/" className="navbar-brand">
          <img
            className="logo"
            src="/images/logo1.png"
            alt="logo"
            style={{ width: 150, height: "auto" }}
          />
        </Link>

        <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <SearchInput />

            <li className="nav-item">
              <NavLink to="/" className="nav-link">
                Home
              </NavLink>
            </li>

            <li className="nav-item dropdown">
              <Link
                className="nav-link dropdown-toggle"
                to={"/categories"}
                data-bs-toggle="dropdown"
              >
                Categories
              </Link>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to={"/categories"}>
                    All Categories
                  </Link>
                </li>
                {categories?.map((c) => (
                  <li key={c.slug}>
                    <Link className="dropdown-item" to={`/category/${c.slug}`}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* 🔔 Notifications */}
            {auth?.user && (
              <li className="nav-item notif-wrapper">
                <Dropdown
                  trigger={["click"]}
                  placement="bottomRight"
                  dropdownRender={() => notifPanel}
                >
                  <span className="nav-link" style={{ cursor: "pointer" }}>
                    <Badge
                      count={countUnread}
                      overflowCount={99}
                      showZero
                      offset={[6, -5]}
                    >
                      <BellOutlined style={{ fontSize: 22, color: "#fff" }} />
                    </Badge>
                  </span>
                </Dropdown>
              </li>
            )}

            {!auth.user ? (
              <>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">
                    Register
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    Login
                  </NavLink>
                </li>
              </>
            ) : (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#!" data-bs-toggle="dropdown">
                  {auth?.user?.name}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <NavLink
                      to={`/dashboard/${auth?.user?.role === 1 ? "admin" : "user"}`}
                      className="dropdown-item"
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <button className="dropdown-item" type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}

            <li className="nav-item">
              <Badge count={cart?.length} showZero offset={[10, -5]}>
                <NavLink to="/cart" className="nav-link">
                  <ShoppingCartOutlined style={{ fontSize: 22, marginRight: 5 }} />
                  Cart
                </NavLink>
              </Badge>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;