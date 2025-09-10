import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
import moment from "moment";

export default function AdminReturnRequests() {
  const [auth] = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:8080/api/v1/returns", {
        headers: { Authorization: auth?.token },
      });
      setItems(data?.items || []);
    } catch (e) {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (auth?.token) load(); }, [auth?.token]);

  const decide = async (id, decision, resolution = null) => {
    try {
      const { data } = await axios.put(
        `http://localhost:8080/api/v1/returns/${id}/decision`,
        { decision, resolution },
        { headers: { Authorization: auth?.token } }
      );
      if (data?.success) { toast.success(data.message || "Updated"); load(); }
      else toast.error(data?.message || "Failed");
    } catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  const complete = async (id) => {
    try {
      const { data } = await axios.put(
        `http://localhost:8080/api/v1/returns/${id}/complete`,
        {},
        { headers: { Authorization: auth?.token } }
      );
      if (data?.success) { toast.success("Marked completed"); load(); }
    } catch { toast.error("Failed"); }
  };

  return (
    <Layout title="Return Requests (Admin)">
      <div className="container-fluid p-3 m-3">
        <div className="row">
          <div className="col-md-3"><AdminMenu /></div>
          <div className="col-md-9">
            <div className="d-flex align-items-center justify-content-between">
              <h2>Return Requests</h2>
              <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {items.length === 0 ? <p className="mt-3">No requests</p> : (
              <div className="mt-3">
                {items.map((it) => {
                  const ord = it.orderInfo;
                  const buyer = ord?.buyer?.name || "";
                  const products = ord?.products || [];
                  return (
                    <div className="card mb-3" key={it._id}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-bold">Order #{String(it.order).slice(-6)}</div>
                            <div className="text-muted small">
                              Placed {ord?.createdAt ? moment(ord.createdAt).fromNow() : "-"} · Items {products.length}
                            </div>
                            <div className="mt-1">Buyer: <strong>{buyer}</strong></div>
                          </div>
                          <div>
                            <span className={`badge bg-${
                              it.status === "pending" ? "warning" :
                              it.status === "accepted" ? "info" :
                              it.status === "completed" ? "success" : "secondary"
                            }`}>{it.status}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div><strong>Reason:</strong> {it.reason}</div>
                          <div><strong>User asked for:</strong> {it.desiredResolution}</div>
                          {it.adminResolution && <div><strong>Admin resolution:</strong> {it.adminResolution}</div>}
                          {it.replacementOrder && (
                            <div><strong>Replacement Order:</strong> #{String(it.replacementOrder).slice(-6)}</div>
                          )}
                        </div>

                        <div className="mt-3 d-flex gap-2 flex-wrap">
                          {it.status === "pending" && (
                            <>
                              <button className="btn btn-outline-success"
                                onClick={() => decide(it._id, "accepted", "refund")}>
                                Accept (Refund)
                              </button>
                              <button className="btn btn-outline-primary"
                                onClick={() => decide(it._id, "accepted", "replacement")}>
                                Accept (Replacement)
                              </button>
                              <button className="btn btn-outline-danger"
                                onClick={() => decide(it._id, "rejected")}>
                                Reject
                              </button>
                            </>
                          )}
                          {it.status === "accepted" && (
                            <button className="btn btn-success" onClick={() => complete(it._id)}>
                              Mark as Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
