"use client";

export default function BadgeCard({ badge, unlockedAt, onClick }) {
  const isUnlocked = Boolean(unlockedAt);

  return (
    <div
      onClick={() => onClick(badge)}
      className={`group relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border-2 ${
        isUnlocked ? "border-mint/30" : "border-slate-100"
      }`}
    >
      {/* 顶部状态与大号圆形图标 */}
      <div className="flex items-start justify-between">
        {/* 放大且变成圆形的 Icon 区域 */}
        <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md transition-transform duration-300 group-hover:scale-105 ${
          isUnlocked ? "bg-[#29327c]" : "bg-slate-100 grayscale opacity-70"
        }`}>
          {badge.icon_url ? (
            <img
              src={badge.icon_url}
              alt={badge.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl">🏆</span>
          )}
        </div>

        {/* 解锁状态标签 */}
        <div className="flex items-center gap-1.5">
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint"></span>
              Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              🔒 Locked
            </span>
          )}
        </div>
      </div>

      {/* 文本信息 */}
      <div className="mt-5">
        <h3 className="font-display text-lg font-extrabold uppercase text-[#29327c] line-clamp-1">
          {badge.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {badge.description}
        </p>
      </div>

      {/* 底部引导 */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#29327c]">
        <span>Click to view story</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
}