"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BadgeCard from "@/components/BadgeCard";
import CelebrateOverlay from "@/components/CelebrateOverlay";
import RedeemPanel from "@/components/RedeemPanel";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// 🛡️ 预设的备用徽章列表（防止数据库表未填充或RLS策略阻拦时页面一片空白）
const FALLBACK_BADGES = [
  { id: 1, name: "224 - ENGINEERING BUILDING", description: "Checkpoint at Engineering Building", icon_url: "" },
  { id: 2, name: "REID LIBRARY", description: "Checkpoint at Reid Library", icon_url: "" },
  { id: 3, name: "WINTHROP HALL", description: "Checkpoint at Winthrop Hall", icon_url: "" },
  { id: 4, name: "BUSINESS SCHOOL", description: "Checkpoint at Business School", icon_url: "" },
  { id: 5, name: "SPORTS CENTRE", description: "Checkpoint at Sports Centre", icon_url: "" },
  { id: 6, name: "MCLARTY WING", description: "Checkpoint at McLarty Wing", icon_url: "" }
];

export default function DashboardPage() {
  const { team, ready } = useAuth();
  const router = useRouter();
  
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState({});
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;

  const loadData = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return [];
    }
    setPageError("");

    try {
      // 同时查询全局 badges 和当前团队已解锁的记录
      const [badgeRes, unlockRes] = await Promise.all([
        supabase
          .from("badges")
          .select("id, name, description, icon_url, photo_url, story_text")
          .order("id"),
        supabase.from("team_badges").select("badge_id, unlocked_at").eq("team_id", teamId),
      ]);

      let badgeRows = badgeRes.data;
      const badgeError = badgeRes.error;
      const unlockRows = unlockRes.data;
      const unlockError = unlockRes.error;

      if (badgeError) {
        console.warn("读取 badges 表失败，使用预设备用数据:", badgeError);
      }
      if (unlockError) {
        console.error("加载团队已解锁徽章出错:", unlockError);
      }

      // 如果数据库 badges 表查出来为空或报错，自动启用预设数据兜底
      const finalBadges = (badgeRows && badgeRows.length > 0) ? badgeRows : FALLBACK_BADGES;
      setBadges(finalBadges);
      
      const map = {};
      (unlockRows || []).forEach((row) => {
        const bId = row?.badge_id;
        const uAt = row?.unlocked_at;
        if (bId != null) {
          map[String(bId)] = uAt || true;
        }
      });
      setUnlocked(map);
      
      return finalBadges;
    } catch (err) {
      console.error("loadData 发生异常:", err);
      setBadges(FALLBACK_BADGES);
      return FALLBACK_BADGES;
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

  const unlockedCount = useMemo(() => {
    return Object.keys(unlocked).length;
  }, [unlocked]);

  async function handleRedeem(codeText) {
    if (!teamId) return { success: false, message: "Team ID not found." };
    setRedeeming(true);
    
    const { data, error } = await supabase.rpc("redeem_badge_code", {
      p_team_id: teamId,
      p_code_text: codeText,
    });
    setRedeeming(false);

    if (error) {
      return {
        success: false,
        message: "The code could not be processed. Check your connection and try again.",
      };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    if (!result?.success) {
      return {
        success: false,
        message: result?.message || "This code is invalid, already used, or not ready yet.",
      };
    }

    const latestBadges = await loadData();
    const currentBadgeList = latestBadges?.length > 0 ? latestBadges : badges;
    
    const foundBadge = currentBadgeList.find(
      (item) => String(item.id) === String(result.badge_id)
    );

    const badgeToCelebrate = foundBadge || {
      id: result.badge_id,
      name: result?.badge_name,
      icon_url: result?.icon_url || "",
    };

    setCelebration({ open: true, badge: badgeToCelebrate });
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
    <AppShell 
      title="UWA College Campus Tour" 
      subtitle="Collect All Badges From every checkpoint"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Badges unlocked</p>
          <p className="mt-1 font-display text-2xl uppercase text-mint">
            {unlockedCount}
          </p>
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

      <RedeemPanel onRedeem={handleRedeem} loading={redeeming} />

      {pageError && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>
      )}

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold uppercase text-[#29327c]">Badge Vault</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              Loading vault...
            </div>
          )}
          {!loading &&
            badges.map((badge) => {
              const isUnlocked = Boolean(unlocked[String(badge.id)]);
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlockedAt={isUnlocked ? (unlocked[String(badge.id)] || true) : null}
                  onClick={handleBadgeClick}
                />
              );
            })}
        </div>
      </div>

      <CelebrateOverlay
        open={celebration.open}
        badge={celebration.badge}
        allBadges={badges}
        onClose={() => setCelebration({ open: false, badge: null })}
      />
    </AppShell>
  );
}