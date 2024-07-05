import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import { useCart } from "../context/cart";
import { Checkbox, Radio } from 'antd';
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";
import { useNavigate } from "react-router-dom";
const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);

  // Function to fetch all categories
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Something went wrong in getting category");
    }
  };

  useEffect(() => {
    getAllCategory();
    getAllProducts();
  }, []);

  // Function to fetch all products
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get("https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product");
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Handle checkbox change
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };

  useEffect(() => {
    if (!checked.length || !radio.length) getAllProducts();
  }, [checked.length, radio.length]);

  useEffect(() => {
    if (checked.length || radio.length) filterProduct();
  }, [checked, radio]);

  // Get filtered products
  const filterProduct = async () => {
    try {
      console.log("Sending filter request with payload:", { checked, radio });
      const { data } = await axios.post("https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-filters", {
        checked,
        radio,
      });
      setProducts(data?.products);
    } catch (error) {
      console.error("Error fetching filtered products:", error);
      toast.error("Something went wrong in fetching filtered products");
    }
  };
  

  return (
    <Layout title={"All products-Best Offers"}>
      <div className="row mt-3">
        <div className="col-md-3">
        <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories?.map((c) => (
              <Checkbox
                key={c._id}
                onChange={(e) => handleFilter(e.target.checked, c._id)}
              >
                {c.name}
              </Checkbox>
            ))}
          </div>
          
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            <Radio.Group onChange={(e) => setRadio(e.target.value)}>
              {Prices?.map((p) => (
                <div key={p._id}>
                  <Radio value={p.array}>{p.name}</Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
          <div className="d-flex flex-column m-2">
            <button
              className="btn btn-danger"
              onClick={() => window.location.reload()}
            >
              RESET FILTERS
            </button>
          </div>
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
                  <p className="card-text">{p.description.substring(0, 20)}...</p>
                  <p className="card-text">$ {p.price}</p>
                  <button className="btn btn-primary ms-1"
                  onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details</button>
                  <button className="btn btn-secondary ms-1"
                  onClick={()=>{
                    setCart([...cart,p]);
                    localStorage.setItem(
                      "cart",
                      JSON.stringify([...cart, p])
                    );

                    toast.success("Item Added to Cart");
                  }}>
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
