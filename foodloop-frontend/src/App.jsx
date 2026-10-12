
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DonateFood from "./pages/DonateFood";
import AvailableFood from "./pages/AvailableFood";
import MyFoodRequests from "./MyFoodRequests";
import DonorRequests from "./pages/DonorRequests";
import MyDonations from "./pages/MyDonations";

function ProtectedRoute({ children }) {
    const userData = localStorage.getItem("user");

    let user = null;

    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch {
            user = null;
        }
    }

    if (!user || !user.token) {
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    return children;
}

function Home() {
    return (
        <div className="home-page">
            <header className="home-header">
                <span className="home-brand">
                    <span className="home-brand-icon">🍃</span>
                    FoodLoop
                </span>

                <nav className="home-nav">
                    <Link className="home-nav-link" to="/login">
                        Login
                    </Link>
                    <Link className="home-nav-cta" to="/register">
                        Get Started
                    </Link>
                </nav>
            </header>

            <main className="home-main">
                <section className="home-hero">
                    <span className="home-eyebrow">
                        FROM SURPLUS TO SMILES
                    </span>

                    <h1>
                        Share surplus food.
                        <br />
                        <span>Feed your community.</span>
                    </h1>

                    <p>
                        FoodLoop connects food donors with receivers so good
                        food never goes to waste. Donate, request, and track
                        every meal in one simple place.
                    </p>

                    <div className="home-actions">
                        <Link className="home-primary" to="/register">
                            Create an account
                        </Link>
                        <Link className="home-secondary" to="/login">
                            I already have an account
                        </Link>
                    </div>
                </section>

                <section className="home-art" aria-hidden="true">
                    <div className="home-art-plate">🍲</div>
                    <span>🥬</span>
                    <span>🍎</span>
                    <span>🥕</span>
                    <span>🍞</span>
                </section>
            </main>

            <section className="home-features">
                <article className="home-feature">
                    <span className="home-feature-icon">🍱</span>
                    <h3>Donate food</h3>
                    <p>
                        Share surplus meals with people nearby in just a
                        few clicks.
                    </p>
                </article>

                <article className="home-feature">
                    <span className="home-feature-icon">🥗</span>
                    <h3>Find meals</h3>
                    <p>
                        Browse available donations and request what you
                        need.
                    </p>
                </article>

                <article className="home-feature">
                    <span className="home-feature-icon">🤝</span>
                    <h3>Track requests</h3>
                    <p>
                        Approve or follow each request from pending to
                        pickup.
                    </p>
                </article>
            </section>

            <footer className="home-footer">
                🍃 FoodLoop · Reducing food waste, one meal at a time.
            </footer>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                <Route
                    path="/dashboard"
                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                />

                <Route
                    path="/donate"
                    element={<ProtectedRoute><DonateFood /></ProtectedRoute>}
                />

                <Route
                    path="/available-food"
                    element={<ProtectedRoute><AvailableFood /></ProtectedRoute>}
                />

                <Route
                    path="/my-requests"
                    element={<ProtectedRoute><MyFoodRequests /></ProtectedRoute>}
                />

                <Route
                    path="/donor-requests"
                    element={<ProtectedRoute><DonorRequests /></ProtectedRoute>}
                />

                <Route
                    path="/my-donations"
                    element={<ProtectedRoute><MyDonations /></ProtectedRoute>}
                />

                {/* Redirect unknown URLs to the home page */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
