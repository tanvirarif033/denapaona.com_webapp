import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Spin } from "antd";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  //get all products
  const getAllProducts = async () => {
    try {
      setLoading(true); // Start loading spinner
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      setProducts(data.products);
    } catch (error) {
      console.log(error);
      toast.error("Something Went Wrong");
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  //lifecycle method
  useEffect(() => {
    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1 className="text-center">All Products List</h1>
            {/* Spin component wrapping the entire product list section */}
            <Spin spinning={loading} tip="Loading...">
              <div className="d-flex flex-wrap">
                {products.length > 0
                  ? products.map((p) => (
                      <Link
                        key={p._id}
                        to={`/dashboard/admin/product/${p.slug}`}
                        className="product-link"
                      >
                        <div className="card m-2" style={{ width: "18rem" }}>
                          <img
                            src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${p._id}`}
                            className="card-img-top"
                            alt={p.name}
                          />
                          <div className="card-body">
                            <h5 className="card-title">{p.name}</h5>
                            <p className="card-text">{p.description}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  : !loading && (
                      <p>No products found</p>
                    ) // Show message when there are no products
                }
              </div>
            </Spin>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
