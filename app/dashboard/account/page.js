"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "../../pesagrid/components/dashboard/UI";
import { getBusinessProfile, createBusinessProfile } from "../../../lib/Account";
import { getCurrentUser } from "../../../lib/Auth";

/* ── reusable field ─────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5";

/* ── page ───────────────────────────────────────────── */
export default function AccountPage() {
  const [profile, setProfile] = useState({
    business_name: "",
    display_name: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    email_from: "",
    meta: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBusinessProfile();
        if (data) {
          setProfile(data);
        } else {
          const user = await getCurrentUser();
          setProfile((p) => ({
            ...p,
            display_name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const user = await getCurrentUser();
      await createBusinessProfile({
        ...profile,
        id: profile.id || crypto.randomUUID(),
        collection_id: user.id || user.uid,
        created_at: profile.created_at || new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const set = (key) => (e) => setProfile({ ...profile, [key]: e.target.value });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Account Settings</h1>
        <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
          Manage your business profile and sender identity
        </p>
      </div>

      {/* Avatar row */}
      <Card className="py-5 px-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-zinc-100 overflow-hidden border-2 border-white ring-1 ring-zinc-200">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile.display_name || profile.business_name || "User"
                  )}&background=e4e4e7&color=52525b&size=128`}
                  className="h-full w-full object-cover"
                  alt="avatar"
                />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
              <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-zinc-900">
              {profile.display_name || profile.business_name || "Your Name"}
            </p>
            <p className="text-[12px] text-zinc-400">{profile.email || "—"}</p>
          </div>
        </div>
      </Card>

      {/* Business info */}
      <Card className="py-5 px-6">
        <h2 className="text-[13px] font-semibold text-zinc-900 mb-5">Business Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Field label="Business Name">
              <input
                type="text"
                value={profile.business_name}
                onChange={set("business_name")}
                className={inputCls}
                placeholder="e.g. Finex Corp"
              />
            </Field>

            <Field label="Display Name">
              <input
                type="text"
                value={profile.display_name}
                onChange={set("display_name")}
                className={inputCls}
                placeholder="Owner or Manager Name"
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                value={profile.phone}
                onChange={set("phone")}
                className={inputCls}
                placeholder="+254 7…"
              />
            </Field>

            <Field label="Business Email">
              <input
                type="email"
                value={profile.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="contact@business.com"
              />
            </Field>

            <Field label="Physical Address">
              <input
                type="text"
                value={profile.address}
                onChange={set("address")}
                className={`${inputCls} md:col-span-2`}
                placeholder="Street, City, Country"
              />
            </Field>

            <Field label="Email From (Sender Name)">
              <input
                type="text"
                value={profile.email_from}
                onChange={set("email_from")}
                className={inputCls}
                placeholder="e.g. Finex Support"
              />
            </Field>

            <Field label="Logo URL">
              <input
                type="text"
                value={profile.logo_url}
                onChange={set("logo_url")}
                className={inputCls}
                placeholder="https://…"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between gap-4">
            {message.text ? (
              <span
                className={`text-[11px] font-medium ${
                  message.type === "success" ? "text-[#6bb800]" : "text-red-500"
                }`}
              >
                {message.text}
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
