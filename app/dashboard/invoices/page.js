"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { 
  getObligations, 
  createObligation, 
  cancelObligation,
  getPayers, 
  getPayerGroups 
} from "../../../lib/Obligation";
import Link from "next/link";

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
  const [invoices, setInvoices] = useState([]);
  const [payers, setPayers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Wizard state
  const [audienceType, setAudienceType] = useState("single"); // "single" or "group"
  const [selectedPayerId, setSelectedPayerId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [formData, setFormData] = useState({
    description: "",
    amount_due: "",
    due_date: "",
    is_recurring: false,
    recurrence_type: "monthly",
    start_date: "",
    grace_period_days: 5,
    day_of_month: 1,
    day_of_week: 0,
    interval_days: 1,
  });

  const [customFields, setCustomFields] = useState([]); // [{key: "", value: ""}]

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const invRes = await getObligations({ limit: 20 });
      if (invRes && invRes.items) setInvoices(invRes.items);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [payRes, groupRes] = await Promise.all([
        getPayers({ limit: 100 }),
        getPayerGroups({ limit: 100 })
      ]);
      if (payRes && payRes.items) setPayers(payRes.items);
      if (groupRes) setGroups(Array.isArray(groupRes) ? groupRes : (groupRes.items || []));
    } catch (err) {
      console.error("Failed to load payers/groups", err);
    }
  };

  // Keep loadData as an alias used after cancel/submit to refresh the list
  const loadData = loadInvoices;

  useEffect(() => {
    loadInvoices();
    // Default Dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const backendDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

    setFormData(prev => ({
      ...prev,
      due_date: nextWeek.toISOString().split('T')[0],
      start_date: today.toISOString().split('T')[0],
      day_of_month: Math.min(28, today.getDate()),
      day_of_week: backendDayOfWeek
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Auto sync start_date and config fields for convenience
    if (name === "start_date" && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const backendDayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
        setFormData((prev) => ({ 
          ...prev, 
          day_of_month: Math.min(28, d.getDate()),
          day_of_week: backendDayOfWeek
        }));
      }
    }
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
    setAudienceType("single");
    setSelectedPayerId("");
    setSelectedGroupId("");
    // Lazy-load payers and groups only when the wizard is opened
    if (payers.length === 0 || groups.length === 0) {
      loadFormData();
    }
  };

  const nextStep = () => {
    setMessage({type:"", text:""});
    if (currentStep === 1) {
      if (audienceType === "single" && !selectedPayerId) {
        setMessage({ type: "error", text: "Please select a specific payer." });
        return;
      }
      if (audienceType === "group" && !selectedGroupId) {
        setMessage({ type: "error", text: "Please select a group." });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.description || !formData.amount_due) {
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
      // Build base payload
      const meta = {};
      customFields.forEach(f => {
        if (f.key.trim() && f.value.trim()) {
          meta[f.key.trim()] = f.value.trim();
        }
      });

      const basePayload = {
        description: formData.description,
        amount_due: parseFloat(formData.amount_due),
        currency: "KES",
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        is_recurring: formData.is_recurring,
        meta: meta,
      };

      if (formData.is_recurring) {
        let sd = new Date(formData.start_date);
        const recurringConfig = {
          start_date: sd.toISOString(),
          auto_generate: true
        };

        if (formData.recurrence_type === 'monthly') {
          recurringConfig.recurrence_type = 'monthly';
          recurringConfig.day_of_month = parseInt(formData.day_of_month) || 1;
          recurringConfig.grace_period_days = parseInt(formData.grace_period_days) || 0;
        } else if (formData.recurrence_type === 'weekly') {
          recurringConfig.recurrence_type = 'weekly';
          recurringConfig.day_of_week = parseInt(formData.day_of_week) || 0;
          recurringConfig.grace_period_days = parseInt(formData.grace_period_days) || 0;
        } else if (formData.recurrence_type === 'daily') {
          recurringConfig.recurrence_type = 'custom';
          recurringConfig.interval_days = 1;
        } else if (formData.recurrence_type === 'custom') {
          recurringConfig.recurrence_type = 'custom';
          recurringConfig.interval_days = parseInt(formData.interval_days) || 1;
        }

        basePayload.recurring = recurringConfig;
      }

      // Determine targets
      let targets = [];
      if (audienceType === "single") {
        targets.push(selectedPayerId);
      } else {
        // Find all payers in selected group
        targets = payers.filter(p => p.group_id === selectedGroupId).map(p => p.id);
        if (targets.length === 0) {
          throw new Error("No payers found in the selected group.");
        }
      }

      // Fan out requests
      const promises = targets.map(payerId => 
        createObligation({ ...basePayload, payer_id: payerId })
      );

      await Promise.all(promises);
      
      setMessage({ type: "success", text: `Successfully generated ${targets.length} invoice(s).` });
      setIsFormOpen(false);
      loadData();
      
      // Reset
      setFormData(prev => ({ ...prev, description: "", amount_due: "", is_recurring: false }));
      setCustomFields([]);
      
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create invoices." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (obligationId) => {
    if (!confirm("Are you sure you want to cancel this obligation? This action cannot be undone.")) return;
    try {
      setCancellingId(obligationId);
      setOpenActionId(null);
      await cancelObligation(obligationId);
      setMessage({ type: "success", text: "Obligation cancelled successfully." });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to cancel obligation." });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'pending': return 'bg-[#fdc649]/20 text-[#d97706]';
      case 'overdue': return 'bg-red-100 text-red-600';
      case 'cancelled': return 'bg-zinc-100 text-zinc-500';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };

  // Derived Review Data
  const formatReviewTarget = () => {
    if (audienceType === "single") {
      const p = payers.find(p => p.id === selectedPayerId);
      return { 
        title: "Single Payer", 
        val: p ? `${p.name} (${p.account_no || 'No Reference'})` : 'Unknown', 
        count: 1 
      };
    } else {
      const g = groups.find(g => g.id === selectedGroupId);
      const members = payers.filter(p => p.group_id === selectedGroupId).length;
      return { 
        title: "Entire Group", 
        val: g ? g.name : 'Unknown', 
        count: members 
      };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
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
                  {currentStep === 1 ? 'Choose Audience' : currentStep === 2 ? 'Invoice Details' : 'Review & Send'}
                </h2>

                <div className="flex gap-2">
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 1 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 2 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 3 ? 'bg-[#a3e635]' : 'bg-zinc-100'}`} />
                </div>
              </div>

              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <p className="text-[13px] text-zinc-500">Who do you want to bill?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAudienceType("single")}
                      className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left ${
                        audienceType === "single"
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-100 bg-white hover:border-zinc-200"
                      }`}
                    >
                      <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 mb-4">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[14px] font-bold text-zinc-900">Specific Payer</h4>
                      <p className="text-[12px] text-zinc-500 mt-1 mt-1">Generate a single invoice for a specific individual.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAudienceType("group")}
                      className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left ${
                        audienceType === "group"
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-100 bg-white hover:border-zinc-200"
                      }`}
                    >
                      <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 mb-4">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[14px] font-bold text-zinc-900">Entire Group</h4>
                      <p className="text-[12px] text-zinc-500 mt-1">Bulk generate invoices for an entire cohort.</p>
                    </button>
                  </div>

                  <div className="pt-4 max-w-xl">
                    {audienceType === "single" ? (
                      <Field label="Select Payer">
                         <select
                           value={selectedPayerId}
                           onChange={(e) => setSelectedPayerId(e.target.value)}
                           className={inputCls}
                         >
                           <option value="" disabled>Search or choose a payer...</option>
                           {payers.map(p => (
                             <option key={p.id} value={p.id}>{p.name} {p.account_no ? `(${p.account_no})` : ''}</option>
                           ))}
                         </select>
                      </Field>
                    ) : (
                      <Field label="Select Group">
                         <select
                           value={selectedGroupId}
                           onChange={(e) => setSelectedGroupId(e.target.value)}
                           className={inputCls}
                         >
                           <option value="" disabled>Choose a predefined group...</option>
                           {groups.map(g => {
                             const membersCount = payers.filter(p => p.group_id === g.id).length;
                             return (
                               <option key={g.id} value={g.id}>{g.name} ({membersCount} members)</option>
                             );
                           })}
                         </select>
                         <p className="text-[11px] text-zinc-500 mt-1">Each member will receive their own individual invoice.</p>
                      </Field>
                    )}
                  </div>
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
                        name="amount_due"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount_due}
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
                      <span className="font-semibold text-zinc-900">KES {parseFloat(formData.amount_due || 0).toLocaleString()}</span>
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

      {/* List of Invoices */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-900">No invoices generated</h3>
          <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
            Ready to request a payment? Create a single bill or bulk generate them for an entire group.
          </p>
          {!isFormOpen && (
            <button
              onClick={openForm}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-5 py-2.5 text-[12px] font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95"
            >
              Create your first invoice
            </button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden noPadding">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Payer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Due/Next Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {inv.is_recurring && (
                          <span className="flex items-center justify-center p-1 rounded-md bg-zinc-100">
                            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Recurring">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </span>
                        )}
                        <span className="font-semibold text-zinc-900">{inv.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-700">{inv.payer?.name || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{inv.payer?.account_no}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-900">
                        {inv.currency || "KES"} {inv.amount_due?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(inv.recurring_config?.next_due_date || inv.due_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenActionId(openActionId === inv.id ? null : inv.id)}
                          disabled={cancellingId === inv.id}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {cancellingId === inv.id ? (
                            <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          )}
                        </button>

                        {openActionId === inv.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenActionId(null)}
                            />
                            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-zinc-100 bg-white shadow-lg py-1 overflow-hidden">
                              <Link
                                href={`/dashboard/transactions?account_no=${inv.payer?.account_no || ""}`}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors border-b border-zinc-50"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Transactions
                              </Link>
                              {inv.status !== 'cancelled' ? (
                                <button
                                  onClick={() => handleCancel(inv.id)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Cancel Obligation
                                </button>
                              ) : (
                                <div className="px-4 py-2.5 text-[12px] text-zinc-400 italic">Already cancelled</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
