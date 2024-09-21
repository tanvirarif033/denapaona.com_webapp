import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import { useCart } from "../context/cart";
import { Checkbox, Radio, Spin, Carousel } from "antd";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";
import { useNavigate } from "react-router-dom";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [auth] = useAuth();
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // Load user-specific cart when user logs in
  useEffect(() => {
    if (auth?.user) {
      const savedCart = localStorage.getItem(`cart-${auth.user.email}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart)); // Restore the cart from localStorage if it exists
      } else {
        setCart([]); // Initialize the cart as empty if nothing is found in localStorage
      }
    } else {
      setCart([]); // Reset the cart when the user logs out
    }
  }, [auth?.user, setCart]);

  const getAllCategory = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Something went wrong in getting category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
    getAllProducts();
    getTotal();
  }, []);

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-list/${page}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-count",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-list/${page}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts([...products, ...data?.products]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterProduct = async () => {
    try {
      setFilterLoading(true);
      console.log("Sending filter request with payload:", { checked, radio });
      const { data } = await axios.post(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-filters",
        {
          checked,
          radio,
        }
      );
      setProducts(data?.products);
    } catch (error) {
      console.error("Error fetching filtered products:", error);
      toast.error("Something went wrong in fetching filtered products");
    } finally {
      setFilterLoading(false);
    }
  };

  const resetFilters = () => {
    setChecked([]);
    setRadio([]);
    getAllProducts();
  };
  const handleAddToCart = (product) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login"); // Redirect to login page if not authenticated
    } else {
      const updatedCart = [...cart, product];
      setCart(updatedCart);
      localStorage.setItem(
        `cart-${auth.user.email}`,
        JSON.stringify(updatedCart)
      ); // Save cart associated with user's email
      toast.success("Item Added to Cart");
    }
  };
  return (
    <Layout title={"All products-Best Offers"}>
      <Carousel autoplay>
        <div>
          <img
            src="/images/c1.png"
            alt="Slide 1"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/c2.png"
            alt="Slide 2"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/c3.png"
            alt="Slide 3"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/c41.png"
            alt="Slide 4"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
      </Carousel>

      <div className="filter-section">
        <div className="filter-category">
          <h4>Filter By Category</h4>
          <div className="filter-checkboxes">
            {loading ? (
              <Spin size="large" />
            ) : (
              categories?.map((c) => (
                <Checkbox
                  key={c._id}
                  checked={checked.includes(c._id)}
                  onChange={(e) => handleFilter(e.target.checked, c._id)}
                >
                  {c.name}
                </Checkbox>
              ))
            )}
          </div>

          <div className="filter-price">
            <h4>Filter By Price</h4>
            <div className="filter-radios">
              {loading ? (
                <Spin size="large" />
              ) : (
                <Radio.Group
                  value={radio}
                  onChange={(e) => setRadio(e.target.value)}
                >
                  {Prices?.map((p) => (
                    <Radio value={p.array} key={p._id}>
                      {p.name}
                    </Radio>
                  ))}
                </Radio.Group>
              )}
            </div>
          </div>
          <button className="btn btn-danger" onClick={resetFilters}>
            RESET FILTERS
          </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-md-12">
          <h1 className="text-left">All Products</h1>
          {loading ? (
            <Spin
              size="large"
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "50vh" }}
            />
          ) : (
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div
                  className="card m-2"
                  style={{ width: "18rem" }}
                  key={p._id}
                >
                  <img
                    src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">
                      {p.description.substring(0, 20)}...
                    </p>
                    <p className="card-text">$ {p.price}</p>
                    <div className="d-flex justify-content-between">
                      <button
                        className="btn btn-link text-decoration-none"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      <button
                        className="btn btn-link text-decoration-none"
                        onClick={() => handleAddToCart(p)} // Use the new handler here
                      >
                        Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="m-2 p-3">
            {products && products.length < total && (
              <button
                className="btn btn-warning"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <>
                    Loadmore <AiOutlineReload />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
