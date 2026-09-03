"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BadgeCard from "@/components/BadgeCard";
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
  
  // 👑 管理员专属状态：保存所有团队及全量解锁数据
  const [allTeams, setAllTeams] = useState([]);
  const [allTeamsUnlocked, setAllTeamsUnlocked] = useState({}); // { teamId: { badgeId: unlocked_at } }

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;
  
  // 🔍 判断当前账号是否为 Admin（可根据你的数据库字段调整，例如 team.is_admin 或 team.role === 'admin' 或名字匹配）
  const isAdmin = Boolean(team?.is_admin || team?.role === 'admin' || team?.name?.toLowerCase() === 'admin');

  const loadData = useCallback(async () => {
    setPageError("");

    try {
      // 1. 拉取徽章基础数据
      const badgeRes = await supabase
        .from("badges")
        .select("id, name, description, icon_url, photo_url, story_text")
        .order("id");

      if (badgeRes.data && badgeRes.data.length > 0) {
        setBadges(badgeRes.data);
      }

      if (isAdmin) {
        // 👑 如果是管理员：拉取所有团队及所有团队的解锁记录
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
        // 🛡️ 普通团队：只拉取当前团队的解锁记录
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

  function handleBadgeClick(badge) {
    setCelebration({ open: true, badge });
  }

  if (!ready || !team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice">
        <p className="font-display text-2xl uppercase tracking-[0.3em] text-[#29327c]">Loading team HQ...</p>
      </div>
    );
  }

  return (
    <AppShell title={isAdmin ? "Admin Overview: All Teams" : "UWA College Campus Tour"} subtitle={isAdmin ? "Monitor badge progress across all campus teams" : "Collect All Badges From every checkpoint"}>
      
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
              <p>Viewing Admin Dashboard mode.</p>
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

      {/* 普通用户才显示兑换面板，Admin 可以选择不显示或保留 */}
      {!isAdmin && <RedeemPanel onRedeem={handleRedeem} />}

      {pageError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>}

      {/* 👑 管理员专属视图：展示所有团队及其解锁情况 */}
      {isAdmin ? (
        <div className="mt-8 space-y-8">
          <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
            All Teams Progress ({allTeams.length})
          </h2>

          {loading && <p className="text-slate-500">Loading all teams data...</p>}

          {!loading && allTeams.length === 0 && (
            <p className="text-sm text-slate-400">No teams found in the database.</p>
          )}

          {allTeams.map((t) => {
            const teamUnlocks = allTeamsUnlocked[t.id] || {};
            const teamUnlockedList = activeBadges.filter((b) => Boolean(teamUnlocks[String(b.id)]));

            return (
              <div key={t.id} className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#29327c] uppercase">
                      {t.name || `Team ID: ${t.id}`}
                    </h3>
                    <p className="text-xs text-slate-400">Team ID: {t.id}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint uppercase">
                    Unlocked: {teamUnlockedList.length} / {activeBadges.length}
                  </span>
                </div>

                {/* 该团队解锁的徽章列表 */}
                <div className="mt-4">
                  {teamUnlockedList.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No badges unlocked by this team yet.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {teamUnlockedList.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          unlockedAt={teamUnlocks[String(badge.id)]}
                          onClick={handleBadgeClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 🛡️ 普通团队视图：只展示当前团队已解锁的徽章 */
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
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlockedAt={unlocked[String(badge.id)]}
                onClick={handleBadgeClick}
              />
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