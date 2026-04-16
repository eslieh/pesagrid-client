"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { 
  getPayers, createPayer, deletePayer, 
  getPayerGroups, createPayerGroup, deletePayerGroup 
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
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5";

export default function PayersPage() {
  const [activeTab, setActiveTab] = useState("payers"); // "payers" or "groups"
  const [payers, setPayers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state for Payers list
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("");

  // Form states
  const [isPayerFormOpen, setIsPayerFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [payerFormData, setPayerFormData] = useState({
    name: "",
    phone: "",
    email: "",
    account_no: "",
    group_id: "",
  });

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
    group_type: "custom",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [payRes, groupRes] = await Promise.all([
        getPayers({ limit: 20 }),
        getPayerGroups({ limit: 20 })
      ]);
      if (payRes && payRes.items) setPayers(payRes.items);
      if (groupRes) setGroups(Array.isArray(groupRes) ? groupRes : (groupRes.items || []));
    } catch (err) {
      console.error("Failed to load directory data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayerChange = (e) => {
    const { name, value } = e.target;
    setPayerFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupChange = (e) => {
    const { name, value } = e.target;
    setGroupFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePayer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createPayer({
        ...payerFormData,
        group_id: payerFormData.group_id || undefined, // undefined if empty string
        meta: {}
      });
      setMessage({ type: "success", text: "Payer created successfully." });
      setIsPayerFormOpen(false);
      setPayerFormData({ name: "", phone: "", email: "", account_no: "", group_id: "" });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create payer." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createPayerGroup({
        ...groupFormData,
        meta: {}
      });
      setMessage({ type: "success", text: "Group created successfully." });
      setIsGroupFormOpen(false);
      setGroupFormData({ name: "", description: "", group_type: "custom" });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create group." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payer?")) return;
    try {
      await deletePayer(id);
      loadData();
      setMessage({ type: "success", text: "Payer deleted successfully." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete payer." });
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group? (Note: ensure no payers are currently assigned)")) return;
    try {
      await deletePayerGroup(id);
      loadData();
      setMessage({ type: "success", text: "Group deleted successfully." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete group." });
    }
  };

  const filteredPayers = selectedGroupFilter 
    ? payers.filter(p => p.group_id === selectedGroupFilter)
    : payers;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Payers & Groups Directory</h1>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            Manage your tenants, members, students, or customers
          </p>
        </div>
        
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab("payers"); setIsGroupFormOpen(false); }}
            className={`px-5 py-2 text-[12px] font-semibold rounded-lg transition-all ${
              activeTab === "payers" 
                ? "bg-white text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Payers
          </button>
          <button
            onClick={() => { setActiveTab("groups"); setIsPayerFormOpen(false); }}
            className={`px-5 py-2 text-[12px] font-semibold rounded-lg transition-all ${
              activeTab === "groups" 
                ? "bg-white text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {message.text && (
        <div 
          className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' 
              ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#6bb800]' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}
        >
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

      {/* ======================================= */}
      {/* PAYERS VIEW */}
      {/* ======================================= */}
      {activeTab === "payers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-700 outline-none transition-all hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 shadow-sm"
              >
                <option value="">All Payers</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            
            {!isPayerFormOpen && (
              <button
                onClick={() => { setIsPayerFormOpen(true); setMessage({type:"", text:""}); }}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Payer
              </button>
            )}
          </div>

          <AnimatePresence>
            {isPayerFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="py-6 px-6 relative border-[#a3e635]/30 ring-1 ring-[#a3e635]/20 shadow-sm">
                  <button 
                    onClick={() => setIsPayerFormOpen(false)}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <h2 className="text-[14px] font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#a3e635] text-zinc-900">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Add New Payer
                  </h2>
                  
                  <form onSubmit={handleCreatePayer}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field label="Full Name / Company" required>
                        <input
                          name="name"
                          type="text"
                          value={payerFormData.name}
                          onChange={handlePayerChange}
                          className={inputCls}
                          placeholder="e.g. John Doe, Unit 4A Ltd"
                          required
                        />
                      </Field>

                      <Field label="Account/Reference No." hint="Leave blank to auto-generate a unique ID.">
                        <input
                          name="account_no"
                          type="text"
                          value={payerFormData.account_no}
                          onChange={handlePayerChange}
                          className={inputCls}
                          placeholder="e.g. UNIT-3B, STU-5542"
                        />
                      </Field>

                      <Field label="Phone Number">
                        <input
                          name="phone"
                          type="tel"
                          value={payerFormData.phone}
                          onChange={handlePayerChange}
                          className={inputCls}
                          placeholder="+254..."
                        />
                      </Field>

                      <Field label="Email Address">
                        <input
                          name="email"
                          type="email"
                          value={payerFormData.email}
                          onChange={handlePayerChange}
                          className={inputCls}
                          placeholder="john@example.com"
                        />
                      </Field>

                      <Field label="Assign to Group (Optional)">
                        <select
                          name="group_id"
                          value={payerFormData.group_id}
                          onChange={handlePayerChange}
                          className={inputCls}
                        >
                          <option value="">No Group</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPayerFormOpen(false)}
                        className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? "Saving..." : "Save Payer"}
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
          ) : filteredPayers.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900">No payers found</h3>
              <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
                You haven&apos;t added anyone here yet.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden noPadding">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="px-6 py-4">Payer Name</th>
                      <th className="px-6 py-4">Account / Ref</th>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {filteredPayers.map((p) => {
                      const grp = groups.find(g => g.id === p.group_id);
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-zinc-900">{p.name}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-zinc-600">
                            {p.account_no}
                          </td>
                          <td className="px-6 py-4">
                            {grp ? (
                              <span className="inline-flex px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                                {grp.name}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-zinc-500">
                            <p>{p.email}</p>
                            <p>{p.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Link 
                                  href={`/dashboard/invoices?ledger_payer_id=${p.id}`}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#6bb800] hover:text-[#559400] bg-[#a3e635]/10 hover:bg-[#a3e635]/20 rounded-lg transition-colors"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                  Financial Standing
                                </Link>
                              <button 
                                onClick={() => handleDeletePayer(p.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* GROUPS VIEW */}
      {/* ======================================= */}
      {activeTab === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {!isGroupFormOpen && (
              <button
                onClick={() => { setIsGroupFormOpen(true); setMessage({type:"", text:""}); }}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Group
              </button>
            )}
          </div>

          <AnimatePresence>
            {isGroupFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="py-6 px-6 relative border-[#a3e635]/30 ring-1 ring-[#a3e635]/20 shadow-sm">
                  <button 
                    onClick={() => setIsGroupFormOpen(false)}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <h2 className="text-[14px] font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#a3e635] text-zinc-900">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    Create New Group
                  </h2>
                  
                  <form onSubmit={handleCreateGroup}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field label="Group Name" required>
                        <input
                          name="name"
                          type="text"
                          value={groupFormData.name}
                          onChange={handleGroupChange}
                          className={inputCls}
                          placeholder="e.g. Block A, Grade 7"
                          required
                        />
                      </Field>

                      <Field label="Group Type" required>
                        <select
                          name="group_type"
                          value={groupFormData.group_type}
                          onChange={handleGroupChange}
                          className={inputCls}
                          required
                        >
                          <option value="apartment_block">Apartment Block</option>
                          <option value="school_class">School Class</option>
                          <option value="bus_route">Bus Route</option>
                          <option value="custom">Custom Cohort</option>
                        </select>
                      </Field>

                      <div className="col-span-1 md:col-span-2">
                        <Field label="Description">
                          <input
                            name="description"
                            type="text"
                            value={groupFormData.description}
                            onChange={handleGroupChange}
                            className={inputCls}
                            placeholder="Optional explanation of this cohort"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsGroupFormOpen(false)}
                        className="px-5 py-2.5 text-[12px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? "Saving..." : "Save Group"}
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
          ) : groups.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900">No groups found</h3>
              <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
                Groups help you organize your payers logically so you can bill them altogether.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(g => {
                const memberCount = payers.filter(p => p.group_id === g.id).length;
                return (
                  <Card key={g.id} className="relative group border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer">
                    <button 
                      onClick={() => handleDeleteGroup(g.id)}
                      className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-zinc-900">{g.name}</h4>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                          {g.group_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {g.description && <p className="text-[12px] text-zinc-500 mb-4">{g.description}</p>}
                    
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-zinc-600">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <button 
                        onClick={() => {
                          setSelectedGroupFilter(g.id);
                          setActiveTab("payers");
                        }}
                        className="text-[11px] font-semibold text-[#6bb800] hover:text-[#559400] transition-colors"
                      >
                        View Members &rarr;
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
