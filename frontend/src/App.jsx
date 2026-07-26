import React, { useState, useEffect } from "react";
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
import { LogOut, ShieldCheck, Sparkles } from "lucide-react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

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
        const { token, user: userObj } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userObj));
        setToken(token);
        setUser(userObj);
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
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setCurrentView("landing");
  };

  // Fetch current user details if token exists but user state is missing
  useEffect(() => {
    if (token && !user) {
      API.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => handleLogout());
    }
  }, [token]);

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
        onRegisterSuccess={(newToken, userObj) => {
          localStorage.setItem("token", newToken);
          localStorage.setItem("user", JSON.stringify(userObj));
          setToken(newToken);
          setUser(userObj);
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
            <div className="inline-flex h-12 w-12 bg-gradient-to-tr from-pink-600 to-rose-400 text-white items-center justify-center rounded-xl font-bold text-lg mb-2 shadow-md shadow-pink-500/20">
              <Sparkles className="w-6 h-6 text-white" />
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

  // 4. SEPARATE SUPER ADMIN ARCHITECTURE: Independent Portal Layout
  if (user?.role === "SuperAdmin") {
    return (
      <div className="min-h-screen bg-background font-sans text-slate-800">
        <header className="h-16 bg-surface border-b border-border-soft px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldCheck className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">SmartGoNext SaaS Platform</span>
              <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider block -mt-1">Super Admin Console</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 text-white font-bold px-3 py-1 rounded-full border border-pink-500/30">
              Super Admin Privilege
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-xs text-danger font-semibold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <SuperAdmin />
        </main>
      </div>
    );
  }

  // 5. SALON OWNER / PARLOUR ADMIN PORTAL
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
