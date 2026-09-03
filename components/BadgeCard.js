"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BadgeCard from "@/components/BadgeCard";
import CelebrateOverlay from "@/components/CelebrateOverlay";
import RedeemPanel from "@/components/RedeemPanel";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [celebration, setCelebration] = useState({ open: false, badge: null });

  const teamId = team?.id || team?.team_id || team?.uuid;

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
  const activeBadges = badges.length > 0 ? badges : STATIC_ALL_BADGES;

  // 🛡️ 仅过滤并显示已解锁的徽章
  const unlockedBadges = useMemo(() => {
    return activeBadges.filter((badge) => Boolean(unlocked[String(badge.id)]));
  }, [activeBadges, unlocked]);

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
          Badge Vault ({unlockedBadges.length})
        </h2>
        
        {loading && <p className="mt-4 text-slate-500">Loading vault...</p>}

        {!loading && unlockedBadges.length === 0 && (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-card">
            <p className="text-slate-400 font-medium">No badges collected yet. Enter a code above to unlock your first checkpoint!</p>
          </div>
        )}

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {!loading && unlockedBadges.map((badge) => {
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