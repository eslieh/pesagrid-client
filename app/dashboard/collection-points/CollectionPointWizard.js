"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { createCollectionPoint, updateCollectionPoint, linkCollectionPointChannel } from "../../../lib/CollectionPoint";
import { getPaymentChannels } from "../../../lib/PaymentChannel";

function Field({ label, children, required, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

const TYPES = [
  { id: "fleet", icon: "🚌", label: "Fleet unit", desc: "Bus, taxi, vehicle" },
  { id: "campaign", icon: "🏛️", label: "Campaign", desc: "Fundraising goal" },
  { id: "donation", icon: "⛪", label: "Donations", desc: "Ongoing giving" },
  { id: "fee_collection", icon: "🎓", label: "Fee collection", desc: "School, chama" },
  { id: "event", icon: "🏟️", label: "Event", desc: "One-time burst" },
  { id: "custom", icon: "⚡", label: "Custom", desc: "Build your own" },
];

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-medium text-zinc-900 transition-all focus:border-[#a3e635] focus:outline-none focus:ring-4 focus:ring-[#a3e635]/10 placeholder:text-zinc-400";

export default function CollectionPointWizard({ isOpen, onClose, onSave, editingCP }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const [formData, setFormData] = useState({
    cp_type: "custom",
    name: "",
    account_no: "",
    description: "",
    is_active: true,
    sms_acknowledgement: true,
    linked_channels: [], // array of IDs
    goal_amount: "",
    goal_period: "daily",
    start_date: "",
    end_date: "",
    compliance_threshold: "",
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMessage({ type: "", text: "" });
      if (editingCP) {
        setFormData({
          cp_type: editingCP.cp_type || "custom",
          name: editingCP.name || "",
          account_no: editingCP.account_no || "",
          description: editingCP.description || "",
          is_active: editingCP.is_active ?? true,
          sms_acknowledgement: editingCP.sms_acknowledgement ?? true,
          linked_channels: [], // editing existing linked channels is not yet fully supported by this UI step 
          goal_amount: editingCP.goal_amount || "",
          goal_period: editingCP.goal_period || "daily",
          start_date: editingCP.start_date ? editingCP.start_date.split('T')[0] : "",
          end_date: editingCP.end_date ? editingCP.end_date.split('T')[0] : "",
          compliance_threshold: editingCP.compliance_threshold || "",
        });
      } else {
        setFormData({
          cp_type: "custom",
          name: "",
          account_no: "",
          description: "",
          is_active: true,
          sms_acknowledgement: true,
          linked_channels: [],
          goal_amount: "",
          goal_period: "daily",
          start_date: "",
          end_date: "",
          compliance_threshold: "",
        });
      }
      fetchChannels();
    }
  }, [isOpen, editingCP]);

  const fetchChannels = async () => {
    try {
      setLoadingChannels(true);
      const res = await getPaymentChannels();
      setChannels(res.items || []);
    } catch (err) {
      console.error("Failed to load payment channels", err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleNext = () => setStep((p) => Math.min(5, p + 1));
  const handlePrev = () => setStep((p) => Math.max(1, p - 1));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleChannel = (id) => {
    setFormData((prev) => {
      const isSelected = prev.linked_channels.includes(id);
      if (isSelected) return { ...prev, linked_channels: prev.linked_channels.filter(c => c !== id) };
      return { ...prev, linked_channels: [...prev.linked_channels, id] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        name: formData.name,
        account_no: formData.account_no,
        description: formData.description,
        cp_type: formData.cp_type,
        is_active: formData.is_active,
        sms_acknowledgement: formData.sms_acknowledgement,
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        goal_period: formData.goal_period,
        compliance_threshold: formData.compliance_threshold ? parseFloat(formData.compliance_threshold) : null,
        meta: {},
      };

      if (formData.goal_period === "custom") {
        if (formData.start_date) payload.start_date = new Date(formData.start_date).toISOString();
        if (formData.end_date) payload.end_date = new Date(formData.end_date).toISOString();
      }

      let cpId;
      if (editingCP) {
        await updateCollectionPoint(editingCP.id, payload);
        cpId = editingCP.id;
      } else {
        const created = await createCollectionPoint(payload);
        cpId = created.id;
        
        // Link channels
        if (formData.linked_channels.length > 0) {
          await Promise.all(
            formData.linked_channels.map((channelId) =>
              linkCollectionPointChannel(cpId, {
                psp_config_id: channelId,
                label: "Primary Linked"
              }).catch(err => console.error("Link failed for channel", channelId, err))
            )
          );
        }
      }
      onSave();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save collection point." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholders = (type) => {
    switch (type) {
      case "fleet": return { name: "e.g. Matatu KAB-123C", account: "e.g. 1002", desc: "e.g. Nduta's Matatu — Route 10" };
      case "campaign": return { name: "e.g. Save The Children Fund", account: "e.g. DON-001", desc: "e.g. Annual charity drive" };
      case "donation": return { name: "e.g. Sunday Tithe & Offering", account: "e.g. TITHE", desc: "e.g. Weekly church collection" };
      case "fee_collection": return { name: "e.g. Grade 4 Tuition 2026", account: "e.g. STD4-2026", desc: "e.g. Term 1 fees collection" };
      case "event": return { name: "e.g. Blankets & Wine 2026", account: "e.g. TICKET", desc: "e.g. VIP and Regular ticket sales" };
      default: return { name: "e.g. Main Branch Sub-Account", account: "e.g. BR-1", desc: "e.g. Headquarters secondary collections" };
    }
  };

  if (!isOpen) return null;

  const placeholders = getPlaceholders(formData.cp_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mb-6"
    >
      <Card className="py-6 px-6 relative border-[#a3e635]/30 ring-1 ring-[#a3e635]/20 shadow-sm">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-[14px] font-semibold text-zinc-900 mb-6 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#a3e635] text-zinc-900">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          {editingCP ? "Edit Collection Point" : "New Collection Point Setup"}
        </h2>

        {/* Wizard Steps Indicators */}
        <div className="flex items-center gap-2 mb-8 user-select-none">
          {["Type", "Identity", "Channels", "Goal", "Review"].map((label, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className="relative flex items-center justify-center w-full">
                <div className={`h-1 w-full rounded-full ${step > idx + 1 ? "bg-[#a3e635]" : step === idx + 1 ? "bg-zinc-800" : "bg-zinc-100"} transition-colors`} />
                <span className={`absolute -bottom-5 text-[10px] font-bold uppercase tracking-widest transition-colors ${step >= idx + 1 ? "text-zinc-800" : "text-zinc-300"}`}>
                  {step > idx + 1 ? "✓ " : ""}{label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {message.text && (
          <div className="mb-4 rounded-xl px-4 py-3 text-[12px] font-semibold bg-red-50 text-red-600 border border-red-100">
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-10">
          
          {/* STEP 1: Type */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-2">What kind of collection point is this?</h3>
              <p className="text-[12px] text-zinc-500 mb-6">Select the appropriate type for analytics and tracking.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TYPES.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setFormData({ ...formData, cp_type: t.id })}
                    className={`cursor-pointer border rounded-2xl p-4 transition-all ${
                      formData.cp_type === t.id 
                        ? "border-[#a3e635] bg-[#a3e635]/5 ring-2 ring-[#a3e635]/20" 
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="text-[24px] mb-2">{t.icon}</div>
                    <div className="text-[13px] font-bold text-zinc-900">{t.label}</div>
                    <div className="text-[11px] text-zinc-500">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Identity */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Point name" required>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder={placeholders.name}
                    required
                  />
                </Field>
                <Field label="Account / ref" required>
                  <input
                    name="account_no"
                    type="text"
                    value={formData.account_no}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder={placeholders.account}
                    required
                  />
                </Field>
                <div className="col-span-1 md:col-span-2">
                  <Field label="Description (shown in receipts)">
                    <input
                      name="description"
                      type="text"
                      value={formData.description}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder={placeholders.desc}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Channels */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-2">Payment channels</h3>
              <p className="text-[12px] text-zinc-500 mb-6">Where can people pay into this point?</p>

              {editingCP && (
                <div className="mb-4 rounded-xl px-4 py-3 text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Editing linked channels is disabled during update. (Currently, channels can only be linked during setup).
                </div>
              )}

              {loadingChannels ? (
                <div className="text-[12px] text-zinc-500 italic">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-[12px] text-zinc-500 italic">No payment channels configured yet. You can still proceed and link later.</div>
              ) : (
                <div className="space-y-3">
                  {channels.map((chan) => (
                    <label key={chan.id} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.linked_channels.includes(chan.id) 
                        ? "border-[#a3e635] bg-[#a3e635]/5 shadow-sm" 
                        : "border-zinc-200 bg-white hover:border-zinc-300 pointer-events"
                      } ${editingCP ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[20px]">{chan.psp_type === "mpesa" ? "💚" : "🏦"}</div>
                        <div>
                          <p className="text-[13px] font-bold text-zinc-900">{chan.display_name}</p>
                          <p className="text-[11px] text-zinc-500">{chan.psp_type} • {chan.paybill || "Connected"}</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-300 text-[#a3e635] focus:ring-[#a3e635]"
                        checked={formData.linked_channels.includes(chan.id)}
                        onChange={() => !editingCP && handleToggleChannel(chan.id)}
                        disabled={!!editingCP}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Goal */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-2">Collection goal (optional but powerful)</h3>
              <p className="text-[12px] text-zinc-500 mb-6">Your dashboard will track progress toward this target.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Target amount (KES) & Period">
                  <div className="flex items-center gap-2">
                    <input
                      name="goal_amount"
                      type="number"
                      value={formData.goal_amount}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="e.g. 50000"
                    />
                    <select
                      name="goal_period"
                      value={formData.goal_period}
                      onChange={handleChange}
                      className={`${inputCls} w-auto`}
                    >
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="yearly">Per Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </Field>
                <Field label="Compliance Threshold (KES)" hint="Flag transactions larger than this.">
                  <input
                    name="compliance_threshold"
                    type="number"
                    value={formData.compliance_threshold}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 10000"
                  />
                </Field>
                
                {formData.goal_period === "custom" && (
                  <>
                    <Field label="Start date">
                      <input
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className={inputCls}
                      />
                    </Field>
                    
                    <Field label="End date">
                      <input
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className={inputCls}
                      />
                    </Field>
                  </>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                 <span className="text-xl">💡</span>
                 <p className="text-[11px] text-zinc-500 leading-relaxed">
                   Your dashboard will track progress toward KES {formData.goal_amount || "..."} and alert you if you're falling short. For campaigns, a countdown and total-raised bar will display prominently.
                 </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Review & Confirm</h3>
              <div className="rounded-2xl border border-zinc-200 overflow-hidden text-[13px]">
                <div className="grid grid-cols-3 border-b border-zinc-100 p-4 bg-zinc-50">
                  <div className="col-span-1 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Name</div>
                  <div className="col-span-2 font-bold text-zinc-900">{formData.name || "-"}</div>
                </div>
                <div className="grid grid-cols-3 border-b border-zinc-100 p-4">
                  <div className="col-span-1 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Account No.</div>
                  <div className="col-span-2 font-mono">{formData.account_no || "-"}</div>
                </div>
                <div className="grid grid-cols-3 border-b border-zinc-100 p-4 bg-zinc-50">
                  <div className="col-span-1 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Type</div>
                  <div className="col-span-2 capitalize">{formData.cp_type}</div>
                </div>
                {!editingCP && (
                <div className="grid grid-cols-3 border-b border-zinc-100 p-4">
                  <div className="col-span-1 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Channels</div>
                  <div className="col-span-2">{formData.linked_channels.length} linked</div>
                </div>
                )}
                {formData.goal_amount && (
                  <div className="grid grid-cols-3 p-4 bg-zinc-50">
                    <div className="col-span-1 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Goal Amount</div>
                    <div className="col-span-2 font-black text-[#84ba2b]">KES {formData.goal_amount}</div>
                  </div>
                )}
              </div>
              
               {/* Toggles */}
              <div className="flex flex-col gap-4 mt-6 p-4 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <label className="relative flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      className="peer sr-only"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <div className="h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#a3e635] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                  <span className="text-[12px] font-medium text-zinc-600">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="sms_acknowledgement"
                      className="peer sr-only"
                      checked={formData.sms_acknowledgement}
                      onChange={handleChange}
                    />
                    <div className="h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#a3e635] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                  <span className="text-[12px] font-medium text-zinc-600">SMS Acknowledgement</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 1 ? onClose : handlePrev}
              className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              ← {step === 1 ? "Cancel" : "Back"}
            </button>
            
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : editingCP ? "Update Point" : "Create Setup"}
              </button>
            )}
          </div>

        </form>
      </Card>
    </motion.div>
  );
}
