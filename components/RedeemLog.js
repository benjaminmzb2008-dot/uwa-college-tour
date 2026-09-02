"use client";

import { ScrollText } from "lucide-react";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function RedeemLog({ logs }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-extrabold uppercase">Redemption log</h3>
          <p className="text-sm text-slate-500">Most recently activated codes across all teams.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Activated</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No codes have been redeemed yet.
                </td>
              </tr>
            )}
            {logs.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-3 font-mono uppercase tracking-wider text-navy">{row.code_text}</td>
                <td className="px-3 py-3 font-semibold">{row.team_name || "Unknown team"}</td>
                <td className="px-3 py-3 text-slate-500">{formatTime(row.used_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
