
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./DonateFood.css";

// Earliest selectable pickup time, formatted for a datetime-local input.
// Computed once at module load to keep component rendering pure.
const MIN_PICKUP_DEADLINE = (() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
})();

function DonateFood() {
    const [formData, setFormData] = useState({
        foodType: "",
        quantity: "",
        location: "",
        description: "",
        pickupDeadline: ""
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        let user;

        try {
            user = JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            user = {};
        }

        if (!user.token) {
            setMessage("Please log in again before donating food.");
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const donation = {
                ...formData,
                quantity: Number(formData.quantity)
            };

            const response = await axios.post(
                "http://localhost:8080/api/donations",
                donation,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            setMessage("Food donation added successfully!");
            setMessageType("success");

            setFormData({
                foodType: "",
                quantity: "",
                location: "",
                description: "",
                pickupDeadline: ""
            });

            console.log("Saved donation:", response.data);

        } catch (error) {
            if (error.response?.status === 401) {
                setMessage("Session expired. Please log in again.");
            } else if (error.response?.status === 403) {
                setMessage("Only food donors can create donations.");
            } else {
                setMessage(
                    error.response?.data?.message ||
                    "Could not save donation. Please try again."
                );
            }

            setMessageType("error");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="donate-page">
            <div className="donate-box">

                <div className="donate-icon">🥗</div>

                <span className="donate-eyebrow">
                    FOODLOOP COMMUNITY
                </span>

                <h1>Donate Food</h1>

                <p className="donate-subtitle">
                    Share surplus food and help someone in need.
                    Every donation can make a difference.
                </p>

                <form
                    className="donate-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="foodType">Food Type</label>
                    <input
                        id="foodType"
                        type="text"
                        name="foodType"
                        placeholder="e.g. Cooked Rice"
                        value={formData.foodType}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="quantity">Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        placeholder="Enter quantity"
                        min="0.1"
                        step="any"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="location">Pickup Location</label>
                    <input
                        id="location"
                        type="text"
                        name="location"
                        placeholder="Enter pickup location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="description">Food Description</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Describe the food and its freshness"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="pickupDeadline">
                        Pickup Deadline
                    </label>
                    <input
                        id="pickupDeadline"
                        type="datetime-local"
                        name="pickupDeadline"
                        min={MIN_PICKUP_DEADLINE}
                        value={formData.pickupDeadline}
                        onChange={handleChange}
                        required
                    />

                    <button
                        className="donate-submit-btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Donate Food ♡"}
                    </button>
                </form>

                {message && (
                    <p
                        className={`donate-message ${messageType}`}
                        role="status"
                        aria-live="polite"
                    >
                        {message}
                    </p>
                )}

                <div className="donate-bottom">
                    <Link
                        className="donate-back-link"
                        to="/dashboard"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <p className="donate-footer">
                    Together, we can reduce food waste.
                </p>

            </div>
        </div>
    );
}

export default DonateFood;
