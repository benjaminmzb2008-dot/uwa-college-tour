"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Award, Lock, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [teamName, setTeamName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!teamName.trim() || !accessCode.trim()) {
      setError("Please fill in both Team Name and Passcode.");
      return;
    }

    setError("");
    setLoading(true);

    const res = await login(teamName.trim(), accessCode.trim());
    setLoading(false);

    if (res?.success) {
      router.push("/dashboard");
    } else {
      setError(res?.message || "Invalid team credentials.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ice p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-gold shadow-lg">
            <Award className="h-9 w-9" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold uppercase text-navy tracking-wide">
            UWA College Tour
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Enter your credentials to join the hunt
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Team Alpha"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-900 border border-slate-200 focus:border-navy focus:bg-white focus:outline-none placeholder:text-slate-400 cursor-text transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-900 border border-slate-200 focus:border-navy focus:bg-white focus:outline-none placeholder:text-slate-400 cursor-text transition"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-100">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="gold-btn w-full rounded-2xl py-4 font-extrabold uppercase tracking-widest text-navy shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Verifying..." : "Start Mission"}
          </button>
        </form>
      </div>
    </div>
  );
}