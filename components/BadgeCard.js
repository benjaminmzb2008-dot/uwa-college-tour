"use client";

import { CheckCircle2, Lock } from "lucide-react";

export default function BadgeCard({ badge, unlockedAt, onClick }) {
  const isUnlocked = Boolean(unlockedAt);

  return (
    <div
      onClick={() => isUnlocked && onClick && onClick(badge)}
      className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 ${
        isUnlocked
          ? "bg-white shadow-card hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          : "bg-slate-100/70 border border-slate-200 opacity-70 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 ${
            isUnlocked
              ? "bg-[#29327c] text-gold group-hover:scale-110"
              : "bg-slate-200 text-slate-400"
          }`}
        >
          {badge.icon_url ? (
            <img src={badge.icon_url} alt={badge.name} className="h-8 w-8 object-contain" />
          ) : (
            "🏆"
          )}
        </div>
        <div>
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mint">
              <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Lock className="h-3.5 w-3.5" /> Locked
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
          {badge.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {badge.description || "Locked checkpoint badge."}
        </p>
      </div>

      {isUnlocked && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-400">
          <span>Click to view story</span>
          <span className="text-[#29327c] font-bold">→</span>
        </div>
      )}
    </div>
  );
}