const STORAGE_KEY = "amazing-race-team";

export function getStoredTeam() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredTeam(team) {
  if (typeof window === "undefined") return;
  const session = {
    id: team.id,
    username: team.username,
    team_name: team.team_name,
    is_admin: Boolean(team.is_admin),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  // 区分开发环境和生产环境，生产环境下添加 Secure 标记
  const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `amazing_race_team=${encodeURIComponent(
    session.id
  )}; path=/; max-age=${60 * 60 * 12}; SameSite=Lax${isSecure}`;
}

export function clearStoredTeam() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  
  // 清除 Cookie 时也要保持 path 和 SameSite 一致
  document.cookie = "amazing_race_team=; path=/; max-age=0; SameSite=Lax";
}
