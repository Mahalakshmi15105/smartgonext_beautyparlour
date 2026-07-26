import React, { useState } from "react";
import Layout from "./components/Layout";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Billing from "./pages/Billing";
import MembershipPlans from "./pages/MembershipPlans";
import CustomerMemberships from "./pages/CustomerMemberships";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import API from "./services/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentView, setCurrentView] = useState(localStorage.getItem("token") ? "app" : "landing");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    API.post("/auth/login", { email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setLoading(false);
        setCurrentView("app");
        setActiveTab("dashboard");
      })
      .catch((err) => {
        setLoginError(err.message || "Invalid email or password.");
        setLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentView("landing");
  };

  // 1. Render Public Landing Page
  if (currentView === "landing") {
    return (
      <LandingPage
        onNavigateLogin={() => setCurrentView(token ? "app" : "login")}
        onNavigateRegister={() => setCurrentView("register")}
      />
    );
  }

  // 2. Render Public Registration Form
  if (currentView === "register") {
    return (
      <Register
        onRegisterSuccess={(newToken) => {
          setToken(newToken);
          setCurrentView("app");
          setActiveTab("dashboard");
        }}
        onNavigateLogin={() => setCurrentView("login")}
        onNavigateHome={() => setCurrentView("landing")}
      />
    );
  }

  // 3. Render Public Login Page
  if (currentView === "login" || (!token && currentView === "app")) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-surface border border-border-soft rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <button onClick={() => setCurrentView("landing")} className="text-xs text-primary font-bold hover:underline mb-2 block mx-auto">
              ← Back to SmartGoNext Home
            </button>
            <div className="inline-flex h-12 w-12 bg-primary text-white items-center justify-center rounded-xl font-bold text-lg mb-2 shadow-sm">
              S
            </div>
            <h1 className="text-xl font-bold text-text-primary">Sign in to your account</h1>
            <p className="text-xs text-text-secondary">Enter your admin credentials to access your parlour dashboard.</p>
          </div>

          {loginError && (
            <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartgonext.com"
                className="w-full bg-background border border-border-soft px-4 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border-soft px-4 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-border-soft">
            <p className="text-xs text-text-secondary">
              Don't have a salon account?{" "}
              <button onClick={() => setCurrentView("register")} className="text-primary font-bold hover:underline">
                Register Your Parlour
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Render Protected App Canvas
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "billing":
        return <Billing />;
      case "customers":
        return <Customers />;
      case "employees":
        return <Employees />;
      case "services":
        return <Services />;
      case "products":
        return <Products />;
      case "membership_plans":
        return <MembershipPlans />;
      case "customer_memberships":
        return <CustomerMemberships />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      case "super_admin":
        return <SuperAdmin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      onNavigateHome={() => setCurrentView("landing")}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
