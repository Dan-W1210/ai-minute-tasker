import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI議事録・タスク自動抽出",
  description: "会議の文字起こしから議事録とタスクをAIで自動抽出するダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
