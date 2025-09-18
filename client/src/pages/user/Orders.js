// src/pages/user/Orders.js
import React, { useState, useEffect, useMemo } from "react";
import Layout from "./../../components/Layout/Layout";
import UsersMenu from "../../components/Layout/UsersMenu";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";
import "../../styles/UserOrders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]); // my return requests
  const [auth] = useAuth();

  const authHeader = useMemo(() => {
    const token = auth?.token || "";
    return { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };
  }, [auth?.token]);

  const getOrders = async () => {
    try {
      const { data } = await axios.get("http://localhost:8080/api/v1/auth/orders", {
        headers: authHeader,
      });
      if (Array.isArray(data.orders)) setOrders(data.orders);
      else setOrders([]);
    } catch (error) {
      console.log(error);
      setOrders([]);
    }
  };

  const getMyReturnRequests = async () => {
    try {
      const { data } = await axios.get("http://localhost:8080/api/v1/returns/my", {
        headers: authHeader,
      });
      setReturns(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      // silently ignore; returns UI is optional
      setReturns([]);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      getOrders();
      getMyReturnRequests();
    }
  }, [auth?.token]);

  // Map orderId -> return status (only latest per order considered)
  const returnStatusByOrder = useMemo(() => {
    const map = new Map();
    for (const rr of returns) {
      const key = rr?.order?.toString?.() || rr?.order;
      if (!key) continue;
      // prefer accepted > pending > rejected > completed (you can tweak)
      const priority = { accepted: 3, pending: 2, rejected: 1, completed: 0 };
      const curr = map.get(key);
      if (!curr || (priority[rr.status] ?? -1) > (priority[curr.status] ?? -1)) {
        map.set(key, { status: rr.status, adminResolution: rr.adminResolution });
      }
    }
    return map;
  }, [returns]);

  // price from order.items (purchase-time), fallback to product.price
  const priceFor = (order, product) => {
    const items = order?.items || order?.lineItems || [];
    const found = items.find(
      (it) => String(it?.product?._id || it?.product) === String(product?._id)
    );
    const val = typeof found?.price === "number" ? found.price : product?.price;
    return Number(val || 0);
  };

  // helper to deep-link to product review section
  const reviewHref = (p) => (p?.slug ? `/product/${p.slug}#write-review` : "#");

  return (
    <Layout title={"Your Order"}>
      <div className="container-fluid p-3 m-3">
        <div className="row">
          <div className="col-md-3">
            <UsersMenu />
          </div>
          <div className="col-md-9">
            <h1 className="text-center">All Orders</h1>

            {orders.length > 0 ? (
              orders.map((o, i) => {
                const rr = returnStatusByOrder.get(o?._id); // my return info for this order
                return (
                  <div className="border shadow" key={o?._id || i}>
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
                          <td>{moment(o?.createdAt).fromNow()}</td>
                          <td>{o?.payment?.success ? "Success" : "Failed"}</td>
                          <td>{o?.products?.length}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="container">
                      {o?.products?.map((p, idx) => (
                        <div className="row mb-2 p-3 card flex-row" key={p._id || idx}>
                          <div className="col-md-4">
                            <img
                              src={`http://localhost:8080/api/v1/product/product-photo/${p._id}`}
                              className="card-img-top"
                              alt={p.name}
                              width="100px"
                              height={"100px"}
                            />
                          </div>
                          <div className="col-md-8">
                            <p className="mb-1">{p.name}</p>
                            <p className="mb-1">{p.description?.substring(0, 30)}</p>
                            <p className="mb-2">Price: ${priceFor(o, p).toFixed(2)}</p>

                            {/* ✅ Only addition: show "Write a review" when this order is Delivered */}
                            {o?.status === "Delivered" && p?.slug && (
     <a
  href={reviewHref(p)}
  className="btn btn-sm"
  title="Write a review for this product"
  style={{
    backgroundColor: "#FFD814",
    borderColor: "#FCD200",
    color: "#0F1111",
    fontWeight: "bold",
  }}
  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F7CA00")}
  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#FFD814")}
>
  Write a review
</a>

                            )}
                          </div>
                        </div>
                      ))}

                      {/* Return status ribbon */}
                      {rr?.status === "accepted" && (
                        <div className="mt-2">
                          <span className="badge bg-success">
                            Return Request Accepted
                            {rr?.adminResolution ? ` (${rr.adminResolution})` : ""}
                          </span>
                        </div>
                      )}
                      {rr?.status === "pending" && (
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">Return Requested</span>
                        </div>
                      )}

                      {/* Return button gating */}
                      {o?.status === "Delivered" &&
                        !(rr?.status === "pending" || rr?.status === "accepted") && (
                          <div className="mt-2">
                            <a
                              className="btn btn-warning"
                              href={`/dashboard/user/returns/new/${o._id}`}
                            >
                              Return Request
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No orders found</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
