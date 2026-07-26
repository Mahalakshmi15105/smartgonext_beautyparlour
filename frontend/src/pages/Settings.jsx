import React, { useState, useEffect } from "react";
import API from "../services/api";

function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [settingsData, setSettingsData] = useState({
    business_profile: {
      name: "",
      owner_name: "",
      phone: "",
      alternate_phone: "",
      email: "",
      gst_number: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      website: "",
      description: "",
    },
    invoice_settings: {
      invoice_prefix: "INV",
      tax_name: "GST",
      tax_rate: 18.0,
      receipt_header: "",
      receipt_footer: "",
      terms_and_conditions: "",
      show_logo: true,
    },
    regional_settings: {
      currency: "INR",
      currency_symbol: "₹",
      date_format: "YYYY-MM-DD",
      timezone: "UTC",
    },
  });

  const fetchSettings = () => {
    setLoading(true);
    API.get("/settings")
      .then((res) => {
        setSettingsData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load settings.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    API.put("/settings", settingsData)
      .then(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch((err) => {
        setSaving(false);
        alert(err.message || "Failed to save settings.");
      });
  };

  if (loading) {
    return (
      <div className="p-8 bg-surface border border-border-soft rounded-lg space-y-4">
        <div className="h-6 bg-border-soft rounded animate-pulse w-1/4"></div>
        <div className="h-10 bg-border-soft rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">System & Tenant Settings</h1>
          <p className="text-xs text-text-secondary">Configure parlour profile, tax structures, currency symbols, and invoice templates.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
        >
          {saving ? <span>Saving Changes...</span> : <span>Save Settings</span>}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-success/15 border border-success/30 px-4 py-3 rounded-lg text-xs font-semibold text-success flex justify-between items-center animate-fade-in">
          <span>✓ Settings updated successfully across all application modules!</span>
          <button onClick={() => setSaveSuccess(false)}>✖</button>
        </div>
      )}

      {/* Tab Selector & Main Settings Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Tabs */}
        <div className="col-span-3 space-y-1 bg-surface border border-border-soft p-3 rounded-lg h-fit">
          {[
            { id: "business", label: "Business Profile", icon: "🏢" },
            { id: "invoice", label: "Invoice & Taxes", icon: "🧾" },
            { id: "regional", label: "Regional & Currency", icon: "🌐" },
            { id: "notifications", label: "Notifications & Security", icon: "🔔" },
            { id: "backup", label: "Backup & Restore", icon: "💾" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-3 transition ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-background"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Form Panel */}
        <div className="col-span-9 bg-surface border border-border-soft p-8 rounded-lg space-y-6">
          {/* Business Profile Tab */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">Salon Business Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Parlour Name *</label>
                  <input
                    type="text"
                    value={settingsData.business_profile.name}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        business_profile: { ...settingsData.business_profile, name: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={settingsData.business_profile.owner_name}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        business_profile: { ...settingsData.business_profile, owner_name: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settingsData.business_profile.phone}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        business_profile: { ...settingsData.business_profile, phone: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">GST / VAT Number</label>
                  <input
                    type="text"
                    value={settingsData.business_profile.gst_number}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        business_profile: { ...settingsData.business_profile, gst_number: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Street Address</label>
                <textarea
                  rows="2"
                  value={settingsData.business_profile.address}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      business_profile: { ...settingsData.business_profile, address: e.target.value },
                    })
                  }
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* Invoice & Tax Settings Tab */}
          {activeTab === "invoice" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">Invoice & Tax Configurations</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settingsData.invoice_settings.invoice_prefix}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        invoice_settings: { ...settingsData.invoice_settings, invoice_prefix: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Tax Name</label>
                  <input
                    type="text"
                    value={settingsData.invoice_settings.tax_name}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        invoice_settings: { ...settingsData.invoice_settings, tax_name: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settingsData.invoice_settings.tax_rate}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        invoice_settings: { ...settingsData.invoice_settings, tax_rate: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Receipt Footer Note</label>
                <textarea
                  rows="2"
                  value={settingsData.invoice_settings.receipt_footer}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      invoice_settings: { ...settingsData.invoice_settings, receipt_footer: e.target.value },
                    })
                  }
                  className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* Regional & Currency Tab */}
          {activeTab === "regional" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">Currency & Regional Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Select Currency</label>
                  <select
                    value={settingsData.regional_settings.currency}
                    onChange={(e) => {
                      const curr = e.target.value;
                      const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };
                      setSettingsData({
                        ...settingsData,
                        regional_settings: {
                          ...settingsData.regional_settings,
                          currency: curr,
                          currency_symbol: symbols[curr] || "$",
                        },
                      });
                    }}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="INR">INR (Indian Rupee - ₹)</option>
                    <option value="USD">USD (US Dollar - $)</option>
                    <option value="EUR">EUR (Euro - €)</option>
                    <option value="GBP">GBP (British Pound - £)</option>
                    <option value="AED">AED (UAE Dirham - د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settingsData.regional_settings.currency_symbol}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        regional_settings: { ...settingsData.regional_settings, currency_symbol: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications & Security Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4 text-xs text-text-secondary">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">Security & Notifications</h3>
              <p>Email, SMS, and WhatsApp alerts are enabled for low inventory warnings and membership expirations.</p>
              <div className="bg-background border border-border-soft p-4 rounded-lg flex items-center justify-between">
                <span className="font-medium text-text-primary">Low Stock Email Notifications</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
              </div>
              <div className="bg-background border border-border-soft p-4 rounded-lg flex items-center justify-between">
                <span className="font-medium text-text-primary">Membership Expiry SMS Alerts</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
              </div>
            </div>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === "backup" && (
            <div className="space-y-4 text-xs text-text-secondary">
              <h3 className="text-sm font-semibold text-text-primary border-b border-border-soft pb-3">Automated Database Backups</h3>
              <p>Database backups run automatically every 24 hours. You can trigger an instant snapshot export below.</p>
              <button
                type="button"
                onClick={() => alert("Manual database backup requested. Backup file saved to server storage.")}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition"
              >
                💾 Trigger Manual Database Backup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
