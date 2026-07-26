import React, { useState } from "react";
import {
  Sparkles,
  Scissors,
  CreditCard,
  Award,
  Package,
  BarChart3,
  Download,
  Check,
} from "lucide-react";

function LandingPage({ onNavigateLogin, onNavigateRegister }) {
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or yearly

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* SaaS Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 px-6 lg:px-12 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
              SmartGoNext
            </span>
            <span className="text-[10px] text-pink-600 font-bold block -mt-1 uppercase tracking-widest">
              Beauty Parlour
            </span>
          </div>
        </div>

        <nav className="hidden md:flex space-x-8 text-xs font-bold text-slate-600">
          <a href="#features" className="hover:text-pink-600 transition">Features</a>
          <a href="#pricing" className="hover:text-pink-600 transition">Pricing</a>
          <a href="#about" className="hover:text-pink-600 transition">About</a>
          <a href="#contact" className="hover:text-pink-600 transition">Contact</a>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateLogin}
            className="text-xs font-bold border-2 border-pink-500 text-pink-600 hover:bg-pink-50 px-5 py-2 rounded-xl transition duration-200"
          >
            Login
          </button>
          <button
            onClick={onNavigateRegister}
            className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-pink-500/25 transition transform hover:-translate-y-0.5 duration-200"
          >
            Start Free Trial
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-24 max-w-6xl mx-auto text-center space-y-8 bg-gradient-to-b from-pink-50/80 via-white to-pink-50/30 w-full rounded-3xl mt-4 border border-pink-100/60 shadow-sm overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-pink-300/30 to-rose-200/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative inline-flex items-center space-x-2 bg-pink-100/80 border border-pink-200 px-4 py-1.5 rounded-full text-xs font-bold text-pink-700 shadow-sm">
          <Sparkles className="w-4 h-4 text-pink-600" />
          <span>Premium Beauty Parlour & Salon Management Platform</span>
        </div>

        <h1 className="relative text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
          Elevate Your Salon Business with{" "}
          <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
            SmartGoNext Beauty Parlour
          </span>
        </h1>

        <p className="text-base md:text-lg font-bold text-pink-600 tracking-wide uppercase">
          Complete Salon Management SaaS Platform
        </p>

        <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed font-medium">
          Transform your beauty salon operations with our intuitive all-in-one software.
          Effortlessly handle client appointments, POS checkout billing, stylist commissions, inventory reordering, membership packages, and real-time revenue analytics.
        </p>

        <div className="relative flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={onNavigateRegister}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-9 py-4 rounded-xl text-sm font-bold shadow-xl shadow-pink-500/30 transition transform hover:-translate-y-0.5 duration-200"
          >
            Start 14-Day Free Trial
          </button>
          <button
            onClick={onNavigateLogin}
            className="w-full sm:w-auto bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-50 px-9 py-4 rounded-xl text-sm font-bold shadow-sm transition duration-200"
          >
            Login to Admin Portal
          </button>
        </div>

        {/* Feature Badges */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-xs font-semibold text-slate-600">
          <div className="bg-white/80 border border-pink-100 py-3 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2">
            <Scissors className="w-4 h-4 text-pink-600" />
            <span>Stylist Commissions</span>
          </div>
          <div className="bg-white/80 border border-pink-100 py-3 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2">
            <CreditCard className="w-4 h-4 text-pink-600" />
            <span>POS & Thermal Receipts</span>
          </div>
          <div className="bg-white/80 border border-pink-100 py-3 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2">
            <Award className="w-4 h-4 text-pink-600" />
            <span>Client Memberships</span>
          </div>
          <div className="bg-white/80 border border-pink-100 py-3 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4 text-pink-600" />
            <span>Live Sales Analytics</span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="px-6 lg:px-12 py-20 bg-gradient-to-b from-white to-pink-50/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-pink-600">Designed For Salon Excellence</h2>
            <p className="text-3xl font-extrabold text-slate-900">Powerful Tools Built to Grow Your Salon Revenue</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <CreditCard className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">POS Checkout & Split Payments</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Seamless checkout supporting Cash, Card, and UPI split allocations. Applies discounts, membership perks, and generates thermal receipts.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <Award className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">VIP Membership Packages</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Automated customer membership tracking, free service benefit redemptions, renewal reminders, and tier upgrades.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <Scissors className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Stylist Commission Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Assign stylists to treatment line items during checkout and automatically compute accurate commission payouts.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <Package className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Retail Inventory Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Real-time stock tracking with automated reorder warnings when retail shampoo, creams, or products drop below threshold.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Business Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Interactive charts and real-time metrics for Today's Sales, MRR/ARR, top treatments, and payment distribution.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50/50 border border-pink-100 p-8 rounded-2xl space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-pink-300 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl shadow-sm">
                <Download className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Tax Reports & CSV Exports</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Filterable financial ledgers and instant one-click CSV data exports for accounting and GST/VAT tax filings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Plans Section */}
      <section id="pricing" className="px-6 lg:px-12 py-20 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-pink-600">Simple & Transparent Pricing</h2>
          <p className="text-3xl font-extrabold text-slate-900">Choose the Plan That Fits Your Salon</p>
          
          <div className="flex justify-center items-center space-x-3 pt-4">
            <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-pink-600" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 bg-pink-100 border border-pink-200 rounded-full p-1 transition flex items-center"
            >
              <div className={`w-4 h-4 bg-pink-600 rounded-full transition transform ${billingCycle === "yearly" ? "translate-x-6" : ""}`}></div>
            </button>
            <span className={`text-xs font-bold ${billingCycle === "yearly" ? "text-pink-600" : "text-slate-500"}`}>
              Yearly <span className="bg-amber-100 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ml-1 border border-amber-300">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white border border-pink-100 p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:shadow-xl transition duration-300">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Basic Plan</h3>
              <p className="text-xs text-slate-500 font-medium">Perfect for boutique salons & individual artists.</p>
              <div className="text-4xl font-black text-slate-900">
                INR {billingCycle === "monthly" ? "999" : "799"} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-3 pt-4 border-t border-pink-100 font-medium">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Up to 3 Stylist Accounts</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>20 Service Treatments</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>POS Checkout Billing</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Standard Analytics</span></li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-600 py-3 rounded-xl text-xs font-bold transition duration-200"
            >
              Get Started Basic
            </button>
          </div>

          {/* Pro Plan (Featured) */}
          <div className="bg-gradient-to-b from-pink-50/70 via-white to-pink-50/30 border-2 border-pink-500 p-8 rounded-3xl space-y-6 flex flex-col justify-between relative shadow-2xl shadow-pink-500/15">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-rose-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Most Popular</span>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-slate-900">Pro Plan</h3>
              <p className="text-xs text-slate-500 font-medium">Ideal for growing salons & multi-stylists.</p>
              <div className="text-4xl font-black text-pink-600">
                INR {billingCycle === "monthly" ? "1,999" : "1,599"} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-3 pt-4 border-t border-pink-200/60 font-semibold">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-600 font-bold" /><span>Up to 10 Stylist Accounts</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-600 font-bold" /><span>Unlimited Treatments & Products</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-600 font-bold" /><span>Full Membership Management</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-600 font-bold" /><span>Commission Payout Reports</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-600 font-bold" /><span>CSV Data Exports</span></li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white py-3.5 rounded-xl text-xs font-extrabold shadow-lg shadow-pink-500/25 transition duration-200"
            >
              Start Pro Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white border border-pink-100 p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:shadow-xl transition duration-300">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Enterprise Plan</h3>
              <p className="text-xs text-slate-500 font-medium">For salon chains & high-volume franchises.</p>
              <div className="text-4xl font-black text-slate-900">
                INR {billingCycle === "monthly" ? "3,999" : "3,199"} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-3 pt-4 border-t border-pink-100 font-medium">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Unlimited Everything</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Priority Customer Support</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Custom Tax & Receipt Templates</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-pink-500 font-bold" /><span>Executive Super Admin Controls</span></li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-600 py-3 rounded-xl text-xs font-bold transition duration-200"
            >
              Contact Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="mt-auto bg-slate-900 text-slate-300 px-6 lg:px-12 py-10 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">SmartGoNext Beauty Parlour</span>
              <span className="text-[10px] text-pink-400 font-semibold block">Salon Management SaaS Platform</span>
            </div>
          </div>
          <p className="text-slate-400">© 2026 SmartGoNext. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
