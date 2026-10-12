
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    // Get logged-in user details
    let user = {};

    try {
        user = JSON.parse(localStorage.getItem("user")) || {};
    } catch {
        localStorage.removeItem("user");
    }

    const isDonor = user.role?.toUpperCase() === "DONOR";
    const isReceiver = user.role?.toUpperCase() === "RECEIVER";

    // Logout and clear the saved session
    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const dashboardItems = [
        {
            title: "Donate Food",
            description: "Share surplus food with people who need it.",
            icon: "🍱",
            link: "/donate",
            color: "green",
            show: isDonor,
        },
        {
            title: "Available Food",
            description: "Explore food donations available in your community.",
            icon: "🥗",
            link: "/available-food",
            color: "orange",
            show: true,
        },
        {
            title: "My Food Requests",
            description: "Track the food requests you have submitted.",
            icon: "📋",
            link: "/my-requests",
            color: "blue",
            show: isReceiver,
        },
        {
            title: "Manage Requests",
            description: "Review and respond to requests for your donations.",
            icon: "🤝",
            link: "/donor-requests",
            color: "purple",
            show: isDonor,
        },
        {
            title: "My Donations",
            description: "View your donated food and its current status.",
            icon: "📦",
            link: "/my-donations",
            color: "green",
            show: isDonor,
        },
    ];

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <Link to="/dashboard" className="brand">
                    <span className="brand-icon">🍃</span>
                    FoodLoop
                </Link>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    ↪ Logout
                </button>
            </header>

            <main className="dashboard-main">
                <section className="welcome-banner">
                    <div className="welcome-content">
                        <span className="welcome-tag">
                            YOUR FOOD, THEIR SMILE
                        </span>

                        <h1>
                            Welcome to <span>FoodLoop!</span>
                        </h1>

                        <p className="welcome-message">
                            Hello, {user.name || user.email || "User"}!
                            <br />
                            Small acts of sharing can make a big difference.
                        </p>

                        <div className="role-badge">
                            <span>●</span>
                            {user.role || "USER"}
                        </div>
                    </div>

                    <div className="welcome-illustration">
                        <span>🥬</span>
                        <span>🍎</span>
                        <span>🥕</span>
                        <div className="illustration-plate">🍲</div>
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <span className="section-eyebrow">
                                YOUR WORKSPACE
                            </span>
                            <h2>What would you like to do?</h2>
                            <p>
                                From surplus to smiles — make every meal count.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        {dashboardItems
                            .filter((item) => item.show)
                            .map((item) => (
                                <Link
                                    to={item.link}
                                    className="dashboard-card"
                                    key={item.title}
                                >
                                    <div className={`card-icon ${item.color}`}>
                                        {item.icon}
                                    </div>

                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>

                                    <span className="card-action">
                                        Open section <span>→</span>
                                    </span>
                                </Link>
                            ))}
                    </div>
                </section>

                <footer className="dashboard-footer">
                    <span>🍃 FoodLoop</span>
                    <p>Reducing food waste, one meal at a time.</p>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;
