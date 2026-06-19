"use client";

// レンダリング中の予期せぬ例外を捕捉し、真っ白画面を防ぐエラーバウンダリ
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-slate-900">
        エラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        予期しない問題が発生しました。お手数ですが、もう一度お試しください。
      </p>
      {error.message && (
        <pre className="mt-4 w-full overflow-x-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-600">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        再試行
      </button>
    </main>
  );
}
