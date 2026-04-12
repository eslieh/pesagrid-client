"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, StatWidget } from "../../pesagrid/components/dashboard/UI";
import { 
  unifiedCreate, 
  getPayerGroups,
  getRecurringPreview,
  getGlobalLedger,
  getUpcomingLedger
} from "../../../lib/Obligation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5";

export default function InvoicesPage() {
  // New Ledger State
  const [ledgerBoard, setLedgerBoard] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState(null);
  
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Unified Create state
  const [formData, setFormData] = useState({
    // Payer details
    name: "",
    phone: "",
    email: "",
    account_no: "",
    
    // Invoice details
    amount: "",
    description: "",
    due_date: "",

    // Recurring Setup
    is_recurring: false,
    recurrence_type: "monthly",
    start_date: "",
    day_of_month: 1,
    day_of_week: 0,
    interval_days: 1,
    grace_period_days: 5,
  });

  const [recurringPreview, setRecurringPreview] = useState("");
  const [customFields, setCustomFields] = useState([]); // [{key: "", value: ""}]

  const loadData = async () => {
    try {
      setIsLoading(true);
      const groupRes = await getPayerGroups({ limit: 100 });
      if (groupRes) setGroups(Array.isArray(groupRes) ? groupRes : (groupRes.items || []));
      
      await fetchGlobalLedger();
      await fetchUpcoming();
    } catch (err) {
      console.error("Failed to load page data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalLedger = async () => {
    try {
      setIsLoading(true);
      const res = await getGlobalLedger({
        status_filter: statusFilter !== "all" ? statusFilter : undefined,
        group_id: groupFilter !== "all" ? groupFilter : undefined,
        page: currentPage,
        page_size: pageSize
      });
      setLedgerBoard(res);
    } catch (err) {
      console.error("Failed to load global ledger", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await getUpcomingLedger({ 
        days: 30,
        group_id: groupFilter !== "all" ? groupFilter : undefined 
      });
      setUpcomingPayments(res);
    } catch (err) {
      console.error("Failed to load upcoming payments", err);
    }
  };

  useEffect(() => {
    fetchGlobalLedger();
  }, [statusFilter, groupFilter, currentPage]);

  useEffect(() => {
    fetchUpcoming();
  }, [groupFilter]);

  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
    
    // Default Dates
    const today = new Date();
    setFormData(prev => ({
      ...prev,
      start_date: today.toISOString().split('T')[0],
      day_of_month: Math.min(28, today.getDate()),
    }));
  }, []);

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

  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { key: "", value: "" }]);
  };
  const handleCustomFieldChange = (index, field, value) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };
  const handleRemoveCustomField = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const openForm = () => {
    setIsFormOpen(true);
    setCurrentStep(1);
    setMessage({type:"", text:""});
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
          recurrence_type: formData.recurrence_type.toUpperCase(),
          start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
          day_of_month: parseInt(formData.day_of_month) || 1,
          day_of_week: parseInt(formData.day_of_week) || 0,
          interval_days: parseInt(formData.interval_days) || 1,
          grace_period_days: parseInt(formData.grace_period_days) || 0
        };
      }

      const res = await unifiedCreate(payload);
      
      setMessage({ type: "success", text: "Invoice created successfully." });
      setIsFormOpen(false);
      fetchGlobalLedger();
      fetchUpcoming();
      
      // Reset
      setFormData(prev => ({ 
        ...prev, 
        name: "", phone: "", email: "", account_no: "",
        description: "", amount: "", due_date: "", is_recurring: false 
      }));
      setCustomFields([]);
      
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create invoice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'settled': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'clear': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'pending': return 'bg-[#fdc649]/20 text-[#d97706]';
      case 'partial': return 'bg-orange-100 text-orange-600';
      case 'overdue': return 'bg-red-100 text-red-600';
      case 'voided': return 'bg-zinc-100 text-zinc-500';
      case 'rolled': return 'bg-blue-100 text-blue-600';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };

  const formatReviewTarget = () => {
    return { 
      title: "Payer", 
      val: formData.name, 
      count: 1 
    };
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(val || 0);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Invoices & Obligations</h1>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            Bill your payers natively and track receivables
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={openForm}
            className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-5 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        )}
      </div>

      {message.text && (
        <div 
          className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' 
              ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#6bb800]' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
             <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
          <button 
            onClick={() => setMessage({ type: "", text: "" })}
            className="ml-auto p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Forms Area / Wizard */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
          >
           {/* Form content mapping perfectly kept here */}
            <Card className="py-8 px-8 relative border-zinc-200 shadow-md ring-4 ring-zinc-50/50">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-zinc-900 flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-900 text-white">
                    {currentStep}
                  </div>
                  {currentStep === 1 ? 'Payer Information' : currentStep === 2 ? 'Invoice Details' : 'Review & Send'}
                </h2>

                <div className="flex gap-2">
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 1 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 2 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 3 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
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
                        className={inputCls}
                        placeholder="e.g. John Doe, Unit 4A Ltd"
                        required
                      />
                    </Field>

                    <Field label="Account/Reference No.">
                      <input
                        name="account_no"
                        type="text"
                        value={formData.account_no}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="e.g. UNIT-3B, STU-5542"
                      />
                    </Field>

                    <Field label="Phone Number">
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="2547XXXXXXXX"
                      />
                    </Field>

                    <Field label="Email Address">
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="john@example.com"
                      />
                    </Field>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Unified Flow: If the payer exists (by phone or account), we update them. If not, a new payer record is created automatically.
                  </p>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-6">
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
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="0.00"
                        required
                      />
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
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 mt-4">
                    <div className="flex items-center gap-3">
                      <label className="relative flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          name="is_recurring"
                          className="peer sr-only"
                          checked={formData.is_recurring}
                          onChange={handleChange}
                        />
                        <div className="h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#a3e635] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#a3e635]/50 group-hover:after:bg-zinc-100"></div>
                      </label>
                      <div>
                        <span className="text-[13px] font-medium text-zinc-900 block">Recurring Billing</span>
                        <span className="text-[10px] text-zinc-500">Automatically generate this invoice on a schedule</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {formData.is_recurring && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 overflow-hidden"
                        >
                          <Field label="Cycle" required>
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
                              <option value="custom">Custom Interval</option>
                            </select>
                          </Field>
                          
                          <Field label="Start Date" required>
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
                            <Field label="Interval (Days)" required>
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

                          <Field label="Grace Period (Days)" required>
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

                          <div className="md:col-span-3 mt-2">
                            <AnimatePresence>
                              {recurringPreview && (
                                <motion.div 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/20 p-3 flex items-start gap-2.5"
                                >
                                  <svg className="h-4 w-4 text-[#6bb800] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-[11px] font-medium text-zinc-700 leading-relaxed italic">
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

                  {/* Meta Extensibility Blocks */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-[12px] font-semibold text-zinc-900">Custom Attributes (Meta)</h4>
                        <p className="text-[10px] text-zinc-400">Add any additional structured data needed (e.g. term, block unit).</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Field
                      </button>
                    </div>
                    
                    {customFields.length > 0 ? (
                      <div className="space-y-2">
                        {customFields.map((field, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleCustomFieldChange(i, "key", e.target.value)}
                              placeholder="Key (e.g. penalty_rate)"
                              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] font-medium placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleCustomFieldChange(i, "value", e.target.value)}
                              placeholder="Value (e.g. 0.05)"
                              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] font-medium placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(i)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="rounded-xl border border-dashed border-zinc-200 py-6 text-center">
                         <p className="text-[11px] text-zinc-400 font-medium">No custom attributes added.</p>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-[#a3e635]/20 flex items-center justify-center text-[#6bb800] mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-2">Ready to Generate Invoices</h3>
                    <p className="text-[13px] text-zinc-500 max-w-sm">
                      You are about to generate <strong className="text-zinc-900">{formatReviewTarget().count}</strong> invoice(s) for <strong className="text-zinc-900">{formatReviewTarget().val}</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-[12px]">
                    <div>
                      <span className="block text-zinc-400 font-medium uppercase tracking-widest text-[9px]">Description</span>
                      <span className="font-semibold text-zinc-900">{formData.description}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 font-medium uppercase tracking-widest text-[9px]">Amount Due</span>
                      <span className="font-semibold text-zinc-900">KES {parseFloat(formData.amount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 font-medium uppercase tracking-widest text-[9px]">Type</span>
                      <span className="font-semibold text-zinc-900 flex items-center gap-1">
                        {formData.is_recurring ? (
                          <>
                            <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Recurring ({formData.recurrence_type})
                          </>
                        ) : 'One-Time'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 font-medium uppercase tracking-widest text-[9px]">
                        {formData.is_recurring ? 'Starts' : 'Due'}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {formData.is_recurring ? formData.start_date : (formData.due_date || 'Not Set')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Footer Nav */}
              <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  {currentStep < 3 ? (
                     <button
                       type="button"
                       onClick={nextStep}
                       className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
                     >
                       Next Step
                       <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                       </svg>
                     </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-8 py-2.5 text-[13px] tracking-wide font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        "Generate & Send"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFormOpen && (
        <>
          {/* Summary Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Total Payers" 
                 value={(ledgerBoard?.total_payers || 0).toLocaleString()} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Total Expected" 
                 value={formatCurrency(ledgerBoard?.total_balance + ledgerBoard?.total_paid || 0)} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Collected" 
                 value={formatCurrency(ledgerBoard?.total_paid || 0)} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4 border-l-4 border-l-red-400">
               <StatWidget 
                 label="Outstanding" 
                 value={formatCurrency(ledgerBoard?.total_balance || 0)} 
                 trendUp={false} 
               />
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Main Payer Ledger Table */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  {['all', 'pending', 'overdue', 'settled', 'clear'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}
                      className={`relative px-4 py-3 text-[13px] font-bold transition-colors ${
                        statusFilter === tab ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {ledgerBoard?.counts && (
                        <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px]">
                          {tab === 'all' ? (ledgerBoard.total_payers || 0) : (ledgerBoard.counts[tab] || 0)}
                        </span>
                      )}
                      {statusFilter === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900"
                          initial={false}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mb-2">
                  <select
                    value={groupFilter}
                    onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 outline-none transition-all hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 shadow-sm min-w-[140px] appearance-none"
                  >
                    <option value="all">All Groups</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
                </div>
              ) : !ledgerBoard?.items || ledgerBoard.items.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-zinc-900">No payers found</h3>
                  <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
                    Ready to request a payment? Create a single bill or bulk generate them for an entire group.
                  </p>
                </Card>
              ) : (
                <Card className="overflow-hidden noPadding">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px] whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                          <th className="px-5 py-4">Payer</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Invoices</th>
                          <th className="px-5 py-4">Total Paid</th>
                          <th className="px-5 py-4">Total Balance</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {ledgerBoard.items.map((payer) => (
                          <tr key={payer.payer_id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-zinc-900">{payer.payer_name || "Unknown"}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{payer.payer_account_no || payer.payer_phone || "No Account Info"}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(payer.payer_status)}`}>
                                {payer.payer_status}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-medium text-zinc-700">
                              <span className="flex items-center gap-1.5">
                                {payer.total_obligations} Active
                                {payer.overdue_count > 0 && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                    {payer.overdue_count} Overdue
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-zinc-500 font-medium">
                              {formatCurrency(payer.total_paid)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-zinc-900">
                                {formatCurrency(payer.total_balance)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Link 
                                href={`/dashboard/payers/${payer.payer_id}/ledger`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg shadow-sm transition-all active:scale-95"
                              >
                                View Ledger
                                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination placeholder if pages > 1 */}
                  {ledgerBoard.total_payers > pageSize && (
                    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 bg-zinc-50/50">
                      <span className="text-[11px] text-zinc-500">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, ledgerBoard.total_payers)} of {ledgerBoard.total_payers}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="px-3 py-1 bg-white border border-zinc-200 rounded text-[11px] font-medium disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button 
                          disabled={currentPage * pageSize >= ledgerBoard.total_payers}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="px-3 py-1 bg-white border border-zinc-200 rounded text-[11px] font-medium disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Sidebar Calendar View */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
               <Card className="px-5 py-5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                 <h4 className="text-[14px] font-bold text-zinc-900 flex items-center justify-between mb-5">
                   Upcoming Invoices
                   <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[10px]">
                     Next 30 Days
                   </span>
                 </h4>

                 {!upcomingPayments ? (
                   <div className="animate-pulse flex flex-col gap-3">
                     {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-100 rounded-xl w-full" />)}
                   </div>
                 ) : upcomingPayments?.entries?.length === 0 ? (
                   <div className="text-center py-8">
                     <p className="text-[12px] text-zinc-400">No upcoming payments scheduled.</p>
                   </div>
                 ) : (
                   <div className="space-y-4 relative">
                     <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-100 -z-10" />
                     {upcomingPayments.entries.map((entry, idx) => {
                       const d = new Date(entry.due_date);
                       const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                       
                       return (
                         <div key={idx} className="flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-white border-2 border-zinc-100 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-[#a3e635]" />
                           </div>
                           <div className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                             <div className={`flex items-center justify-between ${entry.obligations?.length > 0 ? "mb-2 pb-2 border-b border-zinc-200" : "mb-1.5"}`}>
                               <p className="text-[12px] font-bold text-zinc-900">{dateLabel}</p>
                               <p className="text-[12px] font-bold text-zinc-900">{formatCurrency(entry.total_due)}</p>
                             </div>
                             
                             {entry.obligations?.length > 0 ? (
                               <div className="space-y-2 mt-2">
                                 {entry.obligations.slice(0, 3).map((ob, obIdx) => (
                                   <div key={obIdx} className="flex justify-between items-center text-[11px]">
                                     <div className="min-w-0 flex-1 truncate pr-2 flex items-baseline gap-1.5">
                                       <span className="font-semibold text-zinc-800 truncate">{ob.payer?.name || "Unknown"}</span>
                                       <span className="text-zinc-400 truncate text-[10px]">- {ob.description}</span>
                                     </div>
                                     <span className="font-bold text-zinc-700 tabular-nums shrink-0">
                                       {formatCurrency(ob.amount_due)}
                                     </span>
                                   </div>
                                 ))}
                                 {entry.obligations.length > 3 && (
                                   <p className="text-[10px] text-zinc-400 font-medium italic mt-1 pb-0.5">
                                     + {entry.obligations.length - 3} more payments
                                   </p>
                                 )}
                               </div>
                             ) : (
                               <p className="text-[10px] font-medium text-zinc-500">
                                 {entry.total_count} invoices due ({entry.unpaid_count} unpaid)
                               </p>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </Card>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
