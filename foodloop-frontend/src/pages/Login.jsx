import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
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
        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/login`,
                formData
            );

            // Save the logged-in user's information
            localStorage.setItem(
                "user",
                JSON.stringify(response.data)
            );

            // Navigate directly to the dashboard
            navigate("/dashboard", { replace: true });

        } catch (error) {
            setMessageType("error");

            if (error.response) {
                setMessage(
                    error.response.data.message || "Login failed"
                );
            } else {
                setMessage("Cannot connect to the backend server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <aside className="auth-aside">
                    <span className="auth-aside-brand">🍃 FoodLoop</span>

                    <h3>
                        Welcome back to the community that shares.
                    </h3>

                    <p>
                        Log in to donate surplus food, discover meals
                        nearby, and track every request from start to
                        pickup.
                    </p>

                    <ul className="auth-aside-points">
                        <li><span>🍱</span> Share surplus food</li>
                        <li><span>🥗</span> Find meals nearby</li>
                        <li><span>🤝</span> Track requests easily</li>
                    </ul>
                </aside>

                <div className="auth-form-panel">
                    <h1>FoodLoop</h1>
                    <h2>Welcome Back</h2>
                    <p>Login to continue to FoodLoop.</p>

                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    {message && (
                        <p className={`message ${messageType}`}>
                            {message}
                        </p>
                    )}

                    <p className="auth-switch">
                        Don't have an account?{" "}
                        <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
