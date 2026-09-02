"use client";

import { X, Sparkles } from "lucide-react";

export default function CelebrateOverlay({ open, badge, onClose, allBadges = [] }) {
  if (!open || !badge) return null;

  let iconSrc = badge.icon_url || badge.iconUrl;
  
  if (!iconSrc && allBadges.length > 0) {
    const matched = allBadges.find(b => 
      String(b.id) === String(badge.id || badge.badge_id) || 
      (badge.name && b.name && b.name.trim().toLowerCase() === badge.name.trim().toLowerCase())
    );
    if (matched) {
      iconSrc = matched.icon_url;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        
        <div className="bg-[#29327c] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Station Unlocked
          </div>
          
          {/* 放大尺寸并改成完美的圆形展示 (rounded-full) */}
          <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white p-3 shadow-lg overflow-hidden border-4 border-white/20">
            {iconSrc ? (
              <img src={iconSrc} alt={badge.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl">🏆</span>
            )}
          </div>

          <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide">
            {badge.name}
          </h3>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-slate-600 text-sm">
            {badge.story_text || badge.description || "Congratulations on reaching this checkpoint!"}
          </p>

          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-[#f4c430] py-4 font-extrabold uppercase tracking-widest text-[#29327c] shadow-md hover:shadow-lg transition cursor-pointer"
          >
            Awesome!
          </button>
        </div>

      </div>
    </div>
  );
}