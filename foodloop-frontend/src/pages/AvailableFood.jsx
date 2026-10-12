
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./AvailableFood.css";

function AvailableFood() {
  const [foods, setFoods] = useState([]);
  const [requestedIds, setRequestedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestingId, setRequestingId] = useState(null);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getUser();
  const isReceiver = user.role?.toUpperCase() === "RECEIVER";
  const token = user.token;

  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchFood = async () => {
    const response = await axios.get(
      `${API_BASE_URL}/api/donations/available`,
      { headers }
    );

    setFoods(Array.isArray(response.data) ? response.data : []);
  };

  const fetchMyRequests = async () => {
    if (!token || !isReceiver) {
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/food-requests/my-requests`,
        { headers }
      );

      const requests = Array.isArray(response.data)
        ? response.data
        : [];

      setRequestedIds(
        requests
          .map((request) =>
            Number(
              typeof request === "object"
                ? request.donationId
                : request
            )
          )
          .filter(Number.isFinite)
      );
    } catch (err) {
      console.error("Could not load your requests:", err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await Promise.all([fetchFood(), fetchMyRequests()]);
    } catch (err) {
      console.error("Food loading error:", err);

      setError(
        err.response
          ? `Unable to load food donations (${err.response.status}).`
          : "Cannot reach the backend. Check that Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        await Promise.all([fetchFood(), fetchMyRequests()]);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Food loading error:", err);

        setError(
          err.response
            ? `Unable to load food donations (${err.response.status}).`
            : "Cannot reach the backend. Check that Spring Boot is running."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestFood = async (foodId) => {
    const currentUser = getUser();

    if (!currentUser.token) {
      setMessage("Please log in before requesting food.");
      return;
    }

    if (currentUser.role?.toUpperCase() !== "RECEIVER") {
      setMessage("Only receivers can request food.");
      return;
    }

    if (requestedIds.includes(Number(foodId))) {
      setMessage("You have already requested this food.");
      return;
    }

    setRequestingId(foodId);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/food-requests/${foodId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      setRequestedIds((previous) =>
        previous.includes(Number(foodId))
          ? previous
          : [...previous, Number(foodId)]
      );

      setMessage(
        typeof response.data === "string"
          ? response.data
          : "Food request submitted successfully!"
      );
    } catch (err) {
      const serverMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : "";

      if (
        err.response?.status === 409 &&
        serverMessage.toLowerCase().includes("already requested")
      ) {
        setRequestedIds((previous) =>
          previous.includes(Number(foodId))
            ? previous
            : [...previous, Number(foodId)]
        );

        setMessage("You have already requested this food.");
      } else if (err.response?.status === 409) {
        setError(
          serverMessage || "This donation is no longer available."
        );
      } else {
        setError(
          serverMessage ||
            "Could not submit your request. Please try again."
        );
      }
    } finally {
      setRequestingId(null);
    }
  };

  const visibleFoods = foods.filter((food) => {
    const isAvailable =
      food.status?.toUpperCase() === "AVAILABLE";

    const alreadyRequested = requestedIds.includes(Number(food.id));

    return isAvailable && !(isReceiver && alreadyRequested);
  });

  return (
    <div className="available-food-page">
      <header className="food-page-header">
        <Link to="/dashboard" className="food-brand">
          <span className="food-brand-icon">🍃</span>
          FoodLoop
        </Link>

        <Link to="/dashboard" className="food-back-link">
          ← Dashboard
        </Link>
      </header>

      <main className="food-page-main">
        <section className="food-page-banner">
          <div>
            <span className="food-eyebrow">SHARE MORE. WASTE LESS.</span>
            <h1>Available Food <span>🍱</span></h1>
            <p>
              Discover food donations available in your community.
              Every meal shared makes a difference.
            </p>
          </div>

          <div className="food-banner-art" aria-hidden="true">
            🥗
          </div>
        </section>

        <div className="food-toolbar">
          <div>
            <h2>Food donations</h2>
            <p>
              {loading
                ? "Finding available donations..."
                : `${visibleFoods.length} ${
                    visibleFoods.length === 1 ? "donation" : "donations"
                  } available`}
            </p>
          </div>

          <button
            className="food-refresh-button"
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh list"}
          </button>
        </div>

        {message && (
          <div className="food-notice food-success" role="status">
            <span>✓</span> {message}
          </div>
        )}

        {error && (
          <div className="food-notice food-error" role="alert">
            <span>!</span> {error}
          </div>
        )}

        {loading && (
          <div className="food-empty-state">
            <div className="food-empty-icon">🥣</div>
            <h3>Loading donations...</h3>
            <p>Please wait while we fetch available food.</p>
          </div>
        )}

        {!loading && !error && visibleFoods.length === 0 && (
          <div className="food-empty-state">
            <div className="food-empty-icon">🍃</div>
            <h3>No new food available</h3>
            <p>
              New available donations will appear here when they are added.
            </p>
            <button
              className="food-refresh-button"
              onClick={refreshData}
            >
              Check again
            </button>
          </div>
        )}

        {!loading && visibleFoods.length > 0 && (
          <div className="food-card-grid">
            {visibleFoods.map((food) => (
              <article className="food-card" key={food.id}>
                <div className="food-card-top">
                  <div className="food-card-icon">🍲</div>
                  <span className="food-status">
                    <span className="food-status-dot" />
                    Available
                  </span>
                </div>

                <span className="food-card-id">
                  DONATION #{food.id}
                </span>

                <h3 className="food-card-title">
                  {food.foodType || "Food donation"}
                </h3>

                <p className="food-card-description">
                  {food.description || "Fresh food shared with the community."}
                </p>

                <div className="food-details">
                  <div className="food-detail-row">
                    <span className="food-detail-icon">📦</span>
                    <span className="food-detail-label">Quantity</span>
                    <strong>{food.quantity}</strong>
                  </div>

                  <div className="food-detail-row">
                    <span className="food-detail-icon">📍</span>
                    <span className="food-detail-label">Location</span>
                    <strong>{food.location || "Not specified"}</strong>
                  </div>

                  <div className="food-detail-row deadline-row">
                    <span className="food-detail-icon">🕒</span>
                    <span className="food-detail-label">Pickup by</span>
                    <strong>
                      {food.pickupDeadline
                        ? new Date(food.pickupDeadline).toLocaleString()
                        : "Not specified"}
                    </strong>
                  </div>
                </div>

                {isReceiver && (
                  <button
                    className="food-request-button"
                    disabled={requestingId === food.id}
                    onClick={() => requestFood(food.id)}
                  >
                    {requestingId === food.id
                      ? "Submitting request..."
                      : "Request this food →"}
                  </button>
                )}

                {!isReceiver && (
                  <div className="food-donor-note">
                    🍃 Helping good food reach good people.
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <footer className="food-page-footer">
          <span>🍃 FoodLoop</span>
          <p>Reducing food waste, one meal at a time.</p>
        </footer>
      </main>
    </div>
  );
}

export default AvailableFood;
