import React, { useState, useEffect } from "react";
import API from "../services/api";

function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  // Form Modal Toggle
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Plan Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_days: "365",
    service_discount_percentage: "0",
    product_discount_percentage: "0",
    status: "active",
  });

  const fetchPlans = (currentCursor = null) => {
    setLoading(true);
    let url = `/membership-plans?limit=10`;
    if (currentCursor) url += `&cursor=${currentCursor}`;
    if (search) url += `&q=${search}`;
    if (status) url += `&status=${status}`;

    API.get(url)
      .then((res) => {
        setPlans(res.data.items);
        setNextCursor(res.data.next_cursor);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load membership plans.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlans();
  }, [search, status]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory([...cursorHistory, cursor]);
      setCursor(nextCursor);
      fetchPlans(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prev = cursorHistory[cursorHistory.length - 1];
      const newHistory = cursorHistory.slice(0, -1);
      setCursorHistory(newHistory);
      setCursor(prev);
      fetchPlans(prev);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_days: "365",
      service_discount_percentage: "0",
      product_discount_percentage: "0",
      status: "active",
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditId(p.id);
    setFormData({
      name: p.name || "",
      description: p.description || "",
      price: p.price || "",
      duration_days: p.duration_days || "365",
      service_discount_percentage: p.service_discount_percentage || "0",
      product_discount_percentage: p.product_discount_percentage || "0",
      status: p.status || "active",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editId ? API.put(`/membership-plans/${editId}`, formData) : API.post("/membership-plans", formData);

    action
      .then(() => {
        setShowModal(false);
        fetchPlans(cursor);
      })
      .catch((err) => {
        alert(err.message || "Operation failed.");
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this membership plan?")) {
      API.delete(`/membership-plans/${id}`)
        .then(() => {
          fetchPlans(cursor);
        })
        .catch((err) => {
          alert(err.message || "Failed to delete.");
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Membership Plans</h1>
          <p className="text-xs text-text-secondary">Configure salon membership tiers, pricing, free perks, and discount rates.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Create Plan
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-surface border border-border-soft p-4 rounded-lg flex space-x-4">
        <input
          type="text"
          placeholder="Search plan name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-background border border-border-soft px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-background border border-border-soft px-4 py-2 rounded-lg text-sm text-text-secondary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-border-soft rounded animate-pulse w-1/4"></div>
            <div className="h-10 bg-border-soft rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-danger text-sm font-medium">{error}</div>
        ) : plans.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-text-secondary mb-4">No membership plans created yet.</p>
            <button onClick={openAddModal} className="text-sm text-primary font-medium hover:underline">
              Create your first plan
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary-light border-b border-border-soft">
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Plan Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Price</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Validity</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Svc Disc %</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Prod Disc %</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-background/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      <div>
                        <p>{p.name}</p>
                        {p.description && <p className="text-xs text-text-secondary">{p.description}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">INR {p.price}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.duration_days} Days</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.service_discount_percentage}%</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.product_discount_percentage}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        p.status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => openEditModal(p)} className="text-primary hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-danger hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-border-soft flex justify-between items-center">
              <button
                disabled={cursorHistory.length === 0}
                onClick={handlePrevPage}
                className="px-4 py-2 border border-border-soft rounded-lg text-sm disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                disabled={!nextCursor}
                onClick={handleNextPage}
                className="px-4 py-2 border border-border-soft rounded-lg text-sm disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-lg w-full rounded-lg shadow-lg border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">
                {editId ? "Edit Membership Plan" : "Create Membership Plan"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary">
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold VIP Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief overview of plan benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Validity (Days) *</label>
                  <input
                    type="number"
                    required
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Service Discount %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.service_discount_percentage}
                    onChange={(e) => setFormData({ ...formData, service_discount_percentage: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Product Discount %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.product_discount_percentage}
                    onChange={(e) => setFormData({ ...formData, product_discount_percentage: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipPlans;
