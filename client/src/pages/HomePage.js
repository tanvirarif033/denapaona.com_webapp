import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import { useCart } from "../context/cart";
import { Checkbox, Radio, Spin, Carousel } from "antd";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";
import { useNavigate } from "react-router-dom";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  

  // Function to fetch all categories
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

 
axios.get('https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category', {
  headers: {
    'x-api-key': 'rnaei23ndfwe3nke'
  }
})
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response ? error.response.data : error.message);
  });


  // Function to fetch all products
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-list/${page}`
      );
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get total count of products
  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-count"
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

  // Load more products
  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-list/${page}`
      );
      setProducts([...products, ...data?.products]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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

  // Reset filters function
  const resetFilters = () => {
    setChecked([]);
    setRadio([]);
    getAllProducts();
  };

  return (
    <Layout title={"All products-Best Offers"}>
      <Carousel autoplay>
        <div>
          <img
            src="/images/img1.webp"
            alt="Slide 1"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/img2.webp"
            alt="Slide 2"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/img5.webp"
            alt="Slide 3"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
        <div>
          <img
            src="/images/img3.jpg"
            alt="Slide 4"
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
        </div>
      </Carousel>

      <div className="row mt-3">
        <div className="col-md-3">
          <h4 className="text-left">Filter By Category</h4>
          <div className="d-flex flex-column">
            {loading ? (
              <Spin size="large" />
            ) : (
              categories?.map((c) => (
                <Checkbox
                  key={c._id}
                  checked={checked.includes(c._id)} // Set checked state
                  onChange={(e) => handleFilter(e.target.checked, c._id)}
                >
                  {c.name}
                </Checkbox>
              ))
            )}
          </div>

          <h4 className="text-left mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            {loading ? (
              <Spin size="large" />
            ) : (
              <Radio.Group
                value={radio} // Set selected radio value
                onChange={(e) => setRadio(e.target.value)}
              >
                {Prices?.map((p) => (
                  <div key={p._id}>
                    <Radio value={p.array}>{p.name}</Radio>
                  </div>
                ))}
              </Radio.Group>
            )}
          </div>
          <div className="d-flex flex-column m-2">
            <button className="btn btn-danger" onClick={resetFilters}>
              RESET FILTERS
            </button>
          </div>
        </div>
        <div className="col-md-9">
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
                        onClick={() => {
                          setCart([...cart, p]);
                          localStorage.setItem(
                            "cart",
                            JSON.stringify([...cart, p])
                          );
                          toast.success("Item Added to Cart");
                        }}
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
