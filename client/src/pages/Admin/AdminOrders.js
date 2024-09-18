import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import { useAuth } from "../../context/auth";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();
  const [productAvailability, setProductAvailability] = useState([]);

  const getOrders = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/auth/all-orders"
      );
      setOrders(data);

      // Extract product data and calculate availability count
      const productData = {};
      data.forEach((order) => {
        order.products.forEach((product) => {
          if (!productData[product.name]) {
            productData[product.name] = product.countInStock;
          } else {
            productData[product.name] += product.countInStock;
          }
        });
      });

      // Convert the product data to an array format that Chart.js expects
      setProductAvailability(
        Object.entries(productData).map(([name, count]) => ({ name, count }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  // Prepare data for the pie chart
  const chartData = {
    labels: productAvailability.map((item) => item.name), // Product names
    datasets: [
      {
        label: "Product Availability",
        data: productAvailability.map((item) => item.count), // Availability count
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Layout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9">
          <h1 className="text-center">All Orders</h1>
          <div className="my-4">
            <h2>Product Availability</h2>
            <Pie data={chartData} />
          </div>

          {/* Existing code for displaying orders */}
          {orders?.map((o, i) => {
            return (
              <div className="border shadow" key={o._id}>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Status</th>
                      <th scope="col">Buyer</th>
                      <th scope="col">Date</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{i + 1}</td>
                      <td>{o?.status}</td>
                      <td>{o?.buyer?.name}</td>
                      <td>{new Date(o?.createAt).toLocaleDateString()}</td>
                      <td>{o?.payment?.success ? "Success" : "Failed"}</td>
                      <td>{o?.products?.length}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="container">
                  {o?.products?.map((p, i) => (
                    <div className="row mb-2 p-3 card flex-row" key={p._id}>
                      <div className="col-md-4">
                        <img
                          src={`/api/v1/product/product-photo/${p._id}`}
                          className="card-img-top"
                          alt={p.name}
                          width="100px"
                          height={"100px"}
                        />
                      </div>
                      <div className="col-md-8">
                        <p>{p.name}</p>
                        <p>{p.description.substring(0, 30)}</p>
                        <p>Price: {p.price}</p>
                        <p>Availability: {p.countInStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
