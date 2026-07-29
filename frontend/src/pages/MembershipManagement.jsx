import React, { useState } from "react";
import MembershipPlans from "./MembershipPlans";
import CustomerMemberships from "./CustomerMemberships";
import { Award, CreditCard } from "lucide-react";

function MembershipManagement() {
  const [activeTab, setActiveTab] = useState("plans"); // "plans" or "customer_memberships"

  return (
    <div className="space-y-6">
      {/* Top Segmented Tab Switcher */}
      <div className="flex space-x-2 bg-surface border border-border-soft p-3 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
            activeTab === "plans"
              ? "bg-primary text-white shadow-md shadow-pink-500/20"
              : "bg-background text-slate-700 border border-border-soft hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Membership Tiers & Plans</span>
        </button>

        <button
          onClick={() => setActiveTab("customer_memberships")}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
            activeTab === "customer_memberships"
              ? "bg-primary text-white shadow-md shadow-pink-500/20"
              : "bg-background text-slate-700 border border-border-soft hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Customer Subscriptions & Packages</span>
        </button>
      </div>

      {/* Render Component View */}
      <div>
        {activeTab === "plans" ? <MembershipPlans /> : <CustomerMemberships />}
      </div>
    </div>
  );
}

export default MembershipManagement;
