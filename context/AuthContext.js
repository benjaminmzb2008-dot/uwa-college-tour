"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearStoredTeam, getStoredTeam, saveStoredTeam } from "@/lib/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTeam(getStoredTeam());
    setReady(true);
  }, []);

  async function login(username, password) {
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, message: "Please enter both username and password." };
    }

    const { data, error } = await supabase
      .from("teams")
      .select("id, username, team_name, is_admin")
      .eq("username", trimmedUser)
      .eq("password", trimmedPass)
      .maybeSingle();

    if (error) {
	console.error("Supabase Login Error:", error);
      return {
        success: false,
        message: "Unable to reach the race server. Please try again.",
      };
    }

    if (!data) {
      return { success: false, message: "Invalid username or password." };
    }

    saveStoredTeam(data);
    setTeam(data);
    return { success: true, team: data };
  }

  function logout() {
    clearStoredTeam();
    setTeam(null);
    router.push("/login");
  }

  const value = useMemo(
    () => ({ team, ready, login, logout, isAdmin: Boolean(team?.is_admin) }),
    [team, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
