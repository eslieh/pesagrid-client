"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "../pesagrid/components/dashboard/UI";
import { getBusinessProfile, createBusinessProfile, updateBusinessProfile } from "../../lib/Account";
import { getTemplates, createTemplatesBulk, getTemplateLibrary } from "../../lib/Notifications";
import { getCurrentUser, requestMfaCode } from "../../lib/Auth";
import PricingTab from "../dashboard/billing/components/PricingTab";
import { MfaVerificationModal } from "../pesagrid/components/dashboard/MfaVerificationModal";

const steps = [
  { id: 1, title: "Business Identity", desc: "Your branding and contact info" },
  { id: 2, title: "Choose Use Case", desc: "Determine your focus" },
  { id: 3, title: "Select a Plan", desc: "Pick a fitting volume tier" },
  { id: 4, title: "Connect Channel", desc: "Securely link your bank/M-PESA" },
  { id: 5, title: "Launch Setup", desc: "Create your first collection setup" },
];

const PSP_LOGOS = {
  mpesa: "/psp/mpesa.png",
  kcb: "/psp/kcb.png",
};

const CP_TYPES = [
  { id: "fleet", icon: "🚌", label: "Fleet", desc: "Vehicles" },
  { id: "campaign", icon: "🏛️", label: "Campaign", desc: "Fundraising" },
  { id: "donation", icon: "⛪", label: "Donations", desc: "Gifts" },
  { id: "fee_collection", icon: "🎓", label: "Fees", desc: "Schools" },
  { id: "event", icon: "🏟️", label: "Event", desc: "Tickets" },
  { id: "custom", icon: "⚡", label: "Custom", desc: "Flexible" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    business_name: "",
    display_name: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    email_from: "",
  });
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [useCase, setUseCase] = useState(null); // 'collection' or 'invoicing'

  // Channel setup state
  const [channelData, setChannelData] = useState({
    psp_type: "mpesa",
    display_name: "",
    paybill: "",
  });
  const [registeredPspId, setRegisteredPspId] = useState(null);

  // Step 5 specific data
  const [cpData, setCpData] = useState({
    cp_type: "custom",
    name: "",
    account_no: "",
    description: "",
    goal_amount: "",
    goal_period: "daily",
    compliance_threshold: "",
    is_active: true,
    sms_acknowledgement: true,
  });
  const [invoiceData, setInvoiceData] = useState({
    payer_name: "",
    phone: "",
    email: "",
    account_no: "",
    amount: "",
    description: "",
    due_date: "",
    is_recurring: false,
    recurrence_type: "monthly",
    day_of_month: 28,
    day_of_week: 0,
    interval_days: 1,
    grace_period_days: 0,
    start_date: new Date().toISOString().split('T')[0],
  });
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);

  // MFA states
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mfaError, setMfaError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [profData, tplData, user] = await Promise.all([
          getBusinessProfile().catch(() => null),
          getTemplates().catch(() => ({ items: [] })),
          getCurrentUser(),
        ]);

        if (profData) setProfile(profData);
        else {
          setProfile(p => ({
            ...p,
            display_name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
          }));
        }
        setExistingTemplates(tplData.items || []);
      } catch (err) {
        console.error("Onboarding init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const user = await getCurrentUser();
      const payload = {
        ...profile,
        id: profile.id || crypto.randomUUID(),
        collection_id: user.id || user.uid,
        created_at: profile.created_at || new Date().toISOString(),
      };
      if (profile.id) await updateBusinessProfile(payload);
      else await createBusinessProfile(payload);
      setStep(2);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const setupTemplates = async (type) => {
    setUseCase(type);
    setIsSaving(true);
    try {
      const { items: library } = await getTemplateLibrary();
      let toImport = [];

      if (type === 'collection') {
        toImport = library.filter(t => t.template_type === 'payment_receipt' || t.name.toLowerCase().includes('collection'));
      } else {
        toImport = library.filter(t => ['payment_reminder', 'overdue_notice', 'payment_receipt_full'].includes(t.template_type));
      }

      if (toImport.length > 0) {
        await createTemplatesBulk(toImport.map(({category, description, ...rest}) => ({ ...rest, is_default: false })));
      }
      setStep(3);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setMfaError("");
      await requestMfaCode();
      setIsMfaModalOpen(true);
    } catch (err) {
      alert(err.message || "Failed to initiate verification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMfaVerify = async (code) => {
    setIsVerifying(true);
    setMfaError("");
    try {
      const { registerPaymentChannel } = await import("../../lib/PaymentChannel");
      
      const payload = {
        ...channelData,
        is_active: true,
        credentials: {}, // No credentials requested during onboarding
        meta: {}
      };

      const res = await registerPaymentChannel(payload, code);
      setRegisteredPspId(res.id);
      setIsMfaModalOpen(false);
      setStep(5);
    } catch (err) {
      setMfaError(err.message || "Failed to register channel. Please verify your code and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLaunchSetup = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (useCase === 'collection') {
        const { createCollectionPoint, linkCollectionPointChannel } = await import("../../lib/CollectionPoint");
        const cp = await createCollectionPoint({
          ...cpData,
          goal_amount: cpData.goal_amount ? parseFloat(cpData.goal_amount) : null,
          compliance_threshold: cpData.compliance_threshold ? parseFloat(cpData.compliance_threshold) : null,
          meta: {}
        });
        if (registeredPspId) {
          await linkCollectionPointChannel(cp.id, {
            psp_config_id: registeredPspId,
            label: "Primary Linked"
          });
        }
      } else if (useCase === 'invoicing') {
        const { unifiedCreate } = await import("../../lib/Obligation");
        const payload = {
          name: invoiceData.payer_name,
          phone: invoiceData.phone || undefined,
          email: invoiceData.email || undefined,
          account_no: invoiceData.account_no || undefined,
          amount: parseFloat(invoiceData.amount),
          description: invoiceData.description,
          is_recurring: invoiceData.is_recurring,
          meta: {}
        };

        if (!invoiceData.is_recurring && invoiceData.due_date) {
          payload.due_date = new Date(invoiceData.due_date).toISOString();
        }

        if (invoiceData.is_recurring) {
          payload.recurring = {
            recurrence_type: invoiceData.recurrence_type,
            start_date: new Date(invoiceData.start_date).toISOString(),
            day_of_month: parseInt(invoiceData.day_of_month) || 1,
            day_of_week: parseInt(invoiceData.day_of_week) || 0,
            interval_days: parseInt(invoiceData.interval_days) || 1,
            grace_period_days: parseInt(invoiceData.grace_period_days) || 0
          };
        }

        await unifiedCreate(payload);
      }
      setShowFinalSuccess(true);
    } catch (err) {
      console.error("Setup failed:", err);
      setShowFinalSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-200 border-t-[#9de500cc] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <MfaVerificationModal
        isOpen={isMfaModalOpen}
        isLoading={isVerifying}
        error={mfaError}
        onClose={() => setIsMfaModalOpen(false)}
        onVerify={handleMfaVerify}
      />

      {/* Header / Progress bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black text-xs">P</div>
             <span className="font-bold tracking-tight text-zinc-900">PesaGrid Onboarding</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                  step >= s.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                }`}>
                  {step > s.id ? "✓" : s.id}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-[1px] mx-1 transition-colors ${step > s.id ? "bg-zinc-900" : "bg-zinc-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            Step {step} of 5
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 pb-24">
        <AnimatePresence mode="wait">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="max-w-xl">
                <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">First, let's identify <br/> your business.</h1>
                <p className="mt-2 text-zinc-400 text-[14px]">This info will be used on receipts and notification headers.</p>
              </div>

              <Card className="p-8 md:p-10 !rounded-[3rem]">
                <form onSubmit={handleIdentitySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Legal Business Name</label>
                      <input 
                        required
                        value={profile.business_name}
                        onChange={e => setProfile({...profile, business_name: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="e.g. Finex Logistics LTD"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Primary Email (Required)</label>
                       <input 
                        required
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile({...profile, email: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="hello@yourbusiness.com"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Business Phone (Required)</label>
                       <input 
                        required
                        type="tel"
                        value={profile.phone}
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="2547XXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Display Name (Receipts)</label>
                       <input 
                        required
                        value={profile.display_name}
                        onChange={e => setProfile({...profile, display_name: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="e.g. Finex Support"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Physical/Business Address</label>
                       <input 
                        required
                        value={profile.address}
                        onChange={e => setProfile({...profile, address: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="Suite 1, Pesa Plaza, Nairobi"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="h-14 px-10 rounded-2xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save & Continue"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: USE CASE */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="max-w-xl">
                <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">How will you use <br/> PesaGrid first?</h1>
                <p className="mt-2 text-zinc-400 text-[14px]">We'll setup your notification templates based on your choice.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setupTemplates('collection')}
                  disabled={isSaving}
                  className="group p-8 md:p-10 rounded-[3rem] bg-white border border-zinc-100 text-left transition-all hover:border-[#9de500cc] hover:shadow-[0_20px_40px_-20px_rgba(157,229,0,0.2)]"
                >
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-2xl group-hover:bg-[#9de50011] transition-colors">📍</div>
                  <h3 className="mt-6 text-[20px] font-bold text-zinc-900">Collection Points</h3>
                  <p className="mt-2 text-zinc-400 text-[14px] leading-relaxed">Best for retail, rent, or simple payments where users pay directly to a point.</p>
                  <div className="mt-8 flex items-center gap-2 text-zinc-900 font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Choose this setup ➜
                  </div>
                </button>

                <button 
                  onClick={() => setupTemplates('invoicing')}
                  disabled={isSaving}
                  className="group p-8 md:p-10 rounded-[3rem] bg-white border border-zinc-100 text-left transition-all hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(59,130,246,0.1)]"
                >
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">📄</div>
                  <h3 className="mt-6 text-[20px] font-bold text-zinc-900">Invoices & Arrears</h3>
                  <p className="mt-2 text-zinc-400 text-[14px] leading-relaxed">Best for recurring billing, service fees, or tracking debt with reminders.</p>
                  <div className="mt-8 flex items-center gap-2 text-zinc-900 font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Choose this setup ➜
                  </div>
                </button>
              </div>

              <div className="flex justify-center">
                 <button onClick={() => setStep(3)} className="text-zinc-400 text-[12px] font-bold hover:text-zinc-900 transition-colors">
                   Skip template setup for now
                 </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PLAN */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="max-w-xl">
                <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">Select your platform <br/> plan.</h1>
                <p className="mt-2 text-zinc-400 text-[14px]">You can always upgrade or downgrade later.</p>
              </div>

              <div className="relative">
                <PricingTab onRequireTopup={() => setStep(4)} showOnly="starter" />
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-zinc-400 text-[13px] font-bold hover:text-zinc-900 transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(4)} className="h-14 px-10 rounded-2xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all active:scale-95">
                  Continue to Connectivity
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CONNECTIVITY */}
          {step === 4 && !showFinalSuccess && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="max-w-xl">
                <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">Connect your first <br/> payment channel.</h1>
                <p className="mt-2 text-zinc-400 text-[14px]">Tell us where your customers will pay. No API keys needed now.</p>
              </div>

              <Card className="p-8 md:p-10 !rounded-[3rem]">
                <form onSubmit={handleChannelSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Select Provider</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'mpesa', name: 'M-PESA' },
                        { id: 'kcb', name: 'KCB' },
                        { id: 'equity', name: 'Equity' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setChannelData({ ...channelData, psp_type: type.id })}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] border transition-all ${
                            channelData.psp_type === type.id
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-xl scale-[1.02]"
                              : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-white"
                          }`}
                        >
                          <div className={`h-12 w-12 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 ${channelData.psp_type === type.id ? "bg-white" : "bg-white/50"}`}>
                            {PSP_LOGOS[type.id] ? (
                              <img src={PSP_LOGOS[type.id]} alt={type.name} className="h-full w-full object-contain" />
                            ) : (
                              <div className="text-[10px] font-bold text-zinc-400 uppercase">{type.name.substring(0,2)}</div>
                            )}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-widest leading-none">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Channel Display Name</label>
                       <input 
                        required
                        value={channelData.display_name}
                        onChange={e => setChannelData({...channelData, display_name: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="e.g. Main Paybill"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Paybill / Till Number</label>
                       <input 
                        required
                        value={channelData.paybill}
                        onChange={e => setChannelData({...channelData, paybill: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                        placeholder="174379"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button type="button" onClick={() => setStep(3)} className="text-zinc-400 text-[13px] font-bold hover:text-zinc-900 transition-colors">
                      ← Back
                    </button>
                    <div className="flex gap-4 items-center">
                       <button type="button" onClick={() => setShowFinalSuccess(true)} className="text-zinc-400 text-[13px] font-bold hover:text-zinc-900 transition-colors mr-2">
                         Setup later
                       </button>
                       <button
                        type="submit"
                        disabled={isSaving}
                        className="h-14 px-10 rounded-2xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? "Connecting..." : "Connect & Continue"}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* STEP 5: INITIAL SETUP (DYNAMIC) */}
          {step === 5 && !showFinalSuccess && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-12"
            >
              <div className="max-w-xl">
                <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">
                  {useCase === 'collection' ? 'Setup your first \n collection point.' : 'Create your first \n invoice.'}
                </h1>
                <p className="mt-2 text-zinc-400 text-[14px]">
                  {useCase === 'collection' 
                    ? "Link your Paybill to a specific point of sale (e.g. a bus or branch)." 
                    : "Generate your first bill to track receivables immediately."}
                </p>
              </div>

              <Card className="p-8 md:p-10 !rounded-[3rem]">
                <form onSubmit={handleLaunchSetup} className="space-y-10">
                  {useCase === 'collection' ? (
                    <div className="space-y-10">
                      {/* CP TYPE SELECTOR */}
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 pl-1">Point Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {CP_TYPES.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setCpData({ ...cpData, cp_type: type.id })}
                              className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-[1.5rem] border transition-all ${
                                cpData.cp_type === type.id
                                  ? "border-[#a3e635] bg-[#a3e63511] text-zinc-900 shadow-sm"
                                  : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-white"
                              }`}
                            >
                              <div className="text-xl">{type.icon}</div>
                              <div className="text-center">
                                <div className="text-[11px] font-bold leading-tight">{type.label}</div>
                                <div className="text-[9px] opacity-60">{type.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* IDENTITY */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">
                             {cpData.cp_type === 'fleet' ? 'Point Name (e.g. Plate No)' :
                              cpData.cp_type === 'campaign' ? 'Point Name (e.g. Cause Name)' :
                              cpData.cp_type === 'donation' ? 'Point Name (e.g. Fund name)' :
                              cpData.cp_type === 'fee_collection' ? 'Point Name (e.g. Grade/Class)' :
                              cpData.cp_type === 'event' ? 'Point Name (e.g. Event Name)' : 'Point Name'}
                           </label>
                           <input 
                            required
                            value={cpData.name}
                            onChange={e => setCpData({...cpData, name: e.target.value})}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                            placeholder={
                              cpData.cp_type === 'fleet' ? 'e.g. KAB 123C' :
                              cpData.cp_type === 'campaign' ? 'e.g. Save the Lions' :
                              cpData.cp_type === 'donation' ? 'e.g. Building Fund' :
                              cpData.cp_type === 'fee_collection' ? 'e.g. Grade 4 North' :
                              cpData.cp_type === 'event' ? 'e.g. Summer Jam 2024' : 'e.g. Point 1'
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">
                             {cpData.cp_type === 'fleet' ? 'Driver / Route ID' :
                              cpData.cp_type === 'fee_collection' ? 'Student / Adm Number' :
                              cpData.cp_type === 'donation' ? 'Donor / Gift Reference' : 'Account reference'}
                           </label>
                           <input 
                            required
                            value={cpData.account_no}
                            onChange={e => setCpData({...cpData, account_no: e.target.value})}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                            placeholder={
                              cpData.cp_type === 'fleet' ? 'e.g. D-101' :
                              cpData.cp_type === 'fee_collection' ? 'e.g. ADM-902' :
                              cpData.cp_type === 'campaign' ? 'e.g. C-44' : 'e.g. 101'
                            }
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Receipt Description</label>
                           <input 
                            value={cpData.description}
                            onChange={e => setCpData({...cpData, description: e.target.value})}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                            placeholder="Thank you for your payment"
                          />
                        </div>
                      </div>

                      {/* GOALS */}
                      <div className="pt-4 border-t border-zinc-100">
                        <h4 className="text-[12px] font-bold text-zinc-900 mb-4">Trackable Goals (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Target Amount (KES)</label>
                             <input 
                              type="number"
                              value={cpData.goal_amount}
                              onChange={e => setCpData({...cpData, goal_amount: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Goal Period</label>
                             <select
                              value={cpData.goal_period}
                              onChange={e => setCpData({...cpData, goal_period: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 appearance-none focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                             >
                               <option value="daily">Daily</option>
                               <option value="weekly">Weekly</option>
                               <option value="monthly">Monthly</option>
                             </select>
                          </div>
                        </div>
                        <div className="mt-8 p-4 rounded-2xl bg-[#a3e63511] border border-[#a3e63522] flex items-center gap-3">
                           <span className="text-xl">⚡</span>
                           <p className="text-[12px] text-zinc-500 leading-relaxed">
                             Your Paybill (<strong>{channelData.display_name}</strong>) will be automatically linked to this point.
                           </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                       {/* PAYER INFO */}
                       <div className="space-y-4">
                        <h4 className="text-[12px] font-bold text-zinc-900 border-b border-zinc-100 pb-3">Recipient Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Payer Name</label>
                             <input 
                              required
                              value={invoiceData.payer_name}
                              onChange={e => setInvoiceData({...invoiceData, payer_name: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Phone (Optional)</label>
                             <input 
                              type="tel"
                              value={invoiceData.phone}
                              onChange={e => setInvoiceData({...invoiceData, phone: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                              placeholder="2547..."
                            />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Email (Optional)</label>
                             <input 
                              type="email"
                              value={invoiceData.email}
                              onChange={e => setInvoiceData({...invoiceData, email: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                              placeholder="john@example.com"
                            />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Account Ref (e.g. Unit 4)</label>
                             <input 
                              value={invoiceData.account_no}
                              onChange={e => setInvoiceData({...invoiceData, account_no: e.target.value})}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                              placeholder="REF-001"
                            />
                          </div>
                        </div>
                       </div>

                       {/* INVOICE DETAILS */}
                       <div className="space-y-4">
                        <h4 className="text-[12px] font-bold text-zinc-900 border-b border-zinc-100 pb-3">Invoice Basics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Amount Due (KES)</label>
                              <input 
                                required
                                type="number"
                                value={invoiceData.amount}
                                onChange={e => setInvoiceData({...invoiceData, amount: e.target.value})}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Primary Due Date</label>
                              <input 
                                required={!invoiceData.is_recurring}
                                type="date"
                                disabled={invoiceData.is_recurring}
                                value={invoiceData.due_date}
                                onChange={e => setInvoiceData({...invoiceData, due_date: e.target.value})}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                               <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Description</label>
                               <input 
                                required
                                value={invoiceData.description}
                                onChange={e => setInvoiceData({...invoiceData, description: e.target.value})}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                placeholder="Service Fee - March"
                              />
                            </div>
                        </div>
                       </div>

                       {/* RECURRING SECTION */}
                       <div className="pt-4 border-t border-zinc-100">
                         <div className="flex items-center justify-between mb-6">
                            <div className="space-y-0.5">
                               <h4 className="text-[12px] font-bold text-zinc-900">Recurring Billing</h4>
                               <p className="text-[10px] text-zinc-400">Automatically repeat this invoice.</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setInvoiceData({...invoiceData, is_recurring: !invoiceData.is_recurring})}
                              className={`h-6 w-10 rounded-full transition-all relative ${invoiceData.is_recurring ? 'bg-[#a3e635]' : 'bg-zinc-200'}`}
                            >
                               <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${invoiceData.is_recurring ? 'left-4.5 shadow-sm' : 'left-0.5'}`} />
                            </button>
                         </div>

                         {invoiceData.is_recurring && (
                           <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="space-y-6 overflow-hidden"
                           >
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Billing Cycle</label>
                                  <select
                                    value={invoiceData.recurrence_type}
                                    onChange={e => setInvoiceData({...invoiceData, recurrence_type: e.target.value})}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 appearance-none focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                  >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="custom">Custom (Days)</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">
                                    {invoiceData.recurrence_type === 'monthly' ? 'Day of month' : invoiceData.recurrence_type === 'weekly' ? 'Day of week' : 'Interval (Days)'}
                                  </label>
                                  <input 
                                    type="number"
                                    value={invoiceData.recurrence_type === 'monthly' ? invoiceData.day_of_month : invoiceData.recurrence_type === 'weekly' ? invoiceData.day_of_week : invoiceData.interval_days}
                                    onChange={e => {
                                      const val = parseInt(e.target.value);
                                      if (invoiceData.recurrence_type === 'monthly') setInvoiceData({...invoiceData, day_of_month: val});
                                      else if (invoiceData.recurrence_type === 'weekly') setInvoiceData({...invoiceData, day_of_week: val});
                                      else setInvoiceData({...invoiceData, interval_days: val});
                                    }}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">First Gen Date</label>
                                  <input 
                                    required
                                    type="date"
                                    value={invoiceData.start_date}
                                    onChange={e => setInvoiceData({...invoiceData, start_date: e.target.value})}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 pl-1">Grace Period (Days)</label>
                                  <input 
                                    type="number"
                                    value={invoiceData.grace_period_days}
                                    onChange={e => setInvoiceData({...invoiceData, grace_period_days: parseInt(e.target.value)})}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                                  />
                                </div>
                             </div>
                             <div className="p-3 rounded-xl bg-[#a3e63511] border border-[#a3e63522] flex items-center gap-2">
                               <span className="text-lg">📅</span>
                               <p className="text-[11px] text-zinc-500 leading-relaxed">
                                 Invoice will generate <strong>{invoiceData.recurrence_type}</strong> starting <strong>{invoiceData.start_date}</strong>.
                               </p>
                            </div>
                           </motion.div>
                         )}
                       </div>
                    </div>
                  )}

                  <div className="pt-8 flex items-center justify-between border-t border-zinc-100">
                    <button type="button" onClick={() => setStep(4)} className="text-zinc-400 text-[13px] font-bold hover:text-zinc-900 transition-colors">
                      ← Back
                    </button>
                    <div className="flex gap-4 items-center">
                       <button type="button" onClick={() => setShowFinalSuccess(true)} className="text-zinc-400 text-[13px] font-bold hover:text-zinc-900 transition-colors mr-2">
                         Skip for now
                       </button>
                       <button
                        type="submit"
                        disabled={isSaving}
                        className="h-14 px-10 rounded-2xl bg-[#a3e635] text-zinc-900 font-bold text-base hover:bg-[#9de500] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Setup & Finish"}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* FINAL SUCCESS */}
          {showFinalSuccess && (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-8"
            >
              <div className="mx-auto h-24 w-24 rounded-full bg-[#9de50022] flex items-center justify-center text-[#6f9f00]">
                 <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                 </svg>
              </div>

              <div className="max-w-2xl mx-auto">
                <h1 className="text-[36px] font-bold tracking-tight text-zinc-900">You're all set!</h1>
                <p className="mt-4 text-zinc-500 text-[16px] leading-relaxed">
                  Your business profile is active and your notifications are pre-configured. 
                  You can now manage your collection points and send invoices from your dashboard.
                </p>
              </div>

              <div className="max-w-md mx-auto pt-8">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="h-16 w-full rounded-2xl bg-[#9de500cc] text-zinc-900 font-bold text-[18px] shadow-[0_12px_24px_-8px_rgba(157,229,0,0.5)] hover:bg-[#8fd100] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center">
         <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-widest">© 2026 PesaGrid Technologies</p>
      </footer>
    </div>
  );
}
