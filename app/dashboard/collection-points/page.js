"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import {
  getCollectionPoints,
  createCollectionPoint,
  updateCollectionPoint,
  getCollectionPointTotals,
} from "../../../lib/CollectionPoint";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
} from "../../../lib/Notifications";
import CollectionPointWizard from "./CollectionPointWizard";
import CollectionPointSettings from "./CollectionPointSettings";

// ─── Default SMS body ────────────────────────────────────────────────────────
const DEFAULT_SMS_BODY =
  "Hi {{payer_name}}, we received {{currency}} {{amount_paid}} for {{collection_point_name}}. Ref: {{psp_ref}}. Thank you!";

// Available substitution variables
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
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function insertAtCursor(textarea, token) {
  if (!textarea) return textarea.value + token;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  return before + token + after;
}

function renderPreview(body) {
  let out = body;
  SMS_VARIABLES.forEach(({ token, example }) => {
    out = out.replaceAll(token, `<span class="preview-token">${example}</span>`);
  });
  return out;
}

export default function CollectionPointsPage() {
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [cpTotals, setCpTotals] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Form states - CP
  const [isCPFormOpen, setIsCPFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingCP, setEditingCP] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Settings - Global SMS Template
  const [isSmsSettingsOpen, setIsSmsSettingsOpen] = useState(false);
  const [globalSmsTemplateBody, setGlobalSmsTemplateBody] = useState(DEFAULT_SMS_BODY);
  const [globalTemplateId, setGlobalTemplateId] = useState(null);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [smsPreviewOpen, setSmsPreviewOpen] = useState(false);
  const [smsTextareaRef, setSmsTextareaRef] = useState(null);

  const [message, setMessage] = useState({ type: "", text: "" });

  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cpType, setCpType] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [cpFormData, setCpFormData] = useState({
    name: "",
    account_no: "",
    description: "",
    is_active: true,
    sms_acknowledgement: true,
    meta: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const cpRes = await getCollectionPoints(debouncedSearch, cpType || null);
      if (cpRes && cpRes.items) {
        setCollectionPoints(cpRes.items);
        setTotalCount(cpRes.total || 0);
        
        const totalsRes = await Promise.all(cpRes.items.map((cp) => getCollectionPointTotals(cp.id)));
        const totalsMap = {};
        cpRes.items.forEach((cp, i) => {
          totalsMap[cp.id] =
            totalsRes[i] && totalsRes[i].total_collected !== undefined
              ? totalsRes[i].total_collected
              : 0;
        });
        setCpTotals(totalsMap);
      }
    } catch (err) {
      console.error("Failed to load collection points", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, cpType]);

  const loadTemplate = async () => {
    try {
      const templates = await getTemplates("collection_receipt", "sms");
      if (templates && templates.length > 0) {
        const t = templates[0];
        setGlobalSmsTemplateBody(t.body || DEFAULT_SMS_BODY);
        setGlobalTemplateId(t.id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTemplate();
  }, []);

  const handleCreateCP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = buildPayload(cpFormData);
      if (editingCP) {
        await updateCollectionPoint(editingCP.id, payload);
      } else {
        await createCollectionPoint(payload);
      }

      setMessage({
        type: "success",
        text: editingCP ? "Collection point updated." : "Collection point created.",
      });
      setIsCPFormOpen(false);
      setEditingCP(null);
      resetCPForm();
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save collection point." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSmsTemplate = async (e) => {
    e.preventDefault();
    setIsSavingSms(true);
    setMessage({ type: "", text: "" });

    try {
      const templatePayload = {
        name: `Collection Point Receipt`,
        template_type: "collection_receipt",
        channel: "sms",
        body: globalSmsTemplateBody,
        is_default: true,
        is_active: true,
      };

      if (globalTemplateId) {
        await updateTemplate(globalTemplateId, {
          body: globalSmsTemplateBody,
          is_active: true,
        });
      } else {
        const t = await createTemplate(templatePayload);
        setGlobalTemplateId(t.id);
      }

      setMessage({ type: "success", text: "Global SMS template saved successfully." });
      setIsSmsSettingsOpen(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save SMS template." });
    } finally {
      setIsSavingSms(false);
    }
  };

  const resetCPForm = () => {
    setCpFormData({
      name: "",
      account_no: "",
      description: "",
      is_active: true,
      sms_acknowledgement: true,
      meta: "",
    });
  };

  const handleCPChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCpFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = (formData) => {
    const payload = {
      name: formData.name,
      account_no: formData.account_no,
      description: formData.description,
      is_active: formData.is_active,
      sms_acknowledgement: formData.sms_acknowledgement,
    };
    if (formData.meta && formData.meta.trim()) {
      try {
        payload.meta = JSON.parse(formData.meta);
      } catch {
        throw new Error("Meta field must be valid JSON (or leave it empty).");
      }
    } else {
      payload.meta = {};
    }
    return payload;
  };

  const handleOpenEditCP = (cp) => {
    setEditingCP(cp);
    setIsSettingsOpen(true);
    setCpFormData({
      name: cp.name,
      account_no: cp.account_no,
      description: cp.description || "",
      is_active: cp.is_active ?? true,
      sms_acknowledgement: cp.sms_acknowledgement ?? true,
      meta: cp.meta && Object.keys(cp.meta).length ? JSON.stringify(cp.meta, null, 2) : "",
    });

    setIsSmsSettingsOpen(false);
    setIsCPFormOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleOpenCreateCP = () => {
    setIsSmsSettingsOpen(false);
    setIsCPFormOpen(true);
    setEditingCP(null);
    resetCPForm();
    setMessage({ type: "", text: "" });
  };

  const handleOpenSmsSettings = () => {
    setIsCPFormOpen(false);
    setIsSmsSettingsOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleInsertVariable = (token) => {
    if (!smsTextareaRef) {
      setGlobalSmsTemplateBody((prev) => prev + token);
      return;
    }
    const newVal = insertAtCursor(smsTextareaRef, token);
    setGlobalSmsTemplateBody(newVal);
    setTimeout(() => {
      if (smsTextareaRef) {
        const pos = (smsTextareaRef.selectionStart || 0) + token.length;
        smsTextareaRef.focus();
        smsTextareaRef.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-medium text-zinc-900 transition-all focus:border-[#a3e635] focus:outline-none focus:ring-4 focus:ring-[#a3e635]/10 placeholder:text-zinc-400";

  const charCount = globalSmsTemplateBody.length;
  const smsPartCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">
            Collection Points
          </h1>
          <p className="text-[13px] text-zinc-500 font-medium mt-1">
            Managing <span className="text-zinc-900 font-bold">{totalCount}</span> specialized collection instruments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-1.5 shadow-sm">
            <div className="relative flex items-center">
              <svg className="absolute left-3 h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text"
                placeholder="Search name or account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0 pl-9 pr-4 py-1.5 w-48"
              />
            </div>
            
            <div className="h-6 w-[1px] bg-zinc-100" />
            
            <select 
              value={cpType}
              onChange={(e) => setCpType(e.target.value)}
              className="bg-transparent border-none text-[12px] font-black text-zinc-500 hover:text-zinc-900 focus:outline-none focus:ring-0 cursor-pointer px-3 py-1.5 appearance-none"
            >
              <option value="">All Types</option>
              <option value="fleet">Fleet</option>
              <option value="campaign">Campaign</option>
              <option value="donation">Donation</option>
              <option value="branch">Branch</option>
              <option value="event">Event</option>
            </select>
          </div>

          {!isSmsSettingsOpen && (
            <button
              onClick={handleOpenSmsSettings}
              className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-[12px] font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
              </svg>
              Global SMS Template
            </button>
          )}

          {!isCPFormOpen && (
            <button
              onClick={handleOpenCreateCP}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Point
            </button>
          )}
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold ${
              message.type === "success"
                ? "bg-[#a3e635]/10 text-[#559400] border border-[#a3e635]/20"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {message.type === "success" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global SMS Settings Form */}
      <AnimatePresence>
        {isSmsSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="py-6 px-6 relative border-indigo-200 ring-1 ring-indigo-50 shadow-sm">
              <button
                onClick={() => setIsSmsSettingsOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-[14px] font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
                  </svg>
                </span>
                Global Settings: SMS Receipt Template
              </h2>
              <p className="text-[12px] text-zinc-500 mb-6 max-w-2xl leading-relaxed">
                This template is used for all collection points to send a standard receipt when cash or M-PESA is collected. You can toggle SMS on or off for specific points, but they will all share this message format.
              </p>

              <form onSubmit={handleSaveSmsTemplate}>
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    <strong className="text-zinc-700">System Default fallback:</strong>{" "}
                    <span className="font-mono">Payment of KES {"{amount}"} received for {"{collection_point_name}"}. Ref: {"{psp_ref}"}. Thank you!</span>
                    <br />
                    Customize the message below to override the fallback for all your points.
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Click to insert variable
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SMS_VARIABLES.map(({ token, desc }) => (
                      <button
                        key={token}
                        type="button"
                        title={desc}
                        onClick={() => handleInsertVariable(token)}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-mono font-semibold text-zinc-700 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-zinc-900 active:scale-95 shadow-sm"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={(el) => setSmsTextareaRef(el)}
                    rows={4}
                    value={globalSmsTemplateBody}
                    onChange={(e) => setGlobalSmsTemplateBody(e.target.value)}
                    spellCheck={false}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-mono font-medium text-zinc-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-400 resize-none"
                    placeholder={DEFAULT_SMS_BODY}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className={`text-[10px] font-semibold tabular-nums ${charCount > 160 ? "text-amber-500" : "text-zinc-400"}`}>
                      {charCount} / {smsPartCount > 1 ? `${smsPartCount} SMS` : "1 SMS"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setGlobalSmsTemplateBody(DEFAULT_SMS_BODY)}
                    className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors underline underline-offset-2"
                  >
                    Reset to recommended default
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmsPreviewOpen((p) => !p)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {smsPreviewOpen ? "Hide" : "Preview"} message
                  </button>
                </div>

                <AnimatePresence>
                  {smsPreviewOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3"
                    >
                      <div className="rounded-xl bg-zinc-900 px-4 py-3 max-w-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                          SMS Preview
                        </p>
                        <div
                          className="text-[13px] text-zinc-100 leading-relaxed sms-preview"
                          dangerouslySetInnerHTML={{ __html: renderPreview(globalSmsTemplateBody) }}
                        />
                      </div>
                      <style>{`
                        .sms-preview .preview-token {
                          color: #a3e635; /* Using lime accent for variables */
                          font-weight: 700;
                        }
                      `}</style>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSmsSettingsOpen(false)}
                    className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSms}
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSavingSms ? "Saving..." : "Save Global Template"}
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CP Form panel */}
      <CollectionPointWizard
        isOpen={isCPFormOpen}
        onClose={() => {
          setIsCPFormOpen(false);
          setEditingCP(null);
        }}
        editingCP={null} // Wizard now only used for creation
        onSave={() => {
          setIsCPFormOpen(false);
          loadData();
          setMessage({ type: "success", text: "Collection point created successfully." });
        }}
      />

      {/* CP Settings Drawer */}
      <CollectionPointSettings 
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setEditingCP(null);
        }}
        collectionPoint={editingCP}
        onSave={() => {
          loadData();
          setMessage({ type: "success", text: "Settings saved successfully." });
        }}
      />

      {/* Collection point list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
        </div>
      ) : collectionPoints.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-900">No collection points</h3>
          <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
            Define targets like buses or campaigns to track bulk payments made to specific accounts.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionPoints.map((cp) => (
            <Card key={cp.id} className="relative group border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer">
              <button
                onClick={() => handleOpenEditCP(cp)}
                className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-zinc-900">{cp.name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    Account: {cp.account_no}
                  </span>
                </div>
              </div>
              {cp.description && <p className="text-[12px] text-zinc-500 mb-4">{cp.description}</p>}

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-tight">Total Volume</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black text-zinc-900 leading-tight">
                      {cpTotals[cp.id] !== undefined
                        ? `KES ${Number(cpTotals[cp.id]).toLocaleString()}`
                        : "..."}
                    </span>
                    <a
                      href={`/dashboard/collection-points/${cp.id}/dashboard`}
                      className="ml-2 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
                    >
                      Dashboard
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div className={`h-2 w-2 rounded-full ${cp.is_active ? "bg-[#a3e635]" : "bg-red-400"}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
