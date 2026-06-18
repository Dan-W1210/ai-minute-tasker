"use client";

import { useEffect } from "react";

export type ToastKind = "error" | "success" | "info";

export interface ToastState {
  message: string;
  kind: ToastKind;
}

const STYLES: Record<ToastKind, string> = {
  error: "bg-red-600",
  success: "bg-emerald-600",
  info: "bg-slate-800",
};

/**
 * 画面右下に表示する簡易トースト。一定時間後に自動で消える。
 */
export function Toast({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        role="alert"
        className={`${STYLES[toast.kind]} flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg`}
      >
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="text-white/70 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
