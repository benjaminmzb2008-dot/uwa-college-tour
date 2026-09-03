"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import CelebrateOverlay from "@/components/CelebrateOverlay";
import RedeemPanel from "@/components/RedeemPanel";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// 🛡️ 所有的校园徽章静态列表
const STATIC_ALL_BADGES = [
  { 
    id: 1, 
    name: "347 - Psychology Building", 
    description: "Checkpoint at Psychology Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/psychology.png" 
  },
  { 
    id: 2, 
    name: "446 - Barry J Marshall Library", 
    description: "Checkpoint at Barry J Marshall Library", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/barry%20j.png" 
  },
  { 
    id: 3, 
    name: "227 - Sanders Building", 
    description: "Checkpoint at Sanders Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/sender.png" 
  },
  { 
    id: 4, 
    name: "235 - General Purpose Building 3", 
    description: "Checkpoint at General Purpose Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/gpb.png" 
  },
  { 
    id: 5, 
    name: "275 - Ezone Central", 
    description: "Checkpoint at Ezone", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/ezone.png" 
  },
  { 
    id: 6, 
    name: "224 - Engineering Building", 
    description: "Checkpoint at Engineering Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/engineering.png" 
  },
  { 
    id: 7, 
    name: "274 - Irwin Street Building", 
    description: "Checkpoint at Irwin Street Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/irwin.png" 
  },
  { 
    id: 8, 
    name: "106 - Arts Building", 
    description: "Checkpoint at Arts Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/art.png" 
  },
  { 
    id: 9, 
    name: "139 - Reid Library", 
    description: "Checkpoint at Reid Library", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/reid.png" 
  },
  { 
    id: 10, 
    name: "101 - Winthrop Hall", 
    description: "Checkpoint at Winthrop Hall", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/winthrop.png" 
  },
  { 
    id: 11, 
    name: "245 - Physics Building", 
    description: "Checkpoint at Physics Building", 
    icon_url: "https://mgpqlklkepmdycqkwqdn.supabase.co/storage/v1/object/public/campus%20tour/physics.png" 
  }
];

export default function DashboardPage() {
  const { team, ready } = useAuth();
  const router = useRouter();
  
  const [badges, setBadges] = useState(STATIC_ALL_BADGES);
  const [unlocked, setUnlocked] = useState({});
  const [teamRows, setTeamRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;
  const isAdmin = Boolean(team?.is_admin || team?.role === 'admin' || team?.name?.toLowerCase() === 'admin');

  const loadData = useCallback(async () => {
    setPageError("");

    try {
      const badgeRes = await supabase
        .from("badges")
        .select("id, name, description, icon_url, photo_url, story_text")
        .order("id");

      if (badgeRes.data && badgeRes.data.length > 0) {
        setBadges(badgeRes.data);
      }

      if (isAdmin) {
        const allUnlocksRes = await supabase.from("team_badges").select("team_id, team_name, badge_id, unlocked_at");
        if (allUnlocksRes.data) {
          setTeamRows(allUnlocksRes.data);
        }
      } else if (teamId) {
        const unlockRes = await supabase
          .from("team_badges")
          .select("badge_id, unlocked_at")
          .eq("team_id", teamId);

        const unlockRows = unlockRes.data || [];
        const map = {};
        unlockRows.forEach((row) => {
          if (row?.badge_id != null) {
            map[String(row.badge_id)] = row.unlocked_at || true;
          }
        });
        setUnlocked(map);
      }
    } catch (err) {
      console.error("加载数据异常:", err);
      setPageError("Failed to load badge data.");
    } finally {
      setLoading(false);
    }
  }, [teamId, isAdmin]);

  useEffect(() => {
    if (!ready) return;
    if (!team) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [ready, team, router, loadData]);

  const activeBadges = badges.length > 0 ? badges : STATIC_ALL_BADGES;

  const unlockedBadges = useMemo(() => {
    return activeBadges.filter((badge) => Boolean(unlocked[String(badge.id)]));
  }, [activeBadges, unlocked]);

  const unlockedCount = useMemo(() => Object.keys(unlocked).length, [unlocked]);

  const rankedTeams = useMemo(() => {
    if (!isAdmin) return [];
    const map = {};

    teamRows.forEach((row) => {
      const tName = row.team_name || row.team_id || "Unknown Team";
      if (!map[tName]) {
        map[tName] = {
          team_id: row.team_id,
          team_name: tName,
          badges: {}
        };
      }
      if (row.badge_id != null) {
        map[tName].badges[String(row.badge_id)] = row.unlocked_at || true;
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => {
      const aCount = Object.keys(a.badges).length;
      const bCount = Object.keys(b.badges).length;
      return bCount - aCount;
    });

    return list;
  }, [teamRows, isAdmin]);

  async function handleRedeem(codeText) {
    if (!teamId) return { success: false, message: "Team ID not found." };
    const { data, error } = await supabase.rpc("redeem_badge_code", {
      p_team_id: teamId,
      p_code_text: codeText,
    });

    if (error) {
      return { success: false, message: "Processing error." };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    if (!result?.success) {
      return { success: false, message: result?.message || "Invalid code." };
    }

    await loadData();
    const foundBadge = activeBadges.find((item) => String(item.id) === String(result.badge_id));
    setCelebration({ 
      open: true, 
      badge: foundBadge || { id: result.badge_id, name: result?.badge_name, icon_url: result?.icon_url } 
    });
    return { success: true };
  }

  if (!ready || !team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice">
        <p className="font-display text-2xl uppercase tracking-[0.3em] text-[#29327c]">Loading team HQ...</p>
      </div>
    );
  }

  return (
    <AppShell 
      title={isAdmin ? "Admin Leaderboard & Matrix" : "UWA College Campus Tour"} 
      subtitle={isAdmin ? "Overview of all teams and badge progress matrix" : "Collect All Badges From every checkpoint"}
    >
      
      <div className={`mb-6 grid gap-4 ${isAdmin ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {isAdmin ? "Total Active Teams" : "Badges unlocked"}
          </p>
          <p className="mt-1 font-display text-2xl uppercase text-mint">
            {isAdmin ? rankedTeams.length : unlockedCount}
          </p>
        </div>
        {!isAdmin && (
          <div className="rounded-3xl bg-[#29327c] p-5 text-white shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Mission</p>
            <div className="mt-1 font-display text-lg leading-snug space-y-1">
              <p>Explore the campus AQAP!</p>
              <p>Complete the challenges at Checkpoint!</p>
              <p>Go UWACer!</p>
            </div>
          </div>
        )}
      </div>

      {!isAdmin && <RedeemPanel onRedeem={handleRedeem} />}

      {pageError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>}

      {isAdmin ? (
        <div className="mt-8 space-y-6">
          <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
            Leaderboard
          </h2>

          {loading && <p className="text-slate-500">Loading matrix...</p>}

          {!loading && rankedTeams.length === 0 && (
            <p className="text-sm text-slate-400">No teams have unlocked any badges yet.</p>
          )}

          {!loading && rankedTeams.length > 0 && (
            <div className="overflow-x-auto rounded-3xl bg-white p-6 shadow-card border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Rank & Team</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    {activeBadges.map((badge, idx) => (
                      <th key={badge.id} className="py-3 px-4 text-center" title={badge.name}>
                        <div className="flex flex-col items-center gap-2">
                          {badge.icon_url ? (
                            <div className="h-24 w-24 aspect-square shrink-0 overflow-hidden rounded-full">
                              <img src={badge.icon_url} alt="" className="h-full w-full object-cover block" />
                            </div>
                          ) : (
                            <span className="text-2xl">🏆</span>
                          )}
                          <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rankedTeams.map((t, index) => {
                    const score = Object.keys(t.badges).length;
                    const isFirst = index === 0 && score > 0;

                    return (
                      <tr key={t.team_id || t.team_name} className={`hover:bg-slate-50/80 transition-colors ${isFirst ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0 ? 'bg-gold text-white shadow-sm' : 
                              index === 1 ? 'bg-slate-300 text-white' : 
                              index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-display font-bold text-[#29327c] text-base flex items-center gap-2">
                                {t.team_name}
                                {isFirst && <span>👑</span>}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-display font-bold text-mint text-lg">
                            {score} <span className="text-xs text-slate-400 font-normal">/ {activeBadges.length}</span>
                          </span>
                        </td>

                        {activeBadges.map((badge) => {
                          const isUnlocked = Boolean(t.badges[String(badge.id)]);
                          return (
                            <td key={badge.id} className="py-4 px-4 text-center align-middle">
                              {isUnlocked ? (
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-mint/15 text-mint font-bold shadow-sm text-sm" title="Unlocked">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-300 text-sm" title="Locked">
                                  ·
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
            Badge Vault ({unlockedBadges.length})
          </h2>
          
          {loading && <p className="mt-4 text-slate-500">Loading vault...</p>}

          {!loading && unlockedBadges.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">No badges unlocked yet. Enter a code above to collect your first badge!</p>
          )}

          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {!loading && unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setCelebration({ open: true, badge })}
                className="group relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border-2 border-mint/30"
              >
                <div className="flex items-start justify-between">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#29327c] shadow-md transition-transform duration-300 group-hover:scale-105">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">🏆</span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mint">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint"></span>
                    Unlocked
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-lg font-extrabold uppercase text-[#29327c] line-clamp-1">{badge.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{badge.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#29327c]">
                  <span>Click to view story</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CelebrateOverlay
        open={celebration.open}
        badge={celebration.badge}
        allBadges={activeBadges}
        onClose={() => setCelebration({ open: false, badge: null })}
      />
    </AppShell>
  );
}