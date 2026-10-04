"use client";

import { useSyncExternalStore } from "react";

/**
 * 以 localStorage 持久化的小型外部 store。
 * 伺服器端與水合期間 hook 回傳 null，避免伺服器與瀏覽器內容不一致。
 */
export function createLocalStore<T>(key: string, init: () => T, isValid: (v: unknown) => v is T) {
  let state: T | null = null;
  const listeners = new Set<() => void>();

  const load = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      // 資料損毀或無法存取時改用預設值
    }
    return init();
  };

  const emit = () => listeners.forEach((l) => l());

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        state = load();
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const get = (): T => (state ??= load());

  const set = (fn: (s: T) => T) => {
    state = fn(get());
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 無痕模式或空間不足時僅保留在記憶體
    }
    emit();
  };

  const useStore = (): T | null => useSyncExternalStore(subscribe, get, () => null);

  return { useStore, get, set };
}
