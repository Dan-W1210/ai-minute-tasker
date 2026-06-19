"use client";

import { useCallback, useState } from "react";
import { useApiKey } from "@/lib/useApiKey";
import { API_KEY_HEADER } from "@/lib/constants";
import type { AnalysisResult, ApiError } from "@/lib/types";
import { SettingsModal } from "@/components/SettingsModal";
import { ResultTabs } from "@/components/ResultTabs";
import { Toast, type ToastState } from "@/components/Toast";

export default function Home() {
  const { apiKey, setApiKey, hasApiKey, loaded } = useApiKey();
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, kind: ToastState["kind"]) => {
    setToast({ message, kind });
  }, []);

  const handleAnalyze = useCallback(async () => {
    // バリデーション: APIキー未入力
    if (!hasApiKey) {
      showToast("設定からAPIキーを入力してください", "error");
      setSettingsOpen(true);
      return;
    }
    // バリデーション: テキスト未入力
    if (transcript.trim() === "") {
      showToast("文字起こしテキストを貼り付けてください", "error");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // localStorage のキーをヘッダーでサーバーへ渡す
          [API_KEY_HEADER]: apiKey,
        },
        body: JSON.stringify({ transcript }),
      });

      // 非JSON応答でも落ちないよう text → JSON.parse を try/catch で保護
      const raw = await res.text();
      const parsed = safeJsonParse(raw);

      if (!res.ok) {
        const message =
          (parsed as ApiError | null)?.error ?? "分析に失敗しました";
        // 401（キー無効）の場合は設定を開いて再入力を促す
        if (res.status === 401) setSettingsOpen(true);
        showToast(message, "error");
        return;
      }

      if (!parsed) {
        showToast("AIの応答を解釈できませんでした。再試行してください。", "error");
        return;
      }

      // 配列欠損などの不正形状でも UI が壊れないよう正規化
      setResult(normalizeResult(parsed));
      showToast("分析が完了しました", "success");
    } catch {
      showToast("ネットワークエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  }, [apiKey, hasApiKey, transcript, showToast]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* ヘッダー */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            AI議事録・タスク自動抽出
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            会議の文字起こしを貼り付けて、要約・決定事項・タスクを自動生成します。
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <GearIcon />
          設定
          {loaded && (
            <span
              className={`ml-1 h-2 w-2 rounded-full ${
                hasApiKey ? "bg-emerald-500" : "bg-red-400"
              }`}
              title={hasApiKey ? "APIキー設定済み" : "APIキー未設定"}
            />
          )}
        </button>
      </header>

      {/* 入力エリア */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="transcript"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          会議の文字起こし
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="ここに会議の文字起こしテキストを貼り付けてください..."
          rows={12}
          className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {transcript.length.toLocaleString()} 文字
          </span>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner />
                分析中...
              </>
            ) : (
              "AIで分析"
            )}
          </button>
        </div>
      </section>

      {/* 結果 */}
      <section className="mt-8">
        {result ? (
          <ResultTabs result={result} />
        ) : (
          !loading && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
              分析結果はここに表示されます。
            </div>
          )
        )}
      </section>

      <SettingsModal
        open={settingsOpen}
        initialKey={apiKey}
        onSave={(key) => {
          setApiKey(key);
          showToast(key ? "APIキーを保存しました" : "APIキーを削除しました", "info");
        }}
        onClose={() => setSettingsOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}

/** 失敗しても例外を投げず null を返す JSON パーサ */
function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** AIの応答を AnalysisResult 形に正規化（欠損・型不一致でも安全な既定値に） */
function normalizeResult(data: unknown): AnalysisResult {
  const obj = (data ?? {}) as Record<string, unknown>;
  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const actions = Array.isArray(obj.actions)
    ? obj.actions
        .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
        .map((a) => ({
          task: typeof a.task === "string" ? a.task : "",
          assignee: typeof a.assignee === "string" ? a.assignee : "未定",
          due: typeof a.due === "string" ? a.due : "未定",
        }))
    : [];

  return {
    summary: toStringArray(obj.summary),
    decisions: toStringArray(obj.decisions),
    actions,
  };
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
