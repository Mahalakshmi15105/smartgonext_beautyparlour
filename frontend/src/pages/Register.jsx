import React, { useState } from "react";
import API from "../services/api";

function Register({ onRegisterSuccess, onNavigateLogin, onNavigateHome }) {
  const [formData, setFormData] = useState({
    parlour_name: "",
    owner_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    API.post("/auth/register", formData)
      .then((res) => {
        setLoading(false);
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        onRegisterSuccess(token, user);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || "Registration failed. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full bg-surface border border-border-soft p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <button onClick={onNavigateHome} className="text-xs text-primary font-bold hover:underline mb-2 block mx-auto">
            ← Back to SmartGoNext Home
          </button>
          <h2 className="text-2xl font-bold text-text-primary">Register Your Parlour</h2>
          <p className="text-xs text-text-secondary">Start your 14-day free trial. No credit card required.</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 p-3 rounded-lg text-xs font-semibold text-danger text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Beauty Parlour Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Glamour Glow Salon"
              value={formData.parlour_name}
              onChange={(e) => setFormData({ ...formData, parlour_name: e.target.value })}
              className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Owner Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="owner@yourparlour.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="Create strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Your Salon Account..." : "Create Account & Start Free Trial"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border-soft">
          <p className="text-xs text-text-secondary">
            Already have a parlour account?{" "}
            <button onClick={onNavigateLogin} className="text-primary font-bold hover:underline">
              Log in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
