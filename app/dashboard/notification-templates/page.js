"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from "../../../lib/Notifications";

const supportedVariables = [
  { name: "payer_name", desc: "Name of the payer" },
  { name: "amount_due", desc: "Total amount owed" },
  { name: "amount_paid", desc: "Current payment amount" },
  { name: "total_paid", desc: "Cumulative total paid" },
  { name: "balance", desc: "Remaining balance" },
  { name: "due_date", desc: "Obligation due date" },
  { name: "account_no", desc: "Account Reference" },
  { name: "description", desc: "Charge description" },
  { name: "collection_name", desc: "Business name" },
  { name: "currency", desc: "Currency code" },
  { name: "psp_ref", desc: "Payment ref (e.g. M-PESA TransID)" },
  { name: "transaction_date", desc: "Date payment received" },
  { name: "settled_by", desc: "Payment method" },
  { name: "phone", desc: "Payer phone number" },
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 pt-5 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Notification Templates</h1>
          <p className="text-[12px] text-zinc-400 mt-1">Manage automated messages for payments and reminders.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
        >
          Create Template
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100">
          <p className="text-[12px] text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-[#a3e635]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="group relative flex flex-col justify-between hover:border-zinc-200 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    tpl.channel === 'sms' ? 'bg-blue-50 text-blue-600' : 
                    tpl.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' : 
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {tpl.channel}
                  </span>
                  {tpl.is_default && (
                    <span className="text-[9px] font-bold text-[#6bb800] uppercase tracking-wider">Default</span>
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-zinc-900 truncate mb-1">{tpl.name}</h3>
                <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                  {tpl.body}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleOpenModal(tpl)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(tpl.id)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <span className="text-[10px] text-zinc-300">
                  {new Date(tpl.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
          
          {templates.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50/30">
              <p className="text-[12px] text-zinc-400">No templates found. Create your first template to get started.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <TemplateModal 
            template={editingTemplate} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchTemplates();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplateModal({ template, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: template?.name || "",
    template_type: template?.template_type || "payment_reminder",
    channel: template?.channel || "sms",
    subject: template?.subject || "",
    body: template?.body || "",
    is_default: template?.is_default || false,
    is_active: template?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (template) {
        // Only specific fields allowed for patch
        await updateTemplate(template.id, {
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          is_active: formData.is_active,
          is_default: formData.is_default
        });
      } else {
        await createTemplate(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + ` {{${variable}}}`
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-zinc-900">
              {template ? "Edit Template" : "New Template"}
            </h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-zinc-50 transition-colors">
              <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rent Reminder SMS"
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[13px] transition-all focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Category</label>
                <select
                  disabled={!!template}
                  value={formData.template_type}
                  onChange={e => setFormData({ ...formData, template_type: e.target.value })}
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[13px] transition-all focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-100 appearance-none disabled:opacity-50"
                >
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="overdue_notice">Overdue Notice</option>
                  <option value="payment_receipt">Payment Receipt (Partial)</option>
                  <option value="payment_receipt_full">Payment Receipt (Full)</option>
                  <option value="obligation_created">Obligation Created</option>
                  <option value="obligation_cancelled">Obligation Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Channel</label>
                <select
                  disabled={!!template}
                  value={formData.channel}
                  onChange={e => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[13px] transition-all focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-100 appearance-none disabled:opacity-50"
                >
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Subject (Optional)</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. {{collection_name}} - Payment Reminder"
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[13px] transition-all focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Body Message</label>
              <textarea
                required
                rows={4}
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                placeholder="Hi {{payer_name}}, your payment of {{amount_due}} is due..."
                className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-[13px] transition-all focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Available Variables</label>
              <div className="flex flex-wrap gap-2">
                {supportedVariables.map(v => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => insertVariable(v.name)}
                    className="rounded-full bg-zinc-50 border border-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    title={v.desc}
                  >
                    + {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-200 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-[12px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">Set as Default</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-200 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-[12px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">Active</span>
              </label>
            </div>

            {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-zinc-100 bg-white py-3 text-[13px] font-bold text-zinc-400 transition-all hover:bg-zinc-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-3 rounded-xl bg-zinc-900 py-3 text-[13px] font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : template ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
