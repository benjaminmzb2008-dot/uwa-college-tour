"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { team, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(team ? "/dashboard" : "/login");
  }, [ready, team, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ice text-navy">
      <p className="font-display text-2xl uppercase tracking-[0.3em]">Loading race HQ...</p>
    </div>
  );
}
