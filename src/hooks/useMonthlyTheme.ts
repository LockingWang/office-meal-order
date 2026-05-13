import { useCallback, useEffect, useState } from "react";
import { getThemeByMonth, type MonthlyTheme } from "../themes";

const STORAGE_KEY = "omo:themeOverride";

function readThemeFromUrl(): number | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get("theme");
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 12) return null;
  return Math.round(n);
}

function readThemeFromStorage(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === "auto") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 12) return null;
    return Math.round(n);
  } catch {
    return null;
  }
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

function resolveMonth(): { month: number; manual: number | null } {
  const fromUrl = readThemeFromUrl();
  if (fromUrl) return { month: fromUrl, manual: fromUrl };
  const stored = readThemeFromStorage();
  if (stored) return { month: stored, manual: stored };
  return { month: getCurrentMonth(), manual: null };
}

export type MonthlyThemeControl = {
  theme: MonthlyTheme;
  manualMonth: number | null;
  setManualMonth: (month: number | null) => void;
  isAuto: boolean;
};

export function useMonthlyTheme(): MonthlyThemeControl {
  const [{ month, manual }, setState] = useState<{
    month: number;
    manual: number | null;
  }>(() => resolveMonth());

  const setManualMonth = useCallback((next: number | null) => {
    try {
      if (next == null) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
    } catch {
      /* ignore quota/private mode errors */
    }
    setState({
      month: next ?? getCurrentMonth(),
      manual: next,
    });
  }, []);

  useEffect(() => {
    if (manual !== null) return;
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 5);
    const ms = Math.max(60_000, next.getTime() - now.getTime());
    const t = window.setTimeout(() => {
      setState((prev) =>
        prev.manual === null ? { month: getCurrentMonth(), manual: null } : prev
      );
    }, ms);
    return () => window.clearTimeout(t);
  }, [manual, month]);

  useEffect(() => {
    function onPop() {
      setState(resolveMonth());
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return {
    theme: getThemeByMonth(month),
    manualMonth: manual,
    setManualMonth,
    isAuto: manual === null,
  };
}
