import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Unlink,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Building2,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import API from "../services/api";
import { useLanguageCurrency } from "../context/LanguageCurrencyContext";

export default function WhatsAppIntegration() {
  const { t } = useLanguageCurrency();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [settings, setSettings] = useState({
    status: "DISCONNECTED",
    business_name: "",
    phone_number: "",
    meta_phone_number_id: "",
    meta_waba_id: "",
    connected_at: null,
    meta_app_id: "",
  });
  const [notice, setNotice] = useState({ type: "", message: "" });

  const fetchSettings = () => {
    setLoading(true);
    API.get("/whatsapp/settings")
      .then((res) => {
        setSettings(res.data || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch WhatsApp settings:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);



  const handleConnectWithMeta = () => {
    setNotice({ type: "", message: "" });
    setConnecting(true);

    const width = 600;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const appId = settings.meta_app_id || "YOUR_META_APP_ID";
    const redirectUri = encodeURIComponent(window.location.origin + "/");

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code&state=whatsapp_signup`;

    const popup = window.open(
      oauthUrl,
      "MetaEmbeddedSignup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      setNotice({
        type: "error",
        message: "Popup blocker prevented opening the Meta login screen. Please allow popups for this site.",
      });
      setConnecting(false);
      return;
    }

    const checkPopup = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setConnecting(false);
          return;
        }

        // Only check location once popup redirects back to our origin
        if (popup.location.origin === window.location.origin) {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get("code");
          
          clearInterval(checkPopup);
          popup.close();

          if (code) {
            API.post("/whatsapp/oauth/connect", { code })
              .then((res) => {
                setNotice({
                  type: "success",
                  message: "WhatsApp Business Account connected successfully via Meta OAuth!",
                });
                setSettings(res.data.settings || {});
                setConnecting(false);
              })
              .catch((err) => {
                setNotice({
                  type: "error",
                  message: err.response?.data?.message || "Failed to exchange Meta authorization token.",
                });
                setConnecting(false);
              });
          } else {
            setNotice({
              type: "error",
              message: "Meta authorization failed or code not returned.",
            });
            setConnecting(false);
          }
        }
      } catch (e) {
        // Ignore DOMException / Cross-Origin errors while popup is on facebook.com
      }
    }, 500);
  };

  const handleDisconnect = () => {
    if (!window.confirm("Are you sure you want to disconnect your WhatsApp Business Account?")) {
      return;
    }
    setLoading(true);
    API.post("/whatsapp/disconnect")
      .then(() => {
        setNotice({
          type: "success",
          message: "WhatsApp Business Account disconnected successfully.",
        });
        fetchSettings();
      })
      .catch((err) => {
        setNotice({
          type: "error",
          message: err.response?.data?.message || "Failed to disconnect account.",
        });
        setLoading(false);
      });
  };

  const isConnected = settings.status === "CONNECTED";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Meta Cloud API</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            WhatsApp Business Integration
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-xl font-medium leading-relaxed">
            Connect your parlour's official Meta WhatsApp Business Account to dispatch bulk marketing campaigns, automated birthday offers, and client appointment reminders with 100% tenant privacy.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto">
          <div className="text-xs text-emerald-100 font-bold uppercase tracking-wider mb-1">
            Connection Status
          </div>
          {isConnected ? (
            <div className="inline-flex items-center space-x-2 bg-emerald-500/30 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-emerald-300/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>CONNECTED</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 bg-rose-500/30 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-rose-300/40">
              <XCircle className="w-4 h-4 text-rose-300" />
              <span>DISCONNECTED</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {notice.message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-extrabold flex items-center justify-between shadow-xs ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice({ type: "", message: "" })} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Connection Card */}
      <div className="bg-surface border border-border-soft rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <span>Parlour Account Credentials</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-extrabold text-slate-500">Checking Meta API connection status...</p>
          </div>
        ) : isConnected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Business Name
                </p>
                <p className="text-sm font-black text-slate-900 truncate">
                  {settings.business_name || "Salon Business"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Connected Phone Number
                </p>
                <p className="text-sm font-black text-slate-900 truncate">
                  {settings.phone_number || "Not Configured"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number ID
                </p>
                <p className="text-xs font-mono font-bold text-slate-700 truncate">
                  {settings.meta_phone_number_id || "PHONE_ID_112233"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  WABA ID (WhatsApp Account)
                </p>
                <p className="text-xs font-mono font-bold text-slate-700 truncate">
                  {settings.meta_waba_id || "WABA_9988776655"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-soft flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Credentials encrypted & isolated strictly for your parlour tenant.</span>
              </div>

              <button
                onClick={handleDisconnect}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <Unlink className="w-4 h-4" />
                <span>Disconnect Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-6 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Connect with Meta (Embedded Signup)
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Click below to log in with your Meta/Facebook account. Your Phone Number ID, WhatsApp Business Account ID, and Access Token will be automatically discovered and saved.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs text-emerald-900 space-y-2 font-medium">
              <div className="font-extrabold flex items-center space-x-1.5 text-emerald-800">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>What happens when you connect:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-emerald-800/90">
                <li>Log in securely using your Facebook / Meta Business credentials.</li>
                <li>Select your registered WhatsApp Business phone number.</li>
                <li>Permissions are granted automatically with zero manual ID copy-pasting.</li>
              </ul>
            </div>

            <button
              onClick={handleConnectWithMeta}
              disabled={connecting}
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-8 py-3.5 rounded-2xl text-xs font-extrabold shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-3 w-full sm:w-auto mx-auto disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Exchanging Meta OAuth Credentials...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Connect with Meta</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
