"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
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
      const [badgeRes, unlockRes] = await Promise.all([
        supabase.from("badges").select("*").order("id"),
        supabase.from("team_badges").select("badge_id, unlocked_at").eq("team_id", teamId),
      ]);

      const badgeRows = badgeRes.data || [];
      const unlockRows = unlockRes.data || [];

      setBadges(badgeRows);
      
      const map = {};
      unlockRows.forEach((row) => {
        if (row?.badge_id != null) {
          map[String(row.badge_id)] = row.unlocked_at || true;
        }
      });
      setUnlocked(map);
      return badgeRows;
    } catch (err) {
      console.error("加载数据异常:", err);
      setPageError("Failed to load data.");
      return [];
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
    setCelebration({ open: true, badge: { id: result.badge_id, name: result?.badge_name, icon_url: result?.icon_url } });
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
          Badge Vault (总数: {badges.length})
        </h2>
        
        {loading && <p className="mt-4 text-slate-500">Loading vault...</p>}

        {/* 💡 暂时绕过 BadgeCard 组件，直接用原生 HTML 渲染，看它出不出内容 */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {!loading && badges.map((badge) => {
            const isUnlocked = Boolean(unlocked[String(badge.id)]);
            return (
              <div 
                key={badge.id}
                onClick={() => setCelebration({ open: true, badge })}
                className={`p-6 rounded-3xl border transition cursor-pointer bg-white shadow-sm hover:shadow-md ${
                  isUnlocked ? "border-mint ring-2 ring-mint/20" : "border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    ID: {badge.id}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isUnlocked ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#29327c] truncate">{badge.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{badge.description || "Campus Checkpoint"}</p>
              </div>
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