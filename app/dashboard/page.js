"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BadgeCard from "@/components/BadgeCard";
import CelebrateOverlay from "@/components/CelebrateOverlay";
import RedeemPanel from "@/components/RedeemPanel";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { team, ready } = useAuth();
  const router = useRouter();
  
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState({});
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  // 兼容所有可能的团队ID字段（id / team_id / uuid）
  const teamId = team?.id || team?.team_id || team?.uuid;

  const loadData = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return [];
    }
    setPageError("");

    try {
      // 并行请求所有勋章与该团队已解锁的勋章
      const [{ data: badgeRows, error: badgeError }, { data: unlockRows, error: unlockError }] =
        await Promise.all([
          supabase
            .from("badges")
            .select("id, name, description, icon_url, photo_url, story_text")
            .order("id"),
          supabase.from("team_badges").select("badge_id, unlocked_at").eq("team_id", teamId),
        ]);

      if (badgeError) {
        console.error("加载徽章列表出错:", badgeError);
      }
      if (unlockError) {
        console.error("加载团队已解锁徽章出错:", unlockError);
      }

      const allBadges = badgeRows || [];
      setBadges(allBadges);
      
      // 构建解锁字典（统一转为字符串键，确保精准点亮）
      const map = {};
      (unlockRows || []).forEach((row) => {
        const bId = row?.badge_id;
        const uAt = row?.unlocked_at;
        if (bId != null) {
          map[String(bId)] = uAt || true;
        }
      });
      setUnlocked(map);
      
      return allBadges;
    } catch (err) {
      console.error("loadData 发生未知异常:", err);
      setPageError("Failed to load badge data.");
      return [];
    } finally {
      // 无论成功还是失败，强制关闭 loading，绝不卡死
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

  // 计算已解锁数量
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

    // 兑换成功后立刻重新加载数据刷新状态
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
          {!loading && badges.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              No badges available in the system yet.
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