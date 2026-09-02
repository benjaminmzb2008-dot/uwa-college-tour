"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Leaderboard from "@/components/Leaderboard";
import RedeemLog from "@/components/RedeemLog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const { team, ready, isAdmin } = useAuth();
  const router = useRouter();
  const [rankedTeams, setRankedTeams] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    setError("");
    const [{ data: teams, error: teamsError }, { data: unlocks, error: unlockError }, { data: codes, error: codesError }] =
      await Promise.all([
        supabase.from("teams").select("id, team_name, is_admin").eq("is_admin", false),
        supabase.from("team_badges").select("team_id, badge_id, unlocked_at"),
        supabase
          .from("codes")
          .select("id, code_text, used_by_team_id, used_at, is_used")
          .eq("is_used", true)
          .order("used_at", { ascending: false })
          .limit(20),
      ]);

    if (teamsError || unlockError || codesError) {
      setError("Race Control could not load live data. Refresh to try again.");
      setLoading(false);
      return;
    }

    const teamNameById = Object.fromEntries((teams || []).map((item) => [item.id, item.team_name]));
    const stats = {};
    (teams || []).forEach((item) => {
      stats[item.id] = { id: item.id, team_name: item.team_name, badgeCount: 0, latestUnlock: null };
    });
    (unlocks || []).forEach((row) => {
      if (!stats[row.team_id]) return;
      stats[row.team_id].badgeCount += 1;
      if (!stats[row.team_id].latestUnlock || row.unlocked_at > stats[row.team_id].latestUnlock) {
        stats[row.team_id].latestUnlock = row.unlocked_at;
      }
    });

    const ranked = Object.values(stats).sort((a, b) => {
      if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
      if (!a.latestUnlock) return 1;
      if (!b.latestUnlock) return -1;
      return new Date(a.latestUnlock) - new Date(b.latestUnlock);
    });

    setRankedTeams(ranked);
    setLogs(
      (codes || []).map((row) => ({
        ...row,
        team_name: teamNameById[row.used_by_team_id],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!team) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    loadAdminData();

    const channel = supabase
      .channel("race-control")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_badges" }, loadAdminData)
      .on("postgres_changes", { event: "*", schema: "public", table: "codes" }, loadAdminData)
      .subscribe();

    const interval = setInterval(loadAdminData, 12000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [ready, team, isAdmin, router, loadAdminData]);

  if (!ready || !team || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice">
        <p className="font-display text-2xl uppercase tracking-[0.3em] text-navy">Checking race control access...</p>
      </div>
    );
  }

  return (
    <AppShell title="Race Control" subtitle="Admin live board">
      {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Leaderboard teams={rankedTeams} />
          <RedeemLog logs={logs} />
        </div>
      )}
    </AppShell>
  );
}
