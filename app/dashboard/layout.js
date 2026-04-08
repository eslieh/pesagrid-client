"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "../pesagrid/components/dashboard/Sidebar";
import Header from "../pesagrid/components/dashboard/Header";
import { getCurrentUser, logout as logoutApi } from "../../lib/Auth";
import { getBusinessProfile, createBusinessProfile } from "../../lib/Account";
import { getSubscription } from "../../lib/Billing";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        const [businessProfile, subData] = await Promise.all([
          getBusinessProfile(),
          getSubscription().catch(() => null)
        ]);
        
        if (subData) {
          setSubscription(subData);
        }

        if (!businessProfile) {
          const newProfile = await createBusinessProfile({
            id: crypto.randomUUID(),
            collection_id: userData.id || userData.uid,
            business_name: "My Business",
            display_name: userData.name || "Business Owner",
            phone: userData.phone || "",
            email: userData.email || "",
            address: "",
            logo_url: "",
            email_from: userData.email || "",
            meta: {},
            created_at: new Date().toISOString()
          });
          setProfile(newProfile);
        } else {
          setProfile(businessProfile);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        if (err.message.includes("401")) {
          window.location.href = "/auth/login";
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
      window.location.href = "/auth/login";
    } catch (err) {
      window.location.href = "/auth/login";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-zinc-100 border-t-zinc-900"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-zinc-900 font-sans flex-col">
      {subscription?.status === "SUSPENDED" && (
        <div className="z-50 w-full bg-red-600 px-4 py-2 text-center text-[13px] font-medium text-white shadow-sm">
          Your account is suspended due to insufficient wallet funds. Top up your wallet within the grace period to avoid being blocked.{" "}
          <Link href="/dashboard/billing" className="font-bold underline">
            Resolve now &rarr;
          </Link>
        </div>
      )}
      <div className="flex flex-1 relative w-full">
        <Sidebar 
          currentPath={pathname}
          profile={profile} 
          subscription={subscription}
          onLogout={handleLogout} 
        />

        <main className="flex-1 ml-60 bg-[#f5f6f7] flex flex-col min-h-full">
          <Header 
            user={user} 
            profile={profile}
            onAddWidget={() => {}} 
          />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
