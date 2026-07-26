import React, { useState, useEffect } from "react";
import API from "../services/api";

function Billing() {
  // Master lists
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMemberships, setCustomerMemberships] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState("");

  // Payment popup & Splits
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState({
    cash: "",
    card: "",
    upi: "",
  });

  // Invoice / Receipt States
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Tax standard (GST @ 18% default, loaded from backend or state)
  const taxRate = 18.00;

  useEffect(() => {
    // Load services, products, employees
    API.get("/services?limit=100").then((res) => setServices(res.data.items));
    API.get("/products?limit=100").then((res) => setProducts(res.data.items));
    API.get("/employees?limit=100").then((res) => {
      setEmployees(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedEmployee(res.data.items[0].id);
      }
    });
  }, []);

  // Search customers by phone or name
  useEffect(() => {
    if (customerSearch.trim().length >= 2) {
      API.get(`/customers?q=${customerSearch}`)
        .then((res) => setCustomers(res.data.items))
        .catch((err) => console.error(err));
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  // Load active memberships when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      API.get(`/customers/${selectedCustomer.id}/memberships`)
        .then((res) => setCustomerMemberships(res.data))
        .catch((err) => console.error(err));
    } else {
      setCustomerMemberships([]);
    }
  }, [selectedCustomer]);

  const addToCart = (item, type) => {
    const defaultEmployee = selectedEmployee || (employees.length > 0 ? employees[0].id : "");
    if (!defaultEmployee) {
      alert("Please select a stylist/employee before adding items to the cart.");
      return;
    }

    const existingIndex = cart.findIndex((x) => x.item_id === item.id && x.type === type);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          type,
          item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: type === "service" ? parseFloat(item.price) : parseFloat(item.selling_price),
          employee_id: parseInt(defaultEmployee),
          discount: 0,
          customer_membership_id: null, // membership benefit link
          benefit_name: null,
        },
      ]);
    }
  };

  const updateCartQty = (index, val) => {
    const updated = [...cart];
    updated[index].quantity = Math.max(1, parseInt(val) || 1);
    setCart(updated);
  };

  const updateCartDiscount = (index, val) => {
    const updated = [...cart];
    updated[index].discount = Math.max(0, parseFloat(val) || 0);
    setCart(updated);
  };

  const updateCartEmployee = (index, val) => {
    const updated = [...cart];
    updated[index].employee_id = parseInt(val);
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const redeemBenefit = (benefit, cartIdx) => {
    const updated = [...cart];
    updated[cartIdx].customer_membership_id = benefit.id;
    updated[cartIdx].benefit_name = benefit.service_name;
    updated[cartIdx].discount = updated[cartIdx].unit_price * updated[cartIdx].quantity;
    setCart(updated);
  };

  // Cart Totals Calculator
  const getSubtotal = () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const getDiscounts = () => cart.reduce((sum, item) => sum + item.discount, 0);
  const getNetSubtotal = () => Math.max(0, getSubtotal() - getDiscounts());
  const getTax = () => getNetSubtotal() * (taxRate / 100);
  const getGrandTotal = () => getNetSubtotal() + getTax();

  const handleCheckoutSubmit = () => {
    const payload = {
      customer_id: selectedCustomer?.id,
      line_items: cart.map((x) => ({
        type: x.type,
        item_id: x.item_id,
        quantity: x.quantity,
        employee_id: x.employee_id,
        discount: x.discount,
        customer_membership_id: x.customer_membership_id,
      })),
      payments: Object.entries(payments)
        .map(([method, val]) => ({
          method,
          amount: parseFloat(val) || 0.00,
        }))
        .filter((x) => x.amount > 0),
      notes,
    };

    API.post("/billing/checkout", payload)
      .then((res) => {
        setInvoiceResult(res.data);
        setShowPaymentModal(false);
        setShowReceipt(true);
        // Clear Cart
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearch("");
        setNotes("");
        setPayments({ cash: "", card: "", upi: "" });
      })
      .catch((err) => {
        alert(err.message || "Checkout failed.");
      });
  };

  const openPaymentDetails = () => {
    if (!selectedCustomer) {
      alert("Please select a customer before checking out.");
      return;
    }
    if (cart.length === 0) {
      alert("The shopping cart is empty.");
      return;
    }
    // Pre-populate cash payment with total
    setPayments({
      cash: getGrandTotal().toFixed(2),
      card: "",
      upi: "",
    });
    setShowPaymentModal(true);
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-[calc(100vh-140px)] overflow-hidden">
      {/* Left Column: Catalogs */}
      <div className="col-span-7 flex flex-col h-full bg-surface border border-border-soft rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-soft flex justify-between items-center">
          <h3 className="text-sm font-semibold text-text-primary">Salon Treatments & Products</h3>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-background border border-border-soft px-3 py-1.5 rounded-lg text-xs text-text-secondary focus:outline-none"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                Stylist: {emp.first_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Services list */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase mb-4">Services</h4>
            <div className="grid grid-cols-3 gap-4">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => addToCart(svc, "service")}
                  className="bg-background hover:bg-primary-light border border-border-soft hover:border-primary p-4 rounded-lg text-left transition flex flex-col justify-between"
                >
                  <p className="text-sm font-medium text-text-primary">{svc.name}</p>
                  <p className="text-xs text-text-secondary mt-2">INR {svc.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Products list */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase mb-4">Retail Products</h4>
            <div className="grid grid-cols-3 gap-4">
              {products.map((prod) => (
                <button
                  key={prod.id}
                  disabled={prod.stock_quantity <= 0}
                  onClick={() => addToCart(prod, "product")}
                  className="bg-background hover:bg-primary-light border border-border-soft hover:border-primary p-4 rounded-lg text-left transition disabled:opacity-50 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{prod.name}</p>
                    <p className="text-[10px] text-text-secondary">Stock: {prod.stock_quantity}</p>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">INR {prod.selling_price}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout Cart */}
      <div className="col-span-5 flex flex-col h-full bg-surface border border-border-soft rounded-lg overflow-hidden">
        {/* Customer search bar */}
        <div className="p-4 border-b border-border-soft space-y-2 relative">
          <label className="block text-xs font-semibold text-text-secondary">Customer Lookup</label>
          {selectedCustomer ? (
            <div className="flex justify-between items-center bg-primary-light border border-primary/20 px-4 py-2 rounded-lg">
              <span className="text-sm font-semibold text-primary">
                👤 {selectedCustomer.first_name} ({selectedCustomer.phone})
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-danger font-semibold hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search phone number or name..."
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
                        setSelectedCustomer(c);
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

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h4 className="text-xs font-semibold text-text-secondary uppercase">Shopping Cart</h4>
          {cart.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">Cart is empty. Select treatments or products.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.type}-${item.item_id}`} className="bg-background border border-border-soft p-3 rounded-lg flex flex-col space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{item.name}</span>
                    <span className="text-[10px] text-primary bg-primary-light px-2 py-0.5 rounded ml-2 uppercase font-medium">
                      {item.type}
                    </span>
                    {item.benefit_name && (
                      <p className="text-[10px] text-success font-medium mt-1">⭐️ Benefit Redeemed: Free Service</p>
                    )}
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="text-xs text-danger font-semibold hover:underline">
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border-soft/40 items-center">
                  {/* Qty */}
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateCartQty(idx, e.target.value)}
                      className="w-full bg-surface border border-border-soft px-2 py-1 rounded text-xs"
                    />
                  </div>
                  {/* Stylist */}
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Stylist</label>
                    <select
                      value={item.employee_id}
                      onChange={(e) => updateCartEmployee(idx, e.target.value)}
                      className="w-full bg-surface border border-border-soft px-2 py-1 rounded text-xs"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.first_name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Discount */}
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!!item.customer_membership_id}
                      value={item.discount}
                      onChange={(e) => updateCartDiscount(idx, e.target.value)}
                      className="w-full bg-surface border border-border-soft px-2 py-1 rounded text-xs disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Membership benefit redemption list */}
                {item.type === "service" && !item.customer_membership_id && customerMemberships.length > 0 && (
                  <div className="pt-2 border-t border-border-soft/40">
                    <p className="text-[10px] font-semibold text-text-secondary mb-1">Available Membership Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {customerMemberships.flatMap((m) =>
                        m.benefits
                          .filter((b) => b.service_id === item.item_id && b.remaining_quantity > 0)
                          .map((b) => (
                            <button
                              key={b.id}
                              onClick={() => redeemBenefit(b, idx)}
                              className="bg-success/15 hover:bg-success/25 text-success text-[9px] px-2 py-0.5 rounded font-medium transition"
                            >
                              Apply Benefit (Remain: {b.remaining_quantity})
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Financial Tally Footer */}
        <div className="p-4 border-t border-border-soft bg-background/50 space-y-2">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Subtotal</span>
            <span>INR {getSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Discounts</span>
            <span className="text-danger">- INR {getDiscounts().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Tax (GST 18%)</span>
            <span>INR {getTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-text-primary pt-2 border-t border-border-soft">
            <span>Grand Total</span>
            <span>INR {getGrandTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={openPaymentDetails}
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm mt-4 transition"
          >
            Proceed to Payment
          </button>
        </div>
      </div>

      {/* Payment Splits Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-lg shadow-lg border border-border-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">Process Checkout Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-text-secondary hover:text-text-primary">✖</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-background border border-border-soft p-4 rounded-lg flex justify-between items-center">
                <span className="text-xs text-text-secondary font-semibold">Total Amount Due</span>
                <span className="text-lg font-bold text-text-primary">INR {getGrandTotal().toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-text-secondary">Split Allocations</label>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">Cash amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payments.cash}
                    onChange={(e) => setPayments({ ...payments, cash: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">Card amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payments.card}
                    onChange={(e) => setPayments({ ...payments, card: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">UPI amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payments.upi}
                    onChange={(e) => setPayments({ ...payments, upi: e.target.value })}
                    className="w-full bg-background border border-border-soft px-3 py-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-soft flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
                >
                  Complete Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {showReceipt && invoiceResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-surface max-w-lg w-full rounded-lg shadow-lg border border-border-soft overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-border-soft flex justify-between items-center">
              <h3 className="text-md font-semibold text-text-primary">Invoice Generated</h3>
              <button onClick={() => setShowReceipt(false)} className="text-text-secondary hover:text-text-primary">✖</button>
            </div>
            
            {/* Printable Receipt Block */}
            <div id="print-area" className="p-8 space-y-6 font-mono text-sm bg-white text-black">
              <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-4">
                <h2 className="text-lg font-bold">SMARTGONEXT BEAUTY SALON</h2>
                <p className="text-xs">GSTIN: 29AAAAA1111A1Z1</p>
                <p className="text-xs">Invoice #: {invoiceResult.invoice_number}</p>
                <p className="text-[10px]">Status: {invoiceResult.status}</p>
              </div>

              <div className="space-y-1 text-xs">
                <p><strong>Customer Name:</strong> {selectedCustomer?.first_name || "Walk-In Client"}</p>
                <p><strong>Phone:</strong> {selectedCustomer?.phone || "-"}</p>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={`${item.type}-${item.item_id}`} className="border-b border-dotted border-gray-200">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">INR {(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-xs border-t border-dashed border-gray-400 pt-4 flex flex-col items-end">
                <p>Subtotal: INR {invoiceResult.subtotal.toFixed(2)}</p>
                <p>Discount: - INR {invoiceResult.discount.toFixed(2)}</p>
                <p>Tax (GST 18%): INR {invoiceResult.tax.toFixed(2)}</p>
                <p className="font-bold text-sm">Grand Total: INR {invoiceResult.total.toFixed(2)}</p>
              </div>

              <div className="text-center border-t border-dashed border-gray-400 pt-4 text-[10px]">
                <p>Thank you for visiting us. Have a wonderful day!</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border-soft bg-background flex justify-end space-x-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 border border-border-soft rounded-lg text-sm text-text-secondary hover:bg-background"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
