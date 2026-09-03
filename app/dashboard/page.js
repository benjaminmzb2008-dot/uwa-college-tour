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
  
  // 👑 管理员专属状态
  const [allTeams, setAllTeams] = useState([]);
  const [allTeamsUnlocked, setAllTeamsUnlocked] = useState({}); // { teamId: { badgeId: unlocked_at } }

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;
  
  // 🔍 判定是否为 Admin
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
        const teamsRes = await supabase.from("teams").select("*").order("name");
        if (teamsRes.data) {
          setAllTeams(teamsRes.data);
        }

        const allUnlocksRes = await supabase.from("team_badges").select("team_id, badge_id, unlocked_at");
        if (allUnlocksRes.data) {
          const map = {};
          allUnlocksRes.data.forEach((row) => {
            if (row?.team_id && row?.badge_id != null) {
              if (!map[row.team_id]) {
                map[row.team_id] = {};
              }
              map[row.team_id][String(row.badge_id)] = row.unlocked_at || true;
            }
          });
          setAllTeamsUnlocked(map);
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

  // 普通团队视角下只显示已解锁的 badge
  const unlockedBadges = useMemo(() => {
    return activeBadges.filter((badge) => Boolean(unlocked[String(badge.id)]));
  }, [activeBadges, unlocked]);

  const unlockedCount = useMemo(() => Object.keys(unlocked).length, [unlocked]);

  // 👑 管理员视角：对所有团队按解锁数量降序排序（第一名排最前）
  const rankedTeams = useMemo(() => {
    if (!isAdmin) return [];
    return [...allTeams].sort((a, b) => {
      const aUnlocks = Object.keys(allTeamsUnlocked[a.id] || {}).length;
      const bUnlocks = Object.keys(allTeamsUnlocked[b.id] || {}).length;
      return bUnlocks - aUnlocks; // 降序：解得越多的排越前面
    });
  }, [allTeams, allTeamsUnlocked, isAdmin]);

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
      
      {/* 顶部统计面板 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {isAdmin ? "Total Teams Registered" : "Badges unlocked"}
          </p>
          <p className="mt-1 font-display text-2xl uppercase text-mint">
            {isAdmin ? allTeams.length : unlockedCount}
          </p>
        </div>
        <div className="rounded-3xl bg-[#29327c] p-5 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Mission</p>
          <div className="mt-1 font-display text-lg leading-snug space-y-1">
            {isAdmin ? (
              <p>Admin Leaderboard Active — Top team is ranked #1</p>
            ) : (
              <>
                <p>Explore the campus AQAP!</p>
                <p>Complete the challenges at Checkpoint!</p>
                <p>Go UWACer!</p>
              </>
            )}
          </div>
        </div>
      </div>

      {!isAdmin && <RedeemPanel onRedeem={handleRedeem} />}

      {pageError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>}

      {/* 👑 管理员专属：一眼看清所有组解锁情况的矩阵排行榜 */}
      {isAdmin ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
              Team Progress Matrix & Leaderboard
            </h2>
          </div>

          {loading && <p className="text-slate-500">Loading matrix...</p>}

          {!loading && allTeams.length === 0 && (
            <p className="text-sm text-slate-400">No teams found in the database.</p>
          )}

          {!loading && allTeams.length > 0 && (
            <div className="overflow-x-auto rounded-3xl bg-white p-6 shadow-card border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Rank & Team</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    {activeBadges.map((badge, idx) => (
                      <th key={badge.id} className="py-3 px-2 text-center" title={badge.name}>
                        <div className="flex flex-col items-center gap-1">
                          {badge.icon_url ? (
                            <img src={badge.icon_url} alt="" className="h-8 w-8 rounded-full object-cover shadow-sm" />
                          ) : (
                            <span className="text-base">🏆</span>
                          )}
                          <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rankedTeams.map((t, index) => {
                    const teamUnlocks = allTeamsUnlocked[t.id] || {};
                    const score = Object.keys(teamUnlocks).length;
                    const isFirst = index === 0 && score > 0;

                    return (
                      <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isFirst ? 'bg-amber-50/40' : ''}`}>
                        {/* 团队名称与排名 */}
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
                                {t.name || `Team ${t.id}`}
                                {isFirst && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">👑 Leader</span>}
                              </p>
                              <p className="text-xs text-slate-400">ID: {t.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* 总得分 */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-display font-bold text-mint text-lg">
                            {score} <span className="text-xs text-slate-400 font-normal">/ {activeBadges.length}</span>
                          </span>
                        </td>

                        {/* 各个 Badge 的解锁打钩状态 */}
                        {activeBadges.map((badge) => {
                          const isUnlocked = Boolean(teamUnlocks[String(badge.id)]);
                          return (
                            <td key={badge.id} className="py-4 px-2 text-center">
                              {isUnlocked ? (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-mint/15 text-mint font-bold shadow-sm" title="Unlocked">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-300 text-xs" title="Locked">
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
        /* 🛡️ 普通团队视角 */
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