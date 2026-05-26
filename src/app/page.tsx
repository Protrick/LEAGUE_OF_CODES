"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero";
import FeatureSection from "@/components/features";
import BottomCTA from "@/components/bottom-cta";

export default function Page() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        JSON.parse(stored);
        setChecking(false);
      } catch {
        localStorage.removeItem("user");
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (checking) return null;

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -z-10" />
        <HeroSection />
        <FeatureSection />
        <BottomCTA />
      </main>
    </>
  );
}
