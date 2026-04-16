"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../../pesagrid/components/dashboard/UI";
import { 
  unifiedCreate, 
  createObligation,
  getRecurringPreview 
} from "../../../../lib/Obligation";

// ─────────────────────────────────────────────────────────────
// Shared Sub-components & Helpers
// ─────────────────────────────────────────────────────────────

function Field({ label, children, required, hint }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[10px] text-zinc-400 italic">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 shadow-sm hover:shadow-inner hover:bg-zinc-100/30";

// ─────────────────────────────────────────────────────────────
// InvoiceWizard Component
// ─────────────────────────────────────────────────────────────

export default function InvoiceWizard({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData = {} 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    payer_id: initialData.payer_id || null,
    name: initialData.name || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    account_no: initialData.account_no || "",
    amount: "",
    description: "",
    due_date: "",
    is_recurring: false,
    recurrence_type: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    day_of_month: Math.min(28, new Date().getDate()),
    day_of_week: 0,
    interval_days: 1,
    grace_period_days: 5,
  });

  const [recurringPreview, setRecurringPreview] = useState("");
  const [customFields, setCustomFields] = useState([]);

  // Sync initialData if it changes (e.g. after loading in parent)
  useEffect(() => {
    if (initialData.payer_id || initialData.name || initialData.phone || initialData.account_no) {
      setFormData(prev => ({
        ...prev,
        payer_id: initialData.payer_id || prev.payer_id,
        name: initialData.name || prev.name,
        phone: initialData.phone || prev.phone,
        email: initialData.email || prev.email,
        account_no: initialData.account_no || prev.account_no,
      }));
    }
  }, [initialData]);

  // Reactive Recurring Preview
  useEffect(() => {
    if (!formData.is_recurring) {
      setRecurringPreview("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getRecurringPreview({
          type: formData.recurrence_type.toUpperCase(),
          amount: formData.amount,
          start: formData.start_date ? new Date(formData.start_date).toISOString() : null,
          interval: formData.interval_days,
          dom: formData.day_of_month,
          dow: formData.day_of_week
        });
        if (res && res.preview_sentence) {
          setRecurringPreview(res.preview_sentence);
        }
      } catch (err) {
        setRecurringPreview("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.is_recurring, 
    formData.recurrence_type, 
    formData.amount, 
    formData.start_date, 
    formData.interval_days, 
    formData.day_of_month, 
    formData.day_of_week
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAddCustomField = () => setCustomFields(prev => [...prev, { key: "", value: "" }]);
  const handleRemoveCustomField = (index) => setCustomFields(prev => prev.filter((_, i) => i !== index));
  const handleCustomFieldChange = (index, field, value) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const nextStep = () => {
    setMessage({type:"", text:""});
    if (currentStep === 1) {
      if (!formData.name) {
        setMessage({ type: "error", text: "Payer name is required." });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.description || !formData.amount) {
        setMessage({ type: "error", text: "Please fill in all required fields." });
        return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setMessage({type:"", text:""});
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (formData.payer_id) {
        // Option A: Specific Payer raising (Standard Creation)
        const payload = {
          payer_id: formData.payer_id,
          account_no: formData.account_no || undefined,
          description: formData.description,
          amount_due: parseFloat(formData.amount),
          is_recurring: formData.is_recurring,
          meta: {}
        };

        if (!formData.is_recurring && formData.due_date) {
          payload.due_date = new Date(formData.due_date).toISOString();
        }

        customFields.forEach(f => {
          if (f.key.trim() && f.value.trim()) {
            payload.meta[f.key.trim()] = f.value.trim();
          }
        });

        if (formData.is_recurring) {
          payload.recurring = {
            recurrence_type: formData.recurrence_type,
            start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
            day_of_month: parseInt(formData.day_of_month) || 1,
            day_of_week: parseInt(formData.day_of_week) || 0,
            interval_days: parseInt(formData.interval_days) || 1,
            grace_period_days: parseInt(formData.grace_period_days) || 0,
            auto_generate: true
          };
        }

        await createObligation(payload);
      } else {
        // Option B: Unified Flow (Matching or New Payer)
        const payload = {
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          account_no: formData.account_no || undefined,
          amount: parseFloat(formData.amount),
          description: formData.description,
          is_recurring: formData.is_recurring,
          meta: {}
        };

        if (!formData.is_recurring && formData.due_date) {
          payload.due_date = new Date(formData.due_date).toISOString();
        }

        customFields.forEach(f => {
          if (f.key.trim() && f.value.trim()) {
            payload.meta[f.key.trim()] = f.value.trim();
          }
        });

        if (formData.is_recurring) {
          payload.recurring = {
            recurrence_type: formData.recurrence_type,
            start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
            day_of_month: parseInt(formData.day_of_month) || 1,
            day_of_week: parseInt(formData.day_of_week) || 0,
            interval_days: parseInt(formData.interval_days) || 1,
            grace_period_days: parseInt(formData.grace_period_days) || 0
          };
        }

        await unifiedCreate(payload);
      }
      
      if (onSuccess) onSuccess();
      onClose();
      
      // Reset state for next time
      setCurrentStep(1);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create invoice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -4 }}
      className="mb-12"
    >
      <Card className="py-8 px-8 relative border-zinc-200 shadow-xl ring-8 ring-zinc-100/30">
        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-xl border flex items-center justify-between text-[12px] font-bold ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({type:"", text:""})}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        )}

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mb-8 flex items-center justify-between border-b border-zinc-100 pb-6">
          <h2 className="text-[18px] font-black text-zinc-900 flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
              {currentStep}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Step {currentStep}</span>
                <span className="leading-tight">
                    {currentStep === 1 ? 'Payer Identity' : currentStep === 2 ? 'Invoice Details' : 'Review & Dispatch'}
                </span>
            </div>
          </h2>

          <div className="flex gap-2">
            {[1,2,3].map(step => (
                <div 
                    key={step}
                    className={`h-2 w-12 rounded-full transition-all duration-500 ${currentStep >= step ? 'bg-[#a3e635] shadow-sm shadow-[#a3e635]/50 overflow-hidden' : 'bg-zinc-100'}`} 
                >
                    {currentStep === step && (
                         <motion.div 
                            layoutId="activeBar"
                            className="bg-white/40 h-full w-full"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         />
                    )}
                </div>
            ))}
          </div>
        </div>

        {/* Step 1: Payer Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Full Name / Company" required>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${inputCls} ${formData.payer_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="e.g. John Doe, Unit 4A Ltd"
                  required
                  readOnly={!!formData.payer_id}
                />
              </Field>

              <Field label="Account/Reference No." hint={formData.payer_id ? "Linked to existing profile" : "Optional: Auto-generated if left blank"}>
                <input
                  name="account_no"
                  type="text"
                  value={formData.account_no}
                  onChange={handleChange}
                  className={`${inputCls} ${formData.payer_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="e.g. UNIT-3B, STU-5542"
                  readOnly={!!formData.payer_id}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${inputCls} ${formData.payer_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="2547XXXXXXXX"
                  readOnly={!!formData.payer_id}
                />
              </Field>

              <Field label="Email Address">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputCls} ${formData.payer_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="john@example.com"
                  readOnly={!!formData.payer_id}
                />
              </Field>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3">
                <svg className="h-5 w-5 text-[#a3e635] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                   Unified Invoicing Engine: If this payer already exists in your ledger (matched via phone or account), we will link the invoice automatically. Otherwise, a new payer profile is created instantly.
                </p>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Description / Reason" required>
                <input
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. March Rent, School Fees Term 1"
                  required
                />
              </Field>

              <Field label="Amount Due (KES)" required>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-[11px]">KES</span>
                    <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        className={`${inputCls} pl-12 font-black`}
                        placeholder="0.00"
                        required
                    />
                </div>
              </Field>

              {!formData.is_recurring && (
                <Field label="Due Date">
                  <input
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>
              )}
            </div>

            {/* Recurring Section */}
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6">
              <div className="flex items-center gap-4">
                <label className="relative flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="is_recurring"
                    className="peer sr-only"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                  />
                  <div className="h-6 w-11 rounded-full bg-zinc-200 shadow-inner after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:bg-[#a3e635] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#a3e635]/20"></div>
                </label>
                <div>
                  <span className="text-[14px] font-black text-zinc-900 block">Recurring Cycle</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Auto-generate invoices on a defined schedule</span>
                </div>
              </div>

              <AnimatePresence>
                {formData.is_recurring && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 overflow-hidden border-t border-zinc-200 pt-6"
                  >
                    <Field label="Frequency" required>
                      <select
                        name="recurrence_type"
                        value={formData.recurrence_type}
                        onChange={handleChange}
                        className={inputCls}
                        required
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Days</option>
                      </select>
                    </Field>
                    
                    <Field label="Cycle Starts" required>
                      <input
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className={inputCls}
                        required
                      />
                    </Field>

                    {formData.recurrence_type === "monthly" && (
                      <Field label="Day of Month" required>
                        <input
                          name="day_of_month"
                          type="number"
                          min="1"
                          max="28"
                          value={formData.day_of_month}
                          onChange={handleChange}
                          className={inputCls}
                          required
                        />
                      </Field>
                    )}

                    {formData.recurrence_type === "weekly" && (
                      <Field label="Day of Week" required>
                        <select
                          name="day_of_week"
                          value={formData.day_of_week}
                          onChange={handleChange}
                          className={inputCls}
                          required
                        >
                          <option value="0">Monday</option>
                          <option value="1">Tuesday</option>
                          <option value="2">Wednesday</option>
                          <option value="3">Thursday</option>
                          <option value="4">Friday</option>
                          <option value="5">Saturday</option>
                          <option value="6">Sunday</option>
                        </select>
                      </Field>
                    )}

                    {formData.recurrence_type === "custom" && (
                      <Field label="Every (Days)" required>
                        <input
                          name="interval_days"
                          type="number"
                          min="1"
                          value={formData.interval_days}
                          onChange={handleChange}
                          className={inputCls}
                          required
                        />
                      </Field>
                    )}

                    <Field label="Grace Period" hint="Days to pay before 'Overdue'" required>
                      <input
                        name="grace_period_days"
                        type="number"
                        min="0"
                        value={formData.grace_period_days}
                        onChange={handleChange}
                        className={inputCls}
                        required
                      />
                    </Field>

                    <div className="md:col-span-3">
                      <AnimatePresence>
                        {recurringPreview && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl bg-[#a3e635]/10 border border-[#a3e635]/20 p-4 flex items-start gap-3"
                          >
                            <svg className="h-5 w-5 text-[#6bb800] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            <p className="text-[12px] font-bold text-zinc-700 leading-relaxed italic">
                              {recurringPreview}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Meta Attributes */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[14px] font-black text-zinc-900 leading-none">Custom Ledger Data</h4>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">Append unit numbers, house blocks, or category codes.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="text-[11px] font-black text-white bg-zinc-900 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition-all shadow-md shadow-zinc-900/10 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Attribute
                </button>
              </div>
              
              {customFields.length > 0 ? (
                <div className="space-y-3">
                  {customFields.map((field, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i} 
                        className="flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => handleCustomFieldChange(i, "key", e.target.value)}
                        placeholder="Label (e.g. Unit Number)"
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(i, "value", e.target.value)}
                        placeholder="Value (e.g. B-102)"
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(i)}
                        className="p-3 text-zinc-400 hover:text-red-500 bg-zinc-50 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                 <div className="rounded-2xl border-2 border-dashed border-zinc-100 py-6 text-center">
                   <p className="text-[11px] text-zinc-300 font-black uppercase tracking-widest">No custom data appended</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-zinc-50 border border-zinc-100 p-8 flex flex-col items-center justify-center text-center shadow-inner">
              <div className="h-16 w-16 rounded-[2rem] bg-[#a3e635]/20 flex items-center justify-center text-[#6bb800] mb-5 shadow-lg shadow-[#a3e635]/10 border border-[#a3e635]/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-[20px] font-black text-zinc-900 mb-2">Invoice Logic Validated</h3>
              <p className="text-[14px] text-zinc-500 max-w-sm font-medium">
                You are about to issue a payment request for <strong className="text-zinc-900">KES {parseFloat(formData.amount || 0).toLocaleString()}</strong> to <strong className="text-zinc-900">{formData.name}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6 px-4">
              <div className="space-y-1">
                <span className="block text-zinc-400 font-black uppercase tracking-widest text-[10px]">Reference / Reason</span>
                <span className="font-black text-zinc-900 text-[14px]">{formData.description}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-zinc-400 font-black uppercase tracking-widest text-[10px]">Net Value</span>
                <span className="font-black text-zinc-900 text-[14px]">KES {parseFloat(formData.amount || 0).toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-zinc-400 font-black uppercase tracking-widest text-[10px]">Billing Type</span>
                <span className="font-bold text-zinc-900 text-[13px] flex items-center gap-1.5">
                  {formData.is_recurring ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-[#a3e635] shadow-sm shadow-[#a3e635]/50 animate-pulse" />
                      Recurring ({formData.recurrence_type})
                    </>
                  ) : (
                    <>
                         <div className="h-2 w-2 rounded-full bg-blue-400" />
                         One-Time Entry
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                  {formData.is_recurring ? 'First Generation Date' : 'Settlement Deadline'}
                </span>
                <span className="font-black text-zinc-900 text-[13px]">
                  {formData.is_recurring ? formData.start_date : (formData.due_date || 'Not Mandatory')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Nav */}
        <div className="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-[12px] font-black text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all flex items-center gap-2 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[12px] font-black text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            {currentStep < 3 ? (
               <button
                 type="button"
                 onClick={nextStep}
                 className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-8 py-3 text-[12px] font-black text-white shadow-xl shadow-zinc-900/10 transition-all hover:bg-black hover:shadow-zinc-900/20 active:scale-95 hover:-translate-y-0.5"
               >
                 Advance Step
                 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                 </svg>
               </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl bg-[#a3e635] px-10 py-3 text-[14px] tracking-tight font-black text-zinc-900 shadow-xl shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-[#a3e635]/40 active:scale-95 disabled:opacity-50 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-[3px] border-zinc-900/20 border-t-zinc-900 animate-spin" />
                    Dispatching…
                  </>
                ) : (
                  "Generate & Dispatch"
                )}
              </button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
