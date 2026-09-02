"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function RedeemPanel({ onRedeem, loading }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) {
      setError("Enter a checkpoint code before submitting.");
      return;
    }
    setError("");
    const result = await onRedeem(value);
    if (result?.success) {
      setCode("");
    } else if (result?.message) {
      setError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-extrabold uppercase text-navy">Enter code to redeem</h3>
          <p className="text-sm text-slate-500">Type the hidden code from your current station.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="BDG-XXXX-1234"
          autoComplete="off"
          className="w-full rounded-2xl bg-slate-50 px-4 py-4 font-mono text-lg font-bold uppercase tracking-[0.18em] text-slate-900 border border-slate-200 focus:border-navy focus:bg-white focus:outline-none cursor-text placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="gold-btn min-w-40 rounded-2xl px-6 py-4 font-extrabold uppercase tracking-widest text-navy cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          {loading ? "Checking..." : "Redeem"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-100">{error}</p>
      )}
    </form>
  );
}