import React, { useState, useEffect } from "react";
import API from "../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useLanguageCurrency } from "../context/LanguageCurrencyContext";

function Reports() {
  const { formatCurrency, t } = useLanguageCurrency();

  const [reportType, setReportType] = useState("sales");
  const [preset, setPreset] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    let url = `/reports/${reportType}?preset=${preset}`;
    if (preset === "custom" && startDate && endDate) {
      url = `/reports/${reportType}?start_date=${startDate}&end_date=${endDate}`;
    }

    API.get(url)
      .then((res) => {
        setReportData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load report analytics.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, preset]);

  const handleExportCSV = () => {
    let url = `${API.defaults.baseURL}/reports/export?report_type=${reportType}&preset=${preset}`;
    if (preset === "custom" && startDate && endDate) {
      url = `${API.defaults.baseURL}/reports/export?report_type=${reportType}&start_date=${startDate}&end_date=${endDate}`;
    }

    const token = localStorage.getItem("token");
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${reportType}_report_${preset}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert("Failed to export report CSV: " + err.message));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Export Control */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("reports")}</h1>
          <p className="text-xs text-text-secondary">Export financial ledgers, tax returns, commission payouts, and product inventory reports.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 shadow-sm"
        >
          <span>📥 Export CSV Report</span>
        </button>
      </div>

      {/* Preset & Filters Toolbar */}
      <div className="bg-surface border border-border-soft p-4 rounded-lg flex justify-between items-center space-x-4">
        {/* Module Sub-Tabs */}
        <div className="flex space-x-2">
          {[
            { id: "sales", label: "Sales & Financial Ledger" },
            { id: "tax", label: "Tax Reconciliation" },
            { id: "employees", label: "Staff Commissions" },
            { id: "products", label: "Product Performance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                reportType === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-background text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <label className="font-semibold text-text-secondary">Range:</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="bg-background border border-border-soft px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {preset === "custom" && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border border-border-soft px-2 py-1 rounded text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border border-border-soft px-2 py-1 rounded text-xs"
              />
              <button
                onClick={fetchReport}
                className="bg-primary text-white px-3 py-1 rounded font-semibold text-xs"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Canvas Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center bg-surface border border-border-soft rounded-lg space-y-3">
            <div className="h-6 bg-border-soft rounded animate-pulse w-1/4 mx-auto"></div>
            <div className="h-10 bg-border-soft rounded animate-pulse max-w-lg mx-auto"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-surface border border-border-soft rounded-lg text-danger text-sm font-semibold">
            {error}
          </div>
        ) : (
          <>
            {/* Sales Report View */}
            {reportType === "sales" && reportData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">{t("gross_total")}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">{formatCurrency(reportData.summary.total_sales)}</p>
                  </div>
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">{t("tax_amount")}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">{formatCurrency(reportData.summary.total_tax)}</p>
                  </div>
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">{t("total_discount")}</p>
                    <p className="text-xl font-bold text-danger mt-1">- {formatCurrency(reportData.summary.total_discount)}</p>
                  </div>
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">Order Volume</p>
                    <p className="text-xl font-bold text-text-primary mt-1">{reportData.summary.total_orders} Bills</p>
                  </div>
                </div>

                {/* Ledger Data Table */}
                <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-primary-light border-b border-border-soft">
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Invoice #</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Date</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Customer</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">{t("gross_amount")}</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">{t("discount_amount")}</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">{t("tax_amount")}</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">{t("net_payable")}</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {reportData.items.map((row) => (
                        <tr key={row.id} className="hover:bg-background/50 transition">
                          <td className="px-4 py-3 font-semibold text-text-primary">{row.invoice_number}</td>
                          <td className="px-4 py-3 text-text-secondary">{row.date}</td>
                          <td className="px-4 py-3 text-text-primary">{row.customer_name}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatCurrency(row.subtotal)}</td>
                          <td className="px-4 py-3 text-danger">- {formatCurrency(row.discount)}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatCurrency(row.tax)}</td>
                          <td className="px-4 py-3 font-bold text-text-primary">{formatCurrency(row.total)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              row.status === "Paid" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax Reconciliation Report View */}
            {reportType === "tax" && reportData && (
              <div className="space-y-6">
                <div className="bg-surface border border-border-soft p-6 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Total Tax Collected</h3>
                    <p className="text-xs text-text-secondary">GST / VAT Liability for filing period</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(reportData.total_tax_collected)}</span>
                </div>

                <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-primary-light border-b border-border-soft">
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Date</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Gross Subtotal</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Discounts</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Tax Collected</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Net Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {reportData.daily_tax_logs.map((row, idx) => (
                        <tr key={idx} className="hover:bg-background/50 transition">
                          <td className="px-6 py-3 font-semibold text-text-primary">{row.date}</td>
                          <td className="px-6 py-3 text-text-secondary">{formatCurrency(row.gross_subtotal)}</td>
                          <td className="px-6 py-3 text-danger">- {formatCurrency(row.discount)}</td>
                          <td className="px-6 py-3 font-bold text-success">{formatCurrency(row.tax_collected)}</td>
                          <td className="px-6 py-3 font-semibold text-text-primary">{formatCurrency(row.net_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Employee Commissions Report View */}
            {reportType === "employees" && Array.isArray(reportData) && (
              <div className="space-y-6">
                <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-primary-light border-b border-border-soft">
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Employee Name</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Commission Rate</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Services Rendered</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Total Revenue Delivered</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Calculated Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {reportData.map((row) => (
                        <tr key={row.employee_id} className="hover:bg-background/50 transition">
                          <td className="px-6 py-3 font-semibold text-text-primary">{row.name}</td>
                          <td className="px-6 py-3 text-text-secondary">{row.commission_percentage}%</td>
                          <td className="px-6 py-3 text-text-secondary">{row.services_rendered} Treatments</td>
                          <td className="px-6 py-3 font-semibold text-text-primary">{formatCurrency(row.total_revenue)}</td>
                          <td className="px-6 py-3 font-bold text-success">{formatCurrency(row.estimated_commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Inventory Report View */}
            {reportType === "products" && Array.isArray(reportData) && (
              <div className="space-y-6">
                <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-primary-light border-b border-border-soft">
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Product Name</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">SKU</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Unit Price</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Current Stock</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Units Sold</th>
                        <th className="px-6 py-3 font-semibold text-text-secondary uppercase">Total Retail Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {reportData.map((row) => (
                        <tr key={row.id} className="hover:bg-background/50 transition">
                          <td className="px-6 py-3 font-semibold text-text-primary">{row.name}</td>
                          <td className="px-6 py-3 text-text-secondary">{row.sku || "-"}</td>
                          <td className="px-6 py-3 text-text-secondary">{formatCurrency(row.selling_price)}</td>
                          <td className="px-6 py-3 font-medium text-text-primary">{row.stock_quantity} units</td>
                          <td className="px-6 py-3 text-text-secondary">{row.units_sold} units</td>
                          <td className="px-6 py-3 font-bold text-text-primary">{formatCurrency(row.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;
