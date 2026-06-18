"use client";

import { useEffect, useState } from "react";

/**
 * APIキー入力モーダル。
 * 入力されたキーは親（page.tsx）経由で localStorage に保存される。
 */
export function SettingsModal({
  open,
  initialKey,
  onSave,
  onClose,
}: {
  open: boolean;
  initialKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialKey);
  const [reveal, setReveal] = useState(false);

  // モーダルを開くたびに現在のキーで初期化
  useEffect(() => {
    if (open) {
      setValue(initialKey);
      setReveal(false);
    }
  }, [open, initialKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">設定</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Anthropic API キー
        </label>
        <p className="mb-3 text-xs text-slate-500">
          キーはこのブラウザの localStorage にのみ保存されます。サーバーには保存されず、
          分析リクエストの送信時のみリクエストヘッダーで送られます。
        </p>

        <div className="relative">
          <input
            type={reveal ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
          >
            {reveal ? "隠す" : "表示"}
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onSave(value);
              onClose();
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
