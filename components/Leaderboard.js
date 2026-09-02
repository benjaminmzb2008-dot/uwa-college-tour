"use client";

import { Trophy } from "lucide-react";

function formatTime(iso) {
  if (!iso) return "No badges yet";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Leaderboard({ teams }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-navy">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-extrabold uppercase">Live leaderboard</h3>
          <p className="text-sm text-slate-500">Ranked by badges collected, then latest unlock.</p>
        </div>
      </div>
      <div className="space-y-3">
        {teams.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No team progress has been recorded yet.
          </p>
        )}
        {teams.map((team, index) => (
          <div
            key={team.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-ice px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-lg font-extrabold ${
                  index === 0 ? "bg-gold text-navy" : "bg-navy text-white"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="font-display text-lg uppercase leading-none">{team.team_name}</p>
                <p className="mt-1 text-xs text-slate-500">{formatTime(team.latestUnlock)}</p>
              </div>
            </div>
            <p className="font-display text-2xl font-extrabold text-mint">
              {team.badgeCount}
              <span className="ml-1 text-xs uppercase tracking-wider text-slate-400">badges</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
