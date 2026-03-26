"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "../pesagrid/components/dashboard/Sidebar";
import Header from "../pesagrid/components/dashboard/Header";
import { getCurrentUser, logout as logoutApi } from "../../lib/Auth";
import { getBusinessProfile, createBusinessProfile } from "../../lib/Account";

export default function DashboardLayout({ children }) {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        const businessProfile = await getBusinessProfile();
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
    <div className="flex min-h-screen bg-[#f5f6f7] text-zinc-900 font-sans">
      <Sidebar 
        currentPath={pathname}
        profile={profile} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 ml-60 bg-[#f5f6f7]">
        <Header 
          user={user} 
          onAddWidget={() => {}} 
        />
        {children}
      </main>
    </div>
  );
}
