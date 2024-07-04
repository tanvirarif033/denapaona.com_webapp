
import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams } from "react-router-dom";

const ProductDetails = () => {
  const params = useParams();
  // const navigate = useNavigate();
  const [product, setProduct] = useState({});
  // const [relatedProducts, setRelatedProducts] = useState([]);

 //initalp details
 useEffect(() => {
  if (params?.slug) getProduct();
}, [params?.slug]);

  //getProduct
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `https://denapaona-com-webapp-server.vercel.app/api/v1/product/get-product/${params.slug}`
      );
      setProduct(data?.product);
      // getSimilarProduct(data?.product._id, data?.product.category._id);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
        <img
            src={`https://denapaona-com-webapp-server.vercel.app/api/v1/product/product-photo/${product._id}`}
            className="card-img-top"
            alt={product.name}
            height="300"
            width={"350px"}
          />
          
          </div>
        <div className="col-md-6 product-details-info" >
        <h1 className="text-center">Product Details</h1>
        <h6>Name : {product.name}</h6>
        <h6>Description : {product.description}</h6>
        <h6>Price : {product.price}</h6>
        <h6>Category : {product?.category?.name}</h6>
        <button class="btn btn-secondary ms-1">ADD TO CART</button>
          </div>

      </div>
      <div className="row">Similar products </div>

    </Layout>
  )
}

export default ProductDetails
