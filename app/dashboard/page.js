"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BadgeCard from "@/components/BadgeCard";
import CelebrateOverlay from "@/components/CelebrateOverlay";
import RedeemPanel from "@/components/RedeemPanel";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// 🛡️ 完整的静态校园徽章列表（确保 Vault 绝对不会为 0，并且能完美匹配所有关卡）
const STATIC_ALL_BADGES = [
  { id: 1, name: "224 - ENGINEERING BUILDING", description: "Checkpoint at Engineering Building", icon_url: "" },
  { id: 2, name: "REID LIBRARY", description: "Checkpoint at Reid Library", icon_url: "" },
  { id: 3, name: "WINTHROP HALL", description: "Checkpoint at Winthrop Hall", icon_url: "" },
  { id: 4, name: "BUSINESS SCHOOL", description: "Checkpoint at Business School", icon_url: "" },
  { id: 5, name: "SPORTS CENTRE", description: "Checkpoint at Sports Centre", icon_url: "" },
  { id: 6, name: "MCLARTY WING", description: "Checkpoint at McLarty Wing", icon_url: "" },
  { id: 7, name: "STUDENT CENTRAL", description: "Checkpoint at Student Central", icon_url: "" },
  { id: 8, name: "SEABORNE HILTON", description: "Checkpoint at Seaborne Hilton", icon_url: "" }
];

export default function DashboardPage() {
  const { team, ready } = useAuth();
  const router = useRouter();
  
  const [badges, setBadges] = useState(STATIC_ALL_BADGES);
  const [unlocked, setUnlocked] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;

  const loadData = useCallback(async () => {
    setPageError("");

    try {
      // 1. 尝试从数据库拉取动态 badges，如果失败或为空则保留静态全量列表
      const badgeRes = await supabase
        .from("badges")
        .select("id, name, description, icon_url, photo_url, story_text")
        .order("id");

      if (badgeRes.data && badgeRes.data.length > 0) {
        setBadges(badgeRes.data);
      }

      // 2. 独立拉取当前团队真正解锁的记录
      if (teamId) {
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
      console.error("加载解锁状态异常:", err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!ready) return;
    if (!team) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [ready, team, router, loadData]);

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
    const currentList = badges.length > 0 ? badges : STATIC_ALL_BADGES;
    const foundBadge = currentList.find((item) => String(item.id) === String(result.badge_id));
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

  const activeBadges = badges.length > 0 ? badges : STATIC_ALL_BADGES;

  return (
    <AppShell title="UWA College Campus Tour" subtitle="Collect All Badges From every checkpoint">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Badges unlocked</p>
          <p className="mt-1 font-display text-2xl uppercase text-mint">{unlockedCount}</p>
        </div>
        <div className="rounded-3xl bg-[#29327c] p-5 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Mission</p>
          <div className="mt-1 font-display text-lg leading-snug space-y-1">
            <p>Explore the campus AQAP!</p>
            <p>Complete the challenges at Checkpoint!</p>
            <p>Go UWACer!</p>
          </div>
        </div>
      </div>

      <RedeemPanel onRedeem={handleRedeem} />

      {pageError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>}

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">
          Badge Vault ({activeBadges.length})
        </h2>
        
        {loading && <p className="mt-4 text-slate-500">Loading vault...</p>}

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {!loading && activeBadges.map((badge) => {
            const isUnlocked = Boolean(unlocked[String(badge.id)]);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlockedAt={isUnlocked ? unlocked[String(badge.id)] : null}
                onClick={handleBadgeClick}
              />
            );
          })}
        </div>
      </div>

      <CelebrateOverlay
        open={celebration.open}
        badge={celebration.badge}
        allBadges={activeBadges}
        onClose={() => setCelebration({ open: false, badge: null })}
      />
    </AppShell>
  );
}