import React from "react";
import Layout from "./../components/Layout/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Search.css";

const Search = () => {
  const [values] = useSearch();
  const [cart, setCart] = useCart();
  const [auth] = useAuth();
  const navigate = useNavigate();

  // Add to cart functionality
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

  // More details functionality
  const handleMoreDetails = (slug) => {
    navigate(`/product/${slug}`);
  };

  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Results</h1>
          <h6>
            {values?.results.length < 1
              ? "No Products Found"
              : `Found ${values?.results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div className="card m-2" style={{ width: "18rem" }} key={p._id}>
                <img
                  src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">
                    {p.description.substring(0, 30)}...
                  </p>
                  <p className="card-text"> $ {p.price}</p>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-link text-decoration-none"
                      onClick={() => handleMoreDetails(p.slug)} // Navigate to product details
                    >
                      More Details
                    </button>
                    <button
                      className="btn btn-link text-decoration-none"
                      onClick={() => handleAddToCart(p)} // Add to cart
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
