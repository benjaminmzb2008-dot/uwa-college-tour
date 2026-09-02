"use client";

import { X, Sparkles } from "lucide-react";

export default function CelebrateOverlay({ open, badge, onClose }) {
  if (!open || !badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        
        {/* 顶部标题栏 */}
        <div className="bg-navy p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Station Unlocked
          </div>
          
          {/* 动态显示图标 */}
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-inner">
            {badge.icon_url ? (
              <img src={badge.icon_url} alt={badge.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-4xl">🏆</span>
            )}
          </div>

          <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide">
            {badge.name}
          </h3>
        </div>

        {/* 内容区域 */}
        <div className="p-6 text-center space-y-4">
          <p className="text-slate-600 text-sm">
            {badge.story_text || badge.description || "Congratulations on reaching this checkpoint!"}
          </p>

          <button
            onClick={onClose}
            className="gold-btn w-full rounded-2xl py-4 font-extrabold uppercase tracking-widest text-navy shadow-md hover:shadow-lg transition cursor-pointer"
          >
            Awesome!
          </button>
        </div>

      </div>
    </div>
  );
}