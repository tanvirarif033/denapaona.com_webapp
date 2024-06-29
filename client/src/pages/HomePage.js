import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/auth";
import axios from "axios";
import { Checkbox } from "antd";

const HomePage = () => {
  const [auth, setAuth] = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Function to fetch all categories
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category"
      );
      if (data.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Function to fetch all products
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product"
      );
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllProducts();
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = (category) => (e) => {
    console.log(`Category ${category.name} checked:`, e.target.checked);
    // Implement your logic here for handling checkbox change
  };

  console.log("Categories State:", categories); // Log the categories state

  return (
    <Layout title={"Best Offers"}>
      <div className="row mt-3">
        <div className="col-md-3">
          <h4 className="text-center">Filter By Category</h4>
          {/* {categories?.map((c) => (
            <div key={c._id}>
              <Checkbox onChange={handleCheckboxChange(c)}>{c.name}</Checkbox>
            </div>
          ))} */}
        </div>
        <div className="col-md-9">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap">
            {products?.map((p) => (
              <div className="card m-2" style={{ width: "18rem" }} key={p._id}>
                <img
                  src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">{p.description}</p>
                  <button className="btn btn-primary ms-1">More Details</button>
                  <button className="btn btn-secondary ms-1">
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
