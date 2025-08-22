import React from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout/Layout";
import { Spin } from "antd";
import "../styles/Categories.css";

const Categories = () => {
  const categories = useCategory();

  return (
    <Layout title={"All Categories"}>
      <div className="categories-container">
        <div className="categories-header">
          <h1>Product Categories</h1>
          <p>Browse products by category</p>
        </div>
        
        <div className="categories-grid">
          {categories.map((c) => (
            <Link to={`/category/${c.slug}`} className="category-card-link" key={c._id}>
              <div className="category-card">
                <div className="category-icon">
                  <span className="category-emoji">📁</span>
                </div>
                <div className="category-info">
                  <h3 className="category-name">{c.name}</h3>
                  <p className="category-desc">Explore {c.name} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;