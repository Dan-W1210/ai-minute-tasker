"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

type TabKey = "summary" | "tasks";

/**
 * 分析結果を「要約タブ」「タスク一覧タブ」で表示するダッシュボード。
 */
export function ResultTabs({ result }: { result: AnalysisResult }) {
  const [tab, setTab] = useState<TabKey>("summary");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* タブヘッダー */}
      <div className="flex border-b border-slate-200">
        <TabButton active={tab === "summary"} onClick={() => setTab("summary")}>
          要約
        </TabButton>
        <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")}>
          タスク一覧
          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
            {result.actions.length}
          </span>
        </TabButton>
      </div>

      <div className="p-6">
        {tab === "summary" ? (
          <SummaryView result={result} />
        ) : (
          <TasksView result={result} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-brand-600 text-brand-700"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          会議の要約
        </h3>
        <ul className="space-y-2">
          {result.summary.map((line, i) => (
            <li key={i} className="flex gap-3 text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          決定事項
        </h3>
        {result.decisions.length === 0 ? (
          <p className="text-sm text-slate-400">決定事項はありませんでした。</p>
        ) : (
          <ul className="space-y-2">
            {result.decisions.map((d, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <span className="mt-1 text-emerald-500">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TasksView({ result }: { result: AnalysisResult }) {
  if (result.actions.length === 0) {
    return <p className="text-sm text-slate-400">抽出されたタスクはありませんでした。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-32 px-3 py-3 font-medium">担当者</th>
            <th className="px-3 py-3 font-medium">内容</th>
            <th className="w-36 px-3 py-3 font-medium">期限</th>
          </tr>
        </thead>
        <tbody>
          {result.actions.map((a, i) => (
            <tr
              key={i}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td className="px-3 py-3 align-top">
                <span className="inline-block rounded-md bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {a.assignee}
                </span>
              </td>
              <td className="px-3 py-3 align-top text-slate-700">{a.task}</td>
              <td className="px-3 py-3 align-top text-slate-600">{a.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
