
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./MyDonations.css";

function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDonations = async () => {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.token) {
        setError("Please log in to view your donations.");
        return;
      }

      if (user.role?.toUpperCase() !== "DONOR") {
        setError("Only donors can view this page.");
        return;
      }

      const response = await axios.get(
        "http://localhost:8080/api/donations/my-donations",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setDonations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("My donations error:", err);

      setError(
        err.response
          ? `Unable to load donations (${err.response.status}).`
          : "Cannot connect to the backend. Check Spring Boot."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer to a macrotask so the initial fetch does not trigger a
    // synchronous cascading render inside the effect body.
    const timer = setTimeout(() => {
      fetchDonations();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const getStatusClass = (status) => {
    const normalized = status?.toUpperCase();

    if (normalized === "AVAILABLE") return "status-available";
    if (normalized === "UNAVAILABLE") return "status-unavailable";

    return "status-pending";
  };

  return (
    <div className="my-donations-page">
      <header className="donations-header">
        <Link to="/dashboard" className="donations-brand">
          🍃 FoodLoop
        </Link>

        <Link to="/dashboard" className="back-dashboard-link">
          ← Dashboard
        </Link>
      </header>

      <main className="my-donations-container">
        <section className="donations-heading">
          <span className="donations-eyebrow">YOUR CONTRIBUTION</span>
          <h1>My Donations 🍱</h1>
          <p>Track the food you've shared with your community.</p>
        </section>

        <section className="donations-toolbar">
          <div>
            <h2>Your food donations</h2>
            <p>
              {donations.length}{" "}
              {donations.length === 1 ? "donation" : "donations"} recorded
            </p>
          </div>

          <button
            className="refresh-donations-btn"
            onClick={fetchDonations}
            disabled={loading}
          >
            {loading ? "⏳ Loading..." : "↻ Refresh Donations"}
          </button>
        </section>

        {loading && (
          <div className="donations-message">
            <span className="message-icon">⏳</span>
            <p>Loading your donations...</p>
          </div>
        )}

        {!loading && error && (
          <div className="donations-message error-message" role="alert">
            <span className="message-icon">⚠️</span>
            <h2>Unable to load donations</h2>
            <p>{error}</p>
            <button onClick={fetchDonations} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && donations.length === 0 && (
          <div className="donations-message empty-message">
            <span className="message-icon">📦</span>
            <h2>No donations yet</h2>
            <p>Your food donations will appear here once you share food.</p>
            <Link to="/donate" className="donate-food-btn">
              + Donate Food
            </Link>
          </div>
        )}

        {!loading && !error && donations.length > 0 && (
          <section className="donations-grid">
            {donations.map((donation) => (
              <article className="donation-card" key={donation.id}>
                <div className="donation-card-top">
                  <div className="food-icon">🍱</div>
                  <span className={`donation-status ${getStatusClass(donation.status)}`}>
                    {donation.status || "UNKNOWN"}
                  </span>
                </div>

                <h2 className="donation-food-name">
                  {donation.foodType || "Food donation"}
                </h2>

                <p className="donation-id">Donation #{donation.id}</p>

                <div className="donation-details">
                  <div className="donation-detail">
                    <span className="detail-icon">📦</span>
                    <div>
                      <span className="detail-label">Quantity</span>
                      <strong>{donation.quantity ?? "Not specified"}</strong>
                    </div>
                  </div>

                  <div className="donation-detail">
                    <span className="detail-icon">📍</span>
                    <div>
                      <span className="detail-label">Location</span>
                      <strong>{donation.location || "Not specified"}</strong>
                    </div>
                  </div>

                  <div className="donation-detail full-detail">
                    <span className="detail-icon">📝</span>
                    <div>
                      <span className="detail-label">Description</span>
                      <strong>{donation.description || "No description provided"}</strong>
                    </div>
                  </div>

                  <div className="donation-detail full-detail">
                    <span className="detail-icon">🕒</span>
                    <div>
                      <span className="detail-label">Pickup deadline</span>
                      <strong>
                        {donation.pickupDeadline
                          ? new Date(donation.pickupDeadline).toLocaleString()
                          : "Not specified"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="donation-card-footer">
                  {donation.status?.toUpperCase() === "AVAILABLE"
                    ? "Ready for a food request"
                    : donation.status?.toUpperCase() === "UNAVAILABLE"
                    ? "No longer available"
                    : "Check donation status"}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="donations-footer">
        FoodLoop · Share food, spread kindness 💚
      </footer>
    </div>
  );
}

export default MyDonations;
