"use client";

import { LogOut, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AppShell({ children, title, subtitle }) {
  const { team, logout } = useAuth();

  return (
    <div className="min-h-screen bg-ice text-slate-900">
      <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-navy">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold uppercase tracking-wide">
                {team?.name || "Campus Tour"}
              </h1>
              <p className="text-xs text-slate-300">UWA College</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && (
              <h2 className="font-display text-3xl font-extrabold uppercase text-navy">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}