"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { updateCollectionPoint } from "../../../lib/CollectionPoint";
import { getTemplates, updateTemplate, createTemplate } from "../../../lib/Notifications";

const DEFAULT_SMS_BODY =
  "Hi {{payer_name}}, we received {{currency}} {{amount_paid}} for {{collection_point_name}}. Ref: {{psp_ref}}. Thank you!";

const SMS_VARIABLES = [
  { token: "{{payer_name}}", example: "John Kamau", desc: "Payer name" },
  { token: "{{amount_paid}}", example: "150.00", desc: "Amount paid" },
  { token: "{{currency}}", example: "KES", desc: "Currency code" },
  { token: "{{collection_point_name}}", example: "Matatu KDA 00", desc: "Collection point name" },
  { token: "{{account_no}}", example: "KDA-00", desc: "Account number" },
  { token: "{{psp_ref}}", example: "LGR019G3J4", desc: "M-PESA reference" },
  { token: "{{transaction_date}}", example: "01 Apr 2026, 14:54", desc: "Payment date/time" },
  { token: "{{settled_by}}", example: "mpesa", desc: "Payment channel" },
  { token: "{{paybill}}", example: "123456", desc: "Paybill number" },
];

function Field({ label, children, required, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function renderPreview(body) {
  let out = body;
  SMS_VARIABLES.forEach(({ token, example }) => {
    out = out.replaceAll(token, `<span class="px-1 text-[#a3e635] font-bold">${example}</span>`);
  });
  return out;
}

const inputCls = "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-[14px] font-medium text-zinc-900 transition-all focus:border-[#a3e635] focus:outline-none focus:ring-4 focus:ring-[#a3e635]/10 placeholder:text-zinc-400";

export default function CollectionPointSettings({ isOpen, onClose, collectionPoint, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    account_no: "",
    description: "",
    is_active: true,
    sms_acknowledgement: true,
  });

  const [smsBody, setSmsBody] = useState(DEFAULT_SMS_BODY);
  const [templateId, setTemplateId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    if (isOpen && collectionPoint) {
      setFormData({
        name: collectionPoint.name || "",
        account_no: collectionPoint.account_no || "",
        description: collectionPoint.description || "",
        is_active: collectionPoint.is_active ?? true,
        sms_acknowledgement: collectionPoint.sms_acknowledgement ?? true,
      });
      fetchTemplate();
    }
  }, [isOpen, collectionPoint]);

  const fetchTemplate = async () => {
    try {
      setLoadingTemplate(true);
      // Fetch templates for this CP, assuming naming convention or filter
      const res = await getTemplates("collection_receipt", "sms");
      // Find the one corresponding to this CP if exists, otherwise fallback to global/default
      const cpTemplate = res.items?.find((t) => t.name === `cp_ack_${collectionPoint.id}`);
      if (cpTemplate) {
        setSmsBody(cpTemplate.body);
        setTemplateId(cpTemplate.id);
      } else {
        setSmsBody(DEFAULT_SMS_BODY);
        setTemplateId(null);
      }
    } catch (err) {
      console.error("Failed to fetch SMS template", err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update CP settings
      await updateCollectionPoint(collectionPoint.id, {
        name: formData.name,
        account_no: formData.account_no,
        description: formData.description,
        is_active: formData.is_active,
        sms_acknowledgement: formData.sms_acknowledgement,
      });

      // 2. Save SMS template
      if (formData.sms_acknowledgement) {
        if (templateId) {
          await updateTemplate(templateId, { body: smsBody });
        } else {
          await createTemplate({
            name: `cp_ack_${collectionPoint.id}`,
            template_type: "acknowledgement",
            channel: "sms",
            subject: "Payment Received",
            body: smsBody,
            is_active: true,
          });
        }
      }

      onSave();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[60] w-full max-w-lg bg-zinc-50 shadow-2xl overflow-y-auto border-l border-zinc-200"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 bg-white sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-zinc-900">Settings</h2>
                  <p className="text-[12px] text-zinc-500 font-medium">Configure {formData.name || "collection point"}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 space-y-8">
                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 ${
                      formData.is_active ? "border-[#a3e635] bg-[#a3e635]/5 ring-1 ring-[#a3e635]/20" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[18px]">{formData.is_active ? "🟢" : "⚪"}</span>
                      <div className={`h-5 w-9 rounded-full relative transition-colors ${formData.is_active ? "bg-[#a3e635]" : "bg-zinc-200"}`}>
                        <div className={`absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform ${formData.is_active ? "translate-x-4" : ""}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">Is Active</p>
                      <p className="text-[11px] text-zinc-500">Collect payments</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFormData(p => ({ ...p, sms_acknowledgement: !p.sms_acknowledgement }))}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 ${
                      formData.sms_acknowledgement ? "border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-400/20" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[18px]">💬</span>
                      <div className={`h-5 w-9 rounded-full relative transition-colors ${formData.sms_acknowledgement ? "bg-indigo-500" : "bg-zinc-200"}`}>
                        <div className={`absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform ${formData.sms_acknowledgement ? "translate-x-4" : ""}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">SMS Alerts</p>
                      <p className="text-[11px] text-zinc-500">Auto-ack payments</p>
                    </div>
                  </div>
                </div>

                {/* Identity */}
                <div className="space-y-5">
                  <Field label="Point Name" required>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Account / Ref No." required>
                    <input
                      name="account_no"
                      type="text"
                      value={formData.account_no}
                      onChange={handleInputChange}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Description">
                    <input
                      name="description"
                      type="text"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* SMS Template Section */}
                <AnimatePresence>
                  {formData.sms_acknowledgement && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="h-[1px] bg-zinc-200 w-full" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[14px] font-bold text-zinc-900">Acknowledgement SMS</h3>
                        <div className="flex gap-1">
                          {SMS_VARIABLES.slice(0, 3).map(v => (
                            <button
                              key={v.token}
                              onClick={() => setSmsBody(p => p + v.token)}
                              className="px-2 py-1 text-[9px] font-bold bg-zinc-100 text-zinc-600 rounded-md hover:bg-zinc-200 border border-zinc-200/50"
                            >
                              {v.token}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          rows={4}
                          value={smsBody}
                          onChange={(e) => setSmsBody(e.target.value)}
                          className={`${inputCls} resize-none font-mono text-[12px] leading-relaxed`}
                          placeholder="Your custom SMS message..."
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] font-bold text-zinc-400 bg-white/80 px-2 py-0.5 rounded-full">
                          {smsBody.length} characters
                        </div>
                      </div>

                      {/* iPhone-style Preview Bubble */}
                      <div className="p-6 bg-zinc-100/50 rounded-[32px] border border-zinc-100 flex justify-center">
                        <div className="relative max-w-[280px]">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="ml-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PESAGRID</span>
                            <div className="bg-white border border-zinc-200 px-4 py-3 rounded-[22px] rounded-bl-[4px] shadow-sm">
                              <p 
                                className="text-[12px] text-zinc-900 leading-[1.4] whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: renderPreview(smsBody) }}
                              />
                            </div>
                            <span className="ml-4 text-[9px] font-bold text-zinc-400">Now • SMS</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                        <span className="text-xl">💡</span>
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Variables like <span className="font-bold">{"{{payer_name}}"}</span> will be replaced with real data during dispatch. Make sure your message stays professional!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-zinc-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-10 shadow-up">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-[13px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-2xl bg-[#a3e635] px-8 py-3 text-[13px] font-black text-zinc-900 shadow-xl shadow-[#a3e635]/20 hover:bg-[#9de500] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
