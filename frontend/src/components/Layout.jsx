import React from "react";
import {
  LayoutDashboard,
  Receipt,
  Users,
  UserCheck,
  Scissors,
  Package,
  Award,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  Globe,
  LogOut,
  Sparkles,
} from "lucide-react";

const getMenuIcon = (id) => {
  switch (id) {
    case "dashboard":
      return <LayoutDashboard className="w-4 h-4" />;
    case "billing":
      return <Receipt className="w-4 h-4" />;
    case "customers":
      return <Users className="w-4 h-4" />;
    case "employees":
      return <UserCheck className="w-4 h-4" />;
    case "services":
      return <Scissors className="w-4 h-4" />;
    case "products":
      return <Package className="w-4 h-4" />;
    case "membership_plans":
      return <Award className="w-4 h-4" />;
    case "customer_memberships":
      return <CreditCard className="w-4 h-4" />;
    case "reports":
      return <BarChart3 className="w-4 h-4" />;
    case "settings":
      return <SettingsIcon className="w-4 h-4" />;
    case "super_admin":
      return <ShieldCheck className="w-4 h-4" />;
    default:
      return null;
  }
};

function Layout({ children, activeTab, setActiveTab, onLogout, onNavigateHome }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "billing", label: "Billing" },
    { id: "customers", label: "Customers" },
    { id: "employees", label: "Employees" },
    { id: "services", label: "Services" },
    { id: "products", label: "Products" },
    { id: "membership_plans", label: "Membership Plans" },
    { id: "customer_memberships", label: "Customer Memberships" },
    { id: "reports", label: "Reports" },
    { id: "settings", label: "Settings" },
    { id: "super_admin", label: "Super Admin" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border-soft flex flex-col">
        <div className="h-16 px-6 border-b border-border-soft flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="h-9 w-9 bg-gradient-to-tr from-pink-600 to-rose-400 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent text-sm block">SmartGoNext</span>
              <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider block -mt-1">Beauty Parlour</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-pink-500/20"
                    : "text-text-secondary hover:bg-primary-light hover:text-primary"
                }`}
              >
                <span>{getMenuIcon(item.id)}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-soft flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-light text-primary font-bold rounded-full flex items-center justify-center text-xs">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">Admin Account</p>
              <p className="text-[10px] text-text-secondary">Logged in</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-1 text-xs text-danger font-semibold hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border-soft px-8 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            {menuItems.find((x) => x.id === activeTab)?.label || activeTab}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 text-xs text-text-secondary hover:text-primary font-semibold transition"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>View Public Landing Page</span>
            </button>
            <span className="text-xs bg-primary-light text-primary font-bold px-3 py-1 rounded-full border border-primary/20">
              Pro SaaS Plan
            </span>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
