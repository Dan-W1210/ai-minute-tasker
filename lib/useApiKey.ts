"use client";

import { useCallback, useEffect, useState } from "react";
import { API_KEY_STORAGE_KEY } from "@/lib/constants";

/**
 * Anthropic APIキーを localStorage で管理するフック。
 * ページをリロードしても保持される。SSR では空文字を返し、
 * マウント後に localStorage から読み込む。
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) setApiKeyState(stored);
    } catch {
      // localStorage が使えない環境では無視
    }
    setLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setApiKeyState(trimmed);
    try {
      if (trimmed) {
        window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch {
      // 保存失敗は無視（プライベートモード等）
    }
  }, []);

  const clearApiKey = useCallback(() => setApiKey(""), [setApiKey]);

  return { apiKey, setApiKey, clearApiKey, hasApiKey: apiKey.length > 0, loaded };
}
