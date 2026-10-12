import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "DONOR"
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
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:8080/api/auth/register",
                formData
            );

            setMessage(response.data.message);
            setMessageType("success");

            setTimeout(() => {
                navigate("/login");
            }, 1000);

        } catch (error) {

            console.log("Registration error:", error);

            setMessageType("error");

            if (error.response) {
                setMessage(
                    error.response.data.message || "Registration failed"
                );
            } else if (error.request) {
                setMessage(
                    "Cannot connect to backend. Check if Spring Boot is running on port 8080."
                );
            } else {
                setMessage("Something went wrong.");
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
                        Join a loop that turns surplus into smiles.
                    </h3>

                    <p>
                        Create an account to donate extra food or request
                        meals from your community — every shared plate
                        counts.
                    </p>

                    <ul className="auth-aside-points">
                        <li><span>🌱</span> Reduce food waste</li>
                        <li><span>📍</span> Connect locally</li>
                        <li><span>💚</span> Help someone eat today</li>
                    </ul>
                </aside>

                <div className="auth-form-panel">
                    <h1>FoodLoop</h1>
                    <h2>Create Account</h2>
                    <p>Join FoodLoop and help reduce food waste.</p>

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
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
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="DONOR">Food Donor</option>
                            <option value="RECEIVER">Food Receiver</option>
                        </select>
                        <button type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Register"}
                        </button>
                    </form>

                    {message && (
                        <p className={`message ${messageType}`}>
                            {message}
                        </p>
                    )}

                    <p className="auth-switch">
                        Already have an account?{" "}
                        <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
