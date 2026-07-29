import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { X } from "lucide-react";
import { useModalFocusTrap, useFormKeyboardNavigation } from "../utils/keyboardNavigation";

function SuperAdmin() {
  const modalRef = useRef(null);
  const formRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tenant Provisioning Modal
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    name: "",
    admin_email: "",
    admin_password: "",
    plan_id: "",
  });

  useModalFocusTrap(showProvisionModal, modalRef, () => setShowProvisionModal(false));
  useFormKeyboardNavigation(formRef, () => {
    const submitBtn = modalRef.current?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get("/super-admin/dashboard"),
      API.get("/super-admin/tenants?limit=50"),
      API.get("/super-admin/subscription-plans"),
      API.get("/super-admin/system-health"),
      API.get("/super-admin/audit-logs"),
    ])
      .then(([dashRes, tenRes, planRes, healthRes, auditRes]) => {
        setDashboard(dashRes.data);
        setTenants(tenRes.data.items);
        setPlans(planRes.data);
        setSystemHealth(healthRes.data);
        setAuditLogs(auditRes.data);
        if (planRes.data.length > 0 && !provisionForm.plan_id) {
          setProvisionForm((prev) => ({ ...prev, plan_id: planRes.data[0].id }));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load Super Admin portal dataset.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProvisionSubmit = (e) => {
    e.preventDefault();
    API.post("/super-admin/tenants", provisionForm)
      .then(() => {
        setShowProvisionModal(false);
        setProvisionForm({ name: "", admin_email: "", admin_password: "", plan_id: plans[0]?.id || "" });
        fetchData();
      })
      .catch((err) => alert(err.message || "Provisioning failed."));
  };

  const handleStatusToggle = (tenantId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    if (window.confirm(`Are you sure you want to change status to '${newStatus}'?`)) {
      API.put(`/super-admin/tenants/${tenantId}`, { status: newStatus })
        .then(() => fetchData())
        .catch((err) => alert(err.message || "Status update failed."));
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-surface border border-border-soft rounded-lg space-y-4">
        <div className="h-6 bg-border-soft rounded animate-pulse w-1/4"></div>
        <div className="h-10 bg-border-soft rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-danger text-sm font-medium">{error}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Platform Super Admin Portal</h1>
          <p className="text-xs text-text-secondary">SaaS Multi-tenant provisioning, MRR revenue metrics, and system health controls.</p>
        </div>
        <button
          onClick={() => setShowProvisionModal(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
        >
          + Provision Beauty Parlour
        </button>
      </div>

      {/* Category Tabs */}
      <div className="bg-surface border border-border-soft p-2 rounded-lg flex space-x-2">
        {[
          { id: "overview", label: "Executive Overview" },
          { id: "tenants", label: "Beauty Parlour Tenants" },
          { id: "plans", label: "Subscription Plans" },
          { id: "health", label: "System Health & Diagnostics" },
          { id: "audit", label: "Audit Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-text-secondary uppercase">Monthly Recurring Revenue (MRR)</p>
              <p className="text-2xl font-bold text-text-primary mt-2">INR {dashboard?.metrics?.mrr?.toFixed(2)}</p>
              <p className="text-[10px] text-success font-medium mt-1">ARR: INR {dashboard?.metrics?.arr?.toFixed(2)}</p>
            </div>
            <div className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-text-secondary uppercase">Total Beauty Parlours</p>
              <p className="text-2xl font-bold text-text-primary mt-2">{dashboard?.metrics?.total_tenants}</p>
              <p className="text-[10px] text-success font-medium mt-1">{dashboard?.metrics?.active_tenants} Active Salons</p>
            </div>
            <div className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-text-secondary uppercase">Platform Clients Served</p>
              <p className="text-2xl font-bold text-text-primary mt-2">{dashboard?.metrics?.total_customers}</p>
              <p className="text-[10px] text-text-secondary mt-1">{dashboard?.metrics?.total_employees} Stylists Onboarded</p>
            </div>
            <div className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-text-secondary uppercase">Total Checkout Invoices</p>
              <p className="text-2xl font-bold text-text-primary mt-2">{dashboard?.metrics?.total_invoices}</p>
              <p className="text-[10px] text-text-secondary mt-1">Processed Across Platform</p>
            </div>
          </div>

          <div className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Recent Salon Tenant Registrations</h3>
            <div className="divide-y divide-border-soft text-xs">
              {dashboard?.recent_tenants?.map((t) => (
                <div key={t.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-text-primary">{t.name}</p>
                    <p className="text-text-secondary">Plan: {t.plan_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    t.status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tenants Management Tab */}
      {activeTab === "tenants" && (
        <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-primary-light border-b border-border-soft">
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Parlour Name</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Admin Email</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Subscription Plan</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Expiry Date</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Status</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-background/50 transition">
                  <td className="px-6 py-4 font-semibold text-text-primary">{t.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{t.admin_email}</td>
                  <td className="px-6 py-4 font-medium text-text-primary">{t.plan_name}</td>
                  <td className="px-6 py-4 text-text-secondary">{t.subscription_expires_at ? new Date(t.subscription_expires_at).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      t.status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(t.id, t.status)}
                      className={`text-xs font-semibold hover:underline ${
                        t.status === "active" ? "text-danger" : "text-success"
                      }`}
                    >
                      {t.status === "active" ? "Suspend Salon" : "Activate Salon"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscription Plans Tab */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-surface border border-border-soft p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-text-primary">{p.name}</h3>
              <p className="text-2xl font-bold text-primary">INR {p.price} <span className="text-xs text-text-secondary font-normal">/ {p.duration_days} Days</span></p>
              <ul className="text-xs text-text-secondary space-y-2 border-t border-border-soft pt-4">
                <li>• Max Employees: {p.max_employees}</li>
                <li>• Max Services: {p.max_services}</li>
                <li>• Max Customers: {p.max_customers}</li>
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === "health" && systemHealth && (
        <div className="bg-surface border border-border-soft p-8 rounded-lg space-y-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">System Diagnostics & Infrastructure Health</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-background border border-border-soft p-4 rounded-lg">
              <p className="text-xs font-semibold text-text-secondary uppercase">Database Status</p>
              <p className="text-sm font-bold text-success mt-1">● {systemHealth.database_status}</p>
            </div>
            <div className="bg-background border border-border-soft p-4 rounded-lg">
              <p className="text-xs font-semibold text-text-secondary uppercase">API Gateway</p>
              <p className="text-sm font-bold text-success mt-1">● {systemHealth.api_gateway}</p>
            </div>
            <div className="bg-background border border-border-soft p-4 rounded-lg">
              <p className="text-xs font-semibold text-text-secondary uppercase">Active Sessions</p>
              <p className="text-sm font-bold text-text-primary mt-1">{systemHealth.active_tenant_sessions} Active Tenants</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-primary-light border-b border-border-soft">
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Action</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Details</th>
                <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-background/50 transition">
                  <td className="px-6 py-3 font-semibold text-primary">{l.action}</td>
                  <td className="px-6 py-3 text-text-secondary">{l.details}</td>
                  <td className="px-6 py-3 text-text-secondary">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div ref={modalRef} className="bg-surface max-w-md w-full rounded-lg shadow-lg border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">Provision New Beauty Parlour</h3>
              <button onClick={() => setShowProvisionModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form ref={formRef} onSubmit={handleProvisionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Parlour Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glamour Glow Salon"
                  value={provisionForm.name}
                  onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Admin Email *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@glamourglow.com"
                  value={provisionForm.admin_email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, admin_email: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Admin Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={provisionForm.admin_password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, admin_password: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Subscription Plan Tier *</label>
                <select
                  required
                  value={provisionForm.plan_id}
                  onChange={(e) => setProvisionForm({ ...provisionForm, plan_id: e.target.value })}
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - INR {p.price}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  Provision Salon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdmin;
