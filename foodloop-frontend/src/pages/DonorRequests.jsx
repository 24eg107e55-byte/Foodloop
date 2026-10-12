
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./DonorRequests.css";

function DonorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  // Fetch requests belonging to the logged-in donor
  const fetchRequests = async (showLoading = true) => {
    const user = getUser();

    if (!user.token) {
      setMessage("Please log in to view donor requests.");
      setMessageType("error");
      setRequests([]);
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await axios.get(
        "http://localhost:8080/api/food-requests/donor-requests",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      console.log("Donor requests received:", response.data);

      setRequests(Array.isArray(response.data) ? response.data : []);
      setMessage("");
      setMessageType("");
    } catch (error) {
      console.error("Fetch donor requests error:", error);
      console.error("Backend status:", error.response?.status);
      console.error("Backend response:", error.response?.data);

      setRequests([]);

      if (error.response?.status === 401) {
        setMessage("Your session may have expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setMessage(
          "Access denied. Please log in using the donor account that created this donation."
        );
      } else if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (typeof error.response?.data === "string") {
        setMessage(error.response.data);
      } else {
        setMessage(
          "Unable to load requests. Check that the backend is running and inspect the browser console."
        );
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer to a macrotask so the initial fetch does not trigger a
    // synchronous cascading render inside the effect body.
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve or reject a food request
  const updateStatus = async (requestId, status) => {
    const user = getUser();

    if (!user.token) {
      setMessage("Please log in again.");
      setMessageType("error");
      return;
    }

    setUpdatingId(requestId);
    setMessage("");
    setMessageType("");

    try {
      const response = await axios.put(
        `http://localhost:8080/api/food-requests/${requestId}/status/${status}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setMessage(
        typeof response.data === "string"
          ? response.data
          : `Request ${status.toLowerCase()} successfully.`
      );
      setMessageType("success");

      await fetchRequests(false);
    } catch (error) {
      console.error("Update request error:", error);
      console.error("Backend status:", error.response?.status);
      console.error("Backend response:", error.response?.data);

      if (error.response?.status === 401) {
        setMessage("Your session may have expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setMessage("You are not authorized to update this request.");
      } else if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (typeof error.response?.data === "string") {
        setMessage(error.response.data);
      } else {
        setMessage("Unable to update this request. Please try again.");
      }

      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "request-status-pending";
      case "APPROVED":
        return "request-status-approved";
      case "REJECTED":
        return "request-status-rejected";
      default:
        return "request-status-default";
    }
  };

  const pendingCount = requests.filter(
    (request) => request.status?.toUpperCase() === "PENDING"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status?.toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status?.toUpperCase() === "REJECTED"
  ).length;

  return (
    <div className="donor-requests-page">
      <header className="requests-header">
        <Link to="/dashboard" className="requests-brand">
          🍃 FoodLoop
        </Link>

        <Link to="/dashboard" className="requests-back-link">
          ← Dashboard
        </Link>
      </header>

      <main className="requests-container">
        <section className="requests-intro">
          <span className="requests-eyebrow">DONOR WORKSPACE</span>
          <h1>Manage Requests 📋</h1>
          <p>
            Every request is an opportunity to make a difference.
            Review requests for the food you've shared.
          </p>
        </section>

        <section className="request-stats">
          <div className="request-stat">
            <span className="stat-icon">📋</span>
            <div>
              <span className="stat-label">Total Requests</span>
              <strong>{requests.length}</strong>
            </div>
          </div>

          <div className="request-stat">
            <span className="stat-icon">⏳</span>
            <div>
              <span className="stat-label">Pending</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className="request-stat">
            <span className="stat-icon">✅</span>
            <div>
              <span className="stat-label">Approved</span>
              <strong>{approvedCount}</strong>
            </div>
          </div>

          <div className="request-stat">
            <span className="stat-icon">↩️</span>
            <div>
              <span className="stat-label">Rejected</span>
              <strong>{rejectedCount}</strong>
            </div>
          </div>
        </section>

        <section className="requests-toolbar">
          <div>
            <h2>Food requests</h2>
            <p>Review each request and update its status.</p>
          </div>

          <button
            className="requests-refresh-btn"
            onClick={() => fetchRequests()}
            disabled={loading || updatingId !== null}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </section>

        {message && (
          <div
            className={`requests-message ${
              messageType === "error"
                ? "requests-error"
                : "requests-success"
            }`}
            role="status"
          >
            {messageType === "error" ? "⚠️ " : "✓ "}
            {message}
          </div>
        )}

        {loading ? (
          <div className="requests-empty-state">
            <span className="requests-large-icon">⏳</span>
            <h2>Loading requests...</h2>
            <p>Please wait while we retrieve your food requests.</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="requests-empty-state">
            <span className="requests-large-icon">🤝</span>
            <h2>No requests yet</h2>
            <p>
              When someone requests your donated food, their request
              will appear here.
            </p>
            <Link to="/my-donations" className="requests-primary-link">
              View My Donations
            </Link>
          </div>
        ) : (
          <section className="requests-grid">
            {requests.map((request) => {
              const status = request.status?.toUpperCase();
              const isUpdating = updatingId === request.requestId;

              return (
                <article
                  className="request-card"
                  key={request.requestId}
                >
                  <div className="request-card-heading">
                    <div className="request-food-icon">🍱</div>
                    <span
                      className={`request-status ${getStatusClass(status)}`}
                    >
                      {status || "UNKNOWN"}
                    </span>
                  </div>

                  <h3 className="request-food-name">
                    {request.foodType || "Food donation"}
                  </h3>

                  <p className="request-number">
                    Request #{request.requestId}
                    {request.donationId != null &&
                      ` · Donation #${request.donationId}`}
                  </p>

                  <div className="request-details">
                    <div className="request-detail">
                      <span>👤</span>
                      <div>
                        <small>Receiver</small>
                        <strong>
                          {request.receiverName || "Receiver"}
                        </strong>
                      </div>
                    </div>

                    <div className="request-detail">
                      <span>📦</span>
                      <div>
                        <small>Quantity</small>
                        <strong>
                          {request.quantity ?? "Not specified"}
                        </strong>
                      </div>
                    </div>

                    <div className="request-detail">
                      <span>📍</span>
                      <div>
                        <small>Pickup location</small>
                        <strong>
                          {request.location || "Not specified"}
                        </strong>
                      </div>
                    </div>

                    {request.requestedAt && (
                      <div className="request-detail">
                        <span>🕒</span>
                        <div>
                          <small>Requested on</small>
                          <strong>
                            {new Date(
                              request.requestedAt
                            ).toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {status === "PENDING" ? (
                    <div className="request-actions">
                      <button
                        className="request-approve-btn"
                        disabled={updatingId !== null}
                        onClick={() =>
                          updateStatus(
                            request.requestId,
                            "APPROVED"
                          )
                        }
                      >
                        {isUpdating ? "Updating..." : "✓ Approve"}
                      </button>

                      <button
                        className="request-reject-btn"
                        disabled={updatingId !== null}
                        onClick={() =>
                          updateStatus(
                            request.requestId,
                            "REJECTED"
                          )
                        }
                      >
                        {isUpdating ? "Updating..." : "✕ Reject"}
                      </button>
                    </div>
                  ) : (
                    <div className="request-completed-note">
                      {status === "APPROVED"
                        ? "✓ This request has been approved."
                        : status === "REJECTED"
                        ? "This request has been rejected."
                        : "No actions available for this status."}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      <footer className="requests-footer">
        FoodLoop · Reducing food waste, one meal at a time 💚
      </footer>
    </div>
  );
}

export default DonorRequests;
