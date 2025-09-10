import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import UsersMenu from "../../components/Layout/UsersMenu";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";

export default function ReturnRequestForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [auth] = useAuth();

  const [reason, setReason] = useState("");
  const [desiredResolution, setDesiredResolution] = useState("refund");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return toast.error("Reason is required");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `http://localhost:8080/api/v1/returns/${orderId}`,
        { reason, desiredResolution },
        { headers: { Authorization: auth?.token } }
      );
      if (data?.success) {
        toast.success("Return request submitted");
        navigate("/dashboard/user/orders");
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Return Request">
      <div className="container-fluid p-3 m-3">
        <div className="row">
          <div className="col-md-3"><UsersMenu /></div>
          <div className="col-md-9">
            <h2 className="mb-3">Request a Return</h2>
            <form onSubmit={submit} className="card p-3">
              <div className="mb-3">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label d-block">I would like a</label>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" id="r-refund" name="res"
                    checked={desiredResolution === "refund"}
                    onChange={() => setDesiredResolution("refund")} />
                  <label className="form-check-label" htmlFor="r-refund">Refund</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" id="r-replacement" name="res"
                    checked={desiredResolution === "replacement"}
                    onChange={() => setDesiredResolution("replacement")} />
                  <label className="form-check-label" htmlFor="r-replacement">Replacement</label>
                </div>
              </div>
              <button disabled={loading} className="btn btn-primary">
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
