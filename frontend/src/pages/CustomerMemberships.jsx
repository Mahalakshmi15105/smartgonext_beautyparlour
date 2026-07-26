import React, { useState, useEffect } from "react";
import API from "../services/api";

function CustomerMemberships() {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    customer_id: "",
    plan_id: "",
    benefits: [], // array of { service_id, quantity }
  });

  // Action Modals (Renew / Upgrade)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeMembershipId, setActiveMembershipId] = useState(null);
  const [upgradePlanId, setUpgradePlanId] = useState("");
  const [upgradeBenefits, setUpgradeBenefits] = useState([]);

  // Search Customer for View
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/membership-plans?status=active").then((res) => setPlans(res.data.items));
    API.get("/services?status=active").then((res) => setServices(res.data.items));
  }, []);

  // Customer Autocomplete Lookup
  useEffect(() => {
    if (customerSearch.trim().length >= 2) {
      API.get(`/customers?q=${customerSearch}`).then((res) => setCustomers(res.data.items));
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  // Load customer's active memberships
  const fetchCustomerMemberships = (cust) => {
    setSelectedCustomer(cust);
    setLoading(true);
    API.get(`/customers/${cust.id}/memberships`)
      .then((res) => {
        setMemberships(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleAddBenefitRow = (isUpgrade = false) => {
    const defaultSvc = services.length > 0 ? services[0].id : "";
    if (isUpgrade) {
      setUpgradeBenefits([...upgradeBenefits, { service_id: defaultSvc, quantity: 1 }]);
    } else {
      setAssignForm({
        ...assignForm,
        benefits: [...assignForm.benefits, { service_id: defaultSvc, quantity: 1 }],
      });
    }
  };

  const handleBenefitChange = (index, field, val, isUpgrade = false) => {
    if (isUpgrade) {
      const updated = [...upgradeBenefits];
      updated[index][field] = field === "quantity" ? parseInt(val) || 1 : val;
      setUpgradeBenefits(updated);
    } else {
      const updated = [...assignForm.benefits];
      updated[index][field] = field === "quantity" ? parseInt(val) || 1 : val;
      setAssignForm({ ...assignForm, benefits: updated });
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    API.post("/memberships/assign", assignForm)
      .then(() => {
        setShowAssignModal(false);
        if (selectedCustomer && selectedCustomer.id === parseInt(assignForm.customer_id)) {
          fetchCustomerMemberships(selectedCustomer);
        } else {
          alert("Membership assigned successfully.");
        }
      })
      .catch((err) => {
        alert(err.message || "Failed to assign membership.");
      });
  };

  const handleRenew = (cmId) => {
    if (window.confirm("Are you sure you want to renew this membership? Renewal extends expiry date and resets benefit balances.")) {
      API.post(`/memberships/${cmId}/renew`)
        .then(() => {
          fetchCustomerMemberships(selectedCustomer);
        })
        .catch((err) => alert(err.message || "Failed to renew."));
    }
  };

  const handleCancel = (cmId) => {
    if (window.confirm("Are you sure you want to cancel this customer membership?")) {
      API.post(`/memberships/${cmId}/cancel`)
        .then(() => {
          fetchCustomerMemberships(selectedCustomer);
        })
        .catch((err) => alert(err.message || "Failed to cancel."));
    }
  };

  const openUpgradeModal = (cmId) => {
    setActiveMembershipId(cmId);
    setUpgradePlanId(plans.length > 0 ? plans[0].id : "");
    setUpgradeBenefits([]);
    setShowUpgradeModal(true);
  };

  const handleUpgradeSubmit = (e) => {
    e.preventDefault();
    API.post(`/memberships/${activeMembershipId}/upgrade`, {
      plan_id: upgradePlanId,
      benefits: upgradeBenefits,
    })
      .then(() => {
        setShowUpgradeModal(false);
        fetchCustomerMemberships(selectedCustomer);
      })
      .catch((err) => alert(err.message || "Failed to upgrade."));
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Customer Memberships</h1>
          <p className="text-xs text-text-secondary">Assign membership packages, manage benefit balances, renewals, and upgrades.</p>
        </div>
        <button
          onClick={() => {
            setAssignForm({
              customer_id: selectedCustomer ? selectedCustomer.id : "",
              plan_id: plans.length > 0 ? plans[0].id : "",
              benefits: [],
            });
            setShowAssignModal(true);
          }}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Assign Membership
        </button>
      </div>

      {/* Customer Selector / Search */}
      <div className="bg-surface border border-border-soft p-4 rounded-lg space-y-2 relative">
        <label className="block text-xs font-semibold text-text-secondary">Select Customer to View Active Packages</label>
        {selectedCustomer ? (
          <div className="flex justify-between items-center bg-primary-light border border-primary/20 px-4 py-2.5 rounded-lg">
            <span className="text-sm font-semibold text-primary">
              👤 {selectedCustomer.first_name} {selectedCustomer.last_name || ""} ({selectedCustomer.phone})
            </span>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setMemberships([]);
              }}
              className="text-xs text-danger font-semibold hover:underline"
            >
              Change Customer
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Type customer name or phone number..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full bg-background border border-border-soft px-4 py-2 rounded-lg text-sm focus:outline-none"
            />
            {customers.length > 0 && (
              <div className="absolute left-4 right-4 top-16 bg-surface border border-border-soft rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto divide-y divide-border-soft">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      fetchCustomerMemberships(c);
                      setCustomers([]);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-background transition"
                  >
                    {c.first_name} {c.last_name || ""} ({c.phone})
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Active Memberships Content */}
      {selectedCustomer && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Active & Past Packages for {selectedCustomer.first_name}</h3>
          {loading ? (
            <div className="p-8 space-y-4">
              <div className="h-6 bg-border-soft rounded animate-pulse w-1/4"></div>
              <div className="h-10 bg-border-soft rounded animate-pulse"></div>
            </div>
          ) : memberships.length === 0 ? (
            <div className="bg-surface border border-border-soft p-12 text-center rounded-lg">
              <p className="text-sm text-text-secondary mb-3">No membership package currently active for this customer.</p>
              <button
                onClick={() => {
                  setAssignForm({
                    customer_id: selectedCustomer.id,
                    plan_id: plans.length > 0 ? plans[0].id : "",
                    benefits: [],
                  });
                  setShowAssignModal(true);
                }}
                className="text-sm text-primary font-medium hover:underline"
              >
                Assign Package Now
              </button>
            </div>
          ) : (
            memberships.map((m) => (
              <div key={m.id} className="bg-surface border border-border-soft rounded-lg p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-start border-b border-border-soft pb-4">
                  <div>
                    <h4 className="text-base font-semibold text-text-primary">{m.plan_name}</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Expires: {new Date(m.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      m.status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}>
                      {m.status}
                    </span>
                    {m.status === "active" && (
                      <>
                        <button
                          onClick={() => handleRenew(m.id)}
                          className="px-3 py-1.5 border border-border-soft rounded-lg text-xs font-medium text-text-primary hover:bg-background transition"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => openUpgradeModal(m.id)}
                          className="px-3 py-1.5 bg-primary-light text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition"
                        >
                          Upgrade Plan
                        </button>
                        <button
                          onClick={() => handleCancel(m.id)}
                          className="px-3 py-1.5 text-danger text-xs font-medium hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Benefits List */}
                <div>
                  <h5 className="text-xs font-semibold text-text-secondary uppercase mb-3">Service Benefits Balance</h5>
                  {m.benefits.length === 0 ? (
                    <p className="text-xs text-text-secondary">No free service perks attached to this plan.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {m.benefits.map((b) => (
                        <div key={b.id} className="bg-background border border-border-soft p-3 rounded-lg flex justify-between items-center">
                          <span className="text-xs font-medium text-text-primary">{b.service_name}</span>
                          <span className="text-xs font-semibold text-primary">
                            {b.remaining_quantity} / {b.total_quantity} Left
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign Membership Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-lg w-full rounded-lg shadow-lg border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">Assign Customer Membership</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-text-secondary hover:text-text-primary">
                ✖
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Customer *</label>
                <select
                  required
                  value={assignForm.customer_id}
                  onChange={(e) => setAssignForm({ ...assignForm, customer_id: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                >
                  <option value="">Choose Customer</option>
                  {selectedCustomer && (
                    <option value={selectedCustomer.id}>
                      {selectedCustomer.first_name} ({selectedCustomer.phone})
                    </option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Membership Plan *</label>
                <select
                  required
                  value={assignForm.plan_id}
                  onChange={(e) => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - INR {p.price} ({p.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              {/* Free Service Perks Entry */}
              <div className="space-y-2 border-t border-border-soft pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-secondary">Free Service Perks</label>
                  <button
                    type="button"
                    onClick={() => handleAddBenefitRow(false)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    + Add Free Service
                  </button>
                </div>
                {assignForm.benefits.map((row, idx) => (
                  <div key={idx} className="flex space-x-2 items-center">
                    <select
                      value={row.service_id}
                      onChange={(e) => handleBenefitChange(idx, "service_id", e.target.value, false)}
                      className="flex-1 bg-background border border-border-soft px-2 py-1.5 rounded text-xs"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleBenefitChange(idx, "quantity", e.target.value, false)}
                      className="w-20 bg-background border border-border-soft px-2 py-1.5 rounded text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  Assign Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Membership Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-lg w-full rounded-lg shadow-lg border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">Upgrade Membership Tier</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="text-text-secondary hover:text-text-primary">
                ✖
              </button>
            </div>
            <form onSubmit={handleUpgradeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Target Plan Tier *</label>
                <select
                  required
                  value={upgradePlanId}
                  onChange={(e) => setUpgradePlanId(e.target.value)}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - INR {p.price} ({p.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 border-t border-border-soft pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-secondary">Free Service Perks for New Tier</label>
                  <button
                    type="button"
                    onClick={() => handleAddBenefitRow(true)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    + Add Free Service
                  </button>
                </div>
                {upgradeBenefits.map((row, idx) => (
                  <div key={idx} className="flex space-x-2 items-center">
                    <select
                      value={row.service_id}
                      onChange={(e) => handleBenefitChange(idx, "service_id", e.target.value, true)}
                      className="flex-1 bg-background border border-border-soft px-2 py-1.5 rounded text-xs"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleBenefitChange(idx, "quantity", e.target.value, true)}
                      className="w-20 bg-background border border-border-soft px-2 py-1.5 rounded text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  Confirm Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerMemberships;
