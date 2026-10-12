import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "./api";

function MyFoodRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = async (showLoading = true) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.token) {
      setError("Please log in to view your food requests.");
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/food-requests/my-requests`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setRequests(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Request loading error:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to load your food requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer so the initial fetch does not produce a synchronous
    // cascading render while the effect runs.
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "pending";
      case "APPROVED":
        return "approved";
      case "REJECTED":
        return "rejected";
      default:
        return "pending";
    }
  };

  return (
    <div className="myrequests-page">
      <header className="myrequests-header">
        <Link to="/dashboard" className="myrequests-brand">
          🍃 FoodLoop
        </Link>

        <Link to="/dashboard" className="myrequests-back">
          ← Dashboard
        </Link>
      </header>

      <main className="myrequests-main">
        <section className="myrequests-intro">
          <span className="myrequests-eyebrow">RECEIVER WORKSPACE</span>
          <h1>My Food Requests 📋</h1>
          <p>Track the food donations you have requested.</p>
        </section>

        <section className="myrequests-toolbar">
          <div>
            <h2>Your requests</h2>
            <p>
              {requests.length}{" "}
              {requests.length === 1 ? "request" : "requests"} recorded
            </p>
          </div>

          <button
            type="button"
            className="myrequests-refresh"
            onClick={() => fetchRequests()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh status"}
          </button>
        </section>

        {error && (
          <div className="myrequests-notice error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="myrequests-empty">
            <span>⏳</span>
            <h3>Loading your requests...</h3>
            <p>Please wait while we retrieve your food requests.</p>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="myrequests-empty">
            <span>🍃</span>
            <h3>No requests yet</h3>
            <p>
              You haven't requested any food yet. Browse available
              donations and submit your first request.
            </p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="myrequests-grid">
            {requests.map((request) => (
              <article
                className="myrequests-card"
                key={request.requestId}
              >
                <div className="myrequests-card-top">
                  <div className="myrequests-card-icon">🍲</div>
                  <span
                    className={`myrequests-status ${getStatusClass(
                      request.status
                    )}`}
                  >
                    {request.status || "UNKNOWN"}
                  </span>
                </div>

                <h3>{request.foodType || "Food donation"}</h3>

                <p className="myrequests-id">
                  Request #{request.requestId} · Donation #
                  {request.donationId}
                </p>

                <div className="myrequests-detail">
                  <span>Quantity</span>
                  <strong>{request.quantity ?? "Not specified"}</strong>
                </div>

                <div className="myrequests-detail">
                  <span>Location</span>
                  <strong>{request.location || "Not specified"}</strong>
                </div>

                <div className="myrequests-detail">
                  <span>Requested on</span>
                  <strong>
                    {request.requestedAt
                      ? new Date(request.requestedAt).toLocaleString()
                      : "Not available"}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="myrequests-footer">
        FoodLoop · Reducing food waste, one meal at a time 💚
      </footer>
    </div>
  );
}

export default MyFoodRequests;
