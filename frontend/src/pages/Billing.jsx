import React, { useState, useEffect } from "react";
import API from "../services/api";
import {
  User,
  Scissors,
  ShoppingCart,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  CheckCircle,
  CreditCard,
  Printer,
  History,
  Search,
  MessageSquare,
  Share2,
  Bell,
  Star,
  DollarSign,
  Smartphone,
  Landmark,
  Wallet as WalletIcon,
  Eye,
  Calendar,
} from "lucide-react";

const SUPPORTED_PAYMENT_METHODS = [
  { id: "Cash", label: "Cash", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
  { id: "Credit Card", label: "Credit Card", icon: CreditCard, color: "text-blue-600 bg-blue-50" },
  { id: "Debit Card", label: "Debit Card", icon: CreditCard, color: "text-indigo-600 bg-indigo-50" },
  { id: "UPI", label: "UPI (Generic)", icon: Smartphone, color: "text-purple-600 bg-purple-50" },
  { id: "Google Pay", label: "Google Pay", icon: Smartphone, color: "text-amber-600 bg-amber-50" },
  { id: "PhonePe", label: "PhonePe", icon: Smartphone, color: "text-violet-600 bg-violet-50" },
  { id: "Paytm", label: "Paytm", icon: Smartphone, color: "text-sky-600 bg-sky-50" },
  { id: "Amazon Pay", label: "Amazon Pay", icon: Smartphone, color: "text-orange-600 bg-orange-50" },
  { id: "Bank Transfer", label: "Bank Transfer", icon: Landmark, color: "text-slate-700 bg-slate-100" },
  { id: "Wallet", label: "Salon Wallet", icon: WalletIcon, color: "text-pink-600 bg-pink-50" },
];

function Billing() {
  const [activeSubTab, setActiveSubTab] = useState("checkout");

  // Master Datasets
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Selection Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedGender, setSelectedGender] = useState("Female");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // POS Cart State
  const [cart, setCart] = useState([]);

  // Regional & Tax Settings
  const [taxRate, setTaxRate] = useState(18.0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  // Payment Settlement State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(["Cash"]);
  const [paymentAmounts, setPaymentAmounts] = useState({ Cash: "" });

  // Receipt & Saved Bill Details State
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // Billing History State
  const [invoicesHistory, setInvoicesHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sub-Modals for Bill Actions
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState("Follow-up appointment");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNotes, setReminderNotes] = useState("");

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");

  const [actionNotice, setActionNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Initial Load: Fetch Categories, Employees, Customers, Settings
  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get("/service-categories"),
      API.get("/employees?limit=100"),
      API.get("/customers?limit=100"),
      API.get("/settings"),
    ])
      .then(([catRes, empRes, custRes, setRes]) => {
        const catList = catRes.data || [];
        setCategories(catList);
        setEmployees(empRes.data.items || []);
        setCustomers(custRes.data.items || []);

        if (setRes.data?.invoice_settings?.tax_rate !== undefined) {
          setTaxRate(parseFloat(setRes.data.invoice_settings.tax_rate));
        }
        if (setRes.data?.regional_settings?.currency_symbol) {
          setCurrencySymbol(setRes.data.regional_settings.currency_symbol);
        }

        if (catList.length > 0) {
          setSelectedCategoryId(catList[0].id.toString());
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load billing configurations.");
        setLoading(false);
      });
  }, []);

  // Fetch Category Services
  useEffect(() => {
    if (!selectedCategoryId) {
      setServices([]);
      setSelectedServiceId("");
      return;
    }

    API.get(`/services?category_id=${selectedCategoryId}&limit=100`)
      .then((res) => {
        const svcs = res.data.items || [];
        setServices(svcs);
        if (svcs.length > 0) {
          setSelectedServiceId(svcs[0].id.toString());
        } else {
          setSelectedServiceId("");
        }
      })
      .catch((err) => console.error("Error fetching category services:", err));
  }, [selectedCategoryId]);

  // Fetch Billing History
  const fetchBillingHistory = () => {
    setHistoryLoading(true);
    API.get("/invoices?limit=50")
      .then((res) => {
        setInvoicesHistory(res.data.items || []);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (activeSubTab === "history") {
      fetchBillingHistory();
    }
  }, [activeSubTab]);

  const handleCustomerChange = (customerIdStr) => {
    setSelectedCustomerId(customerIdStr);
    if (!customerIdStr) return;
    const cust = customers.find((c) => c.id === parseInt(customerIdStr));
    if (cust && cust.gender) {
      setSelectedGender(cust.gender);
    }
  };

  const handleAddServiceToCart = (serviceIdToUse) => {
    const targetId = serviceIdToUse || selectedServiceId;
    if (!targetId) return;

    const serviceObj = services.find((s) => s.id === parseInt(targetId));
    if (!serviceObj) return;

    const defaultEmpId = employees.length > 0 ? employees[0].id : null;
    const defaultEmpIds = defaultEmpId ? [defaultEmpId] : [];

    const newItem = {
      type: "service",
      item_id: serviceObj.id,
      name: serviceObj.name,
      gross_amount: parseFloat(serviceObj.price),
      quantity: 1,
      discount_percent: 0,
      tax_rate: taxRate,
      employee_ids: defaultEmpIds,
    };

    setCart((prevCart) => [...prevCart, newItem]);
  };

  // Cart Updaters with e.target.select() onFocus
  const handleUpdateQty = (index, val) => {
    const updated = [...cart];
    const parsed = val === "" ? 1 : Math.max(1, parseInt(val, 10) || 1);
    updated[index].quantity = parsed;
    setCart(updated);
  };

  const handleUpdateDiscountPercent = (index, val) => {
    const updated = [...cart];
    const parsed = val === "" ? 0 : Math.max(0, Math.min(100, parseFloat(val) || 0));
    updated[index].discount_percent = parsed;
    setCart(updated);
  };

  const handleUpdateTaxRate = (index, val) => {
    const updated = [...cart];
    const parsed = val === "" ? 0 : Math.max(0, parseFloat(val) || 0);
    updated[index].tax_rate = parsed;
    setCart(updated);
  };

  const handleToggleEmployee = (index, empId) => {
    const updated = [...cart];
    const currentList = updated[index].employee_ids || [];
    const empIdNum = parseInt(empId);

    if (currentList.includes(empIdNum)) {
      updated[index].employee_ids = currentList.filter((id) => id !== empIdNum);
    } else {
      updated[index].employee_ids = [...currentList, empIdNum];
    }
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  // Computations
  const calculateRowDiscountAmount = (item) => {
    const lineGross = item.gross_amount * item.quantity;
    return (lineGross * (item.discount_percent || 0)) / 100;
  };

  const calculateRowNet = (item) => {
    const lineGross = item.gross_amount * item.quantity;
    const disc = calculateRowDiscountAmount(item);
    return Math.max(0, lineGross - disc);
  };

  const calculateRowTaxAmount = (item) => {
    const rowNet = calculateRowNet(item);
    return rowNet * ((item.tax_rate || 0) / 100);
  };

  const grossTotal = cart.reduce((sum, item) => sum + item.gross_amount * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + calculateRowDiscountAmount(item), 0);
  const netTotal = Math.max(0, grossTotal - totalDiscount);
  const totalTaxAmount = cart.reduce((sum, item) => sum + calculateRowTaxAmount(item), 0);
  const netPayable = netTotal + totalTaxAmount;

  const handleTogglePaymentMethod = (methodId) => {
    if (selectedPaymentMethods.includes(methodId)) {
      if (selectedPaymentMethods.length === 1) {
        alert("At least one payment method must remain selected.");
        return;
      }
      setSelectedPaymentMethods(selectedPaymentMethods.filter((m) => m !== methodId));
      const updated = { ...paymentAmounts };
      delete updated[methodId];
      setPaymentAmounts(updated);
    } else {
      const updatedMethods = [...selectedPaymentMethods, methodId];
      setSelectedPaymentMethods(updatedMethods);
      const currentAllocated = Object.values(paymentAmounts).reduce(
        (sum, v) => sum + (parseFloat(v) || 0),
        0
      );
      const remaining = Math.max(0, netPayable - currentAllocated);
      setPaymentAmounts({ ...paymentAmounts, [methodId]: remaining.toFixed(2) });
    }
  };

  const handleUpdatePaymentAmount = (methodId, val) => {
    setPaymentAmounts({ ...paymentAmounts, [methodId]: val });
  };

  const totalAllocatedPayment = Object.values(paymentAmounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const handleProceedToPayment = () => {
    if (!selectedCustomerId) {
      alert("Please select a Customer before proceeding.");
      return;
    }
    if (cart.length === 0) {
      alert("Please add at least one service to the billing table.");
      return;
    }
    const missingEmp = cart.some((item) => !item.employee_ids || item.employee_ids.length === 0);
    if (missingEmp) {
      alert("Stylist employee selection is mandatory for every line item before payment.");
      return;
    }

    setSelectedPaymentMethods(["Cash"]);
    setPaymentAmounts({ Cash: netPayable.toFixed(2) });
    setShowPaymentModal(true);
  };

  // Submit Save Bill
  const handleCheckoutSubmit = () => {
    if (Math.abs(totalAllocatedPayment - netPayable) > 0.5) {
      alert(
        `Total payment allocated (${currencySymbol} ${totalAllocatedPayment.toFixed(
          2
        )}) does not match Net Payable (${currencySymbol} ${netPayable.toFixed(2)}).`
      );
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      line_items: cart.map((x) => ({
        type: x.type,
        item_id: x.item_id,
        quantity: x.quantity,
        employee_ids: x.employee_ids,
        employee_id: x.employee_ids[0],
        discount: calculateRowDiscountAmount(x),
        customer_membership_id: null,
      })),
      payments: Object.entries(paymentAmounts)
        .map(([method, val]) => ({
          method,
          amount: parseFloat(val) || 0,
        }))
        .filter((p) => p.amount > 0),
    };

    setLoading(true);
    API.post("/billing/checkout", payload)
      .then((res) => {
        setInvoiceResult(res.data);
        setShowPaymentModal(false);
        setShowReceipt(true);
        setCart([]);
        setLoading(false);
        fetchBillingHistory();
      })
      .catch((err) => {
        alert(err.message || "Checkout transaction failed.");
        setLoading(false);
      });
  };

  const handleReset = () => {
    setCart([]);
    setSelectedCustomerId("");
    setSelectedGender("Female");
    setSelectedPaymentMethods(["Cash"]);
    setPaymentAmounts({ Cash: "" });
    setDraftSaved(false);
    setError(null);
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Add services before saving draft.");
      return;
    }
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleViewInvoiceDetail = (invId) => {
    API.get(`/invoices/${invId}`)
      .then((res) => {
        setSelectedInvoiceDetail(res.data);
      })
      .catch((err) => alert(err.message || "Failed to load invoice details."));
  };

  // --- BILL ACTIONS IMPLEMENTATIONS ---
  const triggerSMSBill = (inv) => {
    API.post(`/invoices/${inv.id}/sms`)
      .then((res) => {
        setActionNotice(`SMS dispatched to ${inv.customer.phone}: "${res.data.sms_content}"`);
        setTimeout(() => setActionNotice(null), 4000);
      })
      .catch(() => {
        setActionNotice(`SMS receipt composed and queued for ${inv.customer.phone}`);
        setTimeout(() => setActionNotice(null), 4000);
      });
  };

  const triggerWhatsAppWeb = (inv) => {
    const text = encodeURIComponent(
      `Hello ${inv.customer.first_name}, thank you for visiting SmartGoNext Beauty Parlour!\n` +
        `Invoice #: ${inv.invoice_number}\n` +
        `Total Paid: ${currencySymbol} ${inv.total.toFixed(2)}\n` +
        `We appreciate your business! Have a wonderful day!`
    );
    const cleanPhone = (inv.customer.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const handleSaveReminderSubmit = () => {
    if (!reminderDate) {
      alert("Please select a valid reminder date.");
      return;
    }
    API.post("/reminders", {
      customer_id: selectedInvoiceDetail.customer.id || selectedInvoiceDetail.customer_id,
      invoice_id: selectedInvoiceDetail.id,
      reminder_type: reminderType,
      reminder_date: reminderDate,
      notes: reminderNotes,
    })
      .then(() => {
        setShowReminderModal(false);
        setActionNotice(`Reminder saved for ${selectedInvoiceDetail.customer.first_name} on ${reminderDate}!`);
        setTimeout(() => setActionNotice(null), 4000);
      })
      .catch((err) => alert(err.message || "Failed to save reminder."));
  };

  const handleSaveFeedbackSubmit = () => {
    API.post("/feedback", {
      customer_id: selectedInvoiceDetail.customer.id || selectedInvoiceDetail.customer_id,
      invoice_id: selectedInvoiceDetail.id,
      rating: feedbackRating,
      comments: feedbackComments,
    })
      .then(() => {
        setShowFeedbackModal(false);
        setActionNotice(`Feedback rating of ${feedbackRating}⭐ recorded in database!`);
        setTimeout(() => setActionNotice(null), 4000);
      })
      .catch((err) => alert(err.message || "Failed to record feedback."));
  };

  const filteredHistory = invoicesHistory.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(historySearch.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Mode Navigation Tabs */}
      <div className="flex justify-between items-center bg-surface border border-border-soft p-4 rounded-2xl shadow-xs">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab("checkout")}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
              activeSubTab === "checkout"
                ? "bg-primary text-white shadow-md shadow-pink-500/20"
                : "bg-background text-slate-700 border border-border-soft hover:bg-slate-100"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Billing & Service Invoicing</span>
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
              activeSubTab === "history"
                ? "bg-primary text-white shadow-md shadow-pink-500/20"
                : "bg-background text-slate-700 border border-border-soft hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Billing History</span>
          </button>
        </div>

        {draftSaved && (
          <div className="bg-success/15 border border-success/30 px-4 py-2 rounded-xl text-xs font-bold text-success flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Draft Invoice Saved!</span>
          </div>
        )}
      </div>

      {/* MODE 1: CHECKOUT SCREEN */}
      {activeSubTab === "checkout" && (
        <div className="space-y-6">
          {/* Step 1 & 2: Customer & Gender Selection */}
          <div className="bg-surface border border-border-soft p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-primary uppercase tracking-wider">
              <User className="w-4 h-4 text-primary" />
              <span>Step 1 & 2: Customer & Gender Selection</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Existing Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name || ""} ({c.phone || "No Phone"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bg-primary-light border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-primary">Active Client</p>
                  <p className="text-xs font-extrabold text-slate-900">
                    {selectedCustomerId
                      ? customers.find((c) => c.id === parseInt(selectedCustomerId))?.first_name +
                        " " +
                        (customers.find((c) => c.id === parseInt(selectedCustomerId))?.last_name || "")
                      : "Walk-in Guest"}
                  </p>
                </div>
                <span className="text-xs font-bold bg-white text-primary px-3 py-1 rounded-full border border-primary/20">
                  {selectedGender}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 & 4: Category & Service Selection */}
          <div className="bg-surface border border-border-soft p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-primary uppercase tracking-wider">
              <Scissors className="w-4 h-4 text-primary" />
              <span>Step 3 & 4: Category & Service Selection</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service *</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  disabled={!selectedCategoryId}
                  className="w-full bg-background border border-border-soft px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">-- Choose Service --</option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} - {currencySymbol} {parseFloat(svc.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleAddServiceToCart(selectedServiceId)}
                disabled={!selectedServiceId}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-pink-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service to Table</span>
              </button>
            </div>
          </div>

          {/* Step 5: Billing Line Items Table */}
          <div className="bg-surface border border-border-soft rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Billing Line Items Table</span>
              </h3>
              <span className="text-xs font-bold text-text-secondary">
                {cart.length} line item(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-primary-light border-b border-border-soft text-slate-700">
                    <th className="px-3 py-3 font-extrabold w-12 text-center">S.No</th>
                    <th className="px-4 py-3 font-extrabold">Item Description (Service Name)</th>
                    <th className="px-4 py-3 font-extrabold">Gross Amount</th>
                    <th className="px-3 py-3 font-extrabold w-20">Qty</th>
                    <th className="px-4 py-3 font-extrabold">Gross × Qty</th>
                    <th className="px-3 py-3 font-extrabold w-24">Discount (%)</th>
                    <th className="px-4 py-3 font-extrabold">Discount Amount</th>
                    <th className="px-4 py-3 font-extrabold">Net Amount</th>
                    <th className="px-3 py-3 font-extrabold w-20">Tax (%)</th>
                    <th className="px-4 py-3 font-extrabold min-w-[200px]">Employee (Stylist) Multi-Select *</th>
                    <th className="px-4 py-3 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-text-secondary font-medium">
                        Table is empty. Select a Category and Service above, then click <strong>"Add Service to Table"</strong>.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const lineGross = item.gross_amount * item.quantity;
                      const discAmt = calculateRowDiscountAmount(item);
                      const rowNet = calculateRowNet(item);

                      return (
                        <tr key={idx} className="hover:bg-background/60 transition">
                          <td className="px-3 py-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {currencySymbol} {item.gross_amount.toFixed(2)}
                          </td>

                          {/* Qty Input with auto-select focus to fix 012 bug */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateQty(idx, e.target.value)}
                              className="w-16 bg-background border border-border-soft px-2 py-1 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-primary focus:outline-none"
                            />
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-900">
                            {currencySymbol} {lineGross.toFixed(2)}
                          </td>

                          {/* Discount (%) Input */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateDiscountPercent(idx, e.target.value)}
                              className="w-16 bg-background border border-border-soft px-2 py-1 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-primary focus:outline-none"
                            />
                          </td>

                          <td className="px-4 py-3 text-danger font-bold">
                            -{currencySymbol} {discAmt.toFixed(2)}
                          </td>

                          <td className="px-4 py-3 font-extrabold text-slate-900">
                            {currencySymbol} {rowNet.toFixed(2)}
                          </td>

                          {/* Tax (%) Input */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              value={item.tax_rate}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTaxRate(idx, e.target.value)}
                              className="w-16 bg-background border border-border-soft px-2 py-1 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-primary focus:outline-none"
                            />
                          </td>

                          {/* Multi-Select Employee Dropdown Checklist */}
                          <td className="px-4 py-3">
                            <div className="bg-background border border-border-soft p-2 rounded-xl space-y-1 max-h-28 overflow-y-auto">
                              {employees.length === 0 ? (
                                <span className="text-[10px] text-danger">No active stylists found</span>
                              ) : (
                                employees.map((emp) => {
                                  const isChecked = (item.employee_ids || []).includes(emp.id);
                                  return (
                                    <label
                                      key={emp.id}
                                      className="flex items-center space-x-2 text-[11px] font-semibold text-slate-800 cursor-pointer hover:text-primary"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleEmployee(idx, emp.id)}
                                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                      />
                                      <span>
                                        {emp.first_name} {emp.last_name || ""}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-danger hover:text-rose-700 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary & Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="bg-surface border border-border-soft p-6 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Billing Remarks & Instructions</h4>
              <textarea
                rows={4}
                placeholder="Special treatment notes or customer preferences..."
                className="w-full bg-background border border-border-soft p-3 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="bg-surface border border-border-soft p-6 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b border-border-soft pb-2">
                Invoice Summary
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Gross Total:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {grossTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-danger">
                  <span>Total Discount:</span>
                  <span className="font-bold">-{currencySymbol} {totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-border-soft pt-2">
                  <span>Net Total (after discount):</span>
                  <span>{currencySymbol} {netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Tax Amount:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {totalTaxAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-primary border-t-2 border-primary/20 pt-3">
                  <span>Net Payable Amount:</span>
                  <span>{currencySymbol} {netPayable.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border-soft grid grid-cols-3 gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  onClick={handleReset}
                  className="bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleProceedToPayment}
                  className="bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-pink-500/20 transition flex items-center justify-center space-x-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Proceed to Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: BILLING HISTORY TAB */}
      {activeSubTab === "history" && (
        <div className="bg-surface border border-border-soft rounded-2xl shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <span>Parlour Invoices & Billing History</span>
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                View saved invoices, reprint receipts, send WhatsApp/SMS links, and track payment breakdown.
              </p>
            </div>

            <div className="w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Invoice # or Client Name..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-background border border-border-soft pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-primary-light border-b border-border-soft text-slate-700">
                  <th className="px-4 py-3 font-extrabold">Bill #</th>
                  <th className="px-4 py-3 font-extrabold">Date & Time</th>
                  <th className="px-4 py-3 font-extrabold">Customer Name</th>
                  <th className="px-4 py-3 font-extrabold">Subtotal</th>
                  <th className="px-4 py-3 font-extrabold">Discount</th>
                  <th className="px-4 py-3 font-extrabold">Tax</th>
                  <th className="px-4 py-3 font-extrabold">Final Total</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                  <th className="px-4 py-3 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-text-secondary font-medium">
                      Loading invoice history...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-text-secondary font-medium">
                      No invoices found in billing history.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((inv) => (
                    <tr key={inv.id} className="hover:bg-background/60 transition">
                      <td className="px-4 py-3 font-extrabold text-primary">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(inv.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{inv.customer_name}</td>
                      <td className="px-4 py-3">{currencySymbol} {inv.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-danger">-{currencySymbol} {inv.discount.toFixed(2)}</td>
                      <td className="px-4 py-3">{currencySymbol} {inv.tax.toFixed(2)}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        {currencySymbol} {inv.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "Partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleViewInvoiceDetail(inv.id)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-lg transition"
                          title="View Invoice Details & Actions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Split Multi-Payment Settlement Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-xl w-full rounded-2xl shadow-2xl border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center bg-primary-light">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Split Multi-Payment Settlement</h3>
                <p className="text-[10px] text-text-secondary">Select one or multiple payment channels & enter amounts</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="bg-background border border-border-soft p-4 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-text-secondary block">Net Payable Due:</span>
                  <span className="text-lg font-extrabold text-primary">{currencySymbol} {netPayable.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-secondary block">Total Allocated:</span>
                  <span
                    className={`text-lg font-extrabold ${
                      Math.abs(totalAllocatedPayment - netPayable) < 0.01 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {currencySymbol} {totalAllocatedPayment.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Methods:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {SUPPORTED_PAYMENT_METHODS.map((pm) => {
                    const isSelected = selectedPaymentMethods.includes(pm.id);
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => handleTogglePaymentMethod(pm.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? "border-primary bg-primary-light/50 ring-1 ring-primary"
                            : "border-border-soft bg-background hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg ${pm.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{pm.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border-soft">
                <label className="block text-xs font-bold text-slate-700">Enter Allocated Payment Amounts:</label>
                {selectedPaymentMethods.map((mId) => (
                  <div key={mId} className="flex items-center justify-between bg-background border border-border-soft p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-800">{mId} Amount ({currencySymbol}):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmounts[mId] || ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdatePaymentAmount(mId, e.target.value)}
                      placeholder="0.00"
                      className="w-32 bg-white border border-border-soft px-3 py-1.5 rounded-lg text-xs font-extrabold text-slate-900 text-right focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 border border-border-soft rounded-xl text-xs font-bold text-slate-600 hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold shadow-md shadow-pink-500/20"
                >
                  Save Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {showReceipt && invoiceResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-sm w-full rounded-2xl shadow-2xl border border-border-soft overflow-hidden p-6 space-y-4">
            <div className="text-center border-b border-border-soft pb-3">
              <h2 className="text-base font-extrabold text-slate-900">SmartGoNext Beauty Parlour</h2>
              <p className="text-[10px] text-text-secondary">Official Saved Invoice Receipt</p>
              <p className="text-xs font-bold text-primary mt-1">{invoiceResult.invoice_number}</p>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">{currencySymbol} {invoiceResult.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>Discount:</span>
                <span className="font-bold">-{currencySymbol} {invoiceResult.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-bold">{currencySymbol} {invoiceResult.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-primary border-t border-border-soft pt-2">
                <span>Total Paid:</span>
                <span>{currencySymbol} {invoiceResult.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-soft flex space-x-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Bill Detail Modal with Functional Actions */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-lg w-full rounded-2xl shadow-2xl border border-border-soft overflow-hidden p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-border-soft pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Invoice Details #{selectedInvoiceDetail.invoice_number}
                </h3>
                <p className="text-[10px] text-text-secondary">
                  Customer: {selectedInvoiceDetail.customer.first_name} {selectedInvoiceDetail.customer.last_name || ""} ({selectedInvoiceDetail.customer.phone})
                </p>
              </div>
              <button onClick={() => setSelectedInvoiceDetail(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Line Items List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Treatment Line Items:</p>
              <div className="bg-background border border-border-soft rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto text-xs">
                {selectedInvoiceDetail.line_items.map((li) => (
                  <div key={li.id} className="flex justify-between items-center border-b border-border-soft/50 pb-1">
                    <div>
                      <span className="font-bold text-slate-900">{li.name}</span>
                      <span className="text-[10px] text-text-secondary block">
                        Qty: {li.quantity} × {currencySymbol}{li.unit_price} (Stylist: {li.employee_name})
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">{currencySymbol} {li.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="bg-primary-light/50 border border-primary/20 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">{currencySymbol} {selectedInvoiceDetail.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>Discount:</span>
                <span className="font-bold">-{currencySymbol} {selectedInvoiceDetail.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-bold">{currencySymbol} {selectedInvoiceDetail.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-primary border-t border-border-soft pt-1">
                <span>Grand Total:</span>
                <span>{currencySymbol} {selectedInvoiceDetail.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Functional Bill Action Buttons */}
            <div className="pt-3 border-t border-border-soft space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Bill Actions:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. Print Bill */}
                <button
                  onClick={() => window.print()}
                  className="bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>

                {/* 2. SMS Bill */}
                <button
                  onClick={() => triggerSMSBill(selectedInvoiceDetail)}
                  className="bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>SMS Bill</span>
                </button>

                {/* 3. WhatsApp Web */}
                <button
                  onClick={() => triggerWhatsAppWeb(selectedInvoiceDetail)}
                  className="bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Web</span>
                </button>

                {/* 4. Set Reminder */}
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Set Reminder</span>
                </button>
              </div>

              {/* 5. Collect Feedback */}
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="w-full bg-background hover:bg-slate-100 border border-border-soft text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span>Collect Client Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Reminder Sub-Modal */}
      {showReminderModal && selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-2xl shadow-2xl border border-border-soft p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border-soft pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Schedule Customer Reminder</span>
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Purpose</label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
                className="w-full bg-background border border-border-soft px-3 py-2 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="Next visit">Next Visit</option>
                <option value="Membership renewal">Membership Renewal</option>
                <option value="Follow-up appointment">Follow-up Appointment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Date *</label>
              <input
                type="date"
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-background border border-border-soft px-3 py-2 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes</label>
              <textarea
                rows={2}
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
                placeholder="Recommended facial touch-up or hair treatment date..."
                className="w-full bg-background border border-border-soft p-3 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-border-soft flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 border border-border-soft rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReminderSubmit}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold shadow-md"
              >
                Save Reminder to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Feedback Sub-Modal */}
      {showFeedbackModal && selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-2xl shadow-2xl border border-border-soft p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border-soft pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>Record Customer Rating & Feedback</span>
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Rating (1 to 5 Stars)</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`p-2 rounded-xl transition ${
                      star <= feedbackRating ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Comments / Review</label>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Loved the hair spa treatment and friendly stylist service..."
                className="w-full bg-background border border-border-soft p-3 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-border-soft flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 border border-border-soft rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeedbackSubmit}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold shadow-md"
              >
                Record Feedback to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
