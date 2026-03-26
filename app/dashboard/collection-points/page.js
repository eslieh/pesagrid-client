"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { 
  getCollectionPoints, 
  createCollectionPoint, 
  updateCollectionPoint, 
  getCollectionPointTotals 
} from "../../../lib/CollectionPoint";

function Field({ label, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CollectionPointsPage() {
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [cpTotals, setCpTotals] = useState({}); // { cpId: total }
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isCPFormOpen, setIsCPFormOpen] = useState(false);
  const [editingCP, setEditingCP] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [cpFormData, setCpFormData] = useState({
    name: "",
    account_no: "",
    description: "",
    is_active: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const cpRes = await getCollectionPoints();
      if (cpRes) {
        setCollectionPoints(cpRes);
        // Fetch totals for each CP
        const totalsRes = await Promise.all(cpRes.map(cp => getCollectionPointTotals(cp.id)));
        const totalsMap = {};
        cpRes.forEach((cp, i) => { 
          totalsMap[cp.id] = (totalsRes[i] && totalsRes[i].total_collected !== undefined) 
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingCP) {
        await updateCollectionPoint(editingCP.id, cpFormData);
        setMessage({ type: "success", text: "Collection point updated." });
      } else {
        await createCollectionPoint(cpFormData);
        setMessage({ type: "success", text: "Collection point created." });
      }
      setIsCPFormOpen(false);
      setEditingCP(null);
      setCpFormData({ name: "", account_no: "", description: "", is_active: true });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save collection point." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCPChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCpFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleOpenEditCP = (cp) => {
    setEditingCP(cp);
    setCpFormData({
      name: cp.name,
      account_no: cp.account_no,
      description: cp.description || "",
      is_active: cp.is_active,
    });
    setIsCPFormOpen(true);
    setMessage({ type: "", text: "" });
  };

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-medium text-zinc-900 transition-all focus:border-[#a3e635] focus:outline-none focus:ring-4 focus:ring-[#a3e635]/10 placeholder:text-zinc-400";

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Collection Points</h1>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            Define targets for bulk collections (fleet, campaigns, routes)
          </p>
        </div>

        {!isCPFormOpen && (
          <button
            onClick={() => { setIsCPFormOpen(true); setEditingCP(null); setCpFormData({name:"", account_no:"", description:"", is_active:true}); setMessage({type:"", text:""}); }}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Collection Point
          </button>
        )}
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold ${
            message.type === "success" 
              ? "bg-[#a3e635]/10 text-[#559400] border border-[#a3e635]/20" 
              : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <AnimatePresence>
        {isCPFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="py-6 px-6 relative border-[#a3e635]/30 ring-1 ring-[#a3e635]/20 shadow-sm">
              <button 
                onClick={() => setIsCPFormOpen(false)}
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
                {editingCP ? "Edit Collection Point" : "New Collection Point"}
              </h2>
              
              <form onSubmit={handleCreateCP}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Point Name" required>
                    <input
                      name="name"
                      type="text"
                      value={cpFormData.name}
                      onChange={handleCPChange}
                      className={inputCls}
                      placeholder="e.g. Matatu KAB-123C"
                      required
                    />
                  </Field>

                  <Field label="Account/Target No." required>
                    <input
                      name="account_no"
                      type="text"
                      value={cpFormData.account_no}
                      onChange={handleCPChange}
                      className={inputCls}
                      placeholder="e.g. KAB-123C"
                      required
                    />
                  </Field>

                  <div className="col-span-1 md:col-span-2">
                    <Field label="Description">
                      <input
                        name="description"
                        type="text"
                        value={cpFormData.description}
                        onChange={handleCPChange}
                        className={inputCls}
                        placeholder="Optional tracking notes"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        className="peer sr-only"
                        checked={cpFormData.is_active}
                        onChange={handleCPChange}
                      />
                      <div className="h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#a3e635] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                    <span className="text-[12px] font-medium text-zinc-600">Active</span>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCPFormOpen(false)}
                    className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Point"}
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
          {collectionPoints.map(cp => (
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
                  <span className="text-[16px] font-black text-zinc-900 leading-tight">
                    {cpTotals[cp.id] !== undefined ? `KES ${Number(cpTotals[cp.id]).toLocaleString()}` : '...'}
                  </span>
                </div>
                <div className={`h-2 w-2 rounded-full ${cp.is_active ? 'bg-[#a3e635]' : 'bg-red-400'}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
