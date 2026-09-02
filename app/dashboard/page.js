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

  const loadData = useCallback(async () => {
    if (!team?.id) return;
    setPageError("");

    const [{ data: badgeRows, error: badgeError }, { data: unlockRows, error: unlockError }] =
      await Promise.all([
        supabase
          .from("badges")
          .select("id, name, description, icon_url, photo_url, story_text")
          .order("id"),
        supabase.from("team_badges").select("badge_id, unlocked_at").eq("team_id", team.id),
      ]);

    if (badgeError || unlockError) {
      setPageError("Could not load badges. Please refresh and try again.");
      setLoading(false);
      return;
    }

    setBadges(badgeRows || []);
    const map = {};
    (unlockRows || []).forEach((row) => {
      map[row.badge_id] = row.unlocked_at;
    });
    setUnlocked(map);
    setLoading(false);
    return badgeRows || [];
  }, [team?.id]);

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
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_badge_code", {
      p_team_id: team.id,
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
    const badge = currentBadgeList.find((item) => item.id === result.badge_id);

    setCelebration({ open: true, badge: badge || { name: result?.badge_name } });
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
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-white shadow-card" />
            ))}
          {!loading &&
            badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlockedAt={unlocked[badge.id]}
                onClick={handleBadgeClick}
              />
            ))}
        </div>
      </div>

      <CelebrateOverlay
        open={celebration.open}
        badge={celebration.badge}
        onClose={() => setCelebration({ open: false, badge: null })}
      />
    </AppShell>
  );
}