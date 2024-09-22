import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/cart"; // Import useCart
import { useAuth } from "../context/auth"; // Import useAuth
import toast from "react-hot-toast"; // Import toast for notifications

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [cart, setCart] = useCart(); // Use cart hook
  const [auth] = useAuth(); // Use auth hook

  useEffect(() => {
    if (params?.slug) getPrductsByCat();
  }, [params?.slug]);

  const getPrductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-category/${params.slug}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddToCart = (product) => {
    if (!auth?.user) {
      toast.error("Please log in to add items to the cart");
      navigate("/login"); // Redirect to login page if not authenticated
    } else {
      const updatedCart = [...cart, product];
      setCart(updatedCart);
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(updatedCart)); // Save cart associated with user's email
      toast.success("Item Added to Cart");
    }
  };

  return (
    <Layout>
      <div className="container mt-3">
        <h4 className="text-center">Category - {category?.name}</h4>
        <h6 className="text-center">{products?.length} result(s) found</h6>
        <div className="row">
          <div className="col-md-9 offset-1">
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
                     <h5 className="card-title bold">{p.name}</h5>
                    <p className="card-text">
                      {p.description.substring(0, 20)}...
                    </p>
                    <p className="card-text1">
              <span style={{ color: "green" }}>$</span> {p.price}   
                </p>
                    <button
                      className="btn btn-link text-decoration-none"
                      onClick={() => navigate(`/product/${p.slug}`)} // Navigate to product details
                    >
                      More Details
                    </button>
                    <button
                      className="btn btn-link text-decoration-none"
                      onClick={() => handleAddToCart(p)} // Add to cart functionality
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
