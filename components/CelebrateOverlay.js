"use client";

import { X, Sparkles } from "lucide-react";

export default function CelebrateOverlay({ open, badge, onClose }) {
  if (!open || !badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/40 text-white backdrop-blur-md hover:bg-slate-900/60 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 关卡照片展示区 */}
        {badge.photo_url ? (
          <div className="relative h-64 w-full bg-slate-100">
            <img
              src={badge.photo_url}
              alt={badge.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#29327c]">
                <Sparkles className="h-3 w-3" /> Station Unlocked
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold uppercase drop-shadow-sm">
                {badge.name}
              </h2>
            </div>
          </div>
        ) : (
          <div className="bg-[#29327c] px-6 py-8 text-white">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#29327c]">
              <Sparkles className="h-3 w-3" /> Station Unlocked
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">
              {badge.name}
            </h2>
          </div>
        )}

        {/* 关卡文字与描述内容 */}
        <div className="p-6">
          {badge.description && (
            <p className="font-semibold text-slate-800 text-lg">
              {badge.description}
            </p>
          )}

          {badge.story_text ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed border border-slate-100">
              {badge.story_text}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Congratulations on reaching this checkpoint!
            </p>
          )}

          <button
            onClick={onClose}
            className="gold-btn mt-6 w-full rounded-2xl py-4 font-extrabold uppercase tracking-widest text-[#29327c] cursor-pointer"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}