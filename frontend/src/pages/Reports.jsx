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

function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [preset, setPreset] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = () => {
    setLoading(true);
    let url = `/reports/${reportType}?preset=${preset}`;
    if (preset === "custom" && startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }

    API.get(url)
      .then((res) => {
        setReportData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load report dataset.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, preset, startDate, endDate]);

  const handleCSVExport = () => {
    let exportUrl = `http://localhost:5000/api/v1/reports/export?type=${reportType}&preset=${preset}`;
    if (preset === "custom" && startDate && endDate) {
      exportUrl += `&start_date=${startDate}&end_date=${endDate}`;
    }
    window.open(exportUrl, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Enterprise Business Reports</h1>
          <p className="text-xs text-text-secondary">Comprehensive tax reconciliation, staff performance ledgering, and sales analytics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCSVExport}
            className="bg-surface border border-border-soft hover:bg-background text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2"
          >
            <span>📥 Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2"
          >
            <span>🖨️ Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Category Selectors */}
      <div className="bg-surface border border-border-soft p-2 rounded-lg flex space-x-2">
        {[
          { id: "sales", label: "Sales & Billing" },
          { id: "tax", label: "Tax Reconciliation" },
          { id: "employees", label: "Employee Commissions" },
          { id: "products", label: "Product Inventory Sales" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition ${
              reportType === tab.id
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Presets Bar */}
      <div className="bg-surface border border-border-soft p-4 rounded-lg flex space-x-4 items-center">
        <label className="text-xs font-semibold text-text-secondary">Timeframe:</label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="bg-background border border-border-soft px-3 py-1.5 rounded-lg text-xs text-text-primary focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {preset === "custom" && (
          <div className="flex space-x-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border-soft px-2 py-1 rounded text-xs"
            />
            <span className="text-xs text-text-secondary">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border-soft px-2 py-1 rounded text-xs"
            />
          </div>
        )}
      </div>

      {/* Report Render Area */}
      <div id="print-area" className="space-y-6">
        {loading ? (
          <div className="p-8 bg-surface border border-border-soft rounded-lg space-y-4">
            <div className="h-6 bg-border-soft rounded animate-pulse w-1/4"></div>
            <div className="h-10 bg-border-soft rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-danger text-sm font-medium">{error}</div>
        ) : (
          <>
            {/* Sales & Billing Report View */}
            {reportType === "sales" && reportData && (
              <div className="space-y-6">
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">Gross Sales</p>
                    <p className="text-xl font-bold text-text-primary mt-1">INR {reportData.summary.total_sales.toFixed(2)}</p>
                  </div>
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">Tax Collected</p>
                    <p className="text-xl font-bold text-text-primary mt-1">INR {reportData.summary.total_tax.toFixed(2)}</p>
                  </div>
                  <div className="bg-surface border border-border-soft p-4 rounded-lg">
                    <p className="text-xs font-semibold text-text-secondary uppercase">Total Discounts</p>
                    <p className="text-xl font-bold text-danger mt-1">- INR {reportData.summary.total_discount.toFixed(2)}</p>
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
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Subtotal</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Discount</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Tax</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Total</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {reportData.items.map((row) => (
                        <tr key={row.id} className="hover:bg-background/50 transition">
                          <td className="px-4 py-3 font-semibold text-text-primary">{row.invoice_number}</td>
                          <td className="px-4 py-3 text-text-secondary">{row.date}</td>
                          <td className="px-4 py-3 text-text-primary">{row.customer_name}</td>
                          <td className="px-4 py-3 text-text-secondary">INR {row.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-danger">- INR {row.discount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-text-secondary">INR {row.tax.toFixed(2)}</td>
                          <td className="px-4 py-3 font-bold text-text-primary">INR {row.total.toFixed(2)}</td>
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
                  <span className="text-2xl font-bold text-primary">INR {reportData.total_tax_collected.toFixed(2)}</span>
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
                          <td className="px-6 py-3 text-text-secondary">INR {row.gross_subtotal.toFixed(2)}</td>
                          <td className="px-6 py-3 text-danger">- INR {row.discount.toFixed(2)}</td>
                          <td className="px-6 py-3 font-bold text-success">INR {row.tax_collected.toFixed(2)}</td>
                          <td className="px-6 py-3 font-semibold text-text-primary">INR {row.net_total.toFixed(2)}</td>
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
                          <td className="px-6 py-3 font-semibold text-text-primary">INR {row.total_revenue.toFixed(2)}</td>
                          <td className="px-6 py-3 font-bold text-success">INR {row.estimated_commission.toFixed(2)}</td>
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
                          <td className="px-6 py-3 text-text-secondary">INR {row.selling_price.toFixed(2)}</td>
                          <td className="px-6 py-3 font-medium text-text-primary">{row.stock_quantity} units</td>
                          <td className="px-6 py-3 text-text-secondary">{row.units_sold} units</td>
                          <td className="px-6 py-3 font-bold text-text-primary">INR {row.total_sales.toFixed(2)}</td>
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
